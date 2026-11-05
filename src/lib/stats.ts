import type { Attempt } from './db';

export const MASTERY_WINDOW = 20;
export const MIN_ATTEMPTS = 5;

export const HALF_LIFE_DAYS = 7;

export interface Mastery {
  n: number; // attempts in window
  total: number; // all attempts ever
  accuracy: number | null; // recency-weighted accuracy; null = not enough data (fewer than 5 attempts)
  confidence: number; // 0..1, grows with the number of attempts
}

/**
 * Mastery = accuracy over the last 20 attempts, weighted towards recent answers:
 * an answer counts half as much after 7 days. Fewer than 5 attempts → "not enough data".
 */
export function masteryBy(attempts: Attempt[], key: (a: Attempt) => string | undefined, now = Date.now()): Map<string, Mastery> {
  const groups = new Map<string, Attempt[]>();
  for (const a of attempts) {
    const k = key(a);
    if (!k) continue;
    let g = groups.get(k);
    if (!g) groups.set(k, (g = []));
    g.push(a);
  }
  const out = new Map<string, Mastery>();
  for (const [k, list] of groups) {
    const recent = list.slice(-MASTERY_WINDOW);
    let w = 0;
    let right = 0;
    for (const a of recent) {
      const age = Math.max(0, now - a.ts) / 864e5;
      const wt = Math.pow(0.5, age / HALF_LIFE_DAYS);
      w += wt;
      if (a.correct) right += wt;
    }
    out.set(k, {
      n: recent.length,
      total: list.length,
      accuracy: list.length >= MIN_ATTEMPTS && w > 0 ? right / w : null,
      confidence: 1 - Math.pow(0.8, list.length)
    });
  }
  return out;
}

export const masteryByPoint = (a: Attempt[]) => masteryBy(a, (x) => x.grammarPoint);
export const masteryBySubPoint = (a: Attempt[]) => masteryBy(a, (x) => x.subPoint);

/** Accuracy over the last `days` days, per grammar point (for "Weak spots"). */
export function recentAccuracy(attempts: Attempt[], days = 14, now = Date.now()): Map<string, Mastery> {
  const since = now - days * 864e5;
  return masteryBy(
    attempts.filter((a) => a.ts >= since),
    (x) => x.grammarPoint,
    now
  );
}

/** Most frequent error tags over the last 30 days. */
export function topConfusions(attempts: Attempt[], k = 5, now = Date.now()): { tag: string; count: number; points: string[] }[] {
  const since = now - 30 * 864e5;
  const m = new Map<string, { count: number; points: Set<string> }>();
  for (const a of attempts) {
    if (a.correct || !a.errorTag || a.ts < since) continue;
    const e = m.get(a.errorTag) ?? { count: 0, points: new Set<string>() };
    e.count++;
    e.points.add(a.grammarPoint);
    m.set(a.errorTag, e);
  }
  return [...m.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, k)
    .map(([tag, v]) => ({ tag, count: v.count, points: [...v.points] }));
}

const dayKey = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/** Consecutive days with at least one attempt, ending today (or yesterday if nothing yet today). */
export function streak(attempts: Attempt[], now = Date.now()): number {
  const days = new Set(attempts.map((a) => dayKey(a.ts)));
  let n = 0;
  let t = now;
  if (!days.has(dayKey(t))) t -= 864e5;
  while (days.has(dayKey(t))) {
    n++;
    t -= 864e5;
  }
  return n;
}

/** Minutes studied per ISO-ish week (Monday start), most recent last. */
export function minutesPerWeek(attempts: Attempt[], weeks = 6, now = Date.now()): { label: string; minutes: number }[] {
  const startOfWeek = (ts: number) => {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.getTime();
  };
  const current = startOfWeek(now);
  const out = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const start = current - w * 7 * 864e5;
    const end = start + 7 * 864e5;
    const ms = attempts.filter((a) => a.ts >= start && a.ts < end).reduce((s, a) => s + Math.min(a.ms ?? 20000, 180000), 0);
    const d = new Date(start);
    out.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, minutes: Math.round(ms / 60000) });
  }
  return out;
}

export function todayCount(attempts: Attempt[], now = Date.now()): number {
  const k = dayKey(now);
  return attempts.filter((a) => dayKey(a.ts) === k).length;
}

export function daysUntil(dateStr: string, now = Date.now()): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d).getTime();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today.getTime()) / 864e5);
}

/** Last attempt per item id (cloze gaps are folded into their parent item). */
export function lastByItem(attempts: Attempt[]): Map<string, Attempt> {
  const m = new Map<string, Attempt>();
  for (const a of attempts) m.set(a.itemId.split('#')[0], a);
  return m;
}
