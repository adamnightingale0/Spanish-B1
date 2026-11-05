import { describe, it, expect } from 'vitest';
import { review, buildQueue, directionFor, toCard, Rating, NEW_PER_DAY } from '../src/lib/srs';
import { vocabCards, allItems, gpById } from '../src/lib/content';
import { guessTense, tagError } from '../src/lib/errors';
import { buildPlacement } from '../src/lib/placement';
import { masteryByPoint } from '../src/lib/stats';
import { buildTodaySession } from '../src/lib/session';
import { DEFAULT_SETTINGS, type Attempt, type SrsRecord } from '../src/lib/db';

const day = (d: number, h = 10) => new Date(2026, 10, d, h);

describe('FSRS vocabulary', () => {
  it('a card answered Good today is not due today but is due again later', () => {
    const c = vocabCards[0];
    let r = review(c.id, undefined, Rating.Good, day(6));
    r = review(c.id, r, Rating.Good, new Date(toCard(r).due.getTime()));
    const due = toCard(r).due;
    expect(due.getTime()).toBeGreaterThan(day(6, 23).getTime());
    const today = buildQueue(vocabCards, [r], 2, day(6, 20));
    expect(today.due.map((x) => x.id)).not.toContain(c.id);
    const later = buildQueue(vocabCards, [r], 2, new Date(due.getTime() + 60_000));
    expect(later.due.map((x) => x.id)).toContain(c.id);
  });

  it('cards due tomorrow appear tomorrow', () => {
    const c = vocabCards[1];
    // Find a review history that schedules the card for the next day.
    let r: SrsRecord = review(c.id, undefined, Rating.Good, day(6, 9));
    let t = day(6, 9);
    while (toCard(r).due.getDate() === 6) {
      t = new Date(toCard(r).due.getTime());
      r = review(c.id, r, Rating.Good, t);
    }
    const due = toCard(r).due;
    expect(buildQueue(vocabCards, [r], 2, day(6, 23)).due.some((x) => x.id === c.id)).toBe(false);
    expect(buildQueue(vocabCards, [r], 2, new Date(due.getTime() + 1000)).due.some((x) => x.id === c.id)).toBe(true);
  });

  it('caps new cards at 15 a day and starts with the class unit', () => {
    const q = buildQueue(vocabCards, [], 2, day(6));
    expect(q.fresh).toHaveLength(NEW_PER_DAY);
    expect(q.fresh.every((c) => c.unit === 2)).toBe(true);
    const studied = vocabCards.slice(0, 10).map((c) => review(c.id, undefined, Rating.Good, day(6, 8)));
    expect(buildQueue(vocabCards, studied, 2, day(6, 12)).fresh).toHaveLength(NEW_PER_DAY - 10);
  });

  it('switches from recognition to recall after two correct answers', () => {
    const c = vocabCards[2];
    let r = review(c.id, undefined, Rating.Good, day(6));
    expect(directionFor(r)).toBe('recognition');
    r = review(c.id, r, Rating.Again, day(6, 11));
    expect(directionFor(r)).toBe('recognition');
    r = review(c.id, r, Rating.Good, day(6, 12));
    expect(directionFor(r)).toBe('recall');
  });
});

describe('error tagging', () => {
  it('recognises tenses', () => {
    expect(guessTense('he perdido')).toBe('perfecto');
    expect(guessTense('perdí')).toBe('indefinido');
    expect(guessTense('estuve')).toBe('indefinido');
    expect(guessTense('jugaba')).toBe('imperfecto');
    expect(guessTense('vivía')).toBe('imperfecto');
    expect(guessTense('había salido')).toBe('pluscuamperfecto');
    expect(guessTense('hablaría')).toBe('condicional');
  });
  it('tags tense confusions, ser/estar and accents', () => {
    const past = allItems.find((i) => i.grammarPoint === 'past-review' && i.type === 'gap')!;
    expect(tagError(past, 'jugué', 'jugaba', false)).toBe('imperfecto→indefinido');
    expect(tagError(past, 'perdí', 'he perdido', false)).toBe('perfecto→indefinido');
    expect(tagError(past, 'x', 'y', true)).toBe('tilde');
    const se = allItems.find((i) => i.grammarPoint === 'ser-estar-normas')!;
    expect(tagError(se, 'es', 'está', false)).toBe('estar→ser');
    const subj = allItems.find((i) => i.grammarPoint === 'querer-pedir-que')!;
    expect(tagError(subj, 'planta', 'plante', false)).toBe('indicativo / subjuntivo');
  });
});

describe('new drill types', () => {
  it('error items point at a real token', () => {
    for (const i of allItems) if (i.type === 'error') expect(i.prompt.split(' ')[i.errorIndex + (i.errorLength ?? 1) - 1]).toBeTruthy();
  });
  it('every unit has error, order or match items', () => {
    const units = new Set(allItems.filter((i) => ['error', 'order', 'match'].includes(i.type)).map((i) => i.unit));
    for (let u = 0; u <= 12; u++) expect(units.has(u)).toBe(true);
  });
});

describe('placement and mastery', () => {
  it('placement check has about 40 quick items from every unit', () => {
    const p = buildPlacement();
    expect(p.length).toBeGreaterThanOrEqual(36);
    expect(p.length).toBeLessThanOrEqual(50);
    expect(new Set(p.map((i) => i.unit)).size).toBeGreaterThanOrEqual(13);
    expect(p.every((i) => i.type !== 'cloze')).toBe(true);
  });
  it('old answers count less than recent ones', () => {
    const now = Date.now();
    const mk = (correct: boolean, ageDays: number, i: number): Attempt => ({ key: `${i}`, itemId: `x${i}`, grammarPoint: 'a', unit: 1, ts: now - ageDays * 864e5, correct, given: '' });
    const list = [0, 1, 2, 3, 4].map((i) => mk(false, 14, i)).concat([5, 6, 7, 8, 9].map((i) => mk(true, 0, i)));
    const m = masteryByPoint(list).get('a')!;
    expect(m.accuracy!).toBeCloseTo(0.8, 1); // 5 / (5 + 5 × 0.25)
  });
  it("today's session reserves time for due vocabulary first", () => {
    const s = buildTodaySession([], DEFAULT_SETTINGS, Date.now(), 100);
    expect(s.vocabCount).toBe(22); // 25% of 15 min at 10 s per card
    expect(buildTodaySession([], DEFAULT_SETTINGS, Date.now(), 5).vocabCount).toBe(5);
  });
  it('all grammar points referenced by items exist', () => {
    for (const i of allItems) expect(gpById.has(i.grammarPoint)).toBe(true);
  });
});
