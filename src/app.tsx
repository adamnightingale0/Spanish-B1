import { useEffect, useState, useCallback } from 'preact/hooks';
import { AppCtx, type AppState, navigate } from './state';
import { loadAttempts, loadSettings, saveSettings, saveAttempt, requestPersistence, loadSrs, saveSrs, loadBook, type Attempt, type Settings, type SrsRecord } from './lib/db';
import type { SessionSpec } from './lib/session';
import { TabBar } from './components/TabBar';
import { Home } from './screens/Home';
import { Units, UnitDetail } from './screens/Units';
import { Practice } from './screens/Practice';
import { Drill } from './screens/Drill';
import { Sorter } from './screens/Sorter';
import { Exam } from './screens/Exam';
import { Progress } from './screens/Progress';
import { SettingsScreen } from './screens/Settings';
import { VocabScreen } from './screens/Vocab';
import { BookViewer, BookOverlay } from './screens/Book';

function useHashRoute(): string {
  const read = () => location.hash.replace(/^#\/?/, '') || 'home';
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => {
      setRoute(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function App() {
  const route = useHashRoute();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [session, setSession] = useState<SessionSpec | null>(null);
  const [srs, setSrs] = useState<SrsRecord[]>([]);
  const [hasBook, setHasBook] = useState(false);
  const [bookPage, setBookPage] = useState<number | null>(null);
  const [sessionReturn, setSessionReturn] = useState('home');

  const reload = useCallback(async () => {
    const [s, a, r, b] = await Promise.all([loadSettings(), loadAttempts(), loadSrs(), loadBook().catch(() => undefined)]);
    setSettings(s);
    setAttempts(a);
    setSrs(r);
    setHasBook(!!b);
    return;
  }, []);

  useEffect(() => {
    reload().then(async () => {
      // Save defaults on first run (keeps firstRun stable) and ask Safari to keep our storage.
      await saveSettings(await loadSettings());
      requestPersistence();
    });
  }, []);

  // The book overlay belongs to the screen it was opened from.
  useEffect(() => setBookPage(null), [route]);

  if (!settings) return <div class="screen muted">Cargando…</div>;

  const state: AppState = {
    settings,
    attempts,
    srs,
    hasBook,
    setHasBook,
    openBook: (p) => setBookPage(p),
    saveSrsRecord: (r) => {
      setSrs((prev) => [...prev.filter((x) => x.cardId !== r.cardId), r]);
      saveSrs(r);
    },
    session,
    sessionReturn,
    updateSettings: (patch) => {
      const next = { ...settings, ...patch };
      setSettings(next);
      saveSettings(next);
    },
    addAttempts: (list) => {
      setAttempts((prev) => [...prev, ...list]);
      list.forEach(saveAttempt);
    },
    replaceAttempt: (a) => {
      setAttempts((prev) => prev.map((x) => (x.key === a.key ? a : x)));
      saveAttempt(a);
    },
    reload,
    startSession: (s, returnTo) => {
      setSession({ ...s, startedAt: Date.now() });
      setSessionReturn(returnTo ?? (location.hash.replace(/^#\/?/, '') || 'home'));
      navigate('drill');
    }
  };

  const [head, arg] = route.split('/');
  let screen;
  let tabs = true;
  switch (head) {
    case 'units':
      screen = arg !== undefined ? <UnitDetail unit={Number(arg)} /> : <Units />;
      break;
    case 'practice':
      screen = <Practice />;
      break;
    case 'drill':
      screen = session ? <Drill key={session.startedAt} spec={session} /> : <Home />;
      tabs = !session;
      break;
    case 'sorter':
      screen = <Sorter />;
      tabs = false;
      break;
    case 'vocab':
      screen = <VocabScreen key={arg ?? 'all'} unit={arg ? Number(arg) : undefined} />;
      tabs = false;
      break;
    case 'book':
      screen = <BookViewer page={arg ? Number(arg) : undefined} />;
      tabs = false;
      break;
    case 'exam':
      screen = <Exam />;
      break;
    case 'progress':
      screen = <Progress />;
      break;
    case 'settings':
      screen = <SettingsScreen />;
      break;
    default:
      screen = <Home />;
  }

  return (
    <AppCtx.Provider value={state}>
      {screen}
      {tabs && <TabBar route={head} />}
      {bookPage !== null && <BookOverlay page={bookPage} backLabel={head === 'drill' ? '← Volver al ejercicio' : '← Volver'} onClose={() => setBookPage(null)} />}
    </AppCtx.Provider>
  );
}
