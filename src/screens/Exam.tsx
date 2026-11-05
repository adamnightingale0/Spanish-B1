import { useState } from 'preact/hooks';
import { useApp } from '../state';
import { examProfile } from '../lib/content';
import { evaluateWritten, type Skill } from '../lib/exam';
import { daysUntil } from '../lib/stats';
import { Header } from '../components/common';

const RESOURCES = [
  { label: 'Examen de Español B1 (información)', url: 'https://institutodeidiomas.us.es/areas-idiomas/espanol/examen-espanol-b1' },
  { label: 'Programa Español B1', url: 'https://institutodeidiomas.us.es/areas-idiomas/espa%C3%B1ol/programa-espa%C3%B1ol-b1' },
  { label: 'Modelo: comprensión de lectura y auditiva (con claves, jun. 2025)', url: 'https://institutodeidiomas.us.es/sites/default/files/documentos/b1.modelo-de-examen-para-la-web-_revjun25_0.pdf' },
  { label: 'Modelo: expresión escrita', url: 'https://institutodeidiomas.us.es/sites/default/files/documentos/b1_eie_web.pdf' },
  { label: 'Modelo: expresión oral (tareas 2 y 3)', url: 'https://institutodeidiomas.us.es/sites/default/files/documentos/b1_eio_t2yt3_modelo_web_0.pdf' },
  { label: 'Contenidos y criterios de evaluación', url: 'https://institutodeidiomas.us.es/pruebasexamenes-de-acreditacion/sobre-las-pruebas/contenidos-y-criterios-de-evaluacion' },
  { label: 'Fechas de exámenes 2026–27', url: 'https://institutodeidiomas.us.es/cursos/examenes/fechas-de-examenes' }
];

const SKILL_LABEL: Record<string, string> = { reading: 'Lectura', listening: 'Audición', writing: 'Escritura' };

export function Exam() {
  const { settings } = useApp();
  const [scores, setScores] = useState<Record<Skill, number>>({ reading: 0.6, listening: 0.6, writing: 0.6, speaking: 0.6 });
  const r = evaluateWritten(examProfile, scores);
  return (
    <div class="screen">
      <Header title="Examen">
        <p class="muted small">{examProfile.name}</p>
      </Header>
      <div class="card">
        <b>Escrito: {daysUntil(settings.examDate)} días</b>
        <p class="small muted">Escrito el 18 de enero de 2027 (mañana). Oral entre el 4 y el 10 de febrero. Si no, la siguiente convocatoria escrita es el 7 de junio de 2027.</p>
      </div>

      <h2>Estructura</h2>
      <table class="simple">
        <thead>
          <tr>
            <th>Prueba</th>
            <th>Tiempo</th>
            <th>Peso</th>
          </tr>
        </thead>
        <tbody>
          {examProfile.papers.map((p) => (
            <tr>
              <td>
                <b>{p.label}</b>
                {p.tasks.map((t) => (
                  <div class="tiny muted">· {t.description}</div>
                ))}
              </td>
              <td>{p.minutes} min</td>
              <td>{p.weight ? `${p.weight * 100} %` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>¿Apruebo? Calculadora</h2>
      <div class="card">
        <p class="small muted">
          Para aprobar el escrito necesitas un 50 % de media <b>y</b> un 50 % en cada destreza. Una sola destreza por debajo del 50 % suspende todo el escrito.
        </p>
        {(['reading', 'listening', 'writing'] as Skill[]).map((s) => (
          <label class="field">
            <span>
              {SKILL_LABEL[s]}: <b>{Math.round(scores[s] * 100)} %</b>
            </span>
            <input type="range" min="0" max="100" value={scores[s] * 100} onInput={(e) => setScores({ ...scores, [s]: Number(e.currentTarget.value) / 100 })} />
          </label>
        ))}
        <div class={`feedback ${r.passed ? 'ok' : 'bad'}`}>
          <div class="verdict">
            {r.grade} · media {Math.round(r.overall * 100)} %
          </div>
          {r.failedSkills.length > 0 ? (
            <p class="small">Por debajo del 50 %: {r.failedSkills.map((s) => SKILL_LABEL[s]).join(', ')}. Aunque la media supere el 50 %, el escrito queda suspenso.</p>
          ) : (
            <p class="small">Destreza más débil: {SKILL_LABEL[r.weakest]}. Intenta tener un margen hasta el 60 % en todas.</p>
          )}
        </div>
      </div>
      <p class="small muted">Los simulacros cronometrados (lectura 60 min, audición 30, descanso 20, escritura 70) llegan en la fase 4.</p>

      <h2>Recursos oficiales</h2>
      <p class="tiny muted">Necesitan conexión. Se abren en la web del Instituto de Idiomas.</p>
      {RESOURCES.map((x) => (
        <a class="card tap" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }} href={x.url} target="_blank" rel="noopener">
          {x.label} ↗
        </a>
      ))}
    </div>
  );
}
