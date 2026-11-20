import type { DrillItem } from './schema';
import type { Attempt } from './db';
import { allItems, tenseGuide, tenseItems } from './content';
import { conjugate, gerund, irregularIn, personsFor, TENSE_NAMES, VERBS, verbByInf, type TenseId } from './conjugate';
import { buildDrill, shuffle } from './session';
import { masteryBy } from './stats';
import type { TenseGuideEntry } from './schema';

export const guideById = new Map(tenseGuide.map((t) => [t.id, t]));

/** Forms of a guide entry for one verb: real tenses come from the conjugator; ir a / estar + gerundio are built from ir / estar. */
export function formsOf(t: TenseGuideEntry, inf: string): { persons: readonly string[]; forms: string[] } {
  if (t.tense) {
    const tense = t.tense as TenseId;
    return { persons: personsFor(tense), forms: conjugate(inf, tense) };
  }
  const v = verbByInf.get(inf) ?? { inf, en: '' };
  if (t.id === 'ir-a')
    return {
      persons: personsFor('presente'),
      forms: conjugate('ir', 'presente').map((f) => `${f} a ${inf}`)
    };
  return {
    persons: personsFor('presente'),
    forms: conjugate('estar', 'presente').map((f) => `${f} ${gerund(v)}`)
  };
}

const formsLabel = (t: TenseGuideEntry) => (t.tense ? TENSE_NAMES[t.tense as TenseId] : t.name.toLowerCase());

/** Unlimited form practice: conjugate items generated on the fly, weighted towards irregular verbs. */
export function generateFormItems(t: TenseGuideEntry, n = 15): DrillItem[] {
  const tense = t.tense as TenseId | null;
  const irregular = tense ? VERBS.filter((v) => irregularIn(v.inf, tense)) : [];
  const regular = VERBS.filter((v) => !irregular.includes(v));
  const out: DrillItem[] = [];
  const seen = new Set<string>();
  for (let guard = 0; out.length < n && guard < n * 20; guard++) {
    const pool = irregular.length && Math.random() < 0.65 ? irregular : regular;
    const v = pool[Math.floor(Math.random() * pool.length)];
    const { persons, forms } = formsOf(t, v.inf);
    const p = Math.floor(Math.random() * persons.length);
    const key = `${v.inf}-${p}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: `gen-${t.id}-${v.inf}-${p}`,
      type: 'conjugate',
      unit: 0,
      grammarPoint: t.grammarPoints[0],
      subPoint: `formas-${t.id}`,
      difficulty: 2,
      verb: v.inf,
      person: persons[p],
      tense: formsLabel(t),
      answers: [forms[p]],
      feedback: `${v.inf} (${v.en}) · ${formsLabel(t)}: ${forms.join(', ')}.`
    });
  }
  return out;
}

/** «¿Cuándo se usa?» practice: the curated contrast items first, topped up with related unit items. */
export function usePool(t: TenseGuideEntry): {
  curated: DrillItem[];
  related: DrillItem[];
} {
  const curated = tenseItems.filter((i) => i.subPoint === `uso-${t.id}`);
  const gps = new Set(t.grammarPoints);
  const subs = t.subPoints ? new Set(t.subPoints.filter((s) => !s.startsWith('forms-'))) : null;
  const related = allItems.filter(
    (i) => i.type !== 'cloze' && gps.has(i.grammarPoint) && !i.subPoint?.startsWith('uso-') && (!subs || (i.subPoint && subs.has(i.subPoint)))
  );
  return { curated, related };
}

export function buildUseDrill(t: TenseGuideEntry, attempts: Attempt[], n = 15): DrillItem[] {
  const { curated, related } = usePool(t);
  const a = buildDrill(curated, attempts, Math.ceil(n * 0.6));
  return shuffle([...a, ...buildDrill(related, attempts, n - a.length)]);
}

/** «Mezcla de tiempos»: every curated item, which forces a choice between tenses. */
export const buildMixDrill = (attempts: Attempt[], n = 20) => buildDrill(tenseItems, attempts, n);

/** Mastery per guide entry, from both the form practice and the «¿cuándo?» items. */
export const masteryByTense = (attempts: Attempt[]) => masteryBy(attempts, (a) => a.subPoint?.match(/^(?:uso|formas)-(.+)$/)?.[1]);
export const masteryByTenseKind = (attempts: Attempt[]) => masteryBy(attempts, (a) => (a.subPoint?.match(/^(uso|formas)-/) ? a.subPoint : undefined));
