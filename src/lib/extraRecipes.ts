// Modalità "ricette extra": consente di includere/escludere dal piano e dalla
// lista della spesa le ricette che richiedono prodotti specialistici (acquisto
// online/Amazon) e/o il frullatore. Utile per decidere cosa comprare davvero.
//
// Quando è DISATTIVATA (includeExtra = false):
//  - le ricette segnate `extra` vengono sostituite dal loro `fallbackId` (ricetta
//    base con soli ingredienti da supermercato, niente frullatore);
//  - dalle altre ricette vengono rimossi gli ingredienti "extra" usati come
//    guarnizione (germogli da coltivare, tahin), così non finiscono nella spesa.

export const EXTRA_RECIPES_SETTING_KEY = 'includeExtraRecipes';

// Default: DISATTIVATO → modalità "solo supermercato", nessun prodotto da ordinare
// online e nessun frullatore richiesto. Si può attivare in Impostazioni quando si
// hanno germogli/spirulina/matcha/tahin + frullatore.
export const EXTRA_RECIPES_DEFAULT = false;

// Ingredienti "extra" rimossi come guarnizione quando la modalità è disattivata.
// (germogli = richiedono semi + barattolo di germogliazione; tahin = crema di sesamo)
export const EXTRA_GARNISH_IDS = new Set<string>([
  'broccoli-germogli',
  'germogli-misti',
  'tahin',
]);
