import { useEffect, useRef, useState } from 'preact/hooks';
import { useApp, navigate } from '../state';
import { openBook, renderPage, freeCanvas, UNIT_STARTS, MAS_EJERCICIOS, MAS_GRAMATICA } from '../lib/book';
import { units } from '../lib/content';

type Doc = Awaited<ReturnType<typeof openBook>>;

/**
 * Full-screen viewer for the user's own PDF. Renders one page at a time and keeps only the
 * current, previous and next pages in memory. `page` is the printed page number.
 */
export function BookOverlay({ page, onClose, backLabel = '← Volver al ejercicio' }: { page: number; onClose: () => void; backLabel?: string }) {
  const app = useApp();
  const offset = app.settings.pageOffset;
  const [doc, setDoc] = useState<Doc>(null);
  const [error, setError] = useState('');
  const [printed, setPrinted] = useState(page);
  const [zoom, setZoom] = useState(1);
  const [busy, setBusy] = useState(true);
  const [jump, setJump] = useState(String(page));
  const [menu, setMenu] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const cache = useRef(new Map<string, HTMLCanvasElement>());
  const touch = useRef<{ x: number; y: number; t: number } | null>(null);
  const lastTap = useRef(0);
  const pinch = useRef(1);

  const pdfPage = printed + offset;

  useEffect(() => {
    openBook()
      .then((d) => (d ? setDoc(d) : setError('No hay ningún libro cargado.')))
      .catch((e) => setError('No se pudo abrir el PDF: ' + (e as Error).message));
    const block = (e: Event) => e.preventDefault();
    document.addEventListener('gesturestart', block);
    return () => {
      document.removeEventListener('gesturestart', block);
      for (const c of cache.current.values()) freeCanvas(c);
      cache.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!doc || !host.current) return;
    let cancelled = false;
    const width = Math.min(host.current.clientWidth || window.innerWidth, 900);
    const key = (n: number) => `${n}@${zoom}@${width}`;
    const want = [pdfPage, pdfPage + 1, pdfPage - 1].filter((n) => n >= 1 && n <= doc.numPages);
    // Free everything except the pages we keep.
    for (const [k, c] of cache.current) {
      if (!want.some((n) => k === key(n))) {
        freeCanvas(c);
        cache.current.delete(k);
      }
    }
    const draw = async (n: number) => {
      if (cache.current.has(key(n))) return cache.current.get(key(n))!;
      const c = document.createElement('canvas');
      c.className = 'book-canvas';
      cache.current.set(key(n), c);
      await renderPage(doc, n, c, width, zoom);
      return c;
    };
    setBusy(true);
    (async () => {
      try {
        const cur = await draw(pdfPage);
        if (cancelled || !host.current) return;
        host.current.replaceChildren(cur);
        setBusy(false);
        for (const n of want.slice(1)) if (!cancelled) await draw(n);
      } catch (e) {
        if (!cancelled) setError('Error al mostrar la página: ' + (e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doc, pdfPage, zoom]);

  const go = (p: number) => {
    if (!doc) return;
    const clamped = Math.max(1 - offset, Math.min(doc.numPages - offset, p));
    setPrinted(clamped);
    setJump(String(clamped));
    setZoom(1);
    scroller.current?.scrollTo(0, 0);
  };

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
  };
  const onTouchEnd = (e: TouchEvent) => {
    const s = touch.current;
    touch.current = null;
    if (!s || e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - s.x;
    const dy = e.changedTouches[0].clientY - s.y;
    const now = Date.now();
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      if (now - lastTap.current < 300) setZoom((z) => (z > 1 ? 1 : 2));
      lastTap.current = now;
      return;
    }
    if (zoom === 1 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && now - s.t < 600) go(printed + (dx < 0 ? 1 : -1));
  };
  const gesture = {
    onGestureChange: (e: Event & { scale?: number }) => {
      pinch.current = e.scale ?? 1;
      if (host.current) host.current.style.transform = `scale(${pinch.current})`;
    },
    onGestureEnd: () => {
      if (host.current) host.current.style.transform = '';
      setZoom((z) => Math.max(1, Math.min(3, Math.round(z * pinch.current * 2) / 2)));
      pinch.current = 1;
    }
  };

  return (
    <div class="book-overlay" role="dialog" aria-label="Libro">
      <div class="book-bar">
        <button class="btn-small" onClick={onClose}>
          {backLabel}
        </button>
        <form
          class="row"
          onSubmit={(e) => {
            e.preventDefault();
            go(Number(jump) || printed);
          }}
        >
          <span class="small">p.</span>
          <input class="page-input" type="text" inputMode="numeric" value={jump} onInput={(e) => setJump(e.currentTarget.value)} aria-label="Página" />
        </form>
        <button class="btn-small" onClick={() => setMenu(!menu)} aria-label="Unidades">
          ☰
        </button>
      </div>
      {menu && (
        <div class="book-menu">
          {units
            .filter((u) => u.unit > 0)
            .map((u, i) => (
              <button
                class="btn-small"
                onClick={() => {
                  go(UNIT_STARTS[i]);
                  setMenu(false);
                }}
              >
                {u.unit}. {u.title}
              </button>
            ))}
          <button class="btn-small" onClick={() => (go(MAS_EJERCICIOS), setMenu(false))}>
            Más ejercicios
          </button>
          <button class="btn-small" onClick={() => (go(MAS_GRAMATICA), setMenu(false))}>
            Más gramática
          </button>
          <div class="row small" style={{ gridColumn: '1 / -1', marginTop: 6 }}>
            <span class="grow">Desfase PDF: {offset} (PDF p. {pdfPage})</span>
            <button class="btn-small" onClick={() => app.updateSettings({ pageOffset: offset - 1 })}>
              −
            </button>
            <button class="btn-small" onClick={() => app.updateSettings({ pageOffset: offset + 1 })}>
              +
            </button>
          </div>
        </div>
      )}
      <div
        class={`book-scroll ${zoom > 1 ? 'zoomed' : ''}`}
        ref={scroller}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        {...(gesture as Record<string, unknown>)}
      >
        {error ? <p class="book-msg">{error}</p> : busy && <p class="book-msg">Cargando página…</p>}
        <div ref={host} class="book-host" />
      </div>
      <div class="book-nav">
        <button onClick={() => go(printed - 1)} aria-label="Página anterior">
          ‹
        </button>
        <span class="small muted">
          Página {printed}
          {doc ? ` · ${zoom > 1 ? zoom + '×' : 'doble toque para ampliar'}` : ''}
        </span>
        <button onClick={() => go(printed + 1)} aria-label="Página siguiente">
          ›
        </button>
      </div>
    </div>
  );
}

/** #/book/<page>: standalone route (Settings, Units). */
export function BookViewer({ page }: { page?: number }) {
  const app = useApp();
  return <BookOverlay page={page ?? 10} backLabel="← Volver" onClose={() => (history.length > 1 ? history.back() : navigate('settings'))} />;
}
