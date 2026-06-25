import { lazy, Suspense, useMemo, useState, type KeyboardEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowLeftRight,
  ChartLine,
  Flame,
  Gauge,
  NotebookText,
  Plus,
  Ruler,
  Scale,
  Stethoscope,
  Target,
  Trash2,
  TrendingDown,
} from 'lucide-react';
import { db, getSetting, setSetting, type WeightEntry } from '../db/db';
import { addDays, toISODate } from '../lib/planning';
import { adherenceStats } from '../lib/adherence';
import { bmi, bmiClass, DEFAULT_PROFILE, weeklyLoss, weeksToTarget } from '../lib/nutrition';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { AdherenceHeatmap } from '../components/AdherenceHeatmap';
import { isVacationDay, useVacation } from '../lib/vacation';
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
  const [date, setDate] = useState(today); // misura retrodatabile (es. pesata della settimana scorsa)
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
  // Arrotonda a 1 decimale per la VISUALIZZAZIONE (i float possono arrivare
  // come 15.999999999999998 e gli indicatori devono restare leggibili).
  const r1 = (v: number | undefined): number | undefined =>
    v != null ? Math.round(v * 10) / 10 : undefined;
  const vfNow = r1(latestOf('visceralFat'));
  const bfNow = r1(latestOf('bodyFatPct'));
  const muNow = r1(latestOf('muscleKg'));
  const waistNow = r1(latestOf('waistCm'));
  const hipsNow = r1(latestOf('hipsCm'));
  const ph = (v: number | undefined) => (v != null ? String(v) : '—'); // segnaposto = ultimo valore

  const perWeek = weeklyLoss(500);
  const weeks = weeksToTarget(current, profile?.targetKg ?? DEFAULT_PROFILE.targetKg, perWeek);

  // Proiezione sul trend REALE: regressione lineare sul peso degli ultimi 28
  // giorni (serve ≥3 pesate su ≥10 giorni). Più onesta del deficit teorico.
  const realTrend = useMemo(() => {
    const cutoff = toISODate(addDays(new Date(), -28));
    const pts = list
      .filter((w) => w.date >= cutoff)
      .map((w) => ({ t: new Date(w.date + 'T00:00:00').getTime(), kg: w.kg }));
    if (pts.length < 3) return null;
    const spanDays = (pts[pts.length - 1].t - pts[0].t) / 86_400_000;
    if (spanDays < 10) return null;
    const n = pts.length;
    const mt = pts.reduce((s, p) => s + p.t, 0) / n;
    const mk = pts.reduce((s, p) => s + p.kg, 0) / n;
    let num = 0;
    let den = 0;
    for (const p of pts) {
      num += (p.t - mt) * (p.kg - mk);
      den += (p.t - mt) ** 2;
    }
    if (den === 0) return null;
    const perWeekReal = (num / den) * 86_400_000 * 7; // kg/settimana (negativo = cala)
    const target = profile?.targetKg ?? DEFAULT_PROFILE.targetKg;
    if (perWeekReal >= -0.05 || current <= target) return { perWeekReal, eta: null };
    const weeksLeft = (current - target) / -perWeekReal;
    return { perWeekReal, eta: weeksLeft <= 200 ? addDays(new Date(), Math.round(weeksLeft * 7)) : null };
  }, [list, profile, current]);

  // Media mobile a 7 giorni (numero) + variazione rispetto a 7 giorni prima: è il
  // "trend vero" del peso, senza il rumore della singola pesata (acqua, sale…).
  const media7 = useMemo(() => {
    if (list.length === 0) return null;
    const avgAt = (refMs: number): number | null => {
      const win = list.filter((w) => {
        const t = new Date(w.date + 'T00:00:00').getTime();
        return t <= refMs && t > refMs - 7 * 86_400_000;
      });
      return win.length ? win.reduce((s, w) => s + w.kg, 0) / win.length : null;
    };
    const lastMs = Math.max(...list.map((w) => new Date(w.date + 'T00:00:00').getTime()));
    const now = avgAt(lastMs);
    if (now == null) return null;
    const prev = avgAt(lastMs - 7 * 86_400_000);
    return {
      now: Math.round(now * 10) / 10,
      delta: prev != null ? Math.round((now - prev) * 10) / 10 : null,
    };
  }, [list]);

  // Promemoria misura completa: l'ultima registrazione con grasso viscerale
  // risale a più di 30 giorni fa (o non c'è mai stata).
  const lastFullDate = useMemo(() => {
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].visceralFat != null) return list[i].date;
    }
    return null;
  }, [list]);
  const fullMeasureDue =
    lastFullDate == null || lastFullDate <= toISODate(addDays(new Date(), -30));

  // Aderenza al piano: statistiche sugli ultimi 28 giorni, heatmap sulle
  // ultime 12 settimane (un'unica query a 84 giorni).
  const since84 = toISODate(addDays(new Date(), -84));
  const since28 = toISODate(addDays(new Date(), -28));
  const statusRows = useLiveQuery(
    () => db.mealStatus.where('date').aboveOrEqual(since84).toArray(),
    [since84],
    [],
  );
  const { vacation } = useVacation();
  const adherence = useMemo(
    () =>
      adherenceStats(
        (statusRows ?? []).filter((s) => s.date >= since28),
        today,
        (iso) => isVacationDay(iso, vacation),
      ),
    [statusRows, since28, today, vacation],
  );

  const m = METRICS[metric];
  const chartData = useMemo(() => {
    const val = METRICS[metric].value;
    const pts = list
      .map((w) => ({
        date: w.date,
        label: formatShortDate(new Date(w.date)),
        value: val(w),
        // Misura completa = quella con la bilancia smart (c'è il viscerale).
        isFull: w.visceralFat != null,
      }))
      .filter(
        (d): d is { date: string; label: string; value: number; isFull: boolean } =>
          typeof d.value === 'number',
      );
    // Media mobile sui 7 giorni PRECEDENTI (finestra per data, non per indice:
    // le misure possono essere sparse). Smorza le oscillazioni dell'acqua.
    return pts.map((p) => {
      const t = new Date(p.date).getTime();
      const win = pts.filter((q) => {
        const qt = new Date(q.date).getTime();
        return qt <= t && qt > t - 7 * 86_400_000;
      });
      const avg = win.reduce((s, q) => s + q.value, 0) / win.length;
      return {
        label: p.label,
        value: p.value,
        avg: Math.round(avg * 10) / 10,
        fullValue: p.isFull ? p.value : undefined,
      };
    });
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

    const targetDate = date && date <= today ? date : today;
    const existing = await db.weights.where('date').equals(targetDate).first();
    if (existing?.id != null) await db.weights.update(existing.id, { ...patch, updatedAt: Date.now() });
    else await db.weights.add({ date: targetDate, kg: patch.kg ?? current, ...patch, updatedAt: Date.now() });

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

  const onEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') save();
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
      {fullMeasureDue && (
        <div className="banner info" style={{ marginBottom: 14 }}>
          <Ruler size={15} className="ic" /> {lastFullDate == null ? (
            <>Non hai ancora registrato una <b>misura completa</b> (StarFit):</>
          ) : (
            <>È passato più di un mese dall'ultima <b>misura completa</b> ({lastFullDate}):</>
          )}{' '}
          sali sulla bilancia smart al mattino a digiuno e copia qui grasso viscerale, massa
          grassa e muscolare. È il viscerale il numero da guardare, non il peso.
        </div>
      )}
      <div className="dash-grid">
        <Card title="Registra misure" icon={<Scale />}>
          <p className="small muted" style={{ marginTop: -4 }}>
            Copia i valori che leggi su <b>StarFit</b>. Il segnaposto mostra l’ultimo dato: lascia
            vuoto ciò che non vuoi aggiornare. Puoi anche registrare una misura di giorni fa
            cambiando la data.
          </p>
          <div className="field">
            <label htmlFor="w-date">Data della misura</label>
            <input
              id="w-date"
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
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
              onKeyDown={onEnter}
            />
          </div>
          <div className="row">
            <div className="field">
              <label htmlFor="bf">Massa grassa (%)</label>
              <input id="bf" type="number" inputMode="decimal" value={bodyFat} placeholder={ph(bfNow)} onChange={(e) => setBodyFat(e.target.value)} onKeyDown={onEnter} />
            </div>
            <div className="field">
              <label htmlFor="vf">Grasso viscerale</label>
              <input id="vf" type="number" inputMode="decimal" value={visceral} placeholder={ph(vfNow)} onChange={(e) => setVisceral(e.target.value)} onKeyDown={onEnter} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="mu">Massa muscolare (kg)</label>
            <input id="mu" type="number" inputMode="decimal" value={muscle} placeholder={ph(muNow)} onChange={(e) => setMuscle(e.target.value)} onKeyDown={onEnter} />
          </div>

          {showMore && (
            <div className="row">
              <div className="field">
                <label htmlFor="wa">Vita (cm)</label>
                <input id="wa" type="number" inputMode="decimal" value={waist} placeholder={ph(waistNow)} onChange={(e) => setWaist(e.target.value)} onKeyDown={onEnter} />
              </div>
              <div className="field">
                <label htmlFor="hi">Fianchi (cm)</label>
                <input id="hi" type="number" inputMode="decimal" value={hips} placeholder={ph(hipsNow)} onChange={(e) => setHips(e.target.value)} onKeyDown={onEnter} />
              </div>
            </div>
          )}

          <button className="btn ghost block" onClick={() => setShowMore((v) => !v)} style={{ marginBottom: 8 }}>
            {showMore ? '− Nascondi vita/fianchi' : <><Plus size={15} className="ic" /> Vita e fianchi (metro)</>}
          </button>
          <button className="btn block" onClick={save}>
            Salva
          </button>
        </Card>

        <Card
          title="Indicatori"
          icon={<Gauge />}
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
          {media7 && (
            <p className="small" style={{ margin: '10px 0 0', textAlign: 'center' }}>
              <span className="muted">Media 7 giorni:</span> <b>{media7.now} kg</b>
              {media7.delta == null ? null : Math.abs(media7.delta) < 0.05 ? (
                <span className="muted"> · stabile rispetto a settimana scorsa</span>
              ) : (
                <b style={{ color: media7.delta < 0 ? 'var(--olive-dark)' : 'var(--terracotta-dark)' }}>
                  {' '}{media7.delta < 0 ? '▼' : '▲'} {Math.abs(media7.delta).toFixed(1)} kg vs settimana scorsa
                </b>
              )}
            </p>
          )}

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
          {realTrend && (
            <div className="banner info" style={{ marginTop: 8, marginBottom: 0 }}>
              <TrendingDown size={15} className="ic" />{' '}
              <b>Trend reale (ultime 4 settimane):</b>{' '}
              {realTrend.perWeekReal < -0.05 ? (
                <>
                  {realTrend.perWeekReal.toFixed(2).replace('.', ',')} kg/settimana
                  {realTrend.eta ? (
                    <>
                      {' '}— di questo passo arrivi a {profile?.targetKg ?? DEFAULT_PROFILE.targetKg} kg
                      intorno a{' '}
                      <b>
                        {realTrend.eta.toLocaleDateString('it-IT', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </b>
                      .
                    </>
                  ) : (
                    '.'
                  )}
                </>
              ) : (
                <>
                  {realTrend.perWeekReal >= 0 ? '+' : ''}
                  {realTrend.perWeekReal.toFixed(2).replace('.', ',')} kg/settimana — peso stabile:
                  la proiezione torna quando il calo riprende. Capita a tutti, guarda la media
                  mobile e non il singolo giorno.
                </>
              )}
            </div>
          )}
          {(cls === 'obesità I' || cls === 'obesità II' || cls === 'obesità III') && (
            <div className="banner warn" style={{ marginTop: 6, marginBottom: 0 }}>
              <Stethoscope size={15} className="ic" /> BMI in classe obesità: valuta un consulto medico. Contenuti educativi, non
              sostituiscono il parere del medico.
            </div>
          )}
        </Card>
      </div>

      <Card title="Andamento" icon={<ChartLine />}>
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
            <p className="small muted" style={{ marginTop: 6, marginBottom: 0 }}>
              Linea tratteggiata = <b>media 7 giorni</b> (il valore "vero", senza le oscillazioni
              dell'acqua) · punti cerchiati = <b>misura completa</b> StarFit.
            </p>
          </Suspense>
        )}
      </Card>

      <Card title="Aderenza al piano · ultime 4 settimane" icon={<Target />}>
        {adherence.eaten + adherence.half + adherence.skipped + adherence.offPlan === 0 ? (
          <p className="muted small">
            Segna i pasti come Mangiato/Metà/Saltato (in Oggi o in Piano → Giorno) e qui vedrai
            quanto stai seguendo il piano.
          </p>
        ) : (
          <>
            <div className="stat-grid">
              <div className="stat">
                <div className="stat-num">{adherence.pct}%</div>
                <div className="stat-label">Aderenza</div>
              </div>
              <div className="stat">
                <div className="stat-num">{adherence.eaten}</div>
                <div className="stat-label">Mangiati</div>
              </div>
              <div className="stat">
                <div className="stat-num">{adherence.skipped}</div>
                <div className="stat-label">Saltati</div>
              </div>
              <div className="stat">
                <div className="stat-num">{adherence.streak}</div>
                <div className="stat-label">Giorni di fila <Flame size={11} className="ic" /></div>
              </div>
            </div>
            {adherence.offPlan > 0 && (
              <p className="small muted" style={{ marginTop: 8, marginBottom: 0 }}>
                Di cui <b>{adherence.offPlan}</b> {adherence.offPlan === 1 ? 'pasto' : 'pasti'} fuori
                piano (kcal stimate, contano nella barra calorie ma non come digiuno).
              </p>
            )}
            <div style={{ marginTop: 12 }}>
              <AdherenceHeatmap
                rows={statusRows ?? []}
                isVacation={(iso) => isVacationDay(iso, vacation)}
              />
            </div>
            {adherence.mostSkipped.length > 0 && (
              <>
                <p className="small" style={{ marginTop: 10, marginBottom: 4 }}>
                  <b>Ricette che salti più spesso</b> — la dieta che funziona è quella che
                  segui: scambiale con qualcosa che mangi volentieri (<ArrowLeftRight size={12} className="ic" /> in Oggi):
                </p>
                <ul className="clean">
                  {adherence.mostSkipped.map((r) => (
                    <li key={r.name} className="meal-row small">
                      <span className="grow">{r.name}</span>
                      <span className="nowrap muted">saltata {r.times}×</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </Card>

      <Card title="Storico" icon={<NotebookText />}>
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
                    <Trash2 size={16} />
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
