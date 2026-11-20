import { describe, expect, it } from 'vitest';
import { clozeRetryItems } from '../src/lib/clozeRetry';
import { allItems } from '../src/lib/content';
import type { ClozeItem } from '../src/lib/schema';

const story: ClozeItem = {
  id: 'x', type: 'cloze', unit: 2, grammarPoint: 'past-review', difficulty: 2, feedback: 'f', title: 'T',
  text: 'Ayer {{1}} (ir) al cine. {{2}} (seguir) una receta, pero me {{3}} (equivocar). Al final {{4}} (pedir) pizza.',
  gaps: [1, 2, 3, 4].map((n) => ({ n, answers: [['fui', 'seguí', 'equivoqué', 'pedimos'][n - 1]], feedback: 'ok' }))
};

describe('cloze retry', () => {
  it('sends back only the sentences with mistakes', () => {
    const r = clozeRetryItems(story, [3]);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ type: 'gap', id: 'x#3', prompt: 'seguí (seguir) una receta, pero me ___ (equivocar).', answers: ['equivoqué'] });
  });
  it('keeps two wrong gaps in one sentence as a one-sentence cloze', () => {
    const r = clozeRetryItems(story, [2, 3, 4]);
    expect(r.map((i) => i.type)).toEqual(['cloze', 'gap']);
    expect(r[0].type === 'cloze' && r[0].gaps.map((g) => g.n)).toEqual([2, 3]);
  });
  it('works for every story in the app', () => {
    for (const it of allItems) {
      if (it.type !== 'cloze') continue;
      const r = clozeRetryItems(it, it.gaps.map((g) => g.n));
      const covered = r.flatMap((x) => (x.type === 'cloze' ? x.gaps.map((g) => g.n) : [Number(x.id.split('#')[1])]));
      expect(covered.sort((a, b) => a - b)).toEqual(it.gaps.map((g) => g.n).sort((a, b) => a - b));
      for (const x of r) if (x.type === 'gap') expect(x.prompt.split('___')).toHaveLength(2);
    }
  });
});
