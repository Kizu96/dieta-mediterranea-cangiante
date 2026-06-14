import type { Category, Ingredient, MealSlot, Recipe, Season } from '../data/types';
import { ingredients } from '../data/ingredients';
import { recipes } from '../data/recipes';
import { addDays, getRecipesForDate, type OverrideMap } from './planning';
import { scaleQty } from './intensity';

// Quantità reali in dispensa (solo ingredienti tracciati): ingredientId -> qty.
export type QtyMap = Map<string, number>;

const round1 = (n: number) => Math.round(n * 10) / 10;

// Tolleranza sul fabbisogno: coperto se manca meno del 10% O meno di 15 g/ml
// (per i pezzi: meno di 1). Evita assurdità tipo "compra 8 g di rucola" quando
// ne hai 70 e le porzioni ×1,3 ne chiedono 78: una porzione il 10% più piccola
// non cambia nulla, un viaggio al supermercato sì.
const QTY_TOLERANCE = 0.1;
const coveredBy = (have: number, need: number, unit: string): boolean => {
  const graceAbs = unit === 'pz' ? 0.99 : 15;
  return need - have <= Math.max(need * QTY_TOLERANCE, graceAbs);
};

const ingredientMap = new Map<string, Ingredient>(ingredients.map((i) => [i.id, i]));

export function ingredientById(id: string): Ingredient | undefined {
  return ingredientMap.get(id);
}

export interface NeededIngredient {
  ingredient: Ingredient;
  qty: number;
  unit: string;
}

/** Aggrega gli ingredienti necessari per un intervallo di giorni a partire da `start`. */
export function ingredientsForRange(
  start: Date,
  days: number,
  season: Season,
  includeExtra = true,
  overrides?: OverrideMap,
): NeededIngredient[] {
  const acc = new Map<string, NeededIngredient>();
  for (let i = 0; i < days; i++) {
    const meals = getRecipesForDate(addDays(start, i), season, includeExtra, overrides);
    for (const { recipe } of meals) {
      for (const ri of recipe.ingredients) {
        // Gli ingredienti facoltativi (es. zenzero "opzionale") non vanno in lista spesa.
        if (ri.note && /opzional/i.test(ri.note)) continue;
        const ing = ingredientMap.get(ri.ingredientId);
        if (!ing) continue;
        const key = `${ri.ingredientId}|${ri.unit}`;
        const prev = acc.get(key);
        if (prev) prev.qty += ri.qty;
        else acc.set(key, { ingredient: ing, qty: ri.qty, unit: ri.unit });
      }
    }
  }
  return [...acc.values()];
}

export interface ShoppingItem extends NeededIngredient {
  // `qty` qui è il fabbisogno GIÀ scalato per l'intensità (porzioni reali).
  qtyHave?: number; // quantità in dispensa, se l'ingrediente è tracciato
  qtyToBuy: number; // quanto comprare davvero (fabbisogno − dispensa)
}

export interface ShoppingGroup {
  category: Category;
  items: ShoppingItem[];
}

const CATEGORY_ORDER: Category[] = [
  'verdura',
  'frutta',
  'proteine',
  'pesce',
  'legumi',
  'cereali',
  'latticini',
  'fruttaSecca',
  'fermentati',
  'condimenti',
  'bevande',
  'surgelati',
  'dispensa',
];

/**
 * Lista spesa raggruppata per reparto.
 * - Ingredienti tracciati a quantità (`qtyMap`): compaiono solo se la dispensa
 *   non copre il fabbisogno del periodo, con `qtyToBuy` = differenza. Così
 *   "quasi finito" torna in lista senza aspettare lo zero esatto.
 * - Tutti gli altri: logica binaria di sempre (escluso se `haveSet` lo contiene).
 * `factor` = intensità: le quantità mostrate sono le porzioni reali.
 */
export function buildShoppingList(
  haveSet: Set<string>,
  start: Date,
  days: number,
  season: Season,
  includeExtra = true,
  overrides?: OverrideMap,
  qtyMap?: QtyMap,
  factor = 1,
): ShoppingGroup[] {
  const items: ShoppingItem[] = [];
  for (const n of ingredientsForRange(start, days, season, includeExtra, overrides)) {
    const id = n.ingredient.id;
    const neededReal = round1(scaleQty(n.qty, factor));
    const qtyHave = n.unit === n.ingredient.unit ? qtyMap?.get(id) : undefined;
    if (qtyHave != null) {
      const qtyToBuy = round1(neededReal - qtyHave);
      if (coveredBy(qtyHave, neededReal, n.unit)) continue;
      items.push({ ...n, qty: neededReal, qtyHave, qtyToBuy });
    } else {
      if (haveSet.has(id)) continue;
      items.push({ ...n, qty: neededReal, qtyToBuy: neededReal });
    }
  }
  const byCat = new Map<Category, ShoppingItem[]>();
  for (const n of items) {
    const arr = byCat.get(n.ingredient.category) ?? [];
    arr.push(n);
    byCat.set(n.ingredient.category, arr);
  }
  return CATEGORY_ORDER.filter((c) => byCat.has(c)).map((category) => ({
    category,
    items: (byCat.get(category) ?? []).sort((a, b) =>
      a.ingredient.name.localeCompare(b.ingredient.name),
    ),
  }));
}

/** Ricette realizzabili ORA con ciò che c'è in dispensa (gli staple si considerano disponibili). */
export function makeableRecipes(haveSet: Set<string>, season?: Season): Recipe[] {
  return recipes.filter((r) => {
    if (season && !r.seasons.includes(season)) return false;
    return r.ingredients.every((ri) => {
      const ing = ingredientMap.get(ri.ingredientId);
      if (!ing) return false;
      return ing.staple === true || haveSet.has(ri.ingredientId);
    });
  });
}

/**
 * Ingredienti mancanti per i pasti di un intervallo di `days` giorni a partire da
 * `start`. Con `slot` si limita a un singolo pasto (es. solo i pranzi → "spesa per
 * il prep day"). Il fabbisogno è aggregato su tutto l'intervallo e confrontato una
 * volta con la dispensa.
 */
export function missingForRange(
  haveSet: Set<string>,
  start: Date,
  days: number,
  season: Season,
  includeExtra = true,
  overrides?: OverrideMap,
  qtyMap?: QtyMap,
  factor = 1,
  slot?: MealSlot,
): Ingredient[] {
  // Fabbisogno aggregato del periodo (serve per confrontare con le quantità reali).
  const needed = new Map<string, { ing: Ingredient; qty: number; sameUnit: boolean }>();
  for (let i = 0; i < days; i++) {
    const meals = getRecipesForDate(addDays(start, i), season, includeExtra, overrides);
    for (const m of meals) {
      if (slot && m.slot !== slot) continue;
      for (const ri of m.recipe.ingredients) {
        const ing = ingredientMap.get(ri.ingredientId);
        if (!ing) continue;
        // Gli ingredienti opzionali non sono obbligatori da comprare.
        if (ri.note && /opzional/i.test(ri.note)) continue;
        const prev = needed.get(ing.id);
        const sameUnit = ri.unit === ing.unit;
        if (prev) {
          prev.qty += sameUnit ? ri.qty : 0;
          prev.sameUnit = prev.sameUnit && sameUnit;
        } else {
          needed.set(ing.id, { ing, qty: sameUnit ? ri.qty : 0, sameUnit });
        }
      }
    }
  }
  const missing: Ingredient[] = [];
  for (const { ing, qty, sameUnit } of needed.values()) {
    const qtyHave = sameUnit ? qtyMap?.get(ing.id) : undefined;
    if (qtyHave != null) {
      // Tracciato a quantità: manca se la dispensa non copre il fabbisogno
      // reale (stessa tolleranza della lista spesa: 10% o 15 g/ml).
      if (!coveredBy(qtyHave, scaleQty(qty, factor), ing.unit)) missing.push(ing);
    } else if (!haveSet.has(ing.id)) {
      // Binario: manca tutto ciò che non è segnato come presente in dispensa,
      // staple inclusi: l'app non può sapere se li hai davvero in casa.
      missing.push(ing);
    }
  }
  return missing;
}

/** Ingredienti mancanti per i pasti di una certa data (guida le notifiche "compra per domani"). */
export function missingForDate(
  haveSet: Set<string>,
  date: Date,
  season: Season,
  includeExtra = true,
  overrides?: OverrideMap,
  qtyMap?: QtyMap,
  factor = 1,
): Ingredient[] {
  return missingForRange(haveSet, date, 1, season, includeExtra, overrides, qtyMap, factor);
}

/**
 * Ingredienti "abbondanti": in dispensa ce n'è più di quanto il piano dei
 * prossimi `days` giorni consumerà (o non sono proprio nel piano). Usato per
 * proporre per primi, nello scambio pasto, le ricette che li smaltiscono.
 */
export function surplusIngredients(
  qtyMap: QtyMap,
  start: Date,
  days: number,
  season: Season,
  includeExtra = true,
  overrides?: OverrideMap,
  factor = 1,
): Set<string> {
  const needed = new Map<string, number>();
  for (const n of ingredientsForRange(start, days, season, includeExtra, overrides)) {
    if (n.unit !== n.ingredient.unit) continue;
    const id = n.ingredient.id;
    needed.set(id, (needed.get(id) ?? 0) + scaleQty(n.qty, factor));
  }
  const surplus = new Set<string>();
  for (const [id, qty] of qtyMap) {
    if (qty > 0 && qty > (needed.get(id) ?? 0)) surplus.add(id);
  }
  return surplus;
}
