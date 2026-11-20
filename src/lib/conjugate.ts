/**
 * Conjugator for the B1 tenses. Regular verbs are built by rule; irregular verbs list every
 * irregular paradigm in full (nothing is guessed), and tests check the tricky forms.
 */
export const PERSONS = ['yo', 'tú', 'él / ella / usted', 'nosotros/as', 'vosotros/as', 'ellos / ellas / ustedes'] as const;
export const IMP_PERSONS = ['tú', 'vosotros/as', 'usted', 'ustedes'] as const;

export type TenseId =
  | 'presente' | 'perfecto' | 'indefinido' | 'imperfecto' | 'pluscuamperfecto'
  | 'futuro' | 'futuro-compuesto' | 'condicional' | 'subjuntivo' | 'imperativo' | 'imperativo-negativo';

export const TENSE_NAMES: Record<TenseId, string> = {
  presente: 'presente de indicativo',
  perfecto: 'pretérito perfecto',
  indefinido: 'pretérito indefinido',
  imperfecto: 'pretérito imperfecto',
  pluscuamperfecto: 'pretérito pluscuamperfecto',
  futuro: 'futuro simple',
  'futuro-compuesto': 'futuro compuesto',
  condicional: 'condicional simple',
  subjuntivo: 'presente de subjuntivo',
  imperativo: 'imperativo afirmativo',
  'imperativo-negativo': 'imperativo negativo'
};

type Six = [string, string, string, string, string, string];
interface Verb {
  inf: string;
  en: string;
  pres?: Six;
  indef?: Six;
  impf?: Six;
  fut?: string; // irregular future / conditional stem
  subj?: Six;
  part?: string;
  ger?: string;
  tu?: string; // irregular affirmative tú imperative
}

const six = (s: string) => s.split(' ') as Six;

export const VERBS: Verb[] = [
  { inf: 'hablar', en: 'to speak' },
  { inf: 'trabajar', en: 'to work' },
  { inf: 'estudiar', en: 'to study' },
  { inf: 'viajar', en: 'to travel' },
  { inf: 'comer', en: 'to eat' },
  { inf: 'beber', en: 'to drink' },
  { inf: 'aprender', en: 'to learn' },
  { inf: 'vivir', en: 'to live' },
  { inf: 'escribir', en: 'to write', part: 'escrito' },
  { inf: 'abrir', en: 'to open', part: 'abierto' },
  { inf: 'romper', en: 'to break', part: 'roto' },
  { inf: 'llegar', en: 'to arrive' },
  { inf: 'buscar', en: 'to look for' },
  { inf: 'pagar', en: 'to pay' },
  { inf: 'empezar', en: 'to start', pres: six('empiezo empiezas empieza empezamos empezáis empiezan'), subj: six('empiece empieces empiece empecemos empecéis empiecen') },
  { inf: 'pensar', en: 'to think', pres: six('pienso piensas piensa pensamos pensáis piensan'), subj: six('piense pienses piense pensemos penséis piensen') },
  { inf: 'cerrar', en: 'to close', pres: six('cierro cierras cierra cerramos cerráis cierran'), subj: six('cierre cierres cierre cerremos cerréis cierren') },
  { inf: 'querer', en: 'to want', pres: six('quiero quieres quiere queremos queréis quieren'), indef: six('quise quisiste quiso quisimos quisisteis quisieron'), fut: 'querr', subj: six('quiera quieras quiera queramos queráis quieran') },
  { inf: 'poder', en: 'to be able to', pres: six('puedo puedes puede podemos podéis pueden'), indef: six('pude pudiste pudo pudimos pudisteis pudieron'), fut: 'podr', subj: six('pueda puedas pueda podamos podáis puedan'), ger: 'pudiendo' },
  { inf: 'volver', en: 'to come back', pres: six('vuelvo vuelves vuelve volvemos volvéis vuelven'), subj: six('vuelva vuelvas vuelva volvamos volváis vuelvan'), part: 'vuelto' },
  { inf: 'dormir', en: 'to sleep', pres: six('duermo duermes duerme dormimos dormís duermen'), indef: six('dormí dormiste durmió dormimos dormisteis durmieron'), subj: six('duerma duermas duerma durmamos durmáis duerman'), ger: 'durmiendo' },
  { inf: 'jugar', en: 'to play', pres: six('juego juegas juega jugamos jugáis juegan'), subj: six('juegue juegues juegue juguemos juguéis jueguen') },
  { inf: 'pedir', en: 'to ask for', pres: six('pido pides pide pedimos pedís piden'), indef: six('pedí pediste pidió pedimos pedisteis pidieron'), ger: 'pidiendo' },
  { inf: 'seguir', en: 'to follow, continue', pres: six('sigo sigues sigue seguimos seguís siguen'), indef: six('seguí seguiste siguió seguimos seguisteis siguieron'), ger: 'siguiendo' },
  { inf: 'sentir', en: 'to feel', pres: six('siento sientes siente sentimos sentís sienten'), indef: six('sentí sentiste sintió sentimos sentisteis sintieron'), subj: six('sienta sientas sienta sintamos sintáis sientan'), ger: 'sintiendo' },
  { inf: 'elegir', en: 'to choose', pres: six('elijo eliges elige elegimos elegís eligen'), indef: six('elegí elegiste eligió elegimos elegisteis eligieron'), ger: 'eligiendo' },
  { inf: 'tener', en: 'to have', pres: six('tengo tienes tiene tenemos tenéis tienen'), indef: six('tuve tuviste tuvo tuvimos tuvisteis tuvieron'), fut: 'tendr', tu: 'ten' },
  { inf: 'venir', en: 'to come', pres: six('vengo vienes viene venimos venís vienen'), indef: six('vine viniste vino vinimos vinisteis vinieron'), fut: 'vendr', tu: 'ven', ger: 'viniendo' },
  { inf: 'poner', en: 'to put', pres: six('pongo pones pone ponemos ponéis ponen'), indef: six('puse pusiste puso pusimos pusisteis pusieron'), fut: 'pondr', part: 'puesto', tu: 'pon' },
  { inf: 'salir', en: 'to go out, leave', pres: six('salgo sales sale salimos salís salen'), fut: 'saldr', tu: 'sal' },
  { inf: 'hacer', en: 'to do, make', pres: six('hago haces hace hacemos hacéis hacen'), indef: six('hice hiciste hizo hicimos hicisteis hicieron'), fut: 'har', part: 'hecho', tu: 'haz' },
  { inf: 'decir', en: 'to say, tell', pres: six('digo dices dice decimos decís dicen'), indef: six('dije dijiste dijo dijimos dijisteis dijeron'), fut: 'dir', part: 'dicho', tu: 'di', ger: 'diciendo' },
  { inf: 'traer', en: 'to bring', pres: six('traigo traes trae traemos traéis traen'), indef: six('traje trajiste trajo trajimos trajisteis trajeron'), part: 'traído', ger: 'trayendo' },
  { inf: 'conocer', en: 'to know (people, places)', pres: six('conozco conoces conoce conocemos conocéis conocen') },
  { inf: 'conducir', en: 'to drive', pres: six('conduzco conduces conduce conducimos conducís conducen'), indef: six('conduje condujiste condujo condujimos condujisteis condujeron') },
  { inf: 'saber', en: 'to know (facts)', pres: six('sé sabes sabe sabemos sabéis saben'), indef: six('supe supiste supo supimos supisteis supieron'), fut: 'sabr', subj: six('sepa sepas sepa sepamos sepáis sepan') },
  { inf: 'dar', en: 'to give', pres: six('doy das da damos dais dan'), indef: six('di diste dio dimos disteis dieron'), subj: six('dé des dé demos deis den') },
  { inf: 'ver', en: 'to see', pres: six('veo ves ve vemos veis ven'), indef: six('vi viste vio vimos visteis vieron'), impf: six('veía veías veía veíamos veíais veían'), part: 'visto' },
  { inf: 'leer', en: 'to read', indef: six('leí leíste leyó leímos leísteis leyeron'), part: 'leído', ger: 'leyendo' },
  { inf: 'estar', en: 'to be (state, place)', pres: six('estoy estás está estamos estáis están'), indef: six('estuve estuviste estuvo estuvimos estuvisteis estuvieron'), subj: six('esté estés esté estemos estéis estén') },
  { inf: 'ser', en: 'to be (identity)', pres: six('soy eres es somos sois son'), indef: six('fui fuiste fue fuimos fuisteis fueron'), impf: six('era eras era éramos erais eran'), subj: six('sea seas sea seamos seáis sean'), tu: 'sé' },
  { inf: 'ir', en: 'to go', pres: six('voy vas va vamos vais van'), indef: six('fui fuiste fue fuimos fuisteis fueron'), impf: six('iba ibas iba íbamos ibais iban'), subj: six('vaya vayas vaya vayamos vayáis vayan'), tu: 've', ger: 'yendo' },
  { inf: 'haber', en: 'to have (auxiliary); hay = there is', pres: six('he has ha hemos habéis han'), indef: six('hube hubiste hubo hubimos hubisteis hubieron'), fut: 'habr', subj: six('haya hayas haya hayamos hayáis hayan') },
  { inf: 'morir', en: 'to die', pres: six('muero mueres muere morimos morís mueren'), indef: six('morí moriste murió morimos moristeis murieron'), subj: six('muera mueras muera muramos muráis mueran'), part: 'muerto', ger: 'muriendo' },
  { inf: 'descubrir', en: 'to discover', part: 'descubierto' },
  // More verbs for the irregular indefinido flashcards (all other tenses listed where irregular).
  { inf: 'andar', en: 'to walk', indef: six('anduve anduviste anduvo anduvimos anduvisteis anduvieron') },
  { inf: 'mantener', en: 'to keep, maintain', pres: six('mantengo mantienes mantiene mantenemos mantenéis mantienen'), indef: six('mantuve mantuviste mantuvo mantuvimos mantuvisteis mantuvieron'), fut: 'mantendr', tu: 'mantén' },
  { inf: 'obtener', en: 'to obtain, get', pres: six('obtengo obtienes obtiene obtenemos obtenéis obtienen'), indef: six('obtuve obtuviste obtuvo obtuvimos obtuvisteis obtuvieron'), fut: 'obtendr', tu: 'obtén' },
  { inf: 'proponer', en: 'to propose', pres: six('propongo propones propone proponemos proponéis proponen'), indef: six('propuse propusiste propuso propusimos propusisteis propusieron'), fut: 'propondr', part: 'propuesto', tu: 'propón' },
  { inf: 'suponer', en: 'to suppose', pres: six('supongo supones supone suponemos suponéis suponen'), indef: six('supuse supusiste supuso supusimos supusisteis supusieron'), fut: 'supondr', part: 'supuesto', tu: 'supón' },
  { inf: 'traducir', en: 'to translate', pres: six('traduzco traduces traduce traducimos traducís traducen'), indef: six('traduje tradujiste tradujo tradujimos tradujisteis tradujeron') },
  { inf: 'producir', en: 'to produce', pres: six('produzco produces produce producimos producís producen'), indef: six('produje produjiste produjo produjimos produjisteis produjeron') },
  { inf: 'preferir', en: 'to prefer', pres: six('prefiero prefieres prefiere preferimos preferís prefieren'), indef: six('preferí preferiste prefirió preferimos preferisteis prefirieron'), subj: six('prefiera prefieras prefiera prefiramos prefiráis prefieran'), ger: 'prefiriendo' },
  { inf: 'repetir', en: 'to repeat', pres: six('repito repites repite repetimos repetís repiten'), indef: six('repetí repetiste repitió repetimos repetisteis repitieron'), ger: 'repitiendo' },
  { inf: 'servir', en: 'to serve, be useful', pres: six('sirvo sirves sirve servimos servís sirven'), indef: six('serví serviste sirvió servimos servisteis sirvieron'), ger: 'sirviendo' },
  { inf: 'mentir', en: 'to lie (not tell the truth)', pres: six('miento mientes miente mentimos mentís mienten'), indef: six('mentí mentiste mintió mentimos mentisteis mintieron'), subj: six('mienta mientas mienta mintamos mintáis mientan'), ger: 'mintiendo' },
  { inf: 'sugerir', en: 'to suggest', pres: six('sugiero sugieres sugiere sugerimos sugerís sugieren'), indef: six('sugerí sugeriste sugirió sugerimos sugeristeis sugirieron'), subj: six('sugiera sugieras sugiera sugiramos sugiráis sugieran'), ger: 'sugiriendo' },
  { inf: 'conseguir', en: 'to get, manage to', pres: six('consigo consigues consigue conseguimos conseguís consiguen'), indef: six('conseguí conseguiste consiguió conseguimos conseguisteis consiguieron'), ger: 'consiguiendo' },
  { inf: 'vestir', en: 'to dress', pres: six('visto vistes viste vestimos vestís visten'), indef: six('vestí vestiste vistió vestimos vestisteis vistieron'), ger: 'vistiendo' },
  { inf: 'reír', en: 'to laugh', pres: six('río ríes ríe reímos reís ríen'), indef: six('reí reíste rio reímos reísteis rieron'), subj: six('ría rías ría riamos riais rían'), fut: 'reir', part: 'reído', ger: 'riendo' },
  { inf: 'oír', en: 'to hear', pres: six('oigo oyes oye oímos oís oyen'), indef: six('oí oíste oyó oímos oísteis oyeron'), fut: 'oir', part: 'oído', ger: 'oyendo', tu: 'oye' },
  { inf: 'creer', en: 'to believe, think', indef: six('creí creíste creyó creímos creísteis creyeron'), part: 'creído', ger: 'creyendo' },
  { inf: 'construir', en: 'to build', pres: six('construyo construyes construye construimos construís construyen'), indef: six('construí construiste construyó construimos construisteis construyeron'), ger: 'construyendo' },
  { inf: 'caer', en: 'to fall', pres: six('caigo caes cae caemos caéis caen'), indef: six('caí caíste cayó caímos caísteis cayeron'), part: 'caído', ger: 'cayendo' },
  { inf: 'tocar', en: 'to touch; to play (an instrument)' },
  { inf: 'sacar', en: 'to take out; to get (a grade)' },
  { inf: 'explicar', en: 'to explain' },
  { inf: 'practicar', en: 'to practise' },
  { inf: 'cruzar', en: 'to cross' },
  { inf: 'organizar', en: 'to organise' },
  { inf: 'comenzar', en: 'to begin', pres: six('comienzo comienzas comienza comenzamos comenzáis comienzan'), subj: six('comience comiences comience comencemos comencéis comiencen') }
];
export const verbByInf = new Map(VERBS.map((v) => [v.inf, v]));

const cls = (inf: string) => inf.slice(-2) as 'ar' | 'er' | 'ir';
const stem = (inf: string) => inf.slice(0, -2);
const HABER_PRES = six('he has ha hemos habéis han');
const HABER_IMPF = six('había habías había habíamos habíais habían');
const HABER_FUT = six('habré habrás habrá habremos habréis habrán');

export function participle(v: Verb) {
  return v.part ?? stem(v.inf) + (cls(v.inf) === 'ar' ? 'ado' : 'ido');
}
export function gerund(v: Verb) {
  return v.ger ?? stem(v.inf) + (cls(v.inf) === 'ar' ? 'ando' : 'iendo');
}
function presente(v: Verb): Six {
  if (v.pres) return v.pres;
  const s = stem(v.inf);
  const e = { ar: 'o as a amos áis an', er: 'o es e emos éis en', ir: 'o es e imos ís en' }[cls(v.inf)].split(' ');
  return e.map((x) => s + x) as Six;
}
function indefinido(v: Verb): Six {
  if (v.indef) return v.indef;
  const s = stem(v.inf);
  if (cls(v.inf) === 'ar') {
    let yo = s + 'é';
    if (s.endsWith('c')) yo = s.slice(0, -1) + 'qué';
    else if (s.endsWith('g')) yo = s + 'ué';
    else if (s.endsWith('z')) yo = s.slice(0, -1) + 'cé';
    return [yo, s + 'aste', s + 'ó', s + 'amos', s + 'asteis', s + 'aron'];
  }
  return ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'].map((x) => s + x) as Six;
}
function imperfecto(v: Verb): Six {
  if (v.impf) return v.impf;
  const s = stem(v.inf);
  return (cls(v.inf) === 'ar' ? 'aba abas aba ábamos abais aban' : 'ía ías ía íamos íais ían').split(' ').map((x) => s + x) as Six;
}
function futuro(v: Verb): Six {
  const s = v.fut ?? v.inf;
  return 'é ás á emos éis án'.split(' ').map((x) => s + x) as Six;
}
function condicional(v: Verb): Six {
  const s = v.fut ?? v.inf;
  return 'ía ías ía íamos íais ían'.split(' ').map((x) => s + x) as Six;
}
function subjuntivo(v: Verb): Six {
  if (v.subj) return v.subj;
  let s = presente(v)[0].replace(/o$/, '');
  const ar = cls(v.inf) === 'ar';
  if (ar) s = s.replace(/c$/, 'qu').replace(/g$/, 'gu').replace(/z$/, 'c');
  return (ar ? 'e es e emos éis en' : 'a as a amos áis an').split(' ').map((x) => s + x) as Six;
}
function imperativo(v: Verb): string[] {
  const p = presente(v);
  const sj = subjuntivo(v);
  const vos = v.inf === 'ir' ? 'id' : v.inf.slice(0, -1) + 'd';
  return [v.tu ?? p[2], vos, sj[2], sj[5]];
}
function imperativoNeg(v: Verb): string[] {
  const sj = subjuntivo(v);
  return [sj[1], sj[4], sj[2], sj[5]].map((x) => 'no ' + x);
}

/** All forms of one tense (6 persons; the imperatives have 4: tú, vosotros, usted, ustedes). */
export function conjugate(inf: string, tense: TenseId): string[] {
  const v = verbByInf.get(inf) ?? { inf, en: '' };
  switch (tense) {
    case 'presente': return presente(v);
    case 'perfecto': return HABER_PRES.map((h) => `${h} ${participle(v)}`);
    case 'indefinido': return indefinido(v);
    case 'imperfecto': return imperfecto(v);
    case 'pluscuamperfecto': return HABER_IMPF.map((h) => `${h} ${participle(v)}`);
    case 'futuro': return futuro(v);
    case 'futuro-compuesto': return HABER_FUT.map((h) => `${h} ${participle(v)}`);
    case 'condicional': return condicional(v);
    case 'subjuntivo': return subjuntivo(v);
    case 'imperativo': return imperativo(v);
    case 'imperativo-negativo': return imperativoNeg(v);
  }
}
export const personsFor = (t: TenseId) => (t === 'imperativo' || t === 'imperativo-negativo' ? IMP_PERSONS : PERSONS);

/** Is this verb irregular in this tense (so worth practising)? */
export function irregularIn(inf: string, tense: TenseId): boolean {
  const v = verbByInf.get(inf);
  if (!v) return false;
  switch (tense) {
    case 'presente': return !!v.pres;
    case 'indefinido': return !!v.indef || /(car|gar|zar)$/.test(inf);
    case 'imperfecto': return !!v.impf;
    case 'futuro': case 'condicional': return !!v.fut;
    case 'subjuntivo': return !!v.subj || !!v.pres;
    case 'imperativo': return !!v.tu || !!v.pres;
    case 'imperativo-negativo': return !!v.subj || !!v.pres;
    default: return !!v.part;
  }
}
