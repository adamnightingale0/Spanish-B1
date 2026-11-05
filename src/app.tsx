import { useEffect, useState, useCallback } from 'preact/hooks';
import { AppCtx, type AppState, navigate } from './state';
import { loadAttempts, loadSettings, saveSettings, saveAttempt, requestPersistence, type Attempt, type Settings } from './lib/db';
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
  const [sessionReturn, setSessionReturn] = useState('home');

  const reload = useCallback(async () => {
    const [s, a] = await Promise.all([loadSettings(), loadAttempts()]);
    setSettings(s);
    setAttempts(a);
    return;
  }, []);

  useEffect(() => {
    reload().then(async () => {
      // Save defaults on first run (keeps firstRun stable) and ask Safari to keep our storage.
      await saveSettings(await loadSettings());
      requestPersistence();
    });
  }, []);

  if (!settings) return <div class="screen muted">Cargando…</div>;

  const state: AppState = {
    settings,
    attempts,
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
      setSession(s);
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
      screen = session ? <Drill key={session.title + session.items.length + session.items[0]?.id} spec={session} /> : <Home />;
      tabs = !session;
      break;
    case 'sorter':
      screen = <Sorter />;
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
    </AppCtx.Provider>
  );
}
