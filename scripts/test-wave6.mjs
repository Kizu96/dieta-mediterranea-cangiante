// Verifica visiva ondata 6: voci libere in Spesa + heatmap aderenza in Peso
// (con stati pasto finti seminati in IndexedDB). Solo su localhost.
import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: 'new',
});
const pg = await b.newPage();
await pg.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await pg.goto('http://localhost:4173/dieta-mediterranea-cangiante/', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 800));

// Semina stati pasto sulle ultime 6 settimane (giorni pieni, parziali, saltati).
await pg.evaluate(async () => {
  const open = indexedDB.open('dietaMediterraneaCangiante');
  const db = await new Promise((res, rej) => {
    open.onsuccess = () => res(open.result);
    open.onerror = () => rej(open.error);
  });
  const tx = db.transaction('mealStatus', 'readwrite');
  const store = tx.objectStore('mealStatus');
  const slots = ['colazione', 'pranzo', 'spuntino', 'cena'];
  const today = new Date();
  for (let back = 0; back < 42; back++) {
    const d = new Date(today);
    d.setDate(d.getDate() - back);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const mood = back % 7; // pattern settimanale finto
    for (const slot of slots) {
      let status = 'eaten';
      if (mood === 5 && slot === 'cena') status = 'skipped';
      if (mood === 6 && slot === 'pranzo') status = 'offplan';
      if (mood === 3 && slot === 'spuntino') status = 'half';
      store.put({ date: iso, slot, status, updatedAt: Date.now(), ...(status === 'offplan' ? { offPlanKcal: 700 } : {}) });
    }
  }
  await new Promise((res) => (tx.oncomplete = res));
  db.close();
});

await pg.reload({ waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 800));

// Peso → heatmap
await pg.evaluate(() => {
  const btn = [...document.querySelectorAll('.bottom-nav button')].find((x) => x.textContent.includes('Peso'));
  btn.click();
});
await new Promise((r) => setTimeout(r, 1200));
await pg.evaluate(() => {
  document.querySelector('h2')?.scrollIntoView();
  const target = [...document.querySelectorAll('h2')].find((h) => h.textContent.includes('Aderenza'));
  target?.scrollIntoView({ block: 'start' });
});
await new Promise((r) => setTimeout(r, 400));
await pg.screenshot({ path: '.screenshots/heatmap.png' });

// Spesa → voci libere
await pg.evaluate(() => {
  const btn = [...document.querySelectorAll('.bottom-nav button')].find((x) => x.textContent.includes('Spesa'));
  btn.click();
});
await new Promise((r) => setTimeout(r, 1200));
await pg.type('#custom-item', 'Carta da cucina');
await pg.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((x) => x.textContent.trim().endsWith('Aggiungi'));
  btn.click();
});
await new Promise((r) => setTimeout(r, 500));
await pg.evaluate(() => {
  const target = [...document.querySelectorAll('h2')].find((h) => h.textContent.includes('Altro'));
  target?.scrollIntoView({ block: 'center' });
});
await new Promise((r) => setTimeout(r, 300));
await pg.screenshot({ path: '.screenshots/custom-spesa.png' });

console.log('ok: .screenshots/heatmap.png + .screenshots/custom-spesa.png');
await b.close();
