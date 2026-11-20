import { describe, it, expect } from 'vitest';
import { acceptedAnswers } from '../src/lib/vocabAnswers';
import { checkAnswer } from '../src/lib/answer';
import { vocabCards } from '../src/lib/content';

const ok = (typed: string, es: string) => checkAnswer(typed, acceptedAnswers(es), 'strict').correct;

describe('flashcard answers without the notation', () => {
  it('drops "+ infinitivo" and similar', () => {
    expect(ok('acabar de', 'acabar de + infinitivo')).toBe(true);
    expect(ok('acabar de + infinitivo', 'acabar de + infinitivo')).toBe(true);
    expect(ok('llevar', 'llevar + tiempo + gerundio')).toBe(true);
    expect(ok('seguir', 'seguir + gerundio')).toBe(true);
  });
  it('makes bracketed parts optional', () => {
    expect(ok('la mayoría', 'la mayoría (de)')).toBe(true);
    expect(ok('la mayoría de', 'la mayoría (de)')).toBe(true);
    expect(ok('pasar una llamada', 'pasar (una llamada)')).toBe(true);
    expect(ok('equivocarse', 'equivocarse (de número)')).toBe(true);
  });
  it('accepts either alternative', () => {
    expect(ok('sentar mal', 'sentar bien / mal')).toBe(true);
    expect(ok('el sueldo neto', 'el sueldo bruto / neto')).toBe(true);
    expect(ok('lo peor', 'lo mejor / lo peor')).toBe(true);
    expect(ok('¿Dígame?', '¿Diga? / ¿Dígame?')).toBe(true);
    expect(ok('la empleada', 'el empleado / la empleada')).toBe(true);
  });
  it('accepts masculine and feminine forms with the right article', () => {
    expect(ok('el director', 'el / la director/a')).toBe(true);
    expect(ok('la directora', 'el / la director/a')).toBe(true);
    expect(ok('la jefa de equipo', 'el / la jefe/a de equipo')).toBe(true);
    expect(ok('estar celosa', 'estar celoso/a')).toBe(true);
    expect(ok('ser un maniático', 'ser un/a maniático/a')).toBe(true);
    expect(ok('obligatoria', 'obligatorio, obligatoria')).toBe(true);
    expect(ok('total que', 'total, que')).toBe(true);
    expect(ok('total', 'total, que')).toBe(false);
  });
  it('still rejects wrong answers', () => {
    expect(ok('acabar', 'acabar de + infinitivo')).toBe(false);
    expect(ok('dejar a', 'dejar de + infinitivo')).toBe(false);
  });
  it('every card accepts its own Spanish and at least one plain form', () => {
    for (const c of vocabCards) {
      const a = acceptedAnswers(c.es);
      expect(a).toContain(c.es);
      expect(a.some((x) => !/[+()/]/.test(x)), c.es).toBe(true);
    }
  });
});
