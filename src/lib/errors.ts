import type { DrillItem } from './schema';
import { stripAccents, normalise } from './answer';

/** Tags a wrong answer with what was confused, for the "top confusions" list on Progress. */
export type Tense = 'perfecto' | 'indefinido' | 'imperfecto' | 'pluscuamperfecto' | 'presente' | 'futuro' | 'condicional';

const HABER_PRES = /^(me |te |se |nos |os )?(he|has|ha|hemos|habéis|habeis|han) \S+(ado|ido|to|cho|so)$/;
const HABER_IMPF = /^(me |te |se |nos |os )?(había|habías|habíamos|habíais|habían|habia|habias|habiamos|habiais|habian) \S+$/;

export function guessTense(form: string): Tense | null {
  const f = normalise(form);
  if (!f) return null;
  if (HABER_IMPF.test(f)) return 'pluscuamperfecto';
  if (HABER_PRES.test(f)) return 'perfecto';
  const w = stripAccents(f.split(' ').pop()!);
  if (/(aba|abas|abamos|abais|aban)$/.test(w) || /^(era|eras|eramos|erais|eran|iba|ibas|ibamos|ibais|iban)$/.test(w)) return 'imperfecto';
  if (/(ia|ias|iamos|iais|ian)$/.test(w)) {
    // -ría endings are conditional; other -ía endings are imperfecto of -er/-ir verbs
    return /r(ia|ias|iamos|iais|ian)$/.test(w) && !/^(seria|reia|sonreia)$/.test(w) ? 'condicional' : 'imperfecto';
  }
  if (/(re|ras|ra|remos|reis|ran)$/.test(stripAccents(f)) && /(é|ás|á|éis|án)$/.test(f)) return 'futuro';
  if (/(é|aste|ó|amos|asteis|aron|í|iste|ió|imos|isteis|ieron|eron)$/.test(f) || /^(fui|fue|fuimos|fuisteis|fueron|tuve|tuvo|hice|hizo|dije|dijo|estuve|estuvo|pude|pudo|puse|puso|vine|vino|quise|quiso|supe|supo|traje|trajo|di|dio|vi|vio)$/.test(f.split(' ').pop()!)) return 'indefinido';
  return null;
}

const SUBJ_POINTS = new Set([
  'subjuntivo-presente', 'querer-pedir-que', 'cuando-subjuntivo', 'me-fascina-que', 'verbos-sentimiento', 'relativas-ind-subj',
  'valorar-inf-subj', 'hipotesis-ind-subj', 'creo-que-ind', 'ser-estar-adj-que', 'que-subj-deseos', 'para-inf',
  'sugerir-recomendar-quejarse-proponer', 'imperativo-negativo', 'veracidad-ind-subj', 'probabilidad-adverbios', 'lo-normal-es'
]);
const PRONOUN_POINTS = new Set(['pronombres-od-oi', 'pronombres-posicion']);
const SER = /^(es|son|era|eran|fue|fueron|ser|sea|sean)$/;
const ESTAR = /^(esta|está|estan|están|estaba|estaban|estuvo|estar|esté|estén)$/;

export function tagError(item: DrillItem, given: string, expected: string, accentOnly: boolean): string {
  if (accentOnly) return 'tilde';
  const g = normalise(given);
  const e = normalise(expected);
  if (!g) return 'sin respuesta';
  if ((SER.test(e) && ESTAR.test(g)) || (ESTAR.test(e) && SER.test(g))) return SER.test(e) ? 'ser→estar' : 'estar→ser';
  const te = guessTense(e);
  const tg = guessTense(g);
  if (te && tg && te !== tg) return `${te}→${tg}`;
  if (te && tg && te === tg && ['past-review', 'past-combined', 'pluscuamperfecto'].includes(item.grammarPoint)) return `forma del ${te}`;
  if (PRONOUN_POINTS.has(item.grammarPoint)) return 'pronombres';
  if (SUBJ_POINTS.has(item.grammarPoint)) return 'indicativo / subjuntivo';
  if (item.grammarPoint === 'cual-vs-que') return 'qué / cuál';
  if (['si-presente', 'futuro-simple', 'futuro-compuesto', 'condicional'].includes(item.grammarPoint)) return 'futuro / condicional';
  return item.grammarPoint;
}

/** Human-readable label for a tag. */
export function tagLabel(tag: string): string {
  if (tag.includes('→')) {
    const [a, b] = tag.split('→');
    return `Usaste ${b} en lugar de ${a}`;
  }
  if (tag.startsWith('forma del')) return `Forma del ${tag.slice(10)} (tiempo correcto, forma mal)`;
  return tag;
}
