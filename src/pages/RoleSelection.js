import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';

const roles = [
  { value: 'client', title: 'Client', desc: 'Find a coach, track workouts, log nutrition, and monitor progress.', icon: '🏃', color: 'var(--green)' },
  { value: 'coach', title: 'Coach', desc: 'Help clients reach their goals, manage your roster, and grow your business.', icon: '💪', color: 'var(--blue)' },
  { value: 'both', title: 'Both', desc: 'Access both client and coach features on the same account.', icon: '⚡', color: 'var(--teal)' },
];

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!selectedRole) { setError('Please select a role to continue.'); return; }
    setIsLoading(true); setError('');
    try {
      const res = await usersAPI.updateRole(user.id, selectedRole);
      if (res.data.success) { updateUser(res.data.data); navigate('/fitness-survey'); }
      else setError(res.data.message || 'Failed to update role');
    } catch (err) { setError(err.response?.data?.message || 'An error occurred'); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="auth-page" style={{ alignItems: 'flex-start', paddingTop: 60 }}>
      <div style={{ width: '100%', maxWidth: 640 }} className="fade-up">
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <span className="auth-logo" style={{ justifyContent: 'center', display: 'block', marginBottom: 6 }}>FitApp</span>
          <h1 style={{ marginBottom: 8 }}>Choose your role</h1>
          <p className="muted-text">You can update this any time in your profile settings.</p>
        </div>

        {error && <div className="error-message mb-16">{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
          {roles.map(r => (
            <button key={r.value} onClick={() => { setSelectedRole(r.value); setError(''); }}
              style={{
                background: selectedRole === r.value ? `${r.color}18` : 'var(--bg-2)',
                border: `2px solid ${selectedRole === r.value ? r.color : 'var(--border)'}`,
                borderRadius: 16, padding: '28px 20px', cursor: 'pointer', textAlign: 'center',
                transition: 'all 0.15s', fontFamily: 'inherit',
              }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{r.icon}</div>
              <strong style={{ display: 'block', fontSize: 16, color: 'var(--text)', marginBottom: 8 }}>{r.title}</strong>
              <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{r.desc}</p>
            </button>
          ))}
        </div>

        <div className="flex gap-10 justify-center">
          <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={!selectedRole || isLoading} style={{ minWidth: 160 }}>
            {isLoading ? 'Saving…' : 'Continue →'}
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/dashboard')} disabled={isLoading}>Skip for now</button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
