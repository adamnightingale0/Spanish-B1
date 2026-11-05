import { useState } from 'preact/hooks';
import { useApp, navigate } from '../state';
import { allItems, focus, units, gpById, unitLabel, TYPE_LABELS, isFocusItem } from '../lib/content';
import { buildDrill, buildWeakSpots, masteryBySubPoint, weakPoints } from '../lib/session';
import { Header, MasteryBar } from '../components/common';
import type { DrillItem } from '../lib/schema';

export function Practice() {
  const app = useApp();
  const { attempts, settings } = app;
  const [unit, setUnit] = useState<string>(String(settings.classUnit));
  const [gp, setGp] = useState('all');
  const [type, setType] = useState('all');
  const [count, setCount] = useState(20);
  const sub = masteryBySubPoint(attempts);
  const weak = weakPoints(attempts);

  const start = (title: string, items: DrillItem[], n = count) => app.startSession({ title, items: buildDrill(items, attempts, n) }, 'practice');

  const pool = allItems.filter(
    (i) =>
      (unit === 'all' || i.unit === Number(unit)) &&
      (gp === 'all' || i.grammarPoint === gp) &&
      (type === 'all' || i.type === type)
  );
  const unitPoints = unit === 'all' ? [...gpById.keys()] : [...new Set(allItems.filter((i) => i.unit === Number(unit)).map((i) => i.grammarPoint))];

  return (
    <div class="screen">
      <Header title="Practicar" />

      <div class="row">
        <button class="btn-primary grow" onClick={() => start('Mixto: todo', allItems.filter((i) => i.type !== 'cloze'))}>
          Mixto: todo
        </button>
        <button
          class="grow"
          disabled={!weak.length}
          onClick={() => app.startSession(buildWeakSpots(attempts, count), 'practice')}
          title={weak.length ? '' : 'Necesitas más respuestas en los últimos 14 días'}
        >
          Puntos débiles
        </button>
      </div>
      {weak.length > 0 ? (
        <p class="tiny muted">Puntos débiles: {weak.map((w) => gpById.get(w)?.title ?? w).join(' · ')}</p>
      ) : (
        <p class="tiny muted">«Puntos débiles» se activa cuando tengas al menos 3 respuestas por punto en los últimos 14 días.</p>
      )}

      <h2>🎯 Los pasados</h2>
      <div class="card">
        {focus.subPoints.map((s) => (
          <div class="row" style={{ padding: '6px 0' }}>
            <div class="grow">
              <MasteryBar m={sub.get(s.id)} label={s.title} />
            </div>
            <button class="btn-small" onClick={() => start(s.title, allItems.filter((i) => i.subPoint === s.id && i.type !== 'cloze'))}>
              ▶
            </button>
          </div>
        ))}
        <div class="row wrap" style={{ marginTop: 10 }}>
          <button class="grow" onClick={() => start('Historias (cloze)', allItems.filter((i) => i.type === 'cloze'), 3)}>
            Historias ({allItems.filter((i) => i.type === 'cloze').length})
          </button>
          <button class="grow" onClick={() => navigate('sorter')}>
            Clasificar marcadores
          </button>
          <button class="grow" onClick={() => start('Los pasados: todo', allItems.filter(isFocusItem))}>
            Todo mezclado
          </button>
        </div>
      </div>

      <h2>Drill a medida</h2>
      <div class="card">
        <label class="field">
          <span>Unidad</span>
          <select
            value={unit}
            onChange={(e) => {
              setUnit(e.currentTarget.value);
              setGp('all');
            }}
          >
            <option value="all">Todas las unidades</option>
            {units.map((u) => (
              <option value={String(u.unit)}>
                {unitLabel(u.unit)} · {u.title}
                {u.unit === settings.classUnit ? ' 📍' : ''}
              </option>
            ))}
          </select>
        </label>
        <label class="field">
          <span>Punto gramatical</span>
          <select value={gp} onChange={(e) => setGp(e.currentTarget.value)}>
            <option value="all">Todos</option>
            {unitPoints.map((id) => (
              <option value={id}>{gpById.get(id)?.title ?? id}</option>
            ))}
          </select>
        </label>
        <label class="field">
          <span>Tipo de ejercicio</span>
          <select value={type} onChange={(e) => setType(e.currentTarget.value)}>
            <option value="all">Todos</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option value={k}>{v}</option>
            ))}
          </select>
        </label>
        <label class="field">
          <span>Número de ejercicios</span>
          <select value={String(count)} onChange={(e) => setCount(Number(e.currentTarget.value))}>
            {[10, 20, 30, 50].map((n) => (
              <option value={String(n)}>{n}</option>
            ))}
          </select>
        </label>
        <button class="btn-primary btn-block" disabled={!pool.length} onClick={() => start('Drill a medida', pool)}>
          Empezar ({Math.min(pool.length, count)} de {pool.length})
        </button>
      </div>

      <h2>Destrezas</h2>
      <div class="card">
        <p class="small muted">
          Vocabulario (SRS), comprensión de lectura y auditiva, expresión escrita y oral llegan en las próximas fases (2–5), con el formato del examen de la
          Universidad de Sevilla.
        </p>
        <div class="row wrap">
          {['Vocabulario', 'Lectura', 'Audición', 'Escritura', 'Oral'].map((s) => (
            <button class="grow btn-small" disabled>
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
