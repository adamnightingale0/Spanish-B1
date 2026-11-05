// Phase 4 browser check: writing trainer and a full written mock end to end.
// The mock is answered perfectly in reading and listening and self-assessed 0 in writing:
// the average is above 50 % but writing is below 50 %, so the result must be SUSPENSO.
// Run against `npm run preview`: node tests/e2e/phase4.mjs http://localhost:4173/ [shotsDir]
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const { chromium, devices } = createRequire(import.meta.url)('playwright');
const [url = 'http://localhost:4173/', shots] = process.argv.slice(2);
const json = (p) => JSON.parse(readFileSync(new URL(`../../content/${p}`, import.meta.url)));
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
await ctx.addInitScript(() => {
  const voice = { name: 'Mónica', lang: 'es-ES', voiceURI: 'monica', localService: true, default: true };
  const synth = { getVoices: () => [voice], speak(u) { setTimeout(() => u.onend && u.onend(), 5); }, cancel() {}, addEventListener() {}, removeEventListener() {} };
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
  window.SpeechSynthesisUtterance = function (t) { this.text = t; };
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('dialog', (d) => d.accept());
const shot = (n) => shots && page.screenshot({ path: `${shots}/${n}.png`, fullPage: true });
const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) process.exitCode = 1; };

// ---- Writing trainer ----
const w = json('writing/write-t2-01a.json');
await page.goto(url + '#/write/write-t2-01a');
await page.waitForSelector('.writing-box');
await page.fill('.writing-box', w.modelAnswer);
for (const cb of await page.locator('.check-row input[type=checkbox]').all()) await cb.check();
const wc = await page.locator('.row.spread.small b').first().innerText();
ok(Number(wc) >= 120 && Number(wc) <= 150, `live word count (${wc})`);
const met = await page.locator('.check-row.ok-text').count();
ok(met === w.targets.length, `target structures detected (${met}/${w.targets.length})`);
await shot('p4-write');
await page.waitForTimeout(600); // autosave interval
await page.reload();
await page.waitForSelector('.writing-box');
ok((await page.inputValue('.writing-box')).length > 100, 'draft survives a reload');
await page.click('button:has-text("He terminado")');
await page.waitForSelector('text=Modelo de respuesta');
for (let i = 0; i < 4; i++) await page.locator('.q-card').nth(i).locator('.opt').nth(2).click();
await shot('p4-review');
await page.click('button:has-text("Guardar la nota")');
ok((await page.locator('.feedback .verdict').innerText()).includes('8/12'), 'self-assessment scored 8/12');

// ---- Full written mock ----
await page.goto(url + '#/mock');
await page.click('button:has-text("Empezar el simulacro")');
// Reading: perfect answers (fresh profile → tasks 01 of each format)
await page.click('button:has-text("Empezar la prueba")');
const mcq = json('reading/read-mcq-01.json'), match = json('reading/read-match-01.json'), ins = json('reading/read-insert-01.json');
await page.click('.tabs >> nth=1 >> button >> nth=1'); // Preguntas
for (let i = 0; i < 7; i++) await page.locator('.q-card').nth(i).locator('.opt').nth(mcq.questions[i].answer).click();
await page.click('button:has-text("Siguiente tarea")');
await page.click('.tabs >> nth=1 >> button >> nth=1'); // Textos
for (let i = 0; i < 8; i++) await page.locator('.q-card select').nth(i).selectOption(match.texts[i].answer);
await page.click('button:has-text("Siguiente tarea")');
for (let i = 0; i < 7; i++) await page.locator('select.gap-btn').nth(i).selectOption(ins.gaps[i].answer);
await shot('p4-mock-reading');
await page.click('button:has-text("Entregar")');
// Listening: perfect answers
await page.waitForSelector('text=Comprensión auditiva');
await page.click('button:has-text("Empezar la prueba")');
const L = ['listening/listen-reply-01.json', 'listening/listen-speakers-01.json', 'listening/listen-interview-01.json'].map(json);
for (let t = 0; t < 3; t++) {
  if (t === 0) await page.click('button:has-text("Empezar")');
  await page.waitForSelector('button:has-text("Empezar ya el audio")', { timeout: 15000 });
  const qs = page.locator('.q-card');
  const n = await qs.count();
  for (let i = 0; i < n; i++) {
    const task = L[t];
    if (task.taskFormat === 'listen-reply') await qs.nth(i).locator('.opt').nth(task.items[i].answer).click();
    else if (task.taskFormat === 'listen-speakers') await qs.nth(i).locator('.opt').nth(['A', 'B', 'C', 'N'].indexOf(task.statements[i].answer)).click();
    else await qs.nth(i).locator('.opt').nth(task.questions[i].answer).click();
  }
  await page.click('button:has-text("Empezar ya el audio")');
  await page.waitForSelector('button:has-text("He terminado")', { timeout: 30000 });
  await page.click('button:has-text("He terminado")');
}
// Break → writing
await page.waitForSelector('text=Descanso', { timeout: 10000 });
ok(true, 'break after listening');
await page.waitForTimeout(400);
await page.reload(); // the mock resumes where it was
await page.waitForSelector('text=Descanso');
ok(true, 'mock resumes after a reload');
await page.click('button:has-text("Empezar ya la expresión escrita")');
ok((await page.locator('.timer').innerText()).match(/(70|69):/) !== null, 'writing paper timer: 70 minutes');
await page.fill('.writing-box', 'Hola, este es un texto corto para la prueba.');
await page.click('.tabs button >> nth=1');
await page.locator('.card.tap').first().click();
await page.fill('.writing-box', 'Otro texto corto.');
await shot('p4-mock-writing');
await page.click('button:has-text("Entregar")');
// Self-assessment: 0 on every criterion for both texts
for (let t = 0; t < 2; t++) {
  await page.waitForSelector('text=Autoevaluación');
  for (let i = 0; i < 4; i++) await page.locator('.q-card').nth(i).locator('.opt').nth(0).click();
  await page.click('button:has-text("Guardar la nota")');
}
await page.waitForSelector('text=Resultado del simulacro');
const verdict = await page.locator('.score-big').innerText();
const banner = await page.locator('.banner').innerText().catch(() => '');
ok(verdict === 'SUSPENSO', `one skill under 50 % fails the written exam (${verdict})`);
ok(/media supera el 50/.test(banner), 'explains that the average is above 50 % but one skill fails');
await shot('p4-mock-results');
await page.goto(url + '#/exam');
ok((await page.locator('text=Historial de simulacros').count()) === 1, 'mock saved in the exam history');
await shot('p4-exam');
console.log('page errors:', errors.length ? errors : 'none');
if (errors.length) process.exitCode = 1;
await browser.close();
