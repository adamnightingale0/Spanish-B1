/** Text-to-speech with an es-ES voice. Degrades quietly if no Spanish voice is installed. */
export const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

export function spanishVoices(): SpeechSynthesisVoice[] {
  if (!ttsSupported) return [];
  const all = speechSynthesis.getVoices();
  const es = all.filter((v) => v.lang?.toLowerCase().startsWith('es'));
  // es-ES first, then other Spanish voices.
  return es.sort((a, b) => Number(b.lang === 'es-ES') - Number(a.lang === 'es-ES'));
}

export function speak(text: string, voiceURI: string | null, rate = 1) {
  if (!ttsSupported) return;
  const voices = spanishVoices();
  if (!voices.length) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/___/g, '…'));
  u.voice = voices.find((v) => v.voiceURI === voiceURI) ?? voices[0];
  u.lang = u.voice.lang;
  u.rate = rate;
  speechSynthesis.speak(u);
}

export interface ScriptLine {
  speaker: string;
  text: string;
}

/**
 * Plays lines one after another. Each speaker gets a different Spanish voice when several are
 * installed, otherwise a different pitch. Resolves when finished or cancelled.
 */
export function playLines(
  lines: ScriptLine[],
  opts: { rate: number; voiceURI: string | null; onLine?: (i: number) => void; gapMs?: number },
  token: { cancelled: boolean }
): Promise<void> {
  const all = spanishVoices();
  const spain = all.filter((v) => v.lang === 'es-ES');
  const voices = spain.length >= 2 ? spain : all;
  const speakers = [...new Set(lines.map((l) => l.speaker))];
  const preferred = voices.find((v) => v.voiceURI === opts.voiceURI) ?? voices[0];
  const pitchFor = (s: string, i: number) => (s === 'F' ? 1.15 : s === 'M' ? 0.85 : [1, 0.8, 1.25, 0.95][i % 4]);
  const voiceFor = (i: number) => (voices.length > 1 ? (i === 0 ? preferred : voices.filter((v) => v !== preferred)[(i - 1) % (voices.length - 1)]) : preferred);
  return new Promise((resolve) => {
    let i = 0;
    const next = () => {
      if (token.cancelled || i >= lines.length) return resolve();
      const l = lines[i];
      const si = speakers.indexOf(l.speaker);
      opts.onLine?.(i);
      if (!ttsSupported || !voices.length) {
        // No voice: wait roughly as long as the line would take, so timing still works.
        setTimeout(() => ((i += 1), next()), Math.max(1200, l.text.length * 60) / opts.rate);
        return;
      }
      const u = new SpeechSynthesisUtterance(l.text);
      u.voice = voiceFor(si) ?? null;
      u.lang = u.voice?.lang ?? 'es-ES';
      u.rate = opts.rate;
      u.pitch = pitchFor(l.speaker, si);
      const done = () => {
        i += 1;
        setTimeout(next, opts.gapMs ?? 350);
      };
      u.onend = done;
      u.onerror = done;
      speechSynthesis.speak(u);
    };
    next();
  });
}

export function stopSpeaking() {
  if (ttsSupported) speechSynthesis.cancel();
}
