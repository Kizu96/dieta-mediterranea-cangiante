// Esportazione/importazione di tutti i dati locali (backup), dato che non c'è cloud.
import {
  db,
  type EssentialLog,
  type MealOverride,
  type MealStatus,
  type PantryItem,
  type PrepLog,
  type Setting,
  type ShoppingCheck,
  type SproutBatch,
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
  mealStatus?: MealStatus[];
  mealOverride?: MealOverride[];
  prepLog?: PrepLog[];
  sprouts?: SproutBatch[];
  settings?: Setting[]; // opzionale: la sincronizzazione cloud NON include le impostazioni
}

export async function exportData(): Promise<BackupData> {
  const [pantry, shopping, weights, essentials, workouts, mealStatus, mealOverride, prepLog, sprouts, settings] =
    await Promise.all([
      db.pantry.toArray(),
      db.shopping.toArray(),
      db.weights.toArray(),
      db.essentials.toArray(),
      db.workouts.toArray(),
      db.mealStatus.toArray(),
      db.mealOverride.toArray(),
      db.prepLog.toArray(),
      db.sprouts.toArray(),
      db.settings.toArray(),
    ]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    pantry,
    shopping,
    weights,
    essentials,
    workouts,
    mealStatus,
    mealOverride,
    prepLog,
    sprouts,
    settings,
  };
}

// ---------------------------------------------------------------------------
// Fusione di due backup (per la sincronizzazione cloud). Niente "ultimo che
// scrive vince" a livello di tabella: si fonde RECORD per RECORD su una chiave
// stabile, scegliendo il più recente via `updatedAt`. Così, se modifichi cose
// diverse su telefono e PC, non si perde nulla. I record dei log sono privati
// di ogni dispositivo come `id` autoincrement → l'id viene rimosso (la chiave
// stabile è data/composta), e Dexie ne assegna uno nuovo all'import.
// ---------------------------------------------------------------------------
function mergeTable<T extends { id?: number; updatedAt?: number }>(
  a: T[] | undefined,
  b: T[] | undefined,
  key: (x: T) => string,
  stripId = false,
): T[] {
  const map = new Map<string, T>();
  const consider = (x: T) => {
    const k = key(x);
    const prev = map.get(k);
    // `>` (non `>=`) ⇒ a parità di updatedAt vince il primo inserito (cioè `a`).
    if (!prev || (x.updatedAt ?? 0) > (prev.updatedAt ?? 0)) map.set(k, x);
  };
  (a ?? []).forEach(consider);
  (b ?? []).forEach(consider);
  let out = [...map.values()];
  if (stripId)
    out = out.map((x) => {
      const copy = { ...x };
      delete copy.id;
      return copy;
    });
  return out.sort((x, y) => key(x).localeCompare(key(y)));
}

export function mergeBackup(a: Partial<BackupData>, b: Partial<BackupData>): BackupData {
  const settings =
    a.settings || b.settings
      ? mergeTable(
          a.settings as (Setting & { id?: number; updatedAt?: number })[] | undefined,
          b.settings as (Setting & { id?: number; updatedAt?: number })[] | undefined,
          (x) => x.key,
        )
      : undefined;
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    pantry: mergeTable(a.pantry, b.pantry, (x) => x.ingredientId),
    shopping: mergeTable(a.shopping, b.shopping, (x) => x.ingredientId),
    weights: mergeTable(a.weights, b.weights, (x) => x.date, true),
    essentials: mergeTable(a.essentials, b.essentials, (x) => `${x.date}|${x.essentialId}`, true),
    workouts: mergeTable(a.workouts, b.workouts, (x) => `${x.date}|${x.title}`, true),
    mealStatus: mergeTable(a.mealStatus, b.mealStatus, (x) => `${x.date}|${x.slot}`),
    mealOverride: mergeTable(a.mealOverride, b.mealOverride, (x) => `${x.date}|${x.slot}`),
    prepLog: mergeTable(a.prepLog, b.prepLog, (x) => `${x.date}|${x.slot}`),
    sprouts: mergeTable(a.sprouts, b.sprouts, (x) => x.startedAt, true),
    ...(settings ? { settings } : {}),
  };
}

// Stringa canonica (ordinata, senza id né timestamp) per confrontare due stati
// e capire se la sincronizzazione deve davvero scrivere qualcosa.
export function canonicalString(d: Partial<BackupData>): string {
  const m = mergeBackup(d, {});
  return JSON.stringify({ ...m, exportedAt: '' });
}

export async function importData(data: Partial<BackupData>): Promise<void> {
  await db.transaction(
    'rw',
    [db.pantry, db.shopping, db.weights, db.essentials, db.workouts, db.mealStatus, db.mealOverride, db.prepLog, db.sprouts, db.settings],
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
      if (Array.isArray(data.mealStatus)) {
        await db.mealStatus.clear();
        await db.mealStatus.bulkPut(data.mealStatus);
      }
      if (Array.isArray(data.mealOverride)) {
        await db.mealOverride.clear();
        await db.mealOverride.bulkPut(data.mealOverride);
      }
      if (Array.isArray(data.prepLog)) {
        await db.prepLog.clear();
        await db.prepLog.bulkPut(data.prepLog);
      }
      if (Array.isArray(data.sprouts)) {
        await db.sprouts.clear();
        await db.sprouts.bulkPut(data.sprouts);
      }
      if (Array.isArray(data.settings)) {
        await db.settings.clear();
        await db.settings.bulkPut(data.settings);
      }
    },
  );
}
