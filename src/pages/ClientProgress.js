import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { coachesAPI } from '../services/api';

const ClientProgress = () => {
  const { clientId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [clientId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await coachesAPI.getClientProgress(clientId);
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load client progress.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading client progress...</div>;
  }

  if (error) {
    return <div className="container"><div className="error-message">{error}</div></div>;
  }

  return (
    <div className="container page-shell">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Client Progress</p>
          <h1>{data.client?.profile?.first_name || data.client?.email}</h1>
          <p className="page-copy">Review fitness survey details, workout logs, body metrics, and recent wellness entries.</p>
        </div>
      </div>

      <div className="two-column-grid">
        <div className="card">
          <h3>Profile</h3>
          <div className="detail-grid">
            <div><strong>Email</strong><p>{data.client?.email}</p></div>
            <div><strong>Fitness level</strong><p>{data.survey?.fitness_level || '--'}</p></div>
            <div><strong>Weight</strong><p>{data.survey?.weight || '--'} kg</p></div>
            <div><strong>Age</strong><p>{data.survey?.age || '--'}</p></div>
          </div>
          <div className="form-group">
            <label>Goals</label>
            <p>{data.survey?.goals || 'No goals recorded.'}</p>
          </div>
        </div>

        <div className="card">
          <h3>Recent body metrics</h3>
          {data.body_metrics?.length === 0 ? (
            <p className="muted-text">No metrics available.</p>
          ) : (
            data.body_metrics.map((metric) => (
              <div key={metric.id} className="list-row">
                <div>
                  <strong>{metric.date}</strong>
                  <p className="muted-text">Weight {metric.weight_kg || '--'} kg · Waist {metric.waist_cm || '--'} cm</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="two-column-grid">
        <div className="card">
          <h3>Workout logs</h3>
          {data.workout_logs?.length === 0 ? (
            <p className="muted-text">No workouts logged yet.</p>
          ) : (
            data.workout_logs.map((log) => (
              <div key={log.id} className="list-row">
                <div>
                  <strong>{log.date}</strong>
                  <p className="muted-text">{log.duration_minutes || 0} min · Rating {log.rating || '--'} · {log.notes || 'No notes'}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h3>Wellness logs</h3>
          {data.wellness_logs?.length === 0 ? (
            <p className="muted-text">No wellness logs available.</p>
          ) : (
            data.wellness_logs.map((log) => (
              <div key={log.id} className="list-row">
                <div>
                  <strong>{log.date}</strong>
                  <p className="muted-text">Mood {log.mood} · Energy {log.energy_level}/10 · Stress {log.stress_level}/10</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientProgress;
