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

export function BookRef({ page, masEjercicios, masGramatica, ejercicios }: { page?: number; masEjercicios?: number; masGramatica?: number; ejercicios?: string }) {
  if (!page) return null;
  return (
    <p class="small muted">
      📖 Libro: p. {page}
      {masEjercicios ? ` · Más ejercicios p. ${masEjercicios}${ejercicios ? ` (ej. ${ejercicios})` : ''}` : ''}
      {masGramatica ? ` · Más gramática p. ${masGramatica}` : ''}
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
