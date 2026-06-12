import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Package, Refrigerator, ShoppingBasket, Snowflake, Star } from 'lucide-react';
import type { Category, Ingredient, Season } from '../data/types';
import { ingredients } from '../data/ingredients';
import { db } from '../db/db';
import { buildOverrideMap } from '../lib/planning';
import { surplusIngredients } from '../lib/shopping';
import { isQtyTracked, packPresetsFor, setPantryQty } from '../lib/pantryQty';
import { markFrozen, markThawedToFridge, perishableFridgeDays } from '../lib/freshness';
import { Card } from '../components/Card';
import { CheckRow } from '../components/CheckRow';
import { Modal } from '../components/Modal';
import { QtyBar } from '../components/QtyBar';
import { useHaveSet, usePantryQty, usePantryLevels, setPantryHave } from '../components/usePantry';
import { useIntensity } from '../components/useIntensity';
import { useExtraRecipes } from '../components/useExtraRecipes';
import { CATEGORY_LABEL, formatQty } from '../components/labels';

const CATEGORY_ORDER: Category[] = [
  'verdura',
  'frutta',
  'proteine',
  'pesce',
  'legumi',
  'cereali',
  'latticini',
  'fruttaSecca',
  'fermentati',
  'condimenti',
  'bevande',
  'surgelati',
  'dispensa',
];

export function Pantry({ season }: { season: Season }) {
  const [q, setQ] = useState('');
  const haveSet = useHaveSet();
  const qtyMap = usePantryQty();
  const levels = usePantryLevels();
  const pantryRows = useLiveQuery(() => db.pantry.toArray(), [], []);
  const frozenSet = useMemo(
    () => new Set((pantryRows ?? []).filter((p) => p.frozen).map((p) => p.ingredientId)),
    [pantryRows],
  );
  const { factor } = useIntensity();
  const { includeExtra } = useExtraRecipes();
  const overrideRows = useLiveQuery(() => db.mealOverride.toArray(), [], []);
  const overrides = useMemo(() => buildOverrideMap(overrideRows ?? []), [overrideRows]);
  const today = useMemo(() => new Date(), []);

  // "Abbondante" = in dispensa più di quanto il piano dei prossimi 7 giorni consumerà.
  const surplus = useMemo(
    () => surplusIngredients(qtyMap, today, 7, season, includeExtra, overrides, factor),
    [qtyMap, today, season, includeExtra, overrides, factor],
  );

  // Editor quantità (correzione rapida quando il conteggio diverge dalla realtà).
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [editQty, setEditQty] = useState('');

  const openEditor = (ing: Ingredient) => {
    const current = qtyMap.get(ing.id);
    setEditQty(current != null ? String(current).replace('.', ',') : '');
    setEditing(ing);
  };

  const saveQty = async () => {
    if (!editing) return;
    const value = parseFloat(editQty.replace(',', '.'));
    if (!isFinite(value) || value < 0) return;
    await setPantryQty(editing.id, value);
    setEditing(null);
  };

  const grouped = useMemo(() => {
    const term = q.trim().toLowerCase();
    const map = new Map<Category, typeof ingredients>();
    for (const ing of ingredients) {
      if (term && !ing.name.toLowerCase().includes(term)) continue;
      const arr = map.get(ing.category) ?? [];
      arr.push(ing);
      map.set(ing.category, arr);
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
      category: c,
      items: (map.get(c) ?? []).slice().sort((a, b) => a.name.localeCompare(b.name)),
    }));
  }, [q]);

  // Segna tutti gli staple come disponibili.
  const markStaples = async () => {
    const now = Date.now();
    await db.pantry.bulkPut(
      ingredients
        .filter((i) => i.staple)
        .map((i) => ({ ingredientId: i.id, have: true, updatedAt: now })),
    );
  };

  return (
    <div>
      <div className="field">
        <input
          type="search"
          placeholder="🔍 Cerca ingrediente…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Cerca ingrediente"
        />
      </div>

      <button className="btn secondary block" onClick={markStaples} style={{ marginBottom: 14 }}>
        <Star size={16} className="ic" /> Segna tutti gli essenziali come disponibili
      </button>

      {grouped.length === 0 ? (
        <div className="empty">
          <ShoppingBasket size={34} />
          Nessun ingrediente trovato.
        </div>
      ) : (
        grouped.map((g) => (
          <Card key={g.category} title={CATEGORY_LABEL[g.category]}>
            <ul className="clean">
              {g.items.map((ing) => {
                const qty = qtyMap.get(ing.id);
                const showQtyBtn = isQtyTracked(ing) && (haveSet.has(ing.id) || qty != null);
                return (
                  <li key={ing.id} style={{ display: 'flex', alignItems: 'stretch', gap: 6 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <CheckRow
                        checked={haveSet.has(ing.id)}
                        title={
                          <>
                            {ing.name}{' '}
                            {ing.staple && (
                              <span className="pill" style={{ marginLeft: 4 }}><Star size={11} className="ic" /> base</span>
                            )}
                            {surplus.has(ing.id) && (
                              <span className="pill olive" style={{ marginLeft: 4 }}>
                                <Package size={11} className="ic" /> abbondante
                              </span>
                            )}
                            {frozenSet.has(ing.id) && (
                              <span className="pill" style={{ marginLeft: 4 }}><Snowflake size={11} className="ic" /> freezer</span>
                            )}
                          </>
                        }
                        detail={`${ing.storage} · ${ing.shelfLife}`}
                        onToggle={() => setPantryHave(ing.id, !haveSet.has(ing.id))}
                      />
                      {levels.has(ing.id) && (
                        <QtyBar
                          qty={levels.get(ing.id)!.qty}
                          full={levels.get(ing.id)!.full}
                          label={`${ing.name}: ${formatQty(levels.get(ing.id)!.qty)} ${ing.unit} su ${formatQty(levels.get(ing.id)!.full)}`}
                        />
                      )}
                    </div>
                    {showQtyBtn && (
                      <button
                        className="btn ghost"
                        style={{ flex: '0 0 auto', alignSelf: 'center', minHeight: 38, padding: '0 10px', fontSize: '0.82rem' }}
                        onClick={() => openEditor(ing)}
                        aria-label={`Quantità di ${ing.name}`}
                      >
                        {qty != null ? `${formatQty(qty)} ${ing.unit}` : '✎ qtà'}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        ))
      )}

      {editing && (
        <Modal title={`Quantità · ${editing.name}`} onClose={() => setEditing(null)}>
          <p className="small muted" style={{ marginTop: -4 }}>
            Quanto ne hai davvero in dispensa ({editing.unit})? Si scala da solo quando segni un
            pasto come mangiato; correggi qui se il conteggio diverge dalla realtà.
          </p>
          <div className="pill-row" style={{ marginBottom: 12 }}>
            {packPresetsFor(editing).map((p) => (
              <button
                key={p}
                className={parseFloat(editQty.replace(',', '.')) === p ? 'btn' : 'btn ghost'}
                style={{ minHeight: 38, padding: '0 14px' }}
                onClick={() => setEditQty(String(p))}
              >
                {formatQty(p)} {editing.unit}
              </button>
            ))}
          </div>
          <div className="row">
            <div className="field grow" style={{ marginBottom: 0 }}>
              <label htmlFor="pantry-qty">Quantità ({editing.unit})</label>
              <input
                id="pantry-qty"
                type="number"
                inputMode="decimal"
                min="0"
                value={editQty.replace(',', '.')}
                onChange={(e) => setEditQty(e.target.value)}
              />
            </div>
            <button className="btn" onClick={saveQty} style={{ flex: '0 0 auto' }}>
              Salva
            </button>
          </div>
          {perishableFridgeDays(editing) != null && haveSet.has(editing.id) && (
            <button
              className="btn ghost block"
              style={{ marginTop: 10 }}
              onClick={async () => {
                if (frozenSet.has(editing.id)) await markThawedToFridge(editing.id);
                else await markFrozen(editing.id);
                setEditing(null);
              }}
            >
              {frozenSet.has(editing.id) ? (
                <><Refrigerator size={16} className="ic" /> L'ho messo in frigo a scongelare</>
              ) : (
                <><Snowflake size={16} className="ic" /> Segna come messo in freezer</>
              )}
            </button>
          )}
          {qtyMap.has(editing.id) && (
            <button
              className="btn ghost block"
              style={{ marginTop: 10 }}
              onClick={async () => {
                await setPantryQty(editing.id, null);
                setEditing(null);
              }}
            >
              Smetti di contare (torna a ✓/✗)
            </button>
          )}
        </Modal>
      )}
    </div>
  );
}
