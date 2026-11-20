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
