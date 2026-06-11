import { useCallback, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Recipe, Season } from '../data/types';
import { db } from '../db/db';
import { addDays, buildOverrideMap, getRecipesForDate, toISODate } from '../lib/planning';
import { PREP_WEEK_SLOT, prepAdvice, setPrepWeek } from '../lib/prep';
import { Card } from '../components/Card';
import { CheckRow } from '../components/CheckRow';
import { Modal } from '../components/Modal';
import { RecipeDetail } from '../components/RecipeDetail';
import { useIntensity } from '../components/useIntensity';
import { useExtraRecipes } from '../components/useExtraRecipes';
import { scaleRound } from '../lib/intensity';
import { formatShortDate, mondayIndex } from '../components/labels';

// Sezione Prep day: la domenica si preparano in una sessione i 5 pranzi da
// ufficio Lun–Ven. Consultabile e modificabile OGNI giorno (toggle, spunte,
// verdetti frigo/freezer), non solo la domenica.
export function Prep({ season }: { season: Season }) {
  const [detail, setDetail] = useState<Recipe | null>(null);
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
        title={`Settimana del ${formatShortDate(monday)}`}
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
                  onClick={() => setDetail(l.meal!.recipe)}
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

      {detail && (
        <Modal title={detail.name} onClose={() => setDetail(null)}>
          <RecipeDetail recipe={detail} factor={factor} />
        </Modal>
      )}
    </div>
  );
}
