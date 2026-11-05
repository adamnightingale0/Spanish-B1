export type AccentMode = 'strict' | 'lenient';

export interface CheckResult {
  correct: boolean;
  /** The answer matched only after removing accents. */
  accentOnly: boolean;
  /** The accepted answer closest to what was typed (for showing the model form). */
  expected: string;
}

const SUBJECT_PRONOUNS = /^(yo|tú|tu|él|el|ella|usted|nosotros|nosotras|vosotros|vosotras|ellos|ellas|ustedes)\s+/;

/** Trim, collapse spaces, lower-case, unify quotes, drop ¡¿ and commas, strip final punctuation. */
export function normalise(s: string): string {
  return s
    .normalize('NFC')
    .replace(/[‘’´`]/g, "'")
    .replace(/[“”«»]/g, '"')
    .toLowerCase()
    .replace(/[¡¿]/g, '')
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.!?;:…"']+$/g, '')
    .replace(/^["']+/, '')
    .trim();
}

/** Remove accents and diaeresis but keep ñ (ñ vs n always counts). */
export function stripAccents(s: string): string {
  return s
    .replace(/ñ/g, '\u0000')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\u0000/g, 'ñ');
}

export function checkAnswer(
  given: string,
  answers: string[],
  mode: AccentMode,
  opts: { allowSubjectPronoun?: boolean } = {}
): CheckResult {
  let g = normalise(given);
  if (opts.allowSubjectPronoun) g = g.replace(SUBJECT_PRONOUNS, '');
  const norm = answers.map((a) => normalise(a));
  const exact = norm.findIndex((a) => a === g);
  if (exact >= 0) return { correct: true, accentOnly: false, expected: answers[exact] };
  const gs = stripAccents(g);
  const loose = norm.findIndex((a) => stripAccents(a) === gs);
  if (loose >= 0) return { correct: mode === 'lenient', accentOnly: true, expected: answers[loose] };
  return { correct: false, accentOnly: false, expected: answers[0] };
}
