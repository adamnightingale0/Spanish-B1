import { useMemo, useRef, useState } from 'preact/hooks';
import { useApp } from '../state';
import { checkAnswer, type CheckResult } from '../lib/answer';
import {
  INDEF_GROUPS,
  indefCards,
  buildCardQueue,
  deckStats,
  cardStates,
  gradeOf,
  pointsFor,
  whenLabel,
  LEVELS,
  SESSION_NEW,
  SESSION_REVIEWS,
  type ConjCard,
  type QueueMode,
  type Level
} from '../lib/conjCards';
import { Header, Speak } from '../components/common';
import type { Attempt } from '../lib/db';
import { PERSONS } from '../lib/conjugate';

const LEVEL_COLOR: Record<Level, string> = { nueva: 'var(--bar)', aprendiendo: 'var(--bad)', repasando: 'var(--warn)', dominada: 'var(--ok)' };

function LevelBar({ levels, total }: { levels: Record<Level, number>; total: number }) {
  return (
    <div>
      <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', background: 'var(--bar)' }}>
        {LEVELS.filter((l) => l.id !== 'nueva').map((l) => (
          <i style={{ width: `${(levels[l.id] / Math.max(1, total)) * 100}%`, background: LEVEL_COLOR[l.id] }} />
        ))}
      </div>
      <div class="row wrap tiny muted" style={{ marginTop: 6, gap: 10 }}>
        {LEVELS.map((l) => (
          <span>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: LEVEL_COLOR[l.id], marginRight: 4 }} />
            {l.label} {levels[l.id]}
          </span>
        ))}
      </div>
    </div>
  );
}

/** #/tarjetas: typed flashcards for the irregular pretérito indefinido, scheduled with FSRS. */
export function ConjCardsScreen() {
  const app = useApp();
  const [groups, setGroups] = useState<string[]>(INDEF_GROUPS.map((g) => g.id));
  const [session, setSession] = useState<ConjCard[] | null>(null);
  const cards = indefCards.filter((c) => groups.includes(c.group.id));
  const stats = deckStats(cards, app.attempts);
  const st = cardStates(app.attempts);

  if (session) return <Study key={session[0]?.id} initial={session} onDone={() => setSession(null)} />;

  const toggle = (id: string) => setGroups((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));
  const start = (mode: QueueMode) => {
    const queue = buildCardQueue(cards, app.attempts, mode);
    if (queue.length) setSession(queue);
  };
  const studyCount = Math.min(stats.due, SESSION_REVIEWS) + (stats.levels.nueva ? Math.min(SESSION_NEW, stats.newToday) : 0);
  const hardCards = cards.filter((c) => st.get(c.id)?.hard);

  return (
    <div class="screen">
      <Header title="Tarjetas: indefinidos irregulares" back="tenses/indefinido" />
      <div class="row" style={{ margin: '12px 0' }}>
        <div class="stat">
          <b>{stats.due}</b>
          <span>para repasar</span>
        </div>
        <div class="stat">
          <b>{stats.hard}</b>
          <span>difíciles</span>
        </div>
        <div class="stat">
          <b>{app.settings.conjBest}</b>
          <span>mejor puntuación</span>
        </div>
      </div>
      <LevelBar levels={stats.levels} total={stats.total} />

      <button class="btn-primary btn-big" style={{ marginTop: 14 }} disabled={!studyCount} onClick={() => start('study')}>
        ▶ Estudiar{studyCount ? ` · ~${studyCount} tarjetas` : ''}
      </button>
      {!studyCount && (
        <p class="tiny muted" style={{ textAlign: 'center' }}>
          ¡Al día! {stats.nextDue ? `Próximo repaso ${whenLabel(stats.nextDue)}.` : ''}{' '}
          {stats.levels.nueva && !stats.newToday ? 'Mañana hay más verbos nuevos.' : ''}
        </p>
      )}
      <div class="row">
        <button class="grow" disabled={!hardCards.length} onClick={() => start('hard')}>
          ⚠︎ Difíciles ({hardCards.length})
        </button>
        <button class="grow" disabled={stats.total === stats.levels.nueva} onClick={() => start('extra')}>
          Practicar más
        </button>
      </div>

      <details class="card" style={{ marginTop: 12 }}>
        <summary>
          <b>Cómo funciona</b>
        </summary>
        <ul class="small">
          <li>Each card is one irregular form. Cards come shuffled, and the same verb never appears twice in a row.</li>
          <li>
            Spaced repetition (FSRS, as in Anki): a right answer pushes the card further away (a day, then several days, then weeks). A wrong one brings it
            back a few cards later in this session, again in a few minutes, and then sooner than the cards you always get right.
          </li>
          <li>Right but with a missing accent, a typo, or after more than 15 seconds counts as only half-known, and the card returns sooner.</li>
          <li>A card you have missed 3+ times becomes a «difícil»: practise them on their own with ⚠︎ Difíciles.</li>
          <li>
            Points: 10 for each right answer, more with a streak (up to ×2 after 10 in a row), 5 with an accent slip or typo, 2 for getting it on the second
            go. New verbs: up to {SESSION_NEW} forms a session, 25 a day.
          </li>
          <li>Levels: Aprendiendo → Repasando (remembered for 3+ days) → Dominada (3+ weeks).</li>
          <li>«Practicar más» drills your weakest cards that aren't due yet, if you want extra practice.</li>
        </ul>
      </details>

      {hardCards.length > 0 && (
        <>
          <h2>⚠︎ Tus difíciles</h2>
          <div class="card">
            {hardCards.map((c) => (
              <div class="row spread small" style={{ padding: '3px 0' }}>
                <span>
                  {c.verb} · <span class="muted">{c.personLabel}</span>
                </span>
                <b>{c.answer}</b>
              </div>
            ))}
          </div>
        </>
      )}

      <h2>Grupos</h2>
      {INDEF_GROUPS.map((g) => {
        const gc = indefCards.filter((c) => c.group.id === g.id);
        const gs = deckStats(gc, app.attempts);
        const on = groups.includes(g.id);
        return (
          <div class="card">
            <label class="row spread" style={{ cursor: 'pointer' }}>
              <span>
                <input type="checkbox" checked={on} onChange={() => toggle(g.id)} /> <b>{g.title}</b>
              </span>
              <span class="pill">
                {gs.levels.dominada}/{gc.length}
              </span>
            </label>
            <div style={{ margin: '6px 0' }}>
              <LevelBar levels={gs.levels} total={gs.total} />
            </div>
            <p class="tiny muted">{g.rule}</p>
            <p class="small">
              {g.verbs.map((v, i) => {
                const vc = gc.filter((c) => c.verb === v);
                const hard = vc.some((c) => st.get(c.id)?.hard);
                const done = vc.every((c) => st.get(c.id)?.level === 'dominada');
                return (
                  <>
                    {i ? ' · ' : ''}
                    <span style={hard ? { color: 'var(--bad)' } : done ? { color: 'var(--ok)' } : undefined}>
                      {v}
                      {hard ? ' ⚠︎' : done ? ' ✓' : ''}
                    </span>
                  </>
                );
              })}
            </p>
          </div>
        );
      })}
    </div>
  );
}

interface Miss {
  card: ConjCard;
  given: string;
}

function Study({ initial, onDone }: { initial: ConjCard[]; onDone: () => void }) {
  const app = useApp();
  const before = useMemo(() => cardStates(app.attempts), []);
  const [queue, setQueue] = useState(initial);
  const [pos, setPos] = useState(0);
  const [typed, setTyped] = useState('');
  const [res, setRes] = useState<CheckResult | null>(null);
  const [last, setLast] = useState<Attempt | null>(null);
  const [gained, setGained] = useState(0);
  const [nextDue, setNextDue] = useState<number | null>(null);
  const shownAt = useRef(Date.now());
  const answered = useRef(new Set<string>());
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [firstRight, setFirstRight] = useState(0);
  const [misses, setMisses] = useState<Miss[]>([]);
  const saved = useRef(false);

  if (pos >= queue.length) {
    const after = cardStates(app.attempts);
    const ids = [...new Set(initial.map((c) => c.id))];
    const rank: Record<Level, number> = { nueva: 0, aprendiendo: 1, repasando: 2, dominada: 3 };
    const up = ids.filter((id) => before.has(id) && rank[after.get(id)?.level ?? 'nueva'] > rank[before.get(id)!.level]).length;
    const newDominated = ids.filter((id) => after.get(id)?.level === 'dominada' && before.get(id)?.level !== 'dominada').length;
    const record = score > app.settings.conjBest;
    if (record && !saved.current) {
      saved.current = true;
      app.updateSettings({ conjBest: score });
    }
    return (
      <div class="screen no-tabs">
        <h1>{record ? '🏆 ¡Nuevo récord!' : '¡Hecho!'}</h1>
        <div class="row" style={{ margin: '12px 0' }}>
          <div class="stat">
            <b>{score}</b>
            <span>puntos</span>
          </div>
          <div class="stat">
            <b>
              {firstRight}/{ids.length}
            </b>
            <span>a la primera</span>
          </div>
          <div class="stat">
            <b>🔥 {bestCombo}</b>
            <span>mejor racha</span>
          </div>
        </div>
        <p class="small">
          {up > 0 && <>⬆︎ {up} tarjetas suben de nivel. </>}
          {newDominated > 0 && <>✓ {newDominated} nuevas dominadas. </>}
          {!record && app.settings.conjBest > 0 && <span class="muted">Récord: {app.settings.conjBest}.</span>}
        </p>
        {misses.length > 0 && (
          <>
            <h2>Para recordar</h2>
            <p class="tiny muted">Estas vuelven pronto: en unos minutos y mañana.</p>
            <div class="card">
              {misses.map((m) => (
                <div class="row spread small" style={{ padding: '3px 0' }}>
                  <span>
                    {m.card.verb} · <span class="muted">{m.card.personLabel}</span>
                    {m.given && <span class="muted"> (tú: {m.given})</span>}
                  </span>
                  <b>{m.card.answer}</b>
                </div>
              ))}
            </div>
          </>
        )}
        <button class="btn-primary btn-block" onClick={onDone}>
          Volver a las tarjetas
        </button>
      </div>
    );
  }

  const card = queue[pos];
  const retry = answered.current.has(card.id);

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
      ms: ts - shownAt.current
    };
    if (r.accentOnly) a.accentOnly = true;
    app.addAttempts([a]);
    setLast(a);
    setNextDue(cardStates([...app.attempts, a], ts).get(card.id)?.due ?? null);
    const pts = pointsFor(gradeOf(a), combo, retry);
    setGained(pts);
    setScore(score + pts);
    if (!retry) {
      answered.current.add(card.id);
      if (r.correct) setFirstRight(firstRight + 1);
      else setMisses([...misses, { card, given }]);
    }
    if (r.correct) {
      setCombo(combo + 1);
      setBestCombo(Math.max(bestCombo, combo + 1));
    } else {
      setCombo(0);
      // Comes back a few cards later, never next to another form of the same verb.
      const q = [...queue];
      let at = Math.min(pos + 3 + Math.floor(Math.random() * 3), q.length);
      while (at < q.length && (q[at - 1]?.verb === card.verb || q[at]?.verb === card.verb)) at++;
      q.splice(at, 0, card);
      setQueue(q);
    }
  }

  /** "Era una errata": counts as half-known (Hard), keeps the streak and removes the extra repeat. */
  function typo() {
    if (!last || !res) return;
    const fixed = { ...last, correct: true, override: true };
    app.replaceAttempt(fixed);
    setRes({ ...res, correct: true });
    const pts = retry ? 2 : 5;
    setGained(pts);
    setScore(score + pts);
    setCombo(combo + 1);
    setBestCombo(Math.max(bestCombo, combo + 1));
    setNextDue(cardStates([...app.attempts.filter((x) => x.key !== last.key), fixed]).get(card.id)?.due ?? null);
    const again = queue.findIndex((c, i) => i > pos && c.id === card.id);
    if (again >= 0) setQueue(queue.filter((_, i) => i !== again));
    if (!retry) {
      setFirstRight(firstRight + 1);
      setMisses(misses.filter((m) => m.card.id !== card.id));
    }
  }

  function next() {
    setPos(pos + 1);
    setTyped('');
    setRes(null);
    setLast(null);
    shownAt.current = Date.now();
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
      <div class="row spread">
        <span class="row wrap">
          <span class="pill">{card.group.title}</span>
          {retry && <span class="pill accent">Otra vez</span>}
          {!before.has(card.id) && !retry && <span class="pill">Nueva</span>}
        </span>
        <span class="small" style={{ whiteSpace: 'nowrap' }}>
          <b>{score}</b> pts{combo >= 2 ? ` · 🔥${combo}` : ''}
        </span>
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
            <div class="row spread">
              <div class="verdict">
                {res.correct ? '✓' : '✗'} {card.answer} <Speak text={card.answer} />
              </div>
              <span class="pill accent">+{gained}</span>
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
            {nextDue && <p class="tiny">🗓 Vuelve {res.correct ? whenLabel(nextDue) : `dentro de esta sesión y ${whenLabel(nextDue)}`}.</p>}
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
