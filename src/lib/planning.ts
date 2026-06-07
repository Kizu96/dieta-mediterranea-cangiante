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

const epochDay = (d: Date): number => Math.floor(d.getTime() / 86_400_000);

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

/** Template del giorno: il ciclo settimanale ruota in base al giorno epoch. */
export function getDayTemplate(date: Date, season: Season): DayTemplate | undefined {
  const plan = seasonPlans.find((p) => p.season === season);
  if (!plan || plan.days.length === 0) return undefined;
  const idx = ((epochDay(date) % plan.days.length) + plan.days.length) % plan.days.length;
  return plan.days[idx];
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
