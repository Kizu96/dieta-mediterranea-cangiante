// ===========================================================================
// MENÙ DEDICATO DEL PREP DAY — pensato per DURARE tutta la settimana lavorativa.
//
// Il prep day NON è il piano stagionale riordinato: è un menù a sé. La domenica
// cucini in una sessione 5 pranzi da ufficio scelti apposta perché reggano fino
// a venerdì:
//   • Lun–Mar = piatti che si tengono in FRIGO (mangiati a inizio settimana);
//   • Mer–Gio–Ven = piatti CONGELABILI (surgelati domenica, in frigo la sera
//     prima, scaldati al microonde in ufficio).
// Indipendente da estate/inverno (sono piatti che funzionano tutto l'anno,
// scaldati al lavoro). Tutti gli id esistono in recipes.ts.
// ===========================================================================

// Ordine Lun→Ven. I primi due si conservano in frigo, gli ultimi tre si congelano.
export const PREP_MENU: string[] = [
  'pranzo-orzo-pollo-feta', // Lun — insalata di orzo, frigo fino a 3 gg
  'pranzo-ceci-tonno', // Mar — insalata ceci e tonno, frigo fino a 2 gg
  'pranzo-zuppa-lenticchie', // Mer — zuppa, congelabile
  'pranzo-zuppa-lenticchie-farro', // Gio — zuppa, congelabile
  'pranzo-farro-pollo-verdure', // Ven — bowl di farro, congelabile (freezer 2 mesi)
];
