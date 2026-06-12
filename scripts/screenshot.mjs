// ===========================================================================
// Screenshot di verifica layout (mobile + desktop) con diagnosi overflow.
// Uso:  node scripts/screenshot.mjs [url] [suffisso]
//   - fotografa la pagina a 390x844 (mobile) e 1440x900 (desktop)
//     in .screenshots/{mobile,desktop}[-suffisso].png
//   - stampa document.scrollWidth e gli elementi più larghi del viewport
//     (la causa tipica del "tutto tagliato a destra" su mobile).
// Richiede Microsoft Edge installato (niente download di Chromium).
// ===========================================================================
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const url = process.argv[2] ?? 'http://localhost:4173/dieta-mediterranea-cangiante/';
const suffix = process.argv[3] ? `-${process.argv[3]}` : '';

const EDGE_PATHS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
];

const SIZES = [
  { name: 'mobile', width: 390, height: 844, mobile: true },
  { name: 'desktop', width: 1440, height: 900, mobile: false },
];

mkdirSync('.screenshots', { recursive: true });

const { existsSync } = await import('node:fs');
const executablePath = EDGE_PATHS.find((p) => existsSync(p));
if (!executablePath) {
  console.error('Edge non trovato.');
  process.exit(1);
}

const browser = await puppeteer.launch({ executablePath, headless: 'new' });
try {
  for (const size of SIZES) {
    const page = await browser.newPage();
    await page.setViewport({
      width: size.width,
      height: size.height,
      isMobile: size.mobile,
      hasTouch: size.mobile,
      deviceScaleFactor: 2,
    });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 800)); // liveQuery/transizioni

    const report = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const offenders = [];
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        // Solo i "colpevoli primari": più larghi del viewport ma con genitore che non lo è.
        if (r.width > vw + 1 || r.right > vw + 1) {
          const pr = el.parentElement?.getBoundingClientRect();
          if (!pr || (pr.width <= vw + 1 && pr.right <= vw + 1)) {
            const cls = typeof el.className === 'string' ? el.className : '';
            offenders.push(
              `${el.tagName.toLowerCase()}${cls ? '.' + cls.split(' ').join('.') : ''} → width ${Math.round(r.width)}, right ${Math.round(r.right)}`,
            );
          }
        }
      }
      return {
        clientWidth: vw,
        scrollWidth: document.documentElement.scrollWidth,
        offenders: offenders.slice(0, 12),
      };
    });

    const file = `.screenshots/${size.name}${suffix}.png`;
    await page.screenshot({ path: file });
    console.log(`\n=== ${size.name} (${size.width}px) → ${file}`);
    console.log(`clientWidth ${report.clientWidth} / scrollWidth ${report.scrollWidth}`);
    if (report.offenders.length) {
      console.log('Elementi oltre il viewport:');
      for (const o of report.offenders) console.log('  - ' + o);
    } else {
      console.log('Nessun overflow orizzontale ✅');
    }
    await page.close();
  }
} finally {
  await browser.close();
}
