// ===========================================================================
// Avvisi "cucinalo o congelalo": per gli ingredienti DEPERIBILI (lo storage
// dichiara i giorni di frigo, es. "Frigo 1-2 gg") si registra quando sono
// stati messi in frigo (acquisto o spunta manuale → PantryItem.freshSince).
// Quando i giorni dichiarati sono passati, Oggi mostra l'avviso; "Gestito"
// (cucinato/congelato/buttato) azzera il timer senza toccare il resto.
// ===========================================================================
import type { Ingredient } from '../data/types';
import { ingredients } from '../data/ingredients';
import { db, type PantryItem } from '../db/db';

const ingredientMap = new Map<string, Ingredient>(ingredients.map((i) => [i.id, i]));

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Giorni di tenuta in frigo dichiarati nello storage dell'ingrediente
 * (es. "Frigo 1-2 gg" → 2). null = non deperibile / nessun numero dichiarato
 * (uova "Frigo", scatolette "Dispensa"…) → niente avvisi.
 */
export function perishableFridgeDays(ing: Ingredient): number | null {
  const m = ing.storage.match(/frigo[^0-9]*?(\d+)(?:\s*-\s*(\d+))?\s*g/i);
  return m ? parseInt(m[2] ?? m[1], 10) : null;
}

/** Da quanti giorni (interi) l'ingrediente è in frigo. */
export function daysInFridge(freshSince: number, now = Date.now()): number {
  return Math.floor((now - freshSince) / DAY_MS);
}

export interface FreshnessAlert {
  ingredient: Ingredient;
  daysIn: number; // giorni in frigo
  maxDays: number; // tenuta dichiarata
}

/** Ingredienti in dispensa che hanno raggiunto/superato i giorni di frigo. */
export function freshnessAlerts(rows: PantryItem[], now = Date.now()): FreshnessAlert[] {
  const out: FreshnessAlert[] = [];
  for (const row of rows) {
    if (!row.have || row.freshSince == null) continue;
    const ing = ingredientMap.get(row.ingredientId);
    if (!ing) continue;
    const maxDays = perishableFridgeDays(ing);
    if (maxDays == null) continue;
    const daysIn = daysInFridge(row.freshSince, now);
    if (daysIn >= maxDays) out.push({ ingredient: ing, daysIn, maxDays });
  }
  return out.sort((a, b) => b.daysIn - b.maxDays - (a.daysIn - a.maxDays));
}

/** Avviso gestito (cucinato/congelato/buttato): azzera il timer di freschezza. */
export async function dismissFreshness(ingredientId: string): Promise<void> {
  const row = await db.pantry.get(ingredientId);
  if (!row) return;
  const next = { ...row, updatedAt: Date.now() };
  delete next.freshSince;
  await db.pantry.put(next);
}

/** freshSince da impostare quando un ingrediente entra in dispensa (se deperibile). */
export function freshSinceFor(ingredientId: string, now = Date.now()): number | undefined {
  const ing = ingredientMap.get(ingredientId);
  return ing && perishableFridgeDays(ing) != null ? now : undefined;
}
