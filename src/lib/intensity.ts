// Intensità della dieta: modula la DIMENSIONE delle porzioni (e quindi kcal/macro
// e quantità della spesa) tramite un fattore moltiplicativo applicato a display.
//
// - moderata (default): porzioni piene → ~1900-2200 kcal/die, deficit sostenibile.
// - intensiva: porzioni ridotte → ~1450-1770 kcal/die, deficit alto, perdita rapida.
export type Intensity = 'moderata' | 'intensiva';

export const INTENSITY_FACTOR: Record<Intensity, number> = {
  moderata: 1.3,
  intensiva: 1,
};

export const INTENSITY_LABEL: Record<Intensity, string> = {
  moderata: 'Moderata',
  intensiva: 'Intensiva',
};

export const INTENSITY_DESC: Record<Intensity, string> = {
  moderata: 'Porzioni piene · deficit moderato e sostenibile (~1900-2200 kcal/giorno).',
  intensiva: 'Porzioni ridotte · deficit alto, perdita più rapida (~1450-1770 kcal/giorno).',
};

export const INTENSITY_SETTING_KEY = 'intensity';

/** kcal/macro arrotondati al fattore. */
export const scaleRound = (value: number, factor: number): number => Math.round(value * factor);

/** Quantità ingrediente: arrotonda a 1 decimale per restare leggibile. */
export const scaleQty = (qty: number, factor: number): number => Math.round(qty * factor * 10) / 10;
