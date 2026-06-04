// Link a un video dimostrativo per ogni esercizio.
// Usiamo una ricerca YouTube basata sul nome: sempre valida (nessun link morto)
// e mostra più tutorial reali della posizione/tecnica, in italiano.
// (Non includiamo foto-step con licenza: i video coprono le posizioni passo-passo.)

// Esercizi "generici" senza video dedicato.
const SKIP = /^(riscaldamento|defaticamento|riposo|mobilità|allungamento)/i;

export function exerciseVideoUrl(name: string): string | null {
  const n = name.trim();
  if (!n || SKIP.test(n)) return null;
  const q = encodeURIComponent(`${n} esercizio tecnica esecuzione corretta`);
  return `https://www.youtube.com/results?search_query=${q}`;
}
