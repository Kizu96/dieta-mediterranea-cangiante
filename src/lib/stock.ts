// Stato scorta di un ingrediente per l'evidenziazione nelle liste:
//   'out'  → non ne hai (rosso, «manca»)
//   'low'  → ne hai ma ≤ 20% del pieno (ambra, «sta per finire»)
//   'ok'   → scorta sufficiente (nessuna evidenziazione)
// Soglia 20% = la stessa della barra dispensa (QtyBar), per coerenza visiva.
import type { QtyMap } from './shopping';

export type StockLevel = 'out' | 'low' | 'ok';

export const LOW_STOCK_RATIO = 0.2;

/** Stato scorta da quantità reali (qty/qtyFull) o, in mancanza, da ✓/✗. */
export function stockStatus(
  id: string,
  haveSet: Set<string>,
  qtyMap?: QtyMap,
  levels?: Map<string, { qty: number; full: number }>,
): StockLevel {
  const lvl = levels?.get(id);
  if (lvl != null) {
    if (lvl.qty <= 0) return 'out';
    return lvl.full > 0 && lvl.qty / lvl.full <= LOW_STOCK_RATIO ? 'low' : 'ok';
  }
  const qty = qtyMap?.get(id);
  if (qty != null) return qty <= 0 ? 'out' : 'ok'; // tracciato senza riferimento «pieno»
  return haveSet.has(id) ? 'ok' : 'out';
}
