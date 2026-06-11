import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Season } from './data/types';
import { getSetting, setSetting } from './db/db';
import { currentSeasonByDate } from './lib/season';
import { addDays, buildOverrideMap } from './lib/planning';
import { missingForDate } from './lib/shopping';
import { EXTRA_RECIPES_DEFAULT, EXTRA_RECIPES_SETTING_KEY } from './lib/extraRecipes';
import { INTENSITY_FACTOR, INTENSITY_SETTING_KEY, type Intensity } from './lib/intensity';
import { getNotifPrefs, scheduleAll } from './lib/notifications';
import { requestPersistentStorage } from './lib/storage';
import { syncInBackground } from './lib/sync';
import { db } from './db/db';
import { BottomNav, type ViewKey } from './components/BottomNav';
import { Today } from './screens/Today';
import { Plan } from './screens/Plan';
import { Recipes } from './screens/Recipes';
import { Pantry } from './screens/Pantry';
import { Shopping } from './screens/Shopping';
import { Weight } from './screens/Weight';
import { Workouts } from './screens/Workouts';
import { Guide } from './screens/Guide';
import { Settings } from './screens/Settings';

const SEASON_OVERRIDE_KEY = 'seasonOverride';

const TITLES: Record<ViewKey, string> = {
  oggi: 'Oggi',
  piano: 'Piano',
  ricette: 'Ricette',
  dispensa: 'Dispensa',
  spesa: 'Lista spesa',
  peso: 'Peso',
  allenamenti: 'Allenamenti',
  guida: 'Guida',
};

function App() {
  const [view, setView] = useState<ViewKey>('oggi');
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

  // Sincronizzazione cloud (se attiva): all'avvio e ogni volta che l'app torna
  // in primo piano. Quando l'app passa in background fa un ultimo push, così
  // l'altro dispositivo ritrova subito i dati aggiornati.
  useEffect(() => {
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
          const items = await db.pantry.toArray();
          const haveSet = new Set(items.filter((p) => p.have).map((p) => p.ingredientId));
          const qtyMap = new Map(
            items.filter((p) => p.qty != null).map((p) => [p.ingredientId, p.qty as number]),
          );
          const includeExtra = await getSetting<boolean>(
            EXTRA_RECIPES_SETTING_KEY,
            EXTRA_RECIPES_DEFAULT,
          );
          const intensity = await getSetting<Intensity>(INTENSITY_SETTING_KEY, 'moderata');
          const overrides = buildOverrideMap(await db.mealOverride.toArray());
          return (
            missingForDate(
              haveSet,
              addDays(new Date(), 1),
              season,
              includeExtra,
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
        <h1>🫒 {TITLES[view]}</h1>
        <button className="header-btn" onClick={() => setShowSettings(true)} aria-label="Impostazioni">
          ⚙️
        </button>
      </header>

      <main className="screen">
        {view === 'oggi' && (
          <Today
            season={season}
            onSeasonOverride={setSeasonOverride}
            onGoShopping={() => {
              setSpesaDomani(true);
              setView('spesa');
            }}
          />
        )}
        {view === 'piano' && <Plan season={season} />}
        {view === 'ricette' && <Recipes season={season} />}
        {view === 'dispensa' && <Pantry season={season} />}
        {view === 'spesa' && <Shopping season={season} focusTomorrow={spesaDomani} />}
        {view === 'peso' && <Weight />}
        {view === 'allenamenti' && <Workouts />}
        {view === 'guida' && <Guide />}
      </main>

      <BottomNav
        current={view}
        onChange={(v) => {
          setSpesaDomani(false); // dalla navigazione la Spesa mostra la lista completa
          setView(v);
        }}
      />

      {showSettings && (
        <Settings
          season={season}
          seasonOverride={seasonOverride ?? null}
          onSeasonOverride={setSeasonOverride}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
}

export default App;
