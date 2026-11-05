import type { SkillResult } from './db';
import { readingTasks, listeningTasks, writingTasks, READING_FORMATS, LISTENING_FORMATS, FORMAT_LABELS } from './content';
import type { ExamRecord } from './db';

export type SkillId = 'reading' | 'listening';
export type AnySkill = SkillId | 'writing';
export const SKILL_LABEL: Record<AnySkill | 'speaking', string> = { reading: 'Comprensión de lectura', listening: 'Comprensión auditiva', writing: 'Expresión escrita', speaking: 'Expresión oral' };
export const SKILL_SHORT: Record<AnySkill | 'speaking', string> = { reading: 'Lectura', listening: 'Audición', writing: 'Escritura', speaking: 'Oral' };
export const tasksFor = (s: SkillId) => (s === 'reading' ? readingTasks : listeningTasks);
export const formatsFor = (s: SkillId) => (s === 'reading' ? READING_FORMATS : LISTENING_FORMATS);
export const PAPER_MINUTES: Record<SkillId, number> = { reading: 60, listening: 30 };

/** Estimate on the exam scale: the last 5 timed results of each format, pooled. Null until there is one. */
export function skillEstimate(results: SkillResult[], skill: AnySkill): { pct: number | null; n: number } {
  let c = 0;
  let t = 0;
  let n = 0;
  const formats: readonly string[] = skill === 'writing' ? ['write-compulsory', 'write-choice'] : formatsFor(skill);
  for (const f of formats) {
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

/**
 * Suggestion for Home: the skill with the largest (1 − estimate) × exam weight (untried skills count as 50 %),
 * then its weakest or untried format, then the task done least recently. Returns a route.
 */
export function suggestTask(results: SkillResult[]): { route: string; title: string; label: string; minutes: number } | undefined {
  const skills: AnySkill[] = ['reading', 'listening', 'writing'];
  const need = (s: AnySkill) => 1 - (skillEstimate(results, s).pct ?? 0.5);
  const skill = [...skills].sort((a, b) => need(b) - need(a))[0];
  const lastTs = new Map<string, number>();
  for (const r of results) lastTs.set(r.taskId, r.ts);
  const fmtScore = (f: string) => {
    const rs = results.filter((r) => r.format === f).slice(-3);
    return rs.length ? rs.reduce((s, r) => s + r.correct / r.total, 0) / rs.length : -1;
  };
  const pool: { id: string; title: string; taskFormat: string }[] = skill === 'writing' ? writingTasks : skill === 'reading' ? readingTasks : listeningTasks;
  const formats = [...new Set(pool.map((t) => t.taskFormat))].sort((a, b) => fmtScore(a) - fmtScore(b));
  const t = pool.filter((x) => x.taskFormat === formats[0]).sort((a, b) => (lastTs.get(a.id) ?? -1) - (lastTs.get(b.id) ?? -1))[0];
  if (!t) return undefined;
  const label = skill === 'reading' ? '📖 Lectura del día' : skill === 'listening' ? '🎧 Audición del día' : '✍︎ Escritura del día';
  return { route: skill === 'writing' ? `write/${t.id}` : `task/${t.id}`, title: t.title, label, minutes: FORMAT_LABELS[t.taskFormat].minutes };
}

/** Skills below 60 % (the safety line) are "at risk": one skill under 50 % fails the whole written exam. */
export function skillsAtRisk(results: SkillResult[]): { skill: AnySkill; pct: number }[] {
  return (['reading', 'listening', 'writing'] as AnySkill[])
    .map((s) => ({ skill: s, pct: skillEstimate(results, s).pct }))
    .filter((x): x is { skill: AnySkill; pct: number } => x.pct !== null && x.pct < 0.6)
    .sort((a, b) => a.pct - b.pct);
}

const MID_DECEMBER = new Date(2026, 11, 15).getTime();

/**
 * Weekly check: on Sundays (or if none in the last 7 days), a 15-minute mini mock. From mid-December,
 * a full timed written mock every 2 weeks instead.
 */
export function checkDue(exams: ExamRecord[], now = Date.now()): 'weekly' | 'mock' | null {
  const lastWeekly = Math.max(0, ...exams.filter((e) => e.kind === 'weekly').map((e) => e.ts));
  const lastMock = Math.max(0, ...exams.filter((e) => e.kind === 'written').map((e) => e.ts));
  if (now >= MID_DECEMBER) return now - lastMock >= 14 * 864e5 ? 'mock' : null;
  const sunday = new Date(now).getDay() === 0;
  const sinceWeekly = now - lastWeekly;
  if ((sunday && sinceWeekly > 864e5) || sinceWeekly >= 8 * 864e5) return 'weekly';
  return null;
}
