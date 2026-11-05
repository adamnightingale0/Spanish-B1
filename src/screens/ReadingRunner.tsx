import { useState } from 'preact/hooks';
import type { ReadingTask, ReadMcq, ReadMatch, ReadInsert } from '../lib/schema';
import { FORMAT_LABELS } from '../lib/content';
import { Highlight, Tabs, scorePct } from '../components/skills';

export type Answer = string | number | null;

export function gradeReading(task: ReadingTask, answers: Answer[]): { correct: number; total: number; right: boolean[] } {
  let right: boolean[];
  if (task.taskFormat === 'read-mcq') right = task.questions.map((q, i) => answers[i] === q.answer);
  else if (task.taskFormat === 'read-match') right = task.texts.map((t, i) => answers[i] === t.answer);
  else right = task.gaps.map((g, i) => answers[i] === g.answer);
  return { correct: right.filter(Boolean).length, total: right.length, right };
}

/**
 * One reading task. In `review` mode the answers are shown corrected, with the evidence
 * sentence (and, for read-insert, the cohesion clue) highlighted in the text.
 */
export function ReadingRunner({
  task,
  answers,
  setAnswers,
  review
}: {
  task: ReadingTask;
  answers: Answer[];
  setAnswers: (a: Answer[]) => void;
  review: boolean;
}) {
  const set = (i: number, v: Answer) => {
    if (review) return;
    const next = [...answers];
    next[i] = v;
    setAnswers(next);
  };
  const g = review ? gradeReading(task, answers) : null;
  return (
    <div>
      <p class="small muted">{FORMAT_LABELS[task.taskFormat].title}</p>
      <h2 style={{ marginTop: 4 }}>{task.title}</h2>
      {g && (
        <div class={`feedback ${scorePct(g.correct, g.total) >= 50 ? 'ok' : 'bad'}`}>
          <div class="verdict">
            {g.correct}/{g.total} · {scorePct(g.correct, g.total)} %
          </div>
          <p class="small">Lo resaltado en amarillo es la frase del texto que da la respuesta{task.taskFormat === 'read-insert' ? '; en verde, la pista de cohesión.' : '.'}</p>
        </div>
      )}
      {task.taskFormat === 'read-mcq' && <Mcq task={task} answers={answers} set={set} right={g?.right} />}
      {task.taskFormat === 'read-match' && <Match task={task} answers={answers} set={set} right={g?.right} />}
      {task.taskFormat === 'read-insert' && <Insert task={task} answers={answers} set={set} right={g?.right} />}
    </div>
  );
}

type Props<T> = { task: T; answers: Answer[]; set: (i: number, v: Answer) => void; right?: boolean[] };

function Mcq({ task, answers, set, right }: Props<ReadMcq>) {
  const [tab, setTab] = useState<'text' | 'q'>('text');
  const done = answers.filter((a) => a !== null && a !== undefined).length;
  const show = (i: number) => {
    setTab('text');
    requestAnimationFrame(() => document.getElementById(`ev-${i}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  };
  return (
    <>
      <Tabs value={tab} onChange={setTab} options={[{ id: 'text', label: 'Texto' }, { id: 'q', label: `Preguntas (${done}/7)` }]} />
      {tab === 'text' ? (
        <div class="reading-text">
          {task.text.map((p) => (
            <p>{right ? <Highlight text={p} marks={task.questions.map((q, i) => ({ needle: q.evidence, id: `ev-${i}` }))} /> : p}</p>
          ))}
          {!right && (
            <button class="btn-block" onClick={() => setTab('q')}>
              Ir a las preguntas →
            </button>
          )}
        </div>
      ) : (
        task.questions.map((q, i) => (
          <div class="q-card">
            <div class="q">
              {i + 1}. {q.q}
            </div>
            {q.options.map((o, k) => {
              let cls = answers[i] === k ? 'sel' : '';
              if (right) cls = k === q.answer ? 'right' : answers[i] === k ? 'wrong' : '';
              return (
                <button class={`opt ${cls}`} disabled={!!right} onClick={() => set(i, k)}>
                  <b>{'abc'[k]})</b> {o}
                </button>
              );
            })}
            {right && (
              <button class="btn-ghost btn-small" onClick={() => show(i)}>
                Ver en el texto
              </button>
            )}
          </div>
        ))
      )}
    </>
  );
}

function Match({ task, answers, set, right }: Props<ReadMatch>) {
  const [tab, setTab] = useState<'people' | 'texts'>('people');
  const done = answers.filter(Boolean).length;
  const profile = (id: string) => task.profiles.find((p) => p.id === id)?.text ?? '';
  return (
    <>
      <p class="small">{task.instruction}</p>
      <Tabs value={tab} onChange={setTab} options={[{ id: 'people', label: 'Personas (A–J)' }, { id: 'texts', label: `Textos (${done}/8)` }]} />
      {tab === 'people' ? (
        <>
          {task.profiles.map((p) => (
            <div class="q-card small">
              <b>{p.id}.</b> {p.text}
            </div>
          ))}
          <button class="btn-block" onClick={() => setTab('texts')}>
            Ir a los textos →
          </button>
        </>
      ) : (
        task.texts.map((t, i) => (
          <div class="q-card">
            <div class="q">
              {i + 1}. {t.title}
            </div>
            <p class="small">{right ? <Highlight text={t.text} marks={[{ needle: t.evidence }]} /> : t.text}</p>
            <select value={(answers[i] as string) ?? ''} disabled={!!right} onChange={(e) => set(i, e.currentTarget.value || null)} aria-label={`Persona para el texto ${i + 1}`}>
              <option value="">¿Para quién es?</option>
              {task.profiles.map((p) => (
                <option value={p.id}>
                  {p.id} · {p.text.slice(0, 48)}
                  {p.text.length > 48 ? '…' : ''}
                </option>
              ))}
            </select>
            {right && (
              <p class={`small ${right[i] ? '' : 'warn-line'}`}>
                {right[i] ? '✓ ' : `✗ Era ${t.answer}: `}
                {right[i] ? profile(t.answer) : profile(t.answer)}
              </p>
            )}
          </div>
        ))
      )}
      {right && (
        <p class="small muted">
          Personas sin texto: {task.profiles.filter((p) => !task.texts.some((t) => t.answer === p.id)).map((p) => p.id).join(', ')}
        </p>
      )}
    </>
  );
}

function Insert({ task, answers, set, right }: Props<ReadInsert>) {
  const [tab, setTab] = useState<'text' | 'frags'>('text');
  const frag = (id: string | null | undefined) => task.fragments.find((f) => f.id === id);
  const used = new Set(answers.filter(Boolean) as string[]);
  const renderPara = (p: string) =>
    p.split(/(\{\{\d\}\})/).map((part) => {
      const m = part.match(/^\{\{(\d)\}\}$/);
      if (!m) return right ? <Highlight text={part} marks={task.gaps.map((g) => ({ needle: g.clue, cls: 'clue' }))} /> : part;
      const n = Number(m[1]);
      const gi = task.gaps.findIndex((g) => g.n === n);
      const chosen = answers[gi] as string | null;
      if (right) {
        const g = task.gaps[gi];
        const f = frag(g.answer)!;
        return (
          <span>
            <span class={`gap-btn filled ${right[gi] ? 'right' : 'wrong'}`}>{n}</span>{' '}
            <i>
              <Highlight text={f.text} marks={[{ needle: g.clue, cls: 'clue' }]} />
            </i>{' '}
          </span>
        );
      }
      return (
        <select class={`gap-btn ${chosen ? 'filled' : ''}`} value={chosen ?? ''} onChange={(e) => set(gi, e.currentTarget.value || null)} aria-label={`Hueco ${n}`}>
          <option value="">{n} ▾</option>
          {task.fragments.map((f) => (
            <option value={f.id}>
              {n} → {f.id}
              {used.has(f.id) && f.id !== chosen ? ' (usado)' : ''} · {f.text.slice(0, 40)}…
            </option>
          ))}
        </select>
      );
    });
  return (
    <>
      <p class="small">Elige el fragmento adecuado para cada hueco. Hay tres fragmentos que no tienes que usar.</p>
      <Tabs value={tab} onChange={setTab} options={[{ id: 'text', label: `Texto (${used.size}/7)` }, { id: 'frags', label: 'Fragmentos (A–J)' }]} />
      {tab === 'text' ? (
        <div class="reading-text">
          {task.text.map((p) => (
            <p>{renderPara(p)}</p>
          ))}
        </div>
      ) : (
        task.fragments.map((f) => (
          <div class="q-card small">
            <b>{f.id}.</b> {f.text} {used.has(f.id) && <span class="pill">usado</span>}
          </div>
        ))
      )}
      {right &&
        task.gaps.map((g, i) => (
          <div class="gap-row small">
            <b>
              {g.n}. {g.answer}
            </b>{' '}
            {right[i] ? '✓' : <span class="warn-line">✗ elegiste {(answers[i] as string) ?? '—'}</span>} · {g.why}
          </div>
        ))}
    </>
  );
}
