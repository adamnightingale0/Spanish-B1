import { useRef, useState } from 'preact/hooks';
import { useApp, navigate } from '../state';
import { readingTasks, listeningTasks, examProfile } from '../lib/content';
import type { ReadingTask, ListeningTask } from '../lib/schema';
import { ReadingRunner, gradeReading, type Answer } from './ReadingRunner';
import { ListeningRunner, gradeListening } from './ListeningRunner';
import { Timer, scorePct } from '../components/skills';

const leastRecent = <T extends { id: string }>(list: T[], ts: Map<string, number>) => [...list].sort((a, b) => (ts.get(a.id) ?? -1) - (ts.get(b.id) ?? -1))[0];

/** Weekly check (~15 min): one reading task and one listening task. Updates the estimates and the trend line. */
export function WeeklyPage() {
  const app = useApp();
  const [tasks] = useState(() => {
    const ts = new Map(app.skills.map((r) => [r.taskId, r.ts]));
    const read = leastRecent(readingTasks.filter((t) => t.taskFormat !== 'read-mcq'), ts) as ReadingTask;
    const listen = leastRecent(listeningTasks.filter((t) => t.taskFormat === 'listen-reply' || t.taskFormat === 'listen-speakers'), ts) as ListeningTask;
    return { read, listen };
  });
  const [step, setStep] = useState<'intro' | 'read' | 'listen' | 'done'>('intro');
  const [ra, setRa] = useState<Answer[]>(Array(tasks.read.taskFormat === 'read-match' ? 8 : 7).fill(null));
  const [la, setLa] = useState<Answer[]>(Array(tasks.listen.taskFormat === 'listen-reply' ? 6 : 7).fill(null));
  const [startedAt, setStartedAt] = useState(0);
  const laRef = useRef(la);
  laRef.current = la;

  const finish = () => {
    const now = Date.now();
    const g1 = gradeReading(tasks.read, ra);
    const g2 = gradeListening(tasks.listen, laRef.current);
    app.addSkillResult({ key: `${now}-${tasks.read.id}`, taskId: tasks.read.id, skill: 'reading', format: tasks.read.taskFormat, correct: g1.correct, total: g1.total, timed: true, weekly: true, ms: 0, ts: now, answers: ra });
    app.addSkillResult({ key: `${now + 1}-${tasks.listen.id}`, taskId: tasks.listen.id, skill: 'listening', format: tasks.listen.taskFormat, correct: g2.correct, total: g2.total, timed: true, weekly: true, ms: 0, ts: now + 1, answers: laRef.current });
    const scores = { reading: g1.correct / g1.total, listening: g2.correct / g2.total };
    const overall = (g1.correct + g2.correct) / (g1.total + g2.total);
    app.addExam({ key: `${now}`, profileId: examProfile.id, ts: now, scores, overall, passed: scores.reading >= 0.5 && scores.listening >= 0.5, kind: 'weekly' });
    setStep('done');
    window.scrollTo(0, 0);
  };

  if (step === 'intro')
    return (
      <div class="screen no-tabs">
        <a class="btn btn-ghost" href="#/home" style={{ paddingLeft: 0 }}>
          ‹ Volver
        </a>
        <h1>Control semanal</h1>
        <p class="muted">Unos 15 minutos: una tarea de lectura (10 min) y una de audición. Actualiza tus estimaciones y añade un punto a tu evolución.</p>
        <button
          class="btn-primary btn-big"
          onClick={() => {
            setStartedAt(Date.now());
            setStep('read');
          }}
        >
          Empezar
        </button>
      </div>
    );
  if (step === 'done') {
    const g1 = gradeReading(tasks.read, ra);
    const g2 = gradeListening(tasks.listen, la);
    return (
      <div class="screen no-tabs">
        <h1>Control semanal</h1>
        <div class="row">
          <div class="stat">
            <b>{scorePct(g1.correct, g1.total)} %</b>
            <span>lectura</span>
          </div>
          <div class="stat">
            <b>{scorePct(g2.correct, g2.total)} %</b>
            <span>audición</span>
          </div>
        </div>
        <ReadingRunner task={tasks.read} answers={ra} setAnswers={() => {}} review />
        <ListeningRunner task={tasks.listen} answers={la} setAnswers={() => {}} review onLocked={() => {}} />
        <button class="btn-primary btn-block" onClick={() => navigate('progress')}>
          Ver mi evolución
        </button>
      </div>
    );
  }
  return (
    <div class="screen no-tabs">
      <div class="drill-top">
        <span class="grow small muted">Control semanal · {step === 'read' ? '1/2 lectura' : '2/2 audición'}</span>
        {step === 'read' && <Timer seconds={10 * 60} running startedAt={startedAt} onEnd={() => setStep('listen')} />}
      </div>
      {step === 'read' ? (
        <>
          <ReadingRunner task={tasks.read} answers={ra} setAnswers={setRa} review={false} />
          <div class="sticky-actions">
            <button class="btn-primary grow" onClick={() => setStep('listen')}>
              Siguiente: audición →
            </button>
          </div>
        </>
      ) : (
        <ListeningRunner task={tasks.listen} answers={la} setAnswers={setLa} review={false} onLocked={finish} />
      )}
    </div>
  );
}
