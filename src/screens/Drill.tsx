import { useEffect, useRef, useState } from 'preact/hooks';
import type { DrillItem, WhyId, ClozeItem } from '../lib/schema';
import { WHY_IDS } from '../lib/why';
import { checkAnswer, type CheckResult } from '../lib/answer';
import { WHY_LABELS, TYPE_LABELS, gpById, unitLabel, bookRefFor } from '../lib/content';
import type { Attempt } from '../lib/db';
import { useApp, navigate } from '../state';
import { BookRef, Speak } from '../components/common';
import { AccentBar } from '../components/AccentBar';

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

export function Drill({ spec }: { spec: { title: string; items: DrillItem[] } }) {
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
  const requeued = useRef(new Map<string, number>());
  const itemStart = useRef(Date.now());
  const activeInput = useRef<HTMLInputElement | null>(null);

  const item = queue[pos];

  useEffect(() => {
    itemStart.current = Date.now();
    setInputs({});
    setResults([]);
    setReasons({});
    setOutcome(null);
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

  if (phase === 'done' || !item) return <Summary history={history} title={spec.title} />;

  const opts = { allowSubjectPronoun: item.type === 'conjugate' };

  function evaluate(given: Record<number, string>): GapResult[] {
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
    const list: Attempt[] = r.map((g, i) => {
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
        <Cloze item={item} inputs={inputs} setInputs={setInputs} results={phase === 'answer' ? null : results} activeInput={activeInput} />
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
          {item.type !== 'cloze' && (
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
              placeholder="Escribe aquí…"
              value={inputs[0] ?? ''}
              onFocus={(e) => (activeInput.current = e.currentTarget)}
              onInput={(e) => setInputs({ 0: e.currentTarget.value })}
            />
          )}
          <AccentBar
            target={activeInput}
            onInsert={(el, value) => {
              const n = Number(el.dataset.n ?? 0);
              setInputs((prev) => ({ ...prev, [n]: value }));
            }}
          />
          <div class="sticky-actions">
            <button type="button" onClick={() => check()} class="grow">
              No lo sé
            </button>
            <button type="submit" class="btn-primary grow">
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

function Prompt({ item, value }: { item: Exclude<DrillItem, ClozeItem>; value: string }) {
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
  results,
  activeInput
}: {
  item: ClozeItem;
  inputs: Record<number, string>;
  setInputs: (f: (p: Record<number, string>) => Record<number, string>) => void;
  results: GapResult[] | null;
  activeInput: { current: HTMLInputElement | null };
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
                onFocus={(e) => (activeInput.current = e.currentTarget)}
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
  const g = results[0];
  const ok = g.res.correct;
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
    default:
      return i.prompt;
  }
}

function Summary({ history, title }: { history: Outcome[]; title: string }) {
  const app = useApp();
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
