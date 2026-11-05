import { describe, it, expect } from 'vitest';
import { readingTasks, listeningTasks } from '../src/lib/content';
import { gradeReading } from '../src/screens/ReadingRunner';
import { gradeListening } from '../src/screens/ListeningRunner';
import { skillEstimate, pickPaper, suggestTask } from '../src/lib/skills';
import type { SkillResult } from '../src/lib/db';

const res = (taskId: string, format: string, skill: 'reading' | 'listening', correct: number, total: number, ts: number, timed = true): SkillResult => ({
  key: `${ts}`, taskId, skill, format, correct, total, timed, ms: 1, ts, answers: []
});

describe('content', () => {
  it('has at least two tasks of each Seville format', () => {
    for (const f of ['read-mcq', 'read-match', 'read-insert']) expect(readingTasks.filter((t) => t.taskFormat === f).length).toBeGreaterThanOrEqual(2);
    for (const f of ['listen-reply', 'listen-speakers', 'listen-interview']) expect(listeningTasks.filter((t) => t.taskFormat === f).length).toBeGreaterThanOrEqual(2);
  });
  it('the reading paper has 22 questions, as in the June 2025 sample', () => {
    const paper = pickPaper([], 'reading');
    const n = paper.reduce((s, t) => s + (t.taskFormat === 'read-match' ? 8 : 7), 0);
    expect(n).toBe(22);
  });
  it('match and insert answers are unique and distractors are left over', () => {
    for (const t of readingTasks) {
      if (t.taskFormat === 'read-match') expect(10 - new Set(t.texts.map((x) => x.answer)).size).toBe(2);
      if (t.taskFormat === 'read-insert') expect(10 - new Set(t.gaps.map((g) => g.answer)).size).toBe(3);
    }
  });
});

describe('grading', () => {
  it('scores reading answers', () => {
    const t = readingTasks.find((x) => x.taskFormat === 'read-mcq')!;
    if (t.taskFormat !== 'read-mcq') throw new Error();
    const all = t.questions.map((q) => q.answer);
    expect(gradeReading(t, all).correct).toBe(7);
    expect(gradeReading(t, [null, ...all.slice(1)]).correct).toBe(6);
  });
  it('scores listening answers', () => {
    const t = listeningTasks.find((x) => x.taskFormat === 'listen-speakers')!;
    if (t.taskFormat !== 'listen-speakers') throw new Error();
    expect(gradeListening(t, t.statements.map((s) => s.answer)).correct).toBe(7);
    expect(gradeListening(t, t.statements.map(() => 'N')).correct).toBe(t.statements.filter((s) => s.answer === 'N').length);
  });
});

describe('skill estimate', () => {
  it('uses only the last 5 timed results of each format', () => {
    const r: SkillResult[] = [];
    for (let i = 0; i < 5; i++) r.push(res('a', 'read-mcq', 'reading', 0, 7, i));
    for (let i = 0; i < 5; i++) r.push(res('a', 'read-mcq', 'reading', 7, 7, 10 + i));
    r.push(res('a', 'read-mcq', 'reading', 0, 7, 99, false)); // untimed: ignored
    expect(skillEstimate(r, 'reading').pct).toBe(1);
    expect(skillEstimate(r, 'listening').pct).toBeNull();
  });
  it('papers pick the least recently done task of each format', () => {
    const first = pickPaper([], 'reading');
    const r = first.map((t, i) => res(t.id, t.taskFormat, 'reading', 5, 7, i));
    const second = pickPaper(r, 'reading');
    second.forEach((t, i) => expect(t.id).not.toBe(first[i].id));
  });
  it('suggests a never-tried or weakest format', () => {
    expect(suggestTask([])).toBeTruthy();
  });
});
