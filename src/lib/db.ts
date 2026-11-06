import { createStore, get, set, del, entries, setMany, clear } from 'idb-keyval';
import type { AccentMode } from './answer';

/** One answer to one item (or one cloze gap: itemId = "<id>#<n>"). */
export interface Attempt {
  key: string; // `${ts}-${itemId}`
  itemId: string;
  grammarPoint: string;
  subPoint?: string;
  unit: number;
  ts: number;
  correct: boolean;
  given: string;
  accentOnly?: boolean;
  reasonCorrect?: boolean;
  override?: boolean; // the "typo" button turned a wrong mark into a right one
  ms?: number; // time spent on the item
  errorTag?: string; // what was confused, e.g. 'indefinido→imperfecto' (see errors.ts)
}

export interface Settings {
  name: string; // shown in the Home greeting; empty = no name
  examDate: string; // yyyy-mm-dd
  classUnit: number;
  focus: string; // 'past-tenses' | grammarPoint id | 'none'
  accent: AccentMode;
  sessionMinutes: number;
  voiceURI: string | null;
  ttsRate: number;
  lastBackup: number | null;
  firstRun: number;
  pageOffset: number; // PDF page = printed page + pageOffset
  placementDone: number | null;
}

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  examDate: '2027-01-18',
  classUnit: 2,
  focus: 'past-tenses',
  accent: 'lenient',
  sessionMinutes: 15,
  voiceURI: null,
  ttsRate: 1,
  lastBackup: null,
  firstRun: Date.now(),
  pageOffset: 1,
  placementDone: null
};

const attemptsStore = createStore('b1-attempts', 'attempts');
const metaStore = createStore('b1-meta', 'meta');
const srsStore = createStore('b1-srs', 'srs');
const bookStore = createStore('b1-book', 'book');
const skillStore = createStore('b1-skills', 'results');
const writingStore = createStore('b1-writing', 'drafts');
const examStore = createStore('b1-exams', 'exams');

/** A writing draft, kept per task (and per mock) so nothing is lost if the app closes. */
export interface WritingDraft {
  key: string; // task id, or `mock:<ts>:<task id>`
  taskId: string;
  text: string;
  covered: boolean[];
  ts: number;
  self?: number[];
  submitted?: boolean;
}
export const loadDraft = (key: string) => get<WritingDraft>(key, writingStore);
export const saveDraft = (d: WritingDraft) => set(d.key, d, writingStore);
export async function loadDrafts(): Promise<WritingDraft[]> {
  return (await entries<string, WritingDraft>(writingStore)).map(([, v]) => v);
}

/** A finished mock exam (written part). Scores are fractions 0–1. */
export interface ExamRecord {
  key: string;
  profileId: string;
  ts: number;
  scores: { reading?: number; listening?: number; writing?: number; speaking?: number };
  overall: number;
  passed: boolean;
  kind: 'written' | 'weekly';
}
export async function loadExams(): Promise<ExamRecord[]> {
  return (await entries<string, ExamRecord>(examStore)).map(([, v]) => v).sort((a, b) => a.ts - b.ts);
}
export const saveExam = (e: ExamRecord) => set(e.key, e, examStore);

/** The mock in progress (so a 3-hour exam survives the app being closed). */
export const loadMockState = <T>() => get<T>('mock', metaStore);
export const saveMockState = (m: unknown) => set('mock', m, metaStore);
export const clearMockState = () => del('mock', metaStore);

/** One completed reading or listening task. */
export interface SkillResult {
  key: string;
  taskId: string;
  skill: 'reading' | 'listening' | 'writing' | 'speaking';
  format: string;
  correct: number;
  total: number;
  timed: boolean;
  paper?: boolean; // part of a full timed paper
  mock?: boolean; // part of a full written mock
  weekly?: boolean; // part of the weekly check
  ms: number;
  ts: number;
  answers: (string | number | null)[];
}
export async function loadSkillResults(): Promise<SkillResult[]> {
  return (await entries<string, SkillResult>(skillStore)).map(([, v]) => v).sort((a, b) => a.ts - b.ts);
}
export const saveSkillResult = (r: SkillResult) => set(r.key, r, skillStore);

/** Spaced-repetition state for one vocabulary card (FSRS card serialised with dates as ISO strings). */
export interface SrsRecord {
  cardId: string;
  fsrs: Record<string, unknown>;
  recogCorrect: number; // correct ES→EN answers; after 2, the card switches to EN→ES typed recall
  introduced: number; // ts the card was first studied
  lastRating?: number;
}

export async function loadSrs(): Promise<SrsRecord[]> {
  return (await entries<string, SrsRecord>(srsStore)).map(([, v]) => v);
}
export const saveSrs = (r: SrsRecord) => set(r.cardId, r, srsStore);

/** The user's own book PDF, kept only on this device and never exported. */
export const loadBook = () => get<Blob>('pdf', bookStore);
export const saveBook = (b: Blob) => set('pdf', b, bookStore);
export const removeBook = () => del('pdf', bookStore);

export async function loadSettings(): Promise<Settings> {
  const s = (await get<Partial<Settings>>('settings', metaStore)) ?? {};
  return { ...DEFAULT_SETTINGS, ...s };
}
export const saveSettings = (s: Settings) => set('settings', s, metaStore);

export async function loadAttempts(): Promise<Attempt[]> {
  const all = await entries<string, Attempt>(attemptsStore);
  return all.map(([, v]) => v).sort((a, b) => a.ts - b.ts);
}
export const saveAttempt = (a: Attempt) => set(a.key, a, attemptsStore);
export const deleteAttempt = (key: string) => del(key, attemptsStore);

export async function requestPersistence(): Promise<boolean> {
  try {
    if (navigator.storage?.persisted && (await navigator.storage.persisted())) return true;
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

export interface Backup {
  app: 'spanish-b1-practice';
  version: 1;
  exportedAt: string;
  settings: Settings;
  attempts: Attempt[];
  srs?: SrsRecord[];
  skills?: SkillResult[];
  writing?: WritingDraft[];
  exams?: ExamRecord[];
}

export async function exportBackup(): Promise<Backup> {
  return {
    app: 'spanish-b1-practice',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: await loadSettings(),
    attempts: await loadAttempts(),
    srs: await loadSrs(),
    skills: await loadSkillResults(),
    writing: await loadDrafts(),
    exams: await loadExams()
  };
}

export async function importBackup(data: unknown): Promise<number> {
  const b = data as Backup;
  if (!b || b.app !== 'spanish-b1-practice' || !Array.isArray(b.attempts)) throw new Error('This file is not a Spanish B1 Practice backup.');
  await setMany(b.attempts.map((a) => [a.key, a]), attemptsStore);
  if (Array.isArray(b.srs)) await setMany(b.srs.map((r) => [r.cardId, r]), srsStore);
  if (Array.isArray(b.skills)) await setMany(b.skills.map((r) => [r.key, r]), skillStore);
  if (Array.isArray(b.writing)) await setMany(b.writing.map((r) => [r.key, r]), writingStore);
  if (Array.isArray(b.exams)) await setMany(b.exams.map((r) => [r.key, r]), examStore);
  await saveSettings({ ...DEFAULT_SETTINGS, ...b.settings });
  return b.attempts.length;
}

export async function resetAll() {
  await clear(attemptsStore);
  await clear(metaStore);
  await clear(srsStore);
  await clear(skillStore);
  await clear(writingStore);
  await clear(examStore);
}
