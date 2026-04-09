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
    const isClientRole = ['client', 'both'].includes(user.role);
    const isCoachRole = ['coach', 'both'].includes(user.role);

    // Redirect to role selection if no role selected
    if (!user.role || user.role === 'none') {
      navigate('/role-selection');
      return;
    }

    // Fetch user's fitness survey if available
    const fetchDashboardData = async () => {
      try {
        const requests = [
          surveysAPI.getMyFitnessSurvey().catch(() => null),
          analyticsAPI.getWorkoutSummary({ days: 30 }).catch(() => null),
          analyticsAPI.getNutritionSummary({ days: 7 }).catch(() => null),
        ];

        if (isClientRole) {
          requests.push(coachesAPI.getMyCoach().catch(() => null));
        } else {
          requests.push(Promise.resolve(null));
        }

        if (isCoachRole) {
          requests.push(coachesAPI.getMyClients().catch(() => null));
        } else {
          requests.push(Promise.resolve(null));
        }

        const [surveyResponse, workoutResponse, nutritionResponse, coachResponse, clientsResponse] = await Promise.all(requests);

        if (surveyResponse?.data?.success) {
          setSurvey(surveyResponse.data.data);
        }
        if (workoutResponse?.data?.success) {
          setWorkoutSummary(workoutResponse.data.data);
        }
        if (nutritionResponse?.data?.success) {
          setNutritionSummary(nutritionResponse.data.data);
        }
        if (coachResponse?.data?.success) {
          setCoachData(coachResponse.data.data);
        }
        if (clientsResponse?.data?.success) {
          setClients(clientsResponse.data.data.clients);
        }
      } catch (error) {
        console.log('Dashboard data unavailable');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, navigate]);

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  const getRoleDisplay = () => {
    if (user.role === 'both') return 'Client & Coach';
    return user.role.charAt(0).toUpperCase() + user.role.slice(1);
  };

  const handleCompleteSurvey = () => {
    navigate('/fitness-survey');
  };

  const quickActions = [];
  if (hasRole(['client', 'both'])) {
    quickActions.push(
      { label: 'Browse Coaches', helper: 'Find support', to: '/coaches' },
      { label: 'Open Workouts', helper: 'Track training', to: '/my-workouts' },
      { label: 'Nutrition', helper: 'Log meals', to: '/nutrition' },
      { label: 'Analytics', helper: 'View trends', to: '/analytics' }
    );
  }
  if (hasRole(['coach', 'both'])) {
    quickActions.push(
      { label: 'My Clients', helper: 'Coach workflow', to: '/my-clients' },
      { label: 'Coach Settings', helper: 'Rates and profile', to: '/coach-settings' }
    );
  }
  if (user.role === 'admin') {
    quickActions.push({ label: 'Admin Panel', helper: 'Platform controls', to: '/admin' });
  }

  const snapshotItems = [
    {
      label: 'Training pulse',
      value: `${workoutSummary?.workout_frequency_per_week || 0}x / week`,
      helper: workoutSummary?.total_workouts ? `${workoutSummary.total_workouts} workouts in the selected window` : 'No workout trend yet',
    },
    {
      label: 'Fuel rhythm',
      value: `${nutritionSummary?.average_daily_calories || 0} avg cal`,
      helper: nutritionSummary?.meal_logs_count ? `${nutritionSummary.meal_logs_count} meal entries recorded` : 'Start logging meals to build insight',
    },
    {
      label: 'Coach status',
      value: hasRole(['client', 'both']) ? (coachData?.relationship ? 'Connected' : 'Open') : `${clients.length} clients`,
      helper: hasRole(['client', 'both'])
        ? (coachData?.relationship ? 'You have an active coaching relationship' : 'You can browse and request a coach')
        : (clients.length ? 'Your coaching roster is active' : 'No clients assigned yet'),
    },
  ];

  const workoutFrequencyPercent = Math.min(((workoutSummary?.workout_frequency_per_week || 0) / 7) * 100, 100);
  const workoutRatingPercent = Math.min(((workoutSummary?.average_rating || 0) / 5) * 100, 100);
  const nutritionPercent = Math.min(((nutritionSummary?.average_daily_calories || 0) / 2500) * 100, 100);

  const pulseCards = [
    {
      label: 'Weekly consistency',
      value: `${workoutSummary?.workout_frequency_per_week || 0} days`,
      percent: workoutFrequencyPercent,
      tone: 'green',
    },
    {
      label: 'Session quality',
      value: `${workoutSummary?.average_rating || 0}/5`,
      percent: workoutRatingPercent,
      tone: 'blue',
    },
    {
      label: 'Fuel coverage',
      value: `${nutritionSummary?.average_daily_calories || 0} cal`,
      percent: nutritionPercent,
      tone: 'warm',
    },
  ];

  return (
    <div className="container page-shell">
      <div className="page-hero dashboard-hero">
        <div className="hero-copy">
          <p className="eyebrow">Dashboard</p>
          <h1>Hello, {user.profile?.first_name || user.email}</h1>
          <p className="page-copy">Role: {getRoleDisplay()}. Review progress, open daily tools, and jump into your active workflows.</p>
          <div className="hero-actions">
            {quickActions.slice(0, 4).map((action) => (
              <button key={action.label} className="btn btn-primary" onClick={() => navigate(action.to)}>
                {action.label}
              </button>
            ))}
          </div>
          <div className="hero-mini-grid">
            <div className="hero-mini-card">
              <span>Current role</span>
              <strong>{getRoleDisplay()}</strong>
            </div>
            <div className="hero-mini-card">
              <span>Momentum</span>
              <strong>{workoutSummary?.total_workouts || 0} sessions</strong>
            </div>
            <div className="hero-mini-card">
              <span>Next focus</span>
              <strong>{survey?.goals ? 'Goal aligned' : 'Complete survey'}</strong>
            </div>
          </div>
        </div>
        <div className="hero-spotlight">
          <span className="hero-chip">Live snapshot</span>
          <strong>{workoutSummary?.total_workouts || 0} workouts logged</strong>
          <p>{nutritionSummary?.average_daily_calories || 0} avg daily calories · {clients.length} active client connections</p>
          <div className="hero-spotlight-grid">
            <div>
              <span>Workout rating</span>
              <strong>{workoutSummary?.average_rating || 0}/5</strong>
            </div>
            <div>
              <span>Minutes trained</span>
              <strong>{workoutSummary?.total_duration_minutes || 0}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-ribbon">
        {pulseCards.map((item) => (
          <div key={item.label} className={`pulse-card pulse-card-${item.tone}`}>
            <div className="pulse-card-top">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
            <div className="pulse-track">
              <div className="pulse-fill" style={{ width: `${item.percent}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>30-day workouts</span>
          <strong>{workoutSummary?.total_workouts || 0}</strong>
        </div>
        <div className="stat-card">
          <span>Minutes trained</span>
          <strong>{workoutSummary?.total_duration_minutes || 0}</strong>
        </div>
        <div className="stat-card">
          <span>Avg calories</span>
          <strong>{nutritionSummary?.average_daily_calories || 0}</strong>
        </div>
        <div className="stat-card">
          <span>Active clients</span>
          <strong>{clients.length}</strong>
        </div>
      </div>

      <div className="card">
        <div className="section-header">
          <div>
            <h2>Momentum Snapshot</h2>
            <p className="muted-text">A quick view of the most important signals across training, nutrition, and coaching.</p>
          </div>
        </div>
        <div className="feature-grid dashboard-highlight-grid">
          {snapshotItems.map((item) => (
            <div key={item.label} className="feature-panel spotlight-panel">
              <span className="panel-label">{item.label}</span>
              <strong className="panel-value">{item.value}</strong>
              <p className="muted-text">{item.helper}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="section-header">
          <div>
            <h2>Quick Actions</h2>
            <p className="muted-text">Jump directly into the highest-traffic areas of the product.</p>
          </div>
        </div>
        <div className="action-grid">
          {quickActions.map((action) => (
            <button key={action.label} className="action-card" onClick={() => navigate(action.to)}>
              <span>{action.helper}</span>
              <strong>{action.label}</strong>
            </button>
          ))}
        </div>
      </div>

      {/* Survey Status */}
      {!survey && (
        <div className="card" style={{ backgroundColor: '#fff9e6', borderLeft: '4px solid #ffc107' }}>
          <h3>Complete Your Fitness Survey</h3>
          <p style={{ color: '#666', marginBottom: '15px' }}>
            Help us personalize your experience by completing the fitness survey.
          </p>
          <button onClick={handleCompleteSurvey} className="btn btn-primary">
            Complete Survey
          </button>
        </div>
      )}

      {/* Client Dashboard */}
      {hasRole(['client', 'both']) && (
        <div className="card">
          <div className="section-header">
            <div>
              <h2>Client Features</h2>
              <p className="muted-text">Everything needed to keep plans, nutrition, and communication moving in one place.</p>
            </div>
          </div>
          <div className="feature-grid">
            <div className="feature-panel">
              <span className="panel-label">Discover</span>
              <h3 style={{ color: '#4CAF50' }}>Find a Coach</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Browse and connect with experienced fitness coaches
              </p>
              <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={() => navigate('/coaches')}>
                Browse Coaches
              </button>
            </div>

            <div className="feature-panel">
              <span className="panel-label">Relationship</span>
              <h3 style={{ color: '#4CAF50' }}>My Coach</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                {coachData ? 'View your current coach and manage your relationship' : 'Send a hire request to start coaching'}
              </p>
              <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={() => navigate('/my-coach')}>
                View My Coach
              </button>
            </div>

            <div className="feature-panel">
              <span className="panel-label">Training</span>
              <h3 style={{ color: '#4CAF50' }}>My Workouts</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Track your workout plans and progress
              </p>
              <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={() => navigate('/my-workouts')}>
                View Workouts
              </button>
            </div>

            <div className="feature-panel">
              <span className="panel-label">Recovery</span>
              <h3 style={{ color: '#4CAF50' }}>Nutrition & Wellness</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Log meals, body metrics, water intake, and daily mood
              </p>
              <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={() => navigate('/nutrition')}>
                Open Nutrition
              </button>
            </div>

            <div className="feature-panel">
              <span className="panel-label">Review</span>
              <h3 style={{ color: '#4CAF50' }}>Analytics</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Review trends by week, month, or year
              </p>
              <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={() => navigate('/analytics')}>
                View Analytics
              </button>
            </div>

            <div className="feature-panel">
              <span className="panel-label">Connect</span>
              <h3 style={{ color: '#4CAF50' }}>Messages</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Chat with your coach in real-time
              </p>
              <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={() => navigate('/chat')}>
                View Messages
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coach Dashboard */}
      {hasRole(['coach', 'both']) && (
        <div className="card">
          <div className="section-header">
            <div>
              <h2>Coach Features</h2>
              <p className="muted-text">Manage client activity, programming, and your coaching profile from one dashboard block.</p>
            </div>
          </div>
          <div className="feature-grid">
            <div className="feature-panel coach">
              <span className="panel-label">Roster</span>
              <h3 style={{ color: '#2e7d32' }}>My Clients</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Manage your client relationships
              </p>
              <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={() => navigate('/my-clients')}>
                View Clients
              </button>
            </div>

            <div className="feature-panel coach">
              <span className="panel-label">Programming</span>
              <h3 style={{ color: '#2e7d32' }}>Create Workouts</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Design workout plans for your clients
              </p>
              <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={() => navigate('/create-workout-plan')}>
                Create Plan
              </button>
            </div>

            <div className="feature-panel coach">
              <span className="panel-label">Profile</span>
              <h3 style={{ color: '#2e7d32' }}>Coach Settings</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Update bio, rates, specializations, and availability
              </p>
              <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={() => navigate('/coach-settings')}>
                Open Settings
              </button>
            </div>

            <div className="feature-panel coach">
              <span className="panel-label">Messaging</span>
              <h3 style={{ color: '#2e7d32' }}>Messages</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Chat with your clients in real-time
              </p>
              <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={() => navigate('/chat')}>
                View Messages
              </button>
            </div>
          </div>
        </div>
      )}

      {user.role === 'admin' && (
        <div className="card">
          <h2>Admin Features</h2>
          <div className="feature-grid">
            <div className="feature-panel admin">
              <h3>Platform Dashboard</h3>
              <p className="muted-text">Review users, disable accounts, and monitor top-level platform activity.</p>
              <button className="btn btn-primary" onClick={() => navigate('/admin')}>Open Admin</button>
            </div>
          </div>
        </div>
      )}

      {/* Survey Details */}
      {survey && (
        <div className="card">
          <h2>Your Fitness Profile</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '20px' }}>
            <div>
              <strong>Fitness Level:</strong>
              <p style={{ color: '#666' }}>{survey.fitness_level || 'Not specified'}</p>
            </div>
            <div>
              <strong>Goals:</strong>
              <p style={{ color: '#666' }}>{survey.goals || 'Not specified'}</p>
            </div>
            <div>
              <strong>Age:</strong>
              <p style={{ color: '#666' }}>{survey.age || 'Not specified'}</p>
            </div>
            <div>
              <strong>Weight:</strong>
              <p style={{ color: '#666' }}>{survey.weight ? `${survey.weight} kg` : 'Not specified'}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
