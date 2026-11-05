import { useMemo, useRef, useState } from 'preact/hooks';
import { useApp, navigate } from '../state';
import { vocabCards, units } from '../lib/content';
import { buildQueue, directionFor, review, retention, Rating, NEW_PER_DAY } from '../lib/srs';
import { checkAnswer, type CheckResult } from '../lib/answer';
import type { VocabCard } from '../lib/schema';
import type { Grade } from 'ts-fsrs';
import { Speak, pct } from '../components/common';

const GRADES: { g: Grade; label: string; cls: string }[] = [
  { g: Rating.Again, label: 'Otra vez', cls: 'bad' },
  { g: Rating.Hard, label: 'Difícil', cls: '' },
  { g: Rating.Good, label: 'Bien', cls: 'ok' },
  { g: Rating.Easy, label: 'Fácil', cls: '' }
];

const article = (c: VocabCard) => (c.gender ? (c.gender === 'm' ? 'masculino' : 'femenino') : '');

/** Reviews due cards, then new ones. ES→EN recognition first; after two correct answers, EN→ES typed recall. */
export function VocabReview({ limit, unit, title, onDone }: { limit: number; unit?: number; title?: string; onDone: () => void }) {
  const app = useApp();
  const initial = useMemo(() => {
    const q = buildQueue(vocabCards, app.srs, app.settings.classUnit, new Date(), unit);
    return [...q.due, ...q.fresh].slice(0, limit);
  }, []);
  const [queue, setQueue] = useState<VocabCard[]>(initial);
  const [pos, setPos] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [typed, setTyped] = useState('');
  const [res, setRes] = useState<CheckResult | null>(null);
  const [stats, setStats] = useState({ done: 0, again: 0 });
  const requeued = useRef(new Set<string>());

  const card = queue[pos];
  if (!card) {
    return (
      <div class="screen no-tabs">
        <h1>{initial.length ? '¡Tarjetas hechas!' : 'No hay tarjetas pendientes'}</h1>
        {initial.length > 0 && (
          <p class="muted">
            {stats.done} repasos · {stats.again} «otra vez»
          </p>
        )}
        <button class="btn-primary btn-block" onClick={onDone}>
          {title === 'Sesión de hoy' ? 'Seguir con los ejercicios →' : 'Terminar'}
        </button>
      </div>
    );
  }
  const rec = app.srs.find((r) => r.cardId === card.id);
  const dir = directionFor(rec);

  function rate(g: Grade) {
    app.saveSrsRecord(review(card.id, app.srs.find((r) => r.cardId === card.id), g));
    setStats((s) => ({ done: s.done + 1, again: s.again + (g === Rating.Again ? 1 : 0) }));
    let q = queue;
    if (g === Rating.Again && !requeued.current.has(card.id)) {
      requeued.current.add(card.id);
      q = [...queue];
      q.splice(Math.min(pos + 4, q.length), 0, card);
      setQueue(q);
    }
    setPos(pos + 1);
    setRevealed(false);
    setTyped('');
    setRes(null);
  }

  const showAnswer = revealed || res;
  return (
    <div class="screen no-tabs">
      <div class="drill-top">
        <button class="btn-ghost" onClick={onDone} aria-label="Salir">
          ✕
        </button>
        <div class="progress">
          <i style={{ width: `${(pos / queue.length) * 100}%` }} />
        </div>
        <span class="small muted">
          {pos + 1}/{queue.length}
        </span>
      </div>
      <div class="row wrap">
        <span class="pill">Unidad {card.unit}</span>
        <span class="pill">{card.topic}</span>
        <span class="pill">{!rec ? 'Nueva' : dir === 'recall' ? 'EN → ES' : 'ES → EN'}</span>
      </div>

      <div class="flashcard">
        {dir === 'recognition' ? (
          <>
            <div class="fc-main">
              {card.es} <Speak text={card.es} />
            </div>
            {article(card) && <div class="tiny muted">{article(card)}</div>}
            {showAnswer && (
              <div class="fc-back">
                <div class="fc-en">{card.en}</div>
                <p>
                  <i>{card.example_es}</i> <Speak text={card.example_es} />
                </p>
                <p class="small muted">{card.example_en}</p>
                {card.collocation && <p class="small">➕ {card.collocation}</p>}
              </div>
            )}
          </>
        ) : (
          <>
            <div class="fc-main">{card.en}</div>
            <div class="tiny muted">Escríbelo en español{card.gender ? ' (con el artículo)' : ''}</div>
            {!res ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setRes(checkAnswer(typed, [card.es, card.es.replace(/^(el|la|los|las) /, '')], app.settings.accent));
                }}
              >
                <input
                  class="answer-input"
                  type="text"
                  lang="es"
                  autocomplete="off"
                  autocorrect="off"
                  autocapitalize="off"
                  spellcheck={false}
                  enterkeyhint="done"
                  aria-label="En español"
                  value={typed}
                  onInput={(e) => setTyped(e.currentTarget.value)}
                  ref={(el) => el?.focus({ preventScroll: true })}
                />
                <div class="sticky-actions">
                  <button type="button" class="grow" onClick={() => setRes({ correct: false, accentOnly: false, expected: card.es })}>
                    No lo sé
                  </button>
                  <button type="submit" class="btn-primary grow">
                    Comprobar
                  </button>
                </div>
              </form>
            ) : (
              <div class={`feedback ${res.correct ? 'ok' : 'bad'}`}>
                <div class="verdict">
                  {res.correct ? '✓' : '✗'} {card.es} <Speak text={card.es} />
                </div>
                {res.accentOnly && <p class="warn-line">Ojo con la tilde</p>}
                {!res.correct && typed && <p class="small muted">tú: {typed}</p>}
                <p>
                  <i>{card.example_es}</i>
                </p>
                <p class="small muted">{card.example_en}</p>
              </div>
            )}
          </>
        )}
      </div>

      {!showAnswer && dir === 'recognition' && (
        <div class="sticky-actions">
          <button class="btn-primary grow" onClick={() => setRevealed(true)}>
            Mostrar
          </button>
        </div>
      )}
      {showAnswer && (
        <div class="grades">
          {GRADES.map((x) => (
            <button
              class={`${x.cls} ${res && !res.correct && x.g === Rating.Again ? 'suggest' : ''} ${res?.correct && x.g === Rating.Good ? 'suggest' : ''}`}
              disabled={!!res && !res.correct && x.g !== Rating.Again && x.g !== Rating.Hard}
              onClick={() => rate(x.g)}
            >
              {x.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function VocabScreen({ unit }: { unit?: number }) {
  const app = useApp();
  const [studying, setStudying] = useState(false);
  const [browse, setBrowse] = useState<number>(unit ?? app.settings.classUnit);
  const q = buildQueue(vocabCards, app.srs, app.settings.classUnit, new Date(), unit);
  const ret = retention(app.srs);
  const seen = new Set(app.srs.map((r) => r.cardId));
  if (studying) return <VocabReview limit={q.due.length + q.fresh.length} unit={unit} onDone={() => setStudying(false)} />;
  return (
    <div class="screen no-tabs">
      <a class="btn btn-ghost" href={unit ? `#/units/${unit}` : '#/practice'} style={{ paddingLeft: 0 }}>
        ‹ Volver
      </a>
      <h1>Vocabulario{unit ? ` · Unidad ${unit}` : ''}</h1>
      <div class="row" style={{ margin: '12px 0' }}>
        <div class="stat">
          <b>{q.dueCount}</b>
          <span>para repasar</span>
        </div>
        <div class="stat">
          <b>{q.fresh.length}</b>
          <span>nuevas hoy (máx. {NEW_PER_DAY})</span>
        </div>
        <div class="stat">
          <b>{pct(ret)}</b>
          <span>retención</span>
        </div>
      </div>
      <button class="btn-primary btn-big" disabled={!q.due.length && !q.fresh.length} onClick={() => setStudying(true)}>
        {q.due.length || q.fresh.length ? `Estudiar ${q.due.length + q.fresh.length} tarjetas` : 'Todo al día ✓'}
      </button>
      <p class="tiny muted" style={{ textAlign: 'center' }}>
        Primero de español a inglés; tras dos aciertos, de inglés a español escribiendo.
      </p>

      <h2>Explorar</h2>
      {!unit && (
        <select value={String(browse)} onChange={(e) => setBrowse(Number(e.currentTarget.value))}>
          {units
            .filter((u) => u.unit > 0)
            .map((u) => (
              <option value={String(u.unit)}>
                Unidad {u.unit} · {u.title}
              </option>
            ))}
        </select>
      )}
      <div class="card">
        {vocabCards
          .filter((c) => c.unit === browse)
          .map((c) => (
            <div class="vocab-row">
              <div>
                <b>{c.es}</b> <span class="muted small">· {c.en}</span>
                <div class="tiny muted">{c.example_es}</div>
              </div>
              <span class="row">
                {seen.has(c.id) && <span class="tiny muted">✓</span>}
                <Speak text={c.es} />
              </span>
            </div>
          ))}
      </div>
      <button class="btn-block" onClick={() => navigate('practice')}>
        Volver a Practicar
      </button>
    </div>
  );
}
