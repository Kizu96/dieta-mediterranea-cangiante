import { useMemo, useState, type CSSProperties } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChefHat, Package, ShoppingCart, Snowflake, Timer } from 'lucide-react';
import type { MealSlot, Recipe, Season } from '../data/types';
import { PREP_MENU } from '../data/prepMenu';
import { db } from '../db/db';
import { addDays, buildOverrideMap, toISODate } from '../lib/planning';
import { missingForRecipeIds, surplusIngredients } from '../lib/shopping';
import { perishUrgency } from '../lib/swap';
import {
  isPrepEditable,
  prepRecipeById,
  prepVerdict,
  setAllPrepMeals,
  setPrepMeal,
  type PrepKind,
} from '../lib/prep';
import { Card } from '../components/Card';
import { CheckRow } from '../components/CheckRow';
import { RecipeDetail } from '../components/RecipeDetail';
import { useHaveSet, usePantryQty } from '../components/usePantry';
import { useFavorites } from '../components/useFavorites';
import { useMealSwap } from '../components/useMealSwap';
import { SwapResultView } from '../components/SwapResultView';
import { StockDot } from '../components/StockDot';
import { useIntensity } from '../components/useIntensity';
import { scaleRound } from '../lib/intensity';
import { formatShortDate, mondayIndex } from '../components/labels';

const DAY_LABEL = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven'];

// Colore del badge verdetto: frigo = menta, freezer = teal forte, fresco = ambra.
function verdictStyle(kind: PrepKind): CSSProperties {
  if (kind === 'freezer') return { background: 'var(--olive-dark)', color: '#fff', borderColor: 'var(--olive-dark)' };
  if (kind === 'fresh') return { background: 'var(--amber)', color: '#fff', borderColor: 'var(--amber)' };
  return { background: 'var(--olive-light)', color: 'var(--olive-dark)' };
}

// Prep day: ha un MENÙ SUO ROTANTE. Spunti i pranzi che hai DAVVERO preparato;
// il giorno dopo la dispensa si scala e i piatti preparati ruotano (varietà).
// I non preparati restano in coda. Il piano base non viene mai modificato.
export function Prep({
  season,
  onGoShopping,
}: {
  season: Season;
  onGoShopping: () => void;
}) {
  const { factor } = useIntensity();
  const haveSet = useHaveSet();
  const qtyMap = usePantryQty();
  const overrideRows = useLiveQuery(() => db.mealOverride.toArray(), [], []);
  const overrides = useMemo(() => buildOverrideMap(overrideRows ?? []), [overrideRows]);

  const today = useMemo(() => new Date(), []);
  const todayISO = toISODate(today);
  // Settimana target: nel weekend si prepara per la settimana che inizia; nei
  // giorni feriali si vede lo stato della settimana in corso.
  const mi = mondayIndex(today);
  const monday = addDays(today, mi >= 5 ? 7 - mi : -mi);
  const days = useMemo(() => Array.from({ length: 5 }, (_, i) => addDays(monday, i)), [monday]);

  // Stato ROTANTE dei 5 posti + selezione per-pasto di ciò che hai preparato.
  const slots = useLiveQuery(() => db.prepSlots.toArray(), [], []);
  const slotMap = useMemo(() => new Map((slots ?? []).map((s) => [s.idx, s.recipeId])), [slots]);
  const prepRows = useLiveQuery(() => db.prepLog.toArray(), [], []);
  const prepByDate = useMemo(
    () => new Map((prepRows ?? []).filter((r) => r.slot === 'pranzo').map((r) => [r.date, r])),
    [prepRows],
  );

  // I dettagli partono APERTI (è la pagina che si tiene davanti mentre si cucina).
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const toggleDay = (i: number) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  // Per ogni giorno: la ricetta è quella PREPARATA (se l'hai spuntata) altrimenti
  // il piatto attuale del posto (il candidato da preparare la prossima volta).
  const lunches = days.map((d, i) => {
    const iso = toISODate(d);
    const row = prepByDate.get(iso);
    const recipeId = row?.recipeId ?? slotMap.get(i) ?? PREP_MENU[i];
    return { date: d, iso, idx: i, row, recipe: recipeId ? prepRecipeById(recipeId) : undefined };
  });
  const allPrepared = lunches.every((l) => l.row?.done);

  // Ids del menù prep CORRENTE (i 5 candidati) per calcolare cosa manca in spesa.
  const menuIds = useMemo(
    () => Array.from({ length: 5 }, (_, i) => slotMap.get(i) ?? PREP_MENU[i]),
    [slotMap],
  );
  const prepMissing = useMemo(
    () => missingForRecipeIds(haveSet, menuIds, qtyMap, factor),
    [haveSet, menuIds, qtyMap, factor],
  );

  // Scambio «non acquistabile»: se manca un ingrediente, scambia il pranzo del
  // menù che lo usa con un'alternativa (deperibili/abbondanze in cima).
  const pantryRows = useLiveQuery(() => db.pantry.toArray(), [], []);
  const favorites = useFavorites();
  const surplus = useMemo(
    () => surplusIngredients(qtyMap, monday, 5, season, true, overrides, factor),
    [qtyMap, monday, season, overrides, factor],
  );
  const perish = useMemo(() => perishUrgency(pantryRows ?? []), [pantryRows]);
  const naSwap = useMealSwap({
    season,
    includeExtra: true,
    overrides,
    ctx: { surplus, perish, haveSet, qtyMap, favorites },
  });
  const affectedFor = (ingId: string) =>
    lunches
      .filter((l) => l.recipe?.ingredients.some((ri) => ri.ingredientId === ingId))
      .map((l) => ({ dateISO: l.iso, slot: 'pranzo' as MealSlot, recipe: l.recipe as Recipe }));

  return (
    <div>
      <Card title={`Settimana del ${formatShortDate(monday)}`} icon={<ChefHat />}>
        <p className="small muted" style={{ marginTop: -4 }}>
          Il prep day ha il suo <b>menù dedicato e rotante</b>, da mangiare <b>freddi</b>. Spunti i
          pranzi che hai <b>davvero preparato</b> (gli altri restano in coda); è annullabile fino a
          domani. Il <b>giorno dopo</b> la dispensa si scala e i piatti preparati <b>ruotano</b> con
          alternative nuove. Il piano base non viene mai toccato.
        </p>
        <button
          className="btn ghost block"
          onClick={() => setAllPrepMeals(monday, season, true)}
          disabled={allPrepared}
          style={allPrepared ? { opacity: 0.5 } : undefined}
        >
          {allPrepared ? '✓ Tutti segnati come preparati' : 'Segna tutti come preparati'}
        </button>
      </Card>

      {prepMissing.length > 0 && (
        <div className="banner warn">
          <b><ShoppingCart size={15} className="ic" /> Compra per il prep day.</b>
          <p className="small" style={{ margin: '6px 0 0' }}>
            Non lo trovi al supermercato? Toccalo e scambio il pranzo che lo usa con un'alternativa.
          </p>
          <div className="chips">
            {prepMissing.map((m) => (
              <button
                key={m.id}
                className="btn ghost"
                style={{ minHeight: 34, padding: '0 12px', fontSize: '0.82rem' }}
                onClick={() => naSwap.markUnavailable(m, affectedFor(m.id))}
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
          <li>Metti a cuocere per primi i cereali e i legumi (farro, orzo, lenticchie): pentole separate o in sequenza.</li>
          <li>Mentre cuociono, prepara le proteine in padella o friggitrice (pollo, ecc.), una alla volta.</li>
          <li>Componi i contenitori. Le verdure crude (per le insalate di inizio settimana) tienile a parte e uniscile la mattina, così non rilasciano acqua.</li>
          <li>Lascia raffreddare i contenitori APERTI ~30 minuti, poi chiudi: inizio settimana in frigo, fine settimana in freezer (in monoporzione).</li>
          <li>Etichetta ogni contenitore col giorno (basta nastro di carta e una penna).</li>
          <li>Spunta qui sotto «L'ho preparato» sui pranzi che hai cucinato: domani la dispensa si aggiorna e quei piatti ruotano.</li>
        </ol>
      </Card>

      <div className="banner info">
        <Snowflake size={15} className="ic" /> <b>Sicurezza:</b> i piatti cotti durano in frigo
        <b> 2-3 giorni</b>, perciò a fine settimana il menù prep congela il piatto o la sua base.
        Segui il badge di ogni giorno: <b>🧺 FRIGO</b> = cotto domenica, tenuto in frigo · <b>🧊
        FREEZER</b> = congelato domenica, in frigo la sera prima · <b>🥗 FRESCO</b> = base congelata,
        verdure crude aggiunte la sera prima. D'estate questi pranzi si mangiano <b>freddi</b>; se
        preferisci caldo, scalda al microonde (850 W) 2-3 min.
      </div>

      {lunches.map((l, i) => {
        const isOpen = !collapsed.has(i);
        const verdict = l.recipe ? prepVerdict(l.recipe, i + 1) : null;
        const confirmed = !!l.row?.confirmed;
        const done = !!l.row?.done;
        const editable = isPrepEditable(l.row, todayISO);
        return (
          <Card
            key={i}
            title={
              l.recipe ? (
                <span style={{ cursor: 'pointer' }} onClick={() => toggleDay(i)}>
                  {DAY_LABEL[i]} {formatShortDate(l.date)} · {l.recipe.name}
                </span>
              ) : (
                `${DAY_LABEL[i]} ${formatShortDate(l.date)}`
              )
            }
            icon={<Package />}
            action={
              l.recipe &&
              verdict && (
                <button
                  onClick={() => toggleDay(i)}
                  aria-expanded={isOpen}
                  aria-label={isOpen ? 'Chiudi dettaglio' : 'Apri dettaglio'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    font: 'inherit',
                    color: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  <span className="pill" style={verdictStyle(verdict.kind)}>
                    {verdict.emoji} {verdict.label}
                  </span>
                  <span aria-hidden="true" style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                    {isOpen ? '▾' : '▸'}
                  </span>
                </button>
              )
            }
          >
            {!l.recipe || !verdict ? (
              <p className="muted small">Nessun pranzo nel menù prep.</p>
            ) : (
              <>
                <p className="small" style={{ marginTop: -4 }}>
                  <b>{verdict.emoji} {verdict.label}</b> — {verdict.detail}{' '}
                  <span className="muted">· {scaleRound(l.recipe.kcal, factor)} kcal</span>
                </p>
                <ul className="clean">
                  {confirmed ? (
                    <li className="check-row checked" style={{ cursor: 'default' }}>
                      <span className="check-box" aria-hidden="true">✓</span>
                      <span className="check-main">
                        <span className="check-title">Preparato</span>
                        <span className="check-detail">
                          Dispensa scalata · piatto ruotato per la prossima volta
                        </span>
                      </span>
                    </li>
                  ) : (
                    <CheckRow
                      checked={done}
                      title="L'ho preparato"
                      detail={
                        done
                          ? editable
                            ? 'Annullabile fino a domani'
                            : 'In conferma…'
                          : 'Spunta solo i pranzi che cucini davvero'
                      }
                      onToggle={() => {
                        if (editable) setPrepMeal(l.date, l.idx, !done, season, true);
                      }}
                    />
                  )}
                </ul>
                {isOpen && <RecipeDetail recipe={l.recipe} factor={factor} />}
              </>
            )}
          </Card>
        );
      })}
    </div>
  );
}
