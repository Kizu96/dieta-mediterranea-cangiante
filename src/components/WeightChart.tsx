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
          <CartesianGrid strokeDasharray="3 3" stroke="#cfe6e0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} width={40} />
          <Tooltip
            formatter={(v) => [`${v} kg`, 'Peso']}
            contentStyle={{ borderRadius: 10, border: '1px solid #cfe6e0' }}
          />
          <ReferenceLine
            y={target}
            stroke="#a9745b"
            strokeDasharray="4 4"
            label={{ value: 'Obiettivo', fontSize: 10, fill: '#855840' }}
          />
          <Line
            type="monotone"
            dataKey="kg"
            stroke="#2f9389"
            strokeWidth={3}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
