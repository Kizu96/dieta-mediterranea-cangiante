// ===========================================================================
// MENÙ DEDICATO DEL PREP DAY — pensato per DURARE tutta la settimana lavorativa.
//
// Il prep day NON è il piano stagionale riordinato: è un menù a sé. La domenica
// cucini in una sessione i pranzi da ufficio scelti apposta perché reggano fino
// a venerdì e si mangino FREDDI (estate-friendly): niente zuppe calde.
//
// ROTAZIONE: il menù prep non è più fisso. Pesca da un POOL curato di pranzi
// freddi/conservabili (`PREP_POOL`) e RUOTA: quando confermi di aver preparato
// un pranzo, quel posto avanza al piatto successivo del pool (varietà), mentre i
// pranzi non preparati restano in coda. Lo stato corrente dei 5 posti vive nella
// tabella sincronizzata `prepSlots` (vedi db.ts); `PREP_MENU` è solo il seed
// iniziale = i primi 5 del pool. Tutti gli id esistono in recipes.ts.
// ===========================================================================

// Pool curato di pranzi adatti al prep: da ufficio, si mangiano FREDDI e si
// conservano (frigo ≥2 gg o base congelabile). Ordine = ciclo di rotazione.
// I PRIMI 5 sono il menù prep di partenza (Lun→Ven).
export const PREP_POOL: string[] = [
  'pranzo-orzo-pollo-feta', // insalata di orzo, pollo e feta — frigo 3 gg
  'pranzo-ceci-tonno', // insalata di ceci e tonno — frigo 2 gg
  'pranzo-polpette-lenticchie', // polpette di lenticchie (air fryer), fredde — frigo 3 gg
  'pranzo-insalata-lenticchie-farro', // insalata fredda lenticchie+farro — base congelabile
  'pranzo-farro-pollo-verdure', // insalata di farro con pollo — frigo 2-3 gg, congelabile
  'pranzo-cous-cous-cannellini', // cous cous con tonno e cannellini — frigo 3 gg
  'pranzo-riso-ceci-feta', // insalata di riso con ceci e feta — frigo 3 gg
  'pranzo-lenticchie-feta-estiva', // insalata di lenticchie con feta — frigo 3 gg
  'pranzo-orzo-feta-verdure', // insalata di orzo, feta e finocchio — frigo 3 gg
  'pranzo-cous-cous-feta', // cous cous con feta e cetriolo — frigo 2 gg
  'pranzo-caponata-melanzane-ceci', // caponata di melanzane e ceci — frigo 3 gg, ottima fredda
  'pranzo-finocchio-arancia-tonno', // insalata di finocchio, arancia e tonno — frigo 2 gg
];

// Seed iniziale dei 5 posti (Lun→Ven) = i primi 5 del pool. Da qui in poi lo
// stato vero vive in `prepSlots` e ruota; questo serve solo a popolarlo la prima volta.
export const PREP_MENU: string[] = PREP_POOL.slice(0, 5);
