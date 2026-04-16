import React, { useEffect, useState } from 'react';
import { workoutsAPI } from '../services/api';

const MyWorkouts = () => {
  const [plans, setPlans] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logForm, setLogForm] = useState({ plan_id:'', date: new Date().toISOString().split('T')[0], duration_minutes:'', notes:'', rating:3 });
  const [showLogForm, setShowLogForm] = useState(false);

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

  const diffColor = { beginner:'badge-green', intermediate:'badge-amber', advanced:'badge-red' };

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
                  {plans.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
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
          <div className="coach-grid fade-up">
            {plans.map(plan => (
              <div key={plan.id} className="card" style={{ borderRadius: 16, border: '1px solid var(--border)', transition: 'all 0.15s', cursor: 'default' }}>
                <div className="flex justify-between items-start mb-12">
                  <h3>{plan.title}</h3>
                  <span className={`badge ${diffColor[plan.difficulty] || 'badge-muted'}`}>{plan.difficulty}</span>
                </div>
                {plan.description && <p className="muted-text" style={{ fontSize: 13, marginBottom: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{plan.description}</p>}
                <div className="flex flex-wrap gap-6">
                  {plan.goal && <span className="badge badge-green">{plan.goal}</span>}
                  {plan.duration_weeks && <span className="badge badge-muted">{plan.duration_weeks} weeks</span>}
                  {plan.plan_type && <span className="badge badge-teal">{plan.plan_type}</span>}
                </div>
              </div>
            ))}
          </div>
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
            {logs.map(log => (
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
          </div>
        )
      )}
    </div>
  );
};

export default MyWorkouts;
