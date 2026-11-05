import { useEffect, useRef, useState } from 'preact/hooks';
import type { ListeningTask } from '../lib/schema';
import { FORMAT_LABELS } from '../lib/content';
import { playLines, stopSpeaking, spanishVoices, ttsSupported, type ScriptLine } from '../lib/tts';
import { Highlight, scorePct } from '../components/skills';
import { useApp } from '../state';
import type { Answer } from './ReadingRunner';

const GRACE_SECONDS = 30;

export function gradeListening(task: ListeningTask, answers: Answer[]) {
  let right: boolean[];
  if (task.taskFormat === 'listen-reply') right = task.items.map((it, i) => answers[i] === it.answer);
  else if (task.taskFormat === 'listen-speakers') right = task.statements.map((s, i) => answers[i] === s.answer);
  else right = task.questions.map((q, i) => answers[i] === q.answer);
  return { correct: right.filter(Boolean).length, total: right.length, right };
}

const prepSeconds = (t: ListeningTask) => (t.taskFormat === 'listen-reply' ? 30 : 45);

/** The order of playback: each recording twice, as in the exam. */
function playlist(task: ListeningTask): { lines: ScriptLine[]; item: number; round: number }[] {
  if (task.taskFormat === 'listen-reply') {
    return task.items.flatMap((it, i) => [1, 2].map((round) => ({ lines: [{ speaker: it.speaker, text: it.script }], item: i, round })));
  }
  const lines = task.script.map((l) => ({ speaker: l.speaker, text: l.line }));
  return [1, 2].map((round) => ({ lines, item: -1, round }));
}

type Phase = 'ready' | 'prep' | 'play' | 'grace' | 'done';

export function ListeningRunner({
  task,
  answers,
  setAnswers,
  review,
  onLocked,
  autoStart
}: {
  task: ListeningTask;
  answers: Answer[];
  setAnswers: (a: Answer[]) => void;
  review: boolean;
  onLocked: () => void;
  autoStart?: boolean;
}) {
  const app = useApp();
  const [phase, setPhase] = useState<Phase>(review ? 'done' : 'ready');
  const [rate, setRate] = useState(app.settings.ttsRate || 1);
  const [count, setCount] = useState(0);
  const [nowPlaying, setNowPlaying] = useState<{ item: number; round: number; line: number } | null>(null);
  const token = useRef({ cancelled: false });
  const hasVoice = ttsSupported && spanishVoices().length > 0;

  useEffect(() => () => {
    token.current.cancelled = true;
    stopSpeaking();
  }, []);

  // Simple countdown for prep and grace phases.
  useEffect(() => {
    if (phase !== 'prep' && phase !== 'grace') return;
    setCount(phase === 'prep' ? prepSeconds(task) : GRACE_SECONDS);
    const t = setInterval(() => setCount((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [phase]);
  useEffect(() => {
    if (count > 0) return;
    if (phase === 'prep') startPlay();
    else if (phase === 'grace') lock();
  }, [count]);
  useEffect(() => {
    if (autoStart && phase === 'ready') setPhase('prep');
  }, []);

  async function startPlay() {
    setPhase('play');
    for (const seg of playlist(task)) {
      if (token.current.cancelled) return;
      setNowPlaying({ item: seg.item, round: seg.round, line: 0 });
      await playLines(seg.lines, { rate, voiceURI: app.settings.voiceURI, onLine: (l) => setNowPlaying({ item: seg.item, round: seg.round, line: l }) }, token.current);
      await new Promise((r) => setTimeout(r, seg.item >= 0 ? 1500 : 3000));
    }
    if (!token.current.cancelled) setPhase('grace');
  }

  function lock() {
    token.current.cancelled = true;
    stopSpeaking();
    setPhase('done');
    onLocked();
  }

  const locked = phase === 'done';
  const set = (i: number, v: Answer) => {
    if (locked) return;
    const next = [...answers];
    next[i] = v;
    setAnswers(next);
  };
  const g = review ? gradeListening(task, answers) : null;
  const right = g?.right;

  return (
    <div>
      <p class="small muted">{FORMAT_LABELS[task.taskFormat].title}</p>
      <h2 style={{ marginTop: 4 }}>{task.title}</h2>
      <div class="practice-label">Solo práctica: las voces sintéticas son más fáciles de entender que las grabaciones reales del examen.</div>
      {'context' in task && <p class="small">{task.context}</p>}

      {phase === 'ready' && (
        <div class="player">
          {!hasVoice && (
            <p class="warn-line small">
              No hay ninguna voz en español instalada, así que no se oirá nada. En el iPhone: Ajustes → Accesibilidad → Contenido leído → Voces → Español (España).
            </p>
          )}
          <p class="small">Primero tendrás {prepSeconds(task)} segundos para leer las preguntas. Después escucharás cada audio dos veces.</p>
          <div class="row" style={{ justifyContent: 'center', margin: '8px 0' }}>
            <span class="small">Velocidad:</span>
            {[0.8, 1].map((r) => (
              <button class={`btn-small ${rate === r ? 'btn-primary' : ''}`} onClick={() => setRate(r)}>
                {r === 1 ? '1×' : '0,8×'}
              </button>
            ))}
          </div>
          <button class="btn-primary btn-block" onClick={() => setPhase('prep')}>
            Empezar
          </button>
        </div>
      )}
      {phase === 'prep' && (
        <div class="player">
          <div class="small muted">Tiempo de lectura</div>
          <div class="big">{count} s</div>
          <button class="btn-small" onClick={() => setCount(0)}>
            Empezar ya el audio
          </button>
        </div>
      )}
      {phase === 'play' && nowPlaying && (
        <div class="player">
          <div class="small muted">🔊 Escuchando · audición {nowPlaying.round} de 2</div>
          <div class="big">{task.taskFormat === 'listen-reply' ? `Monólogo ${nowPlaying.item + 1} de 6` : 'Conversación'}</div>
          <div class="progress">
            <i
              style={{
                width: `${task.taskFormat === 'listen-reply' ? ((nowPlaying.item * 2 + nowPlaying.round) / 12) * 100 : ((nowPlaying.round - 1) * 50 + ((nowPlaying.line + 1) / task.script.length) * 50)}%`
              }}
            />
          </div>
        </div>
      )}
      {phase === 'grace' && (
        <div class="player">
          <div class="small muted">Termina de contestar</div>
          <div class="big">{count} s</div>
          <button class="btn-primary btn-small" onClick={lock}>
            He terminado
          </button>
        </div>
      )}

      {g && (
        <div class={`feedback ${scorePct(g.correct, g.total) >= 50 ? 'ok' : 'bad'}`}>
          <div class="verdict">
            {g.correct}/{g.total} · {scorePct(g.correct, g.total)} %
          </div>
        </div>
      )}

      {phase !== 'ready' && <Questions task={task} answers={answers} set={set} right={right} locked={locked} highlight={phase === 'play' ? nowPlaying?.item : undefined} />}

      {review && <Transcript task={task} />}
    </div>
  );
}

function Questions({ task, answers, set, right, locked, highlight }: { task: ListeningTask; answers: Answer[]; set: (i: number, v: Answer) => void; right?: boolean[]; locked: boolean; highlight?: number }) {
  const opt = (i: number, k: number | string, label: string, correct: number | string) => {
    let cls = answers[i] === k ? 'sel' : '';
    if (right) cls = k === correct ? 'right' : answers[i] === k ? 'wrong' : '';
    return (
      <button class={`opt ${cls}`} disabled={locked} onClick={() => set(i, k)}>
        {label}
      </button>
    );
  };
  if (task.taskFormat === 'listen-reply') {
    return (
      <>
        {task.items.map((it, i) => (
          <div class="q-card" style={highlight === i ? { borderColor: 'var(--accent)' } : undefined}>
            <div class="q">Monólogo {i + 1}: ¿qué respondes?</div>
            {it.options.map((o, k) => opt(i, k, `${'abc'[k]}) ${o}`, it.answer))}
            {right && (
              <p class="small muted">
                «{it.script}» — {it.why}
              </p>
            )}
          </div>
        ))}
      </>
    );
  }
  if (task.taskFormat === 'listen-speakers') {
    const names = task.speakers;
    return (
      <>
        <p class="small">¿Quién lo dice? A = {names.A}, B = {names.B}, C = {names.C}, o ninguno.</p>
        {task.statements.map((s, i) => (
          <div class="q-card">
            <div class="q">
              {i + 1}. {s.s}
            </div>
            <div class="speaker-opts">
              {(['A', 'B', 'C', 'N'] as const).map((k) => opt(i, k, k === 'N' ? 'Ninguno' : `${k} · ${names[k]}`, s.answer))}
            </div>
            {right && <p class="small muted">«{s.evidence}»</p>}
          </div>
        ))}
      </>
    );
  }
  return (
    <>
      {task.questions.map((q, i) => (
        <div class="q-card">
          <div class="q">
            {i + 1}. {q.q}
          </div>
          {q.options.map((o, k) => opt(i, k, `${'abc'[k]}) ${o}`, q.answer))}
        </div>
      ))}
    </>
  );
}

function Transcript({ task }: { task: ListeningTask }) {
  if (task.taskFormat === 'listen-reply') return null;
  const ev = task.taskFormat === 'listen-speakers' ? task.statements.map((s) => s.evidence) : task.questions.map((q) => q.evidence);
  const name = (s: string) => (task.taskFormat === 'listen-speakers' ? task.speakers[s as 'A' | 'B' | 'C'] : s);
  return (
    <>
      <h3>Transcripción</h3>
      <div class="card transcript">
        {task.script.map((l) => (
          <p>
            <b>{name(l.speaker)}:</b> <Highlight text={l.line} marks={ev.map((e) => ({ needle: e }))} />
          </p>
        ))}
      </div>
    </>
  );
}
