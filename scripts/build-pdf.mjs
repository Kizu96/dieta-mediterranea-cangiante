// Genera public/Guida-Dieta.pdf (+ .html di backup) dai dati dell'app.
// 1) esbuild bundla scripts/generate-guide-html.ts (importa src/data/*).
// 2) si scrive l'HTML su file temporaneo.
// 3) Microsoft Edge headless stampa l'HTML in PDF (nessun download di browser).
import esbuild from 'esbuild';
import { mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const tmpDir = resolve(root, 'node_modules', '.cache', 'pdf');
mkdirSync(tmpDir, { recursive: true });

// 1) bundle del generatore (TS -> ESM autocontenuto)
const bundlePath = resolve(tmpDir, 'gen.mjs');
await esbuild.build({
  entryPoints: [resolve(__dirname, 'generate-guide-html.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: bundlePath,
  logLevel: 'warning',
});

const { buildGuideHTML } = await import(pathToFileURL(bundlePath).href);
const html = buildGuideHTML();

const htmlTmp = resolve(tmpDir, 'guida.html');
writeFileSync(htmlTmp, html, 'utf8');
// copia di backup stampabile a mano (Ctrl+P -> Salva come PDF)
writeFileSync(resolve(root, 'public', 'Guida-Dieta.html'), html, 'utf8');
console.log('HTML generato (' + html.length.toLocaleString() + ' caratteri).');

// 2) trova un browser Chromium (Edge o Chrome) su Windows
const candidates = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
];
const browser = candidates.find((p) => existsSync(p));
const pdfOut = resolve(root, 'public', 'Guida-Dieta.pdf');

if (!browser) {
  console.warn(
    '\n⚠️  Nessun browser Chromium trovato. È stato generato public/Guida-Dieta.html: aprilo e usa Ctrl+P → "Salva come PDF".',
  );
  process.exit(0);
}

// 3) stampa in PDF headless.
// IMPORTANTE: serve un --user-data-dir dedicato, altrimenti se Edge/Chrome è
// già in esecuzione il nuovo processo delega all'istanza esistente ed esce
// subito (status 0) senza generare il PDF.
const profileDir = resolve(tmpDir, 'profile');
mkdirSync(profileDir, { recursive: true });
const args = [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  `--user-data-dir=${profileDir}`,
  '--no-pdf-header-footer',
  '--virtual-time-budget=12000',
  `--print-to-pdf=${pdfOut}`,
  pathToFileURL(htmlTmp).href,
];
const res = spawnSync(browser, args, { stdio: 'inherit' });
if (res.status === 0 && existsSync(pdfOut)) {
  const kb = Math.round(statSync(pdfOut).size / 1024);
  console.log(`✅ PDF creato: public/Guida-Dieta.pdf (${kb} KB) con ${browser.split('/').pop()}`);
} else {
  console.warn(
    `\n⚠️  La stampa PDF non è riuscita (status ${res.status}). Usa il backup public/Guida-Dieta.html (Ctrl+P → Salva come PDF).`,
  );
}
