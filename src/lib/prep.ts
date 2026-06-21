// ===========================================================================
// Prep day (domenica): menù dedicato ROTANTE + selezione di ciò che hai davvero
// preparato.
//
// - Selezioni per-pasto i pranzi preparati (prepLog, slot='pranzo', con recipeId
//   e updatedAt). Spuntando si scrive un mealOverride così lo mangi in Oggi/Piano.
// - Annullabile finché è ancora "oggi" (finestra di 1 notte).
// - Il GIORNO DOPO, all'apertura dell'app, i preparati non ancora confermati:
//     1) scalano la dispensa (snapshot `consumed` per lo storno, anti doppio-scalo);
//     2) RUOTANO: quel posto avanza al prossimo piatto del pool (varietà).
//   I non preparati restano identici.
// - Lo stato dei 5 posti vive in `prepSlots` (sincronizzato). Il piano base non
//   viene mai toccato (vedi plan-is-sacred): tutto passa da override/prepLog.
// ===========================================================================
import type { Recipe, Season } from '../data/types';
import { db, getSetting, setSetting, type PrepLog, type PrepSlot } from '../db/db';
import { recipes } from '../data/recipes';
import { PREP_MENU, PREP_POOL } from '../data/prepMenu';
import { addDays, getRecipesForDate, toISODate } from './planning';
import { applyConsumption } from './pantryQty';

const recipeMap = new Map<string, Recipe>(recipes.map((r) => [r.id, r]));

export function prepRecipeById(id: string): Recipe | undefined {
  return recipeMap.get(id);
}

// Lunedì=0 … Domenica=6 (per indicizzare i 5 posti feriali del prep).
function weekdayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}
function fromISO(iso: string): Date {
  return new Date(`${iso}T12:00:00`); // mezzogiorno: niente sorprese di fuso/DST
}

// ===========================================================================
// Conservazione / verdetto per giorno (badge FRIGO / FREEZER / FRESCO)
// ===========================================================================
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

// ===========================================================================
// Pool / rotazione
// ===========================================================================
const POOL_LEN = PREP_POOL.length;

/** Prossimo indice del pool dopo `current`, saltando quelli già in uso, con wrap. */
export function nextPoolIndex(current: number, used: Set<number>, poolLen = POOL_LEN): number {
  for (let step = 1; step <= poolLen; step++) {
    const idx = (current + step) % poolLen;
    if (!used.has(idx)) return idx;
  }
  return current; // pool troppo piccolo per ruotare: resta dov'è
}

/** Semina i 5 posti mancanti dal seed iniziale (idempotente: non sovrascrive). */
export async function ensurePrepSeeded(): Promise<void> {
  const rows = await db.prepSlots.toArray();
  const have = new Set(rows.map((r) => r.idx));
  const now = Date.now();
  const missing: PrepSlot[] = [];
  for (let idx = 0; idx < 5; idx++) {
    if (!have.has(idx)) missing.push({ idx, recipeId: PREP_MENU[idx], updatedAt: now });
  }
  if (missing.length) await db.prepSlots.bulkPut(missing);
}

// ===========================================================================
// Selezione "preparato" + finestra di annullamento
// ===========================================================================

/** La spunta del giorno è ancora modificabile? (non confermata e marcata oggi). */
export function isPrepEditable(row: PrepLog | undefined, todayISO: string): boolean {
  if (!row?.done) return true; // non marcato → si può marcare
  if (row.confirmed) return false; // confermato il giorno dopo → finestra chiusa
  if (!row.updatedAt) return true;
  return toISODate(new Date(row.updatedAt)) === todayISO; // annullabile solo se marcato oggi
}

/**
 * Segna/dissegna come "preparato" il pranzo del giorno `date` (posto `dayIdx`).
 * ON: scrive prepLog (con il piatto attuale di quel posto) + l'override del giorno
 * così lo mangi in Oggi/Piano. OFF: rimuove entrambi (solo se non già confermato).
 */
export async function setPrepMeal(
  date: Date,
  dayIdx: number,
  on: boolean,
  season: Season,
  includeExtra: boolean,
): Promise<void> {
  const iso = toISODate(date);
  await db.transaction('rw', db.prepLog, db.mealOverride, db.prepSlots, async () => {
    await ensurePrepSeeded();
    const slot = await db.prepSlots.get(dayIdx);
    const recipeId = slot?.recipeId ?? PREP_MENU[dayIdx];
    if (!recipeId) return;
    if (on) {
      await db.prepLog.put({ date: iso, slot: 'pranzo', done: true, recipeId, updatedAt: Date.now() });
      const base = getRecipesForDate(date, season, includeExtra).find((m) => m.slot === 'pranzo');
      const baseId = base?.recipe.id ?? recipeId;
      if (recipeId !== baseId) {
        await db.mealOverride.put({ date: iso, slot: 'pranzo', recipeId, updatedAt: Date.now() });
      }
    } else {
      const cur = await db.prepLog.get([iso, 'pranzo']);
      if (cur?.confirmed) return; // finestra chiusa: non si annulla un prep confermato
      await db.prepLog.delete([iso, 'pranzo']);
      const ov = await db.mealOverride.get([iso, 'pranzo']);
      if (ov?.recipeId === (cur?.recipeId ?? recipeId)) await db.mealOverride.delete([iso, 'pranzo']);
    }
  });
}

/** «Segna tutti»: marca preparati i giorni Lun-Ven non ancora marcati. */
export async function setAllPrepMeals(
  monday: Date,
  season: Season,
  includeExtra: boolean,
): Promise<void> {
  for (let i = 0; i < 5; i++) {
    const d = addDays(monday, i);
    const cur = await db.prepLog.get([toISODate(d), 'pranzo']);
    if (!cur?.done) await setPrepMeal(d, i, true, season, includeExtra);
  }
}

// ===========================================================================
// Conferma del giorno dopo: scala dispensa + ruota i posti preparati
// ===========================================================================

/**
 * Processa i prep marcati nei giorni precedenti e non ancora confermati:
 * scala la dispensa (snapshot per storno) e fa avanzare il loro posto nel pool.
 * Idempotente: tocca solo le righe non confermate, una volta sola.
 */
export async function processDuePrep(todayISO: string, factor: number): Promise<void> {
  const due = (await db.prepLog.toArray()).filter(
    (r) =>
      r.slot === 'pranzo' &&
      r.done &&
      !r.confirmed &&
      r.updatedAt != null &&
      toISODate(new Date(r.updatedAt)) < todayISO,
  );
  if (!due.length) return;
  await db.transaction('rw', db.prepLog, db.pantry, db.prepSlots, async () => {
    await ensurePrepSeeded();
    for (const row of due) {
      const recipe = row.recipeId ? recipeMap.get(row.recipeId) : undefined;
      // 1) scala la dispensa (se non già fatto)
      const consumed = row.consumed ?? (recipe ? await applyConsumption(recipe, factor, 1) : []);
      // 2) ruota il posto di quel giorno al prossimo piatto del pool
      const dayIdx = weekdayIndex(fromISO(row.date));
      const slots = await db.prepSlots.toArray();
      const mine = slots.find((s) => s.idx === dayIdx);
      if (mine) {
        const curIdx = PREP_POOL.indexOf(mine.recipeId);
        if (curIdx >= 0) {
          const used = new Set(
            slots
              .filter((s) => s.idx !== dayIdx)
              .map((s) => PREP_POOL.indexOf(s.recipeId))
              .filter((n) => n >= 0),
          );
          const nIdx = nextPoolIndex(curIdx, used);
          await db.prepSlots.put({ idx: dayIdx, recipeId: PREP_POOL[nIdx], updatedAt: Date.now() });
        }
      }
      // 3) marca confermato (preserva updatedAt della marcatura)
      await db.prepLog.put({ ...row, consumed, confirmed: true });
    }
  });
}

// ===========================================================================
// Migrazione una-tantum dal vecchio toggle unico al modello rotante
// ===========================================================================
const LEGACY_SENTINEL_SLOT = 'settimana';
const RETIRED_PREP_IDS = ['pranzo-zuppa-lenticchie', 'pranzo-zuppa-lenticchie-farro'];
const PREP_DISH_IDS = new Set<string>([...PREP_POOL, ...RETIRED_PREP_IDS]);
const MIGRATION_KEY = 'prepRotationMigrationDone';

/**
 * Pulisce lo stato del vecchio prep (spunta unica «settimana») e gli override-prep
 * rimasti per i giorni futuri delle settimane che avevano la spunta — così si parte
 * pulito col modello rotante (rimuove anche eventuali zuppe fantasma). Una sola volta.
 */
export async function migratePrepLegacy(todayISO: string): Promise<void> {
  if (await getSetting<boolean>(MIGRATION_KEY, false)) return;
  const sentinels = (await db.prepLog.toArray()).filter((r) => r.slot === LEGACY_SENTINEL_SLOT);
  await db.transaction('rw', db.prepLog, db.mealOverride, async () => {
    for (const s of sentinels) {
      const monday = fromISO(s.date);
      for (let i = 0; i < 5; i++) {
        const iso = toISODate(addDays(monday, i));
        if (iso < todayISO) continue; // non toccare il passato
        const ov = await db.mealOverride.get([iso, 'pranzo']);
        if (ov && PREP_DISH_IDS.has(ov.recipeId)) await db.mealOverride.delete([iso, 'pranzo']);
      }
      await db.prepLog.delete([s.date, s.slot]);
    }
  });
  await setSetting(MIGRATION_KEY, true);
}
