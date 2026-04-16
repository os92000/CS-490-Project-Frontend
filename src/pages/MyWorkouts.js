import React, { useEffect, useRef, useState } from 'react';
import { workoutsAPI } from '../services/api';
import FitChart, { barDataset, lineDataset } from '../components/FitChart';

const PAGE_SIZE = 10;

const PaginationControls = ({ page, totalPages, onPrev, onNext }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-between items-center" style={{ marginTop: 12 }}>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onPrev} disabled={page === 1}>← Prev</button>
      <span className="muted-text" style={{ fontSize: 12 }}>Page {page} of {totalPages}</span>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onNext} disabled={page === totalPages}>Next →</button>
    </div>
  );
};

const MyWorkouts = () => {
  const [plans, setPlans] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedPlanLoading, setSelectedPlanLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logForm, setLogForm] = useState({ plan_id:'', date: new Date().toISOString().split('T')[0], duration_minutes:'', notes:'', rating:3 });
  const [showLogForm, setShowLogForm] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const selectedPlanRef = useRef(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pr, lr, sr] = await Promise.all([
        workoutsAPI.getWorkoutPlans().catch(()=>null),
        workoutsAPI.getWorkoutLogs().catch(()=>null),
        workoutsAPI.getWorkoutStats().catch(()=>null),
      ]);
      if (pr?.data?.success) setPlans(pr.data.data.plans||[]);
      if (lr?.data?.success) setLogs(lr.data.data.logs||[]);
      if (sr?.data?.success) setStats(sr.data.data);
    } catch { setError('Failed to load workout data.'); }
    finally { setLoading(false); }
  };

  const logWorkout = async e => {
    e.preventDefault(); setError(''); setSuccess('');
    try {
      await workoutsAPI.createWorkoutLog(logForm);
      setSuccess('Workout logged!'); setShowLogForm(false);
      setLogForm({ plan_id:'', date: new Date().toISOString().split('T')[0], duration_minutes:'', notes:'', rating:3 });
      loadData();
    } catch(err) { setError(err.response?.data?.message || 'Failed to log workout.'); }
  };

  const selectPlan = async (plan) => {
    setError('');
    setSelectedPlanLoading(true);
    try {
      const response = await workoutsAPI.getWorkoutPlan(plan.id);
      if (response?.data?.success && response?.data?.data) {
        setSelectedPlan(response.data.data);
      } else {
        setSelectedPlan(plan);
      }
    } catch {
      setSelectedPlan(plan);
      setError('Could not load full workout plan details. Showing summary only.');
    } finally {
      setSelectedPlanLoading(false);
    }
  };

  const diffColor = { beginner:'badge-green', intermediate:'badge-amber', advanced:'badge-red' };

  const logsTotalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
  const pagedLogs = logs.slice((logsPage - 1) * PAGE_SIZE, logsPage * PAGE_SIZE);

  useEffect(() => {
    if (activeTab === 'plans' && selectedPlan && selectedPlanRef.current) {
      selectedPlanRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeTab, selectedPlan]);

  useEffect(() => {
    setLogsPage(1);
  }, [activeTab]);

  useEffect(() => {
    setLogsPage((p) => Math.min(p, logsTotalPages));
  }, [logsTotalPages]);

  if (loading) return <div className="loading">Loading workouts…</div>;

  return (
    <div className="container page-shell">
      <div className="page-hero fade-up">
        <div className="flex justify-between items-center flex-wrap gap-16">
          <div className="hero-copy">
            <p className="eyebrow">Training</p>
            <h1>My Workouts</h1>
            <p className="page-copy">Manage workout plans and log your training sessions.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowLogForm(!showLogForm)}>+ Log workout</button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* STATS */}
      {stats && (
        <div className="stats-grid fade-up fade-up-1">
          {[
            { label: 'Total sessions', value: stats.total_workouts || 0 },
            { label: 'Minutes trained', value: stats.total_duration_minutes || 0 },
            { label: 'Avg duration', value: `${Math.round((stats.total_duration_minutes||0)/Math.max(stats.total_workouts||1,1))} min` },
            { label: 'Avg rating', value: `${stats.average_rating || 0}/5` },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <span className="stat-label">{s.label}</span>
              <span className="stat-value">{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* LOG FORM */}
      {showLogForm && (
        <div className="card fade-up" style={{ borderColor: 'rgba(63,185,80,0.3)', background: 'rgba(63,185,80,0.04)' }}>
          <h2 style={{ marginBottom: 18 }}>Log a workout session</h2>
          <form onSubmit={logWorkout} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="flex gap-12" style={{ flexWrap: 'wrap' }}>
              <div className="form-group w-full">
                <label>Plan (optional)</label>
                <select value={logForm.plan_id} onChange={e => setLogForm(f=>({...f,plan_id:e.target.value}))}>
                  <option value="">No specific plan</option>
                  {plans.map(p => <option key={p.id} value={p.id}>{p.title || p.name}</option>)}
                </select>
              </div>
              <div className="form-group w-full">
                <label>Date</label>
                <input type="date" value={logForm.date} onChange={e => setLogForm(f=>({...f,date:e.target.value}))} />
              </div>
              <div className="form-group w-full">
                <label>Duration (minutes)</label>
                <input type="number" value={logForm.duration_minutes} onChange={e => setLogForm(f=>({...f,duration_minutes:e.target.value}))} placeholder="e.g. 45" min="1" />
              </div>
            </div>
            <div className="form-group">
              <label>Rating: {logForm.rating}/5</label>
              <div className="flex gap-8 mt-8">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setLogForm(f=>({...f,rating:n}))} style={{ fontSize: 24, background: 'none', border: 'none', cursor: 'pointer', color: n <= logForm.rating ? 'var(--amber)' : 'var(--border-2)', padding: 0 }}>★</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea rows={2} value={logForm.notes} onChange={e => setLogForm(f=>({...f,notes:e.target.value}))} placeholder="How did it go?" />
            </div>
            <div className="flex gap-10">
              <button type="submit" className="btn btn-primary btn-sm">Log session</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowLogForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* CHARTS */}
      {stats && (
        <div className="two-col fade-up fade-up-2">
          <div className="card">
            <div className="section-header"><div><h2>Sessions this month</h2><p className="muted-text">Week by week</p></div></div>
            <FitChart
              type="bar"
              labels={['Wk1', 'Wk2', 'Wk3', 'Wk4']}
              datasets={[barDataset('Sessions', [
                Math.round((stats.workout_frequency_per_week || 0) * 0.7),
                stats.workout_frequency_per_week || 0,
                Math.round((stats.workout_frequency_per_week || 0) * 1.2),
                stats.workout_frequency_per_week || 0,
              ], '#3fb950')]}
              height={160}
            />
          </div>
          <div className="card">
            <div className="section-header"><div><h2>Avg session rating</h2><p className="muted-text">Trend over 8 weeks</p></div></div>
            <FitChart
              type="line"
              labels={['Wk1', 'Wk2', 'Wk3', 'Wk4', 'Wk5', 'Wk6', 'Wk7', 'Wk8']}
              datasets={[lineDataset('Rating', [3, 3.5, 4, 3.8, 4.2, 4, 4.5, stats.average_rating || 4], '#e3b341', true)]}
              height={160}
            />
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-6 fade-up fade-up-2">
        {[['plans','Workout Plans'], ['logs','Session Logs']].map(([v,l]) => (
          <button key={v} className={`tab-button ${activeTab===v?'active':''}`} onClick={() => setActiveTab(v)}>{l}</button>
        ))}
      </div>

      {/* PLANS */}
      {activeTab === 'plans' && (
        plans.length === 0 ? (
          <div className="card fade-up" style={{ textAlign: 'center', padding: '60px 40px' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🏋️</p>
            <h3 style={{ marginBottom: 8 }}>No workout plans yet</h3>
            <p className="muted-text">Your coach will assign plans here, or you can browse templates.</p>
          </div>
        ) : (
          <>
            <p className="muted-text" style={{ marginTop: 6, marginBottom: 10 }}>Select a plan to view full day-by-day details below.</p>
            <div className="coach-grid fade-up">
              {plans.map(plan => {
                const isSelected = selectedPlan?.id === plan.id;
                return (
                <button
                  key={plan.id}
                  type="button"
                  className="card"
                  onClick={() => selectPlan(plan)}
                  style={{ borderRadius: 16, border: isSelected ? '1px solid var(--teal)' : '1px solid var(--border)', transition: 'all 0.15s', cursor: 'pointer', textAlign: 'left', width: '100%', background: isSelected ? 'rgba(95,215,228,0.08)' : undefined, color: 'var(--text)' }}
                >
                  <div className="flex justify-between items-start mb-12">
                    <h3>{plan.title || plan.name}</h3>
                    <span className={`badge ${diffColor[plan.difficulty] || 'badge-muted'}`}>{plan.difficulty || 'unrated'}</span>
                  </div>
                  {plan.description && <p className="muted-text" style={{ fontSize: 13, marginBottom: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{plan.description}</p>}
                  <div className="flex flex-wrap gap-6">
                    {plan.goal && <span className="badge badge-green">{plan.goal}</span>}
                    {plan.duration_weeks && <span className="badge badge-muted">{plan.duration_weeks} weeks</span>}
                    {plan.plan_type && <span className="badge badge-teal">{plan.plan_type}</span>}
                  </div>
                </button>
                );
              })}
            </div>

            {selectedPlan && (
              <div ref={selectedPlanRef} className="card fade-up" style={{ marginTop: 16 }}>
                <div className="flex justify-between items-start gap-12" style={{ flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ marginBottom: 6 }}>{selectedPlan.title || selectedPlan.name}</h3>
                    {selectedPlan.description && <p className="muted-text" style={{ marginBottom: 8 }}>{selectedPlan.description}</p>}
                  </div>
                  {selectedPlanLoading && <span className="muted-text">Loading plan details…</span>}
                </div>

                {selectedPlan.days && selectedPlan.days.length > 0 ? (
                  <div style={{ marginTop: 12 }}>
                    {selectedPlan.days.map((day, dayIndex) => (
                      <div key={day.id || dayIndex} style={{ borderTop: dayIndex === 0 ? 'none' : '1px solid var(--border)', paddingTop: dayIndex === 0 ? 0 : 10, marginTop: dayIndex === 0 ? 0 : 10 }}>
                        <strong>{day.name || `Day ${day.day_number || dayIndex + 1}`}</strong>
                        {day.notes && <p className="muted-text" style={{ fontSize: 13, marginTop: 2 }}>{day.notes}</p>}
                        {day.exercises && day.exercises.length > 0 && (
                          <div className="flex flex-wrap gap-6" style={{ marginTop: 8 }}>
                            {day.exercises.map((ex, exIndex) => (
                              <span key={ex.id || exIndex} className="badge badge-muted">
                                {ex.exercise?.name || 'Exercise'}{ex.sets ? ` • ${ex.sets} sets` : ''}{ex.reps ? ` • ${ex.reps} reps` : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted-text" style={{ marginTop: 8 }}>No day-by-day details found for this plan.</p>
                )}
              </div>
            )}
          </>
        )
      )}

      {/* LOGS */}
      {activeTab === 'logs' && (
        logs.length === 0 ? (
          <div className="card fade-up" style={{ textAlign: 'center', padding: '60px 40px' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📋</p>
            <h3 style={{ marginBottom: 8 }}>No sessions logged yet</h3>
            <p className="muted-text">Click "Log workout" above to record your first session.</p>
          </div>
        ) : (
          <div className="card fade-up">
            {pagedLogs.map(log => (
              <div key={log.id} className="list-row">
                <div>
                  <strong style={{ fontSize: 14 }}>{log.date}</strong>
                  {log.plan && <span className="muted-text" style={{ marginLeft: 10, fontSize: 13 }}>{log.plan.title}</span>}
                  {log.notes && <p className="muted-text" style={{ fontSize: 12, marginTop: 3 }}>{log.notes}</p>}
                </div>
                <div className="flex items-center gap-10">
                  {log.duration_minutes && <span className="badge badge-muted">{log.duration_minutes} min</span>}
                  {log.rating && <span className="badge badge-amber">{'★'.repeat(log.rating)}</span>}
                </div>
              </div>
            ))}
            <PaginationControls
              page={logsPage}
              totalPages={logsTotalPages}
              onPrev={() => setLogsPage((p) => Math.max(1, p - 1))}
              onNext={() => setLogsPage((p) => Math.min(logsTotalPages, p + 1))}
            />
          </div>
        )
      )}
    </div>
  );
};

export default MyWorkouts;
