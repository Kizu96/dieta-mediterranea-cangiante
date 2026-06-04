import { useLiveQuery } from 'dexie-react-hooks';
import { getSetting, setSetting } from '../db/db';
import { INTENSITY_FACTOR, INTENSITY_SETTING_KEY, type Intensity } from '../lib/intensity';

/** Intensità corrente (reattiva) + fattore di porzione + setter. */
export function useIntensity() {
  const intensity = (useLiveQuery(
    () => getSetting<Intensity>(INTENSITY_SETTING_KEY, 'moderata'),
    [],
    'moderata',
  ) ?? 'moderata') as Intensity;
  return {
    intensity,
    factor: INTENSITY_FACTOR[intensity],
    setIntensity: (i: Intensity) => setSetting(INTENSITY_SETTING_KEY, i),
  };
}
