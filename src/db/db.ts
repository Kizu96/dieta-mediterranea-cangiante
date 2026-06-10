// ===========================================================================
// Stato utente persistito localmente (IndexedDB via Dexie). Nessun backend.
// ===========================================================================
import Dexie, { type Table } from 'dexie';

export interface PantryItem {
  ingredientId: string;
  have: boolean;
  updatedAt: number;
}

export interface ShoppingCheck {
  ingredientId: string;
  bought: boolean;
  updatedAt: number;
}

export interface WeightEntry {
  id?: number;
  date: string; // ISO yyyy-mm-dd
  updatedAt?: number; // per la fusione in sincronizzazione (newest wins)
  kg: number;
  // Composizione corporea / misure (dalla bilancia smart o dal metro). Opzionali.
  visceralFat?: number; // indice grasso viscerale (es. 1-59)
  bodyFatPct?: number; // % massa grassa
  muscleKg?: number; // massa muscolare (kg)
  waistCm?: number; // circonferenza vita
  hipsCm?: number; // circonferenza fianchi
  note?: string;
}

export interface EssentialLog {
  id?: number;
  date: string; // ISO yyyy-mm-dd
  essentialId: string;
  done: boolean;
  updatedAt?: number; // per la fusione in sincronizzazione (newest wins)
}

export interface WorkoutLog {
  id?: number;
  date: string; // ISO yyyy-mm-dd
  title: string;
  done: boolean;
  durationMin?: number;
  updatedAt?: number; // per la fusione in sincronizzazione (newest wins)
}

// Impostazioni generiche key/value (stagione override, profilo, notifiche...)
export interface Setting {
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}

export class DietDB extends Dexie {
  pantry!: Table<PantryItem, string>;
  shopping!: Table<ShoppingCheck, string>;
  weights!: Table<WeightEntry, number>;
  essentials!: Table<EssentialLog, number>;
  workouts!: Table<WorkoutLog, number>;
  settings!: Table<Setting, string>;

  constructor() {
    super('dietaMediterraneaCangiante');
    this.version(1).stores({
      pantry: 'ingredientId',
      shopping: 'ingredientId',
      weights: '++id, date',
      essentials: '++id, date, essentialId, [date+essentialId]',
      workouts: '++id, date',
      settings: 'key',
    });
  }
}

export const db = new DietDB();

// --- Helper impostazioni -------------------------------------------------
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.settings.get(key);
  return row ? (row.value as T) : fallback;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await db.settings.put({ key, value });
}
