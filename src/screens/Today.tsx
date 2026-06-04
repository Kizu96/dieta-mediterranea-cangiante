import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Season } from '../data/types';
import { dailyEssentials } from '../data/dailyEssentials';
import { workoutWeeks } from '../data/workoutPlan';
import { currentSeasonByDate } from '../lib/season';
import { addDays, getRecipesForDate, toISODate } from '../lib/planning';
import { missingForDate } from '../lib/shopping';
import { Card } from '../components/Card';
import { CheckRow } from '../components/CheckRow';
import { Modal } from '../components/Modal';
import { RecipeDetail } from '../components/RecipeDetail';
import { useHaveSet } from '../components/usePantry';
import { useIntensity } from '../components/useIntensity';
import { INTENSITY_LABEL, scaleRound } from '../lib/intensity';
import { exerciseVideoUrl } from '../lib/exerciseVideo';
import { SLOT_LABEL, formatLongDate, mondayIndex } from '../components/labels';
import type { Recipe } from '../data/types';

export function Today({
  season,
  onSeasonOverride,
  onGoShopping,
}: {
  season: Season;
  onSeasonOverride: (s: Season | null) => void;
  onGoShopping: () => void;
}) {
  const today = useMemo(() => new Date(), []);
  const todayISO = toISODate(today);
  const tomorrow = addDays(today, 1);
  const autoSeason = currentSeasonByDate(today);

  const meals = getRecipesForDate(today, season);
  const mealsTomorrow = getRecipesForDate(tomorrow, season);
  const haveSet = useHaveSet();
  const { intensity, factor, setIntensity } = useIntensity();
  const missing = missingForDate(haveSet, tomorrow, season);

  const [detail, setDetail] = useState<Recipe | null>(null);

  // --- Daily essentials log (keyed date+essentialId) ---
  const todayEssentials = useLiveQuery(
    () => db.essentials.where('date').equals(todayISO).toArray(),
    [todayISO],
    [],
  );
  const doneSet = new Set((todayEssentials ?? []).filter((e) => e.done).map((e) => e.essentialId));

  const toggleEssential = async (essentialId: string) => {
    const existing = await db.essentials
      .where('[date+essentialId]')
      .equals([todayISO, essentialId])
      .first();
    if (existing?.id != null) {
      await db.essentials.update(existing.id, { done: !existing.done });
    } else {
      await db.essentials.add({ date: todayISO, essentialId, done: true });
    }
  };

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
      await db.workouts.update(existing.id, { done: !existing.done });
    } else {
      await db.workouts.add({
        date: todayISO,
        title: todayWorkout.title,
        done: true,
        durationMin: todayWorkout.durationMin,
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
    if (existing?.id != null) await db.weights.update(existing.id, { kg: value });
    else await db.weights.add({ date: todayISO, kg: value });
    setKg('');
  };

  const totalKcal = meals.reduce((s, m) => s + m.recipe.kcal, 0);
  const totalKcalTomorrow = mealsTomorrow.reduce((s, m) => s + m.recipe.kcal, 0);

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
        <p className="small muted" style={{ margin: '12px 0 4px' }}>
          Intensità: <b>{INTENSITY_LABEL[intensity]}</b>
        </p>
        <div className="segmented" style={{ marginBottom: 0 }}>
          <button
            className={intensity === 'moderata' ? 'active' : ''}
            onClick={() => setIntensity('moderata')}
          >
            Moderata
          </button>
          <button
            className={intensity === 'intensiva' ? 'active' : ''}
            onClick={() => setIntensity('intensiva')}
          >
            Intensiva
          </button>
        </div>
      </Card>

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

      <div className="dash-grid">
      <Card title="Pasti di oggi" icon="🍽️" action={<span className="pill olive">{scaleRound(totalKcal, factor)} kcal</span>}>
        {meals.length === 0 ? (
          <p className="muted small">Nessun pasto pianificato per oggi.</p>
        ) : (
          <ul className="clean">
            {meals.map((m, i) => (
              <li key={i} className="meal-row" onClick={() => setDetail(m.recipe)} style={{ cursor: 'pointer' }}>
                <span className="slot-tag">{SLOT_LABEL[m.slot]}</span>
                <span className="grow">{m.recipe.name}</span>
                <span className="nowrap muted">{scaleRound(m.recipe.kcal, factor)} kcal ›</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Pasti di domani" icon="🌙" action={<span className="pill">{scaleRound(totalKcalTomorrow, factor)} kcal</span>}>
        {mealsTomorrow.length === 0 ? (
          <p className="muted small">Nessun pasto pianificato per domani.</p>
        ) : (
          <ul className="clean">
            {mealsTomorrow.map((m, i) => (
              <li key={i} className="meal-row" onClick={() => setDetail(m.recipe)} style={{ cursor: 'pointer' }}>
                <span className="slot-tag">{SLOT_LABEL[m.slot]}</span>
                <span className="grow">{m.recipe.name}</span>
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
                  const vid = exerciseVideoUrl(ex.name);
                  return (
                    <li key={i} className="small" style={{ padding: '4px 0' }}>
                      <b>{ex.name}:</b> {ex.detail}
                      {vid && (
                        <>
                          {' '}
                          <a href={vid} target="_blank" rel="noopener noreferrer" className="nowrap">
                            ▶︎ video
                          </a>
                        </>
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
    </div>
  );
}
