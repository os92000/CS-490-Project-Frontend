import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI, coachesAPI, nutritionAPI, surveysAPI, workoutsAPI } from '../services/api';
import Avatar from '../components/Avatar';
import FitChart, { barDataset, lineDataset } from '../components/FitChart';
import { buildBucketSeries } from '../utils/chartSeries';

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const [survey, setSurvey] = useState(null);
  const [workoutSummary, setWorkoutSummary] = useState(null);
  const [nutritionSummary, setNutritionSummary] = useState(null);
  const [dailyCaloriesSeries, setDailyCaloriesSeries] = useState({ labels: [], values: [] });
  const [workoutFrequencySeries, setWorkoutFrequencySeries] = useState({ labels: [], values: [] });
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
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 6);
        const formatDate = (d) => d.toISOString().split('T')[0];

        const [sv, wk, nu, me, wl, co, cl] = await Promise.all([
          surveysAPI.getMyFitnessSurvey().catch(() => null),
          analyticsAPI.getWorkoutSummary({ days: 30 }).catch(() => null),
          analyticsAPI.getNutritionSummary({ days: 30 }).catch(() => null),
          nutritionAPI.getMeals({ start_date: formatDate(startDate), end_date: formatDate(endDate) }).catch(() => null),
          workoutsAPI.getWorkoutLogs({ start_date: formatDate(new Date(Date.now() - (55 * 24 * 60 * 60 * 1000))), end_date: formatDate(endDate) }).catch(() => null),
          isClient ? coachesAPI.getMyCoach().catch(() => null) : Promise.resolve(null),
          isCoach  ? coachesAPI.getMyClients().catch(() => null) : Promise.resolve(null),
        ]);
        if (sv?.data?.success)  setSurvey(sv.data.data);
        if (wk?.data?.success)  setWorkoutSummary(wk.data.data);
        if (nu?.data?.success)  setNutritionSummary(nu.data.data);
        if (co?.data?.success)  setCoachData(co.data.data);
        if (cl?.data?.success)  setClients(cl.data.data.clients || []);

        const meals = me?.data?.success ? (me.data.data.meals || []) : [];
        const dayMap = new Map();
        for (let offset = 6; offset >= 0; offset -= 1) {
          const date = new Date();
          date.setDate(date.getDate() - offset);
          const key = date.toISOString().split('T')[0];
          dayMap.set(key, 0);
        }
        meals.forEach((meal) => {
          const key = meal.date;
          if (!dayMap.has(key)) return;
          dayMap.set(key, dayMap.get(key) + (Number(meal.calories) || 0));
        });
        setDailyCaloriesSeries({
          labels: Array.from(dayMap.keys()).map((key) => {
            const date = new Date(`${key}T00:00:00`);
            return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
          }),
          values: Array.from(dayMap.values()),
        });

        const workoutLogs = wl?.data?.success ? (wl.data.data.logs || []) : [];
        const workoutSeries = buildBucketSeries(workoutLogs, {
          periods: 8,
          daysPerPeriod: 7,
          dateAccessor: (log) => log.date,
          valueAccessor: (log) => (log.completed === false ? 0 : 1),
          aggregate: 'sum',
          labelFormatter: (date) => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        });
        setWorkoutFrequencySeries(workoutSeries);
      } catch {} finally { setLoading(false); }
    })();
  }, [user, navigate]);

  if (loading) return <div className="loading">Loading dashboard…</div>;

  const roleDisplay = user.role === 'both' ? 'Client & Coach'
    : user.role?.charAt(0).toUpperCase() + user.role?.slice(1);
  const firstName = user.profile?.first_name || user.email?.split('@')[0] || 'there';
  const displayName = user.profile?.first_name && user.profile?.last_name
    ? `${user.profile.first_name} ${user.profile.last_name}`
    : user.profile?.first_name || user.email || '';

  const wkFreq    = workoutSummary?.workout_frequency_per_week || 0;
  const wkRating  = workoutSummary?.average_rating || 0;
  const avgCal    = nutritionSummary?.average_daily_calories || 0;
  const wkTotal   = workoutSummary?.total_workouts || 0;
  const wkMin     = workoutSummary?.total_duration_minutes || 0;

  return (
    <div className="container page-shell">

      {/* HERO */}
      <div className="page-hero fade-up">
        <div className="flex gap-20 items-center" style={{ flexWrap: 'wrap' }}>
          <Avatar
            src={user.profile?.profile_picture}
            name={displayName}
            size={64}
            style={{ border: '3px solid rgba(63,185,80,0.25)', flexShrink: 0 }}
          />
          <div className="hero-copy">
            <p className="eyebrow">Dashboard</p>
            <h1>Hello, {firstName} 👋</h1>
            <p className="page-copy">
              Logged in as <strong style={{ color: 'var(--green)' }}>{roleDisplay}</strong>.
              Here's your snapshot for the last 30 days.
            </p>
          </div>
        </div>
      </div>

      {/* PULSE CARDS */}
      <div className="dashboard-ribbon fade-up fade-up-1">
        <div className="pulse-card pulse-card-green">
          <div className="pulse-card-top"><span>Weekly sessions</span><strong>{wkFreq}x / wk</strong></div>
          <div className="pulse-track"><div className="pulse-fill" style={{ width: `${Math.min((wkFreq/7)*100,100)}%` }} /></div>
        </div>
        <div className="pulse-card pulse-card-blue">
          <div className="pulse-card-top"><span>Session rating</span><strong>{wkRating.toFixed(1)}/5</strong></div>
          <div className="pulse-track"><div className="pulse-fill" style={{ width: `${Math.min((wkRating/5)*100,100)}%` }} /></div>
        </div>
        <div className="pulse-card pulse-card-warm">
          <div className="pulse-card-top"><span>Avg calories</span><strong>{avgCal} cal</strong></div>
          <div className="pulse-track"><div className="pulse-fill" style={{ width: `${Math.min((avgCal/2500)*100,100)}%` }} /></div>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="stats-grid fade-up fade-up-2">
        {[
          { label: '30-day workouts',  value: wkTotal,            sub: 'sessions logged'   },
          { label: 'Minutes trained',  value: wkMin,              sub: 'total this period'  },
          { label: 'Avg daily cal',    value: avgCal,             sub: 'nutrition'           },
          { label: 'Active clients',   value: clients.length,     sub: 'on your roster'      },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <span className="stat-label">{s.label}</span>
            <span className="stat-value">{s.value}</span>
            <span className="stat-sub">{s.sub}</span>
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

      {/* CHARTS ROW */}
      <div className="two-col fade-up fade-up-2">
        <div className="card">
          <div className="section-header">
            <div><h2>Workout frequency</h2><p className="muted-text">Sessions over last 8 weeks</p></div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/analytics')}>Full analytics →</button>
          </div>
          <FitChart
            type="bar"
            labels={workoutFrequencySeries.labels}
            datasets={[barDataset('Sessions', workoutFrequencySeries.values, '#3fb950')]}
            height={180}
          />
        </div>
        <div className="card">
          <div className="section-header">
            <div><h2>Daily calories</h2><p className="muted-text">Last 7 days</p></div>
          </div>
          {dailyCaloriesSeries.values.some(v => v > 0) ? (
            <FitChart
              type="line"
              labels={dailyCaloriesSeries.labels}
              datasets={[lineDataset('Calories', dailyCaloriesSeries.values, '#e3b341', true)]}
              height={180}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>🍽️</p>
              <p className="muted-text">Log meals to see your daily calorie trend here.</p>
            </div>
          )}
        </div>
      </div>

      {/* CLIENT FEATURES */}
      {hasRole(['client','both']) && (
        <div className="card fade-up fade-up-3">
          <div className="section-header">
            <div><h2>Client features</h2><p className="muted-text">Everything you need in one place.</p></div>
          </div>
          <div className="feature-grid">
            {[
              { lbl:'Discover',  title:'Find a Coach',     desc:'Browse and connect with certified coaches',               to:'/coaches'      },
              { lbl:'Coaching',  title:'My Coach',         desc: coachData ? 'Manage your active coaching relationship' : 'Send a hire request to get started', to:'/my-coach' },
              { lbl:'Training',  title:'My Workouts',      desc:'Track workout plans and log sessions',                    to:'/my-workouts'  },
              { lbl:'Nutrition', title:'Nutrition',        desc:'Log meals, body metrics, water, and mood',                to:'/nutrition'    },
              { lbl:'Insights',  title:'Analytics',        desc:'Review trends by week, month, or year',                   to:'/analytics'    },
              { lbl:'Comms',     title:'Messages',         desc:'Real-time chat with your coach',                          to:'/chat'         },
            ].map(f => (
              <div key={f.title} className="feature-panel">
                <span className="panel-label">{f.lbl}</span>
                <h3 style={{ marginBottom: 6, color: 'var(--text)' }}>{f.title}</h3>
                <p className="muted-text" style={{ marginBottom: 14, fontSize: 13 }}>{f.desc}</p>
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
            <div><h2>Coach features</h2><p className="muted-text">Manage clients and your coaching profile.</p></div>
          </div>
          <div className="feature-grid">
            {[
              { lbl:'Roster',      title:'My Clients',      desc:'View and manage your client relationships',   to:'/my-clients'     },
              { lbl:'Programming', title:'My Plans',         desc:'View and manage workout plans for your clients', to:'/my-workouts' },
              { lbl:'Profile',     title:'Coach Settings',   desc:'Update bio, rates, and specializations',      to:'/coach-settings' },
              { lbl:'Comms',       title:'Messages',         desc:'Real-time chat with your clients',            to:'/chat'           },
            ].map(f => (
              <div key={f.title} className="feature-panel coach">
                <span className="panel-label">{f.lbl}</span>
                <h3 style={{ marginBottom: 6, color: 'var(--text)' }}>{f.title}</h3>
                <p className="muted-text" style={{ marginBottom: 14, fontSize: 13 }}>{f.desc}</p>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(f.to)}>Open →</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADMIN */}
      {user.role === 'admin' && (
        <div className="card fade-up">
          <div className="section-header"><div><h2>Admin</h2></div></div>
          <div className="feature-grid">
            <div className="feature-panel admin">
              <span className="panel-label">Platform</span>
              <h3 style={{ marginBottom: 6 }}>Admin Dashboard</h3>
              <p className="muted-text" style={{ marginBottom: 14, fontSize: 13 }}>Manage users, coaches, and platform settings.</p>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin')}>Open →</button>
            </div>
          </div>
        </div>
      )}

      {/* FITNESS PROFILE SUMMARY */}
      {survey && (
        <div className="card fade-up">
          <div className="section-header"><div><h2>Your fitness profile</h2></div></div>
          <div className="stats-grid">
            {[
              { label:'Fitness level', value: survey.fitness_level || '—' },
              { label:'Primary goal',  value: survey.goals          || '—' },
              { label:'Age',           value: survey.age            || '—' },
              { label:'Weight',        value: survey.weight ? `${survey.weight} kg` : '—' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <span className="stat-label">{s.label}</span>
                <span className="stat-value" style={{ fontSize: 16, lineHeight: 1.3 }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
