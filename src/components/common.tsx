import type { ComponentChildren } from 'preact';
import type { Mastery } from '../lib/stats';
import { speak, ttsSupported } from '../lib/tts';
import { useApp } from '../state';

export function MasteryBar({ m, label }: { m?: Mastery; label?: string }) {
  const acc = m?.accuracy ?? null;
  const cls = acc === null ? 'none' : acc >= 0.8 ? '' : acc >= 0.6 ? 'mid' : 'low';
  return (
    <div>
      {label && (
        <div class="row spread small">
          <span>{label}</span>
          <span class="muted tiny">{acc === null ? (m?.total ? `${m.total}/5 intentos` : 'sin datos') : `${Math.round(acc * 100)} %`}</span>
        </div>
      )}
      <div class={`bar ${cls}`} title={acc === null ? 'No hay datos suficientes' : `${Math.round(acc * 100)} %`}>
        {acc !== null && <i style={{ width: `${Math.max(4, acc * 100)}%` }} />}
      </div>
    </div>
  );
}

export function Speak({ text }: { text: string }) {
  const { settings } = useApp();
  if (!ttsSupported) return null;
  return (
    <button
      class="btn-ghost btn-small"
      aria-label="Escuchar"
      onClick={(e) => {
        e.stopPropagation();
        speak(text, settings.voiceURI, settings.ttsRate);
      }}
    >
      🔊
    </button>
  );
}

/** "📖 Book: p. 28 · Más ejercicios p. 186". Page numbers open the viewer when a PDF is loaded. */
export function BookRef({ page, masEjercicios, masGramatica, ejercicios }: { page?: number; masEjercicios?: number; masGramatica?: number; ejercicios?: string }) {
  const app = useApp();
  if (!page) return null;
  const P = ({ n }: { n: number }) =>
    app.hasBook ? (
      <button class="bookref-link" onClick={() => app.openBook(n)}>
        p. {n}
      </button>
    ) : (
      <>p. {n}</>
    );
  return (
    <p class="small muted">
      📖 Libro: <P n={page} />
      {masEjercicios ? (
        <>
          {' · Más ejercicios '}
          <P n={masEjercicios} />
          {ejercicios ? ` (ej. ${ejercicios})` : ''}
        </>
      ) : null}
      {masGramatica ? (
        <>
          {' · Más gramática '}
          <P n={masGramatica} />
        </>
      ) : null}
    </p>
  );
}

export function Header({ title, back, children }: { title: string; back?: string; children?: ComponentChildren }) {
  return (
    <header>
      {back !== undefined && (
        <a class="btn btn-ghost" href={`#/${back}`} style={{ paddingLeft: 0 }}>
          ‹ Volver
        </a>
      )}
      <h1>{title}</h1>
      {children}
    </header>
  );
}

export const pct = (x: number | null | undefined) => (x === null || x === undefined ? '—' : `${Math.round(x * 100)} %`);
