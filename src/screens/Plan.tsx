import { useCallback, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { MealSlot, Recipe, Season } from '../data/types';
import { db, type MealStatusValue } from '../db/db';
import { setMealStatusWithPantry } from '../lib/pantryQty';
import { PREP_WEEK_SLOT, prepAdvice, setPrepWeek } from '../lib/prep';
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
import { CheckRow } from '../components/CheckRow';
import { Modal } from '../components/Modal';
import { RecipeDetail } from '../components/RecipeDetail';
import { useIntensity } from '../components/useIntensity';
import { useExtraRecipes } from '../components/useExtraRecipes';
import { scaleRound } from '../lib/intensity';
import { SLOT_LABEL, formatLongDate, formatShortDate, mondayIndex } from '../components/labels';

type Mode = 'giorno' | 'settimana' | 'mese' | 'prep';

export function Plan({ season, focusPrep = false }: { season: Season; focusPrep?: boolean }) {
  const [mode, setMode] = useState<Mode>(focusPrep ? 'prep' : 'giorno');
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
        <button className={mode === 'prep' ? 'active' : ''} onClick={() => setMode('prep')}>
          🍱 Prep
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

      {mode === 'prep' && (
        <PrepView season={season} onOpen={setDetail} factor={factor} includeExtra={includeExtra} overrides={overrides} />
      )}

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
  const statusBySlot = new Map((statusRows ?? []).map((s) => [s.slot, s.status]));
  const setStatus = useCallback(
    async (slot: MealSlot, recipe: Recipe, status: MealStatusValue) => {
      await setMealStatusWithPantry(iso, slot, recipe, status, factor);
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
              {tpl.active ? '🔥 Giorno attivo' : 'Giorno base'}
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
                    <span className="pill olive" style={{ marginLeft: 6 }}>🥡 ufficio</span>
                  )}
                </span>
                <span className="nowrap muted">{m.recipe.kcal} kcal ›</span>
              </div>
              {editable && (
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  <MealStatusButtons
                    active={statusBySlot.get(m.slot)}
                    onSelect={(v) => setStatus(m.slot, m.recipe, v)}
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
                {isToday ? '📍 ' : ''}
                {formatShortDate(d)}
                {tpl ? ` · ${tpl.dayLabel}` : ''}
              </h3>
              <div className="pill-row">
                {tpl?.active && <span className="pill active">🔥 attivo</span>}
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
                        <span className="pill olive" style={{ marginLeft: 4 }}>🥡</span>
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

function PrepView({
  season,
  onOpen,
  factor,
  includeExtra,
  overrides,
}: {
  season: Season;
  onOpen: (r: Recipe) => void;
  factor: number;
  includeExtra: boolean;
  overrides: OverrideMap;
}) {
  const today = useMemo(() => new Date(), []);
  // Settimana target: nel weekend si prepara per la settimana che inizia domani/dopodomani;
  // nei giorni feriali si vede lo stato della settimana in corso.
  const mi = mondayIndex(today);
  const monday = addDays(today, mi >= 5 ? 7 - mi : -mi);
  const days = useMemo(() => Array.from({ length: 5 }, (_, i) => addDays(monday, i)), [monday]);

  const rows = useLiveQuery(() => db.prepLog.toArray(), [], []);
  const doneSet = new Set((rows ?? []).filter((r) => r.done).map((r) => `${r.date}|${r.slot}`));

  // Toggle «prep day fatto» per la settimana target: attiva il riordino dei pranzi.
  const mondayISO = toISODate(monday);
  const prepOn = (rows ?? []).some(
    (r) => r.date === mondayISO && r.slot === PREP_WEEK_SLOT && r.done,
  );

  const togglePrep = useCallback(async (iso: string) => {
    const key: [string, string] = [iso, 'pranzo'];
    const existing = await db.prepLog.get(key);
    if (existing?.done) {
      await db.prepLog.delete(key);
    } else {
      await db.prepLog.put({ date: iso, slot: 'pranzo', done: true, updatedAt: Date.now() });
    }
  }, []);

  const lunches = days.map((d) => {
    const meal = getRecipesForDate(d, season, includeExtra, overrides).find(
      (m) => m.slot === 'pranzo',
    );
    return { date: d, iso: toISODate(d), meal };
  });
  const doneCount = lunches.filter((l) => doneSet.has(`${l.iso}|pranzo`)).length;

  return (
    <div>
      <Card
        title={`Prep day · settimana del ${formatShortDate(monday)}`}
        icon="🍱"
        action={<span className="pill olive">{doneCount}/5 pronti</span>}
      >
        <p className="small muted" style={{ marginTop: -4 }}>
          La domenica prepari in una sola sessione i 5 pranzi da ufficio Lun–Ven: spunta qui
          quelli già pronti in frigo/freezer. Gli ingredienti sono già conteggiati nella Lista
          spesa (modalità 7 giorni).
        </p>
        <ul className="clean" style={{ marginBottom: 10 }}>
          <CheckRow
            checked={prepOn}
            title={<b>🍱 Ho fatto il prep day per questa settimana</b>}
            detail="Attivo: i 5 pranzi vengono ridistribuiti tra i giorni — i più deperibili a inizio settimana, i surgelabili Gio-Ven. Spento: settimana normale del piano. Il piano base non viene mai modificato."
            onToggle={() => setPrepWeek(monday, !prepOn, season, includeExtra)}
          />
        </ul>
        <ul className="clean">
          {lunches.map((l, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'stretch', gap: 6 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {l.meal ? (
                  <CheckRow
                    checked={doneSet.has(`${l.iso}|pranzo`)}
                    title={
                      <>
                        <b>{['Lun', 'Mar', 'Mer', 'Gio', 'Ven'][i]}</b> · {l.meal.recipe.name}
                      </>
                    }
                    detail={
                      <>
                        {scaleRound(l.meal.recipe.kcal, factor)} kcal ·{' '}
                        {prepAdvice(l.meal.recipe.storage, i + 1)}
                        <span className="check-storage">🧺 {l.meal.recipe.storage}</span>
                      </>
                    }
                    onToggle={() => togglePrep(l.iso)}
                  />
                ) : (
                  <p className="muted small">Nessun pranzo pianificato.</p>
                )}
              </div>
              {l.meal && (
                <button
                  className="btn ghost"
                  style={{ flex: '0 0 auto', alignSelf: 'center', minHeight: 38, padding: '0 10px' }}
                  onClick={() => onOpen(l.meal!.recipe)}
                  aria-label={`Apri ricetta ${l.meal.recipe.name}`}
                >
                  ›
                </button>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <div className="banner info">
        🧊 <b>Sicurezza:</b> i pranzi cucinati durano in frigo <b>2-3 giorni</b>, quindi segui
        il verdetto accanto a ogni pranzo: 🧺 frigo da domenica · 🧊 congelato domenica e
        passato in frigo la sera prima · 🍳 componenti (cereali cotti e congelati, scatolette)
        assemblati la sera prima in 5-10 minuti. In inverno Gio-Ven sono zuppe e piatti cotti
        che si congelano; in estate le insalate fredde non si congelano, per quelle vale il 🍳.
        Raffredda i contenitori APERTI prima di chiuderli ed etichetta ogni porzione col giorno.
        In ufficio scaldi al <b>microonde (850 W): 2-3 min</b>, mescolando a metà (le zuppe 3-4
        min, coperte con un piattino).
      </div>

      <Card title="Come organizzare la sessione" icon="⏱️">
        <ol className="steps">
          <li>Metti a cuocere per primi i cereali (farro/orzo/riso reggono bene 3 giorni in frigo): pentole separate o in sequenza.</li>
          <li>Mentre i cereali cuociono, cuoci le proteine in padella o friggitrice (pollo, salmone…), una alla volta.</li>
          <li>Taglia le verdure crude (cetriolo, pomodorini…) e tienile in contenitori separati: le unisci la mattina stessa, così non rilasciano acqua.</li>
          <li>Componi i 5 contenitori, lasciali raffreddare APERTI ~30 minuti, poi chiudi: Lun-Mer in frigo, Gio-Ven in freezer (se congelabili).</li>
          <li>Spunta qui sopra i pranzi pronti: la spunta si sincronizza anche sul telefono.</li>
        </ol>
      </Card>
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
    <Card title={`Panoramica · ${monthName}`} icon="🗓️">
      <p className="small muted" style={{ marginTop: -4 }}>
        🔥 = giorno attivo (tapis roulant, più carboidrati).
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
                  {tpl.active ? '🔥' : ''}
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
