import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

/** Insieme reattivo delle ricette preferite (cuore). Sincronizzato. */
export function useFavorites(): Set<string> {
  const rows = useLiveQuery(() => db.favorites.toArray(), [], []);
  return new Set((rows ?? []).map((f) => f.recipeId));
}

export async function toggleFavorite(recipeId: string, isFavorite: boolean): Promise<void> {
  if (isFavorite) await db.favorites.delete(recipeId);
  else await db.favorites.put({ recipeId, updatedAt: Date.now() });
}
