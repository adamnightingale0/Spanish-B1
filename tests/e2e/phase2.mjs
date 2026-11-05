// Phase 2 browser check: vocab SRS, error/order/match drills, book viewer (offline, 20 page turns).
// Run against `npm run preview`: node tests/e2e/phase2.mjs http://localhost:4173/ path/to/test.pdf [shotsDir]
import { createRequire } from 'node:module';
const { chromium, devices } = createRequire(import.meta.url)('playwright');
const [url = 'http://localhost:4173/', pdf, shots] = process.argv.slice(2);
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const shot = (n) => shots && page.screenshot({ path: `${shots}/${n}.png`, fullPage: true });
const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) process.exitCode = 1; };

await page.goto(url);
await page.waitForSelector('text=Sesión de hoy');
ok(await page.locator('text=Prueba de nivel').count() > 0, 'Home offers the placement check');
await shot('p2-home');

// Vocabulary
await page.goto(url + '#/vocab');
await page.click('button:has-text("Estudiar")');
for (let i = 0; i < 5; i++) {
  await page.click('button:has-text("Mostrar")');
  if (i === 0) await shot('p2-card');
  await page.click('.grades button:has-text("Bien")');
}
await page.click('.drill-top button'); // exit
await page.goto(url + '#/progress');
await page.reload();
await page.waitForSelector('text=Vocabulario');
const seen = await page.locator('.stat:has-text("tarjetas vistas") b').innerText();
ok(Number(seen) === 5, `5 cards reviewed and kept after reload (${seen})`);

// New drill types via Practicar → Drill a medida
for (const [type, label] of [['error', 'Encontrar el error'], ['order', 'Ordenar'], ['match', 'Relacionar']]) {
  await page.goto(url + '#/practice');
  await page.selectOption('select >> nth=0', 'all');
  await page.selectOption('select >> nth=2', type);
  await page.click('button:has-text("Empezar")');
  await page.waitForSelector('.drill-top');
  ok((await page.locator(`.pill:has-text("${label}")`).count()) > 0, `${label} drill opens`);
  if (type === 'error') {
    await page.locator('.token-row .token').nth(1).click();
    await page.fill('.answer-input', 'algo');
  } else if (type === 'order') {
    const n = await page.locator('.token-row .token').count();
    for (let i = 0; i < n; i++) await page.locator('.token-row .token:not([disabled])').first().click();
  } else {
    const rows = await page.locator('.match-row').count();
    for (let i = 0; i < rows; i++) await page.locator('.options button:not([disabled])').first().click();
  }
  await shot(`p2-${type}`);
  await page.click('button:has-text("Comprobar")');
  await page.waitForSelector('button:has-text("Siguiente")');
  await shot(`p2-${type}-feedback`);
}

// Book viewer
if (pdf) {
  await page.goto(url + '#/settings');
  await page.setInputFiles('input[accept^="application/pdf"]', pdf);
  await page.waitForSelector('text=Libro cargado');
  await page.click('button:has-text("La página 10")');
  await page.waitForSelector('.book-canvas', { timeout: 8000 });
  await page.waitForFunction(() => !document.querySelector('.book-msg'), null, { timeout: 8000 });
  await shot('p2-book');
  const t0 = Date.now();
  for (let i = 0; i < 20; i++) {
    await page.click('button[aria-label="Página siguiente"]');
    await page.waitForFunction(() => !document.querySelector('.book-msg'), null, { timeout: 8000 });
  }
  ok(true, `20 page turns without a crash (${Date.now() - t0} ms)`);
  ok((await page.locator('.book-canvas').count()) === 1, 'only one canvas in the page at a time');
  await page.click('.book-bar button >> nth=0');
  // Offline: book link from a unit screen
  await page.waitForFunction(() => navigator.serviceWorker?.controller != null, null, { timeout: 10000 }).catch(() => {});
  await ctx.setOffline(true);
  await page.goto(url + '#/units/2');
  await page.reload();
  await page.waitForSelector('.bookref-link');
  const t1 = Date.now();
  await page.locator('.bookref-link').first().click();
  await page.waitForSelector('.book-canvas', { timeout: 8000 });
  await page.waitForFunction(() => !document.querySelector('.book-msg'), null, { timeout: 8000 });
  ok(Date.now() - t1 < 2000, `offline book link shows the page in ${Date.now() - t1} ms`);
  await shot('p2-book-offline');
  await ctx.setOffline(false);
}

// Today's session starts with flashcards
await page.goto(url + '#/home');
await page.click('text=Sesión de hoy');
ok(!!(await page.waitForSelector('.flashcard', { timeout: 5000 }).catch(() => null)), "today's session starts with vocabulary cards");
console.log('page errors:', errors.length ? errors : 'none');
if (errors.length) process.exitCode = 1;
await browser.close();
