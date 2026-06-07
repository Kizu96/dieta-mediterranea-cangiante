import { useLiveQuery } from 'dexie-react-hooks';
import { getSetting, setSetting } from '../db/db';
import { EXTRA_RECIPES_DEFAULT, EXTRA_RECIPES_SETTING_KEY } from '../lib/extraRecipes';

/** Modalità "ricette extra" (reattiva): include o esclude le ricette che
 *  richiedono prodotti specialistici e il frullatore, + setter. */
export function useExtraRecipes() {
  const includeExtra = (useLiveQuery(
    () => getSetting<boolean>(EXTRA_RECIPES_SETTING_KEY, EXTRA_RECIPES_DEFAULT),
    [],
    EXTRA_RECIPES_DEFAULT,
  ) ?? EXTRA_RECIPES_DEFAULT) as boolean;
  return {
    includeExtra,
    setIncludeExtra: (v: boolean) => setSetting(EXTRA_RECIPES_SETTING_KEY, v),
  };
}
