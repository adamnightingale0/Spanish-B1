import { z } from 'zod';

import { WHY_IDS } from './why';
export { WHY_IDS };
export const WhyId = z.enum(WHY_IDS);

export const BookRef = z.object({
  page: z.number().int().positive(),
  masEjercicios: z.number().int().positive().optional(),
  masGramatica: z.number().int().positive().optional(),
  ejercicios: z.string().optional() // exercise numbers in Más ejercicios, e.g. "8-9"
});

const base = {
  id: z.string().regex(/^[a-z0-9-]+$/),
  unit: z.number().int().min(0).max(12), // 0 = programa pack
  grammarPoint: z.string(),
  subPoint: z.string().optional(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  feedback: z.string().min(3),
  contrast: z.string().optional(),
  why: WhyId.optional()
};

const answers = z.array(z.string().min(1)).min(1);

export const GapItem = z.object({ ...base, type: z.literal('gap'), prompt: z.string().includes('___'), answers });
export const TransformItem = z.object({
  ...base,
  type: z.literal('transform'),
  instruction: z.string(),
  prompt: z.string(),
  answers
});
export const ConjugateItem = z.object({
  ...base,
  type: z.literal('conjugate'),
  verb: z.string(),
  person: z.string(),
  tense: z.string(),
  prompt: z.string().optional(),
  answers
});
export const ChoiceItem = z
  .object({
    ...base,
    type: z.literal('choice'),
    prompt: z.string(),
    options: z.array(z.string()).min(2).max(4),
    answers: z.array(z.string()).length(1)
  })
  .refine((i) => i.options.includes(i.answers[0]), { message: 'choice answer must be one of options' });

export const ClozeGap = z.object({
  n: z.number().int().positive(),
  answers,
  why: WhyId.optional(),
  feedback: z.string().min(3)
});
export const ClozeItem = z
  .object({
    ...base,
    type: z.literal('cloze'),
    title: z.string(),
    text: z.string(),
    gaps: z.array(ClozeGap).min(4).max(10)
  })
  .refine(
    (i) => {
      const marks = [...i.text.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));
      return marks.length === i.gaps.length && i.gaps.every((g) => marks.includes(g.n));
    },
    { message: 'cloze {{n}} markers must match gaps[]' }
  );

/** error: tap the wrong word (token index in prompt.split(' ')), then type the correction. */
export const ErrorItem = z
  .object({ ...base, type: z.literal('error'), prompt: z.string(), errorIndex: z.number().int().min(0), errorLength: z.number().int().min(1).max(4).optional(), answers })
  .refine((i) => i.errorIndex + (i.errorLength ?? 1) <= i.prompt.split(' ').length, { message: 'error span out of range' });
/** The words of an error item that are wrong (errorIndex … errorIndex + errorLength − 1). */
export const inErrorSpan = (i: { errorIndex: number; errorLength?: number }, k: number) => k >= i.errorIndex && k < i.errorIndex + (i.errorLength ?? 1);
export const errorSpanText = (i: { prompt: string; errorIndex: number; errorLength?: number }) => i.prompt.split(' ').slice(i.errorIndex, i.errorIndex + (i.errorLength ?? 1)).join(' ');
/** order: put the shuffled words of answers[0] in order. */
export const OrderItem = z.object({ ...base, type: z.literal('order'), instruction: z.string(), answers });
/** match: match each beginning to its ending. */
export const MatchItem = z.object({
  ...base,
  type: z.literal('match'),
  instruction: z.string(),
  pairs: z.array(z.object({ left: z.string(), right: z.string() })).min(3).max(6)
});

export const DrillItem = z.union([GapItem, TransformItem, ConjugateItem, ChoiceItem, ClozeItem, ErrorItem, OrderItem, MatchItem]);

export const UnitPack = z.object({
  id: z.string(),
  unit: z.number().int().min(0).max(12),
  title: z.string(),
  theme: z.string(),
  vocabAreas: z.array(z.string()),
  writingTask: z.string().optional(),
  bookRef: BookRef.optional(),
  grammarPoints: z.array(z.string()).min(1),
  items: z.array(DrillItem)
});

export const TimeMarker = z.object({
  text: z.string(),
  tense: z.enum(['perfecto', 'indefinido', 'imperfecto']),
  note: z.string().optional()
});

export const FocusPack = z.object({
  id: z.string(),
  title: z.string(),
  subPoints: z.array(z.object({ id: z.string(), title: z.string(), summary: z.string() })),
  markers: z.array(TimeMarker).min(10),
  items: z.array(DrillItem)
});

export const GrammarPoint = z.object({
  id: z.string(),
  unit: z.number().int().min(0).max(12),
  title: z.string(),
  summary: z.string(),
  rules: z.array(z.string()).min(1),
  examples: z.array(z.string()).default([]),
  bookRef: BookRef.optional()
});
export const GrammarPoints = z.array(GrammarPoint);

export const ExamProfile = z.object({
  id: z.string(),
  name: z.string(),
  papers: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      skill: z.enum(['reading', 'listening', 'writing', 'speaking', 'break']),
      minutes: z.number(),
      prepMinutes: z.number().optional(),
      weight: z.number(),
      maxScore: z.number(),
      written: z.boolean(),
      tasks: z.array(z.object({ format: z.string(), count: z.number(), description: z.string() }))
    })
  ),
  passRule: z.object({
    minOverall: z.number(),
    minPerSkill: z.number(),
    oralRequiresWrittenPass: z.boolean(),
    carryWrittenPass: z.boolean()
  }),
  writingCriteria: z.array(z.string()),
  speakingCriteria: z.array(z.string())
});

export const VocabCard = z.object({
  id: z.string().regex(/^v\d{2}-[a-z0-9-]+$/),
  unit: z.number().int().min(1).max(12),
  topic: z.string(),
  es: z.string(),
  en: z.string(),
  gender: z.enum(['m', 'f']).optional(),
  example_es: z.string(),
  example_en: z.string(),
  collocation: z.string().optional()
});
export const VocabPack = z.object({ id: z.string(), unit: z.number().int(), cards: z.array(VocabCard).min(1) });

export const Manifest = z.object({
  version: z.string(),
  packs: z.array(z.string())
});

export type DrillItem = z.infer<typeof DrillItem>;
export type VocabCard = z.infer<typeof VocabCard>;
export type ClozeItem = z.infer<typeof ClozeItem>;
export type UnitPack = z.infer<typeof UnitPack>;
export type FocusPack = z.infer<typeof FocusPack>;
export type GrammarPoint = z.infer<typeof GrammarPoint>;
export type ExamProfile = z.infer<typeof ExamProfile>;
export type WhyId = z.infer<typeof WhyId>;
export type TimeMarker = z.infer<typeof TimeMarker>;

/* ---------- Skill tasks (Phase 3) ---------- */

const evidenceText = z.string().min(5); // must appear verbatim in the text / script (checked by validate-content)

export const ReadMcq = z.object({
  id: z.string(),
  unit: z.number().int().min(0).max(12),
  taskFormat: z.literal('read-mcq'),
  title: z.string(),
  topic: z.string(),
  text: z.array(z.string()).min(3), // paragraphs
  questions: z
    .array(z.object({ q: z.string(), options: z.array(z.string()).length(3), answer: z.number().int().min(0).max(2), evidence: evidenceText }))
    .length(7)
});

export const ReadMatch = z.object({
  id: z.string(),
  unit: z.number().int().min(0).max(12),
  taskFormat: z.literal('read-match'),
  title: z.string(),
  topic: z.string(),
  instruction: z.string(),
  profiles: z.array(z.object({ id: z.string().regex(/^[A-J]$/), text: z.string() })).length(10),
  texts: z.array(z.object({ title: z.string(), text: z.string(), answer: z.string().regex(/^[A-J]$/), evidence: evidenceText })).length(8)
});

export const ReadInsert = z.object({
  id: z.string(),
  unit: z.number().int().min(0).max(12),
  taskFormat: z.literal('read-insert'),
  title: z.string(),
  topic: z.string(),
  text: z.array(z.string()).min(3), // paragraphs with {{1}}…{{7}} markers
  fragments: z.array(z.object({ id: z.string().regex(/^[A-J]$/), text: z.string() })).length(10),
  gaps: z.array(z.object({ n: z.number().int().min(1).max(7), answer: z.string().regex(/^[A-J]$/), clue: evidenceText, why: z.string() })).length(7)
});

export const ReadingTask = z.union([ReadMcq, ReadMatch, ReadInsert]);

const Line = z.object({ speaker: z.string(), line: z.string() });

export const ListenReply = z.object({
  id: z.string(),
  unit: z.number().int().min(0).max(12),
  taskFormat: z.literal('listen-reply'),
  title: z.string(),
  voiceRate: z.number().default(1),
  items: z
    .array(z.object({ speaker: z.string(), script: z.string(), options: z.array(z.string()).length(3), answer: z.number().int().min(0).max(2), why: z.string() }))
    .length(6)
});

export const ListenSpeakers = z.object({
  id: z.string(),
  unit: z.number().int().min(0).max(12),
  taskFormat: z.literal('listen-speakers'),
  title: z.string(),
  context: z.string(),
  voiceRate: z.number().default(1),
  speakers: z.object({ A: z.string(), B: z.string(), C: z.string() }),
  script: z.array(Line).min(12),
  statements: z.array(z.object({ s: z.string(), answer: z.enum(['A', 'B', 'C', 'N']), evidence: evidenceText })).length(7)
});

export const ListenInterview = z.object({
  id: z.string(),
  unit: z.number().int().min(0).max(12),
  taskFormat: z.literal('listen-interview'),
  title: z.string(),
  context: z.string(),
  voiceRate: z.number().default(1),
  script: z.array(Line).min(12),
  questions: z
    .array(z.object({ q: z.string(), options: z.array(z.string()).length(3), answer: z.number().int().min(0).max(2), evidence: evidenceText }))
    .length(7)
});

export const ListeningTask = z.union([ListenReply, ListenSpeakers, ListenInterview]);

export type ReadingTask = z.infer<typeof ReadingTask>;
export type ListeningTask = z.infer<typeof ListeningTask>;
export type ReadMcq = z.infer<typeof ReadMcq>;
export type ReadMatch = z.infer<typeof ReadMatch>;
export type ReadInsert = z.infer<typeof ReadInsert>;
export type ListenReply = z.infer<typeof ListenReply>;
export type ListenSpeakers = z.infer<typeof ListenSpeakers>;
export type ListenInterview = z.infer<typeof ListenInterview>;

/* ---------- Writing (Phase 4) ---------- */
export const WritingTarget = z.object({ label: z.string(), pattern: z.string(), min: z.number().int().min(1).default(1), distinct: z.boolean().default(false) });
export const WritingTask = z.object({
  id: z.string(),
  unit: z.number().int().min(0).max(12),
  set: z.number().int().optional(),
  examTask: z.union([z.literal(1), z.literal(2)]),
  taskFormat: z.enum(['write-compulsory', 'write-choice']),
  genre: z.string(),
  register: z.enum(['formal', 'informal', 'neutro']),
  title: z.string(),
  prompt: z.string(),
  contentPoints: z.array(z.string()).min(4).max(5),
  wordRange: z.tuple([z.number(), z.number()]),
  targets: z.array(WritingTarget).min(3).max(6),
  modelAnswer: z.string(),
  usefulPhrases: z.array(z.string()).min(3)
});
export type WritingTask = z.infer<typeof WritingTask>;
export type WritingTarget = z.infer<typeof WritingTarget>;
