import { RotateCcw, Shuffle } from 'lucide-react';
import { SLOT_LABEL } from './labels';
import type { useMealSwap } from './useMealSwap';

// Esito inline dello scambio «non acquistabile» (sotto il banner mancanti, in
// Oggi e Prep). Mostra cosa è stato scambiato + «↺ Un'altra» / «↩︎ Annulla».
const smallBtn = { minHeight: 34, padding: '0 12px', fontSize: '0.82rem', flex: '0 0 auto' } as const;

function dayLabel(dateISO: string): string {
  return new Date(`${dateISO}T00:00`).toLocaleDateString('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function SwapResultView({ swap }: { swap: ReturnType<typeof useMealSwap> }) {
  const { result, noAlt, another, undo } = swap;

  if (noAlt) {
    return (
      <p className="small" style={{ margin: '8px 0 0' }}>
        {noAlt}
      </p>
    );
  }
  if (!result) return null;

  return (
    <div style={{ marginTop: 10 }}>
      <p className="small" style={{ margin: 0 }}>
        {result.mode === 'use' ? (
          <>Per finire <b>{result.ingredientName}</b> ho messo nei prossimi giorni:</>
        ) : (
          <><b>{result.ingredientName}</b> non acquistabile → ho scambiato:</>
        )}
      </p>
      <ul className="clean" style={{ margin: '4px 0 0' }}>
        {result.changes.map((c) => (
          <li key={`${c.dateISO}|${c.slot}`} className="small">
            {SLOT_LABEL[c.slot]} di {dayLabel(c.dateISO)} → <b>{c.nextName}</b>
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        <button className="btn ghost" style={smallBtn} onClick={another}>
          <Shuffle size={14} className="ic" /> Un'altra
        </button>
        <button className="btn ghost" style={smallBtn} onClick={undo}>
          <RotateCcw size={14} className="ic" /> Annulla
        </button>
      </div>
    </div>
  );
}
