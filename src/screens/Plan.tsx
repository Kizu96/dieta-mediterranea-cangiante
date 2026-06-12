import { useCallback, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Briefcase, CalendarDays, Flame, MapPin } from 'lucide-react';
import type { MealSlot, Recipe, Season } from '../data/types';
import { db, type MealStatusValue } from '../db/db';
import { setMealStatusWithPantry } from '../lib/pantryQty';
import { MealStatusButtons } from '../components/MealStatusButtons';
import {
  addDays,
  buildOverrideMap,
  getDayTemplate,
  getRecipesForDate,
  toISODate,
  type OverrideMap,
} from '../lib/planning';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { RecipeDetail } from '../components/RecipeDetail';
import { useIntensity } from '../components/useIntensity';
import { useExtraRecipes } from '../components/useExtraRecipes';
import { scaleRound } from '../lib/intensity';
import { SLOT_LABEL, formatLongDate, formatShortDate, mondayIndex } from '../components/labels';

type Mode = 'giorno' | 'settimana' | 'mese';

export function Plan({ season }: { season: Season }) {
  const [mode, setMode] = useState<Mode>('giorno');
  const [detail, setDetail] = useState<Recipe | null>(null);
  const [offset, setOffset] = useState(0); // giorni rispetto a oggi (per modalità Giorno)
  const today = useMemo(() => new Date(), []);
  const { factor } = useIntensity();
  const { includeExtra } = useExtraRecipes();
  const overrideRows = useLiveQuery(() => db.mealOverride.toArray(), [], []);
  const overrides = useMemo(() => buildOverrideMap(overrideRows ?? []), [overrideRows]);

  return (
    <div>
      <div className="segmented">
        <button className={mode === 'giorno' ? 'active' : ''} onClick={() => setMode('giorno')}>
          Giorno
        </button>
        <button className={mode === 'settimana' ? 'active' : ''} onClick={() => setMode('settimana')}>
          Settimana
        </button>
        <button className={mode === 'mese' ? 'active' : ''} onClick={() => setMode('mese')}>
          Mese
        </button>
      </div>

      {mode === 'giorno' && (
        <DayView
          date={addDays(today, offset)}
          season={season}
          offset={offset}
          onPrev={() => setOffset((o) => o - 1)}
          onNext={() => setOffset((o) => o + 1)}
          onToday={() => setOffset(0)}
          onOpen={setDetail}
          factor={factor}
          includeExtra={includeExtra}
          overrides={overrides}
        />
      )}

      {mode === 'settimana' && (
        <WeekView
          start={today}
          season={season}
          onOpen={setDetail}
          factor={factor}
          includeExtra={includeExtra}
          overrides={overrides}
        />
      )}

      {mode === 'mese' && <MonthView start={today} season={season} />}

      {detail && (
        <Modal title={detail.name} onClose={() => setDetail(null)}>
          <RecipeDetail recipe={detail} factor={factor} />
        </Modal>
      )}
    </div>
  );
}

function DayView({
  date,
  season,
  offset,
  onPrev,
  onNext,
  onToday,
  onOpen,
  factor,
  includeExtra,
  overrides,
}: {
  date: Date;
  season: Season;
  offset: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onOpen: (r: Recipe) => void;
  factor: number;
  includeExtra: boolean;
  overrides: OverrideMap;
}) {
  const tpl = getDayTemplate(date, season);
  const meals = getRecipesForDate(date, season, includeExtra, overrides);
  const total = meals.reduce((s, m) => s + m.recipe.kcal, 0);
  const isWeekday = mondayIndex(date) < 5; // Lun–Ven = pranzo da ufficio

  // Oggi e giorni passati: si può segnare mangiato/metà/saltato anche a posteriori
  // (se ti scordi di segnare un pasto, lo recuperi da qui). Aggiorna anche la dispensa.
  const iso = toISODate(date);
  const editable = iso <= toISODate(new Date());
  const statusRows = useLiveQuery(
    () => db.mealStatus.where('date').equals(iso).toArray(),
    [iso],
    [],
  );
  const statusBySlot = new Map((statusRows ?? []).map((s) => [s.slot, s]));
  const setStatus = useCallback(
    async (slot: MealSlot, recipe: Recipe, status: MealStatusValue, offPlanKcal?: number) => {
      await setMealStatusWithPantry(iso, slot, recipe, status, factor, offPlanKcal);
    },
    [iso, factor],
  );

  return (
    <Card>
      <div className="flex-between" style={{ marginBottom: 10 }}>
        <button className="icon-btn" onClick={onPrev} aria-label="Giorno precedente">
          ‹
        </button>
        <div className="center">
          <div style={{ fontWeight: 700 }}>{formatLongDate(date)}</div>
          {offset !== 0 && (
            <button className="btn ghost small" style={{ minHeight: 32, marginTop: 4 }} onClick={onToday}>
              Torna a oggi
            </button>
          )}
        </div>
        <button className="icon-btn" onClick={onNext} aria-label="Giorno successivo">
          ›
        </button>
      </div>

      <div className="pill-row" style={{ marginBottom: 12 }}>
        {tpl && (
          <>
            <span className={tpl.active ? 'pill active' : 'pill'}>
              {tpl.active ? <><Flame size={12} className="ic" /> Giorno attivo</> : 'Giorno base'}
            </span>
            <span className="pill olive">Obiettivo {tpl.kcalTarget} kcal</span>
          </>
        )}
        <span className="pill">Totale pasti {scaleRound(total, factor)} kcal</span>
      </div>

      {meals.length === 0 ? (
        <p className="muted small">Nessun pasto per questo giorno.</p>
      ) : (
        <ul className="clean">
          {meals.map((m, i) => (
            <li key={i} className="meal-row" style={{ display: 'block', cursor: 'default' }}>
              <div
                onClick={() => onOpen(m.recipe)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
              >
                <span className="slot-tag">{SLOT_LABEL[m.slot]}</span>
                <span className="grow">
                  {m.recipe.name}
                  {isWeekday && m.slot === 'pranzo' && m.recipe.office && (
                    <span className="pill olive" style={{ marginLeft: 6 }}><Briefcase size={12} className="ic" /> ufficio</span>
                  )}
                </span>
                <span className="nowrap muted">{m.recipe.kcal} kcal ›</span>
              </div>
              {editable && (
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  <MealStatusButtons
                    active={statusBySlot.get(m.slot)?.status}
                    offPlanKcal={statusBySlot.get(m.slot)?.offPlanKcal}
                    onSelect={(v, kcal) => setStatus(m.slot, m.recipe, v, kcal)}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function WeekView({
  start,
  season,
  onOpen,
  factor,
  includeExtra,
  overrides,
}: {
  start: Date;
  season: Season;
  onOpen: (r: Recipe) => void;
  factor: number;
  includeExtra: boolean;
  overrides: OverrideMap;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const todayISO = toISODate(start);
  return (
    <div>
      <p className="small muted">Prossimi 7 giorni (menù stagionale ciclico).</p>
      <div className="week-grid">
      {days.map((d, i) => {
        const tpl = getDayTemplate(d, season);
        const meals = getRecipesForDate(d, season, includeExtra, overrides);
        const isToday = toISODate(d) === todayISO;
        const isWeekday = mondayIndex(d) < 5;
        return (
          <Card key={i}>
            <div className="flex-between" style={{ marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>
                {isToday ? <><MapPin size={14} className="ic" />{' '}</> : ''}
                {formatShortDate(d)}
                {tpl ? ` · ${tpl.dayLabel}` : ''}
              </h3>
              <div className="pill-row">
                {tpl?.active && <span className="pill active"><Flame size={12} className="ic" /> attivo</span>}
                {tpl && <span className="pill olive">{tpl.kcalTarget} kcal</span>}
              </div>
            </div>
            {meals.length === 0 ? (
              <p className="muted small">—</p>
            ) : (
              <ul className="clean">
                {meals.map((m, j) => (
                  <li
                    key={j}
                    className="meal-row"
                    style={{ cursor: 'pointer' }}
                    onClick={() => onOpen(m.recipe)}
                  >
                    <span className="slot-tag">{SLOT_LABEL[m.slot]}</span>
                    <span className="grow small">
                      {m.recipe.name}
                      {isWeekday && m.slot === 'pranzo' && m.recipe.office && (
                        <span className="pill olive" style={{ marginLeft: 4 }}><Briefcase size={11} className="ic" /></span>
                      )}
                    </span>
                    <span className="nowrap muted small">{scaleRound(m.recipe.kcal, factor)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        );
      })}
      </div>
    </div>
  );
}

function MonthView({ start, season }: { start: Date; season: Season }) {
  // Panoramica del mese corrente: griglia con kcal obiettivo e marcatura giorni attivi.
  const year = start.getFullYear();
  const month = start.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // celle vuote prima del giorno 1 (Lun=0)
  const todayISO = toISODate(start);

  const cells: (Date | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const monthName = formatLongDate(first).split(' ').slice(1, 3).join(' ');

  return (
    <Card title={`Panoramica · ${monthName}`} icon={<CalendarDays />}>
      <p className="small muted" style={{ marginTop: -4 }}>
        <Flame size={12} className="ic" /> = giorno attivo (tapis roulant, più carboidrati).
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((w, i) => (
          <div key={i} className="center small muted" style={{ fontWeight: 700 }}>
            {w}
          </div>
        ))}
        {cells.map((c, i) => {
          if (!c) return <div key={i} />;
          const tpl = getDayTemplate(c, season);
          const isToday = toISODate(c) === todayISO;
          return (
            <div
              key={i}
              className="center"
              style={{
                background: isToday ? 'var(--olive)' : 'var(--cream-2)',
                color: isToday ? '#fff' : 'var(--ink)',
                borderRadius: 8,
                padding: '6px 2px',
                minHeight: 52,
              }}
            >
              <div style={{ fontWeight: 700 }}>{c.getDate()}</div>
              {tpl && (
                <div style={{ fontSize: '0.6rem', lineHeight: 1.1 }}>
                  {tpl.active ? <Flame size={9} className="ic" /> : ''}
                  <div>{tpl.kcalTarget}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
