import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const roles = [
    {
      value: 'client',
      title: 'Client',
      description: 'I want to find a coach and improve my fitness',
      icon: '🏃',
    },
    {
      value: 'coach',
      title: 'Coach',
      description: 'I want to help clients reach their fitness goals',
      icon: '💪',
    },
    {
      value: 'both',
      title: 'Both',
      description: 'I want to be both a client and a coach',
      icon: '🤝',
    },
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setError('');
  };

  const handleSubmit = async () => {
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    console.log('Role selection - User ID:', user?.id);
    console.log('Role selection - Selected role:', selectedRole);
    console.log('Role selection - Access token exists:', !!localStorage.getItem('access_token'));

    setIsLoading(true);
    setError('');

    try {
      const response = await usersAPI.updateRole(user.id, selectedRole);
      console.log('Role update response:', response.data);

      if (response.data.success) {
        // Update user in context
        updateUser(response.data.data);

        // Navigate to fitness survey
        navigate('/fitness-survey');
      } else {
        setError(response.data.message || 'Failed to update role');
      }
    } catch (error) {
      console.error('Role update error:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // Skip to dashboard without selecting role
    navigate('/dashboard');
  };

  return (
    <div className="container" style={{ maxWidth: '800px', marginTop: '50px' }}>
      <div className="card">
        <h1 className="text-center">Select Your Role</h1>
        <p className="text-center" style={{ color: '#666', marginBottom: '30px' }}>
          Choose how you want to use the fitness app
        </p>

        {error && (
          <div className="error-message">{error}</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          {roles.map((role) => (
            <div
              key={role.value}
              onClick={() => handleRoleSelect(role.value)}
              style={{
                border: selectedRole === role.value ? '3px solid #4CAF50' : '2px solid #ddd',
                borderRadius: '10px',
                padding: '30px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backgroundColor: selectedRole === role.value ? '#f0f9f0' : 'white',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>
                {role.icon}
              </div>
              <h3 style={{ marginBottom: '10px', color: '#333' }}>
                {role.title}
              </h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                {role.description}
              </p>
            </div>
          ))}
        </div>

        <div className="flex gap-10" style={{ justifyContent: 'center' }}>
          <button
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={!selectedRole || isLoading}
            style={{ minWidth: '150px' }}
          >
            {isLoading ? 'Saving...' : 'Continue'}
          </button>

          <button
            onClick={handleSkip}
            className="btn"
            style={{
              backgroundColor: '#666',
              color: 'white',
              minWidth: '150px'
            }}
            disabled={isLoading}
          >
            Skip for Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
