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
