import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import {
  cancelBatch,
  harvestBatch,
  SPROUT_READY_DAY,
  sproutDay,
  sproutInstruction,
  startBatch,
} from '../lib/sprouts';
import { Card } from './Card';
import { formatShortDate } from './labels';

// Card "Germogli di broccoli" in Oggi: i germogli sono un pilastro quotidiano
// ma vanno coltivati in casa (ammollo + 2 risciacqui/giorno per ~5 giorni).
// Qui si vede a che punto è il barattolo e cosa fare oggi.
export function SproutsCard() {
  const batches = useLiveQuery(() => db.sprouts.orderBy('startedAt').toArray(), [], []);
  const all = batches ?? [];
  const active = all.filter((b) => !b.harvestedAt).pop();
  const lastHarvested = all.filter((b) => b.harvestedAt).pop();
  const today = new Date();

  const day = active ? sproutDay(active, today) : 0;
  const pct = active ? Math.min(100, Math.round((day / SPROUT_READY_DAY) * 100)) : 0;

  // Senza barattolo attivo: stima se i germogli raccolti stanno finendo
  // (in frigo durano 5-7 giorni dal raccolto).
  const daysSinceHarvest = lastHarvested?.harvestedAt
    ? Math.floor((today.getTime() - new Date(lastHarvested.harvestedAt + 'T00:00:00').getTime()) / 86400000)
    : null;

  return (
    <Card
      title="Germogli di broccoli"
      icon="🌱"
      action={active && <span className="pill olive">giorno {day}/{SPROUT_READY_DAY}</span>}
    >
      {active ? (
        <>
          <span
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Avanzamento germogli"
            style={{ display: 'block', height: 6, borderRadius: 4, background: 'var(--line)', overflow: 'hidden', marginBottom: 10 }}
          >
            <span style={{ display: 'block', height: '100%', width: `${pct}%`, background: 'var(--olive)', transition: 'width .25s' }} />
          </span>
          <p className="small" style={{ marginTop: 0 }}>
            {sproutInstruction(day)}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {day >= SPROUT_READY_DAY - 1 && (
              <button className="btn" style={{ flex: 2 }} onClick={() => harvestBatch(active, today)}>
                ✅ Raccolti, in frigo
              </button>
            )}
            <button
              className="btn ghost"
              style={{ flex: 1, minHeight: 38 }}
              onClick={() => cancelBatch(active)}
            >
              ✗ Annulla barattolo
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="small muted" style={{ marginTop: -4 }}>
            {daysSinceHarvest != null && daysSinceHarvest <= 7 ? (
              <>
                Ultimo raccolto il <b>{formatShortDate(new Date(lastHarvested!.harvestedAt + 'T00:00:00'))}</b>: in
                frigo durano 5-7 giorni{daysSinceHarvest >= 4 ? ' — stanno per finire, avvia il prossimo barattolo' : ''}.
              </>
            ) : (
              <>
                Nessun barattolo attivo. Servono ~{SPROUT_READY_DAY} giorni dall'ammollo al
                raccolto: avviane uno oggi per non restare senza il tuo pilastro quotidiano.
              </>
            )}
          </p>
          <button className="btn block" onClick={() => startBatch(today)}>
            🌱 Avvia un barattolo oggi (ammollo stasera)
          </button>
        </>
      )}
    </Card>
  );
}
