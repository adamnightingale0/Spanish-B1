import { describe, it, expect } from 'vitest';
import { checkAnswer, normalise, stripAccents } from '../src/lib/answer';

describe('normalise', () => {
  it('trims, collapses spaces, lower-cases and strips final punctuation', () => {
    expect(normalise('  He   Perdido. ')).toBe('he perdido');
    expect(normalise('¡Qué diseño tan elegante!')).toBe('qué diseño tan elegante');
    expect(normalise('Si estudias, aprobarás.')).toBe('si estudias aprobarás');
  });
  it('treats curly and straight quotes the same', () => {
    expect(normalise('“hola”')).toBe(normalise('"hola"'));
  });
});

describe('stripAccents', () => {
  it('keeps ñ', () => {
    expect(stripAccents('enseñó')).toBe('enseño');
    expect(stripAccents('pingüino')).toBe('pinguino');
  });
});

describe('checkAnswer', () => {
  it('accepts exact answers', () => {
    expect(checkAnswer('he perdido', ['he perdido'], 'lenient').correct).toBe(true);
  });
  it('lenient: missing accent is correct but flagged', () => {
    const r = checkAnswer('perdi', ['perdí'], 'lenient');
    expect(r.correct).toBe(true);
    expect(r.accentOnly).toBe(true);
    expect(r.expected).toBe('perdí');
  });
  it('strict: missing accent is wrong', () => {
    const r = checkAnswer('perdi', ['perdí'], 'strict');
    expect(r.correct).toBe(false);
    expect(r.accentOnly).toBe(true);
  });
  it('ñ vs n always counts', () => {
    expect(checkAnswer('enseno', ['enseñó'], 'lenient').correct).toBe(false);
    expect(checkAnswer('ano', ['año'], 'lenient').correct).toBe(false);
  });
  it('never accepts a different tense', () => {
    expect(checkAnswer('perdí', ['he perdido'], 'lenient').correct).toBe(false);
    expect(checkAnswer('perdía', ['perdí'], 'lenient').correct).toBe(false);
  });
  it('accepts any listed variant', () => {
    expect(checkAnswer('estaba duchándome', ['Me estaba duchando', 'Estaba duchándome'], 'strict').correct).toBe(true);
  });
  it('conjugate items allow an optional subject pronoun', () => {
    expect(checkAnswer('yo tuve', ['tuve'], 'strict', { allowSubjectPronoun: true }).correct).toBe(true);
    expect(checkAnswer('nosotros hemos viajado', ['hemos viajado'], 'strict', { allowSubjectPronoun: true }).correct).toBe(true);
    expect(checkAnswer('yo tuve', ['tuve'], 'strict').correct).toBe(false);
  });
});
