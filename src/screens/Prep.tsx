import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChefHat, Package, Timer } from 'lucide-react';
import type { Season } from '../data/types';
import { db } from '../db/db';
import { addDays, buildOverrideMap, getRecipesForDate, toISODate } from '../lib/planning';
import { PREP_WEEK_SLOT, prepAdvice, setPrepWeek } from '../lib/prep';
import { Card } from '../components/Card';
import { CheckRow } from '../components/CheckRow';
import { RecipeDetail } from '../components/RecipeDetail';
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
export function Prep({ season }: { season: Season }) {
  const { factor } = useIntensity();
  const { includeExtra } = useExtraRecipes();
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

  return (
    <div>
      <Card title={`Settimana del ${formatShortDate(monday)}`} icon={<ChefHat />}>
        <p className="small muted" style={{ marginTop: -4 }}>
          La domenica prepari in una sola sessione i 5 pranzi da ufficio Lun–Ven. Qui sotto
          trovi ogni ricetta già aperta nel dettaglio, con il verdetto frigo/freezer per ogni
          giorno. Gli ingredienti sono già conteggiati nella Lista spesa (modalità 7 giorni).
        </p>
        <ul className="clean">
          <CheckRow
            checked={prepOn}
            title={<b>🍱 Ho fatto il prep day per questa settimana</b>}
            detail="Attivo: i 5 pranzi vengono ridistribuiti tra i giorni — i più deperibili a inizio settimana, i surgelabili Gio-Ven. Spento: settimana normale del piano. Il piano base non viene mai modificato."
            onToggle={() => setPrepWeek(monday, !prepOn, season, includeExtra)}
          />
        </ul>
      </Card>

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
        🧊 <b>Sicurezza:</b> i pranzi cucinati durano in frigo <b>2-3 giorni</b>, quindi segui
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
