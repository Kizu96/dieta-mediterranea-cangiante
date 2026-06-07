// Etichette/format condivisi in italiano (UI helper, non logica dati).
import type { Category, Equipment, MealSlot, Season } from '../data/types';

export const SLOT_LABEL: Record<MealSlot, string> = {
  colazione: 'Colazione',
  pranzo: 'Pranzo',
  spuntino: 'Spuntino',
  cena: 'Cena',
};

export const SLOT_ORDER: MealSlot[] = ['colazione', 'pranzo', 'spuntino', 'cena'];

export const SEASON_LABEL: Record<Season, string> = {
  estate: 'Estate',
  inverno: 'Inverno',
};

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  padella: 'Padella',
  pentola: 'Pentola',
  microonde: 'Microonde',
  friggitrice: 'Friggitrice ad aria',
  frullatore: 'Frullatore',
  nessuna: 'Senza cottura',
};

export const CATEGORY_LABEL: Record<Category, string> = {
  verdura: 'Verdura',
  frutta: 'Frutta',
  proteine: 'Proteine',
  pesce: 'Pesce',
  latticini: 'Latticini',
  cereali: 'Cereali',
  legumi: 'Legumi',
  fruttaSecca: 'Frutta secca',
  condimenti: 'Condimenti',
  fermentati: 'Fermentati',
  bevande: 'Bevande',
  dispensa: 'Dispensa',
  surgelati: 'Surgelati',
};

// Giorni della settimana in italiano (abbreviati), Lun..Dom.
export const WEEKDAY_SHORT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

const MONTHS = [
  'gennaio',
  'febbraio',
  'marzo',
  'aprile',
  'maggio',
  'giugno',
  'luglio',
  'agosto',
  'settembre',
  'ottobre',
  'novembre',
  'dicembre',
];
const DAYS_LONG = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];

/** Es. "mercoledì 4 giugno 2026" (capitalizzato). */
export function formatLongDate(d: Date): string {
  const s = `${DAYS_LONG[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Es. "4 giu". */
export function formatShortDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

/** Indice 0=Lun..6=Dom dato un Date (getDay() è 0=Dom). */
export function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

/** Formatta una quantità rimuovendo gli zeri inutili (1.0 -> "1", 0.5 -> "0,5"). */
export function formatQty(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return String(rounded).replace('.', ',');
}
