// ===========================================================================
// Prep day (domenica): riordino OPZIONALE dei pranzi della settimana.
//
// Il piano base resta intatto. Quando l'utente attiva il toggle «prep day
// fatto» per una settimana, i 5 pranzi feriali di QUELLA settimana vengono
// ridistribuiti tra i giorni (shelf-life più corta a inizio settimana,
// surgelabili Gio-Ven) scrivendo normali mealOverride — così piano, spesa,
// notifiche e sincronizzazione funzionano senza logica speciale. Toggle off →
// si rimuovono solo gli override che corrispondono ancora al riordino.
// ===========================================================================
import type { Recipe, Season } from '../data/types';
import { db } from '../db/db';
import { addDays, getRecipesForDate, toISODate } from './planning';

// Riga sentinella in prepLog che marca «prep day fatto» (date = lunedì della settimana).
export const PREP_WEEK_SLOT = 'settimana';

export function isFreezable(storage: string): boolean {
  return /congel|freezer/i.test(storage);
}

/** Giorni dichiarati di tenuta in frigo nella nota di conservazione (default 1). */
export function fridgeDays(storage: string): number {
  const m = storage.match(/frigo[^0-9]*?(\d)(?:\s*-\s*(\d))?\s*g/i);
  return m ? parseInt(m[2] ?? m[1], 10) : 1;
}

// Robustezza per il prep: i surgelabili possono stare ovunque (→ fine settimana),
// gli altri valgono quanto i loro giorni di frigo.
const robustness = (r: Recipe): number => (isFreezable(r.storage) ? 99 : fridgeDays(r.storage));

/**
 * Verdetto prep-day per un pranzo già assegnato al giorno `dayIdx`
 * (Lun=1 … Ven=5, giorni trascorsi dalla domenica di prep).
 */
export function prepAdvice(storage: string, dayIdx: number): string {
  if (dayIdx <= fridgeDays(storage)) return '🧺 preparalo domenica → frigo';
  if (isFreezable(storage)) return '🧊 congelalo domenica → frigo dalla sera prima';
  return '🍳 componenti pronti domenica → assembla la sera prima (5-10 min)';
}

export interface PrepAssignment {
  date: string; // ISO del giorno feriale
  recipeId: string; // pranzo assegnato dal riordino
  baseRecipeId: string; // pranzo del piano base per quel giorno
}

/**
 * Riassegna i 5 pranzi feriali del piano BASE (senza override) alla settimana
 * che inizia da `monday`: ordinamento stabile per robustezza crescente, così la
 * shelf-life più corta finisce Lun e i surgelabili Gio-Ven. Stessi 5 pranzi,
 * stesse calorie settimanali: cambia solo il giorno.
 */
export function prepWeekArrangement(
  monday: Date,
  season: Season,
  includeExtra: boolean,
): PrepAssignment[] {
  const days = Array.from({ length: 5 }, (_, i) => addDays(monday, i));
  const base: Recipe[] = [];
  for (const d of days) {
    const lunch = getRecipesForDate(d, season, includeExtra).find((m) => m.slot === 'pranzo');
    if (!lunch) return []; // settimana senza pranzi completi: niente riordino
    base.push(lunch.recipe);
  }
  const sorted = [...base].sort((a, b) => robustness(a) - robustness(b));
  return days.map((d, i) => ({
    date: toISODate(d),
    recipeId: sorted[i].id,
    baseRecipeId: base[i].id,
  }));
}

/**
 * Attiva/disattiva il «prep day fatto» per la settimana di `monday`.
 * ON: sentinella in prepLog + override dei pranzi dove il riordino differisce dal piano.
 * OFF: via la sentinella e SOLO gli override che corrispondono ancora al riordino
 * (gli scambi fatti a mano dall'utente non si toccano).
 */
export async function setPrepWeek(
  monday: Date,
  on: boolean,
  season: Season,
  includeExtra: boolean,
): Promise<void> {
  const mondayISO = toISODate(monday);
  const arrangement = prepWeekArrangement(monday, season, includeExtra);
  await db.transaction('rw', db.prepLog, db.mealOverride, async () => {
    if (on) {
      await db.prepLog.put({
        date: mondayISO,
        slot: PREP_WEEK_SLOT,
        done: true,
        updatedAt: Date.now(),
      });
      for (const a of arrangement) {
        if (a.recipeId !== a.baseRecipeId) {
          await db.mealOverride.put({
            date: a.date,
            slot: 'pranzo',
            recipeId: a.recipeId,
            updatedAt: Date.now(),
          });
        }
      }
    } else {
      await db.prepLog.delete([mondayISO, PREP_WEEK_SLOT]);
      for (const a of arrangement) {
        const cur = await db.mealOverride.get([a.date, 'pranzo']);
        if (cur?.recipeId === a.recipeId) await db.mealOverride.delete([a.date, 'pranzo']);
      }
    }
  });
}
