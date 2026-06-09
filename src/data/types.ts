// ===========================================================================
// CONTRATTO DATI — fonte unica di verità per app e PDF.
// NON modificare le firme/nomi esportati senza aggiornare PROJECT.md.
// ===========================================================================

export type Season = 'estate' | 'inverno';

export type Equipment = 'padella' | 'pentola' | 'microonde' | 'friggitrice' | 'frullatore' | 'nessuna';

export type MealSlot = 'colazione' | 'pranzo' | 'spuntino' | 'cena';

export type Category =
  | 'verdura'
  | 'frutta'
  | 'proteine'
  | 'pesce'
  | 'latticini'
  | 'cereali'
  | 'legumi'
  | 'fruttaSecca'
  | 'condimenti'
  | 'fermentati'
  | 'bevande'
  | 'dispensa'
  | 'surgelati';

export interface Ingredient {
  id: string;
  name: string; // nome in italiano
  category: Category;
  unit: string; // unità di misura di riferimento (g, ml, pz, cucchiai...)
  storage: string; // come conservarlo vivendo da soli
  shelfLife: string; // durata indicativa
  staple?: boolean; // da tenere sempre in dispensa
  seasons?: Season[]; // se stagionale; assente = tutto l'anno
}

export interface RecipeIngredient {
  ingredientId: string;
  qty: number;
  unit: string;
  note?: string;
}

export interface Recipe {
  id: string;
  name: string;
  slot: MealSlot[]; // a quali pasti si adatta
  seasons: Season[];
  equipment: Equipment[]; // solo padella/pentola/microonde/friggitrice
  timeMin: number;
  servings: 1; // sempre dosata per 1 persona
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  storage: string; // conservazione / batch cooking
  tips?: string;
  tags?: string[]; // es. 'polifenoli', 'anti-insulina', 'fermentati', 'omega3'
  // Ricetta "extra": richiede prodotti specialistici (acquisto online) e/o il
  // frullatore. Quando la modalità ricette-extra è OFF viene sostituita da `fallbackId`.
  extra?: boolean;
  extraReason?: string; // cosa serve (es. 'frullatore + spirulina')
  fallbackId?: string; // ricetta base equivalente (stesso slot/stagione) senza prodotti extra
  // Pranzo "da ufficio": si prepara in anticipo (sera prima/batch nel weekend),
  // si conserva in frigo e si trasporta. Usato per l'etichetta 🥡 sui pranzi feriali.
  office?: boolean;
}

export interface DailyEssential {
  id: string;
  name: string;
  detail: string; // dose giornaliera + perché
  ingredientId?: string; // collega alla dispensa/spesa se applicabile
  source?: string; // riferimento scientifico breve
}

export interface PlannedMeal {
  slot: MealSlot;
  recipeId: string;
}

export interface DayTemplate {
  dayLabel: string; // 'Lun', 'Mar', ...
  kcalTarget: number; // ciclizzazione "cangiante"
  active: boolean; // true = giorno con tapis roulant (più carbo)
  meals: PlannedMeal[];
}

export interface SeasonPlan {
  season: Season;
  // Concatenazione di settimane da 7 giorni in ordine Lun→Dom.
  // 7 = una settimana fissa; 14 = due settimane che si alternano (Lun reale = indice 0), ecc.
  days: DayTemplate[];
}

export interface WorkoutExercise {
  name: string;
  detail: string; // serie/ripetizioni/durata/istruzioni passo-passo
}

export interface WorkoutDay {
  dayLabel: string;
  title: string;
  type: 'cardio' | 'forza' | 'mobilita' | 'riposo';
  durationMin: number;
  exercises: WorkoutExercise[];
  notes?: string;
}

export interface WorkoutWeek {
  weekLabel: string; // progressione (Settimana 1-2, 3-4, ...)
  focus: string;
  days: WorkoutDay[];
}

export interface GuideSection {
  id: string;
  title: string;
  icon?: string; // emoji
  body: string; // markdown
}
