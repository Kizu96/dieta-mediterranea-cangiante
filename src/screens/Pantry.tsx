import { useMemo, useState } from 'react';
import type { Category } from '../data/types';
import { ingredients } from '../data/ingredients';
import { db } from '../db/db';
import { Card } from '../components/Card';
import { CheckRow } from '../components/CheckRow';
import { useHaveSet, setPantryHave } from '../components/usePantry';
import { CATEGORY_LABEL } from '../components/labels';

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

export function Pantry() {
  const [q, setQ] = useState('');
  const haveSet = useHaveSet();

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
        ⭐ Segna tutti gli essenziali come disponibili
      </button>

      {grouped.length === 0 ? (
        <div className="empty">
          <span className="emoji">🧺</span>
          Nessun ingrediente trovato.
        </div>
      ) : (
        grouped.map((g) => (
          <Card key={g.category} title={CATEGORY_LABEL[g.category]}>
            <ul className="clean">
              {g.items.map((ing) => (
                <CheckRow
                  key={ing.id}
                  checked={haveSet.has(ing.id)}
                  title={
                    <>
                      {ing.name}{' '}
                      {ing.staple && <span className="pill" style={{ marginLeft: 4 }}>⭐ base</span>}
                    </>
                  }
                  detail={`${ing.storage} · ${ing.shelfLife}`}
                  onToggle={() => setPantryHave(ing.id, !haveSet.has(ing.id))}
                />
              ))}
            </ul>
          </Card>
        ))
      )}
    </div>
  );
}
