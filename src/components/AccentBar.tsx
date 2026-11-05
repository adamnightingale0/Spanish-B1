const CHARS = ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡'];

/** Inserts accented characters at the caret of the last-focused input without closing the keyboard. */
export function AccentBar({
  target,
  onInsert
}: {
  target: { current: HTMLInputElement | null };
  onInsert: (el: HTMLInputElement, value: string) => void;
}) {
  const insert = (ch: string) => {
    const el = target.current ?? document.querySelector<HTMLInputElement>('.answer-input, .cloze-text input');
    if (!el || el.disabled) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const value = el.value.slice(0, start) + ch + el.value.slice(end);
    onInsert(el, value);
    requestAnimationFrame(() => {
      el.focus({ preventScroll: true });
      el.setSelectionRange(start + ch.length, start + ch.length);
    });
  };
  return (
    <div class="accent-bar" role="toolbar" aria-label="Acentos">
      {CHARS.map((c) => (
        <button
          type="button"
          // preventDefault on pointerdown keeps focus (and the iOS keyboard) on the input
          onPointerDown={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => insert(c)}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
