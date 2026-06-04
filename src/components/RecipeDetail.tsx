import type { Recipe } from '../data/types';
import { ingredientById } from '../lib/shopping';
import { EQUIPMENT_LABEL, SLOT_LABEL, SEASON_LABEL, formatQty } from './labels';

// Dettaglio ricetta: ingredienti (qty+unità), passi numerati, macro, conservazione, tips, attrezzatura.
export function RecipeDetail({ recipe }: { recipe: Recipe }) {
  return (
    <div>
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
            🍳 {EQUIPMENT_LABEL[e]}
          </span>
        ))}
      </div>

      <div className="stat-grid" style={{ marginBottom: 14 }}>
        <div className="stat">
          <div className="stat-num">{recipe.kcal}</div>
          <div className="stat-label">kcal</div>
        </div>
        <div className="stat">
          <div className="stat-num">{recipe.protein} g</div>
          <div className="stat-label">Proteine</div>
        </div>
        <div className="stat">
          <div className="stat-num">{recipe.carbs} g</div>
          <div className="stat-label">Carboidrati</div>
        </div>
        <div className="stat">
          <div className="stat-num">{recipe.fat} g</div>
          <div className="stat-label">Grassi</div>
        </div>
      </div>
      {recipe.fiber !== undefined && (
        <p className="small muted" style={{ marginTop: -6 }}>
          Fibre: {recipe.fiber} g · Dose per 1 persona
        </p>
      )}

      <h3 className="section-label">Ingredienti</h3>
      <ul className="clean" style={{ marginBottom: 14 }}>
        {recipe.ingredients.map((ri, i) => {
          const ing = ingredientById(ri.ingredientId);
          return (
            <li key={i} className="meal-row">
              <span className="grow">{ing ? ing.name : ri.ingredientId}</span>
              <span className="nowrap muted">
                {formatQty(ri.qty)} {ri.unit}
                {ri.note ? ` · ${ri.note}` : ''}
              </span>
            </li>
          );
        })}
      </ul>

      <h3 className="section-label">Preparazione</h3>
      <ol className="steps" style={{ marginBottom: 14 }}>
        {recipe.steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>

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
