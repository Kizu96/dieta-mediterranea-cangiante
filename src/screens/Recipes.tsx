import { useMemo, useState } from 'react';
import type { Equipment, MealSlot, Recipe, Season } from '../data/types';
import { recipes } from '../data/recipes';
import { makeableRecipes } from '../lib/shopping';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { RecipeDetail } from '../components/RecipeDetail';
import { useHaveSet } from '../components/usePantry';
import { EQUIPMENT_LABEL, SEASON_LABEL, SLOT_LABEL } from '../components/labels';

const SLOTS: MealSlot[] = ['colazione', 'pranzo', 'spuntino', 'cena'];
const SEASONS: Season[] = ['estate', 'inverno'];
const EQUIPMENTS: Equipment[] = ['padella', 'pentola', 'microonde', 'friggitrice', 'nessuna'];

export function Recipes({ season }: { season: Season }) {
  const [q, setQ] = useState('');
  const [slot, setSlot] = useState<MealSlot | ''>('');
  const [seasonFilter, setSeasonFilter] = useState<Season | ''>('');
  const [equip, setEquip] = useState<Equipment | ''>('');
  const [onlyNow, setOnlyNow] = useState(false);
  const [detail, setDetail] = useState<Recipe | null>(null);

  const haveSet = useHaveSet();

  const filtered = useMemo(() => {
    const makeableIds = new Set(makeableRecipes(haveSet, season).map((r) => r.id));
    const term = q.trim().toLowerCase();
    return recipes.filter((r) => {
      if (term && !r.name.toLowerCase().includes(term)) return false;
      if (slot && !r.slot.includes(slot)) return false;
      if (seasonFilter && !r.seasons.includes(seasonFilter)) return false;
      if (equip && !r.equipment.includes(equip)) return false;
      if (onlyNow && !makeableIds.has(r.id)) return false;
      return true;
    });
  }, [q, slot, seasonFilter, equip, onlyNow, haveSet, season]);

  return (
    <div>
      <div className="field">
        <input
          type="search"
          placeholder="🔍 Cerca ricetta…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Cerca ricetta"
        />
      </div>

      <Card title="Filtri" icon="🔧">
        <div className="row" style={{ marginBottom: 10 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Pasto</label>
            <select value={slot} onChange={(e) => setSlot(e.target.value as MealSlot | '')}>
              <option value="">Tutti</option>
              {SLOTS.map((s) => (
                <option key={s} value={s}>
                  {SLOT_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Stagione</label>
            <select
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value as Season | '')}
            >
              <option value="">Tutte</option>
              {SEASONS.map((s) => (
                <option key={s} value={s}>
                  {SEASON_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field" style={{ marginBottom: 10 }}>
          <label>Attrezzatura</label>
          <select value={equip} onChange={(e) => setEquip(e.target.value as Equipment | '')}>
            <option value="">Tutte</option>
            {EQUIPMENTS.map((eq) => (
              <option key={eq} value={eq}>
                {EQUIPMENT_LABEL[eq]}
              </option>
            ))}
          </select>
        </div>
        <button
          className={onlyNow ? 'btn block' : 'btn secondary block'}
          onClick={() => setOnlyNow((v) => !v)}
        >
          {onlyNow ? '✓ Solo «Posso farla ora»' : 'Posso farla ora'}
        </button>
      </Card>

      <p className="small muted">
        {filtered.length} ricett{filtered.length === 1 ? 'a' : 'e'}
      </p>

      {filtered.length === 0 ? (
        <div className="empty">
          <span className="emoji">🍽️</span>
          Nessuna ricetta con questi filtri.
        </div>
      ) : (
        <div className="recipe-grid">
          {filtered.map((r) => (
            <Card key={r.id}>
              <div
                style={{ cursor: 'pointer' }}
                onClick={() => setDetail(r)}
                role="button"
                tabIndex={0}
              >
                <div className="flex-between">
                  <h3 style={{ margin: 0 }}>{r.name}</h3>
                  <span className="pill olive nowrap">{r.kcal} kcal</span>
                </div>
                <div className="pill-row" style={{ marginTop: 8 }}>
                  {r.slot.map((s) => (
                    <span className="pill terracotta" key={s}>
                      {SLOT_LABEL[s]}
                    </span>
                  ))}
                  <span className="pill">⏱ {r.timeMin} min</span>
                  {r.equipment.map((eq) => (
                    <span className="pill" key={eq}>
                      {EQUIPMENT_LABEL[eq]}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {detail && (
        <Modal title={detail.name} onClose={() => setDetail(null)}>
          <RecipeDetail recipe={detail} />
        </Modal>
      )}
    </div>
  );
}
