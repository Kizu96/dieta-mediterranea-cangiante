import { useLiveQuery } from 'dexie-react-hooks';
import { getSetting, setSetting } from '../db/db';

// Tema dell'app: Auto (segue il sistema) / Chiaro / Scuro.
// Impostazione per-dispositivo (come stagione e intensità: NON sincronizzata).
export type ThemePref = 'auto' | 'chiaro' | 'scuro';
export const THEME_SETTING_KEY = 'themePref';

export function useThemePref(): { pref: ThemePref; setPref: (t: ThemePref) => Promise<void> } {
  const pref = useLiveQuery(
    () => getSetting<ThemePref>(THEME_SETTING_KEY, 'auto'),
    [],
    'auto' as ThemePref,
  );
  return { pref: pref ?? 'auto', setPref: (t) => setSetting(THEME_SETTING_KEY, t) };
}

/** Tema effettivo da applicare ('light' | 'dark') data la preferenza. */
export function resolveTheme(pref: ThemePref, systemDark: boolean): 'light' | 'dark' {
  if (pref === 'scuro') return 'dark';
  if (pref === 'chiaro') return 'light';
  return systemDark ? 'dark' : 'light';
}

// Colore della barra di stato (meta theme-color) per tema: chiaro = turchese
// dell'header, scuro = teal notte dell'header scuro.
export const THEME_COLOR: Record<'light' | 'dark', string> = {
  light: '#2f9389',
  dark: '#12332f',
};
