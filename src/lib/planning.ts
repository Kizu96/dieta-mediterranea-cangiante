import type { DayTemplate, MealSlot, Recipe, Season } from '../data/types';
import { recipes } from '../data/recipes';
import { seasonPlans } from '../data/mealPlan';
import { EXTRA_GARNISH_IDS } from './extraRecipes';

export function toISODate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

// Numero di giorno calcolato sui campi calendario (UTC) -> stabile a prescindere dal fuso orario.
const dayNumber = (d: Date): number =>
  Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);

// Indice del giorno della settimana: 0 = Lun … 6 = Dom (getDay() è 0 = Dom).
const weekdayIndex = (d: Date): number => (d.getDay() + 6) % 7;

const recipeMap = new Map<string, Recipe>(recipes.map((r) => [r.id, r]));

export function recipeById(id: string): Recipe | undefined {
  return recipeMap.get(id);
}

/**
 * Risolve un recipeId tenendo conto della modalità "ricette extra".
 * Con includeExtra = false:
 *  - le ricette `extra` sono sostituite dal loro `fallbackId` (ricetta base);
 *  - dalle altre ricette vengono rimossi gli ingredienti "extra" usati come
 *    guarnizione (germogli, tahin), così non finiscono nella spesa.
 */
export function resolveRecipe(id: string, includeExtra = true): Recipe | undefined {
  const original = recipeMap.get(id);
  if (!original || includeExtra) return original;

  let recipe = original;
  if (recipe.extra && recipe.fallbackId) {
    recipe = recipeMap.get(recipe.fallbackId) ?? recipe;
  }
  if (!recipe.ingredients.some((ri) => EXTRA_GARNISH_IDS.has(ri.ingredientId))) return recipe;
  return {
    ...recipe,
    ingredients: recipe.ingredients.filter((ri) => !EXTRA_GARNISH_IDS.has(ri.ingredientId)),
  };
}

/**
 * Template del giorno, agganciato ai giorni REALI della settimana.
 *  - `plan.days` è una concatenazione di settimane da 7 giorni (Lun→Dom).
 *    Con 7 giorni = 1 settimana fissa; con 14 = 2 settimane che si alternano, ecc.
 *  - Il giorno della settimana sceglie la posizione (Lun = 0 … Dom = 6);
 *    il numero di settimana (allineato al lunedì) sceglie QUALE settimana del ciclo.
 */
export function getDayTemplate(date: Date, season: Season): DayTemplate | undefined {
  const plan = seasonPlans.find((p) => p.season === season);
  if (!plan || plan.days.length === 0) return undefined;
  const weeks = Math.max(1, Math.floor(plan.days.length / 7));
  const dow = weekdayIndex(date); // 0 = Lun … 6 = Dom
  // Settimane allineate al lunedì: dayNumber 4 = lunedì 1970-01-05.
  const weekNo = Math.floor((dayNumber(date) - 4) / 7);
  const weekIndex = ((weekNo % weeks) + weeks) % weeks;
  return plan.days[weekIndex * 7 + dow];
}

export interface ResolvedMeal {
  slot: MealSlot;
  recipe: Recipe;
}

export function getRecipesForDate(
  date: Date,
  season: Season,
  includeExtra = true,
): ResolvedMeal[] {
  const tpl = getDayTemplate(date, season);
  if (!tpl) return [];
  return tpl.meals
    .map((m) => {
      const recipe = resolveRecipe(m.recipeId, includeExtra);
      return recipe ? { slot: m.slot, recipe } : null;
    })
    .filter((x): x is ResolvedMeal => x !== null);
}
