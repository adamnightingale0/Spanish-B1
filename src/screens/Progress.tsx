import { useApp } from '../state';
import { units, gpById, focus, allItems, vocabCards } from '../lib/content';
import { buildPlacement } from '../lib/placement';
import { retention } from '../lib/srs';
import { tagLabel } from '../lib/errors';
import { skillEstimate } from '../lib/skills';
import { FORMAT_LABELS } from '../lib/content';
import { navigate } from '../state';
import { buildDrill, masteryByPoint, masteryBySubPoint } from '../lib/session';
import { minutesPerWeek, streak, topConfusions } from '../lib/stats';
import { Header, MasteryBar } from '../components/common';

function cellColor(acc: number | null | undefined): string {
  if (acc === null || acc === undefined) return 'var(--surface-2)';
  if (acc >= 0.8) return 'color-mix(in srgb, var(--ok) 70%, transparent)';
  if (acc >= 0.6) return 'color-mix(in srgb, var(--warn) 60%, transparent)';
  return 'color-mix(in srgb, var(--bad) 60%, transparent)';
}

export function Progress() {
  const app = useApp();
  const { attempts } = app;
  const gpM = masteryByPoint(attempts);
  const subM = masteryBySubPoint(attempts);
  const weeks = minutesPerWeek(attempts);
  const maxMin = Math.max(10, ...weeks.map((w) => w.minutes));
  const total = attempts.length;
  const right = attempts.filter((a) => a.correct).length;
  const reasons = attempts.filter((a) => a.reasonCorrect !== undefined);
  const confusions = topConfusions(attempts);
  const ret = retention(app.srs);

  return (
    <div class="screen">
      <div class="row spread">
        <Header title="Progreso" />
        <a class="btn" href="#/settings">
          ⚙︎ Ajustes
        </a>
      </div>
      <div class="row">
        <div class="stat">
          <b>{streak(attempts)}</b>
          <span>racha</span>
        </div>
        <div class="stat">
          <b>{total}</b>
          <span>respuestas</span>
        </div>
        <div class="stat">
          <b>{total ? Math.round((right / total) * 100) : 0} %</b>
          <span>aciertos</span>
        </div>
        <div class="stat">
          <b>{reasons.length ? Math.round((reasons.filter((a) => a.reasonCorrect).length / reasons.length) * 100) : 0} %</b>
          <span>«¿Por qué?»</span>
        </div>
      </div>

      <h2>Destrezas</h2>
      <div class="card">
        {(['reading', 'listening'] as const).map((sk) => {
          const e = skillEstimate(app.skills, sk);
          const v = e.pct;
          return (
            <div style={{ margin: '8px 0' }} onClick={() => navigate(sk)}>
              <div class="row spread small">
                <span>{sk === 'reading' ? 'Lectura' : 'Audición'}</span>
                <span class="muted">{v === null ? 'sin datos' : `${Math.round(v * 100)} % · ${e.n} tareas`}</span>
              </div>
              <div class={`bar skill-bar ${v === null ? 'none' : v >= 0.6 ? '' : v >= 0.5 ? 'mid' : 'low'}`}>
                {v !== null && <i style={{ width: `${Math.max(4, v * 100)}%` }} />}
                <span class="line50" />
                <span class="line60" />
              </div>
            </div>
          );
        })}
        <p class="tiny muted">Línea fina: 50 % (mínimo para aprobar) · línea gruesa: 60 % (margen de seguridad).</p>
        {app.skills.slice(-5).reverse().map((r) => (
          <div class="row spread tiny" style={{ borderTop: '1px solid var(--line)', padding: '4px 0' }}>
            <span>
              {new Date(r.ts).toLocaleDateString('es-ES')} · {FORMAT_LABELS[r.format]?.short}
              {r.paper ? ' · prueba completa' : ''}
            </span>
            <b>
              {r.correct}/{r.total}
            </b>
          </div>
        ))}
      </div>

      <h2>Errores más frecuentes (30 días)</h2>
      {confusions.length ? (
        confusions.map((c) => (
          <div class="card row spread">
            <div>
              <b>{tagLabel(c.tag)}</b>
              <div class="tiny muted">
                {c.count}× · {c.points.map((p) => gpById.get(p)?.title ?? p).join(' · ')}
              </div>
            </div>
            <button
              class="btn-small"
              onClick={() =>
                app.startSession({ title: tagLabel(c.tag), items: buildDrill(allItems.filter((i) => c.points.includes(i.grammarPoint)), attempts, 15) }, 'progress')
              }
            >
              Practicar
            </button>
          </div>
        ))
      ) : (
        <p class="small muted">Aún no hay errores registrados. Los fallos se clasifican (p. ej. «indefinido en lugar de imperfecto») y aparecerán aquí.</p>
      )}

      <h2>Vocabulario</h2>
      <div class="row">
        <div class="stat">
          <b>{app.srs.length}</b>
          <span>de {vocabCards.length} tarjetas vistas</span>
        </div>
        <div class="stat">
          <b>{ret === null ? '—' : Math.round(ret * 100) + ' %'}</b>
          <span>retención</span>
        </div>
      </div>

      <h2>Minutos por semana</h2>
      <div class="card">
        <div class="weekbars">
          {weeks.map((w) => (
            <div class="wb">
              <span>{w.minutes}</span>
              <i style={{ height: `${(w.minutes / maxMin) * 80}%` }} />
              <span>{w.label}</span>
            </div>
          ))}
        </div>
      </div>

      <h2>Mapa de dominio</h2>
      <p class="tiny muted">Cada casilla es un punto gramatical (últimos 20 intentos). Gris = menos de 5 intentos. Toca para practicar.</p>
      <div class="card heatmap">
        {units.map((u) => (
          <div class="hrow">
            <span class="small">{u.unit ? `U${u.unit}` : 'Prog.'}</span>
            <div class="cells">
              {u.grammarPoints.map((g) => {
                const m = gpM.get(g);
                return (
                  <button
                    class="cell"
                    style={{ background: cellColor(m?.accuracy) }}
                    title={`${gpById.get(g)?.title}: ${m?.accuracy === null || !m ? 'sin datos' : Math.round(m.accuracy * 100) + ' %'}`}
                    aria-label={gpById.get(g)?.title}
                    onClick={() =>
                      app.startSession({ title: gpById.get(g)?.title ?? g, items: buildDrill(allItems.filter((i) => i.grammarPoint === g), attempts, 12) }, 'progress')
                    }
                  >
                    {m?.accuracy != null ? Math.round(m.accuracy * 100) : ''}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <h2>Los pasados</h2>
      <div class="card stack">
        {focus.subPoints.map((s) => (
          <MasteryBar m={subM.get(s.id)} label={s.title} />
        ))}
      </div>

      <div class="card">
        <b>Prueba de nivel</b>
        <p class="small muted">
          {app.settings.placementDone ? `Última: ${new Date(app.settings.placementDone).toLocaleDateString('es-ES')}. ` : ''}
          Unas 40 preguntas de todas las unidades (15 min).
        </p>
        <button class="btn-block" onClick={() => app.startSession({ title: 'Prueba de nivel', items: buildPlacement(), kind: 'placement' }, 'progress')}>
          {app.settings.placementDone ? 'Repetir la prueba de nivel' : 'Hacer la prueba de nivel'}
        </button>
      </div>

      <h2>Todos los puntos</h2>
      <div class="card stack">
        {[...gpById.values()].map((g) => (
          <MasteryBar m={gpM.get(g.id)} label={`${g.unit ? 'U' + g.unit : 'Prog.'} · ${g.title}`} />
        ))}
      </div>
    </div>
  );
}
