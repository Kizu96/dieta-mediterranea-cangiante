import type { StockLevel } from '../lib/stock';

// Pallino di stato scorta: rosso = manca, ambra = sta per finire. Niente pallino
// quando la scorta è sufficiente. Inline, così sta dentro titoli e chip.
export function StockDot({ level, title }: { level: StockLevel; title?: string }) {
  if (level === 'ok') return null;
  const color = level === 'out' ? 'var(--danger)' : 'var(--amber)';
  const label = title ?? (level === 'out' ? 'Manca' : 'Sta per finire');
  return (
    <span
      className="stock-dot"
      title={label}
      aria-label={label}
      role="img"
      style={{ background: color }}
    />
  );
}
