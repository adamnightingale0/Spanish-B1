import { useMemo, useState } from 'preact/hooks';
import { useApp, navigate } from '../state';
import { focus } from '../lib/content';
import { shuffle } from '../lib/session';
import type { Attempt } from '../lib/db';
import type { TimeMarker } from '../lib/schema';

const COLS: { id: TimeMarker['tense']; label: string }[] = [
  { id: 'perfecto', label: 'Perfecto' },
  { id: 'indefinido', label: 'Indefinido' },
  { id: 'imperfecto', label: 'Imperfecto' }
];

/** Time-marker sorter: tap each marker into the perfecto / indefinido / imperfecto column. */
export function Sorter() {
  const app = useApp();
  const [round, setRound] = useState(0);
  const markers = useMemo(() => shuffle(focus.markers).slice(0, 12), [round]);
  const [picks, setPicks] = useState<Record<string, TimeMarker['tense']>>({});
  const [checked, setChecked] = useState(false);
  const done = markers.every((m) => picks[m.text]);
  const right = markers.filter((m) => picks[m.text] === m.tense).length;

  function check() {
    const now = Date.now();
    const list: Attempt[] = markers.map((m, i) => ({
      key: `${now + i}-sorter-${m.text}`,
      itemId: `sorter:${m.text}`,
      grammarPoint: 'past-review',
      subPoint: m.tense === 'imperfecto' ? 'indefinido-vs-imperfecto' : 'perfecto-vs-indefinido',
      unit: 2,
      ts: now + i,
      correct: picks[m.text] === m.tense,
      given: picks[m.text],
      ms: 4000
    }));
    app.addAttempts(list);
    setChecked(true);
  }

  return (
    <div class="screen no-tabs">
      <a class="btn btn-ghost" href="#/practice" style={{ paddingLeft: 0 }}>
        ‹ Volver
      </a>
      <h1>Clasificar marcadores</h1>
      <p class="muted small">¿Con qué tiempo va normalmente cada marcador temporal (en España)?</p>
      {markers.map((m) => (
        <div class="sorter-row">
          <b>{m.text}</b>
          <div class="choices">
            {COLS.map((c) => {
              let cls = picks[m.text] === c.id ? 'sel' : '';
              if (checked) cls = c.id === m.tense ? 'right' : picks[m.text] === c.id ? 'wrong' : '';
              return (
                <button disabled={checked} class={cls} onClick={() => setPicks({ ...picks, [m.text]: c.id })}>
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {checked && (
        <div class={`feedback ${right === markers.length ? 'ok' : 'bad'}`}>
          <div class="verdict">
            {right}/{markers.length} correctos
          </div>
          <p class="small">
            Perfecto: periodos abiertos y experiencia (hoy, este año, ya, alguna vez). Indefinido: periodos cerrados (ayer, en 2019, hace dos años). Imperfecto:
            hábitos y descripciones (antes, de pequeño, todos los veranos).
          </p>
        </div>
      )}
      <div class="sticky-actions">
        {!checked ? (
          <button class="btn-primary grow" disabled={!done} onClick={check}>
            Comprobar
          </button>
        ) : (
          <>
            <button class="grow" onClick={() => navigate('practice')}>
              Terminar
            </button>
            <button
              class="btn-primary grow"
              onClick={() => {
                setPicks({});
                setChecked(false);
                setRound(round + 1);
              }}
            >
              Otra ronda
            </button>
          </>
        )}
      </div>
    </div>
  );
}
