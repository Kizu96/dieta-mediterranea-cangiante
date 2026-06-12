// ===========================================================================
// Tracker dei germogli di broccoli in mason jar (pilastro quotidiano: vanno
// coltivati in casa, con risciacqui 2 volte al giorno per ~5 giorni — facile
// scordarseli). Un record per barattolo: avviato (giorno 0 = ammollo) →
// raccolto (in frigo). Il barattolo attivo è quello senza harvestedAt.
// ===========================================================================
import { db, type SproutBatch } from '../db/db';
import { toISODate } from './planning';

export const SPROUT_READY_DAY = 5; // giorni tipici semina→raccolto per i broccoli

/** Giorni interi trascorsi dall'avvio del barattolo (avvio = giorno 0, l'ammollo). */
export function sproutDay(batch: SproutBatch, today = new Date()): number {
  const start = new Date(batch.startedAt + 'T00:00:00');
  return Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86400000));
}

/** Istruzione del giorno per il barattolo attivo. */
export function sproutInstruction(day: number): string {
  if (day === 0)
    return 'Giorno 0 — Ammollo: copri 1-2 cucchiai di semi con acqua fresca nel barattolo (rete o garza sul coperchio) e lasciali 8-12 ore. Stasera scola bene e appoggia il barattolo inclinato a testa in giù.';
  if (day === 1)
    return 'Giorno 1 — Sciacqua e scola 2 volte (mattina e sera): riempi d’acqua, ruota, svuota TUTTA l’acqua e rimetti il barattolo inclinato a testa in giù, lontano dalla luce diretta.';
  if (day <= 3)
    return `Giorno ${day} — Sciacqua e scola 2 volte (mattina e sera). Vedrai le prime codine bianche: è normale che i semi di broccolo facciano una peluria radicale, non è muffa.`;
  if (day === 4)
    return 'Giorno 4 — Quasi pronti: continua i 2 risciacqui e da oggi tieni il barattolo in luce INDIRETTA (mai sole diretto) così le foglioline diventano verdi.';
  if (day === SPROUT_READY_DAY)
    return 'Giorno 5 — Pronti! 🎉 Ultimo risciacquo abbondante, scola e asciuga bene (carta assorbente), poi in frigo in un contenitore con carta sul fondo: durano 5-7 giorni. Avvia subito il prossimo barattolo per non restare senza.';
  return `Giorno ${day} — Sono oltre il punto ideale: raccoglili OGGI (risciacquo, asciuga, frigo). Più crescono, più diventano amari e delicati.`;
}

/** Barattolo attivo (non ancora raccolto), il più recente. */
export async function activeBatch(): Promise<SproutBatch | undefined> {
  const all = await db.sprouts.orderBy('startedAt').toArray();
  return all.filter((b) => !b.harvestedAt).pop();
}

export async function startBatch(today = new Date()): Promise<void> {
  await db.sprouts.add({ startedAt: toISODate(today), updatedAt: Date.now() });
}

export async function harvestBatch(batch: SproutBatch, today = new Date()): Promise<void> {
  if (batch.id == null) return;
  await db.sprouts.update(batch.id, { harvestedAt: toISODate(today), updatedAt: Date.now() });
}

export async function cancelBatch(batch: SproutBatch): Promise<void> {
  if (batch.id != null) await db.sprouts.delete(batch.id);
}
