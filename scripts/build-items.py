"""Adds hand-written drill items from scripts/items-src/*.py to the unit packs and the past-tenses pack.

Each source file defines UNIT (1-12, 0 = programa, 'focus' = past tenses) and ITEMS built with the
helpers below. Items get ids '<prefix>-f-NNN'; previous '-f-' items are replaced on every run (idempotent).
Run: python3 -I scripts/build-items.py
"""
import json, os, glob, runpy

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

def _base(kind, gp, diff, fb, contrast=None, why=None, sub=None, unit=None):
    d = {'type': kind, 'grammarPoint': gp, 'difficulty': diff, 'feedback': fb}
    if contrast: d['contrast'] = contrast
    if why: d['why'] = why
    if sub: d['subPoint'] = sub
    if unit is not None: d['unit'] = unit
    return d
def g(gp, diff, prompt, answers, fb, contrast=None, **k):
    assert prompt.count('___') == 1, prompt
    return {**_base('gap', gp, diff, fb, contrast, **k), 'prompt': prompt, 'answers': answers if isinstance(answers, list) else [answers]}
def c(gp, diff, prompt, options, answer, fb, contrast=None, **k):
    assert answer in options, (prompt, answer)
    return {**_base('choice', gp, diff, fb, contrast, **k), 'prompt': prompt, 'options': options, 'answers': [answer]}
def t(gp, diff, instruction, prompt, answers, fb, contrast=None, **k):
    return {**_base('transform', gp, diff, fb, contrast, **k), 'instruction': instruction, 'prompt': prompt, 'answers': answers if isinstance(answers, list) else [answers]}
def e(gp, diff, marked, answers, fb, contrast=None, **k):
    """Mark the wrong word(s) with *…*, e.g. 'Ayer *he comido* paella.'"""
    toks = marked.split(' ')
    assert marked.count('*') == 2, marked
    marked_toks = [i for i, x in enumerate(toks) if '*' in x]
    start, end = marked_toks[0], marked_toks[-1]
    toks = [x.replace('*', '') for x in toks]
    d = {**_base('error', gp, diff, fb, contrast, **k), 'prompt': ' '.join(toks), 'errorIndex': start, 'answers': answers if isinstance(answers, list) else [answers]}
    if end > start: d['errorLength'] = end - start + 1
    return d
def o(gp, diff, answers, fb, instruction='Ordena las palabras para formar una frase.', contrast=None, **k):
    return {**_base('order', gp, diff, fb, contrast, **k), 'instruction': instruction, 'answers': answers if isinstance(answers, list) else [answers]}
def m(gp, diff, pairs, fb, instruction='Relaciona cada principio con su final.', **k):
    return {**_base('match', gp, diff, fb, **k), 'instruction': instruction, 'pairs': [{'left': a, 'right': b} for a, b in pairs]}
def cz(gp, diff, title, text, gaps, fb, sub=None, unit=2):
    """Cloze story: text with {{n}} markers; gaps = [(answers, why, feedback), ...] in order."""
    return {**_base('cloze', gp, diff, fb, sub=sub, unit=unit), 'title': title, 'text': text,
            'gaps': [{'n': i + 1, 'answers': a if isinstance(a, list) else [a], 'why': w, 'feedback': f} for i, (a, w, f) in enumerate(gaps)]}

HELPERS = dict(g=g, c=c, t=t, e=e, o=o, m=m, cz=cz)

def pack_path(unit):
    if unit == 'focus': return os.path.join(ROOT, 'content', 'focus', 'past-tenses.json'), 'pt'
    if unit == 0: return os.path.join(ROOT, 'content', 'units', 'programa.json'), 'prog'
    return os.path.join(ROOT, 'content', 'units', f'u{unit:02d}.json'), f'u{unit:02d}'

by_pack = {}
for f in sorted(glob.glob(os.path.join(ROOT, 'scripts', 'items-src', '*.py'))):
    src = runpy.run_path(f, init_globals=HELPERS)
    by_pack.setdefault(src['UNIT'], []).extend(src['ITEMS'])

for unit, items in by_pack.items():
    path, prefix = pack_path(unit)
    pack = json.load(open(path))
    pack['items'] = [i for i in pack['items'] if '-f-' not in i['id']]
    for n, it in enumerate(items, 1):
        it = {'id': f'{prefix}-f-{n:03d}', **it}
        it.setdefault('unit', 2 if unit == 'focus' else unit)
        pack['items'].append(it)
    json.dump(pack, open(path, 'w'), ensure_ascii=False, indent=1)
    print(unit, f'+{len(items)} → {len(pack["items"])} items')
