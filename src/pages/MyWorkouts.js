import React, { useEffect, useMemo, useRef, useState } from 'react';
import { workoutsAPI } from '../services/api';
import FitChart, { barDataset, lineDataset } from '../components/FitChart';
import { buildBucketSeries } from '../utils/chartSeries';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { useNavigate } from 'react-router-dom';

const PAGE_SIZE = 10;

const ExerciseSearchRow = ({ ex, index, onUpdate, onRemove, showRemove }) => {
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);

  const handleNameChange = (val) => {
    onUpdate(index, 'name', val);
    clearTimeout(debounceRef.current);
    if (val.trim().length < 2) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await workoutsAPI.getExercises({ search: val });
        if (res?.data?.success) { setResults(res.data.data.exercises || []); setOpen(true); }
      } catch { setResults([]); }
    }, 300);
  };

  const selectExercise = (exercise) => {
    onUpdate(index, 'name', exercise.name);
    if (exercise.default_duration_minutes) onUpdate(index, 'duration_minutes', String(exercise.default_duration_minutes));
    setOpen(false);
    setResults([]);
  };

  return (
    <div className="flex gap-8 items-center" style={{ flexWrap: 'nowrap' }}>
      <div style={{ flex: 2, minWidth: 0, position: 'relative' }}>
        <input
          type="text"
          placeholder="Search or type exercise name"
          value={ex.name}
          onChange={e => handleNameChange(e.target.value)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          style={{ width: '100%' }}
        />
        {open && results.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, zIndex: 200, maxHeight: 200, overflowY: 'auto', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
            {results.map(r => (
              <div
                key={r.id}
                onMouseDown={() => selectExercise(r)}
                style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
              >
                <div style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</div>
                {(r.muscle_group || r.difficulty || r.default_duration_minutes) && (
                  <div className="muted-text" style={{ fontSize: 11 }}>
                    {[r.muscle_group, r.difficulty, r.default_duration_minutes ? `${r.default_duration_minutes} min` : null].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <input
        type="number"
        placeholder="Min"
        value={ex.duration_minutes}
        min="1"
        onChange={e => onUpdate(index, 'duration_minutes', e.target.value)}
        style={{ flex: '0 0 72px', minWidth: 0 }}
      />
      <span className="muted-text" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>min</span>
      {showRemove && (
        <button type="button" onClick={() => onRemove(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: '0 4px', lineHeight: 1 }} aria-label="Remove">✕</button>
      )}
    </div>
  );
};

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
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const isCoach = hasRole(['coach', 'both']);
  const isClient = hasRole(['client', 'both']);
  const [plans, setPlans] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedPlanLoading, setSelectedPlanLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(isCoach && !isClient ? 'my-plans' : 'plans');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const emptyExercise = () => ({ name: '', duration_minutes: '' });
  const [logForm, setLogForm] = useState({ plan_id:'', date: new Date().toISOString().split('T')[0], notes:'', rating:3, exercises:[{ name:'', duration_minutes:'' }] });
  const [showLogForm, setShowLogForm] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const selectedPlanRef = useRef(null);
  const [coachPlans, setCoachPlans] = useState([]);
  const [coachPlansLoading, setCoachPlansLoading] = useState(false);
  const [planClients, setPlanClients] = useState({});

  useEffect(() => {
    loadData();
    if (isCoach && !isClient) loadCoachPlans();
  }, []);

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
 
  const loadCoachPlans = async () => {
    try {
      setCoachPlansLoading(true);
      const res = await workoutsAPI.getWorkoutPlans({ role: 'coach' });
      if (res?.data?.success) {
        setCoachPlans(res.data.data.plans || []);
      }
    } catch { setError('Failed to load coach plans.'); }
    finally { setCoachPlansLoading(false); }
  };

  const loadPlanClients = async (planId) => {
    if (planClients[planId]) return;
    try {
      const res = await workoutsAPI.getPlanClients(planId);
      if (res?.data?.success) {
        setPlanClients(prev => ({ ...prev, [planId]: res.data.data.clients || [] }));
      }
    } catch { console.error('Failed to load plan clients'); }
  };

  const addExercise = () => setLogForm(f => ({ ...f, exercises: [...f.exercises, emptyExercise()] }));
  const removeExercise = i => setLogForm(f => ({ ...f, exercises: f.exercises.filter((_, idx) => idx !== i) }));
  const updateExercise = (i, field, val) => setLogForm(f => ({ ...f, exercises: f.exercises.map((ex, idx) => idx === i ? { ...ex, [field]: val } : ex) }));

  const logWorkout = async e => {
    e.preventDefault(); setError(''); setSuccess('');
    const validExercises = logForm.exercises.filter(ex => ex.name.trim() && ex.duration_minutes);
    if (validExercises.length === 0) {
      setError('Add at least one exercise with a name and duration.');
      return;
    }
    const totalDuration = validExercises.reduce((sum, ex) => sum + (parseInt(ex.duration_minutes) || 0), 0);
    const exerciseSummary = validExercises.map(ex => `${ex.name.trim()}: ${ex.duration_minutes} min`).join(', ');
    const notes = logForm.notes.trim()
      ? `${logForm.notes.trim()}\n\nExercises: ${exerciseSummary}`
      : `Exercises: ${exerciseSummary}`;
    try {
      await workoutsAPI.createWorkoutLog({ plan_id: logForm.plan_id, date: logForm.date, duration_minutes: totalDuration, notes, rating: logForm.rating });
      setSuccess('Workout logged!'); setShowLogForm(false);
      setLogForm({ plan_id:'', date: new Date().toISOString().split('T')[0], notes:'', rating:3, exercises:[{ name:'', duration_minutes:'' }] });
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

  const sessionsSeries = useMemo(() => buildBucketSeries(logs, {
    periods: 4,
    daysPerPeriod: 7,
    dateAccessor: (log) => log.date,
    valueAccessor: (log) => (log.completed === false ? 0 : 1),
    aggregate: 'sum',
    labelFormatter: (date) => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  }), [logs]);

  const ratingSeries = useMemo(() => buildBucketSeries(logs, {
    periods: 8,
    daysPerPeriod: 7,
    dateAccessor: (log) => log.date,
    valueAccessor: (log) => Number(log.rating),
    aggregate: 'average',
    labelFormatter: (date) => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  }), [logs]);

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
            <h1>{isCoach && !isClient ? 'My Plans' : 'My Workouts'}</h1>
            <p className="page-copy">
              {isCoach && !isClient
                ? 'View and manage workout plans for your clients.'
                : 'Manage workout plans and log your training sessions.'}
            </p>
          </div>
          <div className="flex gap-10 flex-wrap">

  <button
    className="btn btn-primary"
    onClick={() => navigate('/browse-exercises')}
  >
    Browse Exercises
  </button>

  {/* ONLY show when a plan is selected */}
  {selectedPlan && (
    <button
      className="btn btn-primary"
      onClick={() =>
        navigate(`/customize-workout-plan/${selectedPlan.id}`)
      }
    >
      Customize Plan
    </button>
  )}

  <button
    className="btn btn-primary"
    onClick={() => navigate('/filter-workout-plans')}
  >
    Browse Workout Plans
  </button>

  {isClient && (
    <button
      className="btn btn-primary"
      onClick={() => setShowLogForm(!showLogForm)}
    >
      + Log workout
    </button>
  )}

</div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      {/* CLIENT-ONLY: STATS */}
      {isClient && stats && (
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

      {/* CLIENT-ONLY: LOG FORM */}
      {isClient && showLogForm && (
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
            </div>

            <div className="form-group">
              <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
                <label style={{ margin: 0 }}>Exercises <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 12 }}>(at least 1 required)</span></label>
                <button type="button" className="btn btn-ghost btn-sm" onClick={addExercise}>+ Add exercise</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {logForm.exercises.map((ex, i) => (
                  <ExerciseSearchRow
                    key={i}
                    ex={ex}
                    index={i}
                    onUpdate={updateExercise}
                    onRemove={removeExercise}
                    showRemove={logForm.exercises.length > 1}
                  />
                ))}
              </div>
              {logForm.exercises.filter(ex => ex.duration_minutes).length > 0 && (
                <p className="muted-text" style={{ fontSize: 12, marginTop: 6 }}>
                  Total: {logForm.exercises.reduce((s, ex) => s + (parseInt(ex.duration_minutes) || 0), 0)} min
                </p>
              )}
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

      {/* CLIENT-ONLY: CHARTS */}
      {isClient && stats && (
        <div className="two-col fade-up fade-up-2">
          <div className="card">
            <div className="section-header"><div><h2>Sessions this month</h2><p className="muted-text">Week by week</p></div></div>
            <FitChart
              type="bar"
              labels={sessionsSeries.labels}
              datasets={[barDataset('Sessions', sessionsSeries.values, '#3fb950')]}
              height={160}
            />
          </div>
          <div className="card">
            <div className="section-header"><div><h2>Avg session rating</h2><p className="muted-text">Trend over 8 weeks</p></div></div>
            {ratingSeries.values.some(v => v != null) ? (
              <FitChart
                type="line"
                labels={ratingSeries.labels}
                datasets={[lineDataset('Rating', ratingSeries.values, '#e3b341', true)]}
                height={160}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>📈</p>
                <p className="muted-text">Log workout ratings to see this trend.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-6 fade-up fade-up-2">
        {isClient && [['plans','Workout Plans'], ['logs','Session Logs']].map(([v,l]) => (
          <button key={v} className={`tab-button ${activeTab===v?'active':''}`} onClick={() => setActiveTab(v)}>{l}</button>
        ))}
        {isCoach && (
          <button className={`tab-button ${activeTab==='my-plans'?'active':''}`} onClick={() => { setActiveTab('my-plans'); loadCoachPlans(); }}>My Plans</button>
        )}
      </div>

      {/* PLANS (Client) */}
      {isClient && activeTab === 'plans' && (
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

      {/* LOGS (Client) */}
      {isClient && activeTab === 'logs' && (
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

      {/* MY PLANS (Coach View) */}
      {activeTab === 'my-plans' && (
        coachPlansLoading ? (
          <div className="loading">Loading your plans…</div>
        ) : coachPlans.length === 0 ? (
          <div className="card fade-up" style={{ textAlign: 'center', padding: '60px 40px' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📝</p>
            <h3 style={{ marginBottom: 8 }}>No plans created yet</h3>
            <p className="muted-text" style={{ marginBottom: 24 }}>Create workout plans to assign to your clients.</p>
            <button className="btn btn-primary" onClick={() => navigate('/create-workout-plan')}>+ Create a plan</button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center" style={{ marginTop: 6, marginBottom: 10 }}>
              <p className="muted-text">Plans you've created for your clients.</p>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/create-workout-plan')}>+ Create plan</button>
            </div>
            <div className="coach-grid fade-up">
              {coachPlans.map(plan => {
                const isSelected = selectedPlan?.id === plan.id;
                const clients = planClients[plan.id];
                const clientName = plan.client?.profile?.first_name
                  ? `${plan.client.profile.first_name} ${plan.client.profile.last_name || ''}`.trim()
                  : plan.client?.email || 'Unknown client';

                return (
                  <button
                    key={plan.id}
                    type="button"
                    className="card"
                    onClick={() => { selectPlan(plan); loadPlanClients(plan.id); }}
                    style={{ borderRadius: 16, border: isSelected ? '1px solid var(--teal)' : '1px solid var(--border)', transition: 'all 0.15s', cursor: 'pointer', textAlign: 'left', width: '100%', background: isSelected ? 'rgba(95,215,228,0.08)' : undefined, color: 'var(--text)' }}
                  >
                    <div className="flex justify-between items-start mb-12">
                      <h3>{plan.title || plan.name}</h3>
                      <span className={`badge ${plan.status === 'active' ? 'badge-green' : plan.status === 'completed' ? 'badge-muted' : 'badge-amber'}`}>{plan.status || 'unrated'}</span>
                    </div>
                    {plan.description && <p className="muted-text" style={{ fontSize: 13, marginBottom: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{plan.description}</p>}
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center gap-6">
                        <Avatar name={clientName} size={22} />
                        <span className="muted-text" style={{ fontSize: 12 }}>{clientName}</span>
                      </div>
                      {plan.goal && <span className="badge badge-green">{plan.goal}</span>}
                      {plan.duration_weeks && <span className="badge badge-muted">{plan.duration_weeks} weeks</span>}
                      {plan.plan_type && <span className="badge badge-teal">{plan.plan_type}</span>}
                      {plan.difficulty && <span className={`badge ${diffColor[plan.difficulty] || 'badge-muted'}`}>{plan.difficulty}</span>}
                    </div>
                    {clients && clients.length > 0 && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                        <p className="muted-text" style={{ fontSize: 11, marginBottom: 8 }}>Clients on this plan:</p>
                        {clients.map(c => (
                          <div key={c.id} className="flex items-center gap-8" style={{ marginBottom: 6 }}>
                            <Avatar name={`${c.profile?.first_name || c.email || '?'}`} size={20} />
                            <span style={{ fontSize: 13 }}>{c.profile?.first_name ? `${c.profile.first_name} ${c.profile.last_name || ''}`.trim() : c.email}</span>
                            <span className={`badge ${c.plan_status === 'active' ? 'badge-green' : c.plan_status === 'completed' ? 'badge-muted' : 'badge-amber'}`} style={{ fontSize: 10 }}>{c.plan_status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedPlan && selectedPlan.coach_id === user?.id && (
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
    </div>
  );
};

export default MyWorkouts;