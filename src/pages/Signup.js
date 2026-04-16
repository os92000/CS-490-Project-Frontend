import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '', first_name: '', last_name: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setIsLoading(true);
    try {
      const result = await signup(formData.email, formData.password);
      if (result.success) navigate('/role-selection');
      else setError(result.error || 'Registration failed');
    } catch { setError('An unexpected error occurred'); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-up">
        <span className="auth-logo">FitApp</span>
        <p className="auth-subtitle">Create your account and start your fitness journey</p>

        {error && <div className="error-message mb-16">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="flex gap-12">
            <div className="form-group w-full">
              <label>First name</label>
              <input name="first_name" value={formData.first_name} onChange={handleChange} placeholder="Alex" />
            </div>
            <div className="form-group w-full">
              <label>Last name</label>
              <input name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Smith" />
            </div>
          </div>
          <div className="form-group">
            <label>Email address</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min. 6 characters" required />
          </div>
          <div className="form-group">
            <label>Confirm password</label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={isLoading}>
            {isLoading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
