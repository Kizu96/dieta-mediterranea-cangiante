import { useLiveQuery } from 'dexie-react-hooks';
import { getSetting, setSetting } from '../db/db';

// Modalità vacanza: nel periodo indicato l'app non rimprovera — niente banner
// spesa/frigo/prep, lista spesa del piano in pausa, lo streak non si rompe.
// Impostazione per-dispositivo (le settings non si sincronizzano): impostala
// su entrambi i dispositivi se la usi.
export interface Vacation {
  from: string; // ISO yyyy-mm-dd (incluso)
  to: string; // ISO yyyy-mm-dd (incluso)
}

export const VACATION_KEY = 'vacation';

export function isVacationDay(iso: string, v: Vacation | null | undefined): boolean {
  return v != null && iso >= v.from && iso <= v.to;
}

export function useVacation(): {
  vacation: Vacation | null;
  setVacation: (v: Vacation | null) => Promise<void>;
} {
  const vacation = useLiveQuery(() => getSetting<Vacation | null>(VACATION_KEY, null), [], null);
  return { vacation: vacation ?? null, setVacation: (v) => setSetting(VACATION_KEY, v) };
}

/** Lettura una-tantum (per i promemoria, fuori da React). */
export async function getVacation(): Promise<Vacation | null> {
  return getSetting<Vacation | null>(VACATION_KEY, null);
}
