import { useEffect, useState } from 'preact/hooks';
import { useApp, navigate } from '../state';
import { examProfile, writingSets } from '../lib/content';
import { evaluateWritten, type Skill } from '../lib/exam';
import { loadMockState, saveMockState, clearMockState, loadDraft, saveDraft } from '../lib/db';
import { SKILL_SHORT } from '../lib/skills';
import { WRITING_MINUTES, countWords } from '../lib/writing';
import { PaperPage } from './Skills';
import { WritingEditor, WritingReview, useDraft, scoreDraft } from './Writing';
import { Timer, Tabs } from '../components/skills';
import type { WritingTask } from '../lib/schema';

type Stage = 'intro' | 'reading' | 'listening' | 'break' | 'writing' | 'assess1' | 'assess2' | 'results';
interface MockState {
  id: number;
  stage: Stage;
  scores: Partial<Record<Skill, number>>;
  set: number;
  choice: string | null;
  breakStart?: number;
  writingStart?: number;
  writingPoints?: number[];
}

const BREAK_MINUTES = 20;

/** Full timed written mock: reading 60' → listening 30' → break 20' → writing 70', then self-assessment and the pass rules. */
export function MockPage() {
  const app = useApp();
  const [m, setM] = useState<MockState | null>(null);
  useEffect(() => {
    loadMockState<MockState>().then((saved) => {
      if (saved && saved.stage !== 'results') return setM(saved);
      const usedSets = new Map<number, number>();
      for (const r of app.skills) if (r.mock && r.skill === 'writing') usedSets.set(Number(r.taskId.match(/-0?(\d+)/)?.[1] ?? 0), r.ts);
      const set = [...writingSets].sort((a, b) => (usedSets.get(a.set) ?? 0) - (usedSets.get(b.set) ?? 0))[0]?.set ?? 1;
      setM({ id: Date.now(), stage: 'intro', scores: {}, set, choice: null });
    });
  }, []);
  if (!m) return <div class="screen muted">Cargando…</div>;
  const update = (patch: Partial<MockState>) => {
    const next = { ...m, ...patch };
    setM(next);
    saveMockState(next);
    window.scrollTo(0, 0);
  };
  const set = writingSets.find((s) => s.set === m.set) ?? writingSets[0];
  const t2 = set.t2.find((t) => t.id === m.choice);

  switch (m.stage) {
    case 'intro':
      return (
        <div class="screen no-tabs">
          <a class="btn btn-ghost" href="#/exam" style={{ paddingLeft: 0 }}>
            ‹ Volver
          </a>
          <h1>Simulacro escrito completo</h1>
          <p class="muted">{examProfile.name}</p>
          <div class="card">
            <p>1. Comprensión de lectura · 60 min</p>
            <p>2. Comprensión auditiva · ~30 min</p>
            <p>Descanso · 20 min</p>
            <p>3. Expresión e interacción escritas · 70 min</p>
          </div>
          <p class="small">
            Para aprobar el escrito necesitas un <b>50 % de media y un 50 % en cada destreza</b>. Busca un sitio tranquilo y unas 3 horas. Si cierras la app, el
            simulacro sigue donde lo dejaste (la prueba que estabas haciendo vuelve a empezar).
          </p>
          <button class="btn-primary btn-big" onClick={() => update({ stage: 'reading' })}>
            Empezar el simulacro
          </button>
        </div>
      );
    case 'reading':
      return <PaperPage key="r" skill="reading" onComplete={(f) => update({ stage: 'listening', scores: { ...m.scores, reading: f } })} />;
    case 'listening':
      return <PaperPage key="l" skill="listening" onComplete={(f) => update({ stage: 'break', breakStart: Date.now(), scores: { ...m.scores, listening: f } })} />;
    case 'break':
      return (
        <div class="screen no-tabs" style={{ textAlign: 'center' }}>
          <h1>Descanso</h1>
          <p class="muted">Bebe agua, estira las piernas. La prueba de expresión escrita empieza después.</p>
          <div class="player">
            <Timer seconds={BREAK_MINUTES * 60} running startedAt={m.breakStart ?? Date.now()} onEnd={() => update({ stage: 'writing', writingStart: Date.now() })} />
          </div>
          <button class="btn-primary btn-block" onClick={() => update({ stage: 'writing', writingStart: Date.now() })}>
            Empezar ya la expresión escrita
          </button>
        </div>
      );
    case 'writing':
      return <WritingPaper m={m} t1={set.t1} t2options={set.t2} onChoose={(id) => update({ choice: id })} onDone={() => update({ stage: 'assess1' })} />;
    case 'assess1':
    case 'assess2': {
      const task = m.stage === 'assess1' ? set.t1 : t2 ?? set.t2[0];
      return (
        <Assess
          key={m.stage}
          mockId={m.id}
          task={task}
          label={m.stage === 'assess1' ? 'Tarea 1' : 'Tarea 2'}
          onScored={(points) => {
            const pts = [...(m.writingPoints ?? []), points];
            if (m.stage === 'assess1') return update({ stage: 'assess2', writingPoints: pts });
            const writing = pts.reduce((a, b) => a + b, 0) / 24;
            const scores = { ...m.scores, writing };
            const r = evaluateWritten(examProfile, scores);
            app.addExam({ key: `${m.id}`, profileId: examProfile.id, ts: Date.now(), scores, overall: r.overall, passed: r.passed, kind: 'written' });
            clearMockState();
            update({ stage: 'results', writingPoints: pts, scores });
          }}
        />
      );
    }
    case 'results':
      return <MockResults scores={m.scores} />;
  }
}

function WritingPaper({ m, t1, t2options, onChoose, onDone }: { m: MockState; t1: WritingTask; t2options: WritingTask[]; onChoose: (id: string) => void; onDone: () => void }) {
  const [tab, setTab] = useState<'1' | '2'>('1');
  const t2 = t2options.find((t) => t.id === m.choice);
  const [d1, setD1] = useDraft(t1, `mock:${m.id}:${t1.id}`);
  const [d2, setD2] = useDraft(t2, t2 ? `mock:${m.id}:${t2.id}` : undefined);
  const submit = () => {
    if (d1) saveDraft(d1);
    if (d2) saveDraft(d2);
    onDone();
  };
  return (
    <div class="screen no-tabs">
      <div class="drill-top">
        <span class="grow small muted">Prueba 3 · Expresión escrita</span>
        <Timer seconds={WRITING_MINUTES * 60} running startedAt={m.writingStart ?? Date.now()} onEnd={submit} />
      </div>
      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { id: '1', label: `Tarea 1 · ${d1 ? countWords(d1.text) : 0} pal.` },
          { id: '2', label: `Tarea 2 · ${d2 ? countWords(d2.text) : 0} pal.` }
        ]}
      />
      {tab === '1' && d1 && <WritingEditor task={t1} draft={d1} setDraft={setD1} />}
      {tab === '2' &&
        (!t2 ? (
          <>
            <p>Elige una de estas dos propuestas:</p>
            {t2options.map((t) => (
              <div class="card tap" onClick={() => onChoose(t.id)}>
                <b>{t.title}</b>
                <p class="small">{t.prompt}</p>
              </div>
            ))}
          </>
        ) : (
          d2 && (
            <>
              <WritingEditor task={t2} draft={d2} setDraft={setD2} />
              {!d2.text && (
                <button class="btn-small" onClick={() => onChoose(t2options.find((t) => t.id !== t2.id)!.id)}>
                  Cambiar a la otra propuesta
                </button>
              )}
            </>
          )
        ))}
      <div class="sticky-actions">
        <button class="btn-primary grow" onClick={() => confirm('¿Entregar la expresión escrita?') && submit()}>
          Entregar
        </button>
      </div>
    </div>
  );
}

function Assess({ mockId, task, label, onScored }: { mockId: number; task: WritingTask; label: string; onScored: (points: number) => void }) {
  const app = useApp();
  const [draft, setDraft] = useState<Awaited<ReturnType<typeof loadDraft>> | null>(null);
  useEffect(() => {
    loadDraft(`mock:${mockId}:${task.id}`).then((d) => setDraft(d ?? { key: `mock:${mockId}:${task.id}`, taskId: task.id, text: '', covered: task.contentPoints.map(() => false), ts: Date.now() }));
  }, []);
  if (!draft) return <div class="screen muted">Cargando…</div>;
  return (
    <div class="screen no-tabs">
      <h1>Autoevaluación · {label}</h1>
      <p class="small muted">{task.title}</p>
      <WritingReview
        task={task}
        draft={draft}
        onScored={(self) => {
          const s = scoreDraft(task, draft, self);
          saveDraft({ ...draft, self, submitted: true });
          app.addSkillResult({ key: `${Date.now()}-${task.id}`, taskId: task.id, skill: 'writing', format: task.taskFormat, correct: s.points, total: s.max, timed: true, mock: true, ms: 0, ts: Date.now(), answers: [] });
          onScored(s.points);
        }}
      />
    </div>
  );
}

export function MockResults({ scores }: { scores: Partial<Record<Skill, number>> }) {
  const r = evaluateWritten(examProfile, scores);
  return (
    <div class="screen no-tabs">
      <h1>Resultado del simulacro</h1>
      <div class={`feedback ${r.passed ? 'ok' : 'bad'}`} style={{ textAlign: 'center' }}>
        <div class="score-big">{r.passed ? 'APTO' : 'SUSPENSO'}</div>
        <p>Media: {Math.round(r.overall * 100)} %</p>
      </div>
      {!r.passed && r.overall >= 0.5 && (
        <div class="banner">
          <b>Ojo:</b> tu media supera el 50 %, pero {r.failedSkills.map((s) => SKILL_SHORT[s].toLowerCase()).join(' y ')} está por debajo del 50 %, así que el escrito
          queda suspenso (SUSPENSO, 3).
        </div>
      )}
      <div class="card">
        {(['reading', 'listening', 'writing'] as Skill[]).map((s) => {
          const v = r.perSkill[s] ?? 0;
          return (
            <div style={{ margin: '10px 0' }}>
              <div class="row spread small">
                <span>{SKILL_SHORT[s]}</span>
                <b class={v < 0.5 ? 'bad-text' : v < 0.6 ? 'warn-line' : 'ok-text'}>{Math.round(v * 100)} %</b>
              </div>
              <div class={`bar skill-bar ${v >= 0.6 ? '' : v >= 0.5 ? 'mid' : 'low'}`}>
                <i style={{ width: `${Math.max(4, v * 100)}%` }} />
                <span class="line50" />
                <span class="line60" />
              </div>
            </div>
          );
        })}
      </div>
      <p class="small">
        Destreza más débil: <b>{SKILL_SHORT[r.weakest]}</b>. Una sola destreza por debajo del 50 % suspende todo el escrito, así que dedícale más tiempo esta
        semana.
      </p>
      <button class="btn-primary btn-block" onClick={() => navigate('exam')}>
        Terminar
      </button>
    </div>
  );
}
