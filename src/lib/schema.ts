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
  .object({ ...base, type: z.literal('error'), prompt: z.string(), errorIndex: z.number().int().min(0), answers })
  .refine((i) => i.errorIndex < i.prompt.split(' ').length, { message: 'errorIndex out of range' });
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
