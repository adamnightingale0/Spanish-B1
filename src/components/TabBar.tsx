const TABS = [
  { id: 'home', label: 'Hoy', ico: '☀︎' },
  { id: 'units', label: 'Unidades', ico: '▦' },
  { id: 'practice', label: 'Practicar', ico: '✎' },
  { id: 'exam', label: 'Examen', ico: '⏱' },
  { id: 'progress', label: 'Progreso', ico: '▲' }
];

export function TabBar({ route }: { route: string }) {
  const active = route === 'settings' ? 'progress' : route === 'reading' || route === 'listening' || route === 'writing' ? 'practice' : route;
  return (
    <nav class="tabbar">
      {TABS.map((t) => (
        <a href={`#/${t.id}`} class={active === t.id ? 'on' : ''} aria-current={active === t.id ? 'page' : undefined}>
          <span class="ico" aria-hidden="true">{t.ico}</span>
          {t.label}
        </a>
      ))}
    </nav>
  );
}
