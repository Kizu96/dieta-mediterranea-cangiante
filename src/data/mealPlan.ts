import type { SeasonPlan, DayTemplate } from './types';

// Piani stagionali a ciclo di 7 giorni con ciclizzazione calorica ("cangiante").
// Giorni `active: true` = tapis roulant → ~2200 kcal (più carboidrati).
// Giorni di riposo → ~1900 kcal.
// Schema attività coerente con workoutPlan.ts: Lun/Mer/Sab/Dom = cardio (attivi).
// Ogni recipeId esiste in recipes.ts; le ricette sono diversificate fra i giorni.

// ----- ESTATE ----------------------------------------------------------------
const estateDays: DayTemplate[] = [
  {
    dayLabel: 'Lun',
    active: true,
    kcalTarget: 2200,
    meals: [
      { slot: 'colazione', recipeId: 'colazione-yogurt-avena' },
      { slot: 'pranzo', recipeId: 'pranzo-quinoa-gamberetti' },
      { slot: 'spuntino', recipeId: 'spuntino-kefir-frutti-semi' },
      { slot: 'cena', recipeId: 'cena-salmone-friggitrice' },
    ],
  },
  {
    dayLabel: 'Mar',
    active: false,
    kcalTarget: 1900,
    meals: [
      { slot: 'colazione', recipeId: 'colazione-smoothie-verde' },
      { slot: 'pranzo', recipeId: 'pranzo-ceci-tonno' },
      { slot: 'spuntino', recipeId: 'spuntino-yogurt-mandorle' },
      { slot: 'cena', recipeId: 'cena-frittata-funghi-spinaci' },
    ],
  },
  {
    dayLabel: 'Mer',
    active: true,
    kcalTarget: 2200,
    meals: [
      { slot: 'colazione', recipeId: 'colazione-toast-ricotta-noci' },
      { slot: 'pranzo', recipeId: 'pranzo-pasta-integrale-sgombro' },
      { slot: 'spuntino', recipeId: 'spuntino-matcha-latte' },
      { slot: 'cena', recipeId: 'cena-pollo-friggitrice-verdure' },
    ],
  },
  {
    dayLabel: 'Gio',
    active: false,
    kcalTarget: 1900,
    meals: [
      { slot: 'colazione', recipeId: 'colazione-frittata-microonde' },
      { slot: 'pranzo', recipeId: 'pranzo-cous-cous-feta' },
      { slot: 'spuntino', recipeId: 'spuntino-edamame-salati' },
      { slot: 'cena', recipeId: 'cena-merluzzo-pomodoro' },
    ],
  },
  {
    dayLabel: 'Ven',
    active: false,
    kcalTarget: 1900,
    meals: [
      { slot: 'colazione', recipeId: 'colazione-frittata-microonde' },
      { slot: 'pranzo', recipeId: 'pranzo-wrap-hummus-tacchino' },
      { slot: 'spuntino', recipeId: 'spuntino-polifenoli' },
      { slot: 'cena', recipeId: 'cena-salmone-broccoli-quinoa' },
    ],
  },
  {
    dayLabel: 'Sab',
    active: true,
    kcalTarget: 2200,
    meals: [
      { slot: 'colazione', recipeId: 'colazione-yogurt-avena' },
      { slot: 'pranzo', recipeId: 'pranzo-farro-pollo-verdure' },
      { slot: 'spuntino', recipeId: 'spuntino-gallette-burro-arachidi' },
      { slot: 'cena', recipeId: 'cena-tacchino-padella-funghi' },
    ],
  },
  {
    dayLabel: 'Dom',
    active: true,
    kcalTarget: 2200,
    meals: [
      { slot: 'colazione', recipeId: 'colazione-yogurt-avena' },
      { slot: 'pranzo', recipeId: 'pranzo-riso-integrale-edamame' },
      { slot: 'spuntino', recipeId: 'spuntino-yogurt-mandorle' },
      { slot: 'cena', recipeId: 'cena-platessa-friggitrice' },
    ],
  },
];

// ----- INVERNO ---------------------------------------------------------------
const invernoDays: DayTemplate[] = [
  {
    dayLabel: 'Lun',
    active: true,
    kcalTarget: 2200,
    meals: [
      { slot: 'colazione', recipeId: 'colazione-porridge-caldo' },
      { slot: 'pranzo', recipeId: 'pranzo-farro-pollo-verdure' },
      { slot: 'spuntino', recipeId: 'spuntino-kefir-frutti-semi' },
      { slot: 'cena', recipeId: 'cena-salmone-friggitrice' },
    ],
  },
  {
    dayLabel: 'Mar',
    active: false,
    kcalTarget: 1900,
    meals: [
      { slot: 'colazione', recipeId: 'colazione-yogurt-avena' },
      { slot: 'pranzo', recipeId: 'pranzo-zuppa-lenticchie' },
      { slot: 'spuntino', recipeId: 'spuntino-yogurt-mandorle' },
      { slot: 'cena', recipeId: 'cena-frittata-funghi-spinaci' },
    ],
  },
  {
    dayLabel: 'Mer',
    active: true,
    kcalTarget: 2200,
    meals: [
      { slot: 'colazione', recipeId: 'colazione-frittata-microonde' },
      { slot: 'pranzo', recipeId: 'pranzo-orzo-feta-verdure' },
      { slot: 'spuntino', recipeId: 'spuntino-yogurt-mandorle' },
      { slot: 'cena', recipeId: 'cena-merluzzo-pomodoro' },
    ],
  },
  {
    dayLabel: 'Gio',
    active: false,
    kcalTarget: 1900,
    meals: [
      { slot: 'colazione', recipeId: 'colazione-porridge-cacao' },
      { slot: 'pranzo', recipeId: 'pranzo-wrap-hummus-tacchino' },
      { slot: 'spuntino', recipeId: 'spuntino-edamame-salati' },
      { slot: 'cena', recipeId: 'cena-ceci-curry-spinaci' },
    ],
  },
  {
    dayLabel: 'Ven',
    active: false,
    kcalTarget: 1900,
    meals: [
      { slot: 'colazione', recipeId: 'colazione-frittata-microonde' },
      { slot: 'pranzo', recipeId: 'pranzo-pasta-integrale-sgombro' },
      { slot: 'spuntino', recipeId: 'spuntino-yogurt-mandorle' },
      { slot: 'cena', recipeId: 'cena-cavolfiore-uova-friggitrice' },
    ],
  },
  {
    dayLabel: 'Sab',
    active: true,
    kcalTarget: 2200,
    meals: [
      { slot: 'colazione', recipeId: 'colazione-porridge-caldo' },
      { slot: 'pranzo', recipeId: 'pranzo-zuppa-lenticchie-farro' },
      { slot: 'spuntino', recipeId: 'spuntino-edamame-salati' },
      { slot: 'cena', recipeId: 'cena-tacchino-padella-funghi' },
    ],
  },
  {
    dayLabel: 'Dom',
    active: true,
    kcalTarget: 2200,
    meals: [
      { slot: 'colazione', recipeId: 'colazione-pane-ricotta-miele' },
      { slot: 'pranzo', recipeId: 'pranzo-zuppa-lenticchie' },
      { slot: 'spuntino', recipeId: 'spuntino-yogurt-mandorle' },
      { slot: 'cena', recipeId: 'cena-salmone-broccoli-quinoa' },
    ],
  },
];

export const seasonPlans: SeasonPlan[] = [
  { season: 'estate', days: estateDays },
  { season: 'inverno', days: invernoDays },
];
