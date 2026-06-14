import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChefHat, Package, ShoppingCart, Snowflake, Timer } from 'lucide-react';
import type { Season } from '../data/types';
import { db } from '../db/db';
import { addDays, buildOverrideMap, getRecipesForDate, toISODate } from '../lib/planning';
import { missingForRange, surplusIngredients } from '../lib/shopping';
import { mealsUsingIngredient, perishUrgency } from '../lib/swap';
import { PREP_WEEK_SLOT, prepAdvice, setPrepWeek } from '../lib/prep';
import { Card } from '../components/Card';
import { CheckRow } from '../components/CheckRow';
import { RecipeDetail } from '../components/RecipeDetail';
import { useHaveSet, usePantryQty } from '../components/usePantry';
import { useFavorites } from '../components/useFavorites';
import { useMealSwap } from '../components/useMealSwap';
import { SwapResultView } from '../components/SwapResultView';
import { StockDot } from '../components/StockDot';
import { useIntensity } from '../components/useIntensity';
import { useExtraRecipes } from '../components/useExtraRecipes';
import { scaleRound } from '../lib/intensity';
import { formatShortDate, mondayIndex } from '../components/labels';

const DAY_LABEL = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven'];

// Sezione Prep day: la domenica si preparano in una sola sessione i 5 pranzi da
// ufficio Lun–Ven. Layout stile "Oggi": un'unica spunta (il toggle «prep day
// fatto») e, per ogni giorno, la ricetta completa visualizzata in dettaglio
// direttamente nella pagina — ingredienti, tagli, passi, conservazione — così
// durante la sessione di cucina non serve aprire nulla.
export function Prep({
  season,
  onGoShopping,
}: {
  season: Season;
  onGoShopping: () => void;
}) {
  const { factor } = useIntensity();
  const { includeExtra } = useExtraRecipes();
  const haveSet = useHaveSet();
  const qtyMap = usePantryQty();
  const overrideRows = useLiveQuery(() => db.mealOverride.toArray(), [], []);
  const overrides = useMemo(() => buildOverrideMap(overrideRows ?? []), [overrideRows]);

  const today = useMemo(() => new Date(), []);
  // Settimana target: nel weekend si prepara per la settimana che inizia domani/dopodomani;
  // nei giorni feriali si vede lo stato della settimana in corso.
  const mi = mondayIndex(today);
  const monday = addDays(today, mi >= 5 ? 7 - mi : -mi);
  const days = useMemo(() => Array.from({ length: 5 }, (_, i) => addDays(monday, i)), [monday]);

  // Toggle «prep day fatto» per la settimana target: attiva il riordino dei pranzi.
  const mondayISO = toISODate(monday);
  const rows = useLiveQuery(() => db.prepLog.toArray(), [], []);
  const prepOn = (rows ?? []).some(
    (r) => r.date === mondayISO && r.slot === PREP_WEEK_SLOT && r.done,
  );

  // I dettagli partono tutti APERTI (è la pagina che si tiene davanti mentre si
  // cucina); ogni giorno si può richiudere dal suo titolo.
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const toggleDay = (i: number) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const lunches = days.map((d) => {
    const meal = getRecipesForDate(d, season, includeExtra, overrides).find(
      (m) => m.slot === 'pranzo',
    );
    return { date: d, meal };
  });

  // Cosa manca per cucinare i 5 pranzi della settimana (solo lo slot pranzo,
  // confrontato con la dispensa). Stesso identico avviso del banner "Compra per
  // domani" di Oggi, qui mirato alla sessione di prep.
  const prepMissing = useMemo(
    () => missingForRange(haveSet, monday, 5, season, includeExtra, overrides, qtyMap, factor, 'pranzo'),
    [haveSet, monday, season, includeExtra, overrides, qtyMap, factor],
  );

  // Scambio «non acquistabile» dei pranzi: stessa logica di Oggi, finestra = i 5
  // pranzi della settimana, ricetta scelta per smaltire deperibili/abbondanze.
  const pantryRows = useLiveQuery(() => db.pantry.toArray(), [], []);
  const favorites = useFavorites();
  const surplus = useMemo(
    () => surplusIngredients(qtyMap, monday, 5, season, includeExtra, overrides, factor),
    [qtyMap, monday, season, includeExtra, overrides, factor],
  );
  const perish = useMemo(() => perishUrgency(pantryRows ?? []), [pantryRows]);
  const naSwap = useMealSwap({
    season,
    includeExtra,
    overrides,
    ctx: { surplus, perish, haveSet, qtyMap, favorites },
  });

  return (
    <div>
      <Card title={`Settimana del ${formatShortDate(monday)}`} icon={<ChefHat />}>
        <p className="small muted" style={{ marginTop: -4 }}>
          La domenica prepari in una sola sessione i 5 pranzi da ufficio Lun–Ven. Qui sotto
          trovi ogni ricetta già aperta nel dettaglio, con il verdetto frigo/freezer per ogni
          giorno. Se manca qualcosa per i 5 pranzi te lo segnalo qui sotto, come fa «Oggi».
        </p>
        <ul className="clean">
          <CheckRow
            checked={prepOn}
            title={<b>Ho fatto il prep day per questa settimana</b>}
            detail="Attivo: i 5 pranzi vengono ridistribuiti tra i giorni — i più deperibili a inizio settimana, i surgelabili Gio-Ven. Spento: settimana normale del piano. Il piano base non viene mai modificato."
            onToggle={() => setPrepWeek(monday, !prepOn, season, includeExtra)}
          />
        </ul>
      </Card>

      {prepMissing.length > 0 && (
        <div className="banner warn">
          <b><ShoppingCart size={15} className="ic" /> Compra per il prep day.</b>
          <p className="small" style={{ margin: '6px 0 0' }}>
            Non lo trovi al supermercato? Toccalo e scambio il pranzo con una ricetta che usa ciò
            che hai in abbondanza o sta per scadere.
          </p>
          <div className="chips">
            {prepMissing.map((m) => (
              <button
                key={m.id}
                className="btn ghost"
                style={{ minHeight: 34, padding: '0 12px', fontSize: '0.82rem' }}
                onClick={() =>
                  naSwap.markUnavailable(
                    m,
                    mealsUsingIngredient(monday, 5, season, includeExtra, overrides, m.id, 'pranzo'),
                  )
                }
              >
                <StockDot level={(qtyMap.get(m.id) ?? 0) > 0 ? 'low' : 'out'} /> {m.name}
              </button>
            ))}
          </div>
          <SwapResultView swap={naSwap} />
          <div style={{ marginTop: 10 }}>
            <button className="btn terracotta" onClick={onGoShopping}>
              Apri lista spesa
            </button>
          </div>
        </div>
      )}

      <Card title="Come organizzare la sessione" icon={<Timer />}>
        <ol className="steps">
          <li>Metti a cuocere per primi i cereali (farro/orzo/riso reggono bene 3 giorni in frigo): pentole separate o in sequenza.</li>
          <li>Mentre i cereali cuociono, cuoci le proteine in padella o friggitrice (pollo, salmone…), una alla volta.</li>
          <li>Taglia le verdure crude (cetriolo, pomodorini…) e tienile in contenitori separati: le unisci la mattina stessa, così non rilasciano acqua.</li>
          <li>Componi i 5 contenitori, lasciali raffreddare APERTI ~30 minuti, poi chiudi: Lun-Mer in frigo, Gio-Ven in freezer (se congelabili).</li>
          <li>Etichetta ogni contenitore col giorno della settimana (basta un pezzo di nastro di carta e una penna).</li>
        </ol>
      </Card>

      <div className="banner info">
        <Snowflake size={15} className="ic" /> <b>Sicurezza:</b> i pranzi cucinati durano in frigo <b>2-3 giorni</b>, quindi segui
        il verdetto sotto al titolo di ogni giorno: 🧺 frigo da domenica · 🧊 congelato domenica
        e passato in frigo la sera prima · 🍳 componenti (cereali cotti e congelati, scatolette)
        assemblati la sera prima in 5-10 minuti. In inverno Gio-Ven sono zuppe e piatti cotti
        che si congelano; in estate le insalate fredde non si congelano, per quelle vale il 🍳.
        Raffredda i contenitori APERTI prima di chiuderli ed etichetta ogni porzione col giorno.
        In ufficio scaldi al <b>microonde (850 W): 2-3 min</b>, mescolando a metà (le zuppe 3-4
        min, coperte con un piattino).
      </div>

      {lunches.map((l, i) => {
        const isOpen = !collapsed.has(i);
        return (
          <Card
            key={i}
            title={
              l.meal ? (
                <span style={{ cursor: 'pointer' }} onClick={() => toggleDay(i)}>
                  {DAY_LABEL[i]} {formatShortDate(l.date)} · {l.meal.recipe.name}
                </span>
              ) : (
                `${DAY_LABEL[i]} ${formatShortDate(l.date)}`
              )
            }
            icon={<Package />}
            action={
              l.meal && (
                <button
                  onClick={() => toggleDay(i)}
                  aria-expanded={isOpen}
                  aria-label={isOpen ? 'Chiudi dettaglio' : 'Apri dettaglio'}
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
                  <span className="pill olive">{scaleRound(l.meal.recipe.kcal, factor)} kcal</span>
                  <span aria-hidden="true" style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                    {isOpen ? '▾' : '▸'}
                  </span>
                </button>
              )
            }
          >
            {!l.meal ? (
              <p className="muted small">Nessun pranzo pianificato.</p>
            ) : (
              <>
                <p className="small" style={{ marginTop: -4 }}>
                  {prepAdvice(l.meal.recipe.storage, i + 1)}
                </p>
                {isOpen && <RecipeDetail recipe={l.meal.recipe} factor={factor} />}
              </>
            )}
          </Card>
        );
      })}
    </div>
  );
}
