import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { freshSinceFor } from '../lib/freshness';

/**
 * Insieme reattivo degli ingredientId presenti in dispensa (have === true).
 * Usato per lista spesa, "posso farla ora", e banner mancanti.
 */
export function useHaveSet(): Set<string> {
  const items = useLiveQuery(() => db.pantry.toArray(), [], []);
  return new Set((items ?? []).filter((p) => p.have).map((p) => p.ingredientId));
}

/**
 * Mappa reattiva ingredientId -> quantità reale in dispensa (solo le voci con
 * quantità tracciata). Alimenta lista spesa quantitativa e ingredienti abbondanti.
 */
export function usePantryQty(): Map<string, number> {
  const items = useLiveQuery(() => db.pantry.toArray(), [], []);
  const entries: [string, number][] = [];
  for (const p of items ?? []) {
    if (p.qty != null) entries.push([p.ingredientId, p.qty]);
  }
  return new Map(entries);
}

/**
 * Mappa reattiva ingredientId -> { qty, full } per la barra di quantità:
 * `full` = livello dell'ultimo rifornimento (mai sotto qty, così la barra
 * non supera mai il 100%).
 */
export function usePantryLevels(): Map<string, { qty: number; full: number }> {
  const items = useLiveQuery(() => db.pantry.toArray(), [], []);
  const entries: [string, { qty: number; full: number }][] = [];
  for (const p of items ?? []) {
    if (p.qty != null) {
      entries.push([p.ingredientId, { qty: p.qty, full: Math.max(p.qtyFull ?? p.qty, p.qty) }]);
    }
  }
  return new Map(entries);
}

// Il toggle manuale azzera anche la quantità tracciata: se spunti/togli a mano
// stai dicendo all'app che il conteggio non è più affidabile → si riparte da ✓/✗.
// Spuntare un deperibile avvia anche il timer di freschezza ("cucinalo o congelalo").
export async function setPantryHave(ingredientId: string, have: boolean): Promise<void> {
  const fresh = have ? freshSinceFor(ingredientId) : undefined;
  await db.pantry.put({
    ingredientId,
    have,
    ...(fresh != null ? { freshSince: fresh } : {}),
    updatedAt: Date.now(),
  });
}
