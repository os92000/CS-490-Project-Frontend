import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coachesAPI } from '../services/api';

const newRow = () => ({
  key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  session_type: '1-on-1 session',
  price: '',
  currency: 'USD',
});

const CoachPricingSettings = () => {
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
      const res = await coachesAPI.getMyPricing();
      if (!res.data.success) {
        setError(res.data.message || 'Could not load pricing.');
        return;
      }
      const items = res.data.data.items || [];
      setRows(
        items.map((p) => ({
          key: `p-${p.id}`,
          session_type: p.session_type || '',
          price: p.price != null ? String(p.price) : '',
          currency: (p.currency || 'USD').toUpperCase(),
        }))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load pricing.');
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
      const items = rows.map((r) => {
        const priceStr = String(r.price).trim();
        const price = priceStr === '' ? NaN : Number(priceStr);
        return {
          session_type: r.session_type.trim(),
          price,
          currency: (r.currency || 'USD').trim().toUpperCase() || 'USD',
        };
      });
      const res = await coachesAPI.setMyPricing({ items });
      if (res.data.success) {
        setSuccess('Saved.');
        const list = res.data.data.items || [];
        setRows(
          list.map((p) => ({
            key: `p-${p.id}`,
            session_type: p.session_type || '',
            price: p.price != null ? String(p.price) : '',
            currency: (p.currency || 'USD').toUpperCase(),
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
        <h1>Pricing</h1>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Add what you charge — hourly, weekly, monthly packages, whatever you use. Clients see this on your public
          profile.
        </p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          {rows.length === 0 && (
            <p style={{ color: '#666', marginBottom: '16px' }}>
              No rates yet. Add a row or save empty to clear everything.
            </p>
          )}

          {rows.map((r) => (
            <div
              key={r.key}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr minmax(70px, 0.6fr) auto',
                gap: '12px',
                alignItems: 'end',
                marginBottom: '12px',
              }}
            >
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Label</label>
                <input
                  value={r.session_type}
                  onChange={(e) => updateRow(r.key, 'session_type', e.target.value)}
                  placeholder="e.g. Hourly, Monthly package"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={r.price}
                  onChange={(e) => updateRow(r.key, 'price', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Currency</label>
                <input
                  maxLength={3}
                  value={r.currency}
                  onChange={(e) => updateRow(r.key, 'currency', e.target.value.toUpperCase())}
                  placeholder="USD"
                />
              </div>
              <button type="button" className="btn btn-secondary" onClick={() => removeRow(r.key)}>
                Remove
              </button>
            </div>
          ))}

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
            <button type="button" className="btn" onClick={addRow}>
              Add rate
            </button>
            <button type="button" className="btn" onClick={clearAll}>
              Clear all
            </button>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: '20px' }}>
            {saving ? 'Saving…' : 'Save pricing'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CoachPricingSettings;
