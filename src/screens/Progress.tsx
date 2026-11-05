import { useApp } from '../state';
import { units, gpById, focus, allItems } from '../lib/content';
import { buildDrill, masteryByPoint, masteryBySubPoint } from '../lib/session';
import { minutesPerWeek, streak } from '../lib/stats';
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

      <h2>Todos los puntos</h2>
      <div class="card stack">
        {[...gpById.values()].map((g) => (
          <MasteryBar m={gpM.get(g.id)} label={`${g.unit ? 'U' + g.unit : 'Prog.'} · ${g.title}`} />
        ))}
      </div>
    </div>
  );
}
