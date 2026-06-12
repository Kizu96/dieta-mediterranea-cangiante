import { useLiveQuery } from 'dexie-react-hooks';
import { getSetting, setSetting } from '../db/db';

// Tema dell'app: toggle Giorno/Notte nella topbar (niente "auto": l'utente
// preferisce il controllo diretto). Impostazione per-dispositivo (come stagione
// e intensità: NON sincronizzata).
export type ThemePref = 'chiaro' | 'scuro';
export const THEME_SETTING_KEY = 'themePref';

export function useThemePref(): { pref: ThemePref; setPref: (t: ThemePref) => Promise<void> } {
  const raw = useLiveQuery(
    () => getSetting<string>(THEME_SETTING_KEY, 'chiaro'),
    [],
    'chiaro',
  );
  // I dispositivi che avevano il vecchio valore 'auto' ripartono dal chiaro.
  const pref: ThemePref = raw === 'scuro' ? 'scuro' : 'chiaro';
  return { pref, setPref: (t) => setSetting(THEME_SETTING_KEY, t) };
}

// Colore della barra di stato (meta theme-color) per tema: chiaro = turchese
// dell'header, scuro = teal notte dell'header scuro.
export const THEME_COLOR: Record<ThemePref, string> = {
  chiaro: '#2f9389',
  scuro: '#12332f',
};
