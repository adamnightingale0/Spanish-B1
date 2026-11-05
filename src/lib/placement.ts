import type { DrillItem } from './schema';
import { allItems, units, focus } from './content';
import { shuffle } from './session';

/**
 * Grammar placement check (~40 items, ~15 minutes): six past-tense items covering each
 * focus sub-point, then roughly three items per unit (one per grammar point, up to three
 * points per unit), favouring difficulty 2 and short item types. Seeds every mastery estimate.
 */
export function buildPlacement(target = 40): DrillItem[] {
  const quick = (i: DrillItem) => i.type !== 'cloze' && i.type !== 'match' && i.type !== 'order';
  const pickOne = (pool: DrillItem[]) => {
    const p = pool.filter(quick);
    return shuffle(p.filter((i) => i.difficulty === 2))[0] ?? shuffle(p)[0];
  };
  const out: DrillItem[] = [];
  for (const sp of focus.subPoints.slice(0, 6)) {
    const it = pickOne(allItems.filter((i) => i.subPoint === sp.id));
    if (it) out.push(it);
  }
  for (const u of units) {
    const points = u.grammarPoints.filter((g) => !['past-review', 'pluscuamperfecto', 'past-combined'].includes(g));
    for (const g of shuffle(points).slice(0, u.unit === 0 ? 4 : 3)) {
      const it = pickOne(allItems.filter((i) => i.grammarPoint === g));
      if (it && !out.includes(it)) out.push(it);
    }
  }
  return out.slice(0, Math.max(target, out.length));
}
