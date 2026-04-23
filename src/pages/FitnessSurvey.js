import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { surveysAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const levels = [
  { v: 'beginner', label: 'Beginner', desc: 'Just starting out', icon: '🌱' },
  { v: 'intermediate', label: 'Intermediate', desc: 'Regular routine', icon: '🔥' },
  { v: 'advanced', label: 'Advanced', desc: 'Highly experienced', icon: '⚡' },
];

const FitnessSurvey = () => {
  const [form, setForm] = useState({ age: '', weight: '', fitness_level: '', goals: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fitness_level || !form.goals) { setError('Please fill in fitness level and goals.'); return; }
    setIsLoading(true);
    try {
      const res = await surveysAPI.createFitnessSurvey(form);
      if (res.data.success) {
        navigate(user?.role === 'both' ? '/coach-onboarding' : '/dashboard');
      }
      else setError(res.data.message || 'Failed to submit survey');
    } catch (err) { setError(err.response?.data?.message || 'An error occurred'); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="auth-page" style={{ alignItems: 'flex-start', paddingTop: 60 }}>
      <div style={{ width: '100%', maxWidth: 560 }} className="fade-up">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span className="auth-logo" style={{ display: 'block', marginBottom: 6 }}>FitApp</span>
          <h1 style={{ marginBottom: 8 }}>Quick fitness survey</h1>
          <p className="muted-text">Help us personalise your experience. Takes under a minute.</p>
        </div>

        {error && <div className="error-message mb-16">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="flex gap-12">
            <div className="form-group w-full">
              <label>Age</label>
              <input type="number" value={form.age} onChange={e => set('age', e.target.value)} placeholder="e.g. 25" min="0" max="120" />
            </div>
            <div className="form-group w-full">
              <label>Weight (kg)</label>
              <input type="number" value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="e.g. 72" min="0" />
            </div>
          </div>

          <div className="form-group">
            <label>Fitness level *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 4 }}>
              {levels.map(l => (
                <button key={l.v} type="button" onClick={() => set('fitness_level', l.v)} style={{
                  background: form.fitness_level === l.v ? 'var(--green-dim)' : 'var(--bg-3)',
                  border: `2px solid ${form.fitness_level === l.v ? 'var(--green)' : 'var(--border-2)'}`,
                  borderRadius: 10, padding: '14px 10px', cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit', transition: 'all 0.15s',
                }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{l.icon}</div>
                  <strong style={{ display: 'block', fontSize: 13, color: 'var(--text)', marginBottom: 3 }}>{l.label}</strong>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{l.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Your goals *</label>
            <textarea value={form.goals} onChange={e => set('goals', e.target.value)} rows={3}
              placeholder="e.g. Lose 8kg, build muscle, improve endurance, reduce stress…" />
          </div>

          <div className="flex gap-10 justify-center mt-8">
            <button type="submit" className="btn btn-primary btn-lg" disabled={isLoading} style={{ minWidth: 160 }}>
              {isLoading ? 'Saving…' : 'Start my journey →'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/dashboard')} disabled={isLoading}>Skip</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FitnessSurvey;
