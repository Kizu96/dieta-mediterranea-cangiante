/** Modalità "ricette extra". L'utente ha il frullatore e i prodotti speciali,
 *  quindi le ricette extra (frullato verde, matcha, germogli, tahin) sono
 *  SEMPRE incluse: si scambiano a mano dal piano quando manca un ingrediente.
 *  Niente più toggle — `includeExtra` è sempre `true`. */
export function useExtraRecipes() {
  return { includeExtra: true as const };
}
