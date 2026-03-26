import React, { useState, useEffect, useCallback } from 'react';
import { workoutsAPI, analyticsAPI } from '../services/api';

const PERIOD_OPTIONS = ['day', 'week', 'month', 'year'];

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatValue = (value, maxDecimals = 2) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-';
  }
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: maxDecimals });
};

const MetricBarChart = ({ title, data, valueKey, color, suffix = '' }) => {
  const maxValue = Math.max(...data.map((point) => toNumber(point[valueKey])), 0);

  return (
    <div className="card" style={{ marginBottom: '16px' }}>
      <h3 style={{ marginBottom: '12px' }}>{title}</h3>
      {data.length === 0 ? (
        <p style={{ color: '#666' }}>No data for the selected filter range.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: '10px', alignItems: 'end', minHeight: '200px' }}>
          {data.map((point, index) => {
            const value = toNumber(point[valueKey]);
            const heightPercent = maxValue > 0 ? Math.max((value / maxValue) * 100, 6) : 6;

            return (
              <div key={`${point.bucket}-${index}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#2e7d32', fontWeight: 600 }}>{formatValue(value)}{suffix}</span>
                <div style={{ width: '100%', maxWidth: '46px', height: '130px', display: 'flex', alignItems: 'flex-end' }}>
                  <div
                    style={{
                      width: '100%',
                      height: `${heightPercent}%`,
                      backgroundColor: color,
                      borderRadius: '6px 6px 2px 2px',
                      transition: 'height 0.3s ease',
                    }}
                    title={`${point.bucket}: ${formatValue(value)}${suffix}`}
                  />
                </div>
                <span style={{ fontSize: '11px', color: '#666', textAlign: 'center' }}>{point.bucket}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const MyWorkouts = () => {
  const [plans, setPlans] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans');
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');
  const [workoutSeries, setWorkoutSeries] = useState([]);
  const [workoutSummary, setWorkoutSummary] = useState(null);
  const [analyticsFilters, setAnalyticsFilters] = useState({
    period: 'week',
    start_date: '',
    end_date: '',
    days: ''
  });
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [logFormVisible, setLogFormVisible] = useState(false);
  const [logForm, setLogForm] = useState({
    plan_id: '',
    workout_day_id: '',
    date: new Date().toISOString().split('T')[0],
    duration_minutes: '',
    notes: '',
    rating: 3
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load workout plans
      const plansRes = await workoutsAPI.getWorkoutPlans({ role: 'client' });
      if (plansRes.data.success) {
        setPlans(plansRes.data.data.plans);
      }

      // Load workout logs (last 30 days)
      const logsRes = await workoutsAPI.getWorkoutLogs();
      if (logsRes.data.success) {
        setLogs(logsRes.data.data.logs);
      }

      // Load stats
      const statsRes = await workoutsAPI.getWorkoutStats({ period: 30 });
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

    } catch (error) {
      console.error('Error loading workout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewPlanDetails = async (planId) => {
    try {
      const response = await workoutsAPI.getWorkoutPlan(planId);
      if (response.data.success) {
        setSelectedPlan(response.data.data);
      }
    } catch (error) {
      console.error('Error loading plan details:', error);
    }
  };

  const loadAnalyticsData = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError('');

      const params = { period: analyticsFilters.period };

      if (analyticsFilters.start_date && analyticsFilters.end_date) {
        params.start_date = analyticsFilters.start_date;
        params.end_date = analyticsFilters.end_date;
      } else if (analyticsFilters.days) {
        params.days = Number(analyticsFilters.days);
      }

      const [chartsRes, summaryRes] = await Promise.all([
        analyticsAPI.getCharts(params),
        analyticsAPI.getWorkoutSummary(params)
      ]);

      setWorkoutSeries(chartsRes.data?.data?.series?.workouts || []);
      setWorkoutSummary(summaryRes.data?.data || null);
    } catch (error) {
      console.error('Error loading workout analytics:', error);
      setAnalyticsError(error.response?.data?.message || 'Failed to load workout analytics.');
      setWorkoutSeries([]);
      setWorkoutSummary(null);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [analyticsFilters]);

  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalyticsData();
    }
  }, [activeTab, loadAnalyticsData]);

  const applyAnalyticsFilters = () => {
    loadAnalyticsData();
  };

  const clearAnalyticsDateFilters = () => {
    setAnalyticsFilters((prev) => ({
      ...prev,
      start_date: '',
      end_date: '',
      days: ''
    }));
  };

  const totalCompleted = workoutSeries.reduce((sum, point) => sum + toNumber(point.workouts_completed), 0);
  const totalDuration = workoutSeries.reduce((sum, point) => sum + toNumber(point.total_duration_minutes), 0);
  const avgRatingAcrossBuckets = workoutSeries.length
    ? workoutSeries.reduce((sum, point) => sum + toNumber(point.average_rating), 0) / workoutSeries.length
    : 0;

  const handleLogWorkout = async (e) => {
    e.preventDefault();
    try {
      const response = await workoutsAPI.createWorkoutLog(logForm);
      if (response.data.success) {
        alert('Workout logged successfully!');
        setLogFormVisible(false);
        setLogForm({
          plan_id: '',
          workout_day_id: '',
          date: new Date().toISOString().split('T')[0],
          duration_minutes: '',
          notes: '',
          rating: 3
        });
        loadData();
      }
    } catch (error) {
      console.error('Error logging workout:', error);
      alert('Failed to log workout');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '50px' }}>
        <p>Loading workouts...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1200px', marginTop: '30px' }}>
      <h1>My Workouts</h1>

      {/* Stats Overview */}
      {stats && (
        <div className="card" style={{ backgroundColor: '#e8f5e9', marginBottom: '20px' }}>
          <h3>Last 30 Days</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', marginTop: '15px' }}>
            <div>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>Total Workouts</p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#2e7d32', margin: 0 }}>{stats.total_workouts}</p>
            </div>
            <div>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>Total Time</p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#2e7d32', margin: 0 }}>{stats.total_duration_minutes} min</p>
            </div>
            <div>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>Avg Rating</p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#2e7d32', margin: 0 }}>{stats.average_rating}/5</p>
            </div>
            <div>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>Frequency</p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#2e7d32', margin: 0 }}>{stats.workout_frequency_per_week}x/week</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ marginBottom: '20px' }}>
        <button
          className="btn btn-primary"
          onClick={() => setLogFormVisible(!logFormVisible)}
          style={{ marginRight: '10px' }}
        >
          {logFormVisible ? 'Cancel' : 'Log Workout'}
        </button>
      </div>

      {/* Log Workout Form */}
      {logFormVisible && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>Log Workout</h3>
          <form onSubmit={handleLogWorkout}>
            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                className="input"
                value={logForm.date}
                onChange={(e) => setLogForm({...logForm, date: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Duration (minutes)</label>
              <input
                type="number"
                className="input"
                value={logForm.duration_minutes}
                onChange={(e) => setLogForm({...logForm, duration_minutes: e.target.value})}
                placeholder="e.g., 45"
              />
            </div>

            <div className="form-group">
              <label>Rating (1-5)</label>
              <select
                className="input"
                value={logForm.rating}
                onChange={(e) => setLogForm({...logForm, rating: parseInt(e.target.value)})}
              >
                <option value="1">1 - Very Hard</option>
                <option value="2">2 - Hard</option>
                <option value="3">3 - Moderate</option>
                <option value="4">4 - Easy</option>
                <option value="5">5 - Very Easy</option>
              </select>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                className="input"
                value={logForm.notes}
                onChange={(e) => setLogForm({...logForm, notes: e.target.value})}
                rows="3"
                placeholder="How did you feel? Any achievements?"
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Save Workout Log
            </button>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div style={{ borderBottom: '2px solid #eee', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('plans')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'plans' ? '3px solid #4CAF50' : 'none',
            fontWeight: activeTab === 'plans' ? 'bold' : 'normal',
            color: activeTab === 'plans' ? '#4CAF50' : '#666'
          }}
        >
          Workout Plans
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'history' ? '3px solid #4CAF50' : 'none',
            fontWeight: activeTab === 'history' ? 'bold' : 'normal',
            color: activeTab === 'history' ? '#4CAF50' : '#666',
            marginLeft: '10px'
          }}
        >
          Workout History
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'analytics' ? '3px solid #4CAF50' : 'none',
            fontWeight: activeTab === 'analytics' ? 'bold' : 'normal',
            color: activeTab === 'analytics' ? '#4CAF50' : '#666',
            marginLeft: '10px'
          }}
        >
          Analytics Charts
        </button>
      </div>

      {/* Workout Plans Tab */}
      {activeTab === 'plans' && (
        <div>
          {plans.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#666', fontSize: '18px' }}>
                No workout plans yet. Your coach will create one for you!
              </p>
            </div>
          ) : selectedPlan ? (
            <div className="card">
              <button
                onClick={() => setSelectedPlan(null)}
                className="btn btn-secondary"
                style={{ marginBottom: '15px' }}
              >
                ← Back to Plans
              </button>
              <h2>{selectedPlan.name}</h2>
              <p style={{ color: '#666' }}>{selectedPlan.description}</p>
              <p style={{ fontSize: '14px', color: '#888' }}>
                {selectedPlan.start_date && `Start: ${selectedPlan.start_date}`}
                {selectedPlan.end_date && ` | End: ${selectedPlan.end_date}`}
              </p>

              {selectedPlan.days && selectedPlan.days.map((day) => (
                <div key={day.id} style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                  <h4>{day.name}</h4>
                  {day.notes && <p style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>{day.notes}</p>}

                  {day.exercises && day.exercises.length > 0 && (
                    <table style={{ width: '100%', marginTop: '10px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#e0e0e0' }}>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Exercise</th>
                          <th style={{ padding: '8px', textAlign: 'center' }}>Sets</th>
                          <th style={{ padding: '8px', textAlign: 'center' }}>Reps</th>
                          <th style={{ padding: '8px', textAlign: 'center' }}>Weight</th>
                          <th style={{ padding: '8px', textAlign: 'center' }}>Rest</th>
                        </tr>
                      </thead>
                      <tbody>
                        {day.exercises.map((ex) => (
                          <tr key={ex.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '8px' }}>
                              <strong>{ex.exercise?.name || 'Exercise'}</strong>
                              {ex.notes && <p style={{ fontSize: '12px', color: '#888', margin: '5px 0 0 0' }}>{ex.notes}</p>}
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>{ex.sets || '-'}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>{ex.reps || '-'}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>{ex.weight || '-'}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>{ex.rest_seconds ? `${ex.rest_seconds}s` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {plans.map((plan) => (
                <div key={plan.id} className="card" style={{ cursor: 'pointer' }} onClick={() => viewPlanDetails(plan.id)}>
                  <h3 style={{ color: '#4CAF50', marginBottom: '10px' }}>{plan.name}</h3>
                  <p style={{ color: '#666', fontSize: '14px' }}>{plan.description}</p>
                  <div style={{ display: 'flex', gap: '15px', marginTop: '10px', fontSize: '13px', color: '#888' }}>
                    <span>Status: <strong style={{ color: plan.status === 'active' ? '#4CAF50' : '#666' }}>{plan.status}</strong></span>
                    {plan.start_date && <span>Start: {plan.start_date}</span>}
                    {plan.end_date && <span>End: {plan.end_date}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Workout History Tab */}
      {activeTab === 'history' && (
        <div>
          {logs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#666', fontSize: '18px' }}>
                No workout logs yet. Start logging your workouts!
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {logs.map((log) => (
                <div key={log.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h4 style={{ color: '#4CAF50', marginBottom: '5px' }}>
                        {log.workout_day?.name || 'Workout'}
                      </h4>
                      <p style={{ color: '#888', fontSize: '14px', margin: '0 0 10px 0' }}>
                        {new Date(log.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {log.duration_minutes && (
                        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32', margin: 0 }}>
                          {log.duration_minutes} min
                        </p>
                      )}
                      {log.rating && (
                        <p style={{ fontSize: '14px', color: '#888', margin: '5px 0 0 0' }}>
                          Rating: {log.rating}/5
                        </p>
                      )}
                    </div>
                  </div>
                  {log.notes && (
                    <p style={{ color: '#666', fontSize: '14px', marginTop: '10px', fontStyle: 'italic' }}>
                      "{log.notes}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div>
          <div className="card" style={{ marginBottom: '16px' }}>
            <h3 style={{ marginBottom: '8px' }}>Workout Analytics Filters</h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '14px' }}>
              View progress charts by day, week, month, or year.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Period</label>
                <select
                  value={analyticsFilters.period}
                  onChange={(e) => setAnalyticsFilters((prev) => ({ ...prev, period: e.target.value }))}
                >
                  {PERIOD_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Start Date (optional)</label>
                <input
                  type="date"
                  value={analyticsFilters.start_date}
                  onChange={(e) => setAnalyticsFilters((prev) => ({ ...prev, start_date: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>End Date (optional)</label>
                <input
                  type="date"
                  value={analyticsFilters.end_date}
                  onChange={(e) => setAnalyticsFilters((prev) => ({ ...prev, end_date: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Days fallback (optional)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 30"
                  value={analyticsFilters.days}
                  onChange={(e) => setAnalyticsFilters((prev) => ({ ...prev, days: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" onClick={applyAnalyticsFilters}>
                Apply Filters
              </button>
              <button className="btn btn-secondary" onClick={clearAnalyticsDateFilters}>
                Clear Date Filters
              </button>
            </div>
          </div>

          {analyticsError && <div className="error-message">{analyticsError}</div>}

          {analyticsLoading ? (
            <div className="card" style={{ textAlign: 'center' }}>
              <p>Loading workout analytics...</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div className="card" style={{ marginBottom: 0 }}>
                  <p style={{ color: '#666', fontSize: '13px', marginBottom: '7px' }}>Workouts Completed</p>
                  <p style={{ fontSize: '30px', margin: 0, color: '#2e7d32', fontWeight: 700 }}>{formatValue(totalCompleted, 0)}</p>
                </div>
                <div className="card" style={{ marginBottom: 0 }}>
                  <p style={{ color: '#666', fontSize: '13px', marginBottom: '7px' }}>Total Duration</p>
                  <p style={{ fontSize: '30px', margin: 0, color: '#2e7d32', fontWeight: 700 }}>{formatValue(totalDuration, 0)} min</p>
                </div>
                <div className="card" style={{ marginBottom: 0 }}>
                  <p style={{ color: '#666', fontSize: '13px', marginBottom: '7px' }}>Average Rating</p>
                  <p style={{ fontSize: '30px', margin: 0, color: '#2e7d32', fontWeight: 700 }}>{formatValue(avgRatingAcrossBuckets, 2)}/5</p>
                </div>
                <div className="card" style={{ marginBottom: 0 }}>
                  <p style={{ color: '#666', fontSize: '13px', marginBottom: '7px' }}>Summary Endpoint Avg Rating</p>
                  <p style={{ fontSize: '30px', margin: 0, color: '#2e7d32', fontWeight: 700 }}>{formatValue(workoutSummary?.average_rating, 2)}/5</p>
                </div>
              </div>

              <MetricBarChart
                title="Workouts Completed by Bucket"
                data={workoutSeries}
                valueKey="workouts_completed"
                color="#4CAF50"
              />

              <MetricBarChart
                title="Total Duration by Bucket"
                data={workoutSeries}
                valueKey="total_duration_minutes"
                color="#1b9aaa"
                suffix="m"
              />

              <MetricBarChart
                title="Average Rating by Bucket"
                data={workoutSeries}
                valueKey="average_rating"
                color="#f39c12"
              />

              <div className="card">
                <h3 style={{ marginBottom: '12px' }}>Workout Analytics Data Table</h3>
                {workoutSeries.length === 0 ? (
                  <p style={{ color: '#666' }}>No chart rows returned for the selected range.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f2f4f7' }}>
                          <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #ddd' }}>Bucket</th>
                          <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #ddd' }}>Completed</th>
                          <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #ddd' }}>Duration (min)</th>
                          <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #ddd' }}>Avg Rating</th>
                          <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #ddd' }}>Avg Duration/Workout</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workoutSeries.map((point, index) => {
                          const completed = toNumber(point.workouts_completed);
                          const duration = toNumber(point.total_duration_minutes);
                          const avgDuration = completed > 0 ? duration / completed : 0;

                          return (
                            <tr key={`${point.bucket}-${index}`}>
                              <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{point.bucket}</td>
                              <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{formatValue(completed, 0)}</td>
                              <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{formatValue(duration, 0)}</td>
                              <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{formatValue(point.average_rating, 2)}</td>
                              <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{formatValue(avgDuration, 1)} min</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MyWorkouts;
