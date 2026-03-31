import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { surveysAPI } from '../services/api';

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to role selection if no role selected
    if (!user.role || user.role === 'none') {
      navigate('/role-selection');
      return;
    }

    // Fetch user's fitness survey if available
    const fetchSurvey = async () => {
      try {
        const response = await surveysAPI.getMyFitnessSurvey();
        if (response.data.success && response.data.data) {
          setSurvey(response.data.data);
        }
      } catch (error) {
        // Survey not found is okay
        console.log('No survey found');
      } finally {
        setLoading(false);
      }
    };

    fetchSurvey();
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

  return (
    <div className="container" style={{ marginTop: '30px' }}>
      <div className="card">
        <h1>Welcome to Your Dashboard</h1>
        <p style={{ color: '#666', fontSize: '18px', marginTop: '10px' }}>
          Hello, <strong>{user.email}</strong>
        </p>
        <p style={{ color: '#4CAF50', fontSize: '16px', fontWeight: '600' }}>
          Role: {getRoleDisplay()}
        </p>
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
          <h2>Client Features</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginTop: '20px' }}>
            <div style={{ padding: '20px', backgroundColor: '#f0f9f0', borderRadius: '8px' }}>
              <h3 style={{ color: '#4CAF50' }}>Find a Coach</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Browse and connect with experienced fitness coaches
              </p>
              <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={() => navigate('/coaches')}>
                Browse Coaches
              </button>
            </div>

            <div style={{ padding: '20px', backgroundColor: '#f0f9f0', borderRadius: '8px' }}>
              <h3 style={{ color: '#4CAF50' }}>My Coach</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                View your current coach and manage your relationship
              </p>
              <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={() => navigate('/my-coach')}>
                View My Coach
              </button>
            </div>

            <div style={{ padding: '20px', backgroundColor: '#f0f9f0', borderRadius: '8px' }}>
              <h3 style={{ color: '#4CAF50' }}>My Workouts</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Track your workout plans and progress
              </p>
              <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={() => navigate('/my-workouts')}>
                View Workouts
              </button>
            </div>

            <div style={{ padding: '20px', backgroundColor: '#f0f9f0', borderRadius: '8px' }}>
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
          <h2>Coach Features</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginTop: '20px' }}>
            <div style={{ padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
              <h3 style={{ color: '#2e7d32' }}>My Clients</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Manage your client relationships
              </p>
              <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={() => navigate('/my-clients')}>
                View Clients
              </button>
            </div>

            <div style={{ padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
              <h3 style={{ color: '#2e7d32' }}>Coach profile</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Update your qualifications, bio, and contact details
              </p>
              <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={() => navigate('/coach/profile')}>
                Edit profile
              </button>
            </div>

            <div style={{ padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
              <h3 style={{ color: '#2e7d32' }}>Availability</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Set the days and times you&apos;re available for clients
              </p>
              <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={() => navigate('/coach/availability')}>
                Edit availability
              </button>
            </div>

            <div style={{ padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
              <h3 style={{ color: '#2e7d32' }}>Pricing</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Set your session rates and packages
              </p>
              <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={() => navigate('/coach/pricing')}>
                Edit pricing
              </button>
            </div>

            <div style={{ padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
              <h3 style={{ color: '#2e7d32' }}>Create Workouts</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Design workout plans for your clients
              </p>
              <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={() => navigate('/create-workout-plan')}>
                Create Plan
              </button>
            </div>

            <div style={{ padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
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
              <strong>Primary Goal:</strong>
              <p style={{ color: '#666' }}>{survey.primary_goal || 'Not specified'}</p>
            </div>
            <div>
              <strong>Experience:</strong>
              <p style={{ color: '#666' }}>{survey.experience_years ? `${survey.experience_years} years` : 'Not specified'}</p>
            </div>
            <div>
              <strong>Workout Frequency:</strong>
              <p style={{ color: '#666' }}>{survey.workout_frequency ? `${survey.workout_frequency}x/week` : 'Not specified'}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
