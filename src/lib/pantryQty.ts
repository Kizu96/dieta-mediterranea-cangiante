// ===========================================================================
// Dispensa quantitativa: traccia i grammi/ml/pezzi reali degli ingredienti
// "consumabili" e li scala automaticamente quando un pasto viene segnato
// mangiato/metà (con storno esatto se si cambia idea).
//
// NON si traccia a quantità ciò che è rumore: staple (olio, spezie, aceto…)
// e le categorie condimenti/bevande/dispensa restano binari ✓/✗ come prima.
// ===========================================================================
import type { Ingredient, MealSlot, Recipe } from '../data/types';
import { ingredients } from '../data/ingredients';
import { db, type MealStatusValue } from '../db/db';
import { scaleQty } from './intensity';

const ingredientMap = new Map<string, Ingredient>(ingredients.map((i) => [i.id, i]));

const UNTRACKED_CATEGORIES = new Set(['condimenti', 'bevande', 'dispensa']);
const TRACKED_UNITS = new Set(['g', 'ml', 'pz']);

/** L'ingrediente si gestisce a quantità reale (true) o solo come ✓/✗ (false)? */
export function isQtyTracked(ing: Ingredient): boolean {
  return !ing.staple && !UNTRACKED_CATEGORIES.has(ing.category) && TRACKED_UNITS.has(ing.unit);
}

// Formati "pacco" tipici per unità: in lista spesa si sceglie tra questi
// (più un campo libero), niente slider da centrare col dito.
export const PACK_PRESETS: Record<string, number[]> = {
  g: [100, 250, 500, 1000],
  ml: [250, 500, 1000],
  pz: [1, 2, 4, 6],
};

const STATUS_FRACTION: Record<MealStatusValue, number> = { eaten: 1, half: 0.5, skipped: 0 };

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Segna lo stato di un pasto e aggiorna la dispensa di conseguenza, in un'unica
 * transazione:
 * 1. storna SEMPRE il consumo registrato in precedenza (snapshot `consumed`);
 * 2. ri-tocco dello stato già attivo → il pasto torna "non segnato";
 * 3. applica il nuovo consumo: mangiato = dose intera × intensità, metà = 50%,
 *    saltato = 0. Scala solo gli ingredienti tracciati che hanno già una
 *    quantità in dispensa (mai sotto zero; lo snapshot ricorda quanto è stato
 *    tolto davvero, così lo storno è esatto).
 */
export async function setMealStatusWithPantry(
  date: string,
  slot: MealSlot,
  recipe: Recipe,
  status: MealStatusValue,
  factor: number,
): Promise<void> {
  await db.transaction('rw', db.mealStatus, db.pantry, async () => {
    const key: [string, string] = [date, slot];
    const existing = await db.mealStatus.get(key);

    if (existing?.consumed?.length) {
      for (const c of existing.consumed) {
        const row = await db.pantry.get(c.ingredientId);
        if (row?.qty == null) continue; // quantità rimossa a mano nel frattempo
        const qty = round2(row.qty + c.qty);
        await db.pantry.put({ ...row, qty, have: qty > 0, updatedAt: Date.now() });
      }
    }

    if (existing?.status === status) {
      await db.mealStatus.delete(key);
      return;
    }

    const frac = STATUS_FRACTION[status];
    const consumed: { ingredientId: string; qty: number }[] = [];
    if (frac > 0) {
      for (const ri of recipe.ingredients) {
        const ing = ingredientMap.get(ri.ingredientId);
        if (!ing || !isQtyTracked(ing) || ri.unit !== ing.unit) continue;
        const row = await db.pantry.get(ri.ingredientId);
        if (row?.qty == null) continue; // dispensa non quantitativa per questo ingrediente
        const take = Math.min(row.qty, scaleQty(ri.qty * frac, factor));
        if (take <= 0) continue;
        const qty = round2(row.qty - take);
        await db.pantry.put({ ...row, qty, have: qty > 0, updatedAt: Date.now() });
        consumed.push({ ingredientId: ri.ingredientId, qty: take });
      }
    }
    await db.mealStatus.put({
      date,
      slot,
      status,
      recipeId: recipe.id,
      consumed,
      updatedAt: Date.now(),
    });
  });
}

/** Imposta/corregge la quantità in dispensa; null = torna alla gestione ✓/✗. */
export async function setPantryQty(ingredientId: string, qty: number | null): Promise<void> {
  const row = await db.pantry.get(ingredientId);
  if (qty == null) {
    await db.pantry.put({ ingredientId, have: row?.have ?? false, updatedAt: Date.now() });
  } else {
    const q = Math.max(0, round2(qty));
    await db.pantry.put({ ingredientId, have: q > 0, qty: q, updatedAt: Date.now() });
  }
}

/** Somma un acquisto alla dispensa (per gli ingredienti tracciati a quantità). */
export async function addPurchaseToPantry(ingredientId: string, qty?: number): Promise<void> {
  const ing = ingredientMap.get(ingredientId);
  const row = await db.pantry.get(ingredientId);
  if (qty != null && qty > 0 && ing && isQtyTracked(ing)) {
    await db.pantry.put({
      ingredientId,
      have: true,
      qty: round2((row?.qty ?? 0) + qty),
      updatedAt: Date.now(),
    });
  } else {
    await db.pantry.put({ ingredientId, have: true, ...(row?.qty != null ? { qty: row.qty } : {}), updatedAt: Date.now() });
  }
}
