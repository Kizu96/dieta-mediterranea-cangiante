// Tabella nutrizionale per 100 g (porzione edibile, come usata nelle ricette).
// Valori standard da USDA FoodData Central e tabelle CREA (composizione alimenti).
// Servono a RICALCOLARE i macro delle ricette dalle quantità reali (validazione).
// Campi: kcal, p(roteine), c(arboidrati), f(grassi), fib(re)  — g per 100 g.

export const NUTR = {
  // --- condimenti / dispensa base ---
  'olio-evo': { kcal: 884, p: 0, c: 0, f: 100, fib: 0 },
  sale: { kcal: 0, p: 0, c: 0, f: 0, fib: 0 },
  'sale-grosso': { kcal: 0, p: 0, c: 0, f: 0, fib: 0 },
  pepe: { kcal: 251, p: 10, c: 64, f: 3.3, fib: 25 },
  'aceto-mele': { kcal: 22, p: 0, c: 0.9, f: 0, fib: 0 },
  senape: { kcal: 66, p: 4, c: 5, f: 4, fib: 3 },
  paprika: { kcal: 282, p: 14, c: 54, f: 13, fib: 35 },
  curcuma: { kcal: 312, p: 10, c: 67, f: 3, fib: 21 },
  cumino: { kcal: 375, p: 18, c: 44, f: 22, fib: 11 },
  origano: { kcal: 265, p: 9, c: 69, f: 4, fib: 43 },
  cannella: { kcal: 247, p: 4, c: 81, f: 1.2, fib: 53 },
  peperoncino: { kcal: 324, p: 12, c: 57, f: 17, fib: 27 },
  gochugaru: { kcal: 282, p: 12, c: 57, f: 8, fib: 28 },
  zenzero: { kcal: 80, p: 1.8, c: 18, f: 0.8, fib: 2 },
  'salsa-soia': { kcal: 53, p: 8, c: 5, f: 0.6, fib: 0.8 },
  tahin: { kcal: 595, p: 17, c: 21, f: 54, fib: 9 },
  miele: { kcal: 304, p: 0.3, c: 82, f: 0, fib: 0.2 },
  // --- verdura ---
  aglio: { kcal: 149, p: 6, c: 33, f: 0.5, fib: 2.1 },
  cipolla: { kcal: 40, p: 1.1, c: 9, f: 0.1, fib: 1.7 },
  cipollotto: { kcal: 32, p: 1.8, c: 7, f: 0.2, fib: 2.6 },
  carota: { kcal: 41, p: 0.9, c: 10, f: 0.2, fib: 2.8 },
  sedano: { kcal: 16, p: 0.7, c: 3, f: 0.2, fib: 1.6 },
  'broccoli-germogli': { kcal: 35, p: 3, c: 6, f: 0.4, fib: 2.5 },
  'germogli-misti': { kcal: 30, p: 3, c: 4, f: 0.5, fib: 2 },
  spinaci: { kcal: 23, p: 2.9, c: 3.6, f: 0.4, fib: 2.2 },
  'spinaci-surgelati': { kcal: 28, p: 3, c: 4, f: 0.5, fib: 2.5 },
  rucola: { kcal: 25, p: 2.6, c: 3.7, f: 0.7, fib: 1.6 },
  'cavolo-nero': { kcal: 35, p: 2.8, c: 5, f: 0.6, fib: 3 },
  'cavolo-cappuccio': { kcal: 25, p: 1.3, c: 6, f: 0.1, fib: 2.5 },
  cavolfiore: { kcal: 25, p: 1.9, c: 5, f: 0.3, fib: 2 },
  broccolo: { kcal: 34, p: 2.8, c: 7, f: 0.4, fib: 2.6 },
  verza: { kcal: 27, p: 2, c: 5, f: 0.1, fib: 3 },
  zucchine: { kcal: 17, p: 1.2, c: 3.1, f: 0.3, fib: 1 },
  melanzane: { kcal: 25, p: 1, c: 6, f: 0.2, fib: 3 },
  peperoni: { kcal: 31, p: 1, c: 6, f: 0.3, fib: 2.1 },
  pomodori: { kcal: 18, p: 0.9, c: 3.9, f: 0.2, fib: 1.2 },
  pomodorini: { kcal: 18, p: 0.9, c: 3.9, f: 0.2, fib: 1.2 },
  'pomodori-pelati': { kcal: 32, p: 1.6, c: 7, f: 0.3, fib: 1.9 },
  cetriolo: { kcal: 15, p: 0.7, c: 3.6, f: 0.1, fib: 0.5 },
  finocchio: { kcal: 31, p: 1.2, c: 7, f: 0.2, fib: 3.1 },
  lattuga: { kcal: 15, p: 1.4, c: 2.9, f: 0.2, fib: 1.3 },
  funghi: { kcal: 22, p: 3.1, c: 3.3, f: 0.3, fib: 1 },
  'patata-dolce': { kcal: 86, p: 1.6, c: 20, f: 0.1, fib: 3 },
  prezzemolo: { kcal: 36, p: 3, c: 6, f: 0.8, fib: 3.3 },
  basilico: { kcal: 23, p: 3.2, c: 2.7, f: 0.6, fib: 1.6 },
  // --- frutta ---
  limone: { kcal: 29, p: 1.1, c: 9, f: 0.3, fib: 2.8 },
  mela: { kcal: 52, p: 0.3, c: 14, f: 0.2, fib: 2.4 },
  pera: { kcal: 57, p: 0.4, c: 15, f: 0.1, fib: 3.1 },
  arancia: { kcal: 47, p: 0.9, c: 12, f: 0.1, fib: 2.4 },
  mandarino: { kcal: 53, p: 0.8, c: 13, f: 0.3, fib: 1.8 },
  kiwi: { kcal: 61, p: 1.1, c: 15, f: 0.5, fib: 3 },
  banana: { kcal: 89, p: 1.1, c: 23, f: 0.3, fib: 2.6 },
  pesca: { kcal: 39, p: 0.9, c: 10, f: 0.3, fib: 1.5 },
  anguria: { kcal: 30, p: 0.6, c: 8, f: 0.2, fib: 0.4 },
  melone: { kcal: 34, p: 0.8, c: 8, f: 0.2, fib: 0.9 },
  uva: { kcal: 69, p: 0.7, c: 18, f: 0.2, fib: 0.9 },
  uvetta: { kcal: 299, p: 3, c: 79, f: 0.5, fib: 3.7 },
  // --- proteine / pesce ---
  uova: { kcal: 143, p: 13, c: 0.7, f: 9.5, fib: 0 },
  'petto-pollo': { kcal: 165, p: 31, c: 0, f: 3.6, fib: 0 },
  'fesa-tacchino': { kcal: 135, p: 29, c: 0, f: 2, fib: 0 },
  'tonno-naturale': { kcal: 116, p: 26, c: 0, f: 1, fib: 0 },
  'sgombro-naturale': { kcal: 180, p: 20, c: 0, f: 11, fib: 0 },
  'sardine-olio': { kcal: 208, p: 24, c: 0, f: 11, fib: 0 },
  'salmone-fresco': { kcal: 208, p: 20, c: 0, f: 13, fib: 0 },
  'salmone-affumicato': { kcal: 117, p: 18, c: 0, f: 4, fib: 0 },
  'gamberetti-surgelati': { kcal: 85, p: 20, c: 0, f: 0.5, fib: 0 },
  'merluzzo-surgelato': { kcal: 82, p: 18, c: 0, f: 0.7, fib: 0 },
  'platessa-surgelata': { kcal: 86, p: 17, c: 0, f: 1.5, fib: 0 },
  // --- latticini ---
  'yogurt-greco': { kcal: 65, p: 10, c: 4, f: 1.5, fib: 0 },
  'yogurt-intero': { kcal: 61, p: 3.5, c: 4.7, f: 3.3, fib: 0 },
  skyr: { kcal: 63, p: 11, c: 4, f: 0.2, fib: 0 },
  ricotta: { kcal: 150, p: 8.8, c: 3, f: 11, fib: 0 },
  feta: { kcal: 264, p: 14, c: 4, f: 21, fib: 0 },
  parmigiano: { kcal: 392, p: 36, c: 0, f: 29, fib: 0 },
  mozzarella: { kcal: 253, p: 18, c: 2.2, f: 19, fib: 0 },
  latte: { kcal: 46, p: 3.3, c: 4.8, f: 1.6, fib: 0 },
  // --- cereali (a secco, come conservati) ---
  avena: { kcal: 389, p: 17, c: 66, f: 7, fib: 10 },
  'pane-integrale': { kcal: 250, p: 9, c: 43, f: 3, fib: 6 },
  'fette-biscottate-integrali': { kcal: 390, p: 12, c: 70, f: 7, fib: 8 },
  orzo: { kcal: 352, p: 10, c: 73, f: 1.5, fib: 15 },
  farro: { kcal: 340, p: 15, c: 67, f: 2.5, fib: 8 },
  'riso-integrale': { kcal: 360, p: 7.5, c: 77, f: 2.7, fib: 3.5 },
  quinoa: { kcal: 368, p: 14, c: 64, f: 6, fib: 7 },
  'pasta-integrale': { kcal: 348, p: 13, c: 67, f: 2.5, fib: 8 },
  'cous-cous-integrale': { kcal: 376, p: 13, c: 77, f: 1, fib: 8 },
  'gallette-riso': { kcal: 387, p: 8, c: 82, f: 3, fib: 4 },
  // --- legumi ---
  'ceci-lessati': { kcal: 164, p: 9, c: 27, f: 2.6, fib: 7.6 },
  'fagioli-cannellini': { kcal: 120, p: 8, c: 21, f: 0.6, fib: 6 },
  'fagioli-borlotti': { kcal: 130, p: 9, c: 22, f: 0.6, fib: 8 },
  'lenticchie-secche': { kcal: 352, p: 25, c: 60, f: 1, fib: 11 },
  'lenticchie-lessate': { kcal: 116, p: 9, c: 20, f: 0.4, fib: 8 },
  'edamame-surgelati': { kcal: 121, p: 12, c: 9, f: 5, fib: 5 },
  hummus: { kcal: 166, p: 8, c: 14, f: 10, fib: 6 },
  // --- frutta secca / semi ---
  noci: { kcal: 654, p: 15, c: 14, f: 65, fib: 7 },
  mandorle: { kcal: 579, p: 21, c: 22, f: 50, fib: 12 },
  nocciole: { kcal: 628, p: 15, c: 17, f: 61, fib: 10 },
  pistacchi: { kcal: 560, p: 20, c: 28, f: 45, fib: 10 },
  'semi-chia': { kcal: 486, p: 17, c: 42, f: 31, fib: 34 },
  'semi-lino': { kcal: 534, p: 18, c: 29, f: 42, fib: 27 },
  'semi-zucca': { kcal: 559, p: 30, c: 11, f: 49, fib: 6 },
  'semi-girasole': { kcal: 584, p: 21, c: 20, f: 51, fib: 9 },
  'burro-arachidi': { kcal: 588, p: 25, c: 20, f: 50, fib: 6 },
  // --- fermentati / bevande / extra ---
  crauti: { kcal: 19, p: 0.9, c: 4.3, f: 0.1, fib: 2.9 },
  kimchi: { kcal: 23, p: 1.1, c: 4, f: 0.5, fib: 1.6 },
  kefir: { kcal: 50, p: 3.4, c: 5, f: 1.5, fib: 0 },
  'te-verde': { kcal: 1, p: 0, c: 0, f: 0, fib: 0 },
  matcha: { kcal: 300, p: 30, c: 40, f: 5, fib: 30 },
  caffe: { kcal: 1, p: 0, c: 0, f: 0, fib: 0 },
  'cacao-amaro': { kcal: 228, p: 20, c: 58, f: 14, fib: 37 },
  'cioccolato-85': { kcal: 600, p: 9, c: 30, f: 46, fib: 11 },
  spirulina: { kcal: 290, p: 57, c: 24, f: 8, fib: 4 },
};

// Peso (g) di 1 "pz" per gli ingredienti usati a pezzo.
export const PIECE_G = {
  uova: 55,
  banana: 120,
  limone: 60,
  cipolla: 110,
  cipollotto: 15,
  mela: 150,
  pera: 170,
  arancia: 180,
  mandarino: 75,
  kiwi: 75,
  pesca: 150,
  'gallette-riso': 9,
};

// Override per cucchiai/cucchiaini dove la densità cambia (altrimenti 13 / 5 g).
const CUCCHIAI_G = { 'olio-evo': 13.5, tahin: 15, 'burro-arachidi': 16, 'salsa-soia': 16, 'aceto-mele': 15 };
const CUCCHIAINI_G = { miele: 7, tahin: 6, 'cacao-amaro': 5, 'olio-evo': 4.5 };

// Converte (id, qty, unit) in grammi.
export function gramsOf(id, qty, unit) {
  switch (unit) {
    case 'g':
    case 'ml':
      return qty * 1;
    case 'pz':
      return qty * (PIECE_G[id] ?? 100);
    case 'spicchi':
      return qty * 3;
    case 'bustine':
      return 0;
    case 'cucchiai':
      return qty * (CUCCHIAI_G[id] ?? 13);
    case 'cucchiaini':
      return qty * (CUCCHIAINI_G[id] ?? 5);
    default:
      return qty * 1;
  }
}

// Calcola i macro di una ricetta. Ritorna anche gli ingredienti senza dati.
export function computeMacros(recipe) {
  let kcal = 0, p = 0, c = 0, f = 0, fib = 0;
  const missing = [];
  for (const ri of recipe.ingredients) {
    const n = NUTR[ri.ingredientId];
    if (!n) {
      missing.push(ri.ingredientId);
      continue;
    }
    const g = gramsOf(ri.ingredientId, ri.qty, ri.unit) / 100;
    kcal += n.kcal * g;
    p += n.p * g;
    c += n.c * g;
    f += n.f * g;
    fib += n.fib * g;
  }
  return {
    kcal: Math.round(kcal),
    protein: Math.round(p),
    carbs: Math.round(c),
    fat: Math.round(f),
    fiber: Math.round(fib),
    missing,
  };
}
