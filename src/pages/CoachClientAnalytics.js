import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coachesAPI } from '../services/api';
import FitChart, { lineDataset, barDataset, doughnutDataset } from '../components/FitChart';

const C = { green:'#3fb950', teal:'#39d0b4', amber:'#e3b341', red:'#f85149', blue:'#58a6ff', purple:'#bc8cff' };
const moodEmoji = { great:'😄', good:'😊', okay:'😐', poor:'😔', terrible:'😞' };

const CoachClientAnalytics = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [period, setPeriod] = useState(30);
  const [workoutSummary, setWorkoutSummary] = useState(null);
  const [nutritionSummary, setNutritionSummary] = useState(null);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [progress, setProgress] = useState([]);
  const [wellness, setWellness] = useState([]);
  const [clientName, setClientName] = useState('Client');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, [period, clientId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - (period - 1));
      const formatDate = (d) => d.toISOString().split('T')[0];

      // Get ALL client data from single endpoint
      const clientRes = await coachesAPI.getClientProgress(clientId).catch(() => null);
      if (!clientRes?.data?.success) {
        setError('Failed to load client analytics.');
        setLoading(false);
        return;
      }

      const clientData = clientRes.data.data;
      const client = clientData.client;
      const name = client?.profile?.first_name
        ? `${client.profile.first_name} ${client.profile.last_name || ''}`.trim()
        : client?.email || 'Client';
      setClientName(name);

      // Filter logs by date range
      const filterByDateRange = (logs) => (logs || []).filter(log => {
        const logDate = new Date(log.date || log.created_at);
        return logDate >= startDate && logDate <= endDate;
      });

      const filteredWorkouts = filterByDateRange(clientData.workout_logs);
      const filteredMeals = filterByDateRange(clientData.meal_logs);
      const filteredMetrics = filterByDateRange(clientData.body_metrics);
      const filteredWellness = filterByDateRange(clientData.wellness_logs);

      // Calculate workout summary from actual logs
      const totalWorkouts = filteredWorkouts.length;
      const totalMinutes = filteredWorkouts.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
      const avgRating = totalWorkouts > 0 
        ? (filteredWorkouts.reduce((sum, log) => sum + (log.rating || 0), 0) / totalWorkouts)
        : 0;
      const workoutFreq = period > 0 ? (totalWorkouts / (period / 7)).toFixed(1) : 0;

      setWorkoutSummary({
        total_workouts: totalWorkouts,
        total_duration_minutes: totalMinutes,
        average_rating: avgRating,
        workout_frequency_per_week: parseFloat(workoutFreq),
      });

      // Calculate nutrition summary from actual logs
      const totalCalories = filteredMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
      const mealCount = filteredMeals.length;
      const avgDailyCalories = mealCount > 0 && period > 0 
        ? Math.round((totalCalories / period) * 100) / 100
        : 0;
      const totalProtein = filteredMeals.reduce((sum, meal) => sum + (meal.protein_g || 0), 0);
      const totalCarbs = filteredMeals.reduce((sum, meal) => sum + (meal.carbs_g || 0), 0);
      const avgProtein = mealCount > 0 && period > 0 
        ? Math.round((totalProtein / period) * 100) / 100
        : 0;
      const avgCarbs = mealCount > 0 && period > 0 
        ? Math.round((totalCarbs / period) * 100) / 100
        : 0;

      setNutritionSummary({
        average_daily_calories: avgDailyCalories,
        meal_logs_count: mealCount,
        average_protein_g: avgProtein,
        average_carbs_g: avgCarbs,
      });

      setProgress(filteredMetrics);
      setWorkoutLogs(filteredWorkouts);
      setWellness(filteredWellness);
    } catch (err) {
      console.error('Analytics load error:', err);
      setError('Failed to load client analytics.');
    } finally {
      setLoading(false);
    }
  };

  const weightTrend = useMemo(() => [...progress].reverse(), [progress]);
  const wellnessTrend = useMemo(() => [...wellness].reverse().slice(-7), [wellness]);

  const weightLabels = weightTrend.map(i => i.date?.slice(5) || '');
  const weightData   = weightTrend.map(i => parseFloat(i.weight_kg) || null);

  const wellnessLabels  = wellnessTrend.map(i => i.date?.slice(5) || '');
  const energyData      = wellnessTrend.map(i => i.energy_level || 0);
  const stressData      = wellnessTrend.map(i => i.stress_level || 0);

  const wkFreq    = workoutSummary?.workout_frequency_per_week || 0;
  const wkTotal   = workoutSummary?.total_workouts || 0;
  const wkMin     = workoutSummary?.total_duration_minutes || 0;
  const wkRating  = workoutSummary?.average_rating || 0;

  const avgCal    = nutritionSummary?.average_daily_calories || 0;
  const mealCount = nutritionSummary?.meal_logs_count || 0;

  const workoutTypeDistribution = useMemo(() => {
    const buckets = {
      Strength: 0,
      Cardio: 0,
      Flexibility: 0,
      Balance: 0,
      Sports: 0,
      Other: 0,
    };

    const normalizeType = (value) => {
      const v = (value || '').toLowerCase();
      if (!v) return 'Other';
      if (['strength', 'resistance', 'weights', 'weightlifting'].includes(v)) return 'Strength';
      if (['cardio', 'hiit', 'running', 'cycling'].includes(v)) return 'Cardio';
      if (['flexibility', 'mobility', 'yoga', 'pilates', 'stretching'].includes(v)) return 'Flexibility';
      if (['balance', 'stability'].includes(v)) return 'Balance';
      if (['sports', 'sport'].includes(v)) return 'Sports';
      return 'Other';
    };

    workoutLogs.forEach((log) => {
      const key = normalizeType(log.exercise_type || log.library_exercise?.category);
      buckets[key] += 1;
    });

    const palette = {
      Strength: C.green,
      Cardio: C.blue,
      Flexibility: C.teal,
      Balance: C.amber,
      Sports: C.purple,
      Other: C.red,
    };

    const labels = Object.keys(buckets).filter((k) => buckets[k] > 0);
    const values = labels.map((k) => buckets[k]);
    const colors = labels.map((k) => palette[k]);
    const total = values.reduce((sum, n) => sum + n, 0);

    return { labels, values, colors, total };
  }, [workoutLogs]);

  if (loading) return <div className="loading">Loading analytics…</div>;
  if (error) return (
    <div className="container page-shell">
      <div className="error-message">{error}</div>
      <button className="btn btn-secondary mt-16" onClick={() => navigate(`/clients/${clientId}`)}>← Back to client progress</button>
    </div>
  );

  return (
    <div className="container page-shell">
      <button className="btn btn-ghost btn-sm mb-16" onClick={() => navigate(`/clients/${clientId}`)}>← Back to client progress</button>

      {/* HERO */}
      <div className="page-hero fade-up">
        <div className="flex justify-between items-center flex-wrap gap-16">
          <div className="hero-copy">
            <p className="eyebrow">Analytics</p>
            <h1>{clientName}'s progress dashboard</h1>
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

      {/* STAT CARDS */}
      <div className="stats-grid fade-up fade-up-1">
        {[
          { label: 'Workouts',       value: wkTotal,                   sub: 'completed',      color: C.green  },
          { label: 'Minutes trained',value: wkMin,                     sub: 'total',          color: C.blue   },
          { label: 'Avg rating',     value: `${wkRating.toFixed(1)}/5`, sub: 'session quality', color: C.amber  },
          { label: 'Avg calories',   value: avgCal,                    sub: 'per day',        color: C.teal   },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <span className="stat-label">{s.label}</span>
            <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
            <span className="stat-sub">{s.sub}</span>
          </div>
        ))}
      </div>

      {/* WORKOUT SUMMARY BARS */}
      <div className="card fade-up fade-up-2">
        <div className="section-header">
          <div><h2>Workout breakdown</h2><p className="muted-text">Key metrics for selected period</p></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
          {[
            { label: 'Frequency', value: `${wkFreq}x / week`, pct: Math.min((wkFreq / 7) * 100, 100), color: C.green },
            { label: 'Total sessions', value: wkTotal, pct: Math.min((wkTotal / 50) * 100, 100), color: C.blue },
            { label: 'Total minutes', value: `${wkMin} min`, pct: Math.min((wkMin / 2000) * 100, 100), color: C.teal },
            { label: 'Avg rating', value: `${wkRating.toFixed(1)} / 5`, pct: Math.min((wkRating / 5) * 100, 100), color: C.amber },
          ].map(item => (
            <div key={item.label} className="spotlight-panel">
              <span className="panel-label">{item.label}</span>
              <strong style={{ display: 'block', fontSize: 22, fontFamily: "'Syne', sans-serif", color: item.color, marginBottom: 10 }}>
                {item.value}
              </strong>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${item.pct}%`, background: item.color }} /></div>
            </div>
          ))}
        </div>
      </div>

      {/* WEIGHT + WELLNESS CHARTS */}
      <div className="two-col fade-up fade-up-2">
        <div className="card">
          <div className="section-header"><div><h2>Weight trend</h2><p className="muted-text">Body metrics over time</p></div></div>
          {weightData.filter(Boolean).length < 2 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>📊</p>
              <p className="muted-text">Log body metrics to see your weight trend here.</p>
            </div>
          ) : (
            <FitChart
              type="line"
              labels={weightLabels}
              datasets={[lineDataset('Weight (kg)', weightData, C.teal, true)]}
              height={200}
            />
          )}
        </div>

        <div className="card">
          <div className="section-header"><div><h2>Mood & energy</h2><p className="muted-text">Last 7 entries (stable view)</p></div></div>
          {wellnessTrend.length < 2 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>🧘</p>
              <p className="muted-text">Log daily wellness to see trends here.</p>
            </div>
          ) : (
            <FitChart
              type="bar"
              labels={wellnessLabels}
              datasets={[
                barDataset('Energy', energyData, C.green),
                barDataset('Stress', stressData, C.red),
              ]}
              height={200}
              showLegend
            />
          )}
        </div>
      </div>

      {/* WORKOUT TYPES + WELLNESS LOGS */}
      <div className="two-col fade-up fade-up-3">
        <div className="card">
          <div className="section-header"><div><h2>Workout types</h2><p className="muted-text">Distribution for selected filter</p></div></div>
          <div className="flex items-center gap-20" style={{ flexWrap: 'wrap' }}>
            <div style={{ width: 160, flexShrink: 0 }}>
              {workoutTypeDistribution.total > 0 ? (
                <FitChart
                  type="doughnut"
                  labels={workoutTypeDistribution.labels}
                  datasets={[doughnutDataset(workoutTypeDistribution.values, workoutTypeDistribution.colors)]}
                  height={160}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p className="muted-text" style={{ fontSize: 13 }}>No workouts in this range.</p>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {workoutTypeDistribution.labels.map((label, i) => (
                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: workoutTypeDistribution.colors[i], flexShrink: 0 }} />
                  {label} - {Math.round((workoutTypeDistribution.values[i] / Math.max(workoutTypeDistribution.total, 1)) * 100)}%
                </span>
              ))}
              {workoutTypeDistribution.labels.length === 0 && (
                <span className="muted-text" style={{ fontSize: 13 }}>Log workouts with a type to populate this chart.</span>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="section-header"><div><h2>Recent wellness logs</h2><p className="muted-text">Last 5 entries</p></div></div>
          {wellnessTrend.length === 0 ? (
            <p className="muted-text">No wellness data yet. Log daily mood to see entries.</p>
          ) : wellnessTrend.slice(0, 5).map(entry => (
            <div key={entry.id} className="list-row">
              <div>
                <div className="flex items-center gap-8 mb-4">
                  <span style={{ fontSize: 18 }}>{moodEmoji[entry.mood] || '😐'}</span>
                  <strong style={{ fontSize: 14 }}>{entry.date}</strong>
                </div>
                <p className="muted-text" style={{ fontSize: 12 }}>
                  Sleep {entry.sleep_hours || '—'}h · Energy {entry.energy_level}/10 · Stress {entry.stress_level}/10
                </p>
              </div>
              <div className="flex gap-6">
                <span className="badge badge-green" style={{ fontSize: 11 }}>E: {entry.energy_level}</span>
                <span className="badge badge-amber" style={{ fontSize: 11 }}>S: {entry.stress_level}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NUTRITION SUMMARY */}
      {nutritionSummary && (
        <div className="card fade-up">
          <div className="section-header"><div><h2>Nutrition summary</h2><p className="muted-text">Averages for selected period</p></div></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
            {[
              { label: 'Avg daily calories', value: avgCal, unit: 'kcal', color: C.amber },
              { label: 'Meal entries', value: mealCount, unit: 'logged', color: C.green },
              { label: 'Avg protein', value: `${nutritionSummary.average_protein_g || 0}g`, unit: 'per day', color: C.blue },
              { label: 'Avg carbs', value: `${nutritionSummary.average_carbs_g || 0}g`, unit: 'per day', color: C.teal },
            ].map(n => (
              <div key={n.label} className="stat-card">
                <span className="stat-label">{n.label}</span>
                <span className="stat-value" style={{ fontSize: 20, color: n.color }}>{n.value}</span>
                <span className="stat-sub">{n.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachClientAnalytics;
