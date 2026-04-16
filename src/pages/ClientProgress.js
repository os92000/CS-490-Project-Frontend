import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coachesAPI } from '../services/api';
import Avatar from '../components/Avatar';
import FitChart, { lineDataset, barDataset } from '../components/FitChart';

const moodEmoji = { excellent:'😄', good:'😊', okay:'😐', poor:'😔', terrible:'😞' };

const ClientProgress = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    coachesAPI.getClientProgress(clientId)
      .then(res => { if (res.data.success) setData(res.data.data); })
      .catch(err => setError(err.response?.data?.message || 'Failed to load client progress.'))
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) return <div className="loading">Loading client progress…</div>;
  if (error) return <div className="container page-shell"><div className="error-message">{error}</div><button className="btn btn-secondary mt-16" onClick={() => navigate('/my-clients')}>← Back to clients</button></div>;

  const client = data.client;
  const name = client?.profile?.first_name ? `${client.profile.first_name} ${client.profile.last_name||''}`.trim() : client?.email || 'Client';
  const initials = (client?.profile?.first_name?.[0] || client?.email?.[0] || '?').toUpperCase();

  return (
    <div className="container page-shell">
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/my-clients')} style={{ alignSelf: 'flex-start' }}>← Back to clients</button>

      {/* HERO */}
      <div className="page-hero fade-up">
        <div className="flex items-center gap-20" style={{ flexWrap: 'wrap' }}>
          <Avatar src={client?.profile?.profile_picture} name={name} size={72} style={{ border: '3px solid rgba(88,166,255,0.3)' }} />
          <div className="hero-copy">
            <p className="eyebrow">Client progress</p>
            <h1>{name}</h1>
            <p className="page-copy">{client?.email} · {data.survey?.fitness_level || 'No fitness level set'}</p>
          </div>
        </div>
      </div>

      {/* SURVEY */}
      {data.survey && (
        <div className="card fade-up fade-up-1">
          <div className="section-header"><div><h2>Fitness profile</h2><p className="muted-text">From initial survey</p></div></div>
          <div className="stats-grid">
            {[
              { label:'Fitness level', value: data.survey.fitness_level || '—' },
              { label:'Age', value: data.survey.age || '—' },
              { label:'Weight', value: data.survey.weight ? `${data.survey.weight} kg` : '—' },
              { label:'Goals', value: data.survey.goals || '—' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <span className="stat-label">{s.label}</span>
                <span className="stat-value" style={{ fontSize: 16, lineHeight: 1.3 }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="two-col fade-up fade-up-2">
        {/* BODY METRICS */}
        <div className="card">
          <div className="section-header"><div><h2>Body metrics</h2><p className="muted-text">Recent entries</p></div></div>
          {!data.body_metrics?.length ? (
            <p className="muted-text">No body metrics logged yet.</p>
          ) : data.body_metrics.map(m => (
            <div key={m.id} className="list-row">
              <div>
                <strong style={{ fontSize: 14 }}>{m.date}</strong>
                <div className="flex gap-6 mt-4">
                  {m.weight_kg && <span className="badge badge-green" style={{ fontSize: 11 }}>{m.weight_kg} kg</span>}
                  {m.body_fat_percentage && <span className="badge badge-amber" style={{ fontSize: 11 }}>{m.body_fat_percentage}% fat</span>}
                  {m.waist_cm && <span className="badge badge-muted" style={{ fontSize: 11 }}>{m.waist_cm} cm</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* WELLNESS */}
        <div className="card">
          <div className="section-header"><div><h2>Wellness logs</h2><p className="muted-text">Mood and energy entries</p></div></div>
          {!data.wellness_logs?.length ? (
            <p className="muted-text">No wellness data yet.</p>
          ) : data.wellness_logs.map(log => (
            <div key={log.id} className="list-row">
              <div>
                <div className="flex items-center gap-8 mb-4">
                  <span style={{ fontSize: 18 }}>{moodEmoji[log.mood] || '😐'}</span>
                  <strong style={{ fontSize: 14 }}>{log.date}</strong>
                </div>
                <p className="muted-text" style={{ fontSize: 12 }}>Energy {log.energy_level}/10 · Stress {log.stress_level}/10 · Sleep {log.sleep_hours || '—'}h</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PROGRESS CHARTS */}
      {(data.body_metrics?.length >= 2 || data.workout_logs?.length >= 2) && (
        <div className="two-col fade-up fade-up-3">
          {data.body_metrics?.length >= 2 && (
            <div className="card">
              <div className="section-header"><div><h2>Weight trend</h2><p className="muted-text">Body metrics history</p></div></div>
              <FitChart
                type="line"
                labels={[...data.body_metrics].reverse().map(m => m.date?.slice(5) || '')}
                datasets={[lineDataset('Weight (kg)', [...data.body_metrics].reverse().map(m => parseFloat(m.weight_kg) || null), '#39d0b4', true)]}
                height={160}
              />
            </div>
          )}
          {data.workout_logs?.length >= 2 && (
            <div className="card">
              <div className="section-header"><div><h2>Session ratings</h2><p className="muted-text">Workout quality trend</p></div></div>
              <FitChart
                type="bar"
                labels={[...data.workout_logs].reverse().map(l => l.date?.slice(5) || '')}
                datasets={[barDataset('Rating', [...data.workout_logs].reverse().map(l => l.rating || 0), '#e3b341')]}
                height={160}
              />
            </div>
          )}
        </div>
      )}

      {/* WORKOUT PLANS */}
      <div className="card fade-up fade-up-3">
        <div className="section-header"><div><h2>Active workout plans</h2><p className="muted-text">{data.workout_plans?.length || 0} plans</p></div></div>
        {!data.workout_plans?.length ? (
          <p className="muted-text">No active plans assigned.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {data.workout_plans.map(plan => (
              <div key={plan.id} style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)' }}>
                <div className="flex justify-between items-start mb-8">
                  <strong style={{ fontSize: 15 }}>{plan.name}</strong>
                  <span className="badge badge-green" style={{ fontSize: 10 }}>{plan.status}</span>
                </div>
                {plan.description && <p className="muted-text" style={{ fontSize: 12, marginBottom: 10, lineHeight: 1.4 }}>{plan.description}</p>}
                <div className="flex flex-wrap gap-6">
                  {plan.start_date && <span className="badge badge-muted" style={{ fontSize: 10 }}>{plan.start_date}</span>}
                  {plan.end_date && <span className="badge badge-muted" style={{ fontSize: 10 }}>{plan.end_date}</span>}
                  {plan.workout_days?.length > 0 && <span className="badge badge-teal" style={{ fontSize: 10 }}>{plan.workout_days.length} days</span>}
                </div>
                {plan.workout_days?.length > 0 && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                    {plan.workout_days.slice(0, 3).map((day, i) => (
                      <div key={day.id || i} style={{ fontSize: 12, marginBottom: 4 }}>
                        <strong style={{ color: 'var(--text-2)' }}>{day.name || `Day ${day.day_number || i + 1}`}</strong>
                        {day.plan_exercises?.length > 0 && (
                          <span className="muted-text" style={{ marginLeft: 6 }}>
                            {day.plan_exercises.slice(0, 2).map(pe => pe.exercise?.name).filter(Boolean).join(', ')}
                            {day.plan_exercises.length > 2 && ` +${day.plan_exercises.length - 2}`}
                          </span>
                        )}
                      </div>
                    ))}
                    {plan.workout_days.length > 3 && (
                      <p className="muted-text" style={{ fontSize: 11, marginTop: 4 }}>+{plan.workout_days.length - 3} more days</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* WORKOUT LOGS */}
      <div className="card fade-up fade-up-3">
        <div className="section-header"><div><h2>Workout logs</h2><p className="muted-text">{data.workout_logs?.length || 0} sessions</p></div></div>
        {!data.workout_logs?.length ? (
          <p className="muted-text">No workouts logged yet.</p>
        ) : (
          <div>
            {data.workout_logs.map(log => (
              <div key={log.id} className="list-row">
                <div>
                  <strong style={{ fontSize: 14 }}>{log.date}</strong>
                  <p className="muted-text" style={{ fontSize: 12, marginTop: 3 }}>{log.notes || 'No notes'}</p>
                </div>
                <div className="flex items-center gap-8">
                  {log.duration_minutes && <span className="badge badge-muted">{log.duration_minutes} min</span>}
                  {log.rating && <span className="badge badge-amber">{'★'.repeat(log.rating)}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientProgress;
