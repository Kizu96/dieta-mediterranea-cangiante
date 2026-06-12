// Verifica visiva del grafico SVG: semina pesate finte in IndexedDB, apre la
// schermata Peso e fotografa (chiaro e scuro). Usare su localhost, MAI sul live.
import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: 'new',
});
const pg = await b.newPage();
await pg.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await pg.goto('http://localhost:4173/dieta-mediterranea-cangiante/', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 800));

// Semina ~12 pesate sugli ultimi 30 giorni (calo realistico + rumore; 3 complete).
await pg.evaluate(async () => {
  const open = indexedDB.open('dietaMediterraneaCangiante');
  const db = await new Promise((res, rej) => {
    open.onsuccess = () => res(open.result);
    open.onerror = () => rej(open.error);
  });
  const tx = db.transaction('weights', 'readwrite');
  const store = tx.objectStore('weights');
  const today = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (30 - i * 2.5));
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const kg = Math.round((112.5 - i * 0.28 + Math.sin(i * 1.7) * 0.5) * 10) / 10;
    const full = i % 4 === 0;
    store.add({ date: iso, kg, updatedAt: Date.now(), ...(full ? { visceralFat: 16.4 - i * 0.05, bodyFatPct: 36.5 } : {}) });
  }
  await new Promise((res) => (tx.oncomplete = res));
  db.close();
});

await pg.reload({ waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 800));
await pg.evaluate(() => {
  const btn = [...document.querySelectorAll('.bottom-nav button')].find((b) => b.textContent.includes('Peso'));
  btn.click();
});
await new Promise((r) => setTimeout(r, 1200));
await pg.evaluate(() => window.scrollTo(0, 1050));
await new Promise((r) => setTimeout(r, 300));
await pg.screenshot({ path: '.screenshots/peso-chart.png' });
console.log('screenshot: .screenshots/peso-chart.png');
await b.close();
