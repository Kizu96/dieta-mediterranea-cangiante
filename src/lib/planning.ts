import type { DayTemplate, MealSlot, Recipe, Season } from '../data/types';
import { recipes } from '../data/recipes';
import { seasonPlans } from '../data/mealPlan';

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

export function getRecipesForDate(date: Date, season: Season): ResolvedMeal[] {
  const tpl = getDayTemplate(date, season);
  if (!tpl) return [];
  return tpl.meals
    .map((m) => {
      const recipe = recipeMap.get(m.recipeId);
      return recipe ? { slot: m.slot, recipe } : null;
    })
    .filter((x): x is ResolvedMeal => x !== null);
}
