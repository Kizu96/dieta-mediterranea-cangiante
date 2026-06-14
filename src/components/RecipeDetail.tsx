import { useState } from 'react';
import { Briefcase, ChefHat, CookingPot, Heart } from 'lucide-react';
import type { Recipe } from '../data/types';
import { techniquesForIngredients } from '../data/cuttingGuide';
import { ingredientById } from '../lib/shopping';
import { stockStatus } from '../lib/stock';
import { scaleQty, scaleRound } from '../lib/intensity';
import { CookMode } from './CookMode';
import { QtyBar } from './QtyBar';
import { StockDot } from './StockDot';
import { useFavorites, toggleFavorite } from './useFavorites';
import { useHaveSet, usePantryLevels, usePantryQty } from './usePantry';
import { EQUIPMENT_LABEL, SLOT_LABEL, SEASON_LABEL, formatQty } from './labels';

// Dettaglio ricetta: ingredienti (qty+unità), passi numerati, macro, conservazione, tips, attrezzatura.
// `factor` scala porzioni e macro secondo l'intensità scelta (1 = porzione base).
export function RecipeDetail({ recipe, factor = 1 }: { recipe: Recipe; factor?: number }) {
  // Schede "come si taglia" per le sole verdure di questa ricetta (chiuse di default).
  const cutting = techniquesForIngredients(recipe.ingredients.map((ri) => ri.ingredientId));
  const [showCutting, setShowCutting] = useState(false);
  // Barra di quantità + stato scorta (rosso = manca, ambra = sta per finire).
  const levels = usePantryLevels();
  const haveSet = useHaveSet();
  const qtyMap = usePantryQty();
  const [cooking, setCooking] = useState(false);
  // Preferita (cuore): nello "scambia pasto" le preferite salgono in cima.
  const favorites = useFavorites();
  const isFav = favorites.has(recipe.id);
  return (
    <div>
      <button
        className={isFav ? 'btn terracotta block' : 'btn ghost block'}
        style={{ marginBottom: 10, minHeight: 40 }}
        onClick={() => toggleFavorite(recipe.id, isFav)}
        aria-pressed={isFav}
      >
        <Heart size={16} className="ic" fill={isFav ? 'currentColor' : 'none'} />{' '}
        {isFav ? 'Preferita — la trovi in cima allo scambio' : 'Segna come preferita'}
      </button>
      <div className="pill-row" style={{ marginBottom: 10 }}>
        {recipe.slot.map((s) => (
          <span className="pill terracotta" key={s}>
            {SLOT_LABEL[s]}
          </span>
        ))}
        {recipe.seasons.map((s) => (
          <span className="pill olive" key={s}>
            {SEASON_LABEL[s]}
          </span>
        ))}
        <span className="pill">⏱ {recipe.timeMin} min</span>
      </div>

      <div className="pill-row" style={{ marginBottom: 12 }}>
        {recipe.equipment.map((e) => (
          <span className="pill" key={e}>
            <CookingPot size={11} className="ic" /> {EQUIPMENT_LABEL[e]}
          </span>
        ))}
      </div>

      <div className="stat-grid" style={{ marginBottom: 14 }}>
        <div className="stat">
          <div className="stat-num">{scaleRound(recipe.kcal, factor)}</div>
          <div className="stat-label">kcal</div>
        </div>
        <div className="stat">
          <div className="stat-num">{scaleRound(recipe.protein, factor)} g</div>
          <div className="stat-label">Proteine</div>
        </div>
        <div className="stat">
          <div className="stat-num">{scaleRound(recipe.carbs, factor)} g</div>
          <div className="stat-label">Carboidrati</div>
        </div>
        <div className="stat">
          <div className="stat-num">{scaleRound(recipe.fat, factor)} g</div>
          <div className="stat-label">Grassi</div>
        </div>
      </div>
      <p className="small muted" style={{ marginTop: -6 }}>
        {recipe.fiber !== undefined ? `Fibre: ${scaleRound(recipe.fiber, factor)} g · ` : ''}
        Dose per 1 persona{factor !== 1 ? ' · porzione Moderata (+30%)' : ''}
      </p>

      <h3 className="section-label">Ingredienti</h3>
      <ul className="clean" style={{ marginBottom: 14 }}>
        {recipe.ingredients.map((ri, i) => {
          const ing = ingredientById(ri.ingredientId);
          const lvl = levels.get(ri.ingredientId);
          return (
            <li key={i} className="meal-row" style={{ display: 'block' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="grow">
                  {ing && !ing.staple && (
                    <StockDot level={stockStatus(ri.ingredientId, haveSet, qtyMap, levels)} />
                  )}
                  {ing ? ing.name : ri.ingredientId}
                </span>
                <span className="nowrap muted">
                  {formatQty(scaleQty(ri.qty, factor))} {ri.unit}
                  {ri.note ? ` · ${ri.note}` : ''}
                </span>
              </div>
              {lvl && ing && (
                <>
                  <QtyBar
                    qty={lvl.qty}
                    full={lvl.full}
                    label={`In dispensa: ${formatQty(lvl.qty)} ${ing.unit} su ${formatQty(lvl.full)}`}
                  />
                  <div className="small muted" style={{ marginTop: 2 }}>
                    in dispensa: {formatQty(lvl.qty)} {ing.unit}
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>

      {cutting.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <button
            className="btn ghost block"
            onClick={() => setShowCutting((v) => !v)}
            aria-expanded={showCutting}
          >
            🔪 Come tagliare: {cutting.map((t) => t.title).join(', ')} {showCutting ? '▾' : '▸'}
          </button>
          {showCutting && (
            <ul className="clean" style={{ marginTop: 6 }}>
              {cutting.map((t) => (
                <li key={t.title} className="small" style={{ padding: '6px 0' }}>
                  <b>{t.title}:</b> {t.how}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <h3 className="section-label">Preparazione</h3>
      <button className="btn block" style={{ marginBottom: 10 }} onClick={() => setCooking(true)}>
        <ChefHat size={16} className="ic" /> Modalità cucina (passi grandi + timer)
      </button>
      <ol className="steps" style={{ marginBottom: 14 }}>
        {recipe.steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      {cooking && <CookMode recipe={recipe} factor={factor} onClose={() => setCooking(false)} />}

      {recipe.office && (
        <div className="banner info" style={{ marginTop: 4 }}>
          <Briefcase size={15} className="ic" /> <b>Da ufficio:</b> preparalo in anticipo (la sera prima o al prep day della
          domenica), conservalo in frigo in un contenitore e portalo con te. Se va mangiato
          caldo: microonde dell'ufficio (850 W) <b>2-3 minuti</b> mescolando a metà; zuppe e
          minestre 3-4 minuti, coperte con un piattino.
        </div>
      )}

      {recipe.storage && (
        <>
          <h3 className="section-label">Conservazione</h3>
          <p className="small">{recipe.storage}</p>
        </>
      )}
      {recipe.tips && (
        <>
          <h3 className="section-label">Consigli</h3>
          <p className="small">{recipe.tips}</p>
        </>
      )}
      {recipe.tags && recipe.tags.length > 0 && (
        <div className="pill-row" style={{ marginTop: 10 }}>
          {recipe.tags.map((t) => (
            <span className="pill" key={t}>
              #{t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
