"""Builds content/vocab/uNN.json from scripts/vocab-src/*.py. Run: python3 -I scripts/build-vocab.py"""
import json, re, runpy, glob, os, unicodedata
root = os.path.dirname(os.path.abspath(__file__))
U = {}
for f in sorted(glob.glob(os.path.join(root, 'vocab-src', '*.py'))):
    U.update(runpy.run_path(f)['U'])
def slug(s):
    s = unicodedata.normalize('NFD', s.lower()); s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')[:32]
for u, rows in U.items():
    cards, seen = [], set()
    for r in rows:
        es, en, topic, ex_es, ex_en = r[:5]
        cid = f'v{u:02d}-{slug(es)}'
        assert cid not in seen, cid; seen.add(cid)
        c = {'id': cid, 'unit': u, 'topic': topic, 'es': es, 'en': en, 'example_es': ex_es, 'example_en': ex_en}
        m = re.match(r'^(el|la|los|las) ', es)
        if m and '/' not in es: c['gender'] = 'm' if m.group(1) in ('el', 'los') else 'f'
        if len(r) > 5: c['collocation'] = r[5]
        cards.append(c)
    json.dump({'id': f'vocab-u{u:02d}', 'unit': u, 'cards': cards}, open(os.path.join(root, '..', 'content', 'vocab', f'u{u:02d}.json'), 'w'), ensure_ascii=False, indent=1)
    print(u, len(cards))
