import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coachesAPI } from '../services/api';

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
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue), var(--teal))', display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 700, color: '#000', flexShrink: 0, overflow: 'hidden', border: '3px solid rgba(88,166,255,0.3)' }}>
            {client?.profile?.profile_picture ? <img src={client.profile.profile_picture} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} /> : initials}
          </div>
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
