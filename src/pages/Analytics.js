import React, { useEffect, useMemo, useState } from 'react';
import { analyticsAPI, nutritionAPI } from '../services/api';

const Analytics = () => {
  const [period, setPeriod] = useState(30);
  const [workoutSummary, setWorkoutSummary] = useState(null);
  const [nutritionSummary, setNutritionSummary] = useState(null);
  const [progress, setProgress] = useState([]);
  const [wellness, setWellness] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [wkRes, nuRes, prRes, weRes] = await Promise.all([
        analyticsAPI.getWorkoutSummary({ days: period }),
        analyticsAPI.getNutritionSummary({ days: Math.min(period, 30) }),
        analyticsAPI.getProgress(),
        nutritionAPI.getWellness(),
      ]);
      if (wkRes.data.success) setWorkoutSummary(wkRes.data.data);
      if (nuRes.data.success) setNutritionSummary(nuRes.data.data);
      if (prRes.data.success) setProgress(prRes.data.data.metrics);
      if (weRes.data.success) setWellness(weRes.data.data.wellness);
    } finally { setLoading(false); }
  };

  const weightTrend = useMemo(() => [...progress].reverse().slice(-8), [progress]);
  const wellnessTrend = useMemo(() => [...wellness].reverse().slice(-7), [wellness]);
  const maxWeight = Math.max(...weightTrend.map(i => i.weight_kg || 0), 1);

  const moodEmoji = (mood) => ({ great: '😄', good: '😊', neutral: '😐', poor: '😔', terrible: '😞' }[mood] || '😐');

  if (loading) return <div className="loading">Loading analytics…</div>;

  const stats = [
    { label: 'Workouts', value: workoutSummary?.total_workouts || 0, sub: 'completed' },
    { label: 'Minutes trained', value: workoutSummary?.total_duration_minutes || 0, sub: 'total' },
    { label: 'Avg rating', value: `${workoutSummary?.average_rating || 0}/5`, sub: 'session quality' },
    { label: 'Avg calories', value: nutritionSummary?.average_daily_calories || 0, sub: 'per day' },
  ];

  return (
    <div className="container page-shell">
      <div className="page-hero fade-up">
        <div className="flex justify-between items-center flex-wrap gap-16">
          <div className="hero-copy">
            <p className="eyebrow">Analytics</p>
            <h1>Progress dashboard</h1>
            <p className="page-copy">Track workouts, nutrition, body metrics, and wellness trends.</p>
          </div>
          <div className="flex gap-8">
            {[7, 30, 90, 365].map(v => (
              <button key={v} className={`btn ${period === v ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPeriod(v)}>
                {v === 365 ? 'Year' : `${v}d`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="stats-grid fade-up fade-up-1">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <span className="stat-label">{s.label}</span>
            <span className="stat-value">{s.value}</span>
            <span className="stat-sub">{s.sub}</span>
          </div>
        ))}
      </div>

      <div className="two-col fade-up fade-up-2">
        {/* WEIGHT TREND */}
        <div className="card">
          <div className="section-header"><div><h2>Weight trend</h2><p className="muted-text">Body metrics over time</p></div></div>
          {weightTrend.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ fontSize: 28, marginBottom: 8 }}>📊</p>
              <p className="muted-text">Log body metrics to see your weight trend.</p>
            </div>
          ) : (
            <div className="chart-list">
              {weightTrend.map(item => (
                <div key={item.id} className="chart-row">
                  <span className="muted-text" style={{ fontSize: 12 }}>{item.date}</span>
                  <div className="chart-bar-track">
                    <div className="chart-bar-fill" style={{ width: `${((item.weight_kg || 0) / maxWeight) * 100}%` }} />
                  </div>
                  <strong style={{ fontSize: 13, color: 'var(--green)', textAlign: 'right' }}>{item.weight_kg || '--'} kg</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WELLNESS TREND */}
        <div className="card">
          <div className="section-header"><div><h2>Mood & wellness</h2><p className="muted-text">Recent daily logs</p></div></div>
          {wellnessTrend.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ fontSize: 28, marginBottom: 8 }}>🧘</p>
              <p className="muted-text">No wellness data yet. Start logging daily mood.</p>
            </div>
          ) : (
            <div>
              {wellnessTrend.map(entry => (
                <div key={entry.id} className="list-row">
                  <div>
                    <div className="flex items-center gap-8" style={{ marginBottom: 3 }}>
                      <span style={{ fontSize: 18 }}>{moodEmoji(entry.mood)}</span>
                      <strong style={{ fontSize: 14 }}>{entry.date}</strong>
                    </div>
                    <p className="muted-text" style={{ fontSize: 12 }}>Sleep {entry.sleep_hours || '--'}h · Energy {entry.energy_level || 0}/10 · Stress {entry.stress_level || 0}/10</p>
                  </div>
                  <div className="flex gap-6">
                    <span className="badge badge-green" style={{ fontSize: 11 }}>E: {entry.energy_level || 0}</span>
                    <span className="badge badge-amber" style={{ fontSize: 11 }}>S: {entry.stress_level || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* WORKOUT BREAKDOWN */}
      <div className="card fade-up fade-up-3">
        <div className="section-header"><div><h2>Workout breakdown</h2><p className="muted-text">Session frequency by week</p></div></div>
        {workoutSummary ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            {[
              { label: 'Frequency', value: `${workoutSummary.workout_frequency_per_week || 0}x / week`, color: 'var(--green)', pct: Math.min(((workoutSummary.workout_frequency_per_week || 0) / 7) * 100, 100) },
              { label: 'Total sessions', value: workoutSummary.total_workouts || 0, color: 'var(--blue)', pct: Math.min(((workoutSummary.total_workouts || 0) / 50) * 100, 100) },
              { label: 'Avg duration', value: `${Math.round((workoutSummary.total_duration_minutes || 0) / Math.max(workoutSummary.total_workouts || 1, 1))} min`, color: 'var(--teal)', pct: Math.min((workoutSummary.total_duration_minutes || 0) / 100, 100) },
              { label: 'Avg rating', value: `${workoutSummary.average_rating || 0} / 5`, color: 'var(--amber)', pct: Math.min(((workoutSummary.average_rating || 0) / 5) * 100, 100) },
            ].map(item => (
              <div key={item.label} className="spotlight-panel">
                <span className="panel-label">{item.label}</span>
                <strong style={{ display: 'block', fontSize: 22, fontFamily: "'Syne', sans-serif", color: item.color, marginBottom: 10 }}>{item.value}</strong>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${item.pct}%`, background: item.color }} /></div>
              </div>
            ))}
          </div>
        ) : <p className="muted-text">No workout data for this period.</p>}
      </div>

      {/* NUTRITION */}
      {nutritionSummary && (
        <div className="card fade-up">
          <div className="section-header"><div><h2>Nutrition summary</h2><p className="muted-text">Averages for selected period</p></div></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
            {[
              { label: 'Avg daily calories', value: nutritionSummary.average_daily_calories || 0, unit: 'kcal' },
              { label: 'Meal logs', value: nutritionSummary.meal_logs_count || 0, unit: 'entries' },
              { label: 'Avg protein', value: nutritionSummary.average_protein_g || 0, unit: 'g' },
              { label: 'Avg carbs', value: nutritionSummary.average_carbs_g || 0, unit: 'g' },
            ].map(n => (
              <div key={n.label} className="stat-card">
                <span className="stat-label">{n.label}</span>
                <span className="stat-value" style={{ fontSize: 22 }}>{n.value}</span>
                <span className="stat-sub">{n.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
