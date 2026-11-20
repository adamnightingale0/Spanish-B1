import { useState } from 'preact/hooks';
import { useApp, navigate } from '../state';
import { checkAnswer, type CheckResult } from '../lib/answer';
import { INDEF_GROUPS, indefCards, buildCardQueue, deckStats, cardStates, type ConjCard } from '../lib/conjCards';
import { Header, Speak } from '../components/common';
import type { Attempt } from '../lib/db';
import { PERSONS } from '../lib/conjugate';

const SESSION = 20;

/** #/tarjetas: typed flashcards for the irregular pretérito indefinido. */
export function ConjCardsScreen() {
  const app = useApp();
  const [groups, setGroups] = useState<string[]>(INDEF_GROUPS.map((g) => g.id));
  const [queue, setQueue] = useState<ConjCard[] | null>(null);
  const cards = indefCards.filter((c) => groups.includes(c.group.id));
  const stats = deckStats(cards, app.attempts);
  const st = cardStates(app.attempts);

  if (queue) return <Study key={queue[0]?.id} initial={queue} onDone={() => setQueue(null)} />;

  const toggle = (id: string) => setGroups((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));
  const nextQueue = buildCardQueue(cards, app.attempts, SESSION);

  return (
    <div class="screen">
      <Header title="Tarjetas: indefinidos irregulares" back="tenses/indefinido" />
      <p class="small muted">
        Escribe la forma del pretérito indefinido. Solo salen las personas irregulares de cada verbo; al comprobar ves el significado y el verbo completo.
        Las tarjetas que aciertas vuelven a salir cada vez más tarde (1, 3, 7, 14… días).
      </p>
      <div class="row" style={{ margin: '12px 0' }}>
        <div class="stat">
          <b>{stats.due}</b>
          <span>para repasar</span>
        </div>
        <div class="stat">
          <b>{stats.fresh}</b>
          <span>nuevas</span>
        </div>
        <div class="stat">
          <b>
            {stats.learned}/{stats.total}
          </b>
          <span>aprendidas</span>
        </div>
      </div>
      <button class="btn-primary btn-big" disabled={!nextQueue.length} onClick={() => setQueue(nextQueue)}>
        ▶ Estudiar · {nextQueue.length} tarjetas
      </button>
      <button class="btn-block" disabled={!cards.length} onClick={() => setQueue([...cards].sort(() => Math.random() - 0.5).slice(0, SESSION))}>
        Repaso libre (al azar, aunque no toque)
      </button>

      <h2>Grupos</h2>
      {INDEF_GROUPS.map((g) => {
        const gc = indefCards.filter((c) => c.group.id === g.id);
        const learned = gc.filter((c) => (st.get(c.id)?.streak ?? 0) >= 2).length;
        const on = groups.includes(g.id);
        return (
          <div class="card">
            <label class="row spread" style={{ cursor: 'pointer' }}>
              <span>
                <input type="checkbox" checked={on} onChange={() => toggle(g.id)} /> <b>{g.title}</b>
              </span>
              <span class="pill">
                {learned}/{gc.length}
              </span>
            </label>
            <p class="tiny muted">{g.rule}</p>
            <p class="small">{g.verbs.join(' · ')}</p>
          </div>
        );
      })}
    </div>
  );
}

function Study({ initial, onDone }: { initial: ConjCard[]; onDone: () => void }) {
  const app = useApp();
  const [queue, setQueue] = useState(initial);
  const [pos, setPos] = useState(0);
  const [typed, setTyped] = useState('');
  const [res, setRes] = useState<CheckResult | null>(null);
  const [last, setLast] = useState<Attempt | null>(null);
  const [shownAt, setShownAt] = useState(Date.now());
  const [score, setScore] = useState({ right: 0, wrong: 0 });

  if (pos >= queue.length) {
    return (
      <div class="screen no-tabs">
        <h1>¡Hecho!</h1>
        <p>
          {score.right} bien a la primera · {score.wrong} para repasar
        </p>
        <button class="btn-primary btn-block" onClick={onDone}>
          Volver a las tarjetas
        </button>
        <button class="btn-block" onClick={() => navigate('tenses/indefinido')}>
          Ver el pretérito indefinido
        </button>
      </div>
    );
  }
  const card = queue[pos];
  const firstTime = queue.findIndex((c) => c.id === card.id) === pos;

  function check(given: string) {
    const r = given.trim() ? checkAnswer(given, [card.answer], app.settings.accent, { allowSubjectPronoun: true }) : { correct: false, accentOnly: false, expected: card.answer };
    setRes(r);
    const ts = Date.now();
    const a: Attempt = {
      key: `${ts}-${card.id}`,
      itemId: card.id,
      grammarPoint: 'past-review',
      subPoint: 'formas-indefinido',
      unit: 0,
      ts,
      correct: r.correct,
      given,
      accentOnly: r.accentOnly || undefined,
      ms: ts - shownAt
    };
    app.addAttempts([a]);
    setLast(a);
    if (firstTime) setScore((s) => (r.correct ? { ...s, right: s.right + 1 } : { ...s, wrong: s.wrong + 1 }));
    // A wrong card comes back a few cards later in this session.
    if (!r.correct) {
      const q = [...queue];
      q.splice(Math.min(pos + 4, q.length), 0, card);
      setQueue(q);
    }
  }

  function typo() {
    if (!last || !res) return;
    app.replaceAttempt({ ...last, correct: true, override: true });
    setRes({ ...res, correct: true });
    const again = queue.findIndex((c, i) => i > pos && c.id === card.id);
    if (again >= 0) setQueue(queue.filter((_, i) => i !== again));
    if (firstTime) setScore((s) => ({ right: s.right + 1, wrong: s.wrong - 1 }));
  }

  function next() {
    setPos(pos + 1);
    setTyped('');
    setRes(null);
    setLast(null);
    setShownAt(Date.now());
  }

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
        <span class="pill">Pretérito indefinido</span>
        <span class="pill">{card.group.title}</span>
      </div>

      <div class="flashcard">
        <div class="fc-main">{card.verb}</div>
        <div class="fc-en" style={{ marginTop: 6 }}>
          {card.personLabel}
        </div>
        {!res ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              check(typed);
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
              aria-label="Forma del indefinido"
              value={typed}
              onInput={(e) => setTyped(e.currentTarget.value)}
              ref={(el) => el?.focus({ preventScroll: true })}
            />
            <div class="sticky-actions">
              <button type="button" class="grow" onClick={() => check('')}>
                No lo sé
              </button>
              <button type="submit" class="btn-primary grow">
                Comprobar
              </button>
            </div>
          </form>
        ) : (
          <div class={`feedback ${res.correct ? 'ok' : 'bad'}`} style={{ textAlign: 'left' }}>
            <div class="verdict">
              {res.correct ? '✓' : '✗'} {card.answer} <Speak text={card.answer} />
            </div>
            {res.accentOnly && <p class="warn-line">Ojo con la tilde</p>}
            {!res.correct && typed.trim() && <p class="small muted">tú: {typed}</p>}
            <p style={{ fontSize: 18, margin: '10px 0' }}>
              <b>{card.verb}</b> = {card.en}
            </p>
            <table class="simple" style={{ fontSize: 14 }}>
              <tbody>
                {card.forms.map((f, i) => (
                  <tr style={i === card.person ? { background: 'var(--surface)' } : undefined}>
                    <td class="muted">{PERSONS[i]}</td>
                    <td>{i === card.person ? <b>{f}</b> : f}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p class="tiny muted" style={{ marginTop: 8 }}>
              {card.group.rule}
            </p>
          </div>
        )}
      </div>

      {res && (
        <div class="sticky-actions">
          {!res.correct && typed.trim() && (
            <button class="grow" onClick={typo}>
              Era una errata
            </button>
          )}
          <button class="btn-primary grow" onClick={next} ref={(el) => el?.focus({ preventScroll: true })}>
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
