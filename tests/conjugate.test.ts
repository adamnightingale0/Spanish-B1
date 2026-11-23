import { describe, it, expect } from 'vitest';
import { conjugate, VERBS, TENSE_NAMES, type TenseId } from '../src/lib/conjugate';

const at = (inf: string, t: TenseId, i: number) => conjugate(inf, t)[i];

describe('conjugator', () => {
  it('regular verbs', () => {
    expect(conjugate('hablar', 'presente')).toEqual(['hablo', 'hablas', 'habla', 'hablamos', 'habláis', 'hablan']);
    expect(conjugate('comer', 'indefinido')).toEqual(['comí', 'comiste', 'comió', 'comimos', 'comisteis', 'comieron']);
    expect(conjugate('vivir', 'imperfecto')).toEqual(['vivía', 'vivías', 'vivía', 'vivíamos', 'vivíais', 'vivían']);
    expect(conjugate('vivir', 'presente')[4]).toBe('vivís');
    expect(conjugate('hablar', 'subjuntivo')).toEqual(['hable', 'hables', 'hable', 'hablemos', 'habléis', 'hablen']);
    expect(conjugate('comer', 'subjuntivo')[3]).toBe('comamos');
    expect(conjugate('hablar', 'futuro')[4]).toBe('hablaréis');
    expect(conjugate('vivir', 'condicional')[3]).toBe('viviríamos');
    expect(conjugate('trabajar', 'perfecto')[0]).toBe('he trabajado');
    expect(conjugate('comer', 'pluscuamperfecto')[5]).toBe('habían comido');
    expect(conjugate('vivir', 'futuro-compuesto')[1]).toBe('habrás vivido');
  });
  it('spelling changes', () => {
    expect(at('llegar', 'indefinido', 0)).toBe('llegué');
    expect(at('buscar', 'indefinido', 0)).toBe('busqué');
    expect(at('empezar', 'indefinido', 0)).toBe('empecé');
    expect(at('llegar', 'subjuntivo', 0)).toBe('llegue');
    expect(at('buscar', 'subjuntivo', 3)).toBe('busquemos');
    expect(at('pagar', 'imperativo-negativo', 0)).toBe('no pagues');
    expect(at('conocer', 'subjuntivo', 0)).toBe('conozca');
    expect(at('elegir', 'subjuntivo', 0)).toBe('elija');
    expect(at('conducir', 'subjuntivo', 4)).toBe('conduzcáis');
  });
  it('stem changes', () => {
    expect(at('pensar', 'presente', 3)).toBe('pensamos');
    expect(at('pensar', 'subjuntivo', 3)).toBe('pensemos');
    expect(at('dormir', 'subjuntivo', 3)).toBe('durmamos');
    expect(at('pedir', 'subjuntivo', 3)).toBe('pidamos');
    expect(at('sentir', 'indefinido', 2)).toBe('sintió');
    expect(at('dormir', 'indefinido', 5)).toBe('durmieron');
    expect(at('seguir', 'subjuntivo', 0)).toBe('siga');
    expect(at('jugar', 'subjuntivo', 3)).toBe('juguemos');
  });
  it('irregular verbs', () => {
    expect(at('tener', 'futuro', 0)).toBe('tendré');
    expect(at('hacer', 'condicional', 1)).toBe('harías');
    expect(at('decir', 'perfecto', 2)).toBe('ha dicho');
    expect(at('volver', 'pluscuamperfecto', 0)).toBe('había vuelto');
    expect(at('ser', 'imperfecto', 3)).toBe('éramos');
    expect(at('ir', 'subjuntivo', 4)).toBe('vayáis');
    expect(at('saber', 'presente', 0)).toBe('sé');
    expect(at('poner', 'subjuntivo', 1)).toBe('pongas');
    expect(at('traer', 'subjuntivo', 0)).toBe('traiga');
    expect(at('leer', 'indefinido', 5)).toBe('leyeron');
    expect(at('haber', 'futuro', 2)).toBe('habrá');
  });
  it('imperatives', () => {
    expect(conjugate('hablar', 'imperativo')).toEqual(['habla', 'hablad', 'hable', 'hablen']);
    expect(conjugate('hacer', 'imperativo')).toEqual(['haz', 'haced', 'haga', 'hagan']);
    expect(conjugate('ir', 'imperativo')).toEqual(['ve', 'id', 'vaya', 'vayan']);
    expect(conjugate('pensar', 'imperativo')[0]).toBe('piensa');
    expect(conjugate('decir', 'imperativo-negativo')).toEqual(['no digas', 'no digáis', 'no diga', 'no digan']);
    expect(conjugate('ser', 'imperativo')[0]).toBe('sé');
  });
  it('every verb conjugates in every tense without gaps', () => {
    for (const v of VERBS) for (const t of Object.keys(TENSE_NAMES) as TenseId[]) {
      const forms = conjugate(v.inf, t);
      expect(forms.every((f) => f && !f.includes('undefined')), `${v.inf} ${t}`).toBe(true);
    }
  });
});

describe('irregular indefinido flashcards', async () => {
  const { indefCards, INDEF_GROUPS, buildCardQueue, cardStates, interleave, gradeOf, pointsFor } = await import('../src/lib/conjCards');
  const { Rating } = await import('ts-fsrs');
  const card = (id: string) => indefCards.find((c) => c.id === id);
  it('only the irregular persons become cards', () => {
    expect(indefCards.filter((c) => c.verb === 'tener').length).toBe(6);
    expect(indefCards.filter((c) => c.verb === 'pedir').map((c) => c.answer)).toEqual(['pidió', 'pidieron']);
    expect(indefCards.filter((c) => c.verb === 'buscar').map((c) => c.answer)).toEqual(['busqué']);
    expect(indefCards.filter((c) => c.verb === 'leer').map((c) => c.answer)).toContain('leyeron');
    expect(card('fc-indefinido-decir-5')?.answer).toBe('dijeron');
    expect(card('fc-indefinido-cruzar-0')?.answer).toBe('crucé');
    expect(card('fc-indefinido-dar-2')?.answer).toBe('dio');
  });
  it('every verb in the deck has a meaning and at least one card; ids are unique', () => {
    for (const g of INDEF_GROUPS) for (const v of g.verbs) expect(indefCards.some((c) => c.verb === v && c.en)).toBe(true);
    expect(new Set(indefCards.map((c) => c.id)).size).toBe(indefCards.length);
  });
  const mk = (id: string, correct: boolean, ts: number, extra = {}) => ({ key: `${ts}-${id}`, itemId: id, grammarPoint: 'past-review', unit: 0, ts, correct, given: '', ms: 3000, ...extra });
  const H = 36e5;
  it('shuffles: never the same verb twice in a row, and not in person order', () => {
    const q = buildCardQueue(indefCards, [], 'study');
    expect(q.length).toBeGreaterThan(5);
    for (let i = 1; i < q.length; i++) if (new Set(q.map((c) => c.verb)).size > 1) expect(q[i].verb === q[i - 1].verb && q.some((c, j) => j > i && c.verb !== q[i].verb)).toBe(false);
    const all = interleave(indefCards.filter((c) => c.verb === 'tener' || c.verb === 'hacer' || c.verb === 'decir'));
    for (let i = 1; i < all.length; i++) expect(all[i].verb).not.toBe(all[i - 1].verb);
  });
  it('a card you get wrong comes back much sooner than one you always get right', () => {
    const t0 = Date.now() - 30 * 24 * H;
    const good = [0, 1, 4, 10].map((d) => mk('fc-indefinido-tener-0', true, t0 + d * 24 * H));
    const bad = [0, 1, 4, 10].map((d, i) => mk('fc-indefinido-tener-1', i !== 3, t0 + d * 24 * H));
    const st = cardStates([...good, ...bad].sort((a, b) => a.ts - b.ts));
    const g = st.get('fc-indefinido-tener-0')!;
    const b = st.get('fc-indefinido-tener-1')!;
    expect(b.due - (t0 + 10 * 24 * H)).toBeLessThan(H); // relearning: minutes, not days
    expect(g.due).toBeGreaterThan(b.due + 5 * 24 * H);
    expect(g.card.stability).toBeGreaterThan(b.card.stability);
    expect(gradeOf({ correct: true, accentOnly: true })).toBe(Rating.Hard);
    expect(gradeOf({ correct: true, ms: 20000 })).toBe(Rating.Hard);
  });
  it('due cards come first, weakest first; difíciles are tracked', () => {
    const now = Date.now();
    const att = [
      mk('fc-indefinido-poder-0', false, now - 3 * H),
      mk('fc-indefinido-poder-0', false, now - 2 * H),
      mk('fc-indefinido-poder-0', false, now - H),
      mk('fc-indefinido-poner-1', true, now - 50 * H),
      mk('fc-indefinido-poner-1', true, now - 49 * H),
      mk('fc-indefinido-poner-1', true, now - H)
    ];
    const att2 = [...att].sort((a, b) => a.ts - b.ts);
    att.splice(0, att.length, ...att2);
    const st = cardStates(att, now);
    expect(st.get('fc-indefinido-poder-0')!.hard).toBe(true);
    const q = buildCardQueue(indefCards, att, 'study', now);
    expect(q.some((c) => c.id === 'fc-indefinido-poder-0')).toBe(true);
    expect(q.some((c) => c.id === 'fc-indefinido-poner-1')).toBe(false);
    expect(buildCardQueue(indefCards, att, 'hard', now).map((c) => c.id)).toEqual(['fc-indefinido-poder-0']);
  });
  it('scores streaks', () => {
    expect(pointsFor(Rating.Good, 0, false)).toBe(10);
    expect(pointsFor(Rating.Good, 5, false)).toBe(15);
    expect(pointsFor(Rating.Good, 30, false)).toBe(20);
    expect(pointsFor(Rating.Hard, 5, false)).toBe(5);
    expect(pointsFor(Rating.Good, 5, true)).toBe(2);
    expect(pointsFor(Rating.Again, 5, false)).toBe(0);
  });
});
