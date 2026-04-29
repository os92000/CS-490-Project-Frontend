import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coachesAPI } from '../services/api';

const moodEmoji = { great:'😄', good:'😊', okay:'😐', poor:'😔', terrible:'😞' };
const mealTypeColor = { breakfast:'badge-amber', lunch:'badge-green', dinner:'badge-blue', snack:'badge-teal' };

const ClientProgress = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    coachesAPI.getClientProgress(clientId)
      .then(res => { if (res.data.success) setData(res.data.data); })
      .catch(err => setError(err.response?.data?.message || 'Failed to load client progress.'))
      .finally(() => setLoading(false));
  }, [clientId]);

  const removeClient = async () => {
    if (!window.confirm('Remove this client? This cannot be undone.')) return;
    setRemoving(true);
    try {
      await coachesAPI.removeClient(clientId);
      navigate('/my-clients');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove client.');
      setRemoving(false);
    }
  };

  const openChat = () => navigate('/my-clients', { state: { tab: 'messages', clientId: parseInt(clientId, 10) } });

  if (loading) return <div className="loading">Loading client progress…</div>;
  if (error) return (
    <div className="container page-shell">
      <div className="error-message">{error}</div>
      <button className="btn btn-secondary mt-16" onClick={() => navigate('/my-clients')}>← Back to clients</button>
    </div>
  );

  const client = data.client;
  const name = client?.profile?.first_name
    ? `${client.profile.first_name} ${client.profile.last_name || ''}`.trim()
    : client?.email || 'Client';
  const initials = (client?.profile?.first_name?.[0] || client?.email?.[0] || '?').toUpperCase();

  const totalCalToday = (data.meal_logs || []).filter(m => m.date === new Date().toISOString().split('T')[0]).reduce((s, m) => s + (m.calories || 0), 0);
  const latestBody = data.body_metrics?.[0];
  const latestWellness = data.wellness_logs?.[0];

  const tabs = [
    ['overview', 'Overview'],
    ['diet', `Diet & Meals (${(data.meal_logs || []).length})`],
    ['workouts', `Workouts (${(data.workout_logs || []).length})`],
    ['metrics', `Body Metrics (${(data.body_metrics || []).length})`],
    ['wellness', `Wellness (${(data.wellness_logs || []).length})`],
    ['photos', 'Progress Photos'],
  ];

  return (
    <div className="container page-shell">
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/my-clients')} style={{ alignSelf: 'flex-start' }}>← Back to clients</button>

      {/* HERO */}
      <div className="page-hero fade-up">
        <div className="flex items-center gap-20" style={{ flexWrap: 'wrap' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,var(--blue),var(--teal))', display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 700, color: '#000', flexShrink: 0, overflow: 'hidden', border: '3px solid rgba(88,166,255,0.3)' }}>
            {client?.profile?.profile_picture ? <img src={client.profile.profile_picture} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : initials}
          </div>
          <div className="hero-copy" style={{ flex: 1 }}>
            <p className="eyebrow">Client progress</p>
            <h1>{name}</h1>
            <p className="page-copy">{client?.email} · {data.survey?.fitness_level || 'No fitness level set'}</p>
            <div className="flex gap-10" style={{ marginTop: 14 }}>
              <button className="btn btn-primary btn-sm" onClick={openChat}>Message client</button>
              <button className="btn btn-danger btn-sm" onClick={removeClient} disabled={removing}>
                {removing ? 'Removing…' : 'Remove client'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="stats-grid fade-up fade-up-1">
        {[
          { label: 'Latest weight', value: latestBody?.weight_kg ? `${latestBody.weight_kg} kg` : '—', sub: latestBody?.date || 'no data' },
          { label: 'Workouts logged', value: data.workout_logs?.length || 0, sub: 'total sessions' },
          { label: 'Meals logged', value: (data.meal_logs || []).length, sub: 'total entries' },
          { label: 'Current mood', value: moodEmoji[latestWellness?.mood] || '—', sub: latestWellness?.date || 'no data' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <span className="stat-label">{s.label}</span>
            <span className="stat-value" style={{ fontSize: 20 }}>{s.value}</span>
            <span className="stat-sub">{s.sub}</span>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="tab-row fade-up fade-up-2">
        {tabs.map(([v, l]) => <button key={v} className={`tab-button ${activeTab === v ? 'active' : ''}`} onClick={() => setActiveTab(v)}>{l}</button>)}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="two-col fade-up">
          <div className="card">
            <h2 style={{ marginBottom: 14 }}>Fitness profile</h2>
            {data.survey ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  ['Fitness level', data.survey.fitness_level],
                  ['Age', data.survey.age],
                  ['Weight', data.survey.weight ? `${data.survey.weight} kg` : '—'],
                  ['Goals', data.survey.goals],
                ].map(([l, v]) => (
                  <div key={l} className="stat-card">
                    <span className="stat-label">{l}</span>
                    <span className="stat-value" style={{ fontSize: 15, lineHeight: 1.3 }}>{v || '—'}</span>
                  </div>
                ))}
              </div>
            ) : <p className="muted-text">No fitness survey completed yet.</p>}
          </div>
          <div className="card">
            <h2 style={{ marginBottom: 14 }}>Today's nutrition</h2>
            {(data.meal_logs || []).filter(m => m.date === new Date().toISOString().split('T')[0]).length === 0 ? (
              <p className="muted-text">No meals logged today.</p>
            ) : (
              <>
                <div className="stat-card" style={{ marginBottom: 14 }}>
                  <span className="stat-label">Total calories today</span>
                  <span className="stat-value" style={{ color: 'var(--amber)' }}>{totalCalToday} kcal</span>
                </div>
                {(data.meal_logs || []).filter(m => m.date === new Date().toISOString().split('T')[0]).slice(0, 3).map(m => (
                  <div key={m.id} className="list-row">
                    <div>
                      <span className={`badge ${mealTypeColor[m.meal_type] || 'badge-muted'}`} style={{ fontSize: 10, marginBottom: 4 }}>{m.meal_type}</span>
                      <p className="muted-text" style={{ fontSize: 13 }}>{m.food_items || 'No details'}</p>
                    </div>
                    {m.calories && <strong style={{ fontSize: 13, color: 'var(--amber)' }}>{m.calories} kcal</strong>}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* DIET */}
      {activeTab === 'diet' && (
        <div className="fade-up">
          <div className="two-col" style={{ marginBottom: 18 }}>
            {[
              { label: 'Total entries', value: (data.meal_logs || []).length },
              { label: 'Avg daily calories', value: Math.round((data.meal_logs || []).reduce((s, m) => s + (m.calories || 0), 0) / Math.max([...new Set((data.meal_logs || []).map(m => m.date))].length, 1)) + ' kcal' },
              { label: 'Avg protein', value: Math.round((data.meal_logs || []).reduce((s, m) => s + (m.protein_g || 0), 0) / Math.max([...new Set((data.meal_logs || []).map(m => m.date))].length, 1)) + 'g/day' },
              { label: 'Logging streak', value: [...new Set((data.meal_logs || []).map(m => m.date))].length + ' days' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <span className="stat-label">{s.label}</span>
                <span className="stat-value" style={{ fontSize: 18 }}>{s.value}</span>
              </div>
            ))}
          </div>

          {(data.meal_logs || []).length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 40px' }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>🥗</p>
              <h3 style={{ marginBottom: 8 }}>No meals logged yet</h3>
              <p className="muted-text">This client hasn't logged any meals yet.</p>
            </div>
          ) : (
            <div className="card">
              <div className="section-header"><div><h2>Meal log</h2><p className="muted-text">All logged meals, newest first</p></div></div>
              {Object.entries((data.meal_logs || []).reduce((acc, m) => { (acc[m.date] = acc[m.date] || []).push(m); return acc; }, {}))
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([date, meals]) => (
                  <div key={date} style={{ marginBottom: 20 }}>
                    <div className="flex items-center gap-12" style={{ marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                      <strong style={{ fontSize: 14 }}>{date}</strong>
                      <span className="badge badge-amber" style={{ fontSize: 10 }}>{meals.reduce((s, m) => s + (m.calories || 0), 0)} kcal total</span>
                      <span className="badge badge-green" style={{ fontSize: 10 }}>{meals.reduce((s, m) => s + (m.protein_g || 0), 0)}g protein</span>
                    </div>
                    {meals.map(m => (
                      <div key={m.id} className="list-row">
                        <div>
                          <div className="flex items-center gap-8 mb-4">
                            <span className={`badge ${mealTypeColor[m.meal_type] || 'badge-muted'}`} style={{ fontSize: 10 }}>{m.meal_type}</span>
                          </div>
                          <p className="muted-text" style={{ fontSize: 13 }}>{m.food_items || 'No details recorded'}</p>
                          {m.notes && <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>{m.notes}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-4" style={{ flexShrink: 0 }}>
                          {m.calories && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--amber)', fontFamily: "'Syne', sans-serif" }}>{m.calories} kcal</span>}
                          <div className="flex gap-6">
                            {m.protein_g && <span className="badge badge-green" style={{ fontSize: 10 }}>{m.protein_g}g protein</span>}
                            {m.carbs_g && <span className="badge badge-blue" style={{ fontSize: 10 }}>{m.carbs_g}g carbs</span>}
                            {m.fat_g && <span className="badge badge-amber" style={{ fontSize: 10 }}>{m.fat_g}g fat</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'workouts' && (
        <div className="card fade-up">
          <div className="section-header"><div><h2>Workout logs</h2><p className="muted-text">{data.workout_logs?.length || 0} sessions</p></div></div>
          {!data.workout_logs?.length ? (
            <p className="muted-text">No workouts logged yet.</p>
          ) : data.workout_logs.map(log => (
            <div key={log.id} className="list-row">
              <div>
                <strong style={{ fontSize: 14 }}>{log.date}</strong>
                {log.plan && <span className="muted-text" style={{ marginLeft: 10, fontSize: 13 }}>{log.plan.title}</span>}
                {log.notes && <p className="muted-text" style={{ fontSize: 12, marginTop: 3 }}>{log.notes}</p>}
              </div>
              <div className="flex items-center gap-8">
                {log.duration_minutes && <span className="badge badge-muted">{log.duration_minutes} min</span>}
                {log.rating && <span style={{ color: 'var(--amber)', fontSize: 14 }}>{'★'.repeat(log.rating)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'metrics' && (
        <div className="card fade-up">
          <div className="section-header"><div><h2>Body metrics</h2><p className="muted-text">Weight, body fat, measurements</p></div></div>
          {!data.body_metrics?.length ? <p className="muted-text">No body metrics logged yet.</p> : data.body_metrics.map(m => (
            <div key={m.id} className="list-row">
              <div><strong style={{ fontSize: 14 }}>{m.date}</strong></div>
              <div className="flex gap-8 flex-wrap">
                {m.weight_kg && <span className="badge badge-green">{m.weight_kg} kg</span>}
                {m.body_fat_percentage && <span className="badge badge-amber">{m.body_fat_percentage}% fat</span>}
                {m.waist_cm && <span className="badge badge-muted">{m.waist_cm}cm waist</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'wellness' && (
        <div className="card fade-up">
          <div className="section-header"><div><h2>Wellness logs</h2><p className="muted-text">Mood, energy, sleep, stress</p></div></div>
          {!data.wellness_logs?.length ? <p className="muted-text">No wellness data yet.</p> : data.wellness_logs.map(log => (
            <div key={log.id} className="list-row">
              <div>
                <div className="flex items-center gap-8 mb-4">
                  <span style={{ fontSize: 20 }}>{moodEmoji[log.mood] || '😐'}</span>
                  <strong style={{ fontSize: 14 }}>{log.date}</strong>
                  <span className="badge badge-muted" style={{ fontSize: 10, textTransform: 'capitalize' }}>{log.mood}</span>
                </div>
                <p className="muted-text" style={{ fontSize: 12 }}>Energy {log.energy_level}/10 · Stress {log.stress_level}/10 · Sleep {log.sleep_hours || '—'}h ({log.sleep_quality || '—'})</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'photos' && (
        <div className="card fade-up" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>📷</p>
          <h3 style={{ marginBottom: 8 }}>Progress photos</h3>
          <p className="muted-text">Client progress photos are accessible with their permission. This feature requires client-side upload.</p>
        </div>
      )}
    </div>
  );
};

export default ClientProgress;
