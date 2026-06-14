// ===========================================================================
// Scelta della ricetta di rimpiazzo (scambio pasto automatico e manuale).
//
// Principio guida richiesto dall'utente: «usa prima ciò che va a male». Il
// punteggio premia, in ordine:
//   1. i deperibili vicini/oltre i giorni di frigo dichiarati (perishUrgency);
//   2. verdura, carne/pollo (proteine), pesce e latticini che hai in ABBONDANZA;
//   3. gli altri ingredienti abbondanti;
// e penalizza gli ingredienti mancanti (preferisce le ricette fattibili ora).
// Le preferite fanno solo da spareggio. Logica pura: niente accesso al DB qui.
// ===========================================================================
import type { Ingredient, MealSlot, Recipe, Season } from '../data/types';
import { ingredients } from '../data/ingredients';
import type { PantryItem } from '../db/db';
import { addDays, getRecipesForDate, recipesForSlot, toISODate, type OverrideMap } from './planning';
import type { QtyMap } from './shopping';
import { daysInFridge, perishableFridgeDays } from './freshness';

const ingredientMap = new Map<string, Ingredient>(ingredients.map((i) => [i.id, i]));

// Categorie «da smaltire»: verdura, carne/pollo (proteine), pesce, latticini.
const PRIORITY_CATEGORIES = new Set(['verdura', 'proteine', 'pesce', 'latticini']);

/**
 * Urgenza di consumo dei deperibili in dispensa: ingredientId → rapporto
 * giorniInFrigo / giorniTenuta. ≥ 1 = a scadenza o oltre. Solo le voci con
 * `freshSince` e una tenuta frigo dichiarata nello storage.
 */
export function perishUrgency(rows: PantryItem[], now = Date.now()): Map<string, number> {
  const out = new Map<string, number>();
  for (const row of rows) {
    if (!row.have || row.freshSince == null) continue;
    const ing = ingredientMap.get(row.ingredientId);
    if (!ing) continue;
    const maxDays = perishableFridgeDays(ing);
    if (maxDays == null || maxDays <= 0) continue;
    // +1: il giorno 0 conta già un po' (è entrato in frigo, va consumato).
    out.set(row.ingredientId, (daysInFridge(row.freshSince, now) + 1) / maxDays);
  }
  return out;
}

export interface SwapContext {
  surplus: Set<string>; // ingredienti abbondanti (più di quanto serve al piano)
  perish: Map<string, number>; // urgenza deperibili (perishUrgency)
  haveSet: Set<string>;
  qtyMap?: QtyMap;
  favorites?: Set<string>;
}

function hasInPantry(id: string, ctx: SwapContext): boolean {
  if (ingredientMap.get(id)?.staple) return true;
  if (ctx.haveSet.has(id)) return true;
  return (ctx.qtyMap?.get(id) ?? 0) > 0;
}

/** Punteggio «usa prima ciò che va a male + ciò che hai in abbondanza». */
export function scoreRecipe(recipe: Recipe, ctx: SwapContext): number {
  let perish = 0;
  let prioritySurplus = 0;
  let surplus = 0;
  let missing = 0;
  for (const ri of recipe.ingredients) {
    const id = ri.ingredientId;
    const u = ctx.perish.get(id);
    if (u != null) perish += u >= 1 ? u + 1 : u; // a scadenza/oltre: bonus extra
    if (ctx.surplus.has(id)) {
      surplus += 1;
      if (PRIORITY_CATEGORIES.has(ingredientMap.get(id)?.category ?? '')) prioritySurplus += 1;
    }
    if (!hasInPantry(id, ctx)) missing += 1;
  }
  return (
    perish * 3 + prioritySurplus * 2 + surplus - missing + (ctx.favorites?.has(recipe.id) ? 0.5 : 0)
  );
}

/** Ricette candidate per uno slot/stagione, ordinate dal punteggio migliore. */
export function rankReplacements(
  slot: MealSlot,
  season: Season,
  includeExtra: boolean,
  ctx: SwapContext,
  opts?: { avoidIngredientId?: string; excludeRecipeIds?: Set<string> },
): Recipe[] {
  return recipesForSlot(slot, season, includeExtra)
    .filter((r) => {
      if (opts?.excludeRecipeIds?.has(r.id)) return false;
      if (
        opts?.avoidIngredientId &&
        r.ingredients.some((ri) => ri.ingredientId === opts.avoidIngredientId)
      ) {
        return false;
      }
      return true;
    })
    .map((r) => ({ r, s: scoreRecipe(r, ctx) }))
    .sort((a, b) => b.s - a.s || a.r.name.localeCompare(b.r.name))
    .map((x) => x.r);
}

export interface AffectedMeal {
  dateISO: string;
  slot: MealSlot;
  recipe: Recipe;
}

/** Pasti nella finestra [start, start+days) il cui pasto attuale usa `ingredientId`. */
export function mealsUsingIngredient(
  start: Date,
  days: number,
  season: Season,
  includeExtra: boolean,
  overrides: OverrideMap | undefined,
  ingredientId: string,
  slot?: MealSlot,
): AffectedMeal[] {
  const out: AffectedMeal[] = [];
  for (let i = 0; i < days; i++) {
    const d = addDays(start, i);
    for (const m of getRecipesForDate(d, season, includeExtra, overrides)) {
      if (slot && m.slot !== slot) continue;
      if (m.recipe.ingredients.some((ri) => ri.ingredientId === ingredientId)) {
        out.push({ dateISO: toISODate(d), slot: m.slot, recipe: m.recipe });
      }
    }
  }
  return out;
}

/** La ricetta usa almeno un ingrediente in surplus? (pill «usa la dispensa») */
export function usesSurplus(recipe: Recipe, surplus: Set<string>): boolean {
  return recipe.ingredients.some((ri) => surplus.has(ri.ingredientId));
}

/** La ricetta smaltisce almeno un deperibile a scadenza? (pill «in scadenza») */
export function usesExpiring(recipe: Recipe, perish: Map<string, number>): boolean {
  return recipe.ingredients.some((ri) => (perish.get(ri.ingredientId) ?? 0) >= 1);
}
