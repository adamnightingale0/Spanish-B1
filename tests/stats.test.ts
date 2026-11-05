import { describe, it, expect } from 'vitest';
import { masteryByPoint, streak, daysUntil } from '../src/lib/stats';
import { buildTodaySession, weakPoints } from '../src/lib/session';
import { DEFAULT_SETTINGS, type Attempt } from '../src/lib/db';
import { itemById } from '../src/lib/content';

const mk = (gp: string, correct: boolean, ts: number, i = 0): Attempt => ({ key: `${ts}-${i}`, itemId: `x${i}`, grammarPoint: gp, unit: 1, ts, correct, given: '' });

describe('mastery', () => {
  it('needs 5 attempts and uses the last 20', () => {
    const now = Date.now();
    const few = [1, 2, 3, 4].map((i) => mk('a', true, now + i, i));
    expect(masteryByPoint(few).get('a')!.accuracy).toBeNull();
    const many = [...Array(10)].map((_, i) => mk('a', false, now + i, i)).concat([...Array(20)].map((_, i) => mk('a', true, now + 100 + i, 100 + i)));
    expect(masteryByPoint(many).get('a')!.accuracy).toBe(1);
  });
});

describe('streak and countdown', () => {
  it('counts consecutive days', () => {
    const now = new Date(2026, 10, 5, 12).getTime();
    const a = [0, 1, 2].map((d) => mk('a', true, now - d * 864e5, d));
    expect(streak(a, now)).toBe(3);
  });
  it('days until the exam', () => {
    expect(daysUntil('2027-01-18', new Date(2026, 10, 5, 9).getTime())).toBe(74);
  });
});

describe('sessions', () => {
  it("today's session respects the focus share and only uses real items", () => {
    const s = buildTodaySession([], DEFAULT_SETTINGS);
    expect(s.items.length).toBeGreaterThan(10);
    expect(new Set(s.items.map((i) => i.id)).size).toBe(s.items.length);
    for (const it of s.items) expect(itemById.has(it.id)).toBe(true);
    const focusShare = s.items.filter((i) => ['past-review', 'pluscuamperfecto', 'past-combined'].includes(i.grammarPoint)).length / s.items.length;
    expect(focusShare).toBeGreaterThanOrEqual(0.25);
    expect(s.items[0].type).toBe('cloze');
  });
  it('weak points are the lowest-accuracy points of the last 14 days', () => {
    const now = Date.now();
    const a = [...Array(5)].map((_, i) => mk('bad', false, now - i, i)).concat([...Array(5)].map((_, i) => mk('ok', i < 3, now - i, 10 + i)));
    expect(weakPoints(a)[0]).toBe('bad');
  });
});
