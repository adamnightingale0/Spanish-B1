import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import type { Attempt, Settings, SrsRecord, SkillResult } from './lib/db';
import type { SessionSpec } from './lib/session';

export interface AppState {
  settings: Settings;
  attempts: Attempt[];
  srs: SrsRecord[];
  skills: SkillResult[];
  addSkillResult: (r: SkillResult) => void;
  saveSrsRecord: (r: SrsRecord) => void;
  hasBook: boolean;
  setHasBook: (b: boolean) => void;
  /** Opens the book viewer over the current screen (keeps a drill exactly where it was). */
  openBook: (printedPage: number) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  addAttempts: (a: Attempt[]) => void;
  replaceAttempt: (a: Attempt) => void;
  reload: () => Promise<void>;
  startSession: (s: SessionSpec, returnTo?: string) => void;
  session: SessionSpec | null;
  sessionReturn: string;
}

export const AppCtx = createContext<AppState>(null as unknown as AppState);
export const useApp = () => useContext(AppCtx);

export function navigate(path: string) {
  location.hash = '#/' + path.replace(/^#?\/?/, '');
}
