/* Validates every content pack against the zod schemas plus cross-pack rules.
 * Run: npm run validate-content   (also runs before every build and in CI) */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { UnitPack, FocusPack, GrammarPoints, ExamProfile, Manifest, VocabPack, ReadingTask, ListeningTask, WritingTask } from '../src/lib/schema';
import { countWords, targetHits } from '../src/lib/writing';

const root = join(import.meta.dirname, '..', 'content');
const errors: string[] = [];
const warn: string[] = [];

function load<T>(rel: string, schema: z.ZodType<T>): T | undefined {
  const path = join(root, rel);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    errors.push(`${rel}: invalid JSON (${(e as Error).message})`);
    return;
  }
  const r = schema.safeParse(raw);
  if (!r.success) {
    for (const issue of r.error.issues.slice(0, 15)) errors.push(`${rel}: ${issue.path.join('.')} — ${issue.message}`);
    return;
  }
  return r.data;
}

const manifest = load('manifest.json', Manifest);
const gps = load('grammar-points.json', GrammarPoints) ?? [];
const gpIds = new Set(gps.map((g) => g.id));
if (gpIds.size !== gps.length) errors.push('grammar-points.json: duplicate ids');

const itemIds = new Map<string, string>();
const perPoint = new Map<string, number>();

function checkItems(rel: string, items: z.infer<typeof UnitPack>['items']) {
  for (const it of items) {
    if (itemIds.has(it.id)) errors.push(`${rel}: duplicate item id ${it.id} (also in ${itemIds.get(it.id)})`);
    itemIds.set(it.id, rel);
    if (!gpIds.has(it.grammarPoint)) errors.push(`${rel}: ${it.id} unknown grammarPoint "${it.grammarPoint}"`);
    perPoint.set(it.grammarPoint, (perPoint.get(it.grammarPoint) ?? 0) + 1);
    if (it.type === 'gap' && (it.prompt.match(/___/g) ?? []).length !== 1)
      errors.push(`${rel}: ${it.id} gap prompt must contain exactly one ___`);
    if (it.type === 'cloze') {
      const words = it.text.replace(/\{\{\d+\}\}/g, 'x').split(/\s+/).length;
      if (words < 60 || words > 180) warn.push(`${rel}: ${it.id} cloze has ${words} words (target 80–150)`);
    }
  }
}

const unitFiles = readdirSync(join(root, 'units')).filter((f: string) => f.endsWith('.json'));
for (const f of unitFiles) {
  const pack = load(`units/${f}`, UnitPack);
  if (!pack) continue;
  for (const gp of pack.grammarPoints) if (!gpIds.has(gp)) errors.push(`units/${f}: unknown grammarPoint ${gp}`);
  checkItems(`units/${f}`, pack.items);
}

const focus = load('focus/past-tenses.json', FocusPack);
if (focus) checkItems('focus/past-tenses.json', focus.items);

const cardIds = new Set<string>();
let cardCount = 0;
for (const f of readdirSync(join(root, 'vocab')).filter((f: string) => f.endsWith('.json'))) {
  const pack = load(`vocab/${f}`, VocabPack);
  if (!pack) continue;
  for (const c of pack.cards) {
    if (cardIds.has(c.id)) errors.push(`vocab/${f}: duplicate card id ${c.id}`);
    cardIds.add(c.id);
    if (c.unit !== pack.unit) errors.push(`vocab/${f}: ${c.id} unit mismatch`);
  }
  cardCount += pack.cards.length;
}

// Skill tasks: schema + every evidence / clue string must appear in its text or script.
const skillCounts: Record<string, number> = {};
const words = (t: string) => t.split(/\s+/).filter(Boolean).length;
for (const f of readdirSync(join(root, 'reading')).filter((f: string) => f.endsWith('.json'))) {
  const t = load(`reading/${f}`, ReadingTask);
  if (!t) continue;
  skillCounts[t.taskFormat] = (skillCounts[t.taskFormat] ?? 0) + 1;
  const rel = `reading/${f}`;
  if (t.taskFormat === 'read-mcq') {
    const full = t.text.join(' ');
    for (const q of t.questions) if (!full.includes(q.evidence)) errors.push(`${rel}: evidence not in text: "${q.evidence}"`);
    const n = words(full);
    if (n < 450 || n > 700) warn.push(`${rel}: ${n} words (target ~600)`);
  } else if (t.taskFormat === 'read-match') {
    const used = t.texts.map((x) => x.answer);
    if (new Set(used).size !== used.length) errors.push(`${rel}: two texts share a profile`);
    for (const x of t.texts) {
      if (!x.text.includes(x.evidence)) errors.push(`${rel}: evidence not in text "${x.title}"`);
      if (!t.profiles.some((p) => p.id === x.answer)) errors.push(`${rel}: unknown profile ${x.answer}`);
    }
  } else {
    const full = t.text.join(' ');
    const marks = [...full.matchAll(/\{\{(\d)\}\}/g)].map((m) => Number(m[1]));
    if (marks.length !== 7) errors.push(`${rel}: needs exactly 7 {{n}} gaps (has ${marks.length})`);
    const used = t.gaps.map((g) => g.answer);
    if (new Set(used).size !== 7) errors.push(`${rel}: a fragment is used twice`);
    for (const g of t.gaps) {
      const frag = t.fragments.find((x) => x.id === g.answer);
      const para = t.text.find((p) => p.includes(`{{${g.n}}}`)) ?? '';
      if (!frag) errors.push(`${rel}: gap ${g.n} unknown fragment`);
      else if (!frag.text.includes(g.clue) && !para.includes(g.clue)) errors.push(`${rel}: gap ${g.n} clue "${g.clue}" not found`);
    }
  }
}
for (const f of readdirSync(join(root, 'listening')).filter((f: string) => f.endsWith('.json'))) {
  const t = load(`listening/${f}`, ListeningTask);
  if (!t) continue;
  skillCounts[t.taskFormat] = (skillCounts[t.taskFormat] ?? 0) + 1;
  const rel = `listening/${f}`;
  if (t.taskFormat === 'listen-speakers' || t.taskFormat === 'listen-interview') {
    const full = t.script.map((l) => l.line).join(' ');
    const ev = t.taskFormat === 'listen-speakers' ? t.statements.map((x) => x.evidence) : t.questions.map((x) => x.evidence);
    for (const e of ev) if (!full.includes(e)) errors.push(`${rel}: evidence not in script: "${e}"`);
    if (t.taskFormat === 'listen-speakers') {
      for (const l of t.script) if (!['A', 'B', 'C'].includes(l.speaker)) errors.push(`${rel}: speaker must be A, B or C`);
      for (const st of t.statements) {
        if (st.answer === 'N') continue;
        const line = t.script.find((l) => l.line.includes(st.evidence));
        if (line && line.speaker !== st.answer) errors.push(`${rel}: "${st.s}" evidence is said by ${line.speaker}, not ${st.answer}`);
      }
    }
  }
}

for (const f of readdirSync(join(root, 'writing')).filter((f: string) => f.endsWith('.json'))) {
  const t = load(`writing/${f}`, WritingTask);
  if (!t) continue;
  skillCounts[t.taskFormat] = (skillCounts[t.taskFormat] ?? 0) + 1;
  const n = countWords(t.modelAnswer);
  if (n < t.wordRange[0] || n > t.wordRange[1]) errors.push(`writing/${f}: model answer has ${n} words (${t.wordRange.join('–')})`);
  for (const tg of t.targets) {
    try {
      new RegExp(tg.pattern, 'giu');
    } catch (e) {
      errors.push(`writing/${f}: bad pattern for "${tg.label}": ${(e as Error).message}`);
      continue;
    }
    const hits = targetHits(t.modelAnswer, tg);
    if (hits < tg.min) errors.push(`writing/${f}: model answer doesn't meet its own target "${tg.label}" (${hits}/${tg.min})`);
  }
}

for (const f of readdirSync(join(root, 'exam-profiles'))) load(`exam-profiles/${f}`, ExamProfile);

if (manifest) for (const p of manifest.packs) if (!existsSync(join(root, p))) errors.push(`manifest.json: missing pack ${p}`);

for (const gp of gps) {
  const n = perPoint.get(gp.id) ?? 0;
  if (n < 6) errors.push(`grammar point ${gp.id} has ${n} items (minimum 6)`);
}

for (const w of warn) console.warn('⚠︎', w);
if (errors.length) {
  for (const e of errors) console.error('✗', e);
  console.error(`\n${errors.length} content error(s).`);
  process.exit(1);
}
console.log(`✓ content valid: ${itemIds.size} items across ${unitFiles.length + 1} packs, ${gps.length} grammar points, ${cardCount} vocabulary cards.`);
console.log(`  skill tasks: ${Object.entries(skillCounts).map(([k, v]) => `${k} ${v}`).join(', ')}`);
