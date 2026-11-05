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
}

export interface Settings {
  examDate: string; // yyyy-mm-dd
  classUnit: number;
  focus: string; // 'past-tenses' | grammarPoint id | 'none'
  accent: AccentMode;
  sessionMinutes: number;
  voiceURI: string | null;
  ttsRate: number;
  lastBackup: number | null;
  firstRun: number;
}

export const DEFAULT_SETTINGS: Settings = {
  examDate: '2027-01-18',
  classUnit: 2,
  focus: 'past-tenses',
  accent: 'lenient',
  sessionMinutes: 15,
  voiceURI: null,
  ttsRate: 1,
  lastBackup: null,
  firstRun: Date.now()
};

const attemptsStore = createStore('b1-attempts', 'attempts');
const metaStore = createStore('b1-meta', 'meta');

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
}

export async function exportBackup(): Promise<Backup> {
  return {
    app: 'spanish-b1-practice',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: await loadSettings(),
    attempts: await loadAttempts()
  };
}

export async function importBackup(data: unknown): Promise<number> {
  const b = data as Backup;
  if (!b || b.app !== 'spanish-b1-practice' || !Array.isArray(b.attempts)) throw new Error('This file is not a Spanish B1 Practice backup.');
  await setMany(b.attempts.map((a) => [a.key, a]), attemptsStore);
  await saveSettings({ ...DEFAULT_SETTINGS, ...b.settings });
  return b.attempts.length;
}

export async function resetAll() {
  await clear(attemptsStore);
  await clear(metaStore);
}
