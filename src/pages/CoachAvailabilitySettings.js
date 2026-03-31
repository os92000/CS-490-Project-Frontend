import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coachesAPI } from '../services/api';

const DAYS = [
  { value: 0, label: 'Monday' },
  { value: 1, label: 'Tuesday' },
  { value: 2, label: 'Wednesday' },
  { value: 3, label: 'Thursday' },
  { value: 4, label: 'Friday' },
  { value: 5, label: 'Saturday' },
  { value: 6, label: 'Sunday' },
];

const newRow = () => ({
  key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  day_of_week: 1,
  start_time: '09:00',
  end_time: '17:00',
});

const CoachAvailabilitySettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const res = await coachesAPI.getMyAvailability();
      if (!res.data.success) {
        setError(res.data.message || 'Could not load availability.');
        return;
      }
      const slots = res.data.data.slots || [];
      setRows(
        slots.map((s) => ({
          key: `s-${s.id}`,
          day_of_week: s.day_of_week,
          start_time: s.start_time || '09:00',
          end_time: s.end_time || '17:00',
        }))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load availability.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!['coach', 'both'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }
    load();
  }, [user, navigate, load]);

  const updateRow = (key, field, value) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
    setError('');
    setSuccess('');
  };

  const addRow = () => {
    setRows((prev) => [...prev, newRow()]);
    setSuccess('');
  };

  const removeRow = (key) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
    setSuccess('');
  };

  const clearAll = () => {
    setRows([]);
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const slots = rows.map((r) => ({
        day_of_week: Number(r.day_of_week),
        start_time: r.start_time,
        end_time: r.end_time,
      }));
      const res = await coachesAPI.setMyAvailability({ slots });
      if (res.data.success) {
        setSuccess('Saved.');
        const list = res.data.data.slots || [];
        setRows(
          list.map((s) => ({
            key: `s-${s.id}`,
            day_of_week: s.day_of_week,
            start_time: s.start_time || '09:00',
            end_time: s.end_time || '17:00',
          }))
        );
      } else {
        setError(res.data.message || 'Save failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="container" style={{ marginTop: '40px' }}>
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '720px', marginTop: '30px' }}>
      <button type="button" className="btn" onClick={() => navigate('/dashboard')} style={{ marginBottom: '16px' }}>
        ← Back to dashboard
      </button>

      <div className="card">
        <h1>Availability</h1>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Set the windows when you take sessions. Clients see this on your public profile. Overlapping times on the same
          day aren&apos;t allowed.
        </p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          {rows.length === 0 && (
            <p style={{ color: '#666', marginBottom: '16px' }}>No slots yet — add one or save empty to clear your calendar.</p>
          )}

          {rows.map((r) => (
            <div
              key={r.key}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr auto',
                gap: '12px',
                alignItems: 'end',
                marginBottom: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Day</label>
                <select
                  value={r.day_of_week}
                  onChange={(e) => updateRow(r.key, 'day_of_week', Number(e.target.value))}
                >
                  {DAYS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>From</label>
                <input
                  type="time"
                  value={r.start_time}
                  onChange={(e) => updateRow(r.key, 'start_time', e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>To</label>
                <input type="time" value={r.end_time} onChange={(e) => updateRow(r.key, 'end_time', e.target.value)} />
              </div>
              <button type="button" className="btn btn-secondary" onClick={() => removeRow(r.key)}>
                Remove
              </button>
            </div>
          ))}

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
            <button type="button" className="btn" onClick={addRow}>
              Add slot
            </button>
            <button type="button" className="btn" onClick={clearAll}>
              Clear all
            </button>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: '20px' }}>
            {saving ? 'Saving…' : 'Save availability'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CoachAvailabilitySettings;
