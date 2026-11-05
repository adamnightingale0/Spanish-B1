// Phase 3 browser check: reading tasks (timed, highlighted evidence), listening (fake fast TTS), papers, results.
// Run against `npm run preview`: node tests/e2e/phase3.mjs http://localhost:4173/ [shotsDir]
import { createRequire } from 'node:module';
const { chromium, devices } = createRequire(import.meta.url)('playwright');
const [url = 'http://localhost:4173/', shots] = process.argv.slice(2);
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
// Fake speech engine: one es-ES voice, each utterance "ends" after 30 ms. Records what was spoken.
await ctx.addInitScript(() => {
  const voice = { name: 'Mónica', lang: 'es-ES', voiceURI: 'monica', localService: true, default: true };
  window.__spoken = [];
  const synth = {
    getVoices: () => [voice],
    speak(u) { window.__spoken.push(u.text); setTimeout(() => u.onend && u.onend(), 30); },
    cancel() {},
    addEventListener() {}, removeEventListener() {}
  };
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
  window.SpeechSynthesisUtterance = function (t) { this.text = t; };
});
const page = await ctx.newPage();
const errors = [];
page.on('dialog', (d) => d.accept());
page.on('pageerror', (e) => errors.push(e.message));
const shot = (n) => shots && page.screenshot({ path: `${shots}/${n}.png`, fullPage: true });
const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) process.exitCode = 1; };

// Reading: MCQ timed
await page.goto(url + '#/task/read-mcq-01');
await page.click('button:has-text("Empezar")');
ok(await page.locator('.timer').count() === 1, 'timed reading task shows a 20-minute timer');
await shot('p3-mcq-text');
await page.click('.tabs button >> nth=1');
for (let i = 0; i < 7; i++) await page.locator('.q-card').nth(i).locator('.opt').nth(1).click();
await shot('p3-mcq-q');
await page.click('button:has-text("Corregir")');
await page.waitForSelector('.feedback .verdict');
ok(/\/7/.test(await page.locator('.feedback .verdict').innerText()), 'MCQ scored out of 7');
await page.locator('button:has-text("Ver en el texto")').first().click();
ok(await page.locator('mark.evidence').count() >= 7, 'evidence sentences highlighted in the text');
await shot('p3-mcq-review');

// Reading: insert (with cohesion clue)
await page.goto(url + '#/task/read-insert-01');
await page.click('button:has-text("Empezar")');
const gaps = page.locator('select.gap-btn');
for (let i = 0; i < 7; i++) await gaps.nth(i).selectOption({ index: i + 1 });

await page.click('button:has-text("Corregir")');
await page.waitForSelector('mark.clue');
ok(await page.locator('mark.clue').count() >= 5, 'insert task highlights cohesion clues');
await shot('p3-insert-review');

// Reading: match
await page.goto(url + '#/task/read-match-01');
await page.click('button:has-text("Empezar")');
await page.click('.tabs button >> nth=1');
const sels = page.locator('.q-card select');
for (let i = 0; i < 8; i++) await sels.nth(i).selectOption({ index: 1 + i });
await shot('p3-match');
await page.click('button:has-text("Corregir")');
await page.waitForSelector('.feedback .verdict');
ok(/\/8/.test(await page.locator('.feedback .verdict').innerText()), 'match task scored out of 8');

// Listening: speakers, with prep skipped
await page.goto(url + '#/task/listen-speakers-01');
await page.click('button:has-text("Empezar")');
await shot('p3-listen-prep');
await page.click('button:has-text("Empezar ya el audio")');
await page.waitForSelector('text=audición 1 de 2');
for (let i = 0; i < 7; i++) await page.locator('.q-card').nth(i).locator('.opt').nth(0).click();
await page.waitForSelector('text=audición 2 de 2', { timeout: 15000 });
await shot('p3-listen-play');
await page.waitForSelector('button:has-text("He terminado")', { timeout: 15000 });
const spoken = await page.evaluate(() => window.__spoken.length);
ok(spoken === 28, `conversation played twice (${spoken} lines spoken, script has 14)`);
await page.click('button:has-text("He terminado")');
await page.waitForSelector('text=Transcripción');
ok((await page.locator('.q-card .opt[disabled]').count()) > 0, 'answers locked after the second play');
ok(await page.locator('.transcript mark.evidence').count() >= 5, 'transcript revealed with evidence highlighted');
await shot('p3-listen-review');

// Listening paper: three tasks in a row
await page.goto(url + '#/paper/listening');
await page.click('button:has-text("Empezar la prueba")');
for (let task = 0; task < 3; task++) {
  if (task === 0) await page.click('button:has-text("Empezar")');
  await page.waitForSelector('button:has-text("Empezar ya el audio")', { timeout: 15000 });
  await page.click('button:has-text("Empezar ya el audio")');
  await page.waitForSelector('button:has-text("He terminado")', { timeout: 30000 });
  await page.click('button:has-text("He terminado")');
}
await page.waitForSelector('text=Resultado', { timeout: 10000 });
ok(/\/20/.test(await page.locator('.feedback p').first().innerText()), 'listening paper scored out of 20');
await shot('p3-listen-paper');

// Reading paper: timer + 22 questions, then results in Progress
await page.goto(url + '#/paper/reading');
ok((await page.locator('text=22 preguntas').count()) === 1, 'reading paper has 22 questions');
await page.click('button:has-text("Empezar la prueba")');
ok((await page.locator('.timer').innerText()).includes('60:00') || (await page.locator('.timer').innerText()).includes('59:'), 'reading paper timer starts at 60 minutes');
await page.click('.tabs button >> nth=2');

await page.click('button:has-text("Entregar")');
await page.waitForSelector('text=Resultado');
await page.goto(url + '#/progress');
await page.reload();
await page.waitForSelector('text=Destrezas');
const rows = await page.locator('text=prueba completa').count();
ok(rows >= 3, `paper results saved and shown on Progress (${rows} rows)`);
await shot('p3-progress');
console.log('page errors:', errors.length ? errors : 'none');
if (errors.length) process.exitCode = 1;
await browser.close();
