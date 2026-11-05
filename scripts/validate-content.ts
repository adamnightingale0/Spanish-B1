/* Validates every content pack against the zod schemas plus cross-pack rules.
 * Run: npm run validate-content   (also runs before every build and in CI) */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { UnitPack, FocusPack, GrammarPoints, ExamProfile, Manifest } from '../src/lib/schema';

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
console.log(`✓ content valid: ${itemIds.size} items across ${unitFiles.length + 1} packs, ${gps.length} grammar points.`);
