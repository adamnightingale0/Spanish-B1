import type { DrillItem } from './schema';
import type { Attempt, Settings } from './db';
import { allItems, isFocusItem, focus, grammarPoints } from './content';
import { lastByItem, masteryByPoint, masteryBySubPoint, recentAccuracy } from './stats';

export interface SessionSpec {
  title: string;
  items: DrillItem[];
  /** Review up to this many vocabulary cards before the drills (Today's session). */
  vocabCount?: number;
  kind?: 'placement';
  startedAt?: number;
}

/** Rough time cost per item, used to fill a session of N minutes. */
export const itemSeconds = (i: DrillItem) => (i.type === 'cloze' ? 150 : i.type === 'match' ? 60 : i.type === 'transform' || i.type === 'order' || i.type === 'error' ? 45 : 30);

/** Seeded-ish shuffle (Math.random is fine for practice order). */
export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Score items so that unseen and recently-wrong items come first, and items seen today come last. */
function rankItems(items: DrillItem[], attempts: Attempt[], now = Date.now()): DrillItem[] {
  const last = lastByItem(attempts);
  return items
    .map((it) => {
      const l = last.get(it.id);
      let score = Math.random();
      if (!l) score += 1;
      else {
        if (!l.correct) score += 1.6;
        const ageDays = (now - l.ts) / 864e5;
        if (ageDays < 0.5) score -= 1.5;
        else score += Math.min(ageDays / 7, 1);
      }
      return { it, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.it);
}

function take(items: DrillItem[], seconds: number, used: Set<string>): DrillItem[] {
  const out: DrillItem[] = [];
  let t = 0;
  for (const it of items) {
    if (t >= seconds) break;
    if (used.has(it.id)) continue;
    used.add(it.id);
    out.push(it);
    t += itemSeconds(it);
  }
  return out;
}

export function buildDrill(items: DrillItem[], attempts: Attempt[], count = 20): DrillItem[] {
  return rankItems(items, attempts).slice(0, count);
}

/** "Weak spots": items from the grammar points with the lowest accuracy over the last 14 days. */
export function weakPoints(attempts: Attempt[], k = 4, now = Date.now()): string[] {
  const since = now - 14 * 864e5;
  const tally = new Map<string, { right: number; n: number }>();
  for (const a of attempts) {
    if (a.ts < since) continue;
    const t = tally.get(a.grammarPoint) ?? { right: 0, n: 0 };
    t.n++;
    if (a.correct) t.right++;
    tally.set(a.grammarPoint, t);
  }
  return [...tally.entries()]
    .filter(([, t]) => t.n >= 3 && t.right / t.n < 0.9)
    .sort((a, b) => a[1].right / a[1].n - b[1].right / b[1].n)
    .slice(0, k)
    .map(([id]) => id);
}
export { recentAccuracy };

export function buildWeakSpots(attempts: Attempt[], count = 20): SessionSpec {
  const pts = new Set(weakPoints(attempts));
  if (!pts.size) return { title: 'Puntos débiles', items: [] };
  return { title: 'Puntos débiles', items: buildDrill(allItems.filter((i) => pts.has(i.grammarPoint)), attempts, count) };
}

/**
 * Today's session: Focus area ≥ 25% (40% while its mastery is under 80%), weakest grammar points,
 * the class unit, one cloze story, and spread review across all units (units idle for 10+ days first).
 */
export const CARD_SECONDS = 10;

/**
 * vocabAvailable = flashcards due now plus new cards still allowed today. Up to a quarter of the
 * session goes to them (reviewed first); the rest goes to the drills below.
 */
export function buildTodaySession(attempts: Attempt[], settings: Settings, now = Date.now(), vocabAvailable = 0): SessionSpec {
  const vocabCount = Math.min(vocabAvailable, Math.floor((settings.sessionMinutes * 60 * 0.25) / CARD_SECONDS));
  const total = settings.sessionMinutes * 60 - vocabCount * CARD_SECONDS;
  const used = new Set<string>();
  const out: DrillItem[] = [];

  const focusItems = focusPool(settings.focus);
  const focusMastery = focusMasteryValue(attempts, settings.focus);
  const focusShare = focusItems.length ? (focusMastery !== null && focusMastery >= 0.8 ? 0.25 : 0.4) : 0;

  // 1. One cloze story from the focus pack (the main past-tense exercise type).
  if (focusItems.length) {
    const cloze = rankItems(focusItems.filter((i) => i.type === 'cloze'), attempts, now);
    out.push(...take(cloze.slice(0, 1), 1, used));
  }
  // 2. Focus drills.
  out.push(...take(rankItems(focusItems.filter((i) => i.type !== 'cloze'), attempts, now), total * focusShare - 150, used));

  // 3. Weak spots (lowest recent accuracy).
  const weak = new Set(weakPoints(attempts, 3));
  out.push(...take(rankItems(allItems.filter((i) => weak.has(i.grammarPoint) && i.type !== 'cloze'), attempts, now), total * 0.2, used));

  // 4. Class unit.
  out.push(...take(rankItems(allItems.filter((i) => i.unit === settings.classUnit && i.type !== 'cloze'), attempts, now), total * 0.15, used));

  // 5. Spread review across every unit; units with no practice for 10 days are boosted.
  const lastUnitTs = new Map<number, number>();
  for (const a of attempts) lastUnitTs.set(a.unit, a.ts);
  const idle = new Set(
    [...new Set(allItems.map((i) => i.unit))].filter((u) => now - (lastUnitTs.get(u) ?? 0) > 10 * 864e5)
  );
  const spent = out.reduce((s, i) => s + itemSeconds(i), 0);
  const rest = rankItems(allItems.filter((i) => i.type !== 'cloze'), attempts, now).sort(
    (a, b) => Number(idle.has(b.unit)) - Number(idle.has(a.unit))
  );
  // Interleave so the boost doesn't pull every item from one unit.
  out.push(...take(interleaveByUnit(rest), total - spent, used));

  return { title: 'Sesión de hoy', items: interleaveFocus(out), vocabCount };
}

function interleaveByUnit(items: DrillItem[]): DrillItem[] {
  const buckets = new Map<number, DrillItem[]>();
  for (const it of items) {
    if (!buckets.has(it.unit)) buckets.set(it.unit, []);
    buckets.get(it.unit)!.push(it);
  }
  const lists = [...buckets.values()];
  const out: DrillItem[] = [];
  for (let i = 0; out.length < items.length; i++) for (const l of lists) if (l[i]) out.push(l[i]);
  return out;
}

/** Keep the cloze first, then mix the rest so focus items are spread through the session. */
function interleaveFocus(items: DrillItem[]): DrillItem[] {
  const [first, ...rest] = items;
  if (!first) return [];
  return first.type === 'cloze' ? [first, ...shuffle(rest)] : shuffle(items);
}

export function focusPool(focusSetting: string): DrillItem[] {
  if (focusSetting === 'none') return [];
  if (focusSetting === 'past-tenses') return allItems.filter(isFocusItem);
  return allItems.filter((i) => i.grammarPoint === focusSetting);
}

export function focusMasteryValue(attempts: Attempt[], focusSetting: string): number | null {
  if (focusSetting === 'none') return null;
  const pool = new Set(focusPool(focusSetting).map((i) => i.grammarPoint));
  const rel = attempts.filter((a) => pool.has(a.grammarPoint));
  const recent = rel.slice(-40);
  if (recent.length < 5) return null;
  return recent.filter((a) => a.correct).length / recent.length;
}

export function focusLabel(focusSetting: string): string {
  if (focusSetting === 'none') return 'Sin foco';
  if (focusSetting === 'past-tenses') return focus.title;
  return grammarPoints.find((g) => g.id === focusSetting)?.title ?? focusSetting;
}

export { masteryByPoint, masteryBySubPoint };
