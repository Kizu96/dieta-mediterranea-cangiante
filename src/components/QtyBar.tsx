// Barra di quantità della dispensa: quanto resta di un ingrediente rispetto al
// livello dell'ultimo rifornimento (qty/qtyFull). Scende quando segni un pasto
// mangiato, risale quando aggiungi un acquisto. Sotto il 20% diventa terracotta.
export function QtyBar({ qty, full, label }: { qty: number; full: number; label?: string }) {
  const pct = full > 0 ? Math.max(0, Math.min(100, Math.round((qty / full) * 100))) : 0;
  const low = pct <= 20;
  // <span display:block> e non <div>: la barra compare anche dentro elementi
  // che ammettono solo contenuto inline (es. il detail di CheckRow).
  return (
    <span
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? 'Quantità rimasta in dispensa'}
      title={label}
      style={{
        display: 'block',
        height: 6,
        borderRadius: 4,
        background: 'var(--line)',
        overflow: 'hidden',
        marginTop: 4,
      }}
    >
      <span
        style={{
          display: 'block',
          height: '100%',
          width: `${pct}%`,
          background: low ? 'var(--terracotta)' : 'var(--olive)',
          transition: 'width .25s',
        }}
      />
    </span>
  );
}
