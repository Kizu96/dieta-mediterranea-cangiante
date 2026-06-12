// ===========================================================================
// Aderenza al piano: statistiche dagli stati pasto (mangiato/metà/saltato)
// degli ultimi N giorni. La dieta che funziona è quella che si segue: le
// ricette saltate più spesso vanno scambiate, non subite.
// ===========================================================================
import { recipes } from '../data/recipes';
import type { MealStatus } from '../db/db';
import { toISODate } from './planning';

export interface AdherenceStats {
  eaten: number;
  half: number;
  skipped: number;
  /** Pasti sostituiti con altro fuori dal piano (kcal stimate). */
  offPlan: number;
  /** % di aderenza sui pasti segnati: (mangiati + metà/2) / totale segnati. */
  pct: number;
  /** Giorni consecutivi (fino a oggi/ieri) con almeno un pasto mangiato e nessun saltato. */
  streak: number;
  /** Ricette saltate più spesso (max 3), candidate allo scambio. */
  mostSkipped: { name: string; times: number }[];
}

const recipeName = (id: string | undefined): string =>
  (id && recipes.find((r) => r.id === id)?.name) || 'Ricetta rimossa';

export function adherenceStats(rows: MealStatus[], todayISO: string): AdherenceStats {
  let eaten = 0;
  let half = 0;
  let skipped = 0;
  let offPlan = 0;
  const byDay = new Map<string, MealStatus[]>();
  const skipCount = new Map<string, number>();

  for (const s of rows) {
    if (s.status === 'eaten') eaten++;
    else if (s.status === 'half') half++;
    else if (s.status === 'offplan') offPlan++;
    else {
      skipped++;
      if (s.recipeId) skipCount.set(s.recipeId, (skipCount.get(s.recipeId) ?? 0) + 1);
    }
    const arr = byDay.get(s.date) ?? [];
    arr.push(s);
    byDay.set(s.date, arr);
  }

  // Il fuori piano conta nel denominatore (non stavi seguendo il piano) ma non
  // è un digiuno: resta distinto dai saltati.
  const marked = eaten + half + skipped + offPlan;
  const pct = marked > 0 ? Math.round(((eaten + half * 0.5) / marked) * 100) : 0;

  // Streak: si parte da oggi (o da ieri, se oggi non hai ancora segnato nulla)
  // e si scende finché ogni giorno ha ≥1 pasto mangiato e zero saltati.
  let streak = 0;
  const d = new Date(todayISO + 'T00:00:00');
  if (!byDay.has(todayISO)) d.setDate(d.getDate() - 1);
  for (;;) {
    const iso = toISODate(d);
    const day = byDay.get(iso);
    if (!day || !day.some((s) => s.status === 'eaten') || day.some((s) => s.status === 'skipped'))
      break;
    streak++;
    d.setDate(d.getDate() - 1);
  }

  const mostSkipped = [...skipCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .filter(([, n]) => n >= 2) // 1 salto capita a chiunque: segnala dal 2° in poi
    .map(([id, times]) => ({ name: recipeName(id), times }));

  return { eaten, half, skipped, offPlan, pct, streak, mostSkipped };
}
