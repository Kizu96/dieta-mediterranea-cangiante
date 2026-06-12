import { useLiveQuery } from 'dexie-react-hooks';
import { TrendingDown } from 'lucide-react';
import { db } from '../db/db';
import { Card } from './Card';
import { addDays, toISODate } from '../lib/planning';

// Riepilogo motivazionale degli ultimi 7 giorni: Δ peso, Δ vita, allenamenti fatti.
export function WeeklySummary() {
  const weights = useLiveQuery(() => db.weights.orderBy('date').toArray(), [], []);
  const workouts = useLiveQuery(() => db.workouts.toArray(), [], []);
  const since = toISODate(addDays(new Date(), -7));

  const windowW = (weights ?? []).filter((e) => e.date >= since);

  const deltaBy = (key: 'kg' | 'waistCm'): number | null => {
    const pts = windowW.filter((e) => typeof e[key] === 'number');
    if (pts.length < 2) return null;
    return (pts[pts.length - 1][key] as number) - (pts[0][key] as number);
  };
  const dKg = deltaBy('kg');
  const dWaist = deltaBy('waistCm');
  const workoutsDone = (workouts ?? []).filter((l) => l.done && l.date >= since).length;

  const fmt = (d: number | null) => (d == null ? '—' : `${d > 0 ? '+' : ''}${d.toFixed(1)}`);
  const color = (d: number | null) =>
    d == null ? 'var(--ink-soft)' : d < 0 ? 'var(--ok)' : d > 0 ? 'var(--danger)' : 'var(--ink-soft)';

  return (
    <Card title="Progressi · ultimi 7 giorni" icon={<TrendingDown />}>
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat">
          <div className="stat-num" style={{ color: color(dKg) }}>
            {fmt(dKg)}
          </div>
          <div className="stat-label">Peso (kg)</div>
        </div>
        <div className="stat">
          <div className="stat-num" style={{ color: color(dWaist) }}>
            {fmt(dWaist)}
          </div>
          <div className="stat-label">Vita (cm)</div>
        </div>
        <div className="stat">
          <div className="stat-num">{workoutsDone}</div>
          <div className="stat-label">Allenamenti</div>
        </div>
      </div>
      {dKg == null && dWaist == null && (
        <p className="small muted" style={{ marginTop: 8 }}>
          Registra peso e misure più volte nella settimana per vedere i progressi qui.
        </p>
      )}
    </Card>
  );
}
