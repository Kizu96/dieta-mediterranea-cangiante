import { lazy, Suspense, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSetting, setSetting, type WeightEntry } from '../db/db';
import { toISODate } from '../lib/planning';
import { bmi, bmiClass, DEFAULT_PROFILE, weeklyLoss, weeksToTarget } from '../lib/nutrition';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { formatShortDate } from '../components/labels';

const WeightChart = lazy(() => import('../components/WeightChart'));

interface Profile {
  heightCm: number;
  targetKg: number;
  age: number;
}

const PROFILE_KEY = 'profile';
const DEFAULT_PROFILE_OBJ: Profile = {
  heightCm: DEFAULT_PROFILE.heightCm,
  targetKg: DEFAULT_PROFILE.targetKg,
  age: DEFAULT_PROFILE.age,
};

type Metric = 'peso' | 'viscerale' | 'grasso' | 'vita' | 'whr';
const METRICS: Record<Metric, { label: string; unit: string; color: string; value: (w: WeightEntry) => number | undefined }> = {
  peso: { label: 'Peso', unit: 'kg', color: '#2f9389', value: (w) => w.kg },
  viscerale: { label: 'Viscerale', unit: '', color: '#a9745b', value: (w) => w.visceralFat },
  grasso: { label: 'Grasso %', unit: '%', color: '#c25b46', value: (w) => w.bodyFatPct },
  vita: { label: 'Vita', unit: 'cm', color: '#1f7269', value: (w) => w.waistCm },
  whr: {
    label: 'Vita/Fianchi',
    unit: '',
    color: '#6f655c',
    value: (w) =>
      w.waistCm != null && w.hipsCm != null ? Math.round((w.waistCm / w.hipsCm) * 100) / 100 : undefined,
  },
};

const num = (s: string): number | undefined => {
  const v = parseFloat(s.replace(',', '.'));
  return isFinite(v) && v > 0 ? v : undefined;
};

export function Weight() {
  const today = toISODate(new Date());
  const [editProfile, setEditProfile] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [metric, setMetric] = useState<Metric>('peso');
  const [msg, setMsg] = useState(''); // messaggio motivazionale dopo il salvataggio

  // Campi del form
  const [kg, setKg] = useState('');
  const [visceral, setVisceral] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [muscle, setMuscle] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');

  const weights = useLiveQuery(() => db.weights.orderBy('date').toArray(), [], []);
  const profile = useLiveQuery(() => getSetting<Profile>(PROFILE_KEY, DEFAULT_PROFILE_OBJ), [], DEFAULT_PROFILE_OBJ);

  const list = useMemo(() => weights ?? [], [weights]);
  const current = list.length ? list[list.length - 1].kg : DEFAULT_PROFILE.startKg;
  const heightM = (profile?.heightCm ?? DEFAULT_PROFILE.heightCm) / 100;
  const bmiVal = bmi(current, heightM);
  const cls = bmiClass(bmiVal);

  // Ultimo valore disponibile per una metrica (anche se non nell'ultima riga).
  const latestOf = (key: keyof WeightEntry): number | undefined => {
    for (let i = list.length - 1; i >= 0; i--) {
      const v = list[i][key];
      if (typeof v === 'number') return v;
    }
    return undefined;
  };
  const vfNow = latestOf('visceralFat');
  const bfNow = latestOf('bodyFatPct');
  const muNow = latestOf('muscleKg');
  const waistNow = latestOf('waistCm');

  const perWeek = weeklyLoss(500);
  const weeks = weeksToTarget(current, profile?.targetKg ?? DEFAULT_PROFILE.targetKg, perWeek);

  const m = METRICS[metric];
  const chartData = useMemo(() => {
    const val = METRICS[metric].value;
    return list
      .map((w) => ({ label: formatShortDate(new Date(w.date)), value: val(w) }))
      .filter((d): d is { label: string; value: number } => typeof d.value === 'number');
  }, [list, metric]);
  const chartTarget = metric === 'peso' ? (profile?.targetKg ?? DEFAULT_PROFILE.targetKg) : undefined;

  const save = async () => {
    const prevWaist = latestOf('waistCm');
    const prevVisceral = latestOf('visceralFat');
    const patch: Partial<WeightEntry> = {};
    const k = num(kg);
    if (k != null) patch.kg = k;
    const vf = num(visceral);
    if (vf != null) patch.visceralFat = vf;
    const bf = num(bodyFat);
    if (bf != null) patch.bodyFatPct = bf;
    const mu = num(muscle);
    if (mu != null) patch.muscleKg = mu;
    const wa = num(waist);
    if (wa != null) patch.waistCm = wa;
    const hi = num(hips);
    if (hi != null) patch.hipsCm = hi;
    if (Object.keys(patch).length === 0) return;

    const existing = await db.weights.where('date').equals(today).first();
    if (existing?.id != null) await db.weights.update(existing.id, patch);
    else await db.weights.add({ date: today, kg: patch.kg ?? current, ...patch });

    // Alert motivazionale: vita o grasso viscerale in calo rispetto all'ultima misura.
    let praise = '';
    if (patch.waistCm != null && prevWaist != null && patch.waistCm < prevWaist) {
      praise = `🎉 Vita −${(prevWaist - patch.waistCm).toFixed(1)} cm! È proprio lì che cala il grasso viscerale. Continua così.`;
    } else if (patch.visceralFat != null && prevVisceral != null && patch.visceralFat < prevVisceral) {
      praise = `🎉 Grasso viscerale in calo (−${(prevVisceral - patch.visceralFat).toFixed(1)})! Ottimo lavoro.`;
    }
    setMsg(praise);
    if (praise) setTimeout(() => setMsg(''), 7000);

    setKg('');
    setVisceral('');
    setBodyFat('');
    setMuscle('');
    setWaist('');
    setHips('');
  };

  const removeEntry = async (id?: number) => {
    if (id != null) await db.weights.delete(id);
  };

  return (
    <div>
      {msg && (
        <div className="banner info" style={{ marginBottom: 14 }}>
          {msg}
        </div>
      )}
      <div className="dash-grid">
        <Card title="Registra misure di oggi" icon="⚖️">
          <div className="field">
            <label htmlFor="kg-peso">Peso (kg)</label>
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

          {showMore && (
            <>
              <div className="row">
                <div className="field">
                  <label htmlFor="vf">Grasso viscerale</label>
                  <input id="vf" type="number" inputMode="decimal" value={visceral} onChange={(e) => setVisceral(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="bf">Massa grassa (%)</label>
                  <input id="bf" type="number" inputMode="decimal" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} />
                </div>
              </div>
              <div className="row">
                <div className="field">
                  <label htmlFor="wa">Vita (cm)</label>
                  <input id="wa" type="number" inputMode="decimal" value={waist} onChange={(e) => setWaist(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="hi">Fianchi (cm)</label>
                  <input id="hi" type="number" inputMode="decimal" value={hips} onChange={(e) => setHips(e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="mu">Massa muscolare (kg)</label>
                <input id="mu" type="number" inputMode="decimal" value={muscle} onChange={(e) => setMuscle(e.target.value)} />
              </div>
            </>
          )}

          <button className="btn ghost block" onClick={() => setShowMore((v) => !v)} style={{ marginBottom: 8 }}>
            {showMore ? '− Nascondi misure extra' : '➕ Aggiungi misure (vita, grasso viscerale, massa grassa…)'}
          </button>
          <button className="btn block" onClick={save}>
            Salva
          </button>
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

          {(vfNow != null || bfNow != null || waistNow != null || muNow != null) && (
            <div className="stat-grid" style={{ marginTop: 10 }}>
              {vfNow != null && (
                <div className="stat">
                  <div className="stat-num">{vfNow}</div>
                  <div className="stat-label">Grasso viscerale</div>
                </div>
              )}
              {bfNow != null && (
                <div className="stat">
                  <div className="stat-num">{bfNow}%</div>
                  <div className="stat-label">Massa grassa</div>
                </div>
              )}
              {waistNow != null && (
                <div className="stat">
                  <div className="stat-num">{waistNow} cm</div>
                  <div className="stat-label">Vita</div>
                </div>
              )}
              {muNow != null && (
                <div className="stat">
                  <div className="stat-num">{muNow} kg</div>
                  <div className="stat-label">Massa muscolare</div>
                </div>
              )}
            </div>
          )}

          <p className="small muted" style={{ marginTop: 10 }}>
            Proiezione con deficit ~500 kcal/die (~{perWeek.toFixed(2)} kg/sett). Altezza{' '}
            {profile?.heightCm ?? DEFAULT_PROFILE.heightCm} cm. Il <b>grasso viscerale</b> e la{' '}
            <b>vita</b> sono gli indicatori migliori da seguire.
          </p>
          {(cls === 'obesità I' || cls === 'obesità II' || cls === 'obesità III') && (
            <div className="banner warn" style={{ marginTop: 6, marginBottom: 0 }}>
              ⚕️ BMI in classe obesità: valuta un consulto medico. Contenuti educativi, non
              sostituiscono il parere del medico.
            </div>
          )}
        </Card>
      </div>

      <Card title="Andamento" icon="📈">
        <div className="segmented">
          {(Object.keys(METRICS) as Metric[]).map((k) => (
            <button key={k} className={metric === k ? 'active' : ''} onClick={() => setMetric(k)}>
              {METRICS[k].label}
            </button>
          ))}
        </div>
        {chartData.length < 2 ? (
          <p className="muted small">Registra almeno 2 rilevazioni di «{m.label}» per vedere il grafico.</p>
        ) : (
          <Suspense fallback={<p className="muted small">Carico il grafico…</p>}>
            <WeightChart data={chartData} target={chartTarget} color={m.color} unit={m.unit} />
          </Suspense>
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
                  <span className="grow small">
                    <b>{w.date}</b> · {w.kg} kg
                    {w.visceralFat != null ? ` · GV ${w.visceralFat}` : ''}
                    {w.bodyFatPct != null ? ` · ${w.bodyFatPct}%` : ''}
                    {w.waistCm != null ? ` · vita ${w.waistCm}` : ''}
                  </span>
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
        <ProfileEditor profile={profile ?? DEFAULT_PROFILE_OBJ} onClose={() => setEditProfile(false)} />
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
