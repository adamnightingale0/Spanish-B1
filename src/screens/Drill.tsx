import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { DrillItem, WhyId, ClozeItem } from '../lib/schema';
import { tagError } from '../lib/errors';
import { shuffle, type SessionSpec } from '../lib/session';
import { VocabReview } from './Vocab';
import { WHY_IDS } from '../lib/why';
import { checkAnswer, type CheckResult } from '../lib/answer';
import { WHY_LABELS, TYPE_LABELS, gpById, unitLabel, bookRefFor } from '../lib/content';
import type { Attempt } from '../lib/db';
import { useApp, navigate } from '../state';
import { BookRef, Speak } from '../components/common';

type Simple = Exclude<DrillItem, { type: 'cloze' | 'error' | 'order' | 'match' }>;

interface GapResult {
  n: number;
  given: string;
  res: CheckResult;
  answers: string[];
  why?: WhyId;
  reason?: WhyId;
  feedback: string;
}

interface Outcome {
  item: DrillItem;
  results: GapResult[];
  correct: boolean;
  attemptKeys: string[];
  overridden: boolean;
}

type Phase = 'answer' | 'why' | 'feedback' | 'done';

const MAX_REQUEUE = 2;
const REQUEUE_GAP = 4;

export function Drill({ spec }: { spec: SessionSpec }) {
  const app = useApp();
  const { settings } = app;
  const [queue, setQueue] = useState<DrillItem[]>(spec.items);
  const [pos, setPos] = useState(0);
  const [phase, setPhase] = useState<Phase>(spec.items.length ? 'answer' : 'done');
  const [inputs, setInputs] = useState<Record<number, string>>({});
  const [results, setResults] = useState<GapResult[]>([]);
  const [reasons, setReasons] = useState<Record<number, WhyId>>({});
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [history, setHistory] = useState<Outcome[]>([]);
  const [vocabDone, setVocabDone] = useState(!spec.vocabCount);
  const [picked, setPicked] = useState<number | null>(null);
  const [orderSel, setOrderSel] = useState<number[]>([]);
  const [matchSel, setMatchSel] = useState<Record<number, string>>({});
  const requeued = useRef(new Map<string, number>());
  const itemStart = useRef(Date.now());

  const item = queue[pos];

  useEffect(() => {
    itemStart.current = Date.now();
    setInputs({});
    setResults([]);
    setReasons({});
    setOutcome(null);
    setPicked(null);
    setOrderSel([]);
    setMatchSel({});
    const first = document.querySelector<HTMLInputElement>('.answer-input, .cloze-text input');
    first?.focus({ preventScroll: true });
  }, [pos, queue.length === 0]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && phase === 'feedback') {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Shuffled tokens / endings stay fixed for the current item.
  const orderTokens = useMemo(() => (item?.type === 'order' ? shuffleUntilDifferent(lowerFirst(item.answers[0]).split(' ')) : []), [item?.id, pos]);
  const matchRights = useMemo(() => (item?.type === 'match' ? shuffle(item.pairs.map((p) => p.right)) : []), [item?.id, pos]);

  if (!vocabDone) return <VocabReview limit={spec.vocabCount!} title={spec.title} onDone={() => setVocabDone(true)} />;
  if (phase === 'done' || !item) return <Summary history={history} spec={spec} />;

  const opts = { allowSubjectPronoun: item.type === 'conjugate' };

  function evaluate(given: Record<number, string>): GapResult[] {
    if (item.type === 'error') {
      const tokens = item.prompt.split(' ');
      const tapped = picked ?? -1;
      const correction = given[0] ?? '';
      const res: CheckResult =
        tapped === item.errorIndex
          ? checkAnswer(correction, item.answers, settings.accent)
          : { correct: false, accentOnly: false, expected: item.answers[0] };
      return [{ n: 0, given: tapped >= 0 ? `${tokens[tapped]} → ${correction}` : correction, res, answers: item.answers, feedback: item.feedback }];
    }
    if (item.type === 'order') {
      const sentence = orderSel.map((i) => orderTokens[i]).join(' ');
      return [{ n: 0, given: sentence, res: checkAnswer(sentence, item.answers, settings.accent), answers: item.answers, feedback: item.feedback }];
    }
    if (item.type === 'match') {
      return item.pairs.map((p, i) => ({
        n: i,
        given: matchSel[i] ?? '',
        res: { correct: matchSel[i] === p.right, accentOnly: false, expected: p.right },
        answers: [p.right],
        feedback: item.feedback
      }));
    }
    if (item.type === 'cloze') {
      return item.gaps.map((g) => ({
        n: g.n,
        given: given[g.n] ?? '',
        res: checkAnswer(given[g.n] ?? '', g.answers, settings.accent),
        answers: g.answers,
        why: g.why,
        feedback: g.feedback
      }));
    }
    return [
      {
        n: 0,
        given: given[0] ?? '',
        res: checkAnswer(given[0] ?? '', item.answers, settings.accent, opts),
        answers: item.answers,
        why: item.why,
        feedback: item.feedback
      }
    ];
  }

  function check(given = inputs) {
    const r = evaluate(given);
    setResults(r);
    if (r.some((g) => g.why)) setPhase('why');
    else finalize(r, {});
  }

  function finalize(r: GapResult[], rs: Record<number, WhyId>) {
    const now = Date.now();
    const ms = Math.round((now - itemStart.current) / Math.max(1, r.length));
    // A match exercise is logged as one attempt; cloze gaps are logged one by one.
    const logged = item.type === 'match' ? [{ ...r[0], res: { ...r[0].res, correct: r.every((g) => g.res.correct) } }] : r;
    const list: Attempt[] = logged.map((g, i) => {
      const itemId = item.type === 'cloze' ? `${item.id}#${g.n}` : item.id;
      const a: Attempt = {
        key: `${now + i}-${itemId}`,
        itemId,
        grammarPoint: item.grammarPoint,
        subPoint: item.subPoint,
        unit: item.unit,
        ts: now + i,
        correct: g.res.correct,
        given: g.given,
        ms
      };
      if (g.res.accentOnly) a.accentOnly = true;
      if (g.why) a.reasonCorrect = rs[g.n] === g.why;
      if (!g.res.correct) {
        const given = item.type === 'error' ? (inputs[0] ?? '') : g.given;
        a.errorTag =
          item.type === 'error' && picked !== item.errorIndex
            ? 'no encontró el error'
            : item.type === 'order'
              ? 'orden de palabras'
              : tagError(item, given, g.answers[0], g.res.accentOnly);
      }
      return a;
    });
    app.addAttempts(list);
    const withReasons = r.map((g) => ({ ...g, reason: rs[g.n] }));
    setResults(withReasons);
    const o: Outcome = {
      item,
      results: withReasons,
      correct: withReasons.every((g) => g.res.correct),
      attemptKeys: list.map((a) => a.key),
      overridden: false
    };
    setOutcome(o);
    setPhase('feedback');
  }

  function override() {
    if (!outcome || outcome.overridden) return;
    const keys = new Set(outcome.attemptKeys);
    for (const a of app.attempts) {
      if (keys.has(a.key) && !a.correct) app.replaceAttempt({ ...a, correct: true, override: true });
    }
    const fixed = results.map((g) => ({ ...g, res: { ...g.res, correct: true } }));
    setResults(fixed);
    setOutcome({ ...outcome, results: fixed, correct: true, overridden: true });
  }

  function next() {
    if (!outcome) return;
    const h = [...history, outcome];
    setHistory(h);
    let q = queue;
    const count = requeued.current.get(item.id) ?? 0;
    const limit = item.type === 'cloze' ? 1 : MAX_REQUEUE;
    if (!outcome.correct && count < limit) {
      requeued.current.set(item.id, count + 1);
      q = [...queue];
      q.splice(Math.min(pos + REQUEUE_GAP, q.length), 0, item);
      setQueue(q);
    }
    if (pos + 1 >= q.length) setPhase('done');
    else {
      setPos(pos + 1);
      setPhase('answer');
    }
  }

  function exit() {
    if (history.length && !confirm('¿Salir de la sesión? Tus respuestas ya están guardadas.')) return;
    navigate(app.sessionReturn);
  }

  const gp = gpById.get(item.grammarPoint);
  const book = bookRefFor(item);

  return (
    <div class="screen no-tabs">
      <div class="drill-top">
        <button class="btn-ghost" onClick={exit} aria-label="Salir">✕</button>
        <div class="progress" aria-hidden="true">
          <i style={{ width: `${(pos / queue.length) * 100}%` }} />
        </div>
        <span class="small muted">
          {pos + 1}/{queue.length}
        </span>
      </div>
      <div class="row wrap">
        <span class="pill">{unitLabel(item.unit)}</span>
        <span class="pill">{gp?.title ?? item.grammarPoint}</span>
        <span class="pill">{TYPE_LABELS[item.type]}</span>
        {requeued.current.get(item.id) && phase === 'answer' ? <span class="pill accent">Otra vez</span> : null}
      </div>

      {item.type === 'cloze' ? (
        <Cloze item={item} inputs={inputs} setInputs={setInputs} results={phase === 'answer' ? null : results} />
      ) : item.type === 'error' ? (
        <ErrorTask item={item} picked={picked} setPicked={setPicked} locked={phase !== 'answer'} />
      ) : item.type === 'order' ? (
        <OrderTask item={item} tokens={orderTokens} sel={orderSel} setSel={setOrderSel} locked={phase !== 'answer'} />
      ) : item.type === 'match' ? (
        <MatchTask item={item} rights={matchRights} sel={matchSel} setSel={setMatchSel} locked={phase !== 'answer'} />
      ) : (
        <Prompt item={item} value={inputs[0] ?? ''} />
      )}

      {phase === 'answer' && item.type === 'choice' && (
        <div class="options">
          {item.options.map((o) => (
            <button
              onClick={() => {
                const g = { 0: o };
                setInputs(g);
                check(g);
              }}
            >
              {o}
            </button>
          ))}
        </div>
      )}

      {phase !== 'answer' && item.type === 'choice' && (
        <div class="options">
          {item.options.map((o) => (
            <button disabled class={o === item.answers[0] ? 'right' : o === inputs[0] ? 'wrong' : ''}>
              {o}
            </button>
          ))}
        </div>
      )}

      {phase === 'answer' && item.type !== 'choice' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            check();
          }}
        >
          {item.type !== 'cloze' && item.type !== 'order' && item.type !== 'match' && (item.type !== 'error' || picked !== null) && (
            <input
              class="answer-input"
              type="text"
              lang="es"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck={false}
              enterkeyhint="done"
              aria-label="Tu respuesta"
              placeholder={item.type === 'error' ? 'Escribe la corrección…' : 'Escribe aquí…'}
              value={inputs[0] ?? ''}
              onInput={(e) => setInputs({ 0: e.currentTarget.value })}
            />
          )}
          <div class="sticky-actions">
            <button type="button" onClick={() => check()} class="grow">
              No lo sé
            </button>
            <button
              type="submit"
              class="btn-primary grow"
              disabled={
                (item.type === 'error' && picked === null) ||
                (item.type === 'order' && orderSel.length < orderTokens.length) ||
                (item.type === 'match' && Object.keys(matchSel).length < item.pairs.length)
              }
            >
              Comprobar
            </button>
          </div>
        </form>
      )}

      {phase === 'why' && (
        <WhyStep
          results={results}
          isCloze={item.type === 'cloze'}
          reasons={reasons}
          setReasons={setReasons}
          onDone={(rs) => finalize(results, rs)}
        />
      )}

      {phase === 'feedback' && outcome && (
        <>
          <Feedback item={item} results={results} />
          <BookRef {...(book ?? {})} />
          <div class="sticky-actions">
            {!outcome.correct && !outcome.overridden && (
              <button onClick={override} class="grow" title="Marcar como correcto (errata)">
                Era una errata
              </button>
            )}
            <button class="btn-primary grow" onClick={next}>
              Siguiente →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Prompt({ item, value }: { item: Simple; value: string }) {
  if (item.type === 'conjugate') {
    return (
      <div class="prompt">
        <div class="instruction">Conjuga el verbo:</div>
        <b>{item.verb}</b> · {item.person} · <span class="muted">{item.tense}</span>
      </div>
    );
  }
  if (item.type === 'transform') {
    return (
      <div class="prompt">
        <div class="instruction">{item.instruction}</div>
        {item.prompt} <Speak text={item.prompt} />
      </div>
    );
  }
  const [a, b] = item.prompt.split('___');
  return (
    <div class="prompt">
      {item.type === 'choice' && <div class="instruction">Elige la opción correcta:</div>}
      {item.type === 'gap' && <div class="instruction">Completa con la forma correcta:</div>}
      {a}
      {b !== undefined && (
        <>
          <span class="gap">{value || ' '}</span>
          {b}
        </>
      )}
    </div>
  );
}

function Cloze({
  item,
  inputs,
  setInputs,
  results
}: {
  item: ClozeItem;
  inputs: Record<number, string>;
  setInputs: (f: (p: Record<number, string>) => Record<number, string>) => void;
  results: GapResult[] | null;
}) {
  const parts = item.text.split(/\{\{(\d+)\}\}/);
  return (
    <div>
      <h2 style={{ marginTop: 12 }}>{item.title}</h2>
      <p class="instruction">Completa la historia con el tiempo pasado correcto.</p>
      <div class="cloze-text">
        {parts.map((p, i) => {
          if (i % 2 === 0) return <span>{p}</span>;
          const n = Number(p);
          const r = results?.find((g) => g.n === n);
          return (
            <span>
              <span class="n">{n}</span>
              <input
                type="text"
                lang="es"
                data-n={n}
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck={false}
                enterkeyhint="next"
                aria-label={`Hueco ${n}`}
                class={r ? (r.res.correct ? 'right' : 'wrong') : ''}
                disabled={!!results}
                value={inputs[n] ?? ''}
                  onInput={(e) => {
                  const v = e.currentTarget.value;
                  setInputs((prev) => ({ ...prev, [n]: v }));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const all = [...document.querySelectorAll<HTMLInputElement>('.cloze-text input')];
                    const idx = all.indexOf(e.currentTarget);
                    if (idx < all.length - 1) all[idx + 1].focus();
                    else e.currentTarget.form?.requestSubmit();
                  }
                }}
              />
            </span>
          );
        })}
      </div>
    </div>
  );
}

function WhyChips({ value, onPick, correct, compact }: { value?: WhyId; onPick: (w: WhyId) => void; correct?: WhyId; compact?: boolean }) {
  return (
    <div class={`why-chips ${compact ? 'compact' : ''}`}>
      {WHY_IDS.map((w) => {
        let cls = value === w ? 'sel' : '';
        if (correct && value) cls = w === correct ? 'right' : value === w ? 'wrong' : '';
        return (
          <button type="button" class={cls} disabled={!!correct} onClick={() => onPick(w)}>
            {WHY_LABELS[w].es}
            {!compact && <small>{WHY_LABELS[w].en}</small>}
          </button>
        );
      })}
    </div>
  );
}

function WhyStep({
  results,
  isCloze,
  reasons,
  setReasons,
  onDone
}: {
  results: GapResult[];
  isCloze: boolean;
  reasons: Record<number, WhyId>;
  setReasons: (r: Record<number, WhyId>) => void;
  onDone: (r: Record<number, WhyId>) => void;
}) {
  if (!isCloze) {
    const g = results[0];
    return (
      <div class={`feedback ${g.res.correct ? 'ok' : 'bad'}`}>
        <div class="verdict">{g.res.correct ? '✓ Forma correcta' : `✗ Es «${g.answers[0]}»`}</div>
        <p>
          <b>¿Por qué?</b> Elige la razón del tiempo verbal:
        </p>
        <WhyChips onPick={(w) => onDone({ 0: w })} />
      </div>
    );
  }
  const need = results.filter((g) => g.why);
  const ready = need.every((g) => reasons[g.n]);
  return (
    <div>
      <h3>¿Por qué? Elige la razón de cada hueco</h3>
      {need.map((g) => (
        <div class="gap-row">
          <div class="row spread">
            <b>
              {g.n}. {g.res.correct ? g.given : g.answers[0]}
            </b>
            <span class={g.res.correct ? '' : 'warn-line'}>{g.res.correct ? '✓' : `✗ tú: ${g.given || '—'}`}</span>
          </div>
          <WhyChips compact value={reasons[g.n]} onPick={(w) => setReasons({ ...reasons, [g.n]: w })} />
        </div>
      ))}
      <div class="sticky-actions">
        <button class="btn-primary grow" disabled={!ready} onClick={() => onDone(reasons)}>
          Ver corrección
        </button>
      </div>
    </div>
  );
}

function Feedback({ item, results }: { item: DrillItem; results: GapResult[] }) {
  if (item.type === 'cloze') {
    const right = results.filter((g) => g.res.correct).length;
    const reasonRight = results.filter((g) => g.why && g.reason === g.why).length;
    const reasonTotal = results.filter((g) => g.why).length;
    return (
      <div>
        <div class={`feedback ${right === results.length ? 'ok' : 'bad'}`}>
          <div class="verdict">
            Formas: {right}/{results.length}
            {reasonTotal ? ` · Razones: ${reasonRight}/${reasonTotal}` : ''}
          </div>
          <p class="rule">{item.feedback}</p>
        </div>
        {results.map((g) => (
          <div class="gap-row">
            <div class="row spread">
              <b>
                {g.n}. {g.answers.join(' / ')}
              </b>
              <span>{g.res.correct ? (g.res.accentOnly ? '✓ ojo tilde' : '✓') : `✗ ${g.given || '—'}`}</span>
            </div>
            {g.why && (
              <p class="small">
                Razón: {WHY_LABELS[g.why].es}{' '}
                {g.reason && (g.reason === g.why ? '✓' : <span class="warn-line">(elegiste: {WHY_LABELS[g.reason].es})</span>)}
              </p>
            )}
            <p class="small muted">{g.feedback}</p>
          </div>
        ))}
      </div>
    );
  }
  if (item.type === 'match') {
    const right = results.filter((g) => g.res.correct).length;
    return (
      <div class={`feedback ${right === results.length ? 'ok' : 'bad'}`}>
        <div class="verdict">
          {right}/{results.length} correctas
        </div>
        {item.pairs.map((p, i) => (
          <p class="small">
            {results[i].res.correct ? '✓' : '✗'} {p.left} <b>{p.right}</b>
          </p>
        ))}
        <p class="rule">{item.feedback}</p>
      </div>
    );
  }
  const g = results[0];
  const ok = g.res.correct;
  if (item.type === 'error' || item.type === 'order') {
    const tokens = item.type === 'error' ? item.prompt.split(' ') : [];
    return (
      <div class={`feedback ${ok ? 'ok' : 'bad'}`}>
        <div class="verdict">{ok ? '✓ ¡Correcto!' : '✗ No es correcto'}</div>
        {ok && g.res.accentOnly && <p class="warn-line">Ojo con la tilde: {g.res.expected}</p>}
        {item.type === 'error' ? (
          <p>
            Error: <s>{tokens[item.errorIndex]}</s> → <b>{item.answers[0]}</b>
            {!ok && g.given && <span class="muted"> (tú: {g.given})</span>}
          </p>
        ) : (
          <p>
            <b>{item.answers[0]}</b> <Speak text={item.answers[0]} />
            {!ok && <span class="muted"> (tú: {g.given})</span>}
          </p>
        )}
        {item.type === 'order' && item.answers.length > 1 && <p class="small muted">También vale: {item.answers.slice(1).join(' · ')}</p>}
        <p class="rule">{item.feedback}</p>
        {item.contrast && <p class="contrast">Compara: {item.contrast}</p>}
      </div>
    );
  }
  return (
    <div class={`feedback ${ok ? 'ok' : 'bad'}`}>
      <div class="verdict">{ok ? '✓ ¡Correcto!' : '✗ No es correcto'}</div>
      {ok && g.res.accentOnly && <p class="warn-line">Ojo con la tilde: {g.res.expected}</p>}
      {!ok && (
        <p>
          Respuesta: <b>{g.answers[0]}</b>
          {g.given && <span class="muted"> (tú: {g.given})</span>}
          {g.res.accentOnly && <span class="warn-line"> · falta la tilde</span>}
        </p>
      )}
      {g.answers.length > 1 && <p class="small muted">También vale: {g.answers.slice(1).join(' · ')}</p>}
      {g.why && (
        <p class="small">
          Razón: <b>{WHY_LABELS[g.why].es}</b>{' '}
          {g.reason && (g.reason === g.why ? '✓' : <span class="warn-line">(elegiste: {WHY_LABELS[g.reason].es})</span>)}
        </p>
      )}
      <p class="rule">{item.feedback}</p>
      {item.contrast && (
        <p class="contrast">
          Compara: {item.contrast} <Speak text={item.contrast} />
        </p>
      )}
    </div>
  );
}

function summaryText(i: DrillItem): string {
  switch (i.type) {
    case 'conjugate':
      return `${i.verb} · ${i.person} · ${i.tense}`;
    case 'cloze':
      return i.title;
    case 'order':
    case 'match':
      return i.instruction;
    default:
      return i.prompt;
  }
}

function Summary({ history, spec }: { history: Outcome[]; spec: SessionSpec }) {
  const app = useApp();
  const title = spec.title;
  useEffect(() => {
    if (spec.kind === 'placement' && history.length) app.updateSettings({ placementDone: Date.now() });
  }, []);
  const firstTry = new Map<string, Outcome>();
  for (const o of history) if (!firstTry.has(o.item.id)) firstTry.set(o.item.id, o);
  const outs = [...firstTry.values()];
  const right = outs.filter((o) => o.correct).length;
  const reasons = outs.flatMap((o) => o.results.filter((g) => g.why));
  const reasonsRight = reasons.filter((g) => g.reason === g.why).length;
  const mistakes = outs.filter((o) => !o.correct);
  return (
    <div class="screen no-tabs">
      <h1>¡Sesión terminada!</h1>
      <p class="muted">{title}</p>
      <div class="row" style={{ margin: '12px 0' }}>
        <div class="stat">
          <b>
            {right}/{outs.length}
          </b>
          <span>a la primera</span>
        </div>
        {reasons.length > 0 && (
          <div class="stat">
            <b>
              {reasonsRight}/{reasons.length}
            </b>
            <span>razones (¿Por qué?)</span>
          </div>
        )}
      </div>
      {mistakes.length > 0 && (
        <>
          <h2>Para repasar</h2>
          {mistakes.map((o) => (
            <div class="card small">
              <div>{summaryText(o.item)}</div>
              <div>
                →{' '}
                <b>
                  {o.item.type === 'cloze'
                    ? o.results.filter((g) => !g.res.correct).map((g) => `${g.n}: ${g.answers[0]}`).join(' · ')
                    : o.results[0].answers[0]}
                </b>
              </div>
            </div>
          ))}
        </>
      )}
      {spec.kind === 'placement' && (
        <div class="card highlight">
          <b>Parte 2 (opcional): lectura y audición</b>
          <p class="small muted">Una tarea corta de cada una para estimar también tus destrezas del examen.</p>
          <div class="row">
            <button class="grow" onClick={() => navigate('task/read-insert-01')}>
              Lectura (~10 min)
            </button>
            <button class="grow" onClick={() => navigate('task/listen-reply-01')}>
              Audición (~6 min)
            </button>
          </div>
        </div>
      )}
      <div class="stack" style={{ marginTop: 16 }}>
        {mistakes.length > 0 && (
          <button class="btn-primary btn-block" onClick={() => app.startSession({ title: 'Repaso de fallos', items: mistakes.map((m) => m.item) }, app.sessionReturn)}>
            Repetir los fallos ({mistakes.length})
          </button>
        )}
        <button class="btn-block" onClick={() => navigate(app.sessionReturn)}>
          Volver
        </button>
      </div>
    </div>
  );
}

/** Lower-case the first word so its capital letter doesn't give the order away (names keep theirs). */
const KEEP_CAPS = /^(España|Sevilla|Madrid|Triana|Cádiz|Granada|Lisboa|Pablo|Marta|Ana|Luis)$/;
function lowerFirst(sentence: string): string {
  const [first, ...rest] = sentence.split(' ');
  return [KEEP_CAPS.test(first) ? first : first.charAt(0).toLowerCase() + first.slice(1), ...rest].join(' ');
}

function shuffleUntilDifferent(tokens: string[]): string[] {
  if (tokens.length < 2) return tokens;
  for (let i = 0; i < 10; i++) {
    const t = shuffle(tokens);
    if (t.join(' ') !== tokens.join(' ')) return t;
  }
  return [...tokens].reverse();
}

function ErrorTask({ item, picked, setPicked, locked }: { item: Extract<DrillItem, { type: 'error' }>; picked: number | null; setPicked: (n: number) => void; locked: boolean }) {
  const tokens = item.prompt.split(' ');
  return (
    <div class="prompt">
      <div class="instruction">Toca la palabra incorrecta y escribe la corrección:</div>
      <div class="token-row">
        {tokens.map((t, i) => {
          let cls = picked === i ? 'sel' : '';
          if (locked) cls = i === item.errorIndex ? 'wrong' : picked === i ? 'sel' : '';
          return (
            <button type="button" class={`token ${cls}`} disabled={locked} onClick={() => setPicked(i)}>
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OrderTask({
  item,
  tokens,
  sel,
  setSel,
  locked
}: {
  item: Extract<DrillItem, { type: 'order' }>;
  tokens: string[];
  sel: number[];
  setSel: (s: number[]) => void;
  locked: boolean;
}) {
  return (
    <div class="prompt">
      <div class="instruction">{item.instruction}</div>
      <div class="order-answer" aria-label="Tu frase">
        {sel.length ? (
          sel.map((i, k) => (
            <button type="button" class="token sel" disabled={locked} onClick={() => setSel(sel.filter((_, j) => j !== k))}>
              {tokens[i]}
            </button>
          ))
        ) : (
          <span class="muted small">Toca las palabras en orden…</span>
        )}
      </div>
      <div class="token-row">
        {tokens.map((t, i) => (
          <button type="button" class="token" disabled={locked || sel.includes(i)} onClick={() => setSel([...sel, i])}>
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

function MatchTask({
  item,
  rights,
  sel,
  setSel,
  locked
}: {
  item: Extract<DrillItem, { type: 'match' }>;
  rights: string[];
  sel: Record<number, string>;
  setSel: (s: Record<number, string>) => void;
  locked: boolean;
}) {
  const [active, setActive] = useState(0);
  const used = new Set(Object.values(sel));
  return (
    <div class="prompt">
      <div class="instruction">{item.instruction}</div>
      {item.pairs.map((p, i) => (
        <div class={`match-row ${active === i && !locked ? 'active' : ''}`} onClick={() => !locked && setActive(i)}>
          <span>{p.left}</span>
          <b class={locked ? (sel[i] === p.right ? 'ok-text' : 'bad-text') : ''}>{sel[i] ?? '…'}</b>
        </div>
      ))}
      {!locked && (
        <div class="options">
          {rights.map((r) => (
            <button
              type="button"
              disabled={used.has(r) && sel[active] !== r}
              class={sel[active] === r ? 'sel' : ''}
              onClick={() => {
                const next = { ...sel };
                for (const k of Object.keys(next)) if (next[Number(k)] === r) delete next[Number(k)];
                next[active] = r;
                setSel(next);
                const empty = item.pairs.findIndex((_, j) => !(j in next));
                if (empty >= 0) setActive(empty);
              }}
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
