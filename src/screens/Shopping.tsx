import { useCallback, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Archive, PackagePlus, Plus, Share2, ShoppingCart, Trash2 } from 'lucide-react';
import type { Season } from '../data/types';
import { db } from '../db/db';
import { addDays, buildOverrideMap, toISODate } from '../lib/planning';
import { buildShoppingList, type ShoppingItem } from '../lib/shopping';
import { addPurchaseToPantry, isQtyTracked, packPresetsFor } from '../lib/pantryQty';
import { Card } from '../components/Card';
import { CheckRow } from '../components/CheckRow';
import { Modal } from '../components/Modal';
import { QtyBar } from '../components/QtyBar';
import { useHaveSet, usePantryQty, usePantryLevels } from '../components/usePantry';
import { isVacationDay, useVacation } from '../lib/vacation';
import { useIntensity } from '../components/useIntensity';
import { useExtraRecipes } from '../components/useExtraRecipes';
import { CATEGORY_LABEL, formatQty } from '../components/labels';

// --- Voci libere: helper a livello modulo (fuori dal render) -----------------
async function addCustomItem(
  rows: { id?: number; name: string }[],
  rawName: string,
): Promise<boolean> {
  const name = rawName.trim();
  if (!name) return false;
  // Niente doppioni (case-insensitive): se esiste la riattivo come non comprata.
  const existing = rows.find((c) => c.name.toLowerCase() === name.toLowerCase());
  if (existing?.id != null) {
    await db.customShopping.update(existing.id, { bought: false, updatedAt: Date.now() });
  } else {
    await db.customShopping.add({ name, bought: false, updatedAt: Date.now() });
  }
  return true;
}

async function toggleCustom(id: number, bought: boolean): Promise<void> {
  await db.customShopping.update(id, { bought, updatedAt: Date.now() });
}

async function removeCustom(id: number): Promise<void> {
  await db.customShopping.delete(id);
}

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

  // Vacanza: il giorno di partenza della lista è nel periodo → piano in pausa
  // (restano solo le voci libere).
  const { vacation } = useVacation();
  const paused = isVacationDay(toISODate(start), vacation);

  const groups = useMemo(
    () =>
      paused
        ? []
        : buildShoppingList(haveSet, start, days, season, includeExtra, overrides, qtyMap, factor),
    [paused, haveSet, start, days, season, includeExtra, overrides, qtyMap, factor],
  );

  const boughtRows = useLiveQuery(() => db.shopping.toArray(), [], []);
  const boughtMap = new Map(
    (boughtRows ?? []).filter((s) => s.bought).map((s) => [s.ingredientId, s]),
  );

  // Voci LIBERE (detersivo, carta cucina…): non vengono dal piano, restano in
  // lista finché non le elimini; le spunte si sincronizzano come il resto.
  const customRows = useLiveQuery(() => db.customShopping.orderBy('name').toArray(), [], []);
  const customs = customRows ?? [];
  const [newItem, setNewItem] = useState('');
  const addCustom = async () => {
    const added = await addCustomItem(customRows ?? [], newItem);
    if (added) setNewItem('');
  };

  // Scelta della quantità comprata (formati pacco) per gli ingredienti tracciati.
  const [buying, setBuying] = useState<ShoppingItem | null>(null);
  const [buyQty, setBuyQty] = useState('');
  const [shareMsg, setShareMsg] = useState('');

  // Esporta la lista (voci non ancora comprate) come testo: condivisione di
  // sistema sul telefono, appunti sul PC.
  const shareList = async () => {
    const lines: string[] = [`🛒 Lista spesa · ${mode === 'domani' ? 'domani' : `${days} giorni`}`];
    for (const g of groups) {
      const todo = g.items.filter((it) => !boughtMap.has(it.ingredient.id));
      if (todo.length === 0) continue;
      lines.push('', CATEGORY_LABEL[g.category].toUpperCase());
      for (const it of todo) lines.push(`- ${it.ingredient.name} — ${formatQty(it.qtyToBuy)} ${it.unit}`);
    }
    const customTodo = customs.filter((c) => !c.bought);
    if (customTodo.length > 0) {
      lines.push('', 'ALTRO');
      for (const c of customTodo) lines.push(`- ${c.name}`);
    }
    const text = lines.join('\n');
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setShareMsg('Lista copiata negli appunti ✅');
      setTimeout(() => setShareMsg(''), 4000);
    } catch {
      // condivisione annullata dall'utente: nessun errore da mostrare
    }
  };

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
      // Apre il selettore: pre-compilato col formato pacco più vicino al fabbisogno
      // (il formato confezione dell'ingrediente, se dichiarato, ha la precedenza).
      const presets = packPresetsFor(it.ingredient);
      const suggested =
        it.ingredient.packSize ??
        (presets.find((p) => p >= it.qtyToBuy) ?? presets[presets.length - 1]);
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

  // Sposta i "comprati" in dispensa (sommando le quantità) e pulisce i flag di
  // spesa; le voci libere comprate escono dalla lista (sono cose fatte).
  const addBoughtToPantry = async () => {
    const rows = (boughtRows ?? []).filter((s) => s.bought);
    const customBought = customs.filter((c) => c.bought && c.id != null);
    if (rows.length === 0 && customBought.length === 0) return;
    for (const r of rows) await addPurchaseToPantry(r.ingredientId, r.qty);
    await db.shopping.bulkDelete(rows.map((r) => r.ingredientId));
    await db.customShopping.bulkDelete(customBought.map((c) => c.id as number));
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

      {paused ? (
        <div className="banner info">
          🏖️ <b>Modalità vacanza:</b> la spesa del piano è in pausa fino al {vacation?.to}.
          Le voci libere qui sotto restano disponibili.
        </div>
      ) : totalItems === 0 ? (
        <div className="empty">
          <ShoppingCart size={34} />
          Niente da comprare per il piano: hai già tutto in dispensa!
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
                              <ShoppingCart size={12} className="ic" /> comprato: {formatQty(bought.qty)} {it.unit}
                            </span>
                          )}
                          {it.ingredient.storage && (
                            <span className="check-storage">
                              <Archive size={12} className="ic" /> {it.ingredient.storage}
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

        </>
      )}

      <Card title="Altro (voci libere)" icon={<Plus />}>
        <p className="small muted" style={{ marginTop: -4 }}>
          Cose fuori dal piano alimentare (detersivo, sacchetti gelo…): restano in lista
          finché non le elimini e finiscono anche nella lista condivisa.
        </p>
        <div className="row" style={{ marginBottom: customs.length > 0 ? 10 : 0 }}>
          <div className="field grow" style={{ marginBottom: 0 }}>
            <label htmlFor="custom-item">Aggiungi voce</label>
            <input
              id="custom-item"
              type="text"
              value={newItem}
              placeholder="es. Carta da cucina"
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addCustom();
              }}
            />
          </div>
          <button className="btn" onClick={addCustom} disabled={!newItem.trim()} style={{ flex: '0 0 auto' }}>
            <Plus size={16} className="ic" /> Aggiungi
          </button>
        </div>
        {customs.length > 0 && (
          <ul className="clean">
            {customs.map((c) => (
              <li key={c.id} style={{ display: 'flex', alignItems: 'stretch', gap: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <CheckRow
                    checked={c.bought}
                    title={c.name}
                    onToggle={() => c.id != null && toggleCustom(c.id, !c.bought)}
                  />
                </div>
                <button
                  className="icon-btn"
                  style={{ alignSelf: 'center', width: 36, height: 36 }}
                  aria-label={`Elimina ${c.name}`}
                  onClick={() => c.id != null && removeCustom(c.id)}
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <button
        className="btn block"
        onClick={addBoughtToPantry}
        disabled={boughtCount === 0 && customs.every((c) => !c.bought)}
        style={{ marginBottom: 8 }}
      >
        <PackagePlus size={16} className="ic" /> Aggiungi i comprati alla dispensa ({boughtCount + customs.filter((c) => c.bought).length})
      </button>
      <button
        className="btn secondary block"
        onClick={shareList}
        disabled={boughtCount === totalItems && customs.every((c) => c.bought)}
        style={{ marginBottom: 8 }}
      >
        <Share2 size={16} className="ic" /> Condividi / copia la lista
      </button>
      {shareMsg && <p className="small muted center">{shareMsg}</p>}

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
            {packPresetsFor(buying.ingredient).map((p) => (
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
