// Verifica: somma kcal reale di ogni giorno del piano vs kcalTarget.
import esbuild from 'esbuild';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = resolve(root, 'node_modules/.cache/days');
mkdirSync(tmp, { recursive: true });
async function load(rel, name) {
  const out = resolve(tmp, name + '.mjs');
  await esbuild.build({ entryPoints: [resolve(root, rel)], bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'warning' });
  return import(pathToFileURL(out).href + `?t=${Date.now()}`);
}
const { recipes } = await load('src/data/recipes.ts', 'r');
const { seasonPlans } = await load('src/data/mealPlan.ts', 'm');
const kcal = Object.fromEntries(recipes.map((r) => [r.id, r.kcal]));
for (const plan of seasonPlans) {
  console.log(`\n== ${plan.season.toUpperCase()} ==`);
  for (const d of plan.days) {
    const tot = d.meals.reduce((s, m) => s + (kcal[m.recipeId] || 0), 0);
    const delta = tot - d.kcalTarget;
    console.log(`${d.dayLabel}  target ${d.kcalTarget}  reale ${tot}  Δ${delta >= 0 ? '+' : ''}${delta}`);
  }
}
