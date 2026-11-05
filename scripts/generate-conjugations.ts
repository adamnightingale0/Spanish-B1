/* Generates conjugation drill items for the past-tenses focus pack from an explicit verb table.
 * Items with ids starting "pt-conj-" are replaced each run; hand-written items are kept.
 * Run: npm run gen:conjugations */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PERSONS = ['yo', 'tú', 'él / ella / usted', 'nosotros', 'vosotros', 'ellos / ellas / ustedes'];
const HABER_PRES = ['he', 'has', 'ha', 'hemos', 'habéis', 'han'];
const HABER_IMPF = ['había', 'habías', 'había', 'habíamos', 'habíais', 'habían'];

type Verb = { inf: string; indef?: string[]; impf?: string[]; part?: string; note?: string; refl?: boolean };

function regIndef(inf: string): string[] {
  const stem = inf.slice(0, -2);
  if (inf.endsWith('ar')) {
    let yo = stem + 'é';
    if (stem.endsWith('c')) yo = stem.slice(0, -1) + 'qué';
    else if (stem.endsWith('g')) yo = stem + 'ué';
    else if (stem.endsWith('z')) yo = stem.slice(0, -1) + 'cé';
    return [yo, stem + 'aste', stem + 'ó', stem + 'amos', stem + 'asteis', stem + 'aron'];
  }
  return [stem + 'í', stem + 'iste', stem + 'ió', stem + 'imos', stem + 'isteis', stem + 'ieron'];
}
function regImpf(inf: string): string[] {
  const stem = inf.slice(0, -2);
  if (inf.endsWith('ar')) return ['aba', 'abas', 'aba', 'ábamos', 'abais', 'aban'].map((e) => stem + e);
  return ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'].map((e) => stem + e);
}
const regPart = (inf: string) => inf.slice(0, -2) + (inf.endsWith('ar') ? 'ado' : 'ido');

const VERBS: Verb[] = [
  { inf: 'hablar' },
  { inf: 'trabajar' },
  { inf: 'comer' },
  { inf: 'vivir' },
  { inf: 'conocer' },
  { inf: 'salir' },
  { inf: 'llegar', note: 'g → gu before e in yo: llegué.' },
  { inf: 'buscar', note: 'c → qu before e in yo: busqué.' },
  { inf: 'empezar', note: 'z → c before e in yo: empecé.' },
  { inf: 'escribir', part: 'escrito', note: 'Irregular participle: escrito.' },
  { inf: 'volver', part: 'vuelto', note: 'Irregular participle: vuelto.' },
  { inf: 'abrir', part: 'abierto', note: 'Irregular participle: abierto.' },
  { inf: 'romper', part: 'roto', note: 'Irregular participle: roto.' },
  { inf: 'ser', indef: ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron'], impf: ['era', 'eras', 'era', 'éramos', 'erais', 'eran'], note: 'ser and ir share the indefinido (fui…). Imperfecto: era.' },
  { inf: 'ir', indef: ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron'], impf: ['iba', 'ibas', 'iba', 'íbamos', 'ibais', 'iban'], note: 'ir: fui… (indefinido), iba… (imperfecto).' },
  { inf: 'ver', indef: ['vi', 'viste', 'vio', 'vimos', 'visteis', 'vieron'], impf: ['veía', 'veías', 'veía', 'veíamos', 'veíais', 'veían'], part: 'visto', note: 'ver: vi, vio (no accent); veía; visto.' },
  { inf: 'tener', indef: ['tuve', 'tuviste', 'tuvo', 'tuvimos', 'tuvisteis', 'tuvieron'], note: 'Irregular stem tuv- (no accents).' },
  { inf: 'estar', indef: ['estuve', 'estuviste', 'estuvo', 'estuvimos', 'estuvisteis', 'estuvieron'], note: 'Irregular stem estuv-.' },
  { inf: 'hacer', indef: ['hice', 'hiciste', 'hizo', 'hicimos', 'hicisteis', 'hicieron'], part: 'hecho', note: 'hice, hizo (c → z); participle hecho.' },
  { inf: 'poder', indef: ['pude', 'pudiste', 'pudo', 'pudimos', 'pudisteis', 'pudieron'], note: 'Irregular stem pud-.' },
  { inf: 'poner', indef: ['puse', 'pusiste', 'puso', 'pusimos', 'pusisteis', 'pusieron'], part: 'puesto', note: 'Stem pus-; participle puesto.' },
  { inf: 'venir', indef: ['vine', 'viniste', 'vino', 'vinimos', 'vinisteis', 'vinieron'], note: 'Irregular stem vin-.' },
  { inf: 'decir', indef: ['dije', 'dijiste', 'dijo', 'dijimos', 'dijisteis', 'dijeron'], part: 'dicho', note: 'Stem dij-; ellos dijeron (no i); participle dicho.' },
  { inf: 'querer', indef: ['quise', 'quisiste', 'quiso', 'quisimos', 'quisisteis', 'quisieron'], note: 'Irregular stem quis-.' },
  { inf: 'saber', indef: ['supe', 'supiste', 'supo', 'supimos', 'supisteis', 'supieron'], note: 'Irregular stem sup-.' },
  { inf: 'traer', indef: ['traje', 'trajiste', 'trajo', 'trajimos', 'trajisteis', 'trajeron'], part: 'traído', note: 'Stem traj-; ellos trajeron; participle traído.' },
  { inf: 'conducir', indef: ['conduje', 'condujiste', 'condujo', 'condujimos', 'condujisteis', 'condujeron'], note: 'Stem conduj-; ellos condujeron.' },
  { inf: 'dar', indef: ['di', 'diste', 'dio', 'dimos', 'disteis', 'dieron'], note: 'dar takes -er/-ir endings: di, dio (no accents).' },
  { inf: 'dormir', indef: ['dormí', 'dormiste', 'durmió', 'dormimos', 'dormisteis', 'durmieron'], note: 'o → u in 3rd persons: durmió, durmieron.' },
  { inf: 'pedir', indef: ['pedí', 'pediste', 'pidió', 'pedimos', 'pedisteis', 'pidieron'], note: 'e → i in 3rd persons: pidió, pidieron.' },
  { inf: 'leer', indef: ['leí', 'leíste', 'leyó', 'leímos', 'leísteis', 'leyeron'], part: 'leído', note: 'i → y in 3rd persons: leyó, leyeron; participle leído.' },
  { inf: 'andar', indef: ['anduve', 'anduviste', 'anduvo', 'anduvimos', 'anduvisteis', 'anduvieron'], note: 'Irregular stem anduv-.' }
];

type Item = Record<string, unknown>;
const items: Item[] = [];
let n = 0;
const id = (t: string) => `pt-conj-${t}-${String(++n).padStart(3, '0')}`;

VERBS.forEach((v, i) => {
  const indef = v.indef ?? regIndef(v.inf);
  const impf = v.impf ?? regImpf(v.inf);
  const part = v.part ?? regPart(v.inf);
  const irregIndef = !!v.indef || /[cgz]ar$/.test(v.inf);
  const irregPart = !!v.part;
  const p1 = i % 6;
  const p2 = (i + 3) % 6;

  // Indefinido: two persons per verb (irregulars are the priority).
  for (const p of irregIndef ? [p1, p2] : [p1]) {
    items.push({
      id: id('indef'), type: 'conjugate', unit: 2, grammarPoint: 'past-review', subPoint: 'forms-indefinido',
      difficulty: irregIndef ? 2 : 1, verb: v.inf, person: PERSONS[p], tense: 'pretérito indefinido',
      answers: [indef[p]],
      feedback: `${v.inf} (indefinido): ${indef.join(', ')}.${v.note ? ' ' + v.note : ''}`,
      contrast: `Imperfecto: ${impf[p]}`
    });
  }
  // Imperfecto: one person per verb, plus all three irregulars twice.
  for (const p of v.impf ? [p1, p2] : [p2]) {
    items.push({
      id: id('impf'), type: 'conjugate', unit: 2, grammarPoint: 'past-review', subPoint: 'forms-imperfecto',
      difficulty: v.impf ? 2 : 1, verb: v.inf, person: PERSONS[p], tense: 'pretérito imperfecto',
      answers: [impf[p]],
      feedback: `${v.inf} (imperfecto): ${impf.join(', ')}.`,
      contrast: `Indefinido: ${indef[p]}`
    });
  }
  // Perfecto: one per verb.
  const pp = (i + 1) % 6;
  items.push({
    id: id('perf'), type: 'conjugate', unit: 2, grammarPoint: 'past-review', subPoint: 'forms-perfecto',
    difficulty: irregPart ? 2 : 1, verb: v.inf, person: PERSONS[pp], tense: 'pretérito perfecto',
    answers: [`${HABER_PRES[pp]} ${part}`],
    feedback: `haber (${HABER_PRES.join(', ')}) + ${part}.${irregPart ? ` Irregular participle: ${part}.` : ''}`,
    contrast: `Indefinido: ${indef[pp]}`
  });
  // Pluscuamperfecto: for irregular participles.
  if (irregPart || i % 4 === 0) {
    const pq = (i + 4) % 6;
    items.push({
      id: id('plus'), type: 'conjugate', unit: 8, grammarPoint: 'pluscuamperfecto', subPoint: 'pluscuamperfecto',
      difficulty: 2, verb: v.inf, person: PERSONS[pq], tense: 'pluscuamperfecto',
      answers: [`${HABER_IMPF[pq]} ${part}`],
      feedback: `había, habías, había, habíamos, habíais, habían + ${part}.`,
      contrast: `Perfecto: ${HABER_PRES[pq]} ${part}`
    });
  }
});

const path = join(import.meta.dirname, '..', 'content', 'focus', 'past-tenses.json');
const pack = JSON.parse(readFileSync(path, 'utf8'));
pack.items = [...pack.items.filter((it: Item) => !String(it.id).startsWith('pt-conj-')), ...items];
writeFileSync(path, JSON.stringify(pack, null, 1) + '\n');
console.log(`Wrote ${items.length} conjugation items (${pack.items.length} items total in the focus pack).`);
