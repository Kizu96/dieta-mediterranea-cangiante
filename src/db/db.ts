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
  // Livello "pieno" di riferimento per la barra di quantità: la quantità
  // raggiunta dopo l'ultimo acquisto/rifornimento. La barra mostra qty/qtyFull.
  qtyFull?: number;
  // Quando un ingrediente DEPERIBILE (storage con giorni di frigo dichiarati) è
  // stato messo in frigo (acquisto/spunta manuale): alimenta gli avvisi
  // "cucinalo o congelalo" in Oggi. undefined = non deperibile o avviso gestito.
  freshSince?: number;
  // L'utente l'ha messo in freezer: niente avvisi di frigo, ma se serve domani
  // Oggi ricorda di spostarlo in frigo la sera prima (scongelamento lento).
  frozen?: boolean;
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

// Stato del pasto di un giorno: alimenta la barra calorie e l'aderenza.
// 'skipped' = digiuno vero; 'offplan' = mangiato ALTRO fuori dal piano
// (pizza, ristorante…) con kcal stimate — tiene la barra calorie onesta.
export type MealStatusValue = 'eaten' | 'half' | 'skipped' | 'offplan';
export interface MealStatus {
  date: string; // ISO yyyy-mm-dd
  slot: MealSlot;
  status: MealStatusValue;
  recipeId?: string; // ricetta a cui si riferiva quando è stato segnato
  // Solo per status 'offplan': kcal stimate del pasto fuori piano.
  offPlanKcal?: number;
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

// "Aggiunta" a un pasto del giorno per coprire un pilastro quotidiano che il
// piano non includeva (es. una manciata di verdura a foglia). Collega lo stato
// dei pilastri al piano vero e proprio (vedi everything-connected).
export interface MealSide {
  date: string; // ISO yyyy-mm-dd
  ingredientId: string;
  slot: MealSlot; // pasto a cui è aggiunta
  qty: number; // quantità nell'unità dell'ingrediente (g)
  essentialId?: string; // pilastro che soddisfa (es. 'verde-foglia')
  updatedAt?: number; // per la fusione in sincronizzazione
}

// Prep day (domenica): segna quali pranzi della settimana lavorativa sono già
// stati preparati in batch. `date` = il giorno PER CUI è il pranzo, non quello
// in cui lo prepari. La riga con slot='settimana' (date = lunedì) è la
// sentinella del toggle «prep day fatto» che attiva il riordino dei pranzi.
export interface PrepLog {
  date: string; // ISO yyyy-mm-dd
  slot: MealSlot | 'settimana';
  done: boolean;
  updatedAt?: number; // per la fusione in sincronizzazione
}

// Voce LIBERA della lista spesa (detersivo, carta cucina…): non legata al
// piano, si spunta e si elimina; inclusa nella condivisione della lista.
export interface CustomShoppingItem {
  id?: number;
  name: string;
  bought: boolean;
  updatedAt?: number; // per la fusione in sincronizzazione
}

// Ricetta preferita (cuore): la presenza della riga = preferita.
export interface FavoriteRecipe {
  recipeId: string;
  updatedAt?: number; // per la fusione in sincronizzazione
}

// Barattolo di germogli di broccoli (mason jar): un record per "infornata".
// `startedAt` = giorno dell'ammollo (giorno 0); `harvestedAt` = raccolto e in
// frigo (il barattolo attivo è quello senza harvestedAt).
export interface SproutBatch {
  id?: number;
  startedAt: string; // ISO yyyy-mm-dd
  harvestedAt?: string; // ISO yyyy-mm-dd
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
  sprouts!: Table<SproutBatch, number>;
  customShopping!: Table<CustomShoppingItem, number>;
  favorites!: Table<FavoriteRecipe, string>;
  mealSide!: Table<MealSide, [string, string]>;

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
    // v4: tracker dei germogli di broccoli (barattoli avviati/raccolti).
    this.version(4).stores({
      sprouts: '++id, startedAt',
    });
    // v5: voci libere della lista spesa + ricette preferite.
    this.version(5).stores({
      customShopping: '++id, name',
      favorites: 'recipeId',
    });
    // v6: "aggiunte" ai pasti del giorno per coprire i pilastri mancanti
    // (es. verdura a foglia). Chiave [date+ingredientId]; gli store restano invariati.
    this.version(6).stores({
      mealSide: '[date+ingredientId], date',
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
