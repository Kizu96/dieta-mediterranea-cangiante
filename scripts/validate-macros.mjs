// Valida/ricalcola i macro delle ricette dalla tabella nutrizionale.
//   node scripts/validate-macros.mjs          -> solo report
//   node scripts/validate-macros.mjs --write   -> riscrive i valori in recipes.ts
import esbuild from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { computeMacros } from './nutrition-data.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const recipesPath = resolve(root, 'src/data/recipes.ts');
const write = process.argv.includes('--write');

// Bundle di recipes.ts per importarne i dati in Node.
const tmpDir = resolve(root, 'node_modules/.cache/macros');
mkdirSync(tmpDir, { recursive: true });
const bundle = resolve(tmpDir, 'recipes.mjs');
await esbuild.build({ entryPoints: [recipesPath], bundle: true, format: 'esm', platform: 'node', outfile: bundle, logLevel: 'warning' });
const { recipes } = await import(pathToFileURL(bundle).href + `?t=${Date.now()}`);

let text = readFileSync(recipesPath, 'utf8');
const missingAll = new Set();
let changed = 0;
const rows = [];

for (const r of recipes) {
  const m = computeMacros(r);
  m.missing.forEach((x) => missingAll.add(x));

  const dKcal = m.kcal - r.kcal;
  rows.push(
    `${r.id.padEnd(34)} ${String(r.kcal).padStart(4)}→${String(m.kcal).padStart(4)} kcal  ` +
      `(P${r.protein}→${m.protein} C${r.carbs}→${m.carbs} G${r.fat}→${m.fat})  Δ${dKcal >= 0 ? '+' : ''}${dKcal}`,
  );

  if (write) {
    const idIdx = text.indexOf(`id: '${r.id}'`);
    if (idIdx === -1) continue;
    const end = text.indexOf('\n  },', idIdx);
    let seg = text.slice(idIdx, end);
    seg = seg
      .replace(/(\n\s*kcal: )\d+/, `$1${m.kcal}`)
      .replace(/(\n\s*protein: )\d+(?:\.\d+)?/, `$1${m.protein}`)
      .replace(/(\n\s*carbs: )\d+(?:\.\d+)?/, `$1${m.carbs}`)
      .replace(/(\n\s*fat: )\d+(?:\.\d+)?/, `$1${m.fat}`);
    if (/\n\s*fiber: \d+/.test(seg)) seg = seg.replace(/(\n\s*fiber: )\d+(?:\.\d+)?/, `$1${m.fiber}`);
    text = text.slice(0, idIdx) + seg + text.slice(end);
    changed++;
  }
}

console.log(rows.join('\n'));
console.log(`\nRicette analizzate: ${recipes.length}`);
if (missingAll.size) {
  console.log(`\n⚠️  Ingredienti SENZA dati nutrizionali (aggiungili a nutrition-data.mjs):`);
  console.log('   ' + [...missingAll].sort().join(', '));
} else {
  console.log('✅ Tutti gli ingredienti delle ricette hanno dati nutrizionali.');
}
if (write) {
  writeFileSync(recipesPath, text, 'utf8');
  console.log(`\n✍️  Riscritti i macro di ${changed} ricette in src/data/recipes.ts`);
}
