// Verifica del toggle tema nella topbar: click sulla luna → data-theme=dark +
// meta theme-color aggiornato; screenshot del risultato.
import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: 'new',
});
const pg = await b.newPage();
await pg.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await pg.goto('http://localhost:4173/dieta-mediterranea-cangiante/', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 800));
const before = await pg.evaluate(() => document.documentElement.dataset.theme);
await pg.click('button[aria-label="Passa al tema scuro"]');
await new Promise((r) => setTimeout(r, 500));
const after = await pg.evaluate(() => ({
  theme: document.documentElement.dataset.theme,
  meta: document.querySelector('meta[name="theme-color"]').content,
}));
await pg.screenshot({ path: '.screenshots/mobile-toggle-dark.png' });
console.log('before:', before, '→ after:', JSON.stringify(after));
await b.close();
