"""Generates conjugation drills for the units from explicit verb tables (ids '<unit>-g-NNN', replaced on each run).
Future, conditional, present subjunctive, imperative (affirmative / negative), pluscuamperfecto, futuro compuesto.
Run: python3 -I scripts/gen-unit-forms.py"""
import json, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
P = ['yo', 'tú', 'él / ella / usted', 'nosotros', 'vosotros', 'ellos / ellas / ustedes']

FUT_IRR = {'tener': 'tendr', 'poner': 'pondr', 'salir': 'saldr', 'venir': 'vendr', 'poder': 'podr', 'saber': 'sabr', 'haber': 'habr', 'querer': 'querr', 'hacer': 'har', 'decir': 'dir', 'caber': 'cabr', 'valer': 'valdr'}
def futuro(v): s = FUT_IRR.get(v, v); return [s + x for x in ['é', 'ás', 'á', 'emos', 'éis', 'án']]
def condicional(v): s = FUT_IRR.get(v, v); return [s + x for x in ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían']]

# Present subjunctive: explicit for irregular / stem-changing verbs, rule-based for regular ones.
SUBJ = {
 'ser': 'sea seas sea seamos seáis sean', 'ir': 'vaya vayas vaya vayamos vayáis vayan', 'estar': 'esté estés esté estemos estéis estén',
 'haber': 'haya hayas haya hayamos hayáis hayan', 'saber': 'sepa sepas sepa sepamos sepáis sepan', 'dar': 'dé des dé demos deis den',
 'ver': 'vea veas vea veamos veáis vean', 'tener': 'tenga tengas tenga tengamos tengáis tengan', 'hacer': 'haga hagas haga hagamos hagáis hagan',
 'poner': 'ponga pongas ponga pongamos pongáis pongan', 'salir': 'salga salgas salga salgamos salgáis salgan', 'venir': 'venga vengas venga vengamos vengáis vengan',
 'decir': 'diga digas diga digamos digáis digan', 'conocer': 'conozca conozcas conozca conozcamos conozcáis conozcan', 'traer': 'traiga traigas traiga traigamos traigáis traigan',
 'querer': 'quiera quieras quiera queramos queráis quieran', 'poder': 'pueda puedas pueda podamos podáis puedan', 'pensar': 'piense pienses piense pensemos penséis piensen',
 'volver': 'vuelva vuelvas vuelva volvamos volváis vuelvan', 'dormir': 'duerma duermas duerma durmamos durmáis duerman', 'pedir': 'pida pidas pida pidamos pidáis pidan',
 'sentir': 'sienta sientas sienta sintamos sintáis sientan', 'cerrar': 'cierre cierres cierre cerremos cerréis cierren', 'empezar': 'empiece empieces empiece empecemos empecéis empiecen',
 'buscar': 'busque busques busque busquemos busquéis busquen', 'llegar': 'llegue llegues llegue lleguemos lleguéis lleguen', 'pagar': 'pague pagues pague paguemos paguéis paguen',
 'coger': 'coja cojas coja cojamos cojáis cojan', 'seguir': 'siga sigas siga sigamos sigáis sigan', 'jugar': 'juegue juegues juegue juguemos juguéis jueguen',
 'probar': 'pruebe pruebes pruebe probemos probéis prueben', 'elegir': 'elija elijas elija elijamos elijáis elijan'
}
def subj(v):
    if v in SUBJ: return SUBJ[v].split()
    st = v[:-2]
    return [st + x for x in (['e', 'es', 'e', 'emos', 'éis', 'en'] if v.endswith('ar') else ['a', 'as', 'a', 'amos', 'áis', 'an'])]

PRES3 = {'pensar': 'piensa', 'volver': 'vuelve', 'dormir': 'duerme', 'pedir': 'pide', 'cerrar': 'cierra', 'empezar': 'empieza', 'seguir': 'sigue', 'jugar': 'juega', 'probar': 'prueba', 'elegir': 'elige', 'querer': 'quiere', 'poder': 'puede', 'sentir': 'siente', 'coger': 'coge', 'traer': 'trae', 'conocer': 'conoce', 'ver': 've', 'dar': 'da', 'estar': 'está'}
TU_IRR = {'tener': 'ten', 'venir': 'ven', 'poner': 'pon', 'salir': 'sal', 'hacer': 'haz', 'decir': 'di', 'ir': 've', 'ser': 'sé'}
def imp_aff(v):
    tu = TU_IRR.get(v) or PRES3.get(v) or (v[:-2] + ('a' if v.endswith('ar') else 'e'))
    vos = 'id' if v == 'ir' else v[:-1] + 'd'
    s = subj(v)
    return {'tú': tu, 'vosotros': vos, 'usted': s[2], 'ustedes': s[5]}
def imp_neg(v):
    s = subj(v); return {'tú': 'no ' + s[1], 'vosotros': 'no ' + s[4], 'usted': 'no ' + s[2], 'ustedes': 'no ' + s[5]}

PART = {'hacer': 'hecho', 'decir': 'dicho', 'ver': 'visto', 'poner': 'puesto', 'escribir': 'escrito', 'volver': 'vuelto', 'abrir': 'abierto', 'romper': 'roto', 'morir': 'muerto', 'descubrir': 'descubierto', 'leer': 'leído', 'traer': 'traído', 'oír': 'oído', 'resolver': 'resuelto', 'devolver': 'devuelto'}
def part(v): return PART.get(v) or (v[:-2] + ('ado' if v.endswith('ar') else 'ido'))
HAB_IMPF = ['había', 'habías', 'había', 'habíamos', 'habíais', 'habían']
HAB_FUT = ['habré', 'habrás', 'habrá', 'habremos', 'habréis', 'habrán']

out = {}
def add(unit, gp, verb, person, tense, ans, fb, contrast, diff):
    out.setdefault(unit, []).append({'type': 'conjugate', 'unit': unit, 'grammarPoint': gp, 'difficulty': diff, 'verb': verb, 'person': person, 'tense': tense, 'answers': [ans], 'feedback': fb, 'contrast': contrast})

for i, v in enumerate(['vivir', 'poder', 'saber', 'venir', 'poner', 'querer', 'haber', 'salir', 'estudiar', 'tener', 'hacer', 'decir', 'ir', 'ser', 'valer', 'caber']):
    p = (i * 5 + 1) % 6; f = futuro(v)
    add(3, 'futuro-simple', v, P[p], 'futuro simple', f[p], f'{v} (futuro): {", ".join(f)}.' + (f' Irregular stem {FUT_IRR[v]}-.' if v in FUT_IRR else ''), f'Condicional: {condicional(v)[p]}', 2 if v in FUT_IRR else 1)
for i, v in enumerate(['comer', 'tener', 'poder', 'decir', 'venir', 'saber', 'querer', 'poner', 'hacer', 'ir', 'ser', 'gustar', 'haber', 'valer']):
    p = (i * 5 + 2) % 6; f = condicional(v)
    add(11, 'condicional', v, P[p], 'condicional', f[p], f'{v} (condicional): {", ".join(f)}.' + (f' Same irregular stem as the future: {FUT_IRR[v]}-.' if v in FUT_IRR else ''), f'Futuro: {futuro(v)[p]}', 2 if v in FUT_IRR else 1)
for i, v in enumerate(['estudiar', 'vivir', 'hacer', 'decir', 'salir', 'conocer', 'querer', 'dormir', 'pedir', 'sentir', 'empezar', 'buscar', 'llegar', 'coger', 'seguir', 'estar', 'dar', 'saber', 'ver', 'haber']):
    p = (i * 5 + 3) % 6; s = subj(v)
    add(6, 'subjuntivo-presente', v, P[p], 'presente de subjuntivo', s[p], f'{v} (subjuntivo): {", ".join(s)}.', f'Ejemplo: Quiero que {s[1]}…', 2 if v in SUBJ else 1)
IMP_P = ['tú', 'vosotros', 'usted', 'ustedes']
for i, v in enumerate(['pensar', 'volver', 'poner', 'salir', 'hacer', 'ir', 'ser', 'tener', 'elegir', 'seguir', 'cerrar', 'traer', 'empezar', 'probar']):
    p = IMP_P[i % 4]; a = imp_aff(v)
    add(5, 'imperativo-afirmativo', v, p, 'imperativo afirmativo', a[p], f'{v}: {a["tú"]} (tú), {a["vosotros"]} (vosotros), {a["usted"]} (usted), {a["ustedes"]} (ustedes).', f'Negativo: {imp_neg(v)[p]}', 2)
for i, v in enumerate(['hablar', 'comer', 'abrir', 'hacer', 'decir', 'ir', 'ser', 'poner', 'salir', 'tener', 'pedir', 'jugar', 'pagar', 'coger']):
    p = IMP_P[(i + 1) % 4]; n = imp_neg(v)
    add(5, 'imperativo-negativo', v, p, 'imperativo negativo', n[p], f'no + presente de subjuntivo: {n["tú"]}, {n["vosotros"]}, {n["usted"]}, {n["ustedes"]}.', f'Afirmativo: {imp_aff(v)[p]}', 2 if v in SUBJ else 1)
for i, v in enumerate(['llegar', 'comer', 'salir', 'hacer', 'decir', 'volver', 'romper', 'poner', 'abrir', 'descubrir']):
    p = (i * 5) % 6; pp = part(v)
    add(8, 'pluscuamperfecto', v, P[p], 'pluscuamperfecto', f'{HAB_IMPF[p]} {pp}', f'había, habías, había, habíamos, habíais, habían + {pp}.' + (' Irregular participle.' if v in PART else ''), f'Perfecto: {["he","has","ha","hemos","habéis","han"][p]} {pp}', 2 if v in PART else 1)
for i, v in enumerate(['salir', 'llegar', 'perder', 'olvidar', 'ver', 'hacer', 'decir', 'escribir', 'poner', 'volver']):
    p = (i * 5 + 2) % 6; pp = part(v)
    add(12, 'futuro-compuesto', v, P[p], 'futuro compuesto', f'{HAB_FUT[p]} {pp}', f'habré, habrás, habrá, habremos, habréis, habrán + {pp}.', f'Pluscuamperfecto: {HAB_IMPF[p]} {pp}', 2 if v in PART else 1)

for unit, items in out.items():
    path = os.path.join(ROOT, 'content', 'units', f'u{unit:02d}.json')
    pack = json.load(open(path))
    pack['items'] = [x for x in pack['items'] if '-g-' not in x['id']] + [{'id': f'u{unit:02d}-g-{n:03d}', **x} for n, x in enumerate(items, 1)]
    json.dump(pack, open(path, 'w'), ensure_ascii=False, indent=1)
    print(unit, f'+{len(items)} generated')
