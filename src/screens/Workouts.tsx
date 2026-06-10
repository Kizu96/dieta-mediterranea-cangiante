import { useCallback, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { WorkoutDay, WorkoutExercise } from '../data/types';
import { workoutWeeks } from '../data/workoutPlan';
import { db } from '../db/db';
import { toISODate } from '../lib/planning';
import { hasExerciseVideo } from '../lib/exerciseVideo';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { ExerciseDetail } from '../components/ExerciseDetail';

const TYPE_ICON: Record<WorkoutDay['type'], string> = {
  cardio: '🏃',
  forza: '💪',
  mobilita: '🧘',
  riposo: '😴',
};

const TYPE_LABEL: Record<WorkoutDay['type'], string> = {
  cardio: 'Cardio',
  forza: 'Forza',
  mobilita: 'Mobilità',
  riposo: 'Riposo',
};

export function Workouts() {
  const [weekIdx, setWeekIdx] = useState(0);
  const [exDetail, setExDetail] = useState<WorkoutExercise | null>(null);
  const week = workoutWeeks[weekIdx];
  const todayISO = toISODate(new Date());

  const logs = useLiveQuery(() => db.workouts.toArray(), [], []);
  const doneToday = new Set(
    (logs ?? []).filter((l) => l.date === todayISO && l.done).map((l) => l.title),
  );
  const totalDone = (logs ?? []).filter((l) => l.done).length;

  const markDone = useCallback(
    async (day: WorkoutDay) => {
      const existing = (logs ?? []).find((l) => l.date === todayISO && l.title === day.title);
      if (existing?.id != null) {
        await db.workouts.update(existing.id, { done: !existing.done, updatedAt: Date.now() });
      } else {
        await db.workouts.add({
          date: todayISO,
          title: day.title,
          done: true,
          durationMin: day.durationMin,
          updatedAt: Date.now(),
        });
      }
    },
    [logs, todayISO],
  );

  if (!week) {
    return (
      <div className="empty">
        <span className="emoji">🏋️</span>
        Nessun piano di allenamento disponibile.
      </div>
    );
  }

  return (
    <div>
      <Card>
        <div className="flex-between">
          <h2 style={{ margin: 0 }}>Allenamenti</h2>
          <span className="pill olive">{totalDone} completati</span>
        </div>
        {workoutWeeks.length > 1 && (
          <div className="field" style={{ marginTop: 12, marginBottom: 0 }}>
            <label htmlFor="wk">Progressione</label>
            <select id="wk" value={weekIdx} onChange={(e) => setWeekIdx(Number(e.target.value))}>
              {workoutWeeks.map((w, i) => (
                <option key={i} value={i}>
                  {w.weekLabel}
                </option>
              ))}
            </select>
          </div>
        )}
      </Card>

      <div className="banner info">
        <b>{week.weekLabel}</b>
        <div className="small">{week.focus}</div>
      </div>

      {week.days.map((day, i) => {
        const done = doneToday.has(day.title);
        return (
          <Card key={i}>
            <div className="flex-between" style={{ marginBottom: 6 }}>
              <div>
                <div className="slot-tag" style={{ flex: 'none' }}>
                  {day.dayLabel}
                </div>
                <h3 style={{ margin: '2px 0' }}>
                  {TYPE_ICON[day.type]} {day.title}
                </h3>
                <div className="small muted">
                  {TYPE_LABEL[day.type]}
                  {day.durationMin > 0 ? ` · ${day.durationMin} min` : ''}
                </div>
              </div>
              {day.type !== 'riposo' && (
                <button
                  className={done ? 'btn secondary' : 'btn'}
                  style={{ minHeight: 40 }}
                  onClick={() => markDone(day)}
                >
                  {done ? '✓ Fatto' : 'Fatto'}
                </button>
              )}
            </div>
            {day.exercises.length > 0 && (
              <ul className="clean" style={{ marginTop: 6 }}>
                {day.exercises.map((ex, j) => {
                  const openable = hasExerciseVideo(ex.name);
                  return (
                    <li
                      key={j}
                      className="small"
                      style={{
                        padding: '7px 0',
                        borderBottom: '1px solid var(--line)',
                        cursor: openable ? 'pointer' : 'default',
                      }}
                      onClick={openable ? () => setExDetail(ex) : undefined}
                    >
                      <div className="flex-between">
                        <b>{ex.name}</b>
                        {openable && (
                          <span className="nowrap" style={{ color: 'var(--terracotta-dark)', fontSize: '0.8rem' }}>
                            ▶︎ apri ›
                          </span>
                        )}
                      </div>
                      <div className="muted">{ex.detail}</div>
                    </li>
                  );
                })}
              </ul>
            )}
            {day.notes && <p className="small muted" style={{ marginTop: 8 }}>💡 {day.notes}</p>}
          </Card>
        );
      })}

      {exDetail && (
        <Modal title={exDetail.name} onClose={() => setExDetail(null)}>
          <ExerciseDetail exercise={exDetail} />
        </Modal>
      )}
    </div>
  );
}
