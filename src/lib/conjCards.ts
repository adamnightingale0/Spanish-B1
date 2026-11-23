/**
 * Flashcards for the irregular pretérito indefinido. One card = one verb + one person, and only the
 * persons that break the regular pattern become cards (e.g. pedir → pidió, pidieron; buscar → busqué).
 * Scheduling is FSRS (as in Anki), replayed from the attempts history, so progress is part of the normal
 * backup and needs no extra storage. Wrong answers lower a card's stability, so it comes back within minutes
 * and then sooner than cards you always get right.
 */
import { fsrs, generatorParameters, createEmptyCard, Rating, State, type Card, type Grade } from 'ts-fsrs';
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

const scheduler = fsrs(generatorParameters({ enable_fuzz: false, enable_short_term: true, maximum_interval: 30 })); // max 30 days: the exam is weeks away
const DAY = 864e5;
export const SESSION_REVIEWS = 20;
export const SESSION_NEW = 10;
export const NEW_PER_DAY = 25;
export const SLOW_MS = 15000;

/** How one typed answer counts: wrong → Again; right but with an accent slip, a typo, or slowly → Hard; else Good. */
export function gradeOf(a: Pick<Attempt, 'correct' | 'accentOnly' | 'override' | 'ms'>): Grade {
  if (!a.correct) return Rating.Again;
  if (a.accentOnly || a.override || (a.ms ?? 0) > SLOW_MS) return Rating.Hard;
  return Rating.Good;
}

export type Level = 'nueva' | 'aprendiendo' | 'repasando' | 'dominada';
export const LEVELS: { id: Level; label: string; hint: string }[] = [
  { id: 'nueva', label: 'Nuevas', hint: 'not studied yet' },
  { id: 'aprendiendo', label: 'Aprendiendo', hint: 'remembered for under 3 days' },
  { id: 'repasando', label: 'Repasando', hint: '3–21 days' },
  { id: 'dominada', label: 'Dominadas', hint: 'remembered for 3+ weeks' }
];

export interface CardState {
  card: Card;
  level: Level;
  due: number;
  lapses: number; // times forgotten after being learned, plus misses while learning
  misses: number; // all wrong answers
  hard: boolean; // a "difícil": forgotten again and again
  retrievability: number; // chance of remembering it right now (0–1)
}

export function levelOf(c: Card): Level {
  if (c.state === State.New) return 'nueva';
  if (c.state === State.Learning || c.state === State.Relearning || c.stability < 3) return 'aprendiendo';
  return c.stability >= 21 ? 'dominada' : 'repasando';
}

/** Replays every flashcard answer through FSRS, in order. */
export function cardStates(attempts: Attempt[], now = Date.now()): Map<string, CardState> {
  const cards = new Map<string, { card: Card; misses: number }>();
  for (const a of attempts) {
    if (!a.itemId.startsWith('fc-')) continue;
    const prev = cards.get(a.itemId) ?? { card: createEmptyCard(new Date(a.ts)), misses: 0 };
    cards.set(a.itemId, { card: scheduler.next(prev.card, new Date(a.ts), gradeOf(a)).card, misses: prev.misses + (a.correct ? 0 : 1) });
  }
  const out = new Map<string, CardState>();
  for (const [id, { card, misses }] of cards) {
    out.set(id, {
      card,
      level: levelOf(card),
      due: card.due.getTime(),
      lapses: card.lapses,
      misses,
      hard: misses >= 3 && misses / Math.max(1, card.reps) >= 0.3,
      retrievability: scheduler.get_retrievability(card, new Date(now), false) as number
    });
  }
  return out;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Random order, but never the same verb twice in a row (so one form can't give away the next). */
export function interleave(cards: ConjCard[]): ConjCard[] {
  const left = shuffle(cards);
  const out: ConjCard[] = [];
  while (left.length) {
    const prev = out[out.length - 1]?.verb;
    let i = left.findIndex((c) => c.verb !== prev);
    if (i < 0) i = 0;
    out.push(left.splice(i, 1)[0]);
  }
  return out;
}

const startOfDay = (now: number) => {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** New cards: a random mix of verbs, at most 3 forms of one verb per session, so forms can't be guessed from order. */
function pickNew(cards: ConjCard[], st: Map<string, CardState>, n: number): ConjCard[] {
  const per = new Map<string, number>();
  const out: ConjCard[] = [];
  for (const c of shuffle(cards.filter((c) => !st.has(c.id)))) {
    if ((per.get(c.verb) ?? 0) >= 3) continue;
    per.set(c.verb, (per.get(c.verb) ?? 0) + 1);
    out.push(c);
    if (out.length >= n) break;
  }
  return out;
}

export function newLeftToday(attempts: Attempt[], now = Date.now()): number {
  const today = startOfDay(now);
  const first = new Map<string, number>();
  for (const a of attempts) if (a.itemId.startsWith('fc-') && !first.has(a.itemId)) first.set(a.itemId, a.ts);
  return Math.max(0, NEW_PER_DAY - [...first.values()].filter((t) => t >= today).length);
}

export type QueueMode = 'study' | 'hard' | 'extra';

/**
 * study: cards due now, the ones you are most likely to have forgotten first, plus a few new verbs.
 * hard: your «difíciles». extra: more practice on the weakest cards that aren't due yet.
 */
export function buildCardQueue(cards: ConjCard[], attempts: Attempt[], mode: QueueMode = 'study', now = Date.now()): ConjCard[] {
  const st = cardStates(attempts, now);
  const seen = cards.filter((c) => st.has(c.id));
  const weakest = (list: ConjCard[]) => [...list].sort((a, b) => st.get(a.id)!.retrievability - st.get(b.id)!.retrievability);
  if (mode === 'hard') return interleave(weakest(seen.filter((c) => st.get(c.id)!.hard)).slice(0, SESSION_REVIEWS));
  if (mode === 'extra') return interleave(weakest(seen.filter((c) => st.get(c.id)!.due > now)).slice(0, SESSION_REVIEWS));
  const due = weakest(seen.filter((c) => st.get(c.id)!.due <= now)).slice(0, SESSION_REVIEWS);
  const room = Math.min(SESSION_NEW, newLeftToday(attempts, now), SESSION_REVIEWS + 5 - due.length);
  return interleave([...due, ...(room > 0 ? pickNew(cards, st, room) : [])]);
}

export function deckStats(cards: ConjCard[], attempts: Attempt[], now = Date.now()) {
  const st = cardStates(attempts, now);
  const levels: Record<Level, number> = { nueva: 0, aprendiendo: 0, repasando: 0, dominada: 0 };
  let due = 0,
    hard = 0,
    nextDue = Infinity;
  for (const c of cards) {
    const s = st.get(c.id);
    if (!s) {
      levels.nueva++;
      continue;
    }
    levels[s.level]++;
    if (s.due <= now) due++;
    else nextDue = Math.min(nextDue, s.due);
    if (s.hard) hard++;
  }
  return { total: cards.length, due, hard, levels, nextDue: nextDue === Infinity ? null : nextDue, newToday: newLeftToday(attempts, now) };
}

/** Points for one answer: 10 for a right answer (×1.1 per card of your current streak, up to ×2), 5 with an accent
 * slip or a typo, 2 for getting a card right on the second go, 0 when wrong. */
export function pointsFor(grade: Grade, combo: number, retry: boolean): number {
  if (grade === Rating.Again) return 0;
  if (retry) return 2;
  if (grade === Rating.Hard) return 5;
  return Math.round(10 * (1 + Math.min(combo, 10) / 10));
}

export function whenLabel(ts: number, now = Date.now()): string {
  const m = Math.round((ts - now) / 6e4);
  if (m <= 1) return 'ahora';
  if (m < 60) return `en ${m} min`;
  if (m < 60 * 24) return `en ${Math.round(m / 60)} h`;
  const d = Math.round((ts - now) / DAY);
  return d === 1 ? 'mañana' : `en ${d} días`;
}
