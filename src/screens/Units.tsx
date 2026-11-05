import { useApp, navigate } from '../state';
import { units, unitByNumber, gpById, unitLabel, allItems } from '../lib/content';
import { buildDrill, masteryByPoint } from '../lib/session';
import { BookRef, Header, MasteryBar, Speak } from '../components/common';

export function Units() {
  const { settings, attempts } = useApp();
  const m = masteryByPoint(attempts);
  return (
    <div class="screen">
      <Header title="Unidades">
        <p class="muted small">Aula Internacional Plus 3 · todas las unidades disponibles desde el principio.</p>
      </Header>
      {units.map((u) => (
        <div class={`card tap ${u.unit === settings.classUnit ? 'highlight' : ''}`} onClick={() => navigate(`units/${u.unit}`)}>
          <div class="row spread">
            <b>
              {u.unit ? `${u.unit}. ` : ''}
              {u.title}
            </b>
            {u.unit === settings.classUnit && <span class="pill accent">📍 Tu clase está aquí</span>}
          </div>
          <p class="small muted">{u.theme}</p>
          <div class="stack" style={{ marginTop: 8 }}>
            {u.grammarPoints.map((g) => (
              <MasteryBar m={m.get(g)} label={gpById.get(g)?.title ?? g} />
            ))}
          </div>
          {u.vocabAreas.length > 0 && (
            <div class="row wrap" style={{ marginTop: 8 }}>
              {u.vocabAreas.map((v) => (
                <span class="pill">{v}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function UnitDetail({ unit }: { unit: number }) {
  const app = useApp();
  const u = unitByNumber.get(unit);
  if (!u) return <div class="screen">Unidad no encontrada.</div>;
  const m = masteryByPoint(app.attempts);
  const unitItems = allItems.filter((i) => i.unit === unit);
  const here = `units/${unit}`;
  return (
    <div class="screen">
      <Header title={`${u.unit ? u.unit + '. ' : ''}${u.title}`} back="units">
        <p class="muted">{u.theme}</p>
        <BookRef {...(u.bookRef ?? {})} />
        {u.writingTask && <p class="small">✍︎ Tarea final: {u.writingTask}</p>}
      </Header>

      <div class="row wrap">
        <button class="btn-primary grow" onClick={() => app.startSession({ title: unitLabel(unit), items: buildDrill(unitItems, app.attempts, 20) }, here)}>
          Drill ({unitItems.length})
        </button>
        <button class="grow" disabled title="Fase 2">Vocabulario</button>
        <button class="grow" disabled title="Fase 4">Escribir</button>
        <button class="grow" disabled title="Fase 5">Hablar</button>
      </div>
      <p class="tiny muted">Vocabulario, escritura y expresión oral llegan en las fases 2, 4 y 5.</p>

      {u.grammarPoints.map((id) => {
        const g = gpById.get(id)!;
        const items = allItems.filter((i) => i.grammarPoint === id);
        return (
          <div class="card">
            <h3 style={{ marginTop: 0 }}>{g.title}</h3>
            <MasteryBar m={m.get(id)} label="Dominio (últimos 20 intentos)" />
            <BookRef {...(g.bookRef ?? {})} />
            <p style={{ marginTop: 10 }}>{g.summary}</p>
            <ul class="small">
              {g.rules.map((r) => (
                <li>{r}</li>
              ))}
            </ul>
            {g.examples.map((e) => (
              <p class="small">
                <i>{e}</i> <Speak text={e} />
              </p>
            ))}
            <button class="btn-block" onClick={() => app.startSession({ title: g.title, items: buildDrill(items, app.attempts, 12) }, here)}>
              Practicar este punto ({items.length})
            </button>
          </div>
        );
      })}
    </div>
  );
}
