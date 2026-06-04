import { useCallback, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Season } from '../data/types';
import { db } from '../db/db';
import { toISODate } from '../lib/planning';
import { buildShoppingList } from '../lib/shopping';
import { Card } from '../components/Card';
import { CheckRow } from '../components/CheckRow';
import { useHaveSet } from '../components/usePantry';
import { useIntensity } from '../components/useIntensity';
import { scaleQty } from '../lib/intensity';
import { CATEGORY_LABEL, formatQty } from '../components/labels';

export function Shopping({ season }: { season: Season }) {
  const [days, setDays] = useState<3 | 7>(7);
  const today = useMemo(() => new Date(), []);
  const haveSet = useHaveSet();
  const { factor } = useIntensity();

  const groups = useMemo(
    () => buildShoppingList(haveSet, today, days, season),
    [haveSet, today, days, season],
  );

  const boughtRows = useLiveQuery(() => db.shopping.toArray(), [], []);
  const boughtSet = new Set((boughtRows ?? []).filter((s) => s.bought).map((s) => s.ingredientId));

  const toggleBought = useCallback(
    async (ingredientId: string, bought: boolean) => {
      await db.shopping.put({ ingredientId, bought, updatedAt: Date.now() });
    },
    [],
  );

  // Sposta i "comprati" in dispensa (have=true) e pulisce i flag di spesa.
  const addBoughtToPantry = async () => {
    const ids = [...boughtSet];
    if (ids.length === 0) return;
    const now = Date.now();
    await db.pantry.bulkPut(ids.map((id) => ({ ingredientId: id, have: true, updatedAt: now })));
    await db.shopping.bulkDelete(ids);
  };

  const totalItems = groups.reduce((s, g) => s + g.items.length, 0);
  const boughtCount = groups.reduce(
    (s, g) => s + g.items.filter((i) => boughtSet.has(i.ingredient.id)).length,
    0,
  );

  return (
    <div>
      <div className="segmented">
        <button className={days === 3 ? 'active' : ''} onClick={() => setDays(3)}>
          Prossimi 3 giorni
        </button>
        <button className={days === 7 ? 'active' : ''} onClick={() => setDays(7)}>
          Prossimi 7 giorni
        </button>
      </div>

      <p className="small muted">
        Da oggi ({toISODate(today)}). Esclude ciò che è già in dispensa.
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
                {g.items.map((it) => (
                  <CheckRow
                    key={it.ingredient.id}
                    checked={boughtSet.has(it.ingredient.id)}
                    title={it.ingredient.name}
                    detail={`Serve circa ${formatQty(scaleQty(it.qty, factor))} ${it.unit}`}
                    onToggle={() => toggleBought(it.ingredient.id, !boughtSet.has(it.ingredient.id))}
                  />
                ))}
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
    </div>
  );
}
