// ===========================================================================
// Copertura dei PILASTRI quotidiani dai PASTI del giorno (+ eventuali aggiunte).
//
// Idea (everything-connected): i pilastri non sono una checklist a sé. L'app
// guarda cosa contengono davvero i pasti di oggi e segna come "già nei pasti"
// i pilastri coperti (l'olio EVO è in ogni ricetta, la verdura a foglia in
// molte, ecc.). Resta da spuntare solo il vero extra. Se un pilastro
// "integrabile" (verdura a foglia) manca, si può aggiungere a un pasto.
// ===========================================================================
import type { MealSlot, Recipe, Season } from '../data/types';
import { ingredients } from '../data/ingredients';
import type { MealSide } from '../db/db';

const ingMap = new Map(ingredients.map((i) => [i.id, i]));

// Verdure a foglia che "contano" come pilastro verde.
export const LEAFY_GREENS = [
  'spinaci',
  'spinaci-surgelati',
  'rucola',
  'cavolo-nero',
  'lattuga',
  'cavolo-cappuccio',
  'verza',
];

const PROTEIN_CATS = new Set(['proteine', 'pesce', 'legumi', 'latticini']);

interface CoverageRule {
  ids?: string[]; // ingredienti che soddisfano il pilastro
  fillable?: boolean; // se manca, l'app può integrarlo in un pasto
  everyMealProtein?: boolean; // regola "proteine a ogni pasto"
}

// Quali pilastri sono "coperti dai pasti" e con quali ingredienti.
// Quelli assenti (acqua, tè verde, creatina…) restano spunte manuali.
const RULES: Record<string, CoverageRule> = {
  'olio-evo': { ids: ['olio-evo'] },
  'verde-foglia': { ids: LEAFY_GREENS, fillable: true },
  'frutta-secca': { ids: ['noci', 'mandorle', 'nocciole', 'pistacchi'] },
  'germogli-broccoli': { ids: ['broccoli-germogli'] },
  'frutti-bosco': { ids: ['uva'] },
  'cioccolato-85': { ids: ['cioccolato-85'] },
  fermentati: { ids: ['crauti', 'kimchi'] },
  'te-verde': { ids: ['te-verde'] },
  'proteine-ogni-pasto': { everyMealProtein: true },
};

export interface MealLite {
  slot: MealSlot;
  recipe: Pick<Recipe, 'ingredients'>;
}

export interface EssentialCoverage {
  covered: boolean;
  slots: MealSlot[]; // pasti che lo coprono
  viaSide: boolean; // coperto da un'aggiunta (mealSide), non dal piano
  fillable: boolean; // integrabile se manca (verdura a foglia)
}

/** Per ogni pilastro: è coperto dai pasti di oggi (o da un'aggiunta)? */
export function essentialCoverage(
  meals: MealLite[],
  sides: MealSide[],
): Map<string, EssentialCoverage> {
  const out = new Map<string, EssentialCoverage>();
  for (const [eid, rule] of Object.entries(RULES)) {
    const slots: MealSlot[] = [];
    let covered = false;
    let viaSide = false;

    if (rule.everyMealProtein) {
      covered =
        meals.length > 0 &&
        meals.every((m) =>
          m.recipe.ingredients.some((ri) => PROTEIN_CATS.has(ingMap.get(ri.ingredientId)?.category ?? '')),
        );
      if (covered) for (const m of meals) slots.push(m.slot);
    } else if (rule.ids) {
      const idset = new Set(rule.ids);
      for (const m of meals) {
        if (m.recipe.ingredients.some((ri) => idset.has(ri.ingredientId))) {
          covered = true;
          if (!slots.includes(m.slot)) slots.push(m.slot);
        }
      }
      for (const s of sides) {
        if (idset.has(s.ingredientId)) {
          covered = true;
          viaSide = true;
          if (!slots.includes(s.slot)) slots.push(s.slot);
        }
      }
    }
    out.set(eid, { covered, slots, viaSide, fillable: !!rule.fillable });
  }
  return out;
}

/** Cosa aggiungere e dove per coprire la verdura a foglia mancante oggi. */
export function leafyFillSuggestion(
  season: Season,
  meals: MealLite[],
): { ingredientId: string; slot: MealSlot; qty: number } {
  const ingredientId = season === 'inverno' ? 'spinaci' : 'rucola';
  const slot: MealSlot = meals.some((m) => m.slot === 'pranzo')
    ? 'pranzo'
    : meals.some((m) => m.slot === 'cena')
      ? 'cena'
      : (meals[0]?.slot ?? 'pranzo');
  return { ingredientId, slot, qty: 50 };
}
