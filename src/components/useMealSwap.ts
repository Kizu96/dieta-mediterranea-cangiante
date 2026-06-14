import { useState } from 'react';
import type { Ingredient, MealSlot, Season } from '../data/types';
import { db } from '../db/db';
import type { OverrideMap } from '../lib/planning';
import { rankReplacements, type AffectedMeal, type SwapContext } from '../lib/swap';

// Scambio pasto «non acquistabile»: condiviso tra Oggi e Prep day. Il chiamante
// calcola i pasti interessati (finestra diversa nelle due schermate) e passa il
// SwapContext; il hook sceglie il rimpiazzo migliore, scrive i mealOverride e
// tiene il necessario per «↩︎ Annulla» (ripristina il piano) e «↺ Un'altra»
// (prossima ricetta migliore). Niente stato globale: solo override, già sincronizzati.

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
  avoidId: string;
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
      setNoAlt(ing.name);
      setResult(null);
      return;
    }
    setNoAlt(null);
    setResult({ ingredientName: ing.name, avoidId: ing.id, changes });
  };

  const another = async () => {
    if (!result) return;
    const changes = result.changes.map((c) => ({ ...c, tried: new Set(c.tried) }));
    for (const c of changes) {
      const pick = rankReplacements(c.slot, cfg.season, cfg.includeExtra, cfg.ctx, {
        avoidIngredientId: result.avoidId,
        excludeRecipeIds: c.tried,
      })[0];
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

  return { result, noAlt, markUnavailable, another, undo, dismiss };
}
