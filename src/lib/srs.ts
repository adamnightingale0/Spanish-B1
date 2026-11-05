import { fsrs, generatorParameters, createEmptyCard, Rating, type Card, type Grade } from 'ts-fsrs';
import type { SrsRecord } from './db';
import type { VocabCard } from './schema';

export const NEW_PER_DAY = 15;
export const REVIEWS_PER_DAY = 150;
export const RECOGNITION_STEPS = 2;
export { Rating };

const scheduler = fsrs(generatorParameters({ enable_fuzz: true, enable_short_term: true }));

export function toCard(r: SrsRecord): Card {
  const f = r.fsrs as Record<string, unknown>;
  return { ...(f as unknown as Card), due: new Date(f.due as string), last_review: f.last_review ? new Date(f.last_review as string) : undefined };
}
function fromCard(c: Card): Record<string, unknown> {
  return { ...c, due: c.due.toISOString(), last_review: c.last_review ? c.last_review.toISOString() : undefined };
}

export type Direction = 'recognition' | 'recall';
export const directionFor = (r?: SrsRecord): Direction => ((r?.recogCorrect ?? 0) >= RECOGNITION_STEPS ? 'recall' : 'recognition');

export function review(cardId: string, prev: SrsRecord | undefined, grade: Grade, now = new Date()): SrsRecord {
  const card = prev ? toCard(prev) : createEmptyCard(now);
  const next = scheduler.next(card, now, grade).card;
  const dir = directionFor(prev);
  const recogCorrect = (prev?.recogCorrect ?? 0) + (dir === 'recognition' && grade >= Rating.Good ? 1 : 0);
  return { cardId, fsrs: fromCard(next), recogCorrect, introduced: prev?.introduced ?? now.getTime(), lastRating: grade };
}

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};

export interface Queue {
  due: VocabCard[];
  fresh: VocabCard[];
  dueCount: number;
  newLeft: number;
}

/**
 * Cards due now (oldest first, capped at 150 reviews a day) plus up to 15 new cards a day.
 * New cards come from the class unit first, then the other units in order.
 */
export function buildQueue(cards: VocabCard[], records: SrsRecord[], classUnit: number, now = new Date(), filterUnit?: number): Queue {
  const byId = new Map(records.map((r) => [r.cardId, r]));
  const today = startOfDay(now);
  const introducedToday = records.filter((r) => r.introduced >= today).length;
  const reviewedToday = records.filter((r) => r.introduced < today && r.fsrs.last_review && new Date(r.fsrs.last_review as string).getTime() >= today).length;
  const pool = filterUnit ? cards.filter((c) => c.unit === filterUnit) : cards;
  const dueAll = pool
    .filter((c) => byId.has(c.id) && toCard(byId.get(c.id)!).due.getTime() <= now.getTime())
    .sort((a, b) => toCard(byId.get(a.id)!).due.getTime() - toCard(byId.get(b.id)!).due.getTime());
  const due = dueAll.slice(0, Math.max(0, REVIEWS_PER_DAY - reviewedToday));
  const newLeft = Math.max(0, NEW_PER_DAY - introducedToday);
  const unseen = pool.filter((c) => !byId.has(c.id));
  const order = (u: number) => (u === classUnit ? 0 : u);
  const fresh = unseen.sort((a, b) => order(a.unit) - order(b.unit)).slice(0, newLeft);
  return { due, fresh, dueCount: dueAll.length, newLeft };
}

/** Share of studied cards that are not currently overdue (a simple retention signal). */
export function retention(records: SrsRecord[], now = new Date()): number | null {
  const seen = records.filter((r) => r.fsrs.reps && (r.fsrs.reps as number) > 0);
  if (seen.length < 5) return null;
  const okay = seen.filter((r) => (r.lastRating ?? Rating.Good) !== Rating.Again && toCard(r).due.getTime() > now.getTime() - 864e5);
  return okay.length / seen.length;
}
