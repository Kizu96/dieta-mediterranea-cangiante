import { useState } from 'react';
import type { Ingredient, MealSlot, Season } from '../data/types';
import { db } from '../db/db';
import type { OverrideMap } from '../lib/planning';
import { planFinishSwaps, rankReplacements, type AffectedMeal, type SwapContext } from '../lib/swap';

// Scambio pasti condiviso (Oggi e Prep). Due usi, stessa infrastruttura di
// applicazione/annulla/«un'altra»:
//   • mode 'avoid' → «non acquistabile»: scambia i pasti che USANO un ingrediente
//     con ricette che NON lo usano.
//   • mode 'use'   → «finisci il prodotto aperto»: riempie i prossimi giorni con
//     ricette che USANO l'ingrediente, per consumarlo entro la finestra.
// Niente stato globale: solo mealOverride, già sincronizzati.

interface SwapChange {
  dateISO: string;
  slot: MealSlot;
  prev: string | null; // override precedente (null = era il piano base)
  nextId: string;
  nextName: string;
  tried: Set<string>; // ricette già proposte per questo pasto (per «Un'altra»)
}

export interface SwapResult {
  ingredientName: string;
  ingredientId: string;
  mode: 'avoid' | 'use';
  changes: SwapChange[];
}

interface Cfg {
  season: Season;
  includeExtra: boolean;
  overrides: OverrideMap;
  ctx: SwapContext;
}

const writeOverride = (dateISO: string, slot: MealSlot, recipeId: string) =>
  db.mealOverride.put({ date: dateISO, slot, recipeId, updatedAt: Date.now() });

const restore = async (dateISO: string, slot: MealSlot, prev: string | null) => {
  if (prev == null) await db.mealOverride.delete([dateISO, slot]);
  else await db.mealOverride.put({ date: dateISO, slot, recipeId: prev, updatedAt: Date.now() });
};

export function useMealSwap(cfg: Cfg) {
  const [result, setResult] = useState<SwapResult | null>(null);
  const [noAlt, setNoAlt] = useState<string | null>(null);

  // «Non acquistabile»: scambia i pasti interessati con ricette che evitano l'ingrediente.
  const markUnavailable = async (ing: Ingredient, affected: AffectedMeal[]) => {
    const changes: SwapChange[] = [];
    for (const a of affected) {
      const pick = rankReplacements(a.slot, cfg.season, cfg.includeExtra, cfg.ctx, {
        avoidIngredientId: ing.id,
        excludeRecipeIds: new Set([a.recipe.id]),
      })[0];
      if (!pick) continue;
      const prev = cfg.overrides.get(`${a.dateISO}|${a.slot}`) ?? null;
      await writeOverride(a.dateISO, a.slot, pick.id);
      changes.push({
        dateISO: a.dateISO,
        slot: a.slot,
        prev,
        nextId: pick.id,
        nextName: pick.name,
        tried: new Set([a.recipe.id, pick.id]),
      });
    }
    if (changes.length === 0) {
      setNoAlt(`Nessuna ricetta alternativa senza ${ing.name} per i pasti in arrivo.`);
      setResult(null);
      return;
    }
    setNoAlt(null);
    setResult({ ingredientName: ing.name, ingredientId: ing.id, mode: 'avoid', changes });
  };

  // «Finisci il prodotto aperto»: riempie i prossimi giorni con ricette che lo usano.
  const finishProduct = async (ing: Ingredient, start: Date, windowDays: number, maxMeals: number) => {
    const { picks, alreadyUsed } = planFinishSwaps(
      start,
      windowDays,
      cfg.season,
      cfg.includeExtra,
      cfg.overrides,
      ing.id,
      cfg.ctx,
      maxMeals,
    );
    if (picks.length === 0) {
      setNoAlt(
        alreadyUsed
          ? `${ing.name}: lo usi già nei prossimi giorni, lo finisci senza cambiare il piano.`
          : `Nessuna ricetta dei prossimi giorni usa ${ing.name}: finiscilo a mano.`,
      );
      setResult(null);
      return;
    }
    const changes: SwapChange[] = picks.map((p) => ({
      dateISO: p.dateISO,
      slot: p.slot,
      prev: p.prev,
      nextId: p.recipe.id,
      nextName: p.recipe.name,
      tried: new Set([p.recipe.id]),
    }));
    for (const p of picks) await writeOverride(p.dateISO, p.slot, p.recipe.id);
    setNoAlt(null);
    setResult({ ingredientName: ing.name, ingredientId: ing.id, mode: 'use', changes });
  };

  const another = async () => {
    if (!result) return;
    const changes = result.changes.map((c) => ({ ...c, tried: new Set(c.tried) }));
    for (const c of changes) {
      const opts =
        result.mode === 'avoid'
          ? { avoidIngredientId: result.ingredientId, excludeRecipeIds: c.tried }
          : { requireIngredientId: result.ingredientId, excludeRecipeIds: c.tried };
      const pick = rankReplacements(c.slot, cfg.season, cfg.includeExtra, cfg.ctx, opts)[0];
      if (!pick) continue; // esaurite le alternative per questo pasto: lascialo com'è
      await writeOverride(c.dateISO, c.slot, pick.id);
      c.nextId = pick.id;
      c.nextName = pick.name;
      c.tried.add(pick.id);
    }
    setResult({ ...result, changes });
  };

  const undo = async () => {
    if (!result) return;
    for (const c of result.changes) await restore(c.dateISO, c.slot, c.prev);
    setResult(null);
  };

  const dismiss = () => {
    setResult(null);
    setNoAlt(null);
  };

  return { result, noAlt, markUnavailable, finishProduct, another, undo, dismiss };
}
