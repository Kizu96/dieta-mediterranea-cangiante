import type { Category, Ingredient, Recipe, Season } from '../data/types';
import { ingredients } from '../data/ingredients';
import { recipes } from '../data/recipes';
import { addDays, getRecipesForDate } from './planning';

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
export function ingredientsForRange(start: Date, days: number, season: Season): NeededIngredient[] {
  const acc = new Map<string, NeededIngredient>();
  for (let i = 0; i < days; i++) {
    const meals = getRecipesForDate(addDays(start, i), season);
    for (const { recipe } of meals) {
      for (const ri of recipe.ingredients) {
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

export interface ShoppingGroup {
  category: Category;
  items: NeededIngredient[];
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

/** Lista spesa raggruppata per reparto, escludendo ciò che è già in dispensa (`haveSet`). */
export function buildShoppingList(
  haveSet: Set<string>,
  start: Date,
  days: number,
  season: Season,
): ShoppingGroup[] {
  const needed = ingredientsForRange(start, days, season).filter(
    (n) => !haveSet.has(n.ingredient.id),
  );
  const byCat = new Map<Category, NeededIngredient[]>();
  for (const n of needed) {
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

/** Ingredienti mancanti per i pasti di una certa data (guida le notifiche "compra per domani"). */
export function missingForDate(haveSet: Set<string>, date: Date, season: Season): Ingredient[] {
  const meals = getRecipesForDate(date, season);
  const missing = new Map<string, Ingredient>();
  for (const { recipe } of meals) {
    for (const ri of recipe.ingredients) {
      const ing = ingredientMap.get(ri.ingredientId);
      if (!ing) continue;
      // Gli ingredienti opzionali non sono obbligatori da comprare.
      if (ri.note && /opzional/i.test(ri.note)) continue;
      // Manca tutto ciò che non è segnato come presente in dispensa,
      // staple inclusi: l'app non può sapere se li hai davvero in casa.
      if (!haveSet.has(ri.ingredientId)) missing.set(ing.id, ing);
    }
  }
  return [...missing.values()];
}
