import { describe, it, expect } from 'vitest';
import { writingTasks, writingSets } from '../src/lib/content';
import { countWords, targetMet, writingScore, exportForMarking } from '../src/lib/writing';
import { checkDue, skillsAtRisk, skillEstimate, suggestTask } from '../src/lib/skills';
import type { ExamRecord, SkillResult } from '../src/lib/db';

describe('writing content', () => {
  it('has 4 exam sets: one Task 1 and two Task 2 options each', () => {
    expect(writingSets).toHaveLength(4);
    for (const s of writingSets) {
      expect(s.t1.examTask).toBe(1);
      expect(s.t2).toHaveLength(2);
    }
  });
  it('every model answer is 120–150 words and meets its own targets', () => {
    for (const t of writingTasks) {
      const n = countWords(t.modelAnswer);
      expect(n).toBeGreaterThanOrEqual(120);
      expect(n).toBeLessThanOrEqual(150);
      for (const tg of t.targets) expect(targetMet(t.modelAnswer, tg), `${t.id}: ${tg.label}`).toBe(true);
    }
  });
  it('targets are not met by an empty or unrelated text', () => {
    const t = writingTasks[0];
    for (const tg of t.targets) expect(targetMet('', tg)).toBe(false);
  });
});

describe('writing score', () => {
  it('sums the four criteria out of 12', () => {
    expect(writingScore({ self: [3, 3, 2, 2], pointsCovered: [true, true, true, true], words: 135 }).points).toBe(10);
  });
  it('caps task fulfilment at 1 when a content point is missing', () => {
    const s = writingScore({ self: [3, 3, 3, 3], pointsCovered: [true, false, true, true], words: 135 });
    expect(s.points).toBe(10);
    expect(s.notes.length).toBe(1);
  });
  it('takes a point off when the length is far outside 120–150', () => {
    expect(writingScore({ self: [3, 2, 2, 2], pointsCovered: [true, true, true, true], words: 90 }).points).toBe(8);
    expect(writingScore({ self: [3, 2, 2, 2], pointsCovered: [true, true, true, true], words: 160 }).points).toBe(9); // within 10 %
  });
  it('export for marking includes the prompt, the text and the criteria', () => {
    const out = exportForMarking(writingTasks[0], 'Mi texto de prueba.');
    expect(out).toContain(writingTasks[0].prompt);
    expect(out).toContain('Mi texto de prueba.');
    expect(out).toContain('Cumplimiento de la tarea');
  });
});

describe('diagnosis', () => {
  const r = (skill: 'reading' | 'listening' | 'writing', format: string, correct: number, total: number, i: number): SkillResult => ({ key: `${i}`, taskId: `t${i}`, skill, format, correct, total, timed: true, ms: 1, ts: i, answers: [] });
  it('writing estimate comes from self-assessment results', () => {
    expect(skillEstimate([r('writing', 'write-choice', 6, 12, 1)], 'writing').pct).toBe(0.5);
  });
  it('flags skills under 60 %, weakest first', () => {
    const res = [r('reading', 'read-mcq', 6, 7, 1), r('listening', 'listen-reply', 3, 6, 2), r('writing', 'write-choice', 5, 12, 3)];
    expect(skillsAtRisk(res).map((x) => x.skill)).toEqual(['writing', 'listening']);
  });
  it('suggests a task for the weakest skill', () => {
    const res = [r('reading', 'read-mcq', 7, 7, 1), r('listening', 'listen-reply', 6, 6, 2), r('writing', 'write-choice', 2, 12, 3)];
    expect(suggestTask(res)?.route.startsWith('write/')).toBe(true);
  });
  it('weekly check on Sundays before mid-December, full mock every 2 weeks after', () => {
    const sunday = new Date(2026, 10, 8, 10).getTime(); // Sun 8 Nov 2026
    const monday = new Date(2026, 10, 9, 10).getTime();
    const weekly = (ts: number): ExamRecord => ({ key: `${ts}`, profileId: 'us-b1', ts, scores: {}, overall: 0.6, passed: true, kind: 'weekly' });
    expect(checkDue([weekly(monday - 3 * 864e5)], sunday)).toBe('weekly');
    expect(checkDue([weekly(monday - 864e5)], monday)).toBe(null);
    const dec20 = new Date(2026, 11, 20).getTime();
    expect(checkDue([], dec20)).toBe('mock');
    expect(checkDue([{ ...weekly(dec20 - 5 * 864e5), kind: 'written' }], dec20)).toBe(null);
  });
});
