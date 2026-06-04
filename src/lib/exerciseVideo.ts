// Video dimostrativi per gli esercizi.
// - exerciseVideoId: ID YouTube di un tutorial italiano (da ricerca verificata),
//   incorporato nel dettaglio esercizio. Coperti gli esercizi di forza principali.
// - exerciseSearchUrl: ricerca YouTube (sempre valida) per "altri video" / fallback.

// L'ordine conta: la prima regex che combacia vince.
const VIDEO_IDS: { re: RegExp; id: string }[] = [
  { re: /squat/i, id: 'O3q4X0apJuo' }, // Squat base a corpo libero
  { re: /piegament|push|flession/i, id: 'GT_wiQoPurU' }, // Piegamenti al muro/inclinati
  { re: /plank/i, id: 'Is-7PPaBcsM' }, // Plank esecuzione corretta
  { re: /affond|lunge/i, id: 'TVZd49-3KEw' }, // Affondi
  { re: /ponte|glute/i, id: 'dVjJ8bSgtdY' }, // Ponte glutei
  { re: /rematore|row/i, id: '9NydFqxBbzg' }, // Rematore con elastico
  { re: /spinte|sopra la testa|lento avanti|overhead/i, id: 'AfIJ6VwYR5g' }, // Lento avanti (spinte sopra la testa)
  { re: /stacco|cerniera|hinge/i, id: 'L27jRX6r43Q' }, // Stacco rumeno con elastico
  { re: /camminat|salita|tapis|riscaldament|defaticament|cardio/i, id: 'jmhmdTjb1JE' }, // Salita su tapis roulant
  { re: /mobilit|allungament|stretch|cavigli|toracic/i, id: 'sqbADAzKI50' }, // Mobilità arti inferiori
];

// Esercizi senza dimostrazione dedicata (riposo).
const NO_VIDEO = /^riposo/i;

export function hasExerciseVideo(name: string): boolean {
  return !NO_VIDEO.test(name.trim());
}

export function exerciseVideoId(name: string): string | null {
  const hit = VIDEO_IDS.find((v) => v.re.test(name));
  return hit ? hit.id : null;
}

export function exerciseSearchUrl(name: string): string {
  const q = encodeURIComponent(`${name.trim()} esercizio tecnica esecuzione corretta`);
  return `https://www.youtube.com/results?search_query=${q}`;
}
