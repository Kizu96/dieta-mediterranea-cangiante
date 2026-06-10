// Genera l'HTML stampabile della "Guida Dieta Mediterranea Cangiante".
// Fonte unica: importa direttamente i dati dell'app (src/data/*). Viene
// bundlato da scripts/build-pdf.mjs (esbuild) e poi stampato in PDF con Edge.

import { ingredients } from '../src/data/ingredients';
import { recipes } from '../src/data/recipes';
import { dailyEssentials } from '../src/data/dailyEssentials';
import { seasonPlans } from '../src/data/mealPlan';
import { workoutWeeks } from '../src/data/workoutPlan';
import { guideSections } from '../src/data/guide';
import type { MealSlot, Recipe, Season } from '../src/data/types';

const ingMap = new Map(ingredients.map((i) => [i.id, i]));
const recMap = new Map(recipes.map((r) => [r.id, r]));

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// --- mini markdown -> HTML (titoli, grassetto, corsivo, liste, citazioni, link)
function md(src: string): string {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let list: 'ul' | 'ol' | null = null;
  let para: string[] = [];

  const inline = (t: string): string =>
    esc(t)
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');

  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${inline(para.join(' '))}</p>`);
      para = [];
    }
  };
  const closeList = () => {
    if (list) {
      out.push(`</${list}>`);
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushPara();
      closeList();
      continue;
    }
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^(#{1,4})\s+(.*)$/))) {
      flushPara();
      closeList();
      const lvl = m[1].length + 1; // # -> h2
      out.push(`<h${lvl}>${inline(m[2])}</h${lvl}>`);
    } else if ((m = line.match(/^>\s?(.*)$/))) {
      flushPara();
      closeList();
      out.push(`<blockquote>${inline(m[1])}</blockquote>`);
    } else if ((m = line.match(/^\s*[-*]\s+(.*)$/))) {
      flushPara();
      if (list !== 'ul') {
        closeList();
        list = 'ul';
        out.push('<ul>');
      }
      out.push(`<li>${inline(m[1])}</li>`);
    } else if ((m = line.match(/^\s*\d+\.\s+(.*)$/))) {
      flushPara();
      if (list !== 'ol') {
        closeList();
        list = 'ol';
        out.push('<ol>');
      }
      out.push(`<li>${inline(m[1])}</li>`);
    } else {
      if (list) closeList();
      para.push(line.trim());
    }
  }
  flushPara();
  closeList();
  return out.join('\n');
}

const slotLabel: Record<MealSlot, string> = {
  colazione: 'Colazione',
  pranzo: 'Pranzo',
  spuntino: 'Spuntino',
  cena: 'Cena',
};
const slotOrder: MealSlot[] = ['colazione', 'pranzo', 'spuntino', 'cena'];

function recipeCard(r: Recipe): string {
  const ing = r.ingredients
    .map((ri) => {
      const name = ingMap.get(ri.ingredientId)?.name ?? ri.ingredientId;
      const q = Number.isInteger(ri.qty) ? ri.qty : ri.qty.toFixed(1);
      return `<li>${esc(name)} — ${q} ${esc(ri.unit)}${ri.note ? ` <em>(${esc(ri.note)})</em>` : ''}</li>`;
    })
    .join('');
  const steps = r.steps.map((s) => `<li>${esc(s)}</li>`).join('');
  const equip = r.equipment.join(', ');
  const tags = (r.tags ?? []).map((t) => `<span class="tag">${esc(t)}</span>`).join(' ');
  return `<div class="recipe">
    <h3>${esc(r.name)}</h3>
    <p class="meta">${r.slot.map((s) => slotLabel[s]).join(' / ')} · ${r.seasons.join(' / ')} · 🍳 ${esc(equip)} · ⏱ ${r.timeMin} min</p>
    <p class="macros"><strong>${r.kcal} kcal</strong> · P ${r.protein}g · C ${r.carbs}g · G ${r.fat}g${r.fiber ? ` · Fibre ${r.fiber}g` : ''}</p>
    <div class="cols">
      <div><h4>Ingredienti (per 1)</h4><ul>${ing}</ul></div>
      <div><h4>Preparazione</h4><ol>${steps}</ol></div>
    </div>
    <p class="store"><strong>Conservazione:</strong> ${esc(r.storage)}</p>
    ${r.tips ? `<p class="tips"><strong>Consiglio:</strong> ${esc(r.tips)}</p>` : ''}
    ${tags ? `<p class="tags">${tags}</p>` : ''}
  </div>`;
}

function planTable(season: Season): string {
  const plan = seasonPlans.find((p) => p.season === season);
  if (!plan) return '';
  const head = `<tr><th>Giorno</th><th>kcal</th>${slotOrder.map((s) => `<th>${slotLabel[s]}</th>`).join('')}</tr>`;
  const multiWeek = plan.days.length > 7;
  const colspan = 2 + slotOrder.length;
  const rows = plan.days
    .map((d, i) => {
      const sep =
        multiWeek && i % 7 === 0
          ? `<tr class="wsep"><td colspan="${colspan}">Settimana ${String.fromCharCode(65 + i / 7)}</td></tr>`
          : '';
      const cells = slotOrder
        .map((s) => {
          const meal = d.meals.find((m) => m.slot === s);
          const name = meal ? (recMap.get(meal.recipeId)?.name ?? meal.recipeId) : '—';
          return `<td>${esc(name)}</td>`;
        })
        .join('');
      return `${sep}<tr><td><strong>${d.dayLabel}</strong>${d.active ? ' 🏃' : ''}</td><td>${d.kcalTarget}</td>${cells}</tr>`;
    })
    .join('');
  return `<table class="plan"><thead>${head}</thead><tbody>${rows}</tbody></table>`;
}

function essentialsSection(): string {
  const items = dailyEssentials
    .map(
      (e) =>
        `<li><strong>${esc(e.name)}</strong> — ${esc(e.detail)}${e.source ? `<br><span class="src">Fonte: ${esc(e.source)}</span>` : ''}</li>`,
    )
    .join('');
  return `<ul class="essentials">${items}</ul>`;
}

function workoutsSection(): string {
  return workoutWeeks
    .map((w) => {
      const days = w.days
        .map((d) => {
          const ex = d.exercises.map((e) => `<li><strong>${esc(e.name)}:</strong> ${esc(e.detail)}</li>`).join('');
          return `<div class="wday"><h4>${esc(d.dayLabel)} — ${esc(d.title)} <span class="meta">(${esc(d.type)}, ${d.durationMin} min)</span></h4><ul>${ex}</ul>${d.notes ? `<p class="tips">${esc(d.notes)}</p>` : ''}</div>`;
        })
        .join('');
      return `<div class="wweek"><h3>${esc(w.weekLabel)} — ${esc(w.focus)}</h3>${days}</div>`;
    })
    .join('');
}

export function buildGuideHTML(): string {
  const today = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

  const recipesBySlot = slotOrder
    .map((slot) => {
      const rs = recipes.filter((r) => r.slot.includes(slot));
      if (!rs.length) return '';
      return `<h2 class="slot">${slotLabel[slot]}</h2>${rs.map(recipeCard).join('')}`;
    })
    .join('');

  const guides = guideSections
    .map((g) => `<section class="guide-sec"><h2>${g.icon ? g.icon + ' ' : ''}${esc(g.title)}</h2>${md(g.body)}</section>`)
    .join('');

  return `<!doctype html><html lang="it"><head><meta charset="utf-8">
<title>Dieta Mediterranea Cangiante — Guida completa</title>
<style>
  :root{ --olive:#556b2f; --olive-d:#3f5022; --terra:#c1440e; --cream:#faf7f0; --ink:#2b2b2b; --muted:#6b6b6b; }
  *{ box-sizing:border-box; }
  body{ font-family:'Segoe UI',system-ui,Arial,sans-serif; color:var(--ink); margin:0; line-height:1.5; font-size:11.5px; }
  h1,h2,h3,h4{ color:var(--olive-d); line-height:1.25; }
  h1{ font-size:30px; margin:0 0 6px; }
  h2{ font-size:18px; border-bottom:2px solid var(--olive); padding-bottom:4px; margin:22px 0 10px; }
  h2.slot{ color:var(--terra); border-color:var(--terra); }
  h3{ font-size:14px; margin:14px 0 4px; }
  h4{ font-size:12px; margin:8px 0 2px; }
  p{ margin:5px 0; }
  a{ color:var(--terra); text-decoration:none; }
  code{ background:#eee; padding:1px 4px; border-radius:3px; }
  blockquote{ border-left:3px solid var(--olive); background:#f1f3ea; margin:6px 0; padding:5px 10px; color:#444; }
  ul,ol{ margin:5px 0; padding-left:20px; }
  li{ margin:2px 0; }
  .cover{ background:linear-gradient(135deg,var(--olive),var(--olive-d)); color:#fff; padding:90px 50px; height:100vh; }
  .cover h1{ color:#fff; font-size:42px; }
  .cover p{ font-size:15px; max-width:520px; opacity:.95; }
  .cover .badge{ display:inline-block; margin-top:18px; background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.4); padding:6px 14px; border-radius:20px; font-size:12px; }
  .wrap{ padding:0 40px 40px; }
  .disclaimer{ background:#fff4e9; border:1px solid var(--terra); border-radius:8px; padding:10px 14px; margin:14px 0; font-size:11px; }
  .recipe{ border:1px solid #e3e0d5; border-radius:8px; padding:10px 14px; margin:10px 0; page-break-inside:avoid; }
  .recipe .meta{ color:var(--muted); font-size:10px; margin:0 0 4px; }
  .recipe .macros{ color:var(--olive-d); font-size:11px; margin:0 0 6px; }
  .cols{ display:flex; gap:18px; }
  .cols>div{ flex:1; }
  .store,.tips{ font-size:10.5px; color:#444; margin-top:6px; }
  .tag{ display:inline-block; background:#eef1e6; color:var(--olive-d); border-radius:10px; padding:1px 8px; font-size:9.5px; }
  table.plan{ width:100%; border-collapse:collapse; font-size:10px; margin:8px 0; page-break-inside:avoid; }
  table.plan th,table.plan td{ border:1px solid #ddd; padding:5px 6px; text-align:left; vertical-align:top; }
  table.plan th{ background:var(--olive); color:#fff; }
  table.plan tr:nth-child(even) td{ background:#f7f8f2; }
  .essentials li{ margin:6px 0; }
  .src{ color:var(--muted); font-size:9.5px; }
  .wweek{ page-break-inside:avoid; margin-bottom:10px; }
  .plan .wsep td{ background:#efe9df; font-weight:bold; text-align:left; }
  .wday{ margin:6px 0; }
  section.guide-sec{ page-break-inside:avoid; }
  .pb{ page-break-before:always; }
  @page{ margin:14mm 12mm; }
  @media print{ .cover{ height:auto; min-height:240mm; } }
</style></head><body>

<div class="cover">
  <h1>Dieta Mediterranea Cangiante</h1>
  <p>Programma alimentare e di movimento per perdere peso e ridurre il grasso viscerale, in versione estate e inverno. Ricette dosate per una persona, cibi reperibili, senza forno.</p>
  <span class="badge">Generato il ${today} · ${recipes.length} ricette · ${ingredients.length} ingredienti</span>
</div>

<div class="wrap">
  <div class="disclaimer">⚕️ <strong>Avvertenza medica.</strong> Questo materiale è educativo e non sostituisce il parere di un medico o nutrizionista. Con un BMI in classe di obesità è consigliato un consulto medico prima di iniziare una dieta o un programma di esercizio. Interrompi e rivolgiti a un professionista in caso di malessere.</div>

  <h2>Pilastri quotidiani (daily essentials)</h2>
  <p>Ogni giorno, alla base della dieta anti-grasso viscerale (protocollo "green Mediterranean" / DIRECT-PLUS):</p>
  ${essentialsSection()}

  <div class="pb"></div>
  <h2>Piano settimanale — Estate ☀️</h2>
  <p>Due settimane (A e B) che si alternano. 🏃 = giornata con tapis roulant (più carboidrati, kcal più alte).</p>
  ${planTable('estate')}

  <h2>Piano settimanale — Inverno ❄️</h2>
  <p>Due settimane (A e B) che si alternano. 🏃 = giornata con tapis roulant.</p>
  ${planTable('inverno')}

  <div class="pb"></div>
  <h1 style="color:var(--terra)">Ricettario (${recipes.length} ricette)</h1>
  <p>Tutte dosate per <strong>1 persona</strong>, realizzabili con padella, pentola, microonde o friggitrice ad aria. Niente forno.</p>
  ${recipesBySlot}

  <div class="pb"></div>
  <h1 style="color:var(--olive-d)">Allenamenti</h1>
  <p>Progressione a basso impatto, salva-articolazioni. Camminata in salita in Zona 2 + forza a corpo libero/elastico.</p>
  ${workoutsSection()}

  <div class="pb"></div>
  <h1 style="color:var(--olive-d)">Guide pratiche e scienza</h1>
  ${guides}
</div>
</body></html>`;
}
