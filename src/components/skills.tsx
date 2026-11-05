import { useEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';

/** Countdown in mm:ss. Calls onEnd once when it reaches zero. */
export function Timer({ seconds, running, onEnd, startedAt }: { seconds: number; running: boolean; onEnd: () => void; startedAt: number }) {
  const [now, setNow] = useState(Date.now());
  const ended = useRef(false);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);
  const left = Math.max(0, seconds - Math.floor((now - startedAt) / 1000));
  useEffect(() => {
    if (running && left === 0 && !ended.current) {
      ended.current = true;
      onEnd();
    }
  }, [left, running]);
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  return <span class={`timer ${left < 300 ? 'low' : ''}`}>⏱ {mm}:{ss}</span>;
}

/** Renders text with each needle wrapped in <mark>. Needles that are not found are ignored. */
export function Highlight({ text, marks }: { text: string; marks: { needle: string; cls?: string; id?: string }[] }) {
  const found = marks
    .map((m) => ({ ...m, at: m.needle ? text.indexOf(m.needle) : -1 }))
    .filter((m) => m.at >= 0)
    .sort((a, b) => a.at - b.at);
  const out: ComponentChildren[] = [];
  let pos = 0;
  for (const m of found) {
    if (m.at < pos) continue;
    out.push(text.slice(pos, m.at));
    out.push(
      <mark class={m.cls ?? 'evidence'} id={m.id}>
        {m.needle}
      </mark>
    );
    pos = m.at + m.needle.length;
  }
  out.push(text.slice(pos));
  return <>{out}</>;
}

export function Tabs<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div class="tabs" role="tablist">
      {options.map((o) => (
        <button role="tab" aria-selected={value === o.id} class={value === o.id ? 'on' : ''} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const scorePct = (c: number, t: number) => (t ? Math.round((c / t) * 100) : 0);
