import { describe, it, expect } from 'vitest';
import { readingTasks, listeningTasks, writingTasks } from '../src/lib/content';

describe('skill content reaches the spec targets', () => {
  it('15 reading tasks: 5 of each Seville format', () => {
    expect(readingTasks).toHaveLength(15);
    for (const f of ['read-mcq', 'read-match', 'read-insert']) expect(readingTasks.filter((t) => t.taskFormat === f)).toHaveLength(5);
  });
  it('12 listening scripts: 4 of each format', () => {
    expect(listeningTasks).toHaveLength(12);
    for (const f of ['listen-reply', 'listen-speakers', 'listen-interview']) expect(listeningTasks.filter((t) => t.taskFormat === f)).toHaveLength(4);
  });
  it('24 writing prompts: one per unit plus 12 exam-format prompts', () => {
    expect(writingTasks).toHaveLength(24);
    for (let u = 1; u <= 12; u++) expect(writingTasks.filter((t) => t.unit === u && t.set === undefined)).toHaveLength(1);
    expect(writingTasks.filter((t) => t.set !== undefined)).toHaveLength(12);
  });
  it('right answers are spread evenly over a), b) and c)', () => {
    const count = [0, 0, 0];
    for (const t of [...readingTasks, ...listeningTasks]) {
      if (t.taskFormat === 'read-mcq' || t.taskFormat === 'listen-interview') for (const q of t.questions) count[q.answer]++;
      if (t.taskFormat === 'listen-reply') for (const q of t.items) count[q.answer]++;
    }
    const total = count[0] + count[1] + count[2];
    for (const c of count) expect(c / total).toBeGreaterThan(0.28);
  });
});
