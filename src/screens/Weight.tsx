import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
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
import { db, getSetting, setSetting } from '../db/db';
import { toISODate } from '../lib/planning';
import { bmi, bmiClass, DEFAULT_PROFILE, weeklyLoss, weeksToTarget } from '../lib/nutrition';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { formatShortDate } from '../components/labels';

interface Profile {
  heightCm: number;
  targetKg: number;
  age: number;
}

const PROFILE_KEY = 'profile';

export function Weight() {
  const today = toISODate(new Date());
  const [kg, setKg] = useState('');
  const [editProfile, setEditProfile] = useState(false);

  const weights = useLiveQuery(() => db.weights.orderBy('date').toArray(), [], []);
  const profile = useLiveQuery(
    () =>
      getSetting<Profile>(PROFILE_KEY, {
        heightCm: DEFAULT_PROFILE.heightCm,
        targetKg: DEFAULT_PROFILE.targetKg,
        age: DEFAULT_PROFILE.age,
      }),
    [],
    { heightCm: DEFAULT_PROFILE.heightCm, targetKg: DEFAULT_PROFILE.targetKg, age: DEFAULT_PROFILE.age },
  );

  const list = useMemo(() => weights ?? [], [weights]);
  const current = list.length ? list[list.length - 1].kg : DEFAULT_PROFILE.startKg;
  const heightM = (profile?.heightCm ?? DEFAULT_PROFILE.heightCm) / 100;
  const bmiVal = bmi(current, heightM);
  const cls = bmiClass(bmiVal);

  // Proiezione: deficit ~500 kcal/die ≈ ~0,45 kg/sett.
  const perWeek = weeklyLoss(500);
  const weeks = weeksToTarget(current, profile?.targetKg ?? DEFAULT_PROFILE.targetKg, perWeek);

  const chartData = useMemo(
    () =>
      list.map((w) => ({
        date: w.date,
        label: formatShortDate(new Date(w.date)),
        kg: w.kg,
      })),
    [list],
  );

  const addWeight = async () => {
    const value = parseFloat(kg.replace(',', '.'));
    if (!isFinite(value) || value <= 0) return;
    const existing = await db.weights.where('date').equals(today).first();
    if (existing?.id != null) await db.weights.update(existing.id, { kg: value });
    else await db.weights.add({ date: today, kg: value });
    setKg('');
  };

  const removeEntry = async (id?: number) => {
    if (id != null) await db.weights.delete(id);
  };

  return (
    <div>
      <Card title="Registra peso" icon="⚖️">
        <div className="row">
          <div className="field grow" style={{ marginBottom: 0 }}>
            <label htmlFor="kg-peso">Peso di oggi (kg)</label>
            <input
              id="kg-peso"
              type="number"
              inputMode="decimal"
              step="0.1"
              value={kg}
              placeholder={String(current)}
              onChange={(e) => setKg(e.target.value)}
            />
          </div>
          <button className="btn" onClick={addWeight} style={{ flex: '0 0 auto' }}>
            Salva
          </button>
        </div>
      </Card>

      <Card
        title="Indicatori"
        icon="📊"
        action={
          <button className="btn ghost" style={{ minHeight: 36 }} onClick={() => setEditProfile(true)}>
            ✎ Profilo
          </button>
        }
      >
        <div className="stat-grid">
          <div className="stat">
            <div className="stat-num">{current.toFixed(1)}</div>
            <div className="stat-label">Peso attuale (kg)</div>
          </div>
          <div className="stat">
            <div className="stat-num">{bmiVal.toFixed(1)}</div>
            <div className="stat-label">BMI · {cls}</div>
          </div>
          <div className="stat">
            <div className="stat-num">{profile?.targetKg ?? DEFAULT_PROFILE.targetKg}</div>
            <div className="stat-label">Obiettivo (kg)</div>
          </div>
          <div className="stat">
            <div className="stat-num">{weeks === Infinity ? '—' : weeks}</div>
            <div className="stat-label">Settimane stimate</div>
          </div>
        </div>
        <p className="small muted" style={{ marginTop: 10 }}>
          Proiezione con deficit ~500 kcal/die (~{perWeek.toFixed(2)} kg/sett). Altezza{' '}
          {profile?.heightCm ?? DEFAULT_PROFILE.heightCm} cm.
        </p>
        {(cls === 'obesità I' || cls === 'obesità II' || cls === 'obesità III') && (
          <div className="banner warn" style={{ marginTop: 6, marginBottom: 0 }}>
            ⚕️ BMI in classe obesità: valuta un consulto medico. Contenuti educativi, non
            sostituiscono il parere del medico.
          </div>
        )}
      </Card>

      <Card title="Andamento" icon="📈">
        {chartData.length < 2 ? (
          <p className="muted small">Registra almeno 2 pesate per vedere il grafico.</p>
        ) : (
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2d6c2" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} width={40} />
                <Tooltip
                  formatter={(v) => [`${v} kg`, 'Peso']}
                  contentStyle={{ borderRadius: 10, border: '1px solid #e2d6c2' }}
                />
                <ReferenceLine
                  y={profile?.targetKg ?? DEFAULT_PROFILE.targetKg}
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
        )}
      </Card>

      <Card title="Storico" icon="🗒️">
        {list.length === 0 ? (
          <p className="muted small">Nessuna registrazione.</p>
        ) : (
          <ul className="clean">
            {list
              .slice()
              .reverse()
              .map((w) => (
                <li key={w.id} className="meal-row">
                  <span className="grow">{w.date}</span>
                  <b className="nowrap">{w.kg} kg</b>
                  <button
                    className="icon-btn"
                    style={{ width: 34, height: 34, marginLeft: 8 }}
                    aria-label="Elimina"
                    onClick={() => removeEntry(w.id)}
                  >
                    🗑
                  </button>
                </li>
              ))}
          </ul>
        )}
      </Card>

      {editProfile && (
        <ProfileEditor
          profile={
            profile ?? {
              heightCm: DEFAULT_PROFILE.heightCm,
              targetKg: DEFAULT_PROFILE.targetKg,
              age: DEFAULT_PROFILE.age,
            }
          }
          onClose={() => setEditProfile(false)}
        />
      )}
    </div>
  );
}

function ProfileEditor({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const [heightCm, setHeightCm] = useState(String(profile.heightCm));
  const [targetKg, setTargetKg] = useState(String(profile.targetKg));
  const [age, setAge] = useState(String(profile.age));

  const save = async () => {
    const next: Profile = {
      heightCm: parseFloat(heightCm.replace(',', '.')) || DEFAULT_PROFILE.heightCm,
      targetKg: parseFloat(targetKg.replace(',', '.')) || DEFAULT_PROFILE.targetKg,
      age: parseInt(age, 10) || DEFAULT_PROFILE.age,
    };
    await setSetting(PROFILE_KEY, next);
    onClose();
  };

  return (
    <Modal title="Profilo" onClose={onClose}>
      <div className="field">
        <label htmlFor="p-h">Altezza (cm)</label>
        <input id="p-h" type="number" inputMode="numeric" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="p-t">Peso obiettivo (kg)</label>
        <input id="p-t" type="number" inputMode="decimal" value={targetKg} onChange={(e) => setTargetKg(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="p-a">Età (anni)</label>
        <input id="p-a" type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
      </div>
      <button className="btn block" onClick={save}>
        Salva profilo
      </button>
    </Modal>
  );
}
