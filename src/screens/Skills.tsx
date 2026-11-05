import { useRef, useState } from 'preact/hooks';
import { useApp, navigate } from '../state';
import { skillTaskById, FORMAT_LABELS } from '../lib/content';
import type { ReadingTask, ListeningTask } from '../lib/schema';
import { SKILL_LABEL, tasksFor, formatsFor, skillEstimate, pickPaper, PAPER_MINUTES, type SkillId } from '../lib/skills';
import { ReadingRunner, gradeReading, type Answer } from './ReadingRunner';
import { ListeningRunner, gradeListening } from './ListeningRunner';
import { Timer, Tabs, scorePct } from '../components/skills';
import { pct } from '../components/common';

const skillOf = (t: ReadingTask | ListeningTask): SkillId => (t.taskFormat.startsWith('read') ? 'reading' : 'listening');
const itemsOf = (t: ReadingTask | ListeningTask) => FORMAT_LABELS[t.taskFormat].items;
const grade = (t: ReadingTask | ListeningTask, a: Answer[]) =>
  skillOf(t) === 'reading' ? gradeReading(t as ReadingTask, a) : gradeListening(t as ListeningTask, a);

export function SkillList({ skill }: { skill: SkillId }) {
  const app = useApp();
  const est = skillEstimate(app.skills, skill);
  const lastFor = (id: string) => app.skills.filter((r) => r.taskId === id).slice(-1)[0];
  return (
    <div class="screen">
      <a class="btn btn-ghost" href="#/practice" style={{ paddingLeft: 0 }}>
        ‹ Volver
      </a>
      <h1>{skill === 'reading' ? 'Lectura' : 'Audición'}</h1>
      <p class="small muted">Formato del examen B1 de la Universidad de Sevilla · {SKILL_LABEL[skill]}</p>
      <div class="row" style={{ margin: '10px 0' }}>
        <div class="stat">
          <b>{pct(est.pct)}</b>
          <span>estimación (últimas 5 por tarea)</span>
        </div>
        <div class="stat">
          <b>50 %</b>
          <span>mínimo para aprobar</span>
        </div>
      </div>
      <button class="btn-primary btn-big" onClick={() => navigate(`paper/${skill}`)}>
        ⏱ Prueba completa · {PAPER_MINUTES[skill]} min
      </button>
      {skill === 'listening' && <div class="practice-label">Solo práctica: las voces sintéticas son más fáciles que las grabaciones del examen.</div>}
      {formatsFor(skill).map((f) => (
        <>
          <h2>{FORMAT_LABELS[f].title}</h2>
          {tasksFor(skill)
            .filter((t) => t.taskFormat === f)
            .map((t) => {
              const l = lastFor(t.id);
              return (
                <div class="card tap row spread" onClick={() => navigate(`task/${t.id}`)}>
                  <div>
                    <b>{t.title}</b>
                    {'topic' in t && <div class="tiny muted">{t.topic}</div>}
                  </div>
                  <span class="pill">{l ? `${l.correct}/${l.total}` : 'nueva'}</span>
                </div>
              );
            })}
        </>
      ))}
    </div>
  );
}

/** A single task, optionally timed (20 min for reading tasks; listening always follows exam timing). */
export function TaskPage({ id }: { id: string }) {
  const app = useApp();
  const task = skillTaskById.get(id);
  const [answers, setAnswers] = useState<Answer[]>(() => Array(task ? itemsOf(task) : 0).fill(null));
  const [review, setReview] = useState(false);
  const [started, setStarted] = useState<number | null>(null);
  const [timed, setTimed] = useState(true);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  if (!task) return <div class="screen">Tarea no encontrada.</div>;
  const skill = skillOf(task);
  const minutes = FORMAT_LABELS[task.taskFormat].minutes;

  function save() {
    const answers = answersRef.current;
    const g = grade(task!, answers);
    app.addSkillResult({
      key: `${Date.now()}-${task!.id}`,
      taskId: task!.id,
      skill,
      format: task!.taskFormat,
      correct: g.correct,
      total: g.total,
      timed: skill === 'listening' || timed,
      ms: Date.now() - (started ?? Date.now()),
      ts: Date.now(),
      answers
    });
    setReview(true);
    window.scrollTo(0, 0);
  }

  const header = (
    <div class="drill-top">
      <a class="btn btn-ghost" href={`#/${skill}`} aria-label="Salir">
        ✕
      </a>
      <span class="grow small muted">{FORMAT_LABELS[task.taskFormat].short}</span>
      {skill === 'reading' && started && timed && !review && <Timer seconds={minutes * 60} running={!review} startedAt={started} onEnd={save} />}
    </div>
  );

  if (skill === 'reading' && !started) {
    return (
      <div class="screen no-tabs">
        {header}
        <h1>{task.title}</h1>
        <p class="muted">{FORMAT_LABELS[task.taskFormat].title}</p>
        <label class="row card">
          <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.currentTarget.checked)} style={{ width: 24, height: 24 }} />
          <span>Cronometrado: {minutes} minutos, como en el examen</span>
        </label>
        <button class="btn-primary btn-big" onClick={() => setStarted(Date.now())}>
          Empezar
        </button>
      </div>
    );
  }

  return (
    <div class="screen no-tabs">
      {header}
      {skill === 'reading' ? (
        <ReadingRunner task={task as ReadingTask} answers={answers} setAnswers={setAnswers} review={review} />
      ) : (
        <ListeningRunner
          key={review ? 'r' : 'p'}
          task={task as ListeningTask}
          answers={answers}
          setAnswers={setAnswers}
          review={review}
          onLocked={() => {
            setStarted((s) => s ?? Date.now());
            save();
          }}
        />
      )}
      <div class="sticky-actions">
        {!review && skill === 'reading' && (
          <button
            class="btn-primary grow"
            onClick={() => {
              const empty = answers.filter((a) => a === null || a === undefined).length;
              if (empty && !confirm(`Te faltan ${empty} respuestas. ¿Corregir igualmente?`)) return;
              save();
            }}
          >
            Corregir
          </button>
        )}
        {review && (
          <button class="btn-primary grow" onClick={() => navigate(skill)}>
            Volver a {skill === 'reading' ? 'Lectura' : 'Audición'}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Full paper: one task of each format. Reading: 60 minutes, free to move between tasks, corrected at
 * the end. Listening: the three tasks in a row with exam timing, no going back.
 */
export function PaperPage({ skill, onComplete }: { skill: SkillId; onComplete?: (fraction: number) => void }) {
  const app = useApp();
  const [tasks] = useState(() => pickPaper(app.skills, skill));
  const [answers, setAnswers] = useState<Answer[][]>(() => tasks.map((t) => Array(itemsOf(t)).fill(null)));
  const [cur, setCur] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [reviewing, setReviewing] = useState(0);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const setFor = (i: number) => (a: Answer[]) => setAnswers((prev) => prev.map((x, k) => (k === i ? a : x)));

  function finish(final = answersRef.current) {
    const now = Date.now();
    tasks.forEach((t, i) => {
      const g = grade(t, final[i]);
      app.addSkillResult({ key: `${now + i}-${t.id}`, taskId: t.id, skill, format: t.taskFormat, correct: g.correct, total: g.total, timed: true, paper: true, mock: !!onComplete, ms: now - (startedAt ?? now), ts: now + i, answers: final[i] });
    });
    if (onComplete) {
      const gs = tasks.map((t, i) => grade(t, final[i]));
      onComplete(gs.reduce((s, g) => s + g.correct, 0) / gs.reduce((s, g) => s + g.total, 0));
      return;
    }
    setDone(true);
    window.scrollTo(0, 0);
  }

  if (!startedAt) {
    return (
      <div class="screen no-tabs">
        {!onComplete && (
          <a class="btn btn-ghost" href={`#/${skill}`} style={{ paddingLeft: 0 }}>
            ‹ Volver
          </a>
        )}
        <h1>{onComplete ? (skill === 'reading' ? 'Prueba 1 · Comprensión de lectura' : 'Prueba 2 · Comprensión auditiva') : 'Prueba completa'}</h1>
        <p class="muted">
          {SKILL_LABEL[skill]} · {PAPER_MINUTES[skill]} minutos · {tasks.reduce((s, t) => s + itemsOf(t), 0)} preguntas
        </p>
        <div class="card">
          {tasks.map((t, i) => (
            <p class="small">
              <b>Tarea {i + 1}:</b> {FORMAT_LABELS[t.taskFormat].short} · {t.title}
            </p>
          ))}
        </div>
        <p class="small muted">
          {skill === 'reading'
            ? 'Puedes pasar de una tarea a otra cuando quieras. Al terminar el tiempo, la prueba se corrige automáticamente.'
            : 'Las tres tareas se hacen seguidas, como en el examen: tiempo de lectura, cada audio dos veces y no se puede volver atrás.'}
        </p>
        <button class="btn-primary btn-big" onClick={() => setStartedAt(Date.now())}>
          Empezar la prueba
        </button>
      </div>
    );
  }

  if (done) {
    const gs = tasks.map((t, i) => grade(t, answers[i]));
    const c = gs.reduce((s, g) => s + g.correct, 0);
    const tot = gs.reduce((s, g) => s + g.total, 0);
    const p = scorePct(c, tot);
    return (
      <div class="screen no-tabs">
        <h1>Resultado</h1>
        <div class={`feedback ${p >= 50 ? 'ok' : 'bad'}`} style={{ textAlign: 'center' }}>
          <div class="score-big">{p} %</div>
          <p>
            {c}/{tot} · {p >= 60 ? 'Aprobado con margen' : p >= 50 ? 'Aprobado justo: intenta llegar al 60 %' : 'Por debajo del 50 %: esta destreza suspendería el escrito'}
          </p>
        </div>
        <Tabs value={String(reviewing)} onChange={(v) => setReviewing(Number(v))} options={tasks.map((t, i) => ({ id: String(i), label: `T${i + 1} · ${gs[i].correct}/${gs[i].total}` }))} />
        {skill === 'reading' ? (
          <ReadingRunner key={reviewing} task={tasks[reviewing] as ReadingTask} answers={answers[reviewing]} setAnswers={() => {}} review />
        ) : (
          <ListeningRunner key={reviewing} task={tasks[reviewing] as ListeningTask} answers={answers[reviewing]} setAnswers={() => {}} review onLocked={() => {}} />
        )}
        <button class="btn-primary btn-block" style={{ marginTop: 16 }} onClick={() => navigate(skill)}>
          Terminar
        </button>
      </div>
    );
  }

  const t = tasks[cur];
  return (
    <div class="screen no-tabs">
      <div class="drill-top">
        <span class="grow small muted">
          Tarea {cur + 1} de {tasks.length}
        </span>
        {skill === 'reading' && <Timer seconds={PAPER_MINUTES.reading * 60} running startedAt={startedAt} onEnd={() => finish()} />}
      </div>
      {skill === 'reading' && <Tabs value={String(cur)} onChange={(v) => setCur(Number(v))} options={tasks.map((_, i) => ({ id: String(i), label: `Tarea ${i + 1}` }))} />}
      {skill === 'reading' ? (
        <ReadingRunner key={cur} task={t as ReadingTask} answers={answers[cur]} setAnswers={setFor(cur)} review={false} />
      ) : (
        <ListeningRunner
          key={cur}
          task={t as ListeningTask}
          answers={answers[cur]}
          setAnswers={setFor(cur)}
          review={false}
          autoStart={cur > 0}
          onLocked={() => {
            if (cur + 1 < tasks.length) setCur(cur + 1);
            else finish();
          }}
        />
      )}
      {skill === 'reading' && (
        <div class="sticky-actions">
          {cur + 1 < tasks.length ? (
            <button class="btn-primary grow" onClick={() => setCur(cur + 1)}>
              Siguiente tarea →
            </button>
          ) : (
            <button class="btn-primary grow" onClick={() => confirm('¿Entregar la prueba?') && finish()}>
              Entregar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
