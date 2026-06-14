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
import { recipes } from '../data/recipes';
import { PREP_MENU } from '../data/prepMenu';
import { addDays, getRecipesForDate, toISODate } from './planning';

// Riga sentinella in prepLog che marca «prep day fatto» (date = lunedì della settimana).
export const PREP_WEEK_SLOT = 'settimana';

const recipeMap = new Map<string, Recipe>(recipes.map((r) => [r.id, r]));

/** Le 5 ricette del menù prep (Lun→Ven), risolte dagli id di prepMenu.ts. */
export function prepMenuRecipes(): Recipe[] {
  return PREP_MENU.map((id) => recipeMap.get(id)).filter((r): r is Recipe => r != null);
}

export function isFreezable(storage: string): boolean {
  return /congel|freezer/i.test(storage);
}

/** Giorni dichiarati di tenuta in frigo nella nota di conservazione (default 1). */
export function fridgeDays(storage: string): number {
  const m = storage.match(/frigo[^0-9]*?(\d)(?:\s*-\s*(\d))?\s*g/i);
  return m ? parseInt(m[2] ?? m[1], 10) : 1;
}

export type PrepKind = 'fridge' | 'freezer' | 'fresh';
export interface PrepVerdict {
  kind: PrepKind;
  emoji: string;
  label: string; // badge breve: FRIGO / FREEZER / FRESCO
  detail: string; // cosa fare domenica per quel giorno
}

/**
 * Verdetto prep-day per il pranzo del giorno `dayIdx` (Lun=1 … Ven=5, giorni
 * trascorsi dalla domenica di prep). Inizio settimana → dal frigo; più avanti i
 * congelabili vanno surgelati; le insalate non congelabili si montano la sera prima.
 */
export function prepVerdict(recipe: Recipe, dayIdx: number): PrepVerdict {
  const fridge = fridgeDays(recipe.storage);
  const freez = isFreezable(recipe.storage);
  // Inizio settimana, entro i giorni di frigo dichiarati: dal frigo, niente freezer.
  if (dayIdx <= Math.min(2, fridge)) {
    return {
      kind: 'fridge',
      emoji: '🧺',
      label: 'FRIGO',
      detail: 'Cucinalo domenica e tienilo in frigo: pronto da portare.',
    };
  }
  if (freez) {
    return {
      kind: 'freezer',
      emoji: '🧊',
      label: 'FREEZER',
      detail:
        'Cucinalo domenica e CONGELALO in monoporzione. Spostalo in frigo la sera prima; in ufficio scalda al microonde (850 W) 3-4 min, mescolando a metà.',
    };
  }
  if (dayIdx <= fridge) {
    return {
      kind: 'fridge',
      emoji: '🧺',
      label: 'FRIGO',
      detail: 'Cucinalo domenica e tienilo in frigo: pronto da portare.',
    };
  }
  return {
    kind: 'fresh',
    emoji: '🥗',
    label: 'FRESCO',
    detail:
      'Non si congela: domenica cuoci e congela la base (cereali/legumi), tieni le verdure crude a parte e monta il piatto la sera prima (5-10 min).',
  };
}

export interface PrepAssignment {
  date: string; // ISO del giorno feriale
  recipeId: string; // pranzo assegnato dal riordino
  baseRecipeId: string; // pranzo del piano base per quel giorno
}

/**
 * Assegna alla settimana che inizia da `monday` il MENÙ PREP dedicato (prepMenu.ts):
 * Lun→Ven = i 5 pranzi pensati per durare la settimana (Lun-Mar frigo, Mer-Ven
 * congelabili). `baseRecipeId` = pranzo del piano stagionale di quel giorno, così
 * il toggle off rimuove solo gli override che corrispondono ancora al menù prep.
 */
export function prepWeekArrangement(
  monday: Date,
  season: Season,
  includeExtra: boolean,
): PrepAssignment[] {
  const days = Array.from({ length: 5 }, (_, i) => addDays(monday, i));
  return days.map((d, i) => {
    const base = getRecipesForDate(d, season, includeExtra).find((m) => m.slot === 'pranzo');
    return {
      date: toISODate(d),
      recipeId: PREP_MENU[i],
      baseRecipeId: base?.recipe.id ?? PREP_MENU[i],
    };
  });
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
