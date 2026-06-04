// Esportazione/importazione di tutti i dati locali (backup), dato che non c'è cloud.
import {
  db,
  type EssentialLog,
  type PantryItem,
  type Setting,
  type ShoppingCheck,
  type WeightEntry,
  type WorkoutLog,
} from '../db/db';

export interface BackupData {
  version: number;
  exportedAt: string;
  pantry: PantryItem[];
  shopping: ShoppingCheck[];
  weights: WeightEntry[];
  essentials: EssentialLog[];
  workouts: WorkoutLog[];
  settings: Setting[];
}

export async function exportData(): Promise<BackupData> {
  const [pantry, shopping, weights, essentials, workouts, settings] = await Promise.all([
    db.pantry.toArray(),
    db.shopping.toArray(),
    db.weights.toArray(),
    db.essentials.toArray(),
    db.workouts.toArray(),
    db.settings.toArray(),
  ]);
  return { version: 1, exportedAt: new Date().toISOString(), pantry, shopping, weights, essentials, workouts, settings };
}

export async function importData(data: Partial<BackupData>): Promise<void> {
  await db.transaction(
    'rw',
    [db.pantry, db.shopping, db.weights, db.essentials, db.workouts, db.settings],
    async () => {
      if (Array.isArray(data.pantry)) {
        await db.pantry.clear();
        await db.pantry.bulkPut(data.pantry);
      }
      if (Array.isArray(data.shopping)) {
        await db.shopping.clear();
        await db.shopping.bulkPut(data.shopping);
      }
      if (Array.isArray(data.weights)) {
        await db.weights.clear();
        await db.weights.bulkPut(data.weights);
      }
      if (Array.isArray(data.essentials)) {
        await db.essentials.clear();
        await db.essentials.bulkPut(data.essentials);
      }
      if (Array.isArray(data.workouts)) {
        await db.workouts.clear();
        await db.workouts.bulkPut(data.workouts);
      }
      if (Array.isArray(data.settings)) {
        await db.settings.clear();
        await db.settings.bulkPut(data.settings);
      }
    },
  );
}
