import { useEffect, useRef, useState } from 'preact/hooks';
import { useApp, navigate } from '../state';
import { writingTasks, writingById, writingSets, FORMAT_LABELS } from '../lib/content';
import type { WritingTask } from '../lib/schema';
import { countWords, targetMet, targetHits, CRITERIA, writingScore, exportForMarking } from '../lib/writing';
import { loadDraft, saveDraft, type WritingDraft } from '../lib/db';
import { skillEstimate } from '../lib/skills';
import { Timer } from '../components/skills';
import { pct } from '../components/common';

/** The prompt, content-point checklist, target structures and a textarea with a live word count. */
export function WritingEditor({ task, draft, setDraft, locked }: { task: WritingTask; draft: WritingDraft; setDraft: (d: WritingDraft) => void; locked?: boolean }) {
  const words = countWords(draft.text);
  const [lo, hi] = task.wordRange;
  const wcls = words === 0 ? '' : words < lo || words > hi ? 'warn-line' : 'ok-text';
  return (
    <div>
      <p class="small muted">
        {FORMAT_LABELS[task.taskFormat].title} · {task.genre} · registro {task.register}
      </p>
      <h2 style={{ marginTop: 4 }}>{task.title}</h2>
      <div class="card">
        <p>{task.prompt}</p>
        <p class="small muted">Escribe entre {lo} y {hi} palabras. Marca cada punto cuando lo hayas tratado:</p>
        {task.contentPoints.map((p, i) => (
          <label class="check-row">
            <input
              type="checkbox"
              checked={!!draft.covered[i]}
              disabled={locked}
              onChange={(e) => {
                const covered = [...draft.covered];
                covered[i] = e.currentTarget.checked;
                setDraft({ ...draft, covered, ts: Date.now() });
              }}
            />
            <span>{p}</span>
          </label>
        ))}
      </div>
      <textarea
        class="writing-box"
        lang="es"
        spellcheck={false}
        autocorrect="off"
        autocapitalize="sentences"
        placeholder="Escribe tu texto aquí…"
        value={draft.text}
        readOnly={locked}
        onInput={(e) => setDraft({ ...draft, text: e.currentTarget.value, ts: Date.now() })}
      />
      <div class="row spread small">
        <span class={wcls}>
          <b>{words}</b> palabras {words > 0 && words < lo ? `(faltan ${lo - words})` : words > hi ? `(sobran ${words - hi})` : ''}
        </span>
        <span class="muted">Se guarda automáticamente</span>
      </div>
      <div class="card">
        <b class="small">Estructuras para lucirte</b>
        {task.targets.map((t) => {
          const met = targetMet(draft.text, t);
          return (
            <div class={`check-row small ${met ? 'ok-text' : 'muted'}`}>
              <span>{met ? '✓' : '○'}</span>
              <span>
                {t.label}
                {t.min > 1 ? ` · ${Math.min(targetHits(draft.text, t), t.min)}/${t.min}` : ''}
              </span>
            </div>
          );
        })}
        <p class="tiny muted">Detección automática aproximada: compruébalo tú también.</p>
      </div>
    </div>
  );
}

/** Model answer, useful phrases and self-assessment on the four official criteria (0–3). */
export function WritingReview({ task, draft, onScored }: { task: WritingTask; draft: WritingDraft; onScored: (self: number[]) => void }) {
  const [self, setSelf] = useState<number[]>(draft.self ?? [-1, -1, -1, -1]);
  const [copied, setCopied] = useState('');
  const done = self.every((s) => s >= 0);
  const score = done ? writingScore({ self, pointsCovered: task.contentPoints.map((_, i) => !!draft.covered[i]), words: countWords(draft.text) }, task.wordRange) : null;

  async function exportText() {
    const text = exportForMarking(task, draft.text);
    try {
      await navigator.clipboard.writeText(text);
      setCopied('Copiado. Pégalo en Claude o envíaselo a tu profesor/a.');
    } catch {
      try {
        await navigator.share({ text });
      } catch {
        setCopied('No se pudo copiar automáticamente.');
      }
    }
  }

  return (
    <div>
      <h3>Tu texto</h3>
      <div class="card writing-shown">{draft.text || <span class="muted">(vacío)</span>}</div>
      <button class="btn-block" onClick={exportText}>
        📋 Exportar para corregir (Claude o profesor/a)
      </button>
      {copied && <p class="small">{copied}</p>}

      <h3>Modelo de respuesta</h3>
      <div class="card writing-shown">{task.modelAnswer}</div>
      <h3>Frases útiles</h3>
      <div class="row wrap">
        {task.usefulPhrases.map((p) => (
          <span class="pill">{p}</span>
        ))}
      </div>

      <h3>Autoevaluación</h3>
      <p class="small muted">Compara tu texto con el modelo y puntúa cada criterio de 0 a 3.</p>
      {CRITERIA.map((c, i) => (
        <div class="q-card">
          <div class="q">{c.label}</div>
          {c.levels.map((l, k) => (
            <button
              class={`opt ${self[i] === k ? 'sel' : ''}`}
              disabled={!!draft.submitted}
              onClick={() => {
                const n = [...self];
                n[i] = k;
                setSelf(n);
              }}
            >
              <b>{k}</b> {l}
            </button>
          ))}
        </div>
      ))}
      {score && (
        <div class={`feedback ${score.points / score.max >= 0.5 ? 'ok' : 'bad'}`}>
          <div class="verdict">
            {score.points}/{score.max} · {Math.round((score.points / score.max) * 100)} %
          </div>
          {score.notes.map((n) => (
            <p class="small">{n}</p>
          ))}
        </div>
      )}
      {!draft.submitted && (
        <button class="btn-primary btn-block" disabled={!done} onClick={() => onScored(self)}>
          Guardar la nota
        </button>
      )}
    </div>
  );
}

const emptyDraft = (task: WritingTask, key = task.id): WritingDraft => ({ key, taskId: task.id, text: '', covered: task.contentPoints.map(() => false), ts: Date.now() });

/**
 * Keeps a draft in IndexedDB as the user types: saved at most 400 ms after any change (even while
 * typing non-stop), and straight away when the app goes to the background or closes.
 */
export function useDraft(task: WritingTask | undefined, key: string | undefined) {
  const [draft, setDraftState] = useState<WritingDraft | null>(null);
  const pending = useRef<WritingDraft | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const flush = () => {
    clearTimeout(timer.current);
    timer.current = undefined;
    if (pending.current) saveDraft(pending.current);
    pending.current = null;
  };
  useEffect(() => {
    if (!task || !key) return;
    loadDraft(key).then((d) => setDraftState(d && !d.submitted ? d : emptyDraft(task, key)));
  }, [key]);
  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && flush();
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);
    return () => {
      flush();
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
    };
  }, []);
  const setDraft = (d: WritingDraft) => {
    setDraftState(d);
    pending.current = d;
    if (timer.current === undefined) timer.current = window.setTimeout(flush, 400);
  };
  return [draft, setDraft] as const;
}

export function scoreDraft(task: WritingTask, d: WritingDraft, self: number[]) {
  return writingScore({ self, pointsCovered: task.contentPoints.map((_, i) => !!d.covered[i]), words: countWords(d.text) }, task.wordRange);
}

export function WritingPage({ id }: { id: string }) {
  const app = useApp();
  const task = writingById.get(id);
  const [draft, setDraft] = useDraft(task, task?.id);
  const [stage, setStage] = useState<'write' | 'review'>('write');
  const [timed, setTimed] = useState(false);
  const [startedAt] = useState(Date.now());
  if (!task) return <div class="screen">Tarea no encontrada.</div>;
  if (!draft) return <div class="screen muted">Cargando…</div>;

  const finishWriting = () => {
    setStage('review');
    window.scrollTo(0, 0);
  };
  const saveScore = (self: number[]) => {
    const s = scoreDraft(task, draft, self);
    const final = { ...draft, self, submitted: true, ts: Date.now() };
    saveDraft(final);
    setDraft(final);
    app.addSkillResult({ key: `${Date.now()}-${task.id}`, taskId: task.id, skill: 'writing', format: task.taskFormat, correct: s.points, total: s.max, timed, ms: Date.now() - startedAt, ts: Date.now(), answers: [] });
  };

  return (
    <div class="screen no-tabs">
      <div class="drill-top">
        <a class="btn btn-ghost" href="#/writing" aria-label="Salir">
          ✕
        </a>
        <span class="grow small muted">Escritura</span>
        {timed && stage === 'write' && <Timer seconds={35 * 60} running startedAt={startedAt} onEnd={finishWriting} />}
      </div>
      {stage === 'write' ? (
        <>
          <label class="row small" style={{ margin: '4px 0' }}>
            <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.currentTarget.checked)} style={{ width: 22, height: 22 }} />
            Cronometrar 35 minutos (la mitad de los 70 del examen)
          </label>
          <WritingEditor task={task} draft={draft} setDraft={setDraft} />
          <div class="sticky-actions">
            <button class="btn-primary grow" disabled={countWords(draft.text) < 20} onClick={finishWriting}>
              He terminado → ver modelo y autoevaluar
            </button>
          </div>
        </>
      ) : (
        <>
          <WritingReview task={task} draft={draft} onScored={saveScore} />
          {draft.submitted && (
            <button class="btn-primary btn-block" style={{ marginTop: 12 }} onClick={() => navigate('writing')}>
              Volver a Escritura
            </button>
          )}
        </>
      )}
    </div>
  );
}

export function WritingList() {
  const app = useApp();
  const est = skillEstimate(app.skills, 'writing');
  const last = (id: string) => app.skills.filter((r) => r.taskId === id).slice(-1)[0];
  return (
    <div class="screen">
      <a class="btn btn-ghost" href="#/practice" style={{ paddingLeft: 0 }}>
        ‹ Volver
      </a>
      <h1>Escritura</h1>
      <p class="small muted">
        Formato del examen: Tarea 1 obligatoria y Tarea 2 a elegir entre dos, 120–150 palabras cada una, 70 minutos en total. Corrección por autoevaluación con los
        cuatro criterios oficiales.
      </p>
      <div class="row" style={{ margin: '10px 0' }}>
        <div class="stat">
          <b>{pct(est.pct)}</b>
          <span>estimación (autoevaluación)</span>
        </div>
        <div class="stat">
          <b>{writingTasks.length}</b>
          <span>propuestas</span>
        </div>
      </div>
      <h2>Por unidad</h2>
      <p class="tiny muted">La tarea final de cada unidad del libro, en formato de examen (120–150 palabras).</p>
      {writingTasks
        .filter((t) => t.set === undefined)
        .sort((a, b) => a.unit - b.unit)
        .map((t) => {
          const l = last(t.id);
          return (
            <div class="card tap row spread" onClick={() => navigate(`write/${t.id}`)}>
              <div>
                <b>
                  U{t.unit} · {t.title}
                </b>
                <div class="tiny muted">{t.genre}</div>
              </div>
              <span class="pill">{l ? `${l.correct}/${l.total}` : 'nueva'}</span>
            </div>
          );
        })}
      <h2>Modelos de examen</h2>
      <p class="tiny muted">Cada modelo tiene una Tarea 1 obligatoria y dos propuestas para la Tarea 2, como en el examen. Los simulacros usan estos modelos.</p>
      {writingSets.map((s) => (
        <>
          <h3>Modelo {s.set}</h3>
          {[s.t1, ...s.t2].map((t) => {
            const l = last(t.id);
            return (
              <div class="card tap row spread" onClick={() => navigate(`write/${t.id}`)}>
                <div>
                  <b>{t.title}</b>
                  <div class="tiny muted">
                    {t.examTask === 1 ? 'Tarea 1' : 'Tarea 2'} · {t.genre}
                  </div>
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
