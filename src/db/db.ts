// ===========================================================================
// Stato utente persistito localmente (IndexedDB via Dexie). Nessun backend.
// ===========================================================================
import Dexie, { type Table } from 'dexie';
import type { MealSlot } from '../data/types';

export interface PantryItem {
  ingredientId: string;
  have: boolean;
  // Quantità reale in dispensa, nell'unità dell'ingrediente (g/ml/pz).
  // undefined = ingrediente gestito solo come ✓/✗ (staple, condimenti, o mai quantificato).
  qty?: number;
  updatedAt: number;
}

export interface ShoppingCheck {
  ingredientId: string;
  bought: boolean;
  qty?: number; // quantità comprata (formato pacco), da sommare alla dispensa
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

// Stato del pasto di un giorno (mangiato / metà / saltato): alimenta la barra calorie.
export type MealStatusValue = 'eaten' | 'half' | 'skipped';
export interface MealStatus {
  date: string; // ISO yyyy-mm-dd
  slot: MealSlot;
  status: MealStatusValue;
  recipeId?: string; // ricetta a cui si riferiva quando è stato segnato
  // Quantità realmente scalate dalla dispensa quando il pasto è stato segnato:
  // snapshot che permette lo storno ESATTO se si cambia idea (anche se nel
  // frattempo cambiano intensità o ricetta del piano).
  consumed?: { ingredientId: string; qty: number }[];
  updatedAt?: number; // per la fusione in sincronizzazione
}

// Sostituzione manuale di un pasto del piano per un giorno specifico ("scambia pasto").
export interface MealOverride {
  date: string; // ISO yyyy-mm-dd
  slot: MealSlot;
  recipeId: string;
  updatedAt?: number; // per la fusione in sincronizzazione
}

// Prep day (domenica): segna quali pranzi della settimana lavorativa sono già
// stati preparati in batch. `date` = il giorno PER CUI è il pranzo, non quello
// in cui lo prepari.
export interface PrepLog {
  date: string; // ISO yyyy-mm-dd
  slot: MealSlot; // per ora solo 'pranzo'
  done: boolean;
  updatedAt?: number; // per la fusione in sincronizzazione
}

export class DietDB extends Dexie {
  pantry!: Table<PantryItem, string>;
  shopping!: Table<ShoppingCheck, string>;
  weights!: Table<WeightEntry, number>;
  essentials!: Table<EssentialLog, number>;
  workouts!: Table<WorkoutLog, number>;
  settings!: Table<Setting, string>;
  mealStatus!: Table<MealStatus, [string, string]>;
  mealOverride!: Table<MealOverride, [string, string]>;
  prepLog!: Table<PrepLog, [string, string]>;

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
    // v2: stato pasti (mangiato/metà/saltato) e scambio pasto per giorno.
    // Chiave composta [date+slot]; gli store esistenti restano invariati.
    this.version(2).stores({
      mealStatus: '[date+slot], date',
      mealOverride: '[date+slot], date',
    });
    // v3: prep day — pranzi della settimana preparati in batch la domenica.
    this.version(3).stores({
      prepLog: '[date+slot], date',
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
