# Spanish B1 Practice

An offline-first iPhone PWA for the University of Seville Instituto de Idiomas B1 exam (written exam 18 Jan 2027), built on the syllabus of *Aula Internacional Plus 3*. See [`SPEC.md`](SPEC.md) for the full spec and build phases.

**Status: Phase 1** (shell + past-tenses trainer), plus grammar drills for all 12 units and the `programa` pack.

## What's in Phase 1

- Five tabs: Hoy, Unidades, Practicar, Examen, Progreso (+ Ajustes)
- Drill engine: `gap`, `choice`, `conjugate`, `transform`, `cloze`, with lenient/strict accent checking, the "Why?" reason step, a typo override, and wrong items coming back later in the session
- Past-tenses focus pack: 214 items (137 generated conjugations + 67 hand-written items + 10 cloze stories) and a time-marker sorter
- 296 drill items across units 1–12 + `programa` (≥ 6 per grammar point, 48 points)
- "Today's session" builder (focus ≥ 25%, weak spots, class unit, review spread across all units), Weak spots, mastery bars (last 20 attempts), heatmap
- IndexedDB progress, `navigator.storage.persist()`, JSON export/import with a 14-day backup reminder
- Exam tab: `us-b1` profile, pass-rule calculator (50% overall **and** 50% per skill), links to the official sample papers

## Commands

```bash
npm install
npm run dev               # local dev server
npm test                  # Vitest: answer checking, pass rules, mastery, sessions
npm run validate-content  # zod schemas + cross-pack checks (also runs in build/CI)
npm run gen:conjugations  # regenerate pt-conj-* items from the verb table
npm run build             # validate + typecheck + build to dist/
node tests/e2e/smoke.mjs http://localhost:4173/   # Playwright smoke test (iPhone viewport) against `npm run preview`
```

## Deploy (GitHub Pages)

1. Push this repo to GitHub with `main` as the default branch.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Each push to `main` runs the tests, validates the content, builds and deploys to `https://<user>.github.io/<repo>/`.

## Install on the iPhone

Open the Pages URL in **Safari** → **Share** → **Add to Home Screen**. Open it once while online; after that it works in airplane mode.

## Content rules

All items are original. The textbook is used only as the syllabus: grammar point ids, themes and page numbers (`bookRef`). No book text, exercises or the PDF go into this repo (`*.pdf` is git-ignored).
