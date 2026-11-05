import { useApp, navigate } from '../state';
import { buildTodaySession, focusLabel, focusMasteryValue, focusPool, buildDrill, masteryByPoint, masteryBySubPoint } from '../lib/session';
import { daysUntil, streak, todayCount, lastByItem } from '../lib/stats';
import { focus, gpById, allItems } from '../lib/content';
import { MasteryBar } from '../components/common';

const isStandalone = () =>
  (navigator as Navigator & { standalone?: boolean }).standalone === true || matchMedia('(display-mode: standalone)').matches;

export function Home() {
  const app = useApp();
  const { settings, attempts } = app;
  const days = daysUntil(settings.examDate);
  const lastItems = lastByItem(attempts);
  const toReview = [...lastItems.values()].filter((a) => !a.correct).length;
  const focusM = focusMasteryValue(attempts, settings.focus);
  const subM = masteryBySubPoint(attempts);
  const gpM = masteryByPoint(attempts);
  const atRisk = [...gpM.entries()].filter(([, m]) => m.accuracy !== null && m.accuracy < 0.7).sort((a, b) => a[1].accuracy! - b[1].accuracy!).slice(0, 3);
  const backupDue = attempts.length > 0 && Date.now() - (settings.lastBackup ?? settings.firstRun) > 14 * 864e5;
  const examDateLabel = new Date(settings.examDate + 'T00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div class="screen">
      <div class="row spread">
        <h1>¡Hola, Adam!</h1>
        <a class="btn btn-ghost" href="#/settings" aria-label="Ajustes">⚙︎</a>
      </div>
      <p class="muted">
        {days > 0 ? (
          <>
            Faltan <b style={{ color: 'var(--accent)' }}>{days} días</b> para el examen escrito ({examDateLabel}).
          </>
        ) : days === 0 ? (
          <b>¡Hoy es el examen! ¡Mucha suerte!</b>
        ) : (
          <>El examen fue el {examDateLabel}. Cambia la fecha en Ajustes.</>
        )}
      </p>

      {!isStandalone() && (
        <div class="banner">
          <b>Instala la app</b> para que funcione sin conexión y Safari no borre tu progreso: en Safari, pulsa <b>Compartir</b> → <b>Añadir a pantalla de inicio</b>.
        </div>
      )}
      {backupDue && (
        <div class="banner">
          Han pasado más de 14 días desde tu última copia de seguridad. <a href="#/settings">Exportar progreso</a>
        </div>
      )}

      <div class="row" style={{ margin: '12px 0' }}>
        <div class="stat">
          <b>{streak(attempts)}</b>
          <span>días de racha</span>
        </div>
        <div class="stat">
          <b>{todayCount(attempts)}</b>
          <span>respuestas hoy</span>
        </div>
        <div class="stat">
          <b>{toReview}</b>
          <span>fallos por repasar</span>
        </div>
      </div>

      <button class="btn-primary btn-big" onClick={() => app.startSession(buildTodaySession(attempts, settings), 'home')}>
        ▶ Sesión de hoy · {settings.sessionMinutes} min
      </button>
      <p class="tiny muted" style={{ textAlign: 'center' }}>
        Foco + puntos débiles + unidad {settings.classUnit} + repaso de todas las unidades
      </p>

      {settings.focus !== 'none' && (
        <div class="card highlight">
          <div class="row spread">
            <b>🎯 Foco: {focusLabel(settings.focus)}</b>
            <span class="pill accent">{focusM === null ? 'sin datos' : `${Math.round(focusM * 100)} %`}</span>
          </div>
          <p class="small muted">Ocupa al menos el 25 % de cada sesión diaria hasta superar el 80 %.</p>
          {settings.focus === 'past-tenses' && (
            <div class="stack" style={{ margin: '10px 0' }}>
              {focus.subPoints.map((s) => (
                <MasteryBar m={subM.get(s.id)} label={s.title} />
              ))}
            </div>
          )}
          <div class="row">
            <button
              class="grow"
              onClick={() => app.startSession({ title: focusLabel(settings.focus), items: buildDrill(focusPool(settings.focus), attempts, 20) }, 'home')}
            >
              Practicar foco
            </button>
            {settings.focus === 'past-tenses' && (
              <button class="grow" onClick={() => navigate('sorter')}>
                Marcadores
              </button>
            )}
          </div>
        </div>
      )}

      {atRisk.length > 0 && (
        <>
          <h2>⚠︎ En riesgo (menos del 70 %)</h2>
          {atRisk.map(([id, m]) => (
            <div
              class="card tap"
              onClick={() =>
                app.startSession({ title: gpById.get(id)?.title ?? id, items: buildDrill(allItems.filter((i) => i.grammarPoint === id), attempts, 12) }, 'home')
              }
            >
              <MasteryBar m={m} label={gpById.get(id)?.title ?? id} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}
