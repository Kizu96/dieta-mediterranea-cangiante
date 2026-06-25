import { useLiveQuery } from 'dexie-react-hooks';
import { getSetting, setSetting } from '../db/db';

const CARB_CYCLING_KEY = 'carbCycling';

/**
 * Ciclizzazione dei carboidrati (reattiva): quando attiva, l'app consiglia di
 * alzare la porzione di cereali nei giorni di allenamento e abbassarla nei giorni
 * leggeri. È solo un CONSIGLIO: non tocca le ricette né i macro salvati.
 * Impostazione per-dispositivo (non sincronizzata), come l'intensità.
 */
export function useCarbCycling() {
  const on = useLiveQuery(() => getSetting<boolean>(CARB_CYCLING_KEY, false), [], false) ?? false;
  return {
    carbCycling: on,
    setCarbCycling: (v: boolean) => setSetting(CARB_CYCLING_KEY, v),
  };
}
