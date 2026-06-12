import { useCallback, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Season } from '../data/types';
import { db } from '../db/db';
import { addDays, buildOverrideMap, toISODate } from '../lib/planning';
import { buildShoppingList, type ShoppingItem } from '../lib/shopping';
import { addPurchaseToPantry, isQtyTracked, PACK_PRESETS } from '../lib/pantryQty';
import { Card } from '../components/Card';
import { CheckRow } from '../components/CheckRow';
import { Modal } from '../components/Modal';
import { QtyBar } from '../components/QtyBar';
import { useHaveSet, usePantryQty, usePantryLevels } from '../components/usePantry';
import { useIntensity } from '../components/useIntensity';
import { useExtraRecipes } from '../components/useExtraRecipes';
import { CATEGORY_LABEL, formatQty } from '../components/labels';

export function Shopping({
  season,
  focusTomorrow = false,
}: {
  season: Season;
  focusTomorrow?: boolean;
}) {
  const [mode, setMode] = useState<'domani' | 3 | 7>(focusTomorrow ? 'domani' : 7);
  const today = useMemo(() => new Date(), []);
  const start = useMemo(() => (mode === 'domani' ? addDays(today, 1) : today), [mode, today]);
  const days = mode === 'domani' ? 1 : mode;
  const haveSet = useHaveSet();
  const qtyMap = usePantryQty();
  const levels = usePantryLevels();
  const { factor } = useIntensity();
  const { includeExtra } = useExtraRecipes();
  const overrideRows = useLiveQuery(() => db.mealOverride.toArray(), [], []);
  const overrides = useMemo(() => buildOverrideMap(overrideRows ?? []), [overrideRows]);

  const groups = useMemo(
    () => buildShoppingList(haveSet, start, days, season, includeExtra, overrides, qtyMap, factor),
    [haveSet, start, days, season, includeExtra, overrides, qtyMap, factor],
  );

  const boughtRows = useLiveQuery(() => db.shopping.toArray(), [], []);
  const boughtMap = new Map(
    (boughtRows ?? []).filter((s) => s.bought).map((s) => [s.ingredientId, s]),
  );

  // Scelta della quantità comprata (formati pacco) per gli ingredienti tracciati.
  const [buying, setBuying] = useState<ShoppingItem | null>(null);
  const [buyQty, setBuyQty] = useState('');

  const markBought = useCallback(async (ingredientId: string, qty?: number) => {
    await db.shopping.put({ ingredientId, bought: true, qty, updatedAt: Date.now() });
  }, []);

  const unmarkBought = useCallback(async (ingredientId: string) => {
    await db.shopping.put({ ingredientId, bought: false, updatedAt: Date.now() });
  }, []);

  const onRowToggle = (it: ShoppingItem) => {
    if (boughtMap.has(it.ingredient.id)) {
      unmarkBought(it.ingredient.id);
    } else if (isQtyTracked(it.ingredient)) {
      // Apre il selettore: pre-compilato col formato pacco più vicino al fabbisogno.
      const presets = PACK_PRESETS[it.ingredient.unit] ?? [];
      const suggested = presets.find((p) => p >= it.qtyToBuy) ?? presets[presets.length - 1];
      setBuyQty(String(suggested ?? Math.ceil(it.qtyToBuy)));
      setBuying(it);
    } else {
      markBought(it.ingredient.id);
    }
  };

  const confirmBuy = async () => {
    if (!buying) return;
    const qty = parseFloat(buyQty.replace(',', '.'));
    if (!isFinite(qty) || qty <= 0) return;
    await markBought(buying.ingredient.id, qty);
    setBuying(null);
  };

  // Sposta i "comprati" in dispensa (sommando le quantità) e pulisce i flag di spesa.
  const addBoughtToPantry = async () => {
    const rows = (boughtRows ?? []).filter((s) => s.bought);
    if (rows.length === 0) return;
    for (const r of rows) await addPurchaseToPantry(r.ingredientId, r.qty);
    await db.shopping.bulkDelete(rows.map((r) => r.ingredientId));
  };

  const totalItems = groups.reduce((s, g) => s + g.items.length, 0);
  const boughtCount = groups.reduce(
    (s, g) => s + g.items.filter((i) => boughtMap.has(i.ingredient.id)).length,
    0,
  );

  return (
    <div>
      <div className="segmented">
        <button className={mode === 'domani' ? 'active' : ''} onClick={() => setMode('domani')}>
          Solo domani
        </button>
        <button className={mode === 3 ? 'active' : ''} onClick={() => setMode(3)}>
          3 giorni
        </button>
        <button className={mode === 7 ? 'active' : ''} onClick={() => setMode(7)}>
          7 giorni
        </button>
      </div>

      <p className="small muted">
        {mode === 'domani'
          ? `Solo per i pasti di domani (${toISODate(start)}). Esclude ciò che è già in dispensa.`
          : `Da oggi (${toISODate(today)}). Esclude ciò che è già in dispensa.`}
        {totalItems > 0 && ` · ${boughtCount}/${totalItems} comprati`}
      </p>

      {totalItems === 0 ? (
        <div className="empty">
          <span className="emoji">🛒</span>
          Niente da comprare: hai già tutto in dispensa!
        </div>
      ) : (
        <>
          {groups.map((g) => (
            <Card key={g.category} title={CATEGORY_LABEL[g.category]}>
              <ul className="clean">
                {g.items.map((it) => {
                  const bought = boughtMap.get(it.ingredient.id);
                  return (
                    <CheckRow
                      key={it.ingredient.id}
                      checked={bought != null}
                      title={it.ingredient.name}
                      detail={
                        <>
                          {it.qtyHave != null && it.qtyHave > 0 ? (
                            <>
                              Serve {formatQty(it.qty)} {it.unit} · ne hai{' '}
                              {formatQty(it.qtyHave)} → compra ~{formatQty(it.qtyToBuy)} {it.unit}
                              {levels.has(it.ingredient.id) && (
                                <QtyBar
                                  qty={levels.get(it.ingredient.id)!.qty}
                                  full={levels.get(it.ingredient.id)!.full}
                                  label={`In dispensa: ${formatQty(it.qtyHave)} ${it.unit}`}
                                />
                              )}
                            </>
                          ) : (
                            <>
                              Serve circa {formatQty(it.qtyToBuy)} {it.unit}
                            </>
                          )}
                          {bought?.qty != null && (
                            <span className="check-storage">
                              🛒 comprato: {formatQty(bought.qty)} {it.unit}
                            </span>
                          )}
                          {it.ingredient.storage && (
                            <span className="check-storage">
                              🧺 {it.ingredient.storage}
                              {it.ingredient.shelfLife && ` · dura ${it.ingredient.shelfLife}`}
                            </span>
                          )}
                        </>
                      }
                      onToggle={() => onRowToggle(it)}
                    />
                  );
                })}
              </ul>
            </Card>
          ))}

          <button
            className="btn block"
            onClick={addBoughtToPantry}
            disabled={boughtCount === 0}
            style={{ marginBottom: 8 }}
          >
            ➕ Aggiungi i comprati alla dispensa ({boughtCount})
          </button>
        </>
      )}

      {buying && (
        <Modal title={`Quanto ne compri? · ${buying.ingredient.name}`} onClose={() => setBuying(null)}>
          <p className="small muted" style={{ marginTop: -4 }}>
            Serve {formatQty(buying.qty)} {buying.unit}
            {buying.qtyHave != null && buying.qtyHave > 0
              ? ` e ne hai ${formatQty(buying.qtyHave)}: mancano ~${formatQty(buying.qtyToBuy)} ${buying.unit}.`
              : '.'}{' '}
            Scegli il formato che compri davvero: la dispensa terrà il conto.
          </p>
          <div className="pill-row" style={{ marginBottom: 12 }}>
            {(PACK_PRESETS[buying.ingredient.unit] ?? []).map((p) => (
              <button
                key={p}
                className={parseFloat(buyQty.replace(',', '.')) === p ? 'btn' : 'btn ghost'}
                style={{ minHeight: 38, padding: '0 14px' }}
                onClick={() => setBuyQty(String(p))}
              >
                {formatQty(p)} {buying.ingredient.unit}
              </button>
            ))}
          </div>
          <div className="row">
            <div className="field grow" style={{ marginBottom: 0 }}>
              <label htmlFor="buy-qty">Altro ({buying.ingredient.unit})</label>
              <input
                id="buy-qty"
                type="number"
                inputMode="decimal"
                min="0"
                value={buyQty}
                onChange={(e) => setBuyQty(e.target.value)}
              />
            </div>
            <button className="btn" onClick={confirmBuy} style={{ flex: '0 0 auto' }}>
              ✓ Comprato
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
