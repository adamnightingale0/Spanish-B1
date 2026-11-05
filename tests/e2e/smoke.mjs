// Smoke test at iPhone viewport: drill → persist → offline reload. Run: node tests/e2e/smoke.mjs [url] [shotsDir]
import { createRequire } from 'node:module';
const { chromium, devices } = createRequire(import.meta.url)('playwright');
const url = process.argv[2] ?? 'http://localhost:4173/';
const shots = process.argv[3];
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(url);
await page.waitForSelector('text=Sesión de hoy');
if (shots) await page.screenshot({ path: `${shots}/home.png`, fullPage: true });
await page.click('text=Sesión de hoy');
await page.waitForSelector('.drill-top');
// Today's session starts with flashcards: review them, then continue to the drills.
for (let i = 0; i < 40 && (await page.locator('.flashcard').count()); i++) {
  if (await page.locator('button:has-text("Mostrar")').count()) await page.click('button:has-text("Mostrar")');
  await page.click('.grades button:has-text("Bien")');
}
if (await page.locator('button:has-text("Seguir con los ejercicios")').count()) await page.click('button:has-text("Seguir con los ejercicios")');
await page.waitForSelector('.drill-top');
let answered = 0;
for (let step = 0; step < 60 && answered < 20; step++) {
  if (await page.locator('text=¡Sesión terminada!').count()) break;
  const opts = page.locator('.options button:not([disabled])');
  if (await page.locator('.cloze-text input:not([disabled])').count()) {
    const inputs = page.locator('.cloze-text input');
    const n = await inputs.count();
    for (let i = 0; i < n; i++) await inputs.nth(i).fill(i % 2 ? 'era' : 'fui');
    if (shots && answered === 0) await page.screenshot({ path: `${shots}/cloze.png`, fullPage: true });
    await page.click('button:has-text("Comprobar")');
  } else if (await opts.count()) {
    await opts.first().click();
  } else if (await page.locator('.token-row').count()) {
    // error / order items
    if (await page.locator('.order-answer').count()) {
      const n = await page.locator('.token-row .token').count();
      for (let i = 0; i < n; i++) await page.locator('.token-row .token:not([disabled])').first().click();
    } else {
      await page.locator('.token-row .token').first().click();
      await page.fill('.answer-input', 'x');
    }
    await page.click('button:has-text("Comprobar")');
  } else if (await page.locator('.match-row').count()) {
    const rows = await page.locator('.match-row').count();
    for (let i = 0; i < rows; i++) await page.locator('.options button:not([disabled])').first().click();
    await page.click('button:has-text("Comprobar")');
  } else if (await page.locator('.answer-input').count()) {
    await page.fill('.answer-input', 'he perdido');
    await page.click('button:has-text("Comprobar")');
  }
  // Why? step
  const whyRows = page.locator('.gap-row .why-chips');
  if (await whyRows.count()) {
    const k = await whyRows.count();
    for (let i = 0; i < k; i++) await whyRows.nth(i).locator('button').first().click();
    if (shots && answered === 0) await page.screenshot({ path: `${shots}/why-cloze.png`, fullPage: true });
    await page.click('button:has-text("Ver corrección")');
  } else if (await page.locator('.why-chips button:not([disabled])').count()) {
    if (shots) await page.screenshot({ path: `${shots}/why.png` });
    await page.locator('.why-chips button').nth(2).click();
  }
  await page.waitForSelector('button:has-text("Siguiente")');
  if (shots && answered === 1) await page.screenshot({ path: `${shots}/feedback.png`, fullPage: true });
  await page.click('button:has-text("Siguiente")');
  answered++;
}
console.log('answered', answered);
await page.goto(url + '#/progress');
await page.waitForSelector('text=Mapa de dominio');
const before = await page.locator('.stat b').nth(1).innerText();
await page.reload();
await page.waitForSelector('text=Mapa de dominio');
const after = await page.locator('.stat b').nth(1).innerText();
console.log('attempts before/after reload:', before, after);
if (shots) await page.screenshot({ path: `${shots}/progress.png`, fullPage: true });
// Offline: service worker should serve the app.
await page.waitForFunction(() => navigator.serviceWorker?.controller != null, null, { timeout: 10000 }).catch(() => {});
await ctx.setOffline(true);
await page.goto(url + '#/units');
await page.waitForSelector('text=Volver a empezar', { timeout: 5000 });
console.log('offline load OK');
await page.goto(url + '#/units/2');
if (shots) await page.screenshot({ path: `${shots}/unit2.png`, fullPage: true });
await page.goto(url + '#/exam');
if (shots) await page.screenshot({ path: `${shots}/exam.png`, fullPage: true });
console.log('page errors:', errors.length ? errors : 'none');
await browser.close();
if (before !== after || Number(after) < 20 || errors.length) process.exit(1);
