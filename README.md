# Spanish B1 Practice

An offline-first iPhone PWA for the University of Seville Instituto de Idiomas B1 exam (written exam 18 Jan 2027), built on the syllabus of *Aula Internacional Plus 3*. See [`SPEC.md`](SPEC.md) for the full spec and build phases.

**Status: Phase 4** (writing trainer and full written mock) on top of Phases 1–3.

## What's in Phase 1

- Five tabs: Hoy, Unidades, Practicar, Examen, Progreso (+ Ajustes)
- Drill engine: `gap`, `choice`, `conjugate`, `transform`, `cloze`, with lenient/strict accent checking, the "Why?" reason step, a typo override, and wrong items coming back later in the session
- Past-tenses focus pack: 214 items (137 generated conjugations + 67 hand-written items + 10 cloze stories) and a time-marker sorter
- 296 drill items across units 1–12 + `programa` (≥ 6 per grammar point, 48 points)
- "Today's session" builder (focus ≥ 25%, weak spots, class unit, review spread across all units), Weak spots, mastery bars (last 20 attempts), heatmap
- IndexedDB progress, `navigator.storage.persist()`, JSON export/import with a 14-day backup reminder
- Exam tab: `us-b1` profile, pass-rule calculator (50% overall **and** 50% per skill), links to the official sample papers

## What's in Phase 2

- Vocabulary flashcards with FSRS (`ts-fsrs`): 360 cards (30 per unit), ES→EN recognition then EN→ES typed recall after two correct answers, Again / Hard / Good / Easy, 15 new and 150 reviews a day, 🔊 for word and example
- All eight drill types: adds `error` (tap the wrong word and correct it), `order` and `match`
- Today's session starts with due flashcards (up to a quarter of the time), then the drills
- Mastery weighted towards recent answers (an answer counts half after 7 days); fewer than 5 attempts = "not enough data"
- Error-pattern tagging (e.g. `indefinido→imperfecto`, `ser→estar`, accent only) and the top 5 confusions on Progress with a "Practicar" button
- Placement check (~40 items from all units), offered on first run and repeatable from Progress
- My book viewer: load your own PDF in Settings (stored only on the phone, never exported), one page rendered at a time, swipe, double-tap and pinch zoom, page box, unit list, page-offset check, and 📖 links that open over a drill and return to the same item

## What's in Phase 3

- Reading trainer in the three Seville formats: `read-mcq` (article ~600 words, 7 questions), `read-match` (8 short texts, 10 profiles, 2 distractors), `read-insert` (article ~400 words, 7 gaps, 10 fragments). 5 tasks of each (the spec's full target of 15).
- Each task can be timed (20 min); full reading paper (one task of each format, 22 questions, 60 min, free to move between tasks, auto-submit when time runs out).
- After correcting, the evidence sentence is highlighted in yellow; for `read-insert`, the cohesion clue (connector, pronoun, repeated word) in green, with a one-line explanation.
- Listening trainer with text-to-speech in the three formats: `listen-reply` (6 monologues), `listen-speakers` (3 friends, 7 statements, A/B/C/none), `listen-interview` (radio interview, 7 questions). 4 of each (the full target of 12).
- Exam conditions: 30–45 s reading time, each recording played twice, 30 s to finish, then answers lock and the transcript is revealed with the evidence highlighted. Different voice or pitch per speaker; 0.8× / 1× speed; labelled "practice only".
- Full listening paper (the three tasks in a row, ~30 min). Every result is stored per skill; Progress shows reading and listening estimates (last 5 timed tasks per format) against the 50% and 60% lines; Home suggests a "lectura / audición del día".
- Content source in `scripts/skills-src/`, built with `python3 -I scripts/build-skills.py`; `validate-content` checks that every evidence sentence and clue really appears in its text.

## What's in Phase 4

- Writing trainer in the Seville format: 24 original prompts, the 12 unit tasks rewritten in exam format plus 12 prompts in 4 exam sets (Task 1 compulsory + choose 1 of 2 for Task 2), rotating genres (testimonial, informal email with advice, magazine story, formal complaint, opinion article, review, forum post, formal request, blog), most combining past narration with advice or opinion.
- Live word count with a warning outside 120–150; content-point checklist; "structures to show off" ticked automatically by pattern matching; drafts autosaved (at most 400 ms behind, and on leaving the app).
- After writing: model answer, useful phrases, self-assessment on the four official criteria (0–3), adjusted down when a content point is missed or the length is far off; "Export for marking" copies the prompt, the text and the rubric for Claude or a teacher.
- Full timed written mock with the `us-b1` profile: reading 60' → listening 30' → 20' break → writing 70', then self-assessment and the pass rules (≥ 50 % overall and ≥ 50 % in each skill, otherwise SUSPENSO, 3). Resumes where it was if the app is closed. Results and history in the Exam tab.
- Skill diagnosis: writing estimate from self-assessment; skills under 60 % flagged at the top of Home; the "task of the day" comes from the skill with the biggest (1 − estimate) × weight; placement check part 2 (one short reading and one short listening task); weekly 15-minute check on Sundays with a trend line on Progress, switching to a full mock every 2 weeks from 15 December.

## Commands

```bash
npm install
npm run dev               # local dev server
npm test                  # Vitest: answer checking, pass rules, mastery, sessions
npm run validate-content  # zod schemas + cross-pack checks (also runs in build/CI)
npm run gen:conjugations  # regenerate pt-conj-* items from the verb table
npm run build             # validate + typecheck + build to dist/
node tests/e2e/smoke.mjs http://localhost:4173/   # Playwright smoke test (iPhone viewport) against `npm run preview`
node tests/e2e/phase2.mjs http://localhost:4173/ some.pdf   # vocab, new drill types, book viewer offline
python3 -I scripts/build-vocab.py   # rebuild content/vocab from scripts/vocab-src
python3 -I scripts/build-skills.py  # rebuild content/reading and content/listening
node tests/e2e/phase3.mjs http://localhost:4173/   # reading, listening (fake TTS), papers
node tests/e2e/phase4.mjs http://localhost:4173/   # writing trainer and a full written mock
```

## Deploy (GitHub Pages)

1. Push this repo to GitHub with `main` as the default branch.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Each push to `main` runs the tests, validates the content, builds and deploys to `https://<user>.github.io/<repo>/`.

## Install on the iPhone

Open the Pages URL in **Safari** → **Share** → **Add to Home Screen**. Open it once while online; after that it works in airplane mode.

## Content rules

All items are original. The textbook is used only as the syllabus: grammar point ids, themes and page numbers (`bookRef`). No book text, exercises or the PDF go into this repo (`*.pdf` is git-ignored).
