import { useState } from 'preact/hooks';
import { useApp, navigate } from '../state';
import { tenseGuide, tenseItems } from '../lib/content';
import { VERBS, irregularIn, type TenseId } from '../lib/conjugate';
import { guideById, formsOf, generateFormItems, buildUseDrill, buildMixDrill, masteryByTense, masteryByTenseKind } from '../lib/tenses';
import { Header, MasteryBar } from '../components/common';
import type { TenseGuideEntry } from '../lib/schema';

/** #/tenses: every B1 tense with its mastery, plus a mixed «¿qué tiempo?» quiz. */
export function TensesList() {
  const app = useApp();
  const m = masteryByTense(app.attempts);
  const groups = [...new Set(tenseGuide.map((t) => t.group))];
  return (
    <div class="screen">
      <Header title="Tiempos verbales" back="practice" />
      <p class="small muted">
        Todos los tiempos del B1: cómo se forman, cuándo se usan y —lo más importante— cuándo <b>no</b>. Cada tiempo tiene práctica de formas (ilimitada) y de
        uso.
      </p>
      <button class="btn-primary btn-block" onClick={() => app.startSession({ title: 'Mezcla de tiempos', items: buildMixDrill(app.attempts) }, 'tenses')}>
        ▶ Mezcla de tiempos · ¿qué tiempo uso? ({tenseItems.length})
      </button>
      {groups.map((g) => (
        <>
          <h2>{g}</h2>
          {tenseGuide
            .filter((t) => t.group === g)
            .map((t) => (
              <div class="card tap" onClick={() => navigate(`tenses/${t.id}`)}>
                <MasteryBar m={m.get(t.id)} label={t.name} />
                <p class="tiny muted" style={{ marginTop: 4 }}>
                  {t.summary}
                </p>
              </div>
            ))}
        </>
      ))}
    </div>
  );
}

function FormsTable({ t, inf }: { t: TenseGuideEntry; inf: string }) {
  const { persons, forms } = formsOf(t, inf);
  return (
    <table class="simple">
      <tbody>
        {persons.map((p, i) => (
          <tr>
            <td class="muted">{p}</td>
            <td>
              <b>{forms[i]}</b>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** #/tenses/<id>: forms, uses, when not to use it, markers and practice. */
export function TenseDetail({ id }: { id: string }) {
  const app = useApp();
  const t = guideById.get(id);
  const [verb, setVerb] = useState('tener');
  if (!t) return <TensesList />;
  const km = masteryByTenseKind(app.attempts);
  const models = ['hablar', 'comer', 'vivir'];
  const irregularVerbs = t.tense ? VERBS.filter((v) => irregularIn(v.inf, t.tense as TenseId)).map((v) => v.inf) : [];

  return (
    <div class="screen">
      <Header title={t.name} back="tenses" />
      <p>{t.summary}</p>
      <div class="stack" style={{ margin: '8px 0 12px' }}>
        <MasteryBar m={km.get(`formas-${t.id}`)} label="Formas" />
        <MasteryBar m={km.get(`uso-${t.id}`)} label="Uso (¿cuándo?)" />
      </div>
      <div class="row">
        <button class="btn-primary grow" onClick={() => app.startSession({ title: `${t.name} · formas`, items: generateFormItems(t) }, `tenses/${t.id}`)}>
          Practicar formas
        </button>
        <button
          class="btn-primary grow"
          onClick={() =>
            app.startSession(
              {
                title: `${t.name} · uso`,
                items: buildUseDrill(t, app.attempts)
              },
              `tenses/${t.id}`
            )
          }
        >
          Practicar el uso
        </button>
      </div>

      <h2>✅ Cuándo se usa</h2>
      <div class="card">
        {t.uses.map((u) => (
          <div style={{ padding: '6px 0' }}>
            <div class="small">{u.rule}</div>
            <div>
              <i>{u.es}</i>
            </div>
          </div>
        ))}
      </div>

      <h2>🚫 Cuándo NO se usa</h2>
      <div class="card">
        {t.notUse.map((n) => (
          <div style={{ padding: '6px 0' }}>
            <div style={{ color: 'var(--bad)' }}>
              ✗ <s>{n.wrong}</s>
            </div>
            <div style={{ color: 'var(--ok)' }}>✓ {n.right}</div>
            <div class="tiny muted">{n.why}</div>
          </div>
        ))}
      </div>

      {t.markers.length > 0 && (
        <>
          <h2>Marcadores típicos</h2>
          <div class="row wrap">
            {t.markers.map((mk) => (
              <span class="pill">{mk}</span>
            ))}
          </div>
        </>
      )}

      <h2>Cómo se forma</h2>
      <p class="small">{t.how}</p>
      <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
        <table class="simple" style={{ fontSize: 13 }}>
          <thead>
            <tr>
              <th />
              {models.map((inf) => (
                <th class="muted">{inf}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {formsOf(t, 'hablar').persons.map((p, i) => (
              <tr>
                <td class="muted">{p.split(' / ')[0]}</td>
                {models.map((inf) => (
                  <td>
                    <b>{formsOf(t, inf).forms[i]}</b>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {t.irregulars.length > 0 && (
        <>
          <h2>Irregulares</h2>
          <ul class="small">
            {t.irregulars.map((x) => (
              <li>{x}</li>
            ))}
          </ul>
        </>
      )}

      <h2>Conjugador</h2>
      <label class="field">
        <span>Verbo</span>
        <select value={verb} onChange={(e) => setVerb(e.currentTarget.value)}>
          {VERBS.map((v) => (
            <option value={v.inf}>
              {v.inf} ({v.en}){irregularVerbs.includes(v.inf) ? ' · irregular' : ''}
            </option>
          ))}
        </select>
      </label>
      <div class="card">
        <FormsTable t={t} inf={verb} />
      </div>
    </div>
  );
}
