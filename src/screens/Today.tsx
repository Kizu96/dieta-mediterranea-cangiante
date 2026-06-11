import { useCallback, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type MealStatusValue } from '../db/db';
import type { MealSlot, Season } from '../data/types';
import { dailyEssentials } from '../data/dailyEssentials';
import { workoutWeeks } from '../data/workoutPlan';
import { currentSeasonByDate } from '../lib/season';
import { addDays, buildOverrideMap, getRecipesForDate, recipesForSlot, toISODate } from '../lib/planning';
import { missingForDate, surplusIngredients } from '../lib/shopping';
import { setMealStatusWithPantry } from '../lib/pantryQty';
import { Card } from '../components/Card';
import { CheckRow } from '../components/CheckRow';
import { MealStatusButtons } from '../components/MealStatusButtons';
import { Modal } from '../components/Modal';
import { RecipeDetail } from '../components/RecipeDetail';
import { ExerciseDetail } from '../components/ExerciseDetail';
import { WeeklySummary } from '../components/WeeklySummary';
import { useHaveSet, usePantryQty } from '../components/usePantry';
import { useIntensity } from '../components/useIntensity';
import { useExtraRecipes } from '../components/useExtraRecipes';
import { scaleRound } from '../lib/intensity';
import { hasExerciseVideo } from '../lib/exerciseVideo';
import { SLOT_LABEL, formatLongDate, mondayIndex } from '../components/labels';
import type { Recipe, WorkoutExercise } from '../data/types';

export function Today({
  season,
  onSeasonOverride,
  onGoShopping,
  onGoPrep,
}: {
  season: Season;
  onSeasonOverride: (s: Season | null) => void;
  onGoShopping: () => void;
  onGoPrep: () => void;
}) {
  const today = useMemo(() => new Date(), []);
  const todayISO = toISODate(today);
  const tomorrow = addDays(today, 1);
  const autoSeason = currentSeasonByDate(today);
  const isWeekdayToday = mondayIndex(today) < 5; // Lun–Ven = pranzo da ufficio
  const isWeekdayTomorrow = mondayIndex(tomorrow) < 5;

  const { includeExtra } = useExtraRecipes();
  const overrideRows = useLiveQuery(() => db.mealOverride.toArray(), [], []);
  const overrides = useMemo(() => buildOverrideMap(overrideRows ?? []), [overrideRows]);
  const overriddenToday = new Set(
    (overrideRows ?? []).filter((o) => o.date === todayISO).map((o) => o.slot),
  );
  const meals = getRecipesForDate(today, season, includeExtra, overrides);
  const mealsTomorrow = getRecipesForDate(tomorrow, season, includeExtra, overrides);
  const haveSet = useHaveSet();
  const qtyMap = usePantryQty();
  const { factor } = useIntensity();
  const missing = missingForDate(haveSet, tomorrow, season, includeExtra, overrides, qtyMap, factor);

  // Ingredienti "abbondanti" (più di quanto serve al piano dei prossimi 7 giorni):
  // nello scambio pasto le ricette che li usano salgono in cima.
  const surplus = useMemo(
    () => surplusIngredients(qtyMap, today, 7, season, includeExtra, overrides, factor),
    [qtyMap, today, season, includeExtra, overrides, factor],
  );

  const [detail, setDetail] = useState<Recipe | null>(null);
  const [exDetail, setExDetail] = useState<WorkoutExercise | null>(null);
  // I pasti di domani partono chiusi: si aprono solo al tocco, per non confonderli con oggi.
  const [showTomorrow, setShowTomorrow] = useState(false);

  // --- Stato dei pasti di oggi (mangiato / metà / saltato) per la barra calorie ---
  const todayMealStatus = useLiveQuery(
    () => db.mealStatus.where('date').equals(todayISO).toArray(),
    [todayISO],
    [],
  );
  const statusBySlot = new Map((todayMealStatus ?? []).map((s) => [s.slot, s.status]));

  // Segna lo stato e scala/storna la dispensa quantitativa (vedi pantryQty.ts).
  const setMealStatus = useCallback(
    async (slot: MealSlot, recipe: Recipe, status: MealStatusValue) => {
      await setMealStatusWithPantry(todayISO, slot, recipe, status, factor);
    },
    [todayISO, factor],
  );

  // --- Daily essentials log (keyed date+essentialId) ---
  const todayEssentials = useLiveQuery(
    () => db.essentials.where('date').equals(todayISO).toArray(),
    [todayISO],
    [],
  );
  const doneSet = new Set((todayEssentials ?? []).filter((e) => e.done).map((e) => e.essentialId));

  const toggleEssential = useCallback(
    async (essentialId: string) => {
      const existing = await db.essentials
        .where('[date+essentialId]')
        .equals([todayISO, essentialId])
        .first();
      if (existing?.id != null) {
        await db.essentials.update(existing.id, { done: !existing.done, updatedAt: Date.now() });
      } else {
        await db.essentials.add({ date: todayISO, essentialId, done: true, updatedAt: Date.now() });
      }
    },
    [todayISO],
  );

  // --- Scambia pasto: sostituzione del pasto del piano solo per oggi ---
  const [swap, setSwap] = useState<{ slot: MealSlot; current: string } | null>(null);
  const setOverride = useCallback(
    async (slot: MealSlot, recipeId: string) => {
      await db.mealOverride.put({ date: todayISO, slot, recipeId, updatedAt: Date.now() });
    },
    [todayISO],
  );
  const clearOverride = useCallback(
    async (slot: MealSlot) => {
      await db.mealOverride.delete([todayISO, slot]);
    },
    [todayISO],
  );

  // --- Allenamento di oggi (deriva il giorno dal piano workout) ---
  const todayWorkout = useMemo(() => {
    const week = workoutWeeks[0];
    if (!week || week.days.length === 0) return undefined;
    return week.days[mondayIndex(today) % week.days.length];
  }, [today]);

  const workoutLog = useLiveQuery(
    () => db.workouts.where('date').equals(todayISO).toArray(),
    [todayISO],
    [],
  );
  const workoutDone = (workoutLog ?? []).some((w) => w.done);

  const toggleWorkout = async () => {
    if (!todayWorkout) return;
    const existing = (workoutLog ?? [])[0];
    if (existing?.id != null) {
      await db.workouts.update(existing.id, { done: !existing.done, updatedAt: Date.now() });
    } else {
      await db.workouts.add({
        date: todayISO,
        title: todayWorkout.title,
        done: true,
        durationMin: todayWorkout.durationMin,
        updatedAt: Date.now(),
      });
    }
  };

  // --- Pesata rapida ---
  const [kg, setKg] = useState('');
  const lastWeight = useLiveQuery(() => db.weights.orderBy('date').last(), [], undefined);
  const addWeight = async () => {
    const value = parseFloat(kg.replace(',', '.'));
    if (!isFinite(value) || value <= 0) return;
    const existing = await db.weights.where('date').equals(todayISO).first();
    if (existing?.id != null) await db.weights.update(existing.id, { kg: value, updatedAt: Date.now() });
    else await db.weights.add({ date: todayISO, kg: value, updatedAt: Date.now() });
    setKg('');
  };

  const totalKcal = meals.reduce((s, m) => s + m.recipe.kcal, 0);
  const totalKcalTomorrow = mealsTomorrow.reduce((s, m) => s + m.recipe.kcal, 0);

  // Calorie consumate finora: pasto "mangiato" = intero, "metà" = 50%, "saltato"/non segnato = 0.
  const consumedKcal = meals.reduce((s, m) => {
    const st = statusBySlot.get(m.slot);
    if (st === 'eaten') return s + m.recipe.kcal;
    if (st === 'half') return s + m.recipe.kcal / 2;
    return s;
  }, 0);
  const consumedScaled = scaleRound(consumedKcal, factor);
  const plannedScaled = scaleRound(totalKcal, factor);
  const consumedPct = totalKcal > 0 ? Math.min(100, Math.round((consumedKcal / totalKcal) * 100)) : 0;

  return (
    <div>
      <Card>
        <div className="flex-between">
          <div>
            <h2 style={{ marginBottom: 2 }}>{formatLongDate(today)}</h2>
            <p className="small muted" style={{ margin: 0 }}>
              Stagione: <b>{season === 'estate' ? 'Estate ☀️' : 'Inverno ❄️'}</b>
              {season !== autoSeason ? ' (manuale)' : ''}
            </p>
          </div>
        </div>
        <div className="segmented" style={{ marginTop: 12, marginBottom: 0 }}>
          <button
            className={season === 'estate' ? 'active' : ''}
            onClick={() => onSeasonOverride(autoSeason === 'estate' ? null : 'estate')}
          >
            Estate
          </button>
          <button
            className={season === 'inverno' ? 'active' : ''}
            onClick={() => onSeasonOverride(autoSeason === 'inverno' ? null : 'inverno')}
          >
            Inverno
          </button>
        </div>
      </Card>

      {mondayIndex(today) === 6 && (
        <div className="banner info">
          🍱 <b>Oggi è il prep day:</b> prepara in una sola sessione i 5 pranzi da ufficio della
          settimana che inizia domani, così la sera cucini solo la cena.
          <div style={{ marginTop: 10 }}>
            <button className="btn" onClick={onGoPrep}>
              Apri il Prep Day
            </button>
          </div>
        </div>
      )}

      {missing.length > 0 && (
        <div className="banner warn">
          <b>🛒 Compra per domani:</b>{' '}
          {missing.map((m) => m.name).join(', ')}.
          <div style={{ marginTop: 10 }}>
            <button className="btn terracotta" onClick={onGoShopping}>
              Apri lista spesa
            </button>
          </div>
        </div>
      )}

      <WeeklySummary />

      <div className="dash-grid">
      <Card title="Pasti di oggi" icon="🍽️" action={<span className="pill olive">{plannedScaled} kcal</span>}>
        {meals.length === 0 ? (
          <p className="muted small">Nessun pasto pianificato per oggi.</p>
        ) : (
          <>
            <div style={{ marginBottom: 12 }}>
              <div
                className="small"
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: 'var(--ink-soft)' }}
              >
                <span>Consumate oggi</span>
                <span>
                  <b style={{ color: 'var(--olive-dark)' }}>{consumedScaled}</b> / {plannedScaled} kcal
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 6, background: 'var(--line)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${consumedPct}%`, background: 'var(--olive)', transition: 'width .25s' }} />
              </div>
            </div>
            <ul className="clean">
              {meals.map((m, i) => {
                const active = statusBySlot.get(m.slot);
                return (
                  <li key={i} className="meal-row" style={{ display: 'block', cursor: 'default' }}>
                    <div
                      onClick={() => setDetail(m.recipe)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                    >
                      <span className="slot-tag">{SLOT_LABEL[m.slot]}</span>
                      <span className="grow">
                        {m.recipe.name}
                        {isWeekdayToday && m.slot === 'pranzo' && m.recipe.office && (
                          <span className="pill olive" style={{ marginLeft: 6 }}>🥡 ufficio</span>
                        )}
                        {overriddenToday.has(m.slot) && (
                          <span className="pill" style={{ marginLeft: 6 }}>🔁 scambiato</span>
                        )}
                      </span>
                      <span className="nowrap muted">{scaleRound(m.recipe.kcal, factor)} kcal ›</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <MealStatusButtons
                        active={active}
                        onSelect={(v) => setMealStatus(m.slot, m.recipe, v)}
                      />
                      <button
                        onClick={() => setSwap({ slot: m.slot, current: m.recipe.id })}
                        className="btn ghost"
                        style={{ minHeight: 34, padding: '0 12px', fontSize: '0.82rem', flex: '0 0 auto' }}
                      >
                        ⇄ Scambia
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Card>

      <Card
        title="Pasti di domani"
        icon="🌙"
        action={
          <button
            onClick={() => setShowTomorrow((v) => !v)}
            aria-expanded={showTomorrow}
            aria-label={showTomorrow ? 'Nascondi i pasti di domani' : 'Mostra i pasti di domani'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'none',
              border: 'none',
              padding: 0,
              font: 'inherit',
              color: 'inherit',
              cursor: 'pointer',
            }}
          >
            <span className="pill">{scaleRound(totalKcalTomorrow, factor)} kcal</span>
            <span aria-hidden="true" style={{ fontSize: '0.85rem', opacity: 0.7 }}>
              {showTomorrow ? '▾' : '▸'}
            </span>
          </button>
        }
      >
        {!showTomorrow ? (
          <p
            className="muted small"
            style={{ margin: 0, cursor: 'pointer' }}
            onClick={() => setShowTomorrow(true)}
          >
            Tocca per vedere cosa preparare domani.
          </p>
        ) : mealsTomorrow.length === 0 ? (
          <p className="muted small">Nessun pasto pianificato per domani.</p>
        ) : (
          <ul className="clean">
            {mealsTomorrow.map((m, i) => (
              <li key={i} className="meal-row" onClick={() => setDetail(m.recipe)} style={{ cursor: 'pointer' }}>
                <span className="slot-tag">{SLOT_LABEL[m.slot]}</span>
                <span className="grow">
                  {m.recipe.name}
                  {isWeekdayTomorrow && m.slot === 'pranzo' && m.recipe.office && (
                    <span className="pill olive" style={{ marginLeft: 6 }}>🥡 ufficio</span>
                  )}
                </span>
                <span className="nowrap muted">{scaleRound(m.recipe.kcal, factor)} kcal ›</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Pilastri quotidiani" icon="✅">
        <p className="small muted" style={{ marginTop: -4 }}>
          Cibi-chiave anti-grasso viscerale da assumere <b>ogni giorno</b>. Molti sono già
          inclusi nei pasti qui sopra: spunta qui per essere sicuro di non saltarli.
        </p>
        <ul className="clean">
          {dailyEssentials.map((e) => (
            <CheckRow
              key={e.id}
              checked={doneSet.has(e.id)}
              title={e.name}
              detail={e.detail}
              onToggle={() => toggleEssential(e.id)}
            />
          ))}
        </ul>
      </Card>

      <Card title="Allenamento di oggi" icon="🏃">
        {todayWorkout ? (
          <>
            <div className="flex-between">
              <div>
                <b>{todayWorkout.title}</b>
                <div className="small muted">
                  {todayWorkout.type} · {todayWorkout.durationMin} min
                </div>
              </div>
              <button
                className={workoutDone ? 'btn secondary' : 'btn'}
                onClick={toggleWorkout}
              >
                {workoutDone ? '✓ Fatto' : 'Segna fatto'}
              </button>
            </div>
            {todayWorkout.exercises.length > 0 && (
              <ul className="clean" style={{ marginTop: 8 }}>
                {todayWorkout.exercises.map((ex, i) => {
                  const openable = hasExerciseVideo(ex.name);
                  return (
                    <li
                      key={i}
                      className="small"
                      style={{ padding: '5px 0', cursor: openable ? 'pointer' : 'default' }}
                      onClick={openable ? () => setExDetail(ex) : undefined}
                    >
                      <b>{ex.name}:</b> {ex.detail}
                      {openable && (
                        <span className="nowrap" style={{ color: 'var(--terracotta-dark)' }}>
                          {' '}
                          ▶︎ apri ›
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        ) : (
          <p className="muted small">Nessun allenamento pianificato.</p>
        )}
      </Card>

      <Card title="Pesata rapida" icon="⚖️">
        <div className="row">
          <div className="field grow" style={{ marginBottom: 0 }}>
            <label htmlFor="kg-oggi">Peso di oggi (kg)</label>
            <input
              id="kg-oggi"
              type="number"
              inputMode="decimal"
              step="0.1"
              value={kg}
              placeholder={lastWeight ? String(lastWeight.kg) : '—'}
              onChange={(e) => setKg(e.target.value)}
            />
          </div>
          <button className="btn" onClick={addWeight} style={{ flex: '0 0 auto' }}>
            Salva
          </button>
        </div>
        {lastWeight && (
          <p className="small muted" style={{ marginTop: 8 }}>
            Ultimo registrato: <b>{lastWeight.kg} kg</b> ({lastWeight.date})
          </p>
        )}
      </Card>
      </div>

      {detail && (
        <Modal title={detail.name} onClose={() => setDetail(null)}>
          <RecipeDetail recipe={detail} factor={factor} />
        </Modal>
      )}

      {exDetail && (
        <Modal title={exDetail.name} onClose={() => setExDetail(null)}>
          <ExerciseDetail exercise={exDetail} />
        </Modal>
      )}

      {swap && (
        <Modal title={`Scambia ${SLOT_LABEL[swap.slot]} di oggi`} onClose={() => setSwap(null)}>
          <p className="small muted" style={{ marginTop: -4 }}>
            Scegli cosa mangi davvero oggi al posto del pasto del piano. Vale <b>solo per oggi</b> e
            aggiorna anche la lista della spesa. Le ricette 📦 usano ingredienti che hai in
            abbondanza in dispensa.
          </p>
          <ul className="clean">
            {recipesForSlot(swap.slot, season, includeExtra)
              .map((r) => ({
                recipe: r,
                usesSurplus: r.ingredients.some((ri) => surplus.has(ri.ingredientId)),
              }))
              .sort((a, b) => Number(b.usesSurplus) - Number(a.usesSurplus))
              .map(({ recipe: r, usesSurplus }) => (
                <li
                  key={r.id}
                  className="meal-row"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setOverride(swap.slot, r.id);
                    setSwap(null);
                  }}
                >
                  <span className="grow">
                    {r.name}
                    {r.id === swap.current && (
                      <span className="pill olive" style={{ marginLeft: 6 }}>attuale</span>
                    )}
                    {usesSurplus && r.id !== swap.current && (
                      <span className="pill" style={{ marginLeft: 6 }}>📦 usa la dispensa</span>
                    )}
                  </span>
                  <span className="nowrap muted">{scaleRound(r.kcal, factor)} kcal</span>
                </li>
              ))}
          </ul>
          {overriddenToday.has(swap.slot) && (
            <button
              className="btn ghost block"
              style={{ marginTop: 8 }}
              onClick={() => {
                clearOverride(swap.slot);
                setSwap(null);
              }}
            >
              ↩︎ Ripristina il pasto del piano
            </button>
          )}
        </Modal>
      )}
    </div>
  );
}
