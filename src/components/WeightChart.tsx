// Grafico del peso isolato in un chunk separato: recharts (~pesante) viene
// caricato in lazy solo quando serve, alleggerendo il bundle iniziale.
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

export interface WeightPoint {
  label: string;
  kg: number;
}

export default function WeightChart({ data, target }: { data: WeightPoint[]; target: number }) {
  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2d6c2" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} width={40} />
          <Tooltip
            formatter={(v) => [`${v} kg`, 'Peso']}
            contentStyle={{ borderRadius: 10, border: '1px solid #e2d6c2' }}
          />
          <ReferenceLine
            y={target}
            stroke="#c0612f"
            strokeDasharray="4 4"
            label={{ value: 'Obiettivo', fontSize: 10, fill: '#a44e22' }}
          />
          <Line
            type="monotone"
            dataKey="kg"
            stroke="#6b7a3a"
            strokeWidth={3}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
