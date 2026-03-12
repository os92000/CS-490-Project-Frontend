import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { workoutsAPI } from '../services/api';

const MyWorkouts = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [logFormVisible, setLogFormVisible] = useState(false);
  const [logForm, setLogForm] = useState({
    plan_id: '',
    workout_day_id: '',
    date: new Date().toISOString().split('T')[0],
    duration_minutes: '',
    notes: '',
    rating: 3
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load workout plans
      const plansRes = await workoutsAPI.getWorkoutPlans({ role: 'client' });
      if (plansRes.data.success) {
        setPlans(plansRes.data.data.plans);
      }

      // Load workout logs (last 30 days)
      const logsRes = await workoutsAPI.getWorkoutLogs();
      if (logsRes.data.success) {
        setLogs(logsRes.data.data.logs);
      }

      // Load stats
      const statsRes = await workoutsAPI.getWorkoutStats({ period: 30 });
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

    } catch (error) {
      console.error('Error loading workout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewPlanDetails = async (planId) => {
    try {
      const response = await workoutsAPI.getWorkoutPlan(planId);
      if (response.data.success) {
        setSelectedPlan(response.data.data);
      }
    } catch (error) {
      console.error('Error loading plan details:', error);
    }
  };

  const handleLogWorkout = async (e) => {
    e.preventDefault();
    try {
      const response = await workoutsAPI.createWorkoutLog(logForm);
      if (response.data.success) {
        alert('Workout logged successfully!');
        setLogFormVisible(false);
        setLogForm({
          plan_id: '',
          workout_day_id: '',
          date: new Date().toISOString().split('T')[0],
          duration_minutes: '',
          notes: '',
          rating: 3
        });
        loadData();
      }
    } catch (error) {
      console.error('Error logging workout:', error);
      alert('Failed to log workout');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '50px' }}>
        <p>Loading workouts...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1200px', marginTop: '30px' }}>
      <h1>My Workouts</h1>

      {/* Stats Overview */}
      {stats && (
        <div className="card" style={{ backgroundColor: '#e8f5e9', marginBottom: '20px' }}>
          <h3>Last 30 Days</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', marginTop: '15px' }}>
            <div>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>Total Workouts</p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#2e7d32', margin: 0 }}>{stats.total_workouts}</p>
            </div>
            <div>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>Total Time</p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#2e7d32', margin: 0 }}>{stats.total_duration_minutes} min</p>
            </div>
            <div>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>Avg Rating</p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#2e7d32', margin: 0 }}>{stats.average_rating}/5</p>
            </div>
            <div>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>Frequency</p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#2e7d32', margin: 0 }}>{stats.workout_frequency_per_week}x/week</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ marginBottom: '20px' }}>
        <button
          className="btn btn-primary"
          onClick={() => setLogFormVisible(!logFormVisible)}
          style={{ marginRight: '10px' }}
        >
          {logFormVisible ? 'Cancel' : 'Log Workout'}
        </button>
      </div>

      {/* Log Workout Form */}
      {logFormVisible && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>Log Workout</h3>
          <form onSubmit={handleLogWorkout}>
            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                className="input"
                value={logForm.date}
                onChange={(e) => setLogForm({...logForm, date: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Duration (minutes)</label>
              <input
                type="number"
                className="input"
                value={logForm.duration_minutes}
                onChange={(e) => setLogForm({...logForm, duration_minutes: e.target.value})}
                placeholder="e.g., 45"
              />
            </div>

            <div className="form-group">
              <label>Rating (1-5)</label>
              <select
                className="input"
                value={logForm.rating}
                onChange={(e) => setLogForm({...logForm, rating: parseInt(e.target.value)})}
              >
                <option value="1">1 - Very Hard</option>
                <option value="2">2 - Hard</option>
                <option value="3">3 - Moderate</option>
                <option value="4">4 - Easy</option>
                <option value="5">5 - Very Easy</option>
              </select>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                className="input"
                value={logForm.notes}
                onChange={(e) => setLogForm({...logForm, notes: e.target.value})}
                rows="3"
                placeholder="How did you feel? Any achievements?"
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Save Workout Log
            </button>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div style={{ borderBottom: '2px solid #eee', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('plans')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'plans' ? '3px solid #4CAF50' : 'none',
            fontWeight: activeTab === 'plans' ? 'bold' : 'normal',
            color: activeTab === 'plans' ? '#4CAF50' : '#666'
          }}
        >
          Workout Plans
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'history' ? '3px solid #4CAF50' : 'none',
            fontWeight: activeTab === 'history' ? 'bold' : 'normal',
            color: activeTab === 'history' ? '#4CAF50' : '#666',
            marginLeft: '10px'
          }}
        >
          Workout History
        </button>
      </div>

      {/* Workout Plans Tab */}
      {activeTab === 'plans' && (
        <div>
          {plans.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#666', fontSize: '18px' }}>
                No workout plans yet. Your coach will create one for you!
              </p>
            </div>
          ) : selectedPlan ? (
            <div className="card">
              <button
                onClick={() => setSelectedPlan(null)}
                className="btn btn-secondary"
                style={{ marginBottom: '15px' }}
              >
                ← Back to Plans
              </button>
              <h2>{selectedPlan.name}</h2>
              <p style={{ color: '#666' }}>{selectedPlan.description}</p>
              <p style={{ fontSize: '14px', color: '#888' }}>
                {selectedPlan.start_date && `Start: ${selectedPlan.start_date}`}
                {selectedPlan.end_date && ` | End: ${selectedPlan.end_date}`}
              </p>

              {selectedPlan.days && selectedPlan.days.map((day) => (
                <div key={day.id} style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                  <h4>{day.name}</h4>
                  {day.notes && <p style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>{day.notes}</p>}

                  {day.exercises && day.exercises.length > 0 && (
                    <table style={{ width: '100%', marginTop: '10px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#e0e0e0' }}>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Exercise</th>
                          <th style={{ padding: '8px', textAlign: 'center' }}>Sets</th>
                          <th style={{ padding: '8px', textAlign: 'center' }}>Reps</th>
                          <th style={{ padding: '8px', textAlign: 'center' }}>Weight</th>
                          <th style={{ padding: '8px', textAlign: 'center' }}>Rest</th>
                        </tr>
                      </thead>
                      <tbody>
                        {day.exercises.map((ex) => (
                          <tr key={ex.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '8px' }}>
                              <strong>{ex.exercise?.name || 'Exercise'}</strong>
                              {ex.notes && <p style={{ fontSize: '12px', color: '#888', margin: '5px 0 0 0' }}>{ex.notes}</p>}
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>{ex.sets || '-'}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>{ex.reps || '-'}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>{ex.weight || '-'}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>{ex.rest_seconds ? `${ex.rest_seconds}s` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {plans.map((plan) => (
                <div key={plan.id} className="card" style={{ cursor: 'pointer' }} onClick={() => viewPlanDetails(plan.id)}>
                  <h3 style={{ color: '#4CAF50', marginBottom: '10px' }}>{plan.name}</h3>
                  <p style={{ color: '#666', fontSize: '14px' }}>{plan.description}</p>
                  <div style={{ display: 'flex', gap: '15px', marginTop: '10px', fontSize: '13px', color: '#888' }}>
                    <span>Status: <strong style={{ color: plan.status === 'active' ? '#4CAF50' : '#666' }}>{plan.status}</strong></span>
                    {plan.start_date && <span>Start: {plan.start_date}</span>}
                    {plan.end_date && <span>End: {plan.end_date}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Workout History Tab */}
      {activeTab === 'history' && (
        <div>
          {logs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#666', fontSize: '18px' }}>
                No workout logs yet. Start logging your workouts!
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {logs.map((log) => (
                <div key={log.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h4 style={{ color: '#4CAF50', marginBottom: '5px' }}>
                        {log.workout_day?.name || 'Workout'}
                      </h4>
                      <p style={{ color: '#888', fontSize: '14px', margin: '0 0 10px 0' }}>
                        {new Date(log.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {log.duration_minutes && (
                        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32', margin: 0 }}>
                          {log.duration_minutes} min
                        </p>
                      )}
                      {log.rating && (
                        <p style={{ fontSize: '14px', color: '#888', margin: '5px 0 0 0' }}>
                          Rating: {log.rating}/5
                        </p>
                      )}
                    </div>
                  </div>
                  {log.notes && (
                    <p style={{ color: '#666', fontSize: '14px', marginTop: '10px', fontStyle: 'italic' }}>
                      "{log.notes}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyWorkouts;
