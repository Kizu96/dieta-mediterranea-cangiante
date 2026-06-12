import type { MealStatus } from '../db/db';
import { addDays, toISODate } from '../lib/planning';

// Heatmap aderenza stile GitHub: colonne = settimane (la più vecchia a
// sinistra), righe = Lun→Dom. Intensità = quota di pasti mangiati nel giorno;
// rosso tenue = giornata con soli saltati/fuori piano; vuoto = nessun dato.
const WEEKS = 12;
const CELL = 13;
const GAP = 3;
const DAY_LABELS = ['L', '', 'M', '', 'V', '', 'D'];

function dayColor(rows: MealStatus[]): { bg: string; desc: string } {
  if (rows.length === 0) return { bg: 'var(--cream-2)', desc: 'nessun pasto segnato' };
  let eaten = 0;
  let half = 0;
  let skipped = 0;
  let offplan = 0;
  for (const s of rows) {
    if (s.status === 'eaten') eaten++;
    else if (s.status === 'half') half++;
    else if (s.status === 'offplan') offplan++;
    else skipped++;
  }
  const ratio = (eaten + half * 0.5) / rows.length;
  const desc = `${eaten} mangiati, ${half} a metà, ${skipped} saltati, ${offplan} fuori piano`;
  if (ratio >= 0.99) return { bg: 'var(--olive)', desc };
  if (ratio >= 0.5) return { bg: 'color-mix(in srgb, var(--olive) 55%, var(--cream-2))', desc };
  if (ratio > 0) return { bg: 'color-mix(in srgb, var(--olive) 28%, var(--cream-2))', desc };
  return { bg: 'color-mix(in srgb, var(--terracotta) 38%, var(--cream-2))', desc };
}

export function AdherenceHeatmap({
  rows,
  isVacation,
}: {
  rows: MealStatus[];
  isVacation?: (iso: string) => boolean;
}) {
  const byDay = new Map<string, MealStatus[]>();
  for (const s of rows) {
    const arr = byDay.get(s.date) ?? [];
    arr.push(s);
    byDay.set(s.date, arr);
  }

  const today = new Date();
  const todayISO = toISODate(today);
  // Lunedì della colonna più vecchia (WEEKS-1 settimane fa).
  const mondayOffset = (today.getDay() + 6) % 7;
  const firstMonday = addDays(today, -mondayOffset - (WEEKS - 1) * 7);

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
      <div style={{ display: 'flex', gap: GAP, width: 'max-content' }}>
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: GAP, marginRight: 2 }}
          aria-hidden="true"
        >
          {DAY_LABELS.map((l, i) => (
            <span
              key={i}
              className="small muted"
              style={{ height: CELL, lineHeight: `${CELL}px`, fontSize: '0.6rem', width: 10 }}
            >
              {l}
            </span>
          ))}
        </div>
        {Array.from({ length: WEEKS }, (_, w) => (
          <div key={w} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
            {Array.from({ length: 7 }, (_, d) => {
              const date = addDays(firstMonday, w * 7 + d);
              const iso = toISODate(date);
              if (iso > todayISO) {
                return <span key={d} style={{ width: CELL, height: CELL }} />;
              }
              if (isVacation?.(iso)) {
                return (
                  <span
                    key={d}
                    title={`${iso}: vacanza`}
                    style={{
                      width: CELL,
                      height: CELL,
                      borderRadius: 3,
                      background:
                        'repeating-linear-gradient(45deg, var(--cream-2), var(--cream-2) 3px, var(--line) 3px, var(--line) 5px)',
                    }}
                  />
                );
              }
              const { bg, desc } = dayColor(byDay.get(iso) ?? []);
              return (
                <span
                  key={d}
                  title={`${iso}: ${desc}`}
                  style={{ width: CELL, height: CELL, borderRadius: 3, background: bg }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <p className="small muted" style={{ margin: '8px 0 0' }}>
        Ultime {WEEKS} settimane · verde pieno = tutti i pasti mangiati · rosso tenue = solo
        saltati/fuori piano · righe oblique = vacanza.
      </p>
    </div>
  );
}
