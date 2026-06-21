// ===========================================================================
// MENÙ DEDICATO DEL PREP DAY — pensato per DURARE tutta la settimana lavorativa.
//
// Il prep day NON è il piano stagionale riordinato: è un menù a sé. La domenica
// cucini in una sessione 5 pranzi da ufficio scelti apposta perché reggano fino
// a venerdì:
//   • Lun–Mer = piatti che si tengono in FRIGO (cotti domenica, mangiati a
//     inizio settimana, niente freezer);
//   • Gio–Ven = piatto/base CONGELABILI (Gio si congela la base e si montano le
//     verdure crude la sera prima; Ven piatto surgelato).
// Pensati per mangiarsi FREDDI (estate-friendly): niente zuppe calde da scaldare.
// Tutti gli id esistono in recipes.ts; restano comunque validi tutto l'anno.
// ===========================================================================

// Ordine Lun→Ven. I primi tre si conservano in frigo, gli ultimi due si congelano.
export const PREP_MENU: string[] = [
  'pranzo-orzo-pollo-feta', // Lun — insalata di orzo, frigo fino a 3 gg
  'pranzo-ceci-tonno', // Mar — insalata ceci e tonno, frigo fino a 2 gg
  'pranzo-polpette-lenticchie', // Mer — polpette di lenticchie (air fryer), fredde, frigo fino a 3 gg
  'pranzo-insalata-lenticchie-farro', // Gio — insalata fredda lenticchie+farro (base congelabile, FRESCO)
  'pranzo-farro-pollo-verdure', // Ven — bowl di farro, congelabile (freezer 2 mesi)
];
