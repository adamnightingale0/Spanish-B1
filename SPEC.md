# Spanish B1 Exam Prep App: Build Spec

Nov 5, 2026 · @Adam Nightingale

## Overview

Build "Spanish B1 Practice", an offline-first iPhone web app (PWA), for one learner preparing for a Spanish B1 exam. It follows the 12 units of *Aula Internacional Plus 3* (B1) and adds a mock-exam layer that copies the University of Seville Instituto de Idiomas B1 accreditation exam (ACLES seal), which uses this same textbook. The target sitting is the written exam on 18 January 2027 (morning), followed by the oral between 4 and 10 February 2027. If that sitting is missed, the next written exam is on 7 June 2027.

- **User:** Adam, an adult B1 learner living in Seville. His class is on unit 2, and his current focus is the three past tenses: pretérito perfecto, indefinido and imperfecto.
- **Goal:** prepare for the whole exam (reading, listening, writing, speaking, plus the grammar and vocabulary under them), using all 12 units from day one rather than only the units covered in class.
- **Hard constraints:** it runs on an iPhone in Safari, installed to the Home Screen; it works fully offline after the first load; there is no backend, no login and no AI or API calls at runtime; all content ships as static JSON.
- **Language norm:** Peninsular Spanish (Spain). Include *vosotros* in every conjugation, and follow the Spain usage of pretérito perfecto for time periods that are still open (*hoy, esta semana, este año*).
- **Copyright rule:** the textbook is only the syllabus. Use its exercises, texts, dialogues or images as the reference during content generation. Every item is written fresh, targeting the grammar point, vocabulary area or communicative function listed for that unit. To connect the app to the book, each unit and grammar point has a \`bookRef\` with its page numbers, so the app can point to the right pages for the book's own exercises.

**How to use this spec with Claude Code:** put this document in the repo as `SPEC.md` and build one phase at a time (see Build phases). Content packs are generated as JSON files that must validate against the schemas below before they are committed.

## Tech stack, hosting and storage

Use a static PWA built with Vite + TypeScript + Preact, hosted free on GitHub Pages. No Mac or App Store is needed.

| Concern | Choice | Notes |
| --- | --- | --- |
| Framework | Preact + TypeScript, built with Vite | Small bundle, typed content schemas |
| Offline | `vite-plugin-pwa` (Workbox), precaching all app files and every content pack | The app must work in airplane mode after one online load |
| Install | Web app manifest, `display: standalone`, Apple touch icons, `apple-mobile-web-app-capable` meta | Installed from Safari via Share → Add to Home Screen |
| Hosting | GitHub Pages over HTTPS (required for the service worker) | Deployed by a GitHub Actions workflow on push to `main` |
| Progress storage | IndexedDB via `idb-keyval` or Dexie; call `navigator.storage.persist()` on first run | Safari can clear storage for sites that aren't installed, so the app should prompt the user to install it |
| Backup | Export/import of all progress as a JSON file (Settings screen); remind the user to back up every 14 days | Protects against iOS clearing storage or a lost phone |
| Spaced repetition | `ts-fsrs` (FSRS algorithm), bundled | Runs offline |
| Audio out | `speechSynthesis` with a `es-ES` voice for pronouncing words and short sentences | Optional; degrade quietly if no Spanish voice is installed |
| Audio in | `MediaRecorder` (supported on iOS Safari 14.5+) for speaking practice | Recordings kept locally, with a manual delete |
| Content validation | `zod` schemas plus a `npm run validate-content` script, run in CI | The build fails if any pack is invalid |
| Testing | Vitest for logic (answer checking, scheduling, scoring); Playwright smoke test at iPhone viewport |  |

**UI rules:** design for mobile first at 390×844, with tap targets of at least 44 px. Respect the safe areas (`env(safe-area-inset-*)`) and support light and dark mode. The answer input must not trigger iOS zoom, so inputs use a font size of at least 16 px. Turn off autocorrect and autocapitalise on answer fields.&#32;

## Screens and navigation

The app has five tabs in a bottom tab bar. Every practice session starts from one tap on Home.

1. **Home (Hoy)**
   - Exam countdown (date set in Settings), the current streak, and today's cards due.
   - A "Today's session" button that builds a 15-minute mixed session: SRS cards due, plus drills on the weakest grammar points, plus one skill task.
   - A "Focus" card that pins one area (currently the past tenses) and gets a larger share of each daily session.
2. **Units (Unidades)**
   - A list of units 1–12, each showing its title, its grammar points with mastery bars, its vocabulary areas, and a "class is here" marker (currently unit 2).
   - Unit detail screen: a short original grammar summary for each point, then buttons for Drill, Vocab, Write and Speak scoped to that unit.
   - Every unit is available from the start. The "class is here" marker only changes default filters and the weighting of review.
3. **Practice (Practicar)**
   - Grammar drills filtered by grammar point, unit or exercise type, or "mixed: everything so far".
   - Vocabulary flashcards (SRS).
   - Skill trainers: Reading, Listening, Writing, Speaking.
   - "Weak spots": an automatic drill drawn from the grammar points with the lowest accuracy in the last 14 days.
4. **Exam (Examen)**
   - Full mock exam or a single paper (reading, listening, writing, speaking), timed, following the exam profile.
   - Results screen: score for each skill against the 50% minimum in each skill, plus a history chart.
5. **Progress / Settings**
   - Accuracy per grammar point (heatmap of units × points), vocabulary retention, time studied per week.
   - Settings: exam date, current class unit, focus area, accent strictness, daily session length, TTS voice, export/import of progress, reset.

During a drill, the screen shows one item at a time with: the prompt, the answer field and accent bar, Check, then feedback (correct answer, a one-line rule, an example) and Next. Items answered wrong come back later in the same session.

## Learning modules

There are eight modules. Grammar, vocabulary and the past-tense focus are the core; the skill trainers and the mock exam sit on top of them.

### 1. Grammar drills

Tag every item with `unit`, `grammarPoint` and `difficulty` (1–3). Exercise types:

- **gap** — type the missing form in a sentence, with the infinitive in brackets.
- **choice** — pick one of 2–4 options (for example indefinido vs imperfecto, ser vs estar, por vs para).
- **conjugate** — conjugate the verb for a given person and tense; include irregular verbs.
- **transform** — rewrite a sentence (direct → reported speech, affirmative → negative command, present → past).
- **error** — tap the wrong word, then type the correction.
- **cloze** — a short original story (80–150 words) with 6–10 gaps. This is the main type for the past tenses and connectors.
- **order** — put shuffled words in order to make a sentence (for pronoun placement).
- **match** — match beginnings to endings (for connectors and *si* clauses).

The feedback for each item shows the rule in one line plus a contrasting example. Grammar point mastery = accuracy over the last 20 attempts, shown as a bar.

### 2. Past tenses focus pack (build first)

This is a dedicated pack outside the units because it is the current priority. It also feeds units 2, 4 and 8.

- Sub-points: forms of the regular and irregular perfecto, indefinido and imperfecto; perfecto vs indefinido (time markers in Spain: *hoy, esta mañana, este año, alguna vez, ya, todavía no* vs *ayer, el lunes pasado, en 2019, hace dos años*); indefinido vs imperfecto (completed events vs description, habits and background); interrupted actions (*estaba … cuando …*); pluscuamperfecto (unit 8).
- A **"Why?" step**: after a cloze answer, the user picks the reason (completed action, time marker, background description, habit, interrupted action) and is graded on the reason as well as the form.
- A **time-marker sorter**: drag markers into perfecto / indefinido / imperfecto columns.

### 3. Vocabulary (SRS)

- Cards are tagged by unit and topic. Each card has the Spanish word with its article, the English meaning, an example sentence, and optionally a collocation.
- Directions: ES→EN recognition first; after two correct answers, EN→ES typed recall.
- Rating buttons: Again / Hard / Good / Easy, scheduled with FSRS. Daily caps: 15 new cards and 150 reviews.
- The 🔊 button plays TTS of the word and its example.

### 4. Reading trainer

Original texts in the three Seville task formats, `taskFormat`:

- `read-mcq`: an article of about 600 words with 7 questions, 3 options each.
- `read-match`: 8 short texts matched to 10 profiles.
- `read-insert`: an article of about 400 words with 7 gaps and 10 fragments.

Use everyday informative topics such as health, books, sport, travel, work, studying abroad and city life. Each task can be timed: 20 minutes per task, or 60 minutes for the full paper. After answering, the evidence sentence is highlighted. For `read-insert`, the cohesion clue (the connector, pronoun or repeated word) is highlighted too, so the user learns how to spot them.

### 5. Listening trainer (limited offline)

There is no recorded audio in the bundle, so this uses TTS of original scripts in the three Seville formats:

- `listen-reply`: 6 short monologues; choose the best reply.
- `listen-speakers`: a conversation between 3 friends, with 7 statements to match to A, B, C or none.
- `listen-interview`: a radio interview with 7 questions, 3 options each.

Copy the exam conditions: 30–45 seconds of reading time, each recording played twice, and answers locked after the second play. Use a different `es-ES` voice or pitch for each speaker, and offer speeds of 0.8× and 1×. The transcript is revealed afterwards. Label it "practice only", because synthetic voices are easier than the real recordings.

The official sample MP3s and PDFs from the Instituto de Idiomas are **linked, not bundled**, from a Resources screen (they open online). The Phase 6 "bring your own audio" pack lets the user add MP3s they have downloaded, plus their own question JSON, to `content/listening/` on their own copy of the app.

### 6. Writing trainer (self-assessed, no AI)

- Copies the Seville format: Task 1 is compulsory; for Task 2 the user picks 1 of 2 prompts. Each is 120–150 words and lists 4–5 content points to cover. The full paper is timed at 70 minutes (about 35 minutes per text).
- Prompt genres to rotate through: blog or website testimonial, informal email replying to a friend (with advice), magazine or newspaper reader story, formal email or letter (complaint or request), opinion article, review, narrative of a past experience. Also include the 12 unit writing tasks rewritten in this format.
- Most prompts should require past narration together with advice or opinion, as in the sample. This trains the past tenses alongside the subjunctive and imperative.
- Live word count, warning below 120 or above 150 words.
- A **content-point checklist**: the user ticks each point once covered. Missing a point is the easiest way to lose marks for task fulfilment.
- A "target language" checklist of 4–6 structures (for example two past tenses, *te aconsejo que* + subjunctive, three connectors). Simple keyword and regex detection ticks them as they appear.
- After submitting: a model answer, useful phrases (greetings and closings for each register), and a self-assessment against the four official criteria, each scored 0–3. Drafts are saved locally.
- An "Export for marking" button copies the prompt, the text and the rubric to the clipboard, ready to paste into Claude or give to a teacher.

### 7. Speaking trainer

- Copies the Seville oral: it is done in pairs, lasts about 15 minutes, and has three tasks.
- **Task 1, pair activity:** a scenario card (for example agreeing on a plan, a present or a flat-share rule). The app plays the partner: it speaks TTS lines with pauses for the user to reply, including disagreeing so the user has to negotiate. Useful phrases cover proposing, agreeing, disagreeing and conceding.
- **Task 2, photo description:** the user picks any photo from the camera roll with a file input (this works offline and needs no bundled images), or uses a text scene card. There is a timed description of 1–2 minutes, with a checklist: who and where, what they are doing, guesses about the people (*parece que, seguramente, debe de*), feelings.
- **Task 3, conversation:** 6–8 examiner questions linked to the photo's theme, which move from guessing about the people to the user's own experiences, then an anecdote, then advice (the sample uses flatmates). TTS reads each question, and the user answers aloud within a set time.
- All tasks are recorded with `MediaRecorder` for playback. Afterwards the user self-checks against the five official criteria: interaction, fluency, pronunciation, coherence, accuracy and range.

### 8. Mock exam

Each mock is driven by an **exam profile** JSON file. The default is `us-b1.json`, which copies the University of Seville Instituto de Idiomas B1 exam as described in its programme (section 7) and its June 2025 sample papers. The written exam comes first; the oral is only taken after the written is passed.

| Part | Task 1 | Task 2 | Task 3 | Time | Weight |
| --- | --- | --- | --- | --- | --- |
| 1. Reading comprehension | An informative article of about 600 words; 7 multiple-choice questions with 3 options each | 8 short texts (3–6 lines, for example book summaries) matched to 10 people profiles; 2 profiles are distractors | An article of about 400 words with 7 gaps; 10 sentence fragments to choose from, so 3 are not used | 60 min | 25% |
| 2. Listening comprehension (each recording plays twice, with reading time first) | 6 short monologues; pick the most fitting reply (3 options) | A conversation between 3 friends; match 7 statements to speaker A, B or C, or "none of them" | A radio interview about someone's life and career; 7 multiple-choice questions with 3 options each | 30 min | 25% |
| (Break) |  |  |  | 20 min |  |
| 3. Written expression and interaction | Compulsory text, 120–150 words, covering 4–5 given content points (sample: a blog testimonial about an exchange) | Choose 1 of 2 prompts, 120–150 words (sample: an informal email giving advice, or a magazine story about a friend) | — | 70 min | 25% |
| 4. Oral expression and interaction (in pairs, about 15 min) | A communicative activity with your partner | Describe photographs | Conversation with the examiners on topics the photos suggest | \~15 min | 25% |

The programme says 20 questions for reading, while the sample has 22 (7 + 8 + 7). Make the item counts configurable in the profile, defaulting to the sample's counts.

**Pass rules to encode:**

- The written exam passes only with at least 50% overall **and** at least 50% in each of reading, listening and writing. If any one skill is below 50%, the written is failed (recorded as SUSPENSO, 3).
- The oral passes with at least 50% of its maximum. Failing it is recorded as SUSPENSO, 4, but a passed written exam carries over to the next sitting.
- The results screen warns about the weakest skill, because one skill below 50% fails the whole written exam, whatever the other scores.

**Marking:**

- Reading and listening are scored automatically.
- Writing is self-assessed on the official four criteria: task fulfilment, coherence and cohesion, vocabulary (range and control), grammar (range and control).
- Speaking is self-assessed on the official five criteria: interaction, fluency, pronunciation, coherence, accuracy and range.
- Each criterion is scored 0–3, and the total is converted to a percentage.

Keep `dele-b1.json` as a second profile, because the programme recommends the DELE as an extra qualification.

### 9. Skill diagnosis (finding weak areas automatically)

The app estimates each skill and each grammar point from everything you do, and steers "Today's session" towards the weakest ones. Because the exam needs 50% in every skill, the goal is to lift the weakest skill, not the average.

- **Placement check on first run:** about 15 minutes with roughly 40 items. Two items per grammar cluster across all 12 units and the `programa` pack, plus one short reading task and one short listening task. This seeds every estimate, so the first sessions are already targeted. It can be repeated from Progress.
- **Grammar mastery:** for each `grammarPoint`, accuracy weighted towards recent answers (an answer counts half as much after 7 days), plus a confidence value that grows with the number of attempts. A point with fewer than 5 attempts shows as "not enough data" rather than as strong.
- **Error patterns:** wrong answers are tagged with what was confused, for example `indefinido→imperfecto`, `perfecto→indefinido`, `indicativo→subjuntivo`, `ser→estar`, a pronoun placement error, or an accent only. Progress shows the top 5 confusions with a "Drill this" button. For the past tenses, the "Why?" step also shows whether the problem is the form or the choice of tense.
- **Skill estimates on the exam scale:** reading and listening come from the last 5 timed tasks of each format, as a percentage. Writing and speaking come from self-assessment scores, adjusted down when the word count was out of range or content points were missed. Each skill is shown against a 50% line, with a safety margin up to 60%.
- **At-risk flag:** a skill below 60%, or a grammar point below 70% mastery, is marked at risk and shown first on Home.
- **Session weighting:** "Today's session" splits its time by (1 − estimate) × exam weight for each skill, and by (1 − mastery) within grammar. Every skill gets at least 10%. The Focus area (the past tenses) gets at least 25% until its mastery is above 80%.
- **Weekly check:** each Sunday, a 15-minute mini mock (one task of each written-exam format) updates the estimates and adds a point to a trend line. From mid-December, the check is a full timed written mock every 2 weeks.
- **Unit coverage:** the exam draws on several of the 12 units, but not all of them, so review is spread across all 12. Any unit with no practice for 10 days gets moved up in the review queue.

### 10. My book viewer (your own PDF, stored only on the phone)

This opens your own copy of *Aula Internacional Plus 3* at the page a `bookRef` points to. The PDF goes into the repo, and can be used in the content packs or the build.

- **Loading:** Settings has a "Load my book (PDF)" option that uses a file input. The PDF is saved as a Blob in IndexedDB, with `navigator.storage.persist()`. Show its size and give a "Remove book" button. Export/import of progress never includes the PDF.
- **Make the file smaller first (on the laptop):** the current file is 133 MB and 307 pages, scanned with an OCR layer. Before loading it, compress it with Ghostscript (`-dPDFSETTINGS=/ebook`, about 150 dpi) to aim for 30–50 MB. That makes loading faster, uses less storage and makes pages appear quicker.
- **Rendering:** use `pdfjs-dist` with its worker bundled for offline use. Render **one page at a time**, on demand, and keep only the current page and the next and previous pages in memory. Cap the canvas at devicePixelRatio 2 and free canvases when leaving a page, because Safari has a canvas memory limit that crashes viewers that render too much at once.
- **Page numbers:** store the printed page numbers in `bookRef`, and convert them using a `pageOffset` setting. The PDF index looks like printed page + 1, so the default is 1, but check it in Settings with a "Does page 10 show Unit 1?" test.
- **Viewer controls:** full screen, with swipe for the next or previous page, pinch and double-tap to zoom, a page-number box to jump to a page, a unit list to jump to a unit's first page, and a fixed "← Back to drill" button that returns to the exact item you came from.
- **Entry points:** "📖 Book: p. 28 · Más ejercicios p. 186" links on unit detail screens and in drill feedback. If no PDF is loaded, the links show the page numbers only, so they still work with the printed book.
- *Check:* with the compressed PDF loaded in airplane mode, a `bookRef` link shows the right page in under 2 seconds on the iPhone, and 20 page swipes in a row don't crash the app.

## Curriculum map (Aula Internacional Plus 3)

The 12 units below are the syllabus. Each becomes one content pack, `content/units/uNN.json`. Use these `grammarPoint` ids across all content.

| Unit | Theme | Grammar points (ids) | Vocabulary areas | Writing task |
| --- | --- | --- | --- | --- |
| 1 Prohibido prohibir | Customs and social rules | `soler-inf`, `lo-normal-es`, `cuantificadores`, `esta-prohibido`, `se-impersonal`, `ser-estar-normas` | Social customs, workplace, the verb *dejar* | Article on customs and social codes in your country |
| 2 Volver a empezar | Life events, work, CVs | `perifrasis-tiempo` (*empezar a, acabar de, terminar de, volver a, dejar de*), `llevar-seguir-gerundio`, `desde-hace`, `past-review` (perfecto / indefinido / imperfecto) | Work, life events | Cover letter for a job |
| 3 Mañana | The future, science fiction | `si-presente`, `futuro-simple`, `probabilidad-adverbios`, `marcadores-futuro` | Future challenges, technology and science, *cada vez más / menos* | Poster of warnings about the future |
| 4 Va y le dice… | Stories, films, jokes | `conectores-relato`, `causa-contraste` (*porque, como, pero, aunque, sin embargo*), `pronombres-od-oi` | Film, TV, books; verbs of telling | Film synopsis |
| 5 Busque y compare | Advertising | `imperativo-afirmativo`, `imperativo-negativo`, `pronombres-posicion` | Advertising, describing an ad | Design and present an ad campaign |
| 6 ¡Basta ya! | Social problems, activism | `subjuntivo-presente`, `querer-pedir-que`, `deberian-habria-que`, `cuando-subjuntivo` | Social and administrative life, activism | Open letter about a problem |
| 7 Mensajes | Messages and communication | `estilo-indirecto` (*me ha dicho que, me ha pedido que, me ha preguntado si*) | Message types, verbs that report a message | Create and pass on different messages |
| 8 El turista accidental | Anecdotes and travel | `conectores-causa-consecuencia`, `pluscuamperfecto`, `past-combined` | Travel and tourism, anecdotes | Tell a true or invented anecdote |
| 9 Tenemos que hablar | Relationships, feelings | `me-fascina-que`, `verbos-sentimiento` (*me encanta / odio / no aguanto + inf. / que + subj.*) | Feelings, pet peeves, disagreeing | Act out a discussion |
| 10 De diseño | Objects and design | `superlativo-isimo`, `exclamativas`, `relativas-preposicion`, `relativas-ind-subj` | Shapes, materials, judging design | Poster of the objects you need |
| 11 Un mundo mejor | Problems and solutions | `valorar-inf-subj` (*es injusto que, está bien que, me parece mal que*), `condicional`, `lo-neutro` | Actions for a better world, objects and materials | Present problems and propose solutions |
| 12 Misterios y enigmas | Mysteries, hypotheses | `futuro-compuesto`, `hipotesis-ind-subj`, `creer-creerse` | Paranormal and unexplained events, psychology and science | Blog about scientific mysteries |

Also tag the spelling and pronunciation points per unit (capital letters, disjunctive questions, stressed syllable, commas, diacritical accents, same sound / different letters, colons, narrative intonation, echo questions, parenthetical intonation, *g* or *j*, *b* or *v*) for a small "Ortografía" drill set in Phase 5.

**Book page references (`bookRef`):** the units start on pages 10, 24, 38, 52, 66, 80, 94, 108, 122, 136, 150 and 164. *Más ejercicios* starts on page 178 and *Más gramática* on page 263. Add each unit's exact *Más ejercicios* and *Más gramática* pages by hand. In the app, the unit detail screen and drill feedback show "📖 Book: p. 28 · Más ejercicios p. 186". Store page numbers only, never text from the book.

**Points from the Seville B1 programme that the units don't make obvious.** Put these in `content/units/programa.json` so they are drilled as well:

- `cual-vs-que`
- `gustar-preferir`
- `presente-valor-futuro`
- `creo-que-ind` / `no-creo-que-subj`
- `ser-estar-adj-que` (*es importante / está claro que* + indicative, subjunctive or infinitive)
- `que-subj-deseos` (*¡que te mejores!*)
- `para-inf`
- `sugerir-recomendar-quejarse-proponer`

The programme's first objective is to master the indicative past tenses. That confirms the past tenses focus pack as Phase 1 and its high weight in daily sessions.

## Data model and content schemas

Content is static JSON in `content/`. User progress lives in IndexedDB and is never mixed with content. Every item has a stable `id`, so progress survives when content is regenerated.

**Repository layout**

```
content/
  manifest.json            # list of packs + version
  grammar-points.json      # id, unit, title, summary (original), rules[], bookRef
  units/u01.json … u12.json
  focus/past-tenses.json
  reading/*.json  listening/*.json  writing/*.json  speaking/*.json
  exam-profiles/us-b1.json  dele-b1.json
src/  (app)
scripts/validate-content.ts
```

**Drill item** (in `units/uNN.json` → `items[]`)

```json
{
  "id": "u02-past-0147",
  "type": "gap",
  "unit": 2,
  "grammarPoint": "past-review",
  "subPoint": "perfecto-vs-indefinido",
  "difficulty": 2,
  "prompt": "Esta mañana ___ (perder, yo) el autobús y he llegado tarde.",
  "answers": ["he perdido"],
  "options": null,
  "why": "time-marker-open-period",
  "feedback": "*Esta mañana* is a time period that is still open → pretérito perfecto in Spain.",
  "contrast": "Ayer perdí el autobús."
}
```

`cloze` items use `text` with `{{1}}` markers and a `gaps[]` array (each gap has its own `answers`, `why` and `feedback`). `choice` items use `options[]` and `answers` holding the correct option. `error` items carry `errorIndex` (the token position).

**Vocabulary card** — `{ id, unit, topic, es, en, gender?, example_es, example_en, collocation? }`

**Skill tasks** — reading: `{ id, unit, taskFormat, text, questions[{q, options[], answer, evidence}] }`; listening: the same plus `script[{speaker, line}]` and `voiceRate`; writing: `{ id, unit, examTask, prompt, wordRange, targets[{label, pattern}], modelAnswer, usefulPhrases[] }`; speaking: `{ id, examTask, prompt, bullets[], prepSeconds, speakSeconds, usefulPhrases[], photoPrompt? }`. A speaking photo is a text description because the app has no stock images.

**Exam profile** — `{ id, name, papers[{id, label, minutes, prepMinutes?, maxScore, tasks[{format, count}]}], passRule: {minOverall:0.5, minPerSkill:0.5, oralRequiresWrittenPass:true, carryWrittenPass:true}, writingCriteria[], speakingCriteria[] }`

**Progress (IndexedDB stores)** — `attempts` `{itemId, ts, correct, given, reasonCorrect?}`, `srs` `{cardId, fsrsState}`, `writing` `{taskId, text, ts, selfScores}`, `recordings` `{taskId, blob, ts}`, `exams` `{profileId, ts, scores}`, `settings`.

**Answer checking rules**

- Normalise before comparing: trim, collapse spaces, ignore case, strip final punctuation, and treat straight and curly quotes as the same.
- Accent strictness (Settings): **Strict** marks a missing accent as wrong; **Lenient** (the default) accepts it as correct but shows "watch the accent: *perdí*". ñ vs n always counts.
- `answers[]` lists every accepted form (for example with or without a subject pronoun). Never accept a different tense.
- A "typo" button lets the user override a wrong mark once per item, and it gets logged.

## Content generation rules and volume

Claude Code writes all content at build time, one pack per session. A pack is committed only if it passes `validate-content`, plus a second review pass that checks the Spanish.

**Rules for every item**

- Original sentences only. You may paraphrase the textbook's exercises, readings, dialogues or example sentences. Use the unit's topic and grammar point as the brief.
- Peninsular Spanish at CEFR B1, with natural adult contexts (work, travel, flat-sharing, Seville and Spanish city life). Avoid contrived sentences.
- Exactly one defensible answer for each gap, unless every accepted variant is listed in `answers`. Ambiguous context (for example a perfecto vs indefinido gap with no time marker) must be removed or given an explicit marker.
- English is used only in feedback and vocabulary meanings. Prompts and instructions are in Spanish.
- The review pass re-solves every item without seeing the key and flags any disagreement for a fix.

**Using the book as the basis (syllabus extraction step)**

Before generating a unit's pack, Claude Code reads that unit from Adam's local copy of the book (the PDF, or the Markdown made from it). That copy lives **outside the repo**, for example in `C:\Users\adamn\OneDrive\Documents\Spanish B1\Aula Internacional Plus 3 (B1) (Difusión) (z-library.sk, 1lib.sk, z-lib.sk).pdf`. From it, Claude Code writes a brief to `syllabus/uNN.json` containing only:

- `grammarPoints[]`: the unit's grammar points, in the book's order, mapped to the `grammarPoint` ids
- `targetWords[]`: individual words and short set phrases from the unit's vocabulary, each with its article
- `functions[]` and `themes[]`: the unit's communicative functions and topics, in brief
- `writingTaskType`: the type of the unit's final task, for example "cover letter"
- `bookRef`: page numbers

The brief may contain the book's sentences, exercise wording, reading texts, dialogues, explanations or characters. Everything generated after that (example sentences, drills, stories, model answers, translations) is written fresh from the brief.

**Volume targets**

| Pack | Phase-1 target | Full target |
| --- | --- | --- |
| Past tenses focus | 200 drill items + 20 cloze stories | 300 items + 40 stories |
| Each unit (×12) + `programa` | — | 80 drill items (≥ 6 per grammar point), 60 vocabulary cards |
| Reading | — | 5 tasks of each Seville format (15 tasks) |
| Listening (TTS) | — | 4 of each Seville format (12 scripts) |
| Writing | — | 12 unit prompts + 12 Seville-format prompts, each with content points and a model answer |
| Speaking | — | 8 oral sets, each with a pair-activity card, a photo theme and 6–8 examiner questions |
| Mock exams | — | 3 full written mocks + 3 oral sets built from items not used elsewhere |

That totals about 1,250 drill items and 720 vocabulary cards: around 1.5 MB of JSON, well within offline cache limits.

## Build phases

There are six phases, ordered by the exam calendar: the written exam on 18 January 2027 comes before the oral on 4–10 February. Aim to finish Phases 1–4 by mid-December, which leaves about five weeks of timed written mocks. Phase 1 alone gives a usable past tenses trainer on the iPhone. Each phase ends with its acceptance check passing on a real iPhone.

1. **Shell + past tenses trainer** (target: mid-November)
   - Vite/Preact PWA, the tab bar, Settings, IndexedDB, export/import, GitHub Pages deployment.
   - The drill engine with gap, choice, conjugate and cloze, plus the "Why?" step and the accent bar; the past tenses focus pack (Phase-1 target).
   - *Check:* install to the Home Screen, switch on airplane mode, finish a 20-item drill, close the app, reopen it: progress is kept.
2. **Vocabulary SRS + all units** (target: late November)
   - FSRS flashcards, the Units screen with "class is here" (unit 2), packs u01–u12 + `programa`, all remaining drill types, Weak spots, the Home "Today's session" builder, the grammar mastery model, error-pattern tagging, and the grammar part of the placement check (module 9), and the My book viewer (module 10).
   - *Check:* `validate-content` passes; every grammar point has at least 6 items; cards due tomorrow appear tomorrow.
3. **Reading + listening trainers** (target: early December)
   - The three reading formats and three listening formats, with exam timing, the play-twice rule, and highlighting of the evidence sentence.
   - *Check:* each format can be completed timed, and its score is recorded for its skill.
4. **Writing trainer + written mock** (target: mid-December)
   - The writing trainer with content-point checklist, word count, model answers and export; the `us-b1` profile; a full timed written mock (60 + 30 + 20-minute break + 70 minutes) with the pass logic of 50% per skill; the Resources screen linking the official sample papers; skill estimates on the exam scale, the at-risk flags, the full placement check and the weekly check (module 9).
   - *Check:* a full written mock runs end to end. A mock with one skill below 50% shows a fail even when the overall score is above 50%.
5. **Speaking trainer + oral mock** (target: early January, before the oral in February)
   - Pair activity with a TTS partner, camera-roll photo description, examiner questions, recording and self-assessment on the five criteria.
   - *Check:* a recording survives an app restart; the full oral sequence runs in about 15 minutes.
6. **Polish**
   - Progress heatmap, streaks, dark mode review, the bring-your-own-audio listening pack, the Ortografía set, Playwright smoke tests.

## Open decisions

- [x] Sitting: January 2027. The written exam is on 18 January and the oral between 4 and 10 February. The Settings default is 18 January 2027.
- [ ] Ask your teacher to confirm that the exam draws on several of the 12 units but not all, and whether the units are announced in advance. If they are, give those units more weight in review.
- [ ] Ask your teacher whether the institute publishes marking scales or band descriptors for writing and speaking. If so, replace the 0–3 self-assessment scale with them.
- [x] App name: "Spanish B1 Practice". The icon is still to be decided; use a simple placeholder for now.
- [x] Weak skills: worked out automatically by skill diagnosis (module 9). Nothing needs to be set by hand.

## Sources

- [Examen de Español B1, Instituto de Idiomas, Universidad de Sevilla](https://institutodeidiomas.us.es/areas-idiomas/espanol/examen-espanol-b1): structure, weights, accreditation
- [Programa Español B1](https://institutodeidiomas.us.es/areas-idiomas/espa%C3%B1ol/programa-espa%C3%B1ol-b1), section 7: task descriptions, criteria, pass marks
- [B1 sample written exam: reading and listening, with answer key (rev. June 2025)](https://institutodeidiomas.us.es/sites/default/files/documentos/b1.modelo-de-examen-para-la-web-_revjun25_0.pdf)
- [B1 sample written expression paper](https://institutodeidiomas.us.es/sites/default/files/documentos/b1_eie_web.pdf)
- [B1 sample oral, tasks 2 and 3](https://institutodeidiomas.us.es/sites/default/files/documentos/b1_eio_t2yt3_modelo_web_0.pdf)
- [Contenidos y criterios de evaluación](https://institutodeidiomas.us.es/pruebasexamenes-de-acreditacion/sobre-las-pruebas/contenidos-y-criterios-de-evaluacion)
- [Fechas de exámenes 2026–27](https://institutodeidiomas.us.es/cursos/examenes/fechas-de-examenes)
- [Guía del examen DELE B1, Instituto Cervantes](https://agenda.cervantes.es/sites/default/files/guia_examen_dele_b1_1.pdf): for the secondary DELE profile
- *Aula Internacional Plus 3* (Difusión), contents pages: used only as the syllabus
