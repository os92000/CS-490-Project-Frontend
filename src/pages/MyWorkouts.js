import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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

const EMPTY_LOG_FORM = {
  library_exercise_id: '',
  workout_name: '',
  exercise_type: '',
  muscle_group: '',
  calories_burned: '',
  plan_id: '',
  workout_day_id: '',
  date: new Date().toISOString().split('T')[0],
  duration_minutes: '',
  notes: '',
  rating: 3,
};

const MyWorkouts = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [library, setLibrary] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('library');
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
  const [logForm, setLogForm] = useState(EMPTY_LOG_FORM);

  useEffect(() => {
    loadData();
    loadLibrary();
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

  const loadLibrary = async () => {
    try {
      setLibraryLoading(true);
      const res = await workoutsAPI.getWorkoutLibrary();
      if (res.data.success) {
        setLibrary(res.data.data?.workouts || []);
      }
    } catch (error) {
      console.error('Error loading workout library:', error);
    } finally {
      setLibraryLoading(false);
    }
  };

  const openLogFormFromLibrary = (libraryWorkout) => {
    setLogForm({
      ...EMPTY_LOG_FORM,
      library_exercise_id: libraryWorkout.id,
      workout_name: libraryWorkout.name || '',
      exercise_type: libraryWorkout.category || '',
      muscle_group: libraryWorkout.muscle_group || '',
      calories_burned:
        libraryWorkout.calories != null ? String(libraryWorkout.calories) : '',
      duration_minutes:
        libraryWorkout.default_duration_minutes != null
          ? String(libraryWorkout.default_duration_minutes)
          : '',
      date: new Date().toISOString().split('T')[0],
    });
    setLogFormVisible(true);
    // Scroll to the top so the form is visible
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openCustomLogForm = () => {
    setLogForm(EMPTY_LOG_FORM);
    setLogFormVisible(true);
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

  const isDayCompletedToday = (dayId) => {
    const today = new Date().toISOString().split('T')[0];
    return logs.some(
      (log) => log.workout_day_id === dayId && log.date === today && log.completed
    );
  };

  const handleMarkDayCompleted = async (day) => {
    if (!selectedPlan) return;
    if (isDayCompletedToday(day.id)) return;
    if (!window.confirm(`Mark "${day.name}" as completed for today?`)) return;

    // Sum up any per-exercise durations in the day (if set on the plan)
    const totalDuration = (day.exercises || []).reduce((sum, ex) => {
      const dur = Number(ex.duration_minutes);
      return Number.isFinite(dur) && dur > 0 ? sum + dur : sum;
    }, 0);

    // Infer a reasonable exercise_type if all the day's exercises share one
    const categories = (day.exercises || [])
      .map((ex) => ex.exercise?.category)
      .filter(Boolean);
    const uniqueCategories = Array.from(new Set(categories));
    const inferredType = uniqueCategories.length === 1 ? uniqueCategories[0] : null;

    const payload = {
      plan_id: selectedPlan.id,
      workout_day_id: day.id,
      workout_name: day.name,
      date: new Date().toISOString().split('T')[0],
      duration_minutes: totalDuration > 0 ? totalDuration : null,
      exercise_type: inferredType,
      completed: true,
      notes: 'Marked complete from plan',
      rating: 3,
    };

    try {
      const response = await workoutsAPI.createWorkoutLog(payload);
      if (response.data.success) {
        // Refresh logs + stats so history and analytics reflect the change
        await loadData();
        // Refresh analytics if the user is currently on that tab
        if (activeTab === 'analytics') {
          await loadAnalyticsData();
        }
        alert(`"${day.name}" marked as completed!`);
      } else {
        alert(response.data.message || 'Failed to mark day as completed');
      }
    } catch (error) {
      console.error('Error marking day completed:', error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to mark day as completed';
      alert(msg);
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
      const payload = {
        date: logForm.date,
        duration_minutes: logForm.duration_minutes || null,
        notes: logForm.notes || null,
        rating: logForm.rating,
        workout_name: logForm.workout_name.trim() || null,
        exercise_type: logForm.exercise_type || null,
        muscle_group: logForm.muscle_group.trim() || null,
        calories_burned: logForm.calories_burned || null,
        library_exercise_id: logForm.library_exercise_id || null,
      };
      const response = await workoutsAPI.createWorkoutLog(payload);
      if (response.data.success) {
        alert('Workout logged successfully!');
        setLogFormVisible(false);
        setLogForm({
          ...EMPTY_LOG_FORM,
          date: new Date().toISOString().split('T')[0],
        });
        loadData();
        setActiveTab('history');
      }
    } catch (error) {
      console.error('Error logging workout:', error);
      alert(error.response?.data?.message || 'Failed to log workout');
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
          onClick={() => (logFormVisible ? setLogFormVisible(false) : openCustomLogForm())}
          style={{ marginRight: '10px' }}
        >
          {logFormVisible ? 'Cancel' : 'Log Custom Workout'}
        </button>
      </div>

      {/* Log Workout Form */}
      {logFormVisible && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>
            {logForm.library_exercise_id
              ? `Log: ${logForm.workout_name || 'Library Workout'}`
              : 'Log Custom Workout'}
          </h3>
          {logForm.library_exercise_id && (
            <p style={{ color: '#4CAF50', fontSize: '14px', marginBottom: '10px' }}>
              Pre-filled from the workout library. Adjust any field to match what you actually did.
            </p>
          )}
          <form onSubmit={handleLogWorkout}>
            <div className="form-group">
              <label>Workout Name</label>
              <input
                type="text"
                className="input"
                value={logForm.workout_name}
                onChange={(e) => setLogForm({ ...logForm, workout_name: e.target.value })}
                placeholder="e.g., Morning run, Leg day"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  className="input"
                  value={logForm.date}
                  onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Duration (minutes)</label>
                <input
                  type="number"
                  className="input"
                  value={logForm.duration_minutes}
                  onChange={(e) => setLogForm({ ...logForm, duration_minutes: e.target.value })}
                  placeholder="e.g., 45"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Calories Burned</label>
                <input
                  type="number"
                  className="input"
                  value={logForm.calories_burned}
                  onChange={(e) => setLogForm({ ...logForm, calories_burned: e.target.value })}
                  placeholder="e.g., 300"
                  min="0"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
              <div className="form-group">
                <label>Exercise Type</label>
                <select
                  className="input"
                  value={logForm.exercise_type}
                  onChange={(e) => setLogForm({ ...logForm, exercise_type: e.target.value })}
                >
                  <option value="">Select type</option>
                  <option value="cardio">Cardio</option>
                  <option value="strength">Strength</option>
                  <option value="flexibility">Flexibility</option>
                  <option value="balance">Balance</option>
                  <option value="sports">Sports</option>
                </select>
              </div>

              <div className="form-group">
                <label>Muscle Group</label>
                <input
                  type="text"
                  className="input"
                  value={logForm.muscle_group}
                  onChange={(e) => setLogForm({ ...logForm, muscle_group: e.target.value })}
                  placeholder="e.g., legs, chest, full-body"
                />
              </div>

              <div className="form-group">
                <label>Rating (1-5)</label>
                <select
                  className="input"
                  value={logForm.rating}
                  onChange={(e) => setLogForm({ ...logForm, rating: parseInt(e.target.value, 10) })}
                >
                  <option value="1">1 - Very Hard</option>
                  <option value="2">2 - Hard</option>
                  <option value="3">3 - Moderate</option>
                  <option value="4">4 - Easy</option>
                  <option value="5">5 - Very Easy</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                className="input"
                value={logForm.notes}
                onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
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
          onClick={() => setActiveTab('library')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'library' ? '3px solid #4CAF50' : 'none',
            fontWeight: activeTab === 'library' ? 'bold' : 'normal',
            color: activeTab === 'library' ? '#4CAF50' : '#666'
          }}
        >
          Workout Library
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'plans' ? '3px solid #4CAF50' : 'none',
            fontWeight: activeTab === 'plans' ? 'bold' : 'normal',
            color: activeTab === 'plans' ? '#4CAF50' : '#666',
            marginLeft: '10px'
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

      {/* Workout Library Tab */}
      {activeTab === 'library' && (
        <div>
          <p style={{ color: '#666', marginBottom: '15px' }}>
            Browse placeholder workouts. Click a card to log one — you can edit any field before saving, or use "Log Custom Workout" above to create your own from scratch.
          </p>
          {libraryLoading ? (
            <div className="card" style={{ textAlign: 'center' }}>
              <p>Loading workout library...</p>
            </div>
          ) : library.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#666', fontSize: '16px' }}>
                No library workouts yet. Run <code>python seed_workout_library.py</code> on the backend to populate it.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              {library.map((w) => (
                <div key={w.id} className="card" style={{ margin: 0 }}>
                  <h3 style={{ color: '#4CAF50', marginBottom: '8px' }}>{w.name}</h3>
                  {w.description && (
                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                      {w.description}
                    </p>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: '13px', color: '#444', marginBottom: '12px' }}>
                    {w.category && (
                      <div>
                        <strong>Type:</strong>{' '}
                        <span style={{ textTransform: 'capitalize' }}>{w.category}</span>
                      </div>
                    )}
                    {w.muscle_group && (
                      <div>
                        <strong>Muscle:</strong> {w.muscle_group}
                      </div>
                    )}
                    {w.default_duration_minutes != null && (
                      <div>
                        <strong>Time:</strong> {w.default_duration_minutes} min
                      </div>
                    )}
                    {w.calories != null && (
                      <div>
                        <strong>Calories:</strong> ~{w.calories}
                      </div>
                    )}
                    {w.difficulty && (
                      <div>
                        <strong>Level:</strong>{' '}
                        <span style={{ textTransform: 'capitalize' }}>{w.difficulty}</span>
                      </div>
                    )}
                    {w.equipment && w.equipment !== 'none' && (
                      <div>
                        <strong>Equipment:</strong> {w.equipment}
                      </div>
                    )}
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => openLogFormFromLibrary(w)}
                  >
                    Log This Workout
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Workout Plans Tab */}
      {activeTab === 'plans' && (
        <div>
          {!selectedPlan && (
            <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/create-workout-plan')}
              >
                + Create New Plan
              </button>
            </div>
          )}
          {plans.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#666', fontSize: '18px' }}>
                No workout plans yet. Build one yourself with "Create New Plan", or wait for your coach to assign one.
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

              {selectedPlan.days && selectedPlan.days.map((day) => {
                const dayCompleted = isDayCompletedToday(day.id);
                return (
                <div key={day.id} style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0 }}>{day.name}</h4>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleMarkDayCompleted(day)}
                      disabled={dayCompleted}
                      style={{
                        padding: '6px 14px',
                        fontSize: '13px',
                        ...(dayCompleted && {
                          backgroundColor: '#9e9e9e',
                          cursor: 'not-allowed',
                          opacity: 0.7,
                        }),
                      }}
                    >
                      {dayCompleted ? '✓ Completed Today' : '✓ Mark as Completed'}
                    </button>
                  </div>
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
                );
              })}
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
              {logs.map((log) => {
                const title =
                  log.workout_name ||
                  log.workout_day?.name ||
                  log.library_exercise?.name ||
                  'Workout';
                return (
                  <div key={log.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h4 style={{ color: '#4CAF50', marginBottom: '5px' }}>{title}</h4>
                        <p style={{ color: '#888', fontSize: '14px', margin: '0 0 10px 0' }}>
                          {new Date(log.date).toLocaleDateString()}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px' }}>
                          {log.exercise_type && (
                            <span style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '3px 10px', borderRadius: '12px', textTransform: 'capitalize' }}>
                              {log.exercise_type}
                            </span>
                          )}
                          {log.muscle_group && (
                            <span style={{ backgroundColor: '#e3f2fd', color: '#1565c0', padding: '3px 10px', borderRadius: '12px' }}>
                              {log.muscle_group}
                            </span>
                          )}
                          {log.library_exercise_id && (
                            <span style={{ backgroundColor: '#fff3e0', color: '#e65100', padding: '3px 10px', borderRadius: '12px' }}>
                              From library
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {log.duration_minutes != null && (
                          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32', margin: 0 }}>
                            {log.duration_minutes} min
                          </p>
                        )}
                        {log.calories_burned != null && (
                          <p style={{ fontSize: '14px', color: '#e65100', margin: '5px 0 0 0' }}>
                            {log.calories_burned} cal
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
                );
              })}
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
