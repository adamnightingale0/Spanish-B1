"""Builds content/reading/*.json and content/listening/*.json from scripts/skills-src. Run: python3 -I scripts/build-skills.py"""
import json, os, runpy, glob
root = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(root, '..', 'content')
def balance(qs, seed):
    # Rotate each question's 3 options so the right answers spread evenly over a), b) and c).
    for k, q in enumerate(qs):
        target = (k + seed) % 3
        shift = (target - q['answer']) % 3
        q['options'] = q['options'][-shift:] + q['options'][:-shift] if shift else q['options']
        q['answer'] = target

for f in sorted(glob.glob(os.path.join(root, 'skills-src', '*.py'))):
    for t in runpy.run_path(f)['TASKS']:
        seed = sum(map(ord, t['id'])) % 3
        if t['taskFormat'] in ('read-mcq', 'listen-interview'): balance(t['questions'], seed)
        if t['taskFormat'] == 'listen-reply': balance(t['items'], seed)
        folder = 'reading' if t['taskFormat'].startswith('read') else 'writing' if t['taskFormat'].startswith('write') else 'listening'
        json.dump(t, open(os.path.join(out, folder, t['id'] + '.json'), 'w'), ensure_ascii=False, indent=1)
        words = len(' '.join(t.get('text', [])).split()) if isinstance(t.get('text'), list) else 0
        if folder == 'writing': words = len(t['modelAnswer'].split())
        print(t['id'], f'{words} words' if words else '')
