import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import type { Attempt, Settings } from './lib/db';
import type { SessionSpec } from './lib/session';

export interface AppState {
  settings: Settings;
  attempts: Attempt[];
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
