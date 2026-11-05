import type { WritingTask, WritingTarget } from './schema';

export const WRITING_MINUTES = 70;

/** Words as counted in the exam: anything separated by spaces (numbers count, punctuation doesn't). */
export function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/** How many times a target structure appears (distinct matches when `distinct`). */
export function targetHits(text: string, t: WritingTarget): number {
  let re: RegExp;
  try {
    re = new RegExp(t.pattern, 'giu');
  } catch {
    return 0;
  }
  const found = [...text.matchAll(re)].map((m) => m[0].trim().toLowerCase().replace(/^[^\p{L}]+/u, ''));
  return t.distinct ? new Set(found).size : found.length;
}
export const targetMet = (text: string, t: WritingTarget) => targetHits(text, t) >= (t.min ?? 1);

export const CRITERIA = [
  {
    id: 'task',
    label: 'Cumplimiento de la tarea',
    levels: ['No responde a la tarea o faltan muchos puntos.', 'Cubre algunos puntos; el registro o el género no son adecuados.', 'Cubre casi todos los puntos con un registro adecuado.', 'Cubre todos los puntos, con el registro y el género adecuados.']
  },
  {
    id: 'coherence',
    label: 'Coherencia y cohesión',
    levels: ['Ideas sueltas, difíciles de seguir.', 'Se entiende, pero con pocos conectores y saltos de idea.', 'Texto organizado en párrafos, con conectores variados.', 'Texto claro y fluido, con conectores y referencias bien usados.']
  },
  {
    id: 'vocab',
    label: 'Vocabulario (alcance y control)',
    levels: ['Vocabulario muy básico, con errores que impiden entender.', 'Vocabulario limitado o repetitivo, con bastantes errores.', 'Vocabulario adecuado al tema, con algunos errores.', 'Vocabulario variado y preciso para el tema.']
  },
  {
    id: 'grammar',
    label: 'Gramática (alcance y control)',
    levels: ['Errores constantes que impiden entender.', 'Estructuras simples, con errores frecuentes en los tiempos.', 'Usa bien los pasados y alguna estructura compleja, con algunos errores.', 'Variedad de estructuras (pasados, subjuntivo, condicional) con pocos errores.']
  }
] as const;

export interface WritingAssessment {
  self: number[]; // 0–3 per criterion
  pointsCovered: boolean[];
  words: number;
}

/**
 * Self-assessed score, adjusted down when the task was not fully done:
 * a missed content point caps task fulfilment at 1; a word count more than 10 % outside
 * 120–150 takes one more point off task fulfilment. Returns points out of 12.
 */
export function writingScore(a: WritingAssessment, range: [number, number] = [120, 150]): { points: number; max: number; notes: string[] } {
  const s = [...a.self];
  const notes: string[] = [];
  if (a.pointsCovered.some((c) => !c) && s[0] > 1) {
    s[0] = 1;
    notes.push('Falta algún punto de contenido: «Cumplimiento de la tarea» queda en 1 como máximo.');
  }
  if (a.words < range[0] * 0.9 || a.words > range[1] * 1.1) {
    s[0] = Math.max(0, s[0] - 1);
    notes.push(`El texto tiene ${a.words} palabras (deberían ser ${range[0]}–${range[1]}): −1 en «Cumplimiento de la tarea».`);
  }
  return { points: s.reduce((x, y) => x + y, 0), max: 12, notes };
}

export function exportForMarking(task: WritingTask, text: string): string {
  return [
    `TAREA (examen B1, Universidad de Sevilla): ${task.title}`,
    task.prompt,
    '',
    'Puntos de contenido:',
    ...task.contentPoints.map((p) => `- ${p}`),
    `Extensión: ${task.wordRange[0]}–${task.wordRange[1]} palabras. Mi texto tiene ${countWords(text)}.`,
    '',
    'MI TEXTO:',
    text,
    '',
    'Por favor, corrige mi texto según los cuatro criterios oficiales (0–3 cada uno):',
    ...CRITERIA.map((c) => `- ${c.label}`),
    'Señala los errores de gramática (sobre todo los tiempos del pasado), explica por qué y propón una versión mejorada.'
  ].join('\n');
}
