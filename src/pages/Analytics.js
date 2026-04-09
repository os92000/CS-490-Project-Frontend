import React, { useEffect, useMemo, useState } from 'react';
import { analyticsAPI, nutritionAPI, workoutsAPI } from '../services/api';

const Analytics = () => {
  const [period, setPeriod] = useState(30);
  const [workoutSummary, setWorkoutSummary] = useState(null);
  const [nutritionSummary, setNutritionSummary] = useState(null);
  const [progress, setProgress] = useState([]);
  const [wellness, setWellness] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [workoutResponse, nutritionResponse, progressResponse, wellnessResponse] = await Promise.all([
        analyticsAPI.getWorkoutSummary({ days: period }),
        analyticsAPI.getNutritionSummary({ days: Math.min(period, 30) }),
        analyticsAPI.getProgress(),
        nutritionAPI.getWellness(),
      ]);

      if (workoutResponse.data.success) setWorkoutSummary(workoutResponse.data.data);
      if (nutritionResponse.data.success) setNutritionSummary(nutritionResponse.data.data);
      if (progressResponse.data.success) setProgress(progressResponse.data.data.metrics);
      if (wellnessResponse.data.success) setWellness(wellnessResponse.data.data.wellness);
    } finally {
      setLoading(false);
    }
  };

  const weightTrend = useMemo(() => [...progress].reverse().slice(-8), [progress]);
  const wellnessTrend = useMemo(() => [...wellness].reverse().slice(-7), [wellness]);
  const maxWeight = Math.max(...weightTrend.map((item) => item.weight_kg || 0), 1);

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  return (
    <div className="container page-shell">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Analytics</p>
          <h1>Progress dashboard and simple trend views</h1>
          <p className="page-copy">Filter by time range and review workouts, nutrition, body metrics, and recent mood patterns.</p>
        </div>
        <div className="hero-actions">
          {[7, 30, 90, 365].map((value) => (
            <button
              key={value}
              className={`btn ${period === value ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPeriod(value)}
            >
              {value === 365 ? 'Year' : `${value}d`}
            </button>
          ))}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Completed workouts</span>
          <strong>{workoutSummary?.total_workouts || 0}</strong>
        </div>
        <div className="stat-card">
          <span>Minutes trained</span>
          <strong>{workoutSummary?.total_duration_minutes || 0}</strong>
        </div>
        <div className="stat-card">
          <span>Workout rating</span>
          <strong>{workoutSummary?.average_rating || 0}/5</strong>
        </div>
        <div className="stat-card">
          <span>Avg daily calories</span>
          <strong>{nutritionSummary?.average_daily_calories || 0}</strong>
        </div>
      </div>

      <div className="two-column-grid">
        <div className="card">
          <h3>Weight trend</h3>
          {weightTrend.length === 0 ? (
            <p className="muted-text">Add body metrics to see trends.</p>
          ) : (
            <div className="chart-list">
              {weightTrend.map((item) => (
                <div key={item.id} className="chart-row">
                  <span>{item.date}</span>
                  <div className="chart-bar-track">
                    <div className="chart-bar-fill" style={{ width: `${((item.weight_kg || 0) / maxWeight) * 100}%` }} />
                  </div>
                  <strong>{item.weight_kg || '--'} kg</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3>Mood & wellness trend</h3>
          {wellnessTrend.length === 0 ? (
            <p className="muted-text">No wellness data recorded yet.</p>
          ) : (
            <div className="chart-list">
              {wellnessTrend.map((entry) => (
                <div key={entry.id} className="list-row">
                  <div>
                    <strong>{entry.date}</strong>
                    <p className="muted-text">Mood: {entry.mood} · Sleep: {entry.sleep_hours || '--'}h</p>
                  </div>
                  <div className="badge-group">
                    <span className="badge">Energy {entry.energy_level || 0}</span>
                    <span className="badge">Stress {entry.stress_level || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
