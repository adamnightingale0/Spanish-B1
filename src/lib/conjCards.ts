/**
 * Flashcards for the irregular pretérito indefinido. One card = one verb + one person, and only the
 * persons that break the regular pattern become cards (e.g. pedir → pidió, pidieron; buscar → busqué).
 * Scheduling is a simple Leitner system worked out from the attempts history, so progress is part of
 * the normal backup and needs no extra storage.
 */
import type { Attempt } from './db';
import { conjugate, PERSONS, verbByInf } from './conjugate';

export interface IrregularGroup {
  id: string;
  title: string;
  rule: string;
  verbs: string[];
}

export const INDEF_GROUPS: IrregularGroup[] = [
  {
    id: 'totales',
    title: 'Totalmente irregulares',
    rule: 'ser and ir share the same forms (fui, fuiste, fue…). dar takes -er endings; dar and ver have no accents (di, dio, vi, vio).',
    verbs: ['ser', 'ir', 'dar', 'ver']
  },
  {
    id: 'fuertes',
    title: 'Raíz irregular (u, i, j)',
    rule: 'New stem + -e, -iste, -o, -imos, -isteis, -ieron, with no accents (tuve, tuvo). Stems in j take -eron: dijeron, trajeron, condujeron.',
    verbs: ['estar', 'tener', 'andar', 'poder', 'poner', 'saber', 'haber', 'mantener', 'obtener', 'proponer', 'suponer', 'querer', 'venir', 'hacer', 'decir', 'traer', 'conducir', 'traducir', 'producir']
  },
  {
    id: 'e-i',
    title: 'e → i, o → u (él, ellos)',
    rule: '-ir verbs that change their stem in the present change e → i or o → u in the indefinido, but only in él/ella/usted and ellos/ellas/ustedes.',
    verbs: ['pedir', 'repetir', 'servir', 'seguir', 'conseguir', 'vestir', 'elegir', 'sentir', 'mentir', 'preferir', 'sugerir', 'reír', 'dormir', 'morir']
  },
  {
    id: 'i-y',
    title: 'i → y (él, ellos)',
    rule: 'When the stem ends in a vowel, -ió/-ieron become -yó/-yeron (leyó, oyeron). Watch the accents: leíste, leímos.',
    verbs: ['leer', 'creer', 'oír', 'caer', 'construir']
  },
  {
    id: 'yo',
    title: 'Ortografía en yo (-car, -gar, -zar)',
    rule: 'Only yo changes, to keep the sound: c → qu (busqué), g → gu (llegué), z → c (empecé). The other persons are regular.',
    verbs: ['buscar', 'tocar', 'sacar', 'explicar', 'practicar', 'llegar', 'pagar', 'jugar', 'empezar', 'comenzar', 'cruzar', 'organizar']
  }
];

/** What the forms would be if the verb were regular (no spelling changes, accents on -é/-ó/-í/-ió). */
function naiveIndefinido(inf: string): string[] {
  const end = inf.slice(-2).normalize('NFD').replace(/[̀-ͯ]/g, '');
  const s = inf.slice(0, -2);
  return (end === 'ar' ? 'é aste ó amos asteis aron' : 'í iste ió imos isteis ieron').split(' ').map((x) => s + x);
}

export interface ConjCard {
  id: string; // fc-indefinido-<verb>-<person index>
  verb: string;
  en: string;
  person: number;
  personLabel: string;
  answer: string;
  forms: string[];
  group: IrregularGroup;
}

export const indefCards: ConjCard[] = INDEF_GROUPS.flatMap((group) =>
  group.verbs.flatMap((verb) => {
    const forms = conjugate(verb, 'indefinido');
    const naive = naiveIndefinido(verb);
    return forms
      .map((f, p) => ({ f, p }))
      .filter(({ f, p }) => f !== naive[p])
      .map(({ f, p }) => ({
        id: `fc-indefinido-${verb.normalize('NFD').replace(/[̀-ͯ]/g, '')}-${p}`,
        verb,
        en: verbByInf.get(verb)?.en ?? '',
        person: p,
        personLabel: PERSONS[p],
        answer: f,
        forms,
        group
      }));
  })
);

/** Days until a card is due again, by number of correct answers in a row. */
const INTERVALS = [0, 1, 3, 7, 14, 30, 60];
const DAY = 864e5;

export interface CardState {
  seen: boolean;
  streak: number; // correct answers in a row
  due: number; // timestamp
  lastWrong: boolean;
}

export function cardStates(attempts: Attempt[]): Map<string, CardState> {
  const m = new Map<string, CardState>();
  for (const a of attempts) {
    if (!a.itemId.startsWith('fc-')) continue;
    const prev = m.get(a.itemId) ?? { seen: true, streak: 0, due: 0, lastWrong: false };
    const streak = a.correct ? prev.streak + 1 : 0;
    m.set(a.itemId, { seen: true, streak, lastWrong: !a.correct, due: a.ts + INTERVALS[Math.min(streak, INTERVALS.length - 1)] * DAY });
  }
  return m;
}

/** Due cards (wrong ones first, then the most overdue), then up to `newMax` new cards in deck order. */
export function buildCardQueue(cards: ConjCard[], attempts: Attempt[], n = 20, newMax = 10, now = Date.now()): ConjCard[] {
  const st = cardStates(attempts);
  const due = cards
    .filter((c) => st.has(c.id) && st.get(c.id)!.due <= now)
    .sort((a, b) => Number(st.get(b.id)!.lastWrong) - Number(st.get(a.id)!.lastWrong) || st.get(a.id)!.due - st.get(b.id)!.due);
  const fresh = cards.filter((c) => !st.has(c.id)).slice(0, Math.max(0, Math.min(newMax, n - due.length)));
  return [...due.slice(0, n), ...fresh].slice(0, n);
}

export function deckStats(cards: ConjCard[], attempts: Attempt[], now = Date.now()) {
  const st = cardStates(attempts);
  let due = 0,
    learned = 0,
    fresh = 0;
  for (const c of cards) {
    const s = st.get(c.id);
    if (!s) fresh++;
    else {
      if (s.due <= now) due++;
      if (s.streak >= 2) learned++;
    }
  }
  return { total: cards.length, due, learned, fresh };
}
