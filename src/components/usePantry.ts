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

export async function setPantryHave(ingredientId: string, have: boolean): Promise<void> {
  await db.pantry.put({ ingredientId, have, updatedAt: Date.now() });
}
