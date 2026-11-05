"""Builds content/reading/*.json and content/listening/*.json from scripts/skills-src. Run: python3 -I scripts/build-skills.py"""
import json, os, runpy, glob
root = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(root, '..', 'content')
for f in sorted(glob.glob(os.path.join(root, 'skills-src', '*.py'))):
    for t in runpy.run_path(f)['TASKS']:
        folder = 'reading' if t['taskFormat'].startswith('read') else 'listening'
        json.dump(t, open(os.path.join(out, folder, t['id'] + '.json'), 'w'), ensure_ascii=False, indent=1)
        words = len(' '.join(t.get('text', [])).split()) if isinstance(t.get('text'), list) else 0
        print(t['id'], f'{words} words' if words else '')
