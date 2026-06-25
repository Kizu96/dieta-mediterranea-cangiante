import { lazy, Suspense, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CloudAlert, Moon, Settings as SettingsIcon, Sun } from 'lucide-react';
import type { Season } from './data/types';
import { getSetting, setSetting } from './db/db';
import { currentSeasonByDate } from './lib/season';
import { addDays, buildOverrideMap, toISODate } from './lib/planning';
import { missingForDate } from './lib/shopping';
import { INTENSITY_FACTOR, INTENSITY_SETTING_KEY, type Intensity } from './lib/intensity';
import { getNotifPrefs, scheduleAll } from './lib/notifications';
import { getVacation, isVacationDay } from './lib/vacation';
import { requestPersistentStorage } from './lib/storage';
import { getSyncStatus, startAutoSync, SYNC_EVENT, syncInBackground } from './lib/sync';
import { db } from './db/db';
import { ensurePrepSeeded, migratePrepLegacy, processDuePrep } from './lib/prep';
import { THEME_COLOR, useThemePref } from './components/useTheme';
import { BottomNav, type ViewKey } from './components/BottomNav';
import { Today } from './screens/Today';

// Tutte le schermate tranne "Oggi" sono lazy: il primo avvio carica solo la
// home, il resto arriva quando serve (il service worker poi precacha tutto,
// quindi offline funzionano comunque).
const Plan = lazy(() => import('./screens/Plan').then((m) => ({ default: m.Plan })));
const Prep = lazy(() => import('./screens/Prep').then((m) => ({ default: m.Prep })));
const Recipes = lazy(() => import('./screens/Recipes').then((m) => ({ default: m.Recipes })));
const Pantry = lazy(() => import('./screens/Pantry').then((m) => ({ default: m.Pantry })));
const Shopping = lazy(() => import('./screens/Shopping').then((m) => ({ default: m.Shopping })));
const Weight = lazy(() => import('./screens/Weight').then((m) => ({ default: m.Weight })));
const Workouts = lazy(() => import('./screens/Workouts').then((m) => ({ default: m.Workouts })));
const Guide = lazy(() => import('./screens/Guide').then((m) => ({ default: m.Guide })));
const Settings = lazy(() => import('./screens/Settings').then((m) => ({ default: m.Settings })));

const ScreenFallback = () => <p className="muted small center" style={{ padding: 24 }}>Carico…</p>;

const SEASON_OVERRIDE_KEY = 'seasonOverride';

const TITLES: Record<ViewKey, string> = {
  oggi: 'Oggi',
  piano: 'Piano',
  prep: 'Prep day',
  ricette: 'Ricette',
  dispensa: 'Dispensa',
  spesa: 'Lista spesa',
  peso: 'Peso',
  allenamenti: 'Allenamenti',
  guida: 'Guida',
};

// Vista iniziale dal parametro ?view= (scorciatoie Android del manifest).
function initialView(): ViewKey {
  const v = new URLSearchParams(window.location.search).get('view');
  return v && v in TITLES ? (v as ViewKey) : 'oggi';
}

function App() {
  const [view, setView] = useState<ViewKey>(initialView);
  const [showSettings, setShowSettings] = useState(false);
  // true = la schermata Spesa si apre sui soli ingredienti di domani (dal banner "Compra per domani").
  const [spesaDomani, setSpesaDomani] = useState(false);

  // Override stagione persistito ('estate' | 'inverno' | null = auto).
  const seasonOverride = useLiveQuery(
    () => getSetting<Season | null>(SEASON_OVERRIDE_KEY, null),
    [],
    null,
  );
  const season: Season = seasonOverride ?? currentSeasonByDate();

  const setSeasonOverride = async (s: Season | null) => {
    await setSetting(SEASON_OVERRIDE_KEY, s);
  };

  // All'avvio: chiede storage persistente così il browser non cancella i dati locali.
  useEffect(() => {
    requestPersistentStorage();
  }, []);

  // Prep day: alla prima apertura semina/ripara i 5 posti e ripulisce una volta il
  // vecchio stato del toggle unico. Poi CONFERMA i prep marcati nei giorni scorsi
  // (scala la dispensa + ruota i piatti) — NON solo al montaggio ma anche quando
  // l'app torna in primo piano: una PWA "il giorno dopo" di solito riprende dal
  // background senza ricaricarsi, quindi senza questo la rotazione non scatterebbe.
  // processDuePrep è idempotente (i prep marcati oggi non sono ancora "scaduti",
  // i confermati vengono saltati): può girare a ogni resume senza danni.
  useEffect(() => {
    let cancelled = false;
    const runDuePrep = async () => {
      const intensity = await getSetting<Intensity>(INTENSITY_SETTING_KEY, 'moderata');
      if (!cancelled) await processDuePrep(toISODate(new Date()), INTENSITY_FACTOR[intensity]);
    };
    (async () => {
      await ensurePrepSeeded();
      await migratePrepLegacy(toISODate(new Date()));
      await runDuePrep();
    })();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') runDuePrep();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Tema chiaro/scuro (toggle nella topbar): applica data-theme e aggiorna il
  // colore della barra di stato.
  const { pref: themePref, setPref: setThemePref } = useThemePref();
  useEffect(() => {
    document.documentElement.dataset.theme = themePref === 'scuro' ? 'dark' : 'light';
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLOR[themePref]);
  }, [themePref]);

  // Indicatore di sync fallita nell'header: si aggiorna a ogni sync (evento).
  const [syncFailed, setSyncFailed] = useState(false);
  useEffect(() => {
    const refresh = () => {
      const s = getSyncStatus();
      setSyncFailed(s.enabled && s.lastError != null);
    };
    refresh();
    window.addEventListener(SYNC_EVENT, refresh);
    return () => window.removeEventListener(SYNC_EVENT, refresh);
  }, []);

  // Sincronizzazione cloud (se attiva): all'avvio, a ogni modifica dei dati
  // (startAutoSync) e ogni volta che l'app torna in primo piano o passa in
  // background — così l'altro dispositivo ritrova subito i dati aggiornati.
  useEffect(() => {
    startAutoSync(); // ogni modifica ai dati programma un push (debounce)
    syncInBackground();
    const onVisibility = () => {
      if (document.visibilityState === 'visible' || document.visibilityState === 'hidden') {
        syncInBackground();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // All'avvio: pianifica i promemoria in base alle preferenze salvate.
  // (Funziona solo mentre l'app è aperta — vedi note in notifications.ts.)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const prefs = await getNotifPrefs();
      if (cancelled || !prefs.enabled) return;
      await scheduleAll(prefs, {
        hasMissingForTomorrow: async () => {
          // In vacanza il promemoria spesa tace.
          const tomorrowISO = toISODate(addDays(new Date(), 1));
          if (isVacationDay(tomorrowISO, await getVacation())) return false;
          const items = await db.pantry.toArray();
          const haveSet = new Set(items.filter((p) => p.have).map((p) => p.ingredientId));
          const qtyMap = new Map(
            items.filter((p) => p.qty != null).map((p) => [p.ingredientId, p.qty as number]),
          );
          const intensity = await getSetting<Intensity>(INTENSITY_SETTING_KEY, 'moderata');
          const overrides = buildOverrideMap(await db.mealOverride.toArray());
          return (
            missingForDate(
              haveSet,
              addDays(new Date(), 1),
              season,
              true, // ricette extra sempre incluse
              overrides,
              qtyMap,
              INTENSITY_FACTOR[intensity],
            ).length > 0
          );
        },
      });
    })();
    return () => {
      cancelled = true;
    };
    // Ripianifica se cambia la stagione (cambia "cosa manca per domani").
  }, [season]);

  return (
    <>
      <header className="app-header">
        <h1>{TITLES[view]}</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="header-btn"
            onClick={() => setThemePref(themePref === 'scuro' ? 'chiaro' : 'scuro')}
            aria-label={themePref === 'scuro' ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
            title={themePref === 'scuro' ? 'Tema chiaro' : 'Tema scuro'}
          >
            {themePref === 'scuro' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          {syncFailed && (
            <button
              className="header-btn"
              onClick={() => setShowSettings(true)}
              aria-label="Sincronizzazione non riuscita: apri le impostazioni"
              title="Ultima sincronizzazione non riuscita"
              style={{ color: '#ffd9a8' }}
            >
              <CloudAlert size={20} />
            </button>
          )}
          <button className="header-btn" onClick={() => setShowSettings(true)} aria-label="Impostazioni">
            <SettingsIcon size={20} />
          </button>
        </div>
      </header>

      <main className="screen">
        <Suspense fallback={<ScreenFallback />}>
          {view === 'oggi' && (
            <Today
              season={season}
              onSeasonOverride={setSeasonOverride}
              onGoShopping={() => {
                setSpesaDomani(true);
                setView('spesa');
              }}
              onGoPrep={() => setView('prep')}
            />
          )}
          {view === 'piano' && <Plan season={season} />}
          {view === 'prep' && (
            <Prep
              season={season}
              onGoShopping={() => {
                setSpesaDomani(false); // per il prep serve la lista completa, non solo domani
                setView('spesa');
              }}
            />
          )}
          {view === 'ricette' && <Recipes season={season} />}
          {view === 'dispensa' && <Pantry season={season} />}
          {view === 'spesa' && <Shopping season={season} focusTomorrow={spesaDomani} />}
          {view === 'peso' && <Weight />}
          {view === 'allenamenti' && <Workouts />}
          {view === 'guida' && <Guide />}
        </Suspense>
      </main>

      <BottomNav
        current={view}
        onChange={(v) => {
          setSpesaDomani(false); // dalla navigazione la Spesa mostra la lista completa
          setView(v);
        }}
      />

      {showSettings && (
        <Suspense fallback={null}>
          <Settings
            season={season}
            seasonOverride={seasonOverride ?? null}
            onSeasonOverride={setSeasonOverride}
            onClose={() => setShowSettings(false)}
          />
        </Suspense>
      )}
    </>
  );
}

export default App;
