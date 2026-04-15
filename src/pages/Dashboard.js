import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI, coachesAPI, surveysAPI } from '../services/api';

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const [survey, setSurvey] = useState(null);
  const [workoutSummary, setWorkoutSummary] = useState(null);
  const [nutritionSummary, setNutritionSummary] = useState(null);
  const [coachData, setCoachData] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user.role || user.role === 'none') { navigate('/role-selection'); return; }
    const isClient = ['client', 'both'].includes(user.role);
    const isCoach  = ['coach', 'both'].includes(user.role);
    (async () => {
      try {
        const [sv, wk, nu, co, cl] = await Promise.all([
          surveysAPI.getMyFitnessSurvey().catch(() => null),
          analyticsAPI.getWorkoutSummary({ days: 30 }).catch(() => null),
          analyticsAPI.getNutritionSummary({ days: 7 }).catch(() => null),
          isClient ? coachesAPI.getMyCoach().catch(() => null) : Promise.resolve(null),
          isCoach  ? coachesAPI.getMyClients().catch(() => null) : Promise.resolve(null),
        ]);
        if (sv?.data?.success)  setSurvey(sv.data.data);
        if (wk?.data?.success)  setWorkoutSummary(wk.data.data);
        if (nu?.data?.success)  setNutritionSummary(nu.data.data);
        if (co?.data?.success)  setCoachData(co.data.data);
        if (cl?.data?.success)  setClients(cl.data.data.clients || []);
      } catch {} finally { setLoading(false); }
    })();
  }, [user, navigate]);

  if (loading) return <div className="loading">Loading dashboard…</div>;

  const roleDisplay = user.role === 'both' ? 'Client & Coach' : user.role?.charAt(0).toUpperCase() + user.role?.slice(1);
  const firstName = user.profile?.first_name || user.email?.split('@')[0] || 'there';

  const quickActions = [];
  if (hasRole(['client','both'])) quickActions.push(
    { label: 'Browse Coaches', helper: 'Find support', to: '/coaches' },
    { label: 'My Workouts',    helper: 'Track training', to: '/my-workouts' },
    { label: 'Nutrition',      helper: 'Log meals', to: '/nutrition' },
    { label: 'Analytics',      helper: 'View trends', to: '/analytics' },
    { label: 'Chat',           helper: 'Message coach', to: '/chat' },
  );
  if (hasRole(['coach','both'])) quickActions.push(
    { label: 'My Clients',     helper: 'Coach roster', to: '/my-clients' },
    { label: 'Coach Settings', helper: 'Rates & profile', to: '/coach-settings' },
  );
  if (user.role === 'admin') quickActions.push({ label: 'Admin Panel', helper: 'Platform controls', to: '/admin' });

  const wkFreq   = workoutSummary?.workout_frequency_per_week || 0;
  const wkRating = workoutSummary?.average_rating || 0;
  const avgCal   = nutritionSummary?.average_daily_calories || 0;

  const pulseCards = [
    { label: 'Weekly sessions', value: `${wkFreq}x / wk`, percent: Math.min((wkFreq/7)*100,100), tone: 'green' },
    { label: 'Session rating',  value: `${wkRating}/5`,   percent: Math.min((wkRating/5)*100,100),  tone: 'blue'  },
    { label: 'Avg calories',    value: `${avgCal} cal`,   percent: Math.min((avgCal/2500)*100,100), tone: 'warm'  },
  ];

  const stats = [
    { label: '30-day workouts', value: workoutSummary?.total_workouts || 0 },
    { label: 'Minutes trained',  value: workoutSummary?.total_duration_minutes || 0 },
    { label: 'Avg daily cal',   value: avgCal },
    { label: 'Active clients',  value: clients.length },
  ];

  return (
    <div className="container page-shell">

      {/* HERO */}
      <div className="page-hero fade-up">
        <div className="hero-copy">
          <p className="eyebrow">Dashboard</p>
          <h1>Hello, {firstName} 👋</h1>
          <p className="page-copy">
            Logged in as <strong style={{ color: 'var(--green)' }}>{roleDisplay}</strong>. 
            Review your progress, manage workouts, and stay on track.
          </p>
          <div className="hero-actions">
            {quickActions.slice(0, 4).map(a => (
              <button key={a.label} className="btn btn-primary" onClick={() => navigate(a.to)}>{a.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* PULSE CARDS */}
      <div className="dashboard-ribbon fade-up fade-up-1">
        {pulseCards.map(c => (
          <div key={c.label} className={`pulse-card pulse-card-${c.tone}`}>
            <div className="pulse-card-top"><span>{c.label}</span><strong>{c.value}</strong></div>
            <div className="pulse-track"><div className="pulse-fill" style={{ width: `${c.percent}%` }} /></div>
          </div>
        ))}
      </div>

      {/* STATS */}
      <div className="stats-grid fade-up fade-up-2">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <span className="stat-label">{s.label}</span>
            <span className="stat-value">{s.value}</span>
          </div>
        ))}
      </div>

      {/* SURVEY BANNER */}
      {!survey && (
        <div className="card fade-up" style={{ borderColor: 'rgba(227,179,65,0.3)', background: 'rgba(227,179,65,0.06)' }}>
          <div className="flex items-center justify-between flex-wrap gap-12">
            <div>
              <h3 style={{ color: 'var(--amber)', marginBottom: 4 }}>Complete your fitness survey</h3>
              <p className="muted-text">Help us personalise your experience with a quick questionnaire.</p>
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/fitness-survey')}>Start survey</button>
          </div>
        </div>
      )}

      {/* QUICK ACTIONS */}
      <div className="card fade-up fade-up-2">
        <div className="section-header">
          <div><h2>Quick Actions</h2><p className="muted-text">Jump into the most-used areas of the app.</p></div>
        </div>
        <div className="action-grid">
          {quickActions.map(a => (
            <button key={a.label} className="action-card" onClick={() => navigate(a.to)}>
              <span>{a.helper}</span><strong>{a.label}</strong>
            </button>
          ))}
        </div>
      </div>

      {/* CLIENT FEATURES */}
      {hasRole(['client','both']) && (
        <div className="card fade-up fade-up-3">
          <div className="section-header">
            <div><h2>Client Features</h2><p className="muted-text">Everything you need in one place.</p></div>
          </div>
          <div className="feature-grid">
            {[
              { lbl: 'Discover',  title: 'Find a Coach',      desc: 'Browse and connect with certified coaches', to: '/coaches' },
              { lbl: 'Coaching',  title: 'My Coach',          desc: coachData ? 'Manage your coaching relationship' : 'Send a hire request to get started', to: '/my-coach' },
              { lbl: 'Training',  title: 'My Workouts',       desc: 'Track workout plans and log activity', to: '/my-workouts' },
              { lbl: 'Nutrition', title: 'Nutrition & Wellness', desc: 'Log meals, body metrics, water, and mood', to: '/nutrition' },
              { lbl: 'Insights',  title: 'Analytics',         desc: 'Review trends by week, month, or year', to: '/analytics' },
              { lbl: 'Comms',     title: 'Messages',          desc: 'Real-time chat with your coach', to: '/chat' },
            ].map(f => (
              <div key={f.title} className="feature-panel">
                <span className="panel-label">{f.lbl}</span>
                <h3 style={{ marginBottom: 6, color: 'var(--text)' }}>{f.title}</h3>
                <p className="muted-text" style={{ marginBottom: 14 }}>{f.desc}</p>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(f.to)}>Open →</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COACH FEATURES */}
      {hasRole(['coach','both']) && (
        <div className="card fade-up fade-up-3">
          <div className="section-header">
            <div><h2>Coach Features</h2><p className="muted-text">Manage clients and your coaching profile.</p></div>
          </div>
          <div className="feature-grid">
            {[
              { lbl: 'Roster',      title: 'My Clients',     desc: 'View and manage your client relationships', to: '/my-clients' },
              { lbl: 'Programming', title: 'Create Workouts', desc: 'Design workout plans for your clients',    to: '/create-workout-plan' },
              { lbl: 'Profile',     title: 'Coach Settings',  desc: 'Update bio, rates, and specializations',   to: '/coach-settings' },
              { lbl: 'Comms',       title: 'Messages',        desc: 'Real-time chat with your clients',         to: '/chat' },
            ].map(f => (
              <div key={f.title} className="feature-panel coach">
                <span className="panel-label">{f.lbl}</span>
                <h3 style={{ marginBottom: 6, color: 'var(--text)' }}>{f.title}</h3>
                <p className="muted-text" style={{ marginBottom: 14 }}>{f.desc}</p>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(f.to)}>Open →</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADMIN */}
      {user.role === 'admin' && (
        <div className="card fade-up">
          <div className="section-header"><div><h2>Admin Features</h2></div></div>
          <div className="feature-grid">
            <div className="feature-panel admin">
              <span className="panel-label">Platform</span>
              <h3 style={{ marginBottom: 6 }}>Admin Dashboard</h3>
              <p className="muted-text" style={{ marginBottom: 14 }}>Manage users, coaches, and platform settings.</p>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin')}>Open →</button>
            </div>
          </div>
        </div>
      )}

      {/* SURVEY DETAILS */}
      {survey && (
        <div className="card fade-up">
          <div className="section-header"><div><h2>Your Fitness Profile</h2></div></div>
          <div className="stats-grid">
            {[
              { label: 'Fitness Level', value: survey.fitness_level || '—' },
              { label: 'Primary Goal',  value: survey.goals || '—' },
              { label: 'Age',           value: survey.age || '—' },
              { label: 'Weight',        value: survey.weight ? `${survey.weight} kg` : '—' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <span className="stat-label">{s.label}</span>
                <span className="stat-value" style={{ fontSize: 18 }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
