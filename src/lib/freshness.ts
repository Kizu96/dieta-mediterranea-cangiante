// ===========================================================================
// Avvisi "cucinalo o congelalo": per gli ingredienti DEPERIBILI (lo storage
// dichiara i giorni di frigo, es. "Frigo 1-2 gg") si registra quando sono
// stati messi in frigo (acquisto o spunta manuale → PantryItem.freshSince).
// Quando i giorni dichiarati sono passati, Oggi mostra l'avviso; "Gestito"
// (cucinato/congelato/buttato) azzera il timer senza toccare il resto.
// ===========================================================================
import type { Ingredient } from '../data/types';
import { ingredients } from '../data/ingredients';
import { db, type PantryItem } from '../db/db';

const ingredientMap = new Map<string, Ingredient>(ingredients.map((i) => [i.id, i]));

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Giorni di tenuta in frigo dichiarati nello storage dell'ingrediente
 * (es. "Frigo 1-2 gg" → 2). null = non deperibile / nessun numero dichiarato
 * (uova "Frigo", scatolette "Dispensa"…) → niente avvisi.
 */
export function perishableFridgeDays(ing: Ingredient): number | null {
  const m = ing.storage.match(/frigo[^0-9]*?(\d+)(?:\s*-\s*(\d+))?\s*g/i);
  return m ? parseInt(m[2] ?? m[1], 10) : null;
}

/** Giorni di tenuta in frigo DOPO l'apertura (barattoli/scatolette, latticini
 *  freschi): dal campo esplicito `openedDays`. null = non è un alimento «apribile». */
export function openedFridgeDays(ing: Ingredient): number | null {
  return ing.openedDays ?? null;
}

/** Giorni di tenuta in frigo una volta che l'ingrediente è «sul timer»: dopo
 *  l'apertura se è un apribile (`openedDays`), altrimenti i giorni dichiarati
 *  nello storage per i freschi che si contano dall'acquisto (es. pollo). */
export function fridgeLifeDays(ing: Ingredient): number | null {
  return ing.openedDays ?? perishableFridgeDays(ing);
}

/** Da quanti giorni (interi) l'ingrediente è in frigo. */
export function daysInFridge(freshSince: number, now = Date.now()): number {
  return Math.floor((now - freshSince) / DAY_MS);
}

export interface FreshnessAlert {
  ingredient: Ingredient;
  daysIn: number; // giorni in frigo
  maxDays: number; // tenuta dichiarata
}

/** Ingredienti in dispensa che hanno raggiunto/superato i giorni di frigo. */
export function freshnessAlerts(rows: PantryItem[], now = Date.now()): FreshnessAlert[] {
  const out: FreshnessAlert[] = [];
  for (const row of rows) {
    if (!row.have || row.freshSince == null) continue;
    const ing = ingredientMap.get(row.ingredientId);
    if (!ing) continue;
    const maxDays = fridgeLifeDays(ing);
    if (maxDays == null) continue;
    const daysIn = daysInFridge(row.freshSince, now);
    if (daysIn >= maxDays) out.push({ ingredient: ing, daysIn, maxDays });
  }
  return out.sort((a, b) => b.daysIn - b.maxDays - (a.daysIn - a.maxDays));
}

/** Avviso gestito (cucinato/mangiato/buttato): azzera il timer di freschezza. */
export async function dismissFreshness(ingredientId: string): Promise<void> {
  const row = await db.pantry.get(ingredientId);
  if (!row) return;
  const next = { ...row, updatedAt: Date.now() };
  delete next.freshSince;
  await db.pantry.put(next);
}

/** Messo in freezer: stop al timer di frigo, parte il promemoria "sposta in frigo la sera prima". */
export async function markFrozen(ingredientId: string): Promise<void> {
  const row = await db.pantry.get(ingredientId);
  if (!row) return;
  const next = { ...row, frozen: true, updatedAt: Date.now() };
  delete next.freshSince;
  await db.pantry.put(next);
}

/**
 * Tirato fuori dal freezer e messo in frigo a scongelare: via il flag freezer
 * e RIPARTE il timer di freschezza (lo scongelato tiene 1-2 giorni e non si
 * ricongela da crudo — l'avviso "cucinalo" tornerà da solo).
 */
export async function markThawedToFridge(ingredientId: string): Promise<void> {
  const row = await db.pantry.get(ingredientId);
  if (!row) return;
  const next = { ...row, updatedAt: Date.now(), ...(freshSinceFor(ingredientId) != null ? { freshSince: Date.now() } : {}) };
  delete next.frozen;
  await db.pantry.put(next);
}

/** Tra `neededIds`, gli ingredienti in dispensa flaggati "in freezer". */
export function frozenNeeded(rows: PantryItem[], neededIds: Set<string>): Ingredient[] {
  const out: Ingredient[] = [];
  for (const row of rows) {
    if (!row.frozen || !neededIds.has(row.ingredientId)) continue;
    const ing = ingredientMap.get(row.ingredientId);
    if (ing) out.push(ing);
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/** freshSince da impostare quando un ingrediente entra in dispensa (se deperibile). */
export function freshSinceFor(ingredientId: string, now = Date.now()): number | undefined {
  const ing = ingredientMap.get(ingredientId);
  if (!ing) return undefined;
  // Barattoli/scatolette/latticini: il timer parte SOLO con «Ho aperto» (markOpened),
  // non all'acquisto — altrimenti scatterebbe l'avviso su una confezione ancora chiusa.
  if (ing.openedDays != null || /apert/i.test(ing.storage)) return undefined;
  return perishableFridgeDays(ing) != null ? now : undefined;
}

/** «Ho aperto il barattolo/la confezione»: avvia il timer di freschezza (freshSince
 *  = adesso) per gli alimenti con `openedDays`. Da qui partono gli avvisi «consuma
 *  entro N giorni» in Oggi e la priorità «usa prima ciò che va a male». */
export async function markOpened(ingredientId: string): Promise<void> {
  const row = await db.pantry.get(ingredientId);
  const now = Date.now();
  await db.pantry.put({
    ingredientId,
    have: true,
    ...(row?.qty != null
      ? { qty: row.qty, qtyFull: Math.max(row.qtyFull ?? row.qty, row.qty) }
      : {}),
    freshSince: now,
    updatedAt: now,
  });
}
