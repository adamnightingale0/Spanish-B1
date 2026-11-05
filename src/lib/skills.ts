import type { SkillResult } from './db';
import { readingTasks, listeningTasks, READING_FORMATS, LISTENING_FORMATS } from './content';

export type SkillId = 'reading' | 'listening';
export const SKILL_LABEL: Record<SkillId, string> = { reading: 'Comprensión de lectura', listening: 'Comprensión auditiva' };
export const tasksFor = (s: SkillId) => (s === 'reading' ? readingTasks : listeningTasks);
export const formatsFor = (s: SkillId) => (s === 'reading' ? READING_FORMATS : LISTENING_FORMATS);
export const PAPER_MINUTES: Record<SkillId, number> = { reading: 60, listening: 30 };

/** Estimate on the exam scale: the last 5 timed results of each format, pooled. Null until there is one. */
export function skillEstimate(results: SkillResult[], skill: SkillId): { pct: number | null; n: number } {
  let c = 0;
  let t = 0;
  let n = 0;
  for (const f of formatsFor(skill)) {
    const last = results.filter((r) => r.skill === skill && r.format === f && r.timed).slice(-5);
    for (const r of last) {
      c += r.correct;
      t += r.total;
      n++;
    }
  }
  return { pct: t ? c / t : null, n };
}

/** For each format, the task done least recently (never-done tasks first). */
export function pickPaper(results: SkillResult[], skill: SkillId) {
  const last = new Map<string, number>();
  for (const r of results) last.set(r.taskId, r.ts);
  return formatsFor(skill).map((f) =>
    tasksFor(skill)
      .filter((t) => t.taskFormat === f)
      .sort((a, b) => (last.get(a.id) ?? -1) - (last.get(b.id) ?? -1) || a.id.localeCompare(b.id))[0]
  );
}

/** Suggestion for Home: the format with the lowest recent score, or one never tried. */
export function suggestTask(results: SkillResult[]) {
  const all = [...readingTasks, ...listeningTasks];
  const lastTs = new Map<string, number>();
  for (const r of results) lastTs.set(r.taskId, r.ts);
  const fmtScore = (f: string) => {
    const rs = results.filter((r) => r.format === f).slice(-3);
    return rs.length ? rs.reduce((s, r) => s + r.correct / r.total, 0) / rs.length : -1;
  };
  const formats = [...READING_FORMATS, ...LISTENING_FORMATS].sort((a, b) => fmtScore(a) - fmtScore(b));
  const f = formats[0];
  return all.filter((t) => t.taskFormat === f).sort((a, b) => (lastTs.get(a.id) ?? -1) - (lastTs.get(b.id) ?? -1))[0];
}
