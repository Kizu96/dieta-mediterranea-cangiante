import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

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

// Il toggle manuale azzera anche la quantità tracciata: se spunti/togli a mano
// stai dicendo all'app che il conteggio non è più affidabile → si riparte da ✓/✗.
export async function setPantryHave(ingredientId: string, have: boolean): Promise<void> {
  await db.pantry.put({ ingredientId, have, updatedAt: Date.now() });
}
