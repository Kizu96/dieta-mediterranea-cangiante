// Grafico di una metrica nel tempo (peso, grasso viscerale, vita…) in SVG
// PURO: niente recharts (−345 kB), stesse funzioni — linea valore, media
// mobile tratteggiata, punti evidenziati sulle misure complete, linea
// obiettivo, tooltip al tocco. Resta in chunk lazy per la schermata Peso.
import { useEffect, useRef, useState } from 'react';

export interface ChartPoint {
  label: string;
  value: number;
  /** Media mobile a 7 giorni: smorza le oscillazioni quotidiane dell'acqua. */
  avg?: number;
  /** Valore ribattuto solo sulle misure complete (StarFit) → punto evidenziato. */
  fullValue?: number;
}

const H = 240;
const PAD = { top: 12, right: 10, bottom: 24, left: 42 };
const GRID = 'rgba(127, 160, 150, 0.35)';
const AVG = '#97a4a0';
const TARGET = '#a9745b';

// Tick "puliti": passo 1-2-5×10^k che copre il range in ~4 intervalli.
function niceTicks(min: number, max: number): number[] {
  const span = max - min || 1;
  const rough = span / 3;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? pow * 10;
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) {
    out.push(Math.round(v * 100) / 100);
  }
  return out;
}

export default function WeightChart({
  data,
  target,
  color = '#2f9389',
  unit = '',
}: {
  data: ChartPoint[];
  target?: number;
  color?: string;
  unit?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = data.length;
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = H - PAD.top - PAD.bottom;

  // Dominio Y sui soli DATI (l'obiettivo lontano schiaccerebbe la serie:
  // la sua linea compare da sola quando entra nel range).
  const ys = data.flatMap((d) => [d.value, ...(d.avg != null ? [d.avg] : [])]);
  let yMin = Math.min(...ys);
  let yMax = Math.max(...ys);
  const padY = (yMax - yMin || 1) * 0.08;
  yMin -= padY;
  yMax += padY;

  const x = (i: number) => PAD.left + (n > 1 ? (i * plotW) / (n - 1) : plotW / 2);
  const y = (v: number) => PAD.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
  const ticks = niceTicks(yMin, yMax);

  // Etichette X: massimo ~5, equidistanti, sempre prima e ultima.
  const labelEvery = Math.max(1, Math.ceil(n / 5));
  const xLabelIdx = data.map((_, i) => i).filter((i) => i % labelEvery === 0 || i === n - 1);

  const line = (key: 'value' | 'avg') =>
    data
      .map((d, i) => (d[key] != null ? `${x(i)},${y(d[key] as number)}` : null))
      .filter(Boolean)
      .join(' ');

  // Tooltip: punto più vicino al dito/cursore.
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (n === 0 || plotW <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = Math.round(((px - PAD.left) / plotW) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  if (n === 0) return null;
  const hovered = hover != null ? data[hover] : null;

  return (
    <div ref={wrapRef} style={{ width: '100%', height: H, position: 'relative' }}>
      {width > 0 && (
        <svg
          width={width}
          height={H}
          role="img"
          aria-label="Andamento della metrica nel tempo"
          onPointerMove={onMove}
          onPointerDown={onMove}
          onPointerLeave={() => setHover(null)}
          style={{ touchAction: 'pan-y', display: 'block' }}
        >
          {/* griglia + assi */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeDasharray="3 3" />
              <text x={PAD.left - 6} y={y(t) + 3.5} textAnchor="end" fontSize={11} fill="var(--ink-soft)">
                {t}
              </text>
            </g>
          ))}
          {xLabelIdx.map((i) => (
            <text key={i} x={x(i)} y={H - 7} textAnchor="middle" fontSize={10.5} fill="var(--ink-soft)">
              {data[i].label}
            </text>
          ))}

          {/* obiettivo */}
          {target != null && target >= yMin && target <= yMax && (
            <g>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(target)} y2={y(target)} stroke={TARGET} strokeDasharray="4 4" strokeWidth={1.5} />
              <text x={width - PAD.right} y={y(target) - 4} textAnchor="end" fontSize={10} fill={TARGET}>
                Obiettivo
              </text>
            </g>
          )}

          {/* media mobile */}
          <polyline points={line('avg')} fill="none" stroke={AVG} strokeWidth={2} strokeDasharray="6 4" />

          {/* serie principale */}
          <polyline points={line('value')} fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
          {data.map((d, i) => (
            <circle key={i} cx={x(i)} cy={y(d.value)} r={hover === i ? 5 : 3} fill={color} />
          ))}
          {/* misure complete: anello bianco */}
          {data.map((d, i) =>
            d.fullValue != null ? (
              <circle key={`f${i}`} cx={x(i)} cy={y(d.fullValue)} r={5.5} fill={color} stroke="#ffffff" strokeWidth={1.5} />
            ) : null,
          )}

          {/* guida verticale del punto attivo */}
          {hover != null && (
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + plotH} stroke={GRID} strokeWidth={1} />
          )}
        </svg>
      )}

      {hovered && hover != null && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(Math.max(x(hover) - 60, 0), Math.max(width - 124, 0)),
            top: Math.max(y(hovered.value) - 64, 0),
            width: 120,
            pointerEvents: 'none',
            background: 'var(--card)',
            border: '1px solid var(--line)',
            borderRadius: 10,
            boxShadow: 'var(--shadow)',
            padding: '6px 10px',
            fontSize: '0.78rem',
            lineHeight: 1.35,
          }}
        >
          <b>{hovered.label}</b>
          <br />
          {hovered.value}
          {unit ? ` ${unit}` : ''}
          {hovered.avg != null && (
            <span style={{ color: 'var(--ink-soft)' }}>
              {' '}
              · media {hovered.avg}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
