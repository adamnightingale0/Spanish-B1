import type { ExamProfile } from './schema';

export type Skill = 'reading' | 'listening' | 'writing' | 'speaking';
export const WRITTEN_SKILLS: Skill[] = ['reading', 'listening', 'writing'];

export interface WrittenResult {
  passed: boolean;
  overall: number; // 0..1, weighted over the written skills
  perSkill: Record<string, number>;
  failedSkills: Skill[];
  weakest: Skill;
  grade: 'APTO' | 'SUSPENSO, 3';
}

/** Written exam: ≥ minOverall overall AND ≥ minPerSkill in each of reading, listening and writing. */
export function evaluateWritten(profile: ExamProfile, scores: Partial<Record<Skill, number>>): WrittenResult {
  const { minOverall, minPerSkill } = profile.passRule;
  const papers = profile.papers.filter((p) => p.written && p.weight > 0);
  let wsum = 0;
  let total = 0;
  const perSkill: Record<string, number> = {};
  for (const p of papers) {
    const s = clamp01(scores[p.skill as Skill] ?? 0);
    perSkill[p.skill] = s;
    total += s * p.weight;
    wsum += p.weight;
  }
  const overall = wsum ? total / wsum : 0;
  const failedSkills = WRITTEN_SKILLS.filter((s) => (perSkill[s] ?? 0) < minPerSkill);
  const weakest = WRITTEN_SKILLS.reduce((a, b) => ((perSkill[b] ?? 0) < (perSkill[a] ?? 0) ? b : a));
  const passed = overall >= minOverall && failedSkills.length === 0;
  return { passed, overall, perSkill, failedSkills, weakest, grade: passed ? 'APTO' : 'SUSPENSO, 3' };
}

/** Oral: ≥ 50% of its maximum, and only once the written exam has been passed. */
export function evaluateOral(profile: ExamProfile, speaking: number, writtenPassed: boolean) {
  const passed = (!profile.passRule.oralRequiresWrittenPass || writtenPassed) && speaking >= profile.passRule.minPerSkill;
  return { passed, grade: passed ? 'APTO' : 'SUSPENSO, 4', carriesWritten: writtenPassed && profile.passRule.carryWrittenPass };
}

/** Self-assessment: each criterion 0–3, total converted to a fraction. */
export function criteriaToScore(scores: number[]): number {
  if (!scores.length) return 0;
  return scores.reduce((a, b) => a + b, 0) / (scores.length * 3);
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
