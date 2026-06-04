// Genera le icone PNG della PWA (192/512 + maskable) dall'artwork SVG.
// Deterministico (sharp). Esegui con: npm run build:icons
import sharp from 'sharp';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = (n) => resolve(root, 'public', n);

const branch = `
  <g fill="none" stroke="#f4ece0" stroke-width="14" stroke-linecap="round">
    <path d="M160 380 C 220 300, 280 240, 360 170"/>
  </g>
  <g fill="#8a9b4a" stroke="#f4ece0" stroke-width="6">
    <ellipse cx="225" cy="300" rx="34" ry="20" transform="rotate(-38 225 300)"/>
    <ellipse cx="285" cy="248" rx="34" ry="20" transform="rotate(-38 285 248)"/>
    <ellipse cx="200" cy="345" rx="34" ry="20" transform="rotate(-38 200 345)"/>
  </g>
  <circle cx="305" cy="300" r="26" fill="#c0612f" stroke="#f4ece0" stroke-width="6"/>
  <circle cx="345" cy="255" r="26" fill="#3f4f23" stroke="#f4ece0" stroke-width="6"/>`;

// "any": quadrato arrotondato, angoli trasparenti
const anySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="#6b7a3a"/>${branch}</svg>`;

// "maskable": sfondo a tutto campo, contenuto nella safe-zone (80%)
const maskSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#6b7a3a"/><g transform="translate(51.2,51.2) scale(0.8)">${branch}</g></svg>`;

const jobs = [
  [anySvg, 192, 'pwa-192.png'],
  [anySvg, 512, 'pwa-512.png'],
  [anySvg, 180, 'apple-touch-icon.png'],
  [maskSvg, 192, 'pwa-maskable-192.png'],
  [maskSvg, 512, 'pwa-maskable-512.png'],
];

await Promise.all(
  jobs.map(([svg, size, name]) =>
    sharp(Buffer.from(svg)).resize(size, size).png().toFile(out(name)),
  ),
);
console.log(`✅ ${jobs.length} icone PNG generate in public/`);
