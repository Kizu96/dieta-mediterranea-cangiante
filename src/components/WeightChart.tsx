// Grafico generico di una metrica nel tempo (peso, grasso viscerale, vita…).
// In chunk separato: recharts caricato in lazy solo nella schermata Peso.
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface ChartPoint {
  label: string;
  value: number;
  /** Media mobile a 7 giorni: smorza le oscillazioni quotidiane dell'acqua. */
  avg?: number;
  /** Valore ribattuto solo sulle misure complete (StarFit) → punto evidenziato. */
  fullValue?: number;
}

// Griglia neutra leggibile sia su tema chiaro sia scuro (gli attributi SVG di
// recharts non risolvono le CSS var, quindi niente var(--line) qui).
const GRID = 'rgba(127, 160, 150, 0.35)';
const AVG = '#97a4a0';

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
  const hasAvg = data.some((d) => d.avg != null);
  const hasFull = data.some((d) => d.fullValue != null);
  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} width={40} />
          <Tooltip
            formatter={(v, name) => [`${v}${unit ? ' ' + unit : ''}`, name]}
            contentStyle={{
              borderRadius: 10,
              border: '1px solid var(--line)',
              background: 'var(--card)',
              color: 'var(--ink)',
            }}
            labelStyle={{ color: 'var(--ink-soft)' }}
          />
          {target != null && (
            <ReferenceLine
              y={target}
              stroke="#a9745b"
              strokeDasharray="4 4"
              label={{ value: 'Obiettivo', fontSize: 10, fill: '#a9745b' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            name="misura"
            stroke={color}
            strokeWidth={3}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          {hasAvg && (
            <Line
              type="monotone"
              dataKey="avg"
              name="media 7 gg"
              stroke={AVG}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              activeDot={false}
            />
          )}
          {hasFull && (
            <Line
              dataKey="fullValue"
              name="misura completa"
              stroke="none"
              dot={{ r: 5.5, fill: color, stroke: '#ffffff', strokeWidth: 1.5 }}
              activeDot={{ r: 6 }}
              legendType="circle"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
