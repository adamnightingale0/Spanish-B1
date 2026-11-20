import { describe, expect, it } from 'vitest';
import { tenseGuide } from '../src/lib/content';
import { formsOf, generateFormItems, usePool, guideById } from '../src/lib/tenses';
import { checkAnswer } from '../src/lib/answer';

describe('tenses section', () => {
  it('every tense has forms, curated use items and generated practice', () => {
    for (const t of tenseGuide) {
      expect(formsOf(t, 'hablar').forms.every(Boolean)).toBe(true);
      expect(usePool(t).curated.length).toBeGreaterThanOrEqual(4);
      const items = generateFormItems(t, 12);
      expect(items.length).toBe(12);
      for (const i of items) {
        if (i.type !== 'conjugate') throw new Error('expected a conjugate item');
        expect(i.answers[0]).toBeTruthy();
        expect(checkAnswer(i.answers[0], i.answers, 'strict').correct).toBe(true);
      }
    }
  });
  it('builds ir a and estar + gerundio', () => {
    expect(formsOf(guideById.get('ir-a')!, 'comer').forms[0]).toBe('voy a comer');
    expect(formsOf(guideById.get('estar-gerundio')!, 'leer').forms[3]).toMatch(/^estamos /);
    expect(formsOf(guideById.get('estar-gerundio')!, 'hablar').forms[1]).toBe('estás hablando');
  });
});
