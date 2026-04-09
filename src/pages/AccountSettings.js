import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI, usersAPI, surveysAPI } from '../services/api';

const validatePassword = (password) => {
  if (password.length < 8) return 'Password must be at least 8 characters long';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one digit';
  return null;
};

const SectionMessage = ({ error, success }) => {
  if (error) return <div className="error-message">{error}</div>;
  if (success) {
    return (
      <div
        style={{
          backgroundColor: '#e8f5e9',
          color: '#2e7d32',
          padding: '10px 15px',
          borderRadius: '6px',
          marginBottom: '15px',
          border: '1px solid #a5d6a7',
        }}
      >
        {success}
      </div>
    );
  }
  return null;
};

const AccountSettings = () => {
  const { user, updateUser } = useAuth();

  // --- Profile section ---
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    bio: '',
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // --- Role section ---
  const [roleValue, setRoleValue] = useState(user?.role || 'client');
  const [roleReason, setRoleReason] = useState('');
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleError, setRoleError] = useState('');
  const [roleSuccess, setRoleSuccess] = useState('');
  const [roleRequest, setRoleRequest] = useState(null); // latest role change request

  // --- Password section ---
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // --- Fitness survey section ---
  const [surveyForm, setSurveyForm] = useState({
    weight: '',
    age: '',
    fitness_level: '',
    goals: '',
  });
  const [surveyLoading, setSurveyLoading] = useState(true);
  const [surveySaving, setSurveySaving] = useState(false);
  const [surveyError, setSurveyError] = useState('');
  const [surveySuccess, setSurveySuccess] = useState('');

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setProfileLoading(true);
    try {
      const response = await usersAPI.getProfile(user.id);
      if (response.data.success) {
        const payload = response.data.data;
        // Backend shape is { user: { ...user, profile: {...} } }
        const profile = payload?.user?.profile || payload?.profile || {};
        setProfileForm({
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          phone: profile.phone || '',
          bio: profile.bio || '',
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      // Fall back to whatever is on the auth user object
      setProfileForm({
        first_name: user.profile?.first_name || '',
        last_name: user.profile?.last_name || '',
        phone: user.profile?.phone || '',
        bio: user.profile?.bio || '',
      });
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  const loadRoleRequest = useCallback(async () => {
    try {
      const response = await usersAPI.getMyRoleRequest();
      if (response.data.success) {
        setRoleRequest(response.data.data || null);
      }
    } catch (err) {
      console.error('Failed to load role request:', err);
    }
  }, []);

  const loadSurvey = useCallback(async () => {
    setSurveyLoading(true);
    try {
      const response = await surveysAPI.getMyFitnessSurvey();
      if (response.data.success && response.data.data) {
        const s = response.data.data;
        setSurveyForm({
          weight: s.weight != null ? String(s.weight) : '',
          age: s.age != null ? String(s.age) : '',
          fitness_level: s.fitness_level || '',
          goals: s.goals || '',
        });
      }
    } catch (err) {
      // Survey just might not exist yet
      if (err.response?.status !== 404) {
        console.error('Failed to load fitness survey:', err);
      }
    } finally {
      setSurveyLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadSurvey();
      loadRoleRequest();
      setRoleValue(user.role || 'client');
    }
  }, [user, loadProfile, loadSurvey, loadRoleRequest]);

  // Must come after hooks so hook order is preserved
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // --- Profile handlers ---
  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
    setProfileError('');
    setProfileSuccess('');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileSaving(true);
    try {
      const response = await usersAPI.updateProfile(user.id, {
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        phone: profileForm.phone,
        bio: profileForm.bio,
      });
      if (response.data.success) {
        setProfileSuccess('Profile updated successfully');
        // Refresh the auth user so the navbar etc. stay in sync
        if (response.data.data) {
          updateUser(response.data.data);
        }
      } else {
        setProfileError(response.data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Update profile error:', err);
      setProfileError(err.response?.data?.message || 'An error occurred while saving your profile');
    } finally {
      setProfileSaving(false);
    }
  };

  // --- Role handlers ---
  const isClient = user.role === 'client';
  // A client requesting coach/both needs admin approval
  const needsApproval =
    isClient && (roleValue === 'coach' || roleValue === 'both');
  const hasPendingRequest = roleRequest?.status === 'pending';

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    setRoleError('');
    setRoleSuccess('');

    if (roleValue === user.role) {
      setRoleError('That is already your current role');
      return;
    }
    if (roleValue === 'admin') {
      setRoleError('Admin role cannot be self-assigned');
      return;
    }

    setRoleSaving(true);
    try {
      if (needsApproval) {
        // Submit a role change request for admin approval
        const response = await usersAPI.submitRoleRequest({
          requested_role: roleValue,
          reason: roleReason.trim(),
        });
        if (response.data.success) {
          setRoleSuccess(
            'Role change request submitted. An admin will review it shortly.'
          );
          setRoleRequest(response.data.data || null);
          setRoleReason('');
        } else {
          setRoleError(response.data.message || 'Failed to submit role request');
        }
      } else {
        // Direct role update (downgrades, coach <-> both, etc.)
        const response = await usersAPI.updateRole(user.id, roleValue);
        if (response.data.success) {
          setRoleSuccess('Role updated successfully');
          if (response.data.data) {
            updateUser(response.data.data);
          }
        } else {
          setRoleError(response.data.message || 'Failed to update role');
        }
      }
    } catch (err) {
      console.error('Role change error:', err);
      setRoleError(
        err.response?.data?.message || 'An error occurred while updating your role'
      );
    } finally {
      setRoleSaving(false);
    }
  };

  // --- Password handlers ---
  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      setPasswordError('All password fields are required');
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New passwords do not match');
      return;
    }

    const pwError = validatePassword(passwordForm.new_password);
    if (pwError) {
      setPasswordError(pwError);
      return;
    }

    setPasswordSaving(true);
    try {
      const response = await authAPI.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      if (response.data.success) {
        setPasswordSuccess('Password changed successfully');
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        setPasswordError(response.data.message || 'Failed to change password');
      }
    } catch (err) {
      console.error('Change password error:', err);
      setPasswordError(err.response?.data?.message || 'An error occurred while changing your password');
    } finally {
      setPasswordSaving(false);
    }
  };

  // --- Survey handlers ---
  const handleSurveyChange = (e) => {
    setSurveyForm({ ...surveyForm, [e.target.name]: e.target.value });
    setSurveyError('');
    setSurveySuccess('');
  };

  const handleSurveySubmit = async (e) => {
    e.preventDefault();
    setSurveyError('');
    setSurveySuccess('');
    setSurveySaving(true);

    const payload = {
      weight: surveyForm.weight === '' ? null : Number(surveyForm.weight),
      age: surveyForm.age === '' ? null : Number(surveyForm.age),
      fitness_level: surveyForm.fitness_level || null,
      goals: surveyForm.goals.trim() || null,
    };

    try {
      const response = await surveysAPI.createFitnessSurvey(payload);
      if (response.data.success) {
        setSurveySuccess('Fitness survey updated successfully');
      } else {
        setSurveyError(response.data.message || 'Failed to update fitness survey');
      }
    } catch (err) {
      console.error('Update survey error:', err);
      setSurveyError(err.response?.data?.message || 'An error occurred while saving your survey');
    } finally {
      setSurveySaving(false);
    }
  };

  return (
    <div className="container" style={{ marginTop: '30px', maxWidth: '800px' }}>
      <div className="card">
        <h1>Account Settings</h1>
        <p style={{ color: '#666', marginTop: '8px' }}>
          Signed in as <strong>{user.email}</strong> ({user.role || 'no role'})
        </p>
      </div>

      {/* Profile */}
      <div className="card">
        <h2>Profile Information</h2>
        <p style={{ color: '#666', marginBottom: '15px' }}>
          Update your name and contact details.
        </p>
        <SectionMessage error={profileError} success={profileSuccess} />

        {profileLoading ? (
          <p style={{ color: '#666' }}>Loading profile...</p>
        ) : (
          <form onSubmit={handleProfileSubmit}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '15px',
              }}
            >
              <div className="form-group">
                <label htmlFor="first_name">First Name</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={profileForm.first_name}
                  onChange={handleProfileChange}
                  placeholder="First name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="last_name">Last Name</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={profileForm.last_name}
                  onChange={handleProfileChange}
                  placeholder="Last name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={profileForm.phone}
                  onChange={handleProfileChange}
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={profileForm.bio}
                onChange={handleProfileChange}
                placeholder="Tell us about yourself"
                rows="3"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={profileSaving}
              style={{ minWidth: '150px' }}
            >
              {profileSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        )}
      </div>

      {/* Role */}
      <div className="card">
        <h2>Account Role</h2>
        <p style={{ color: '#666', marginBottom: '15px' }}>
          {isClient
            ? 'Converting from client to coach requires admin approval.'
            : 'Switch between client, coach, or both.'}
        </p>
        <SectionMessage error={roleError} success={roleSuccess} />

        {hasPendingRequest && (
          <div
            style={{
              backgroundColor: '#fff9e6',
              borderLeft: '4px solid #ffc107',
              padding: '12px 15px',
              borderRadius: '6px',
              marginBottom: '15px',
            }}
          >
            <strong>Pending role change request</strong>
            <div style={{ fontSize: '14px', color: '#555', marginTop: '5px' }}>
              You requested <strong>{roleRequest.requested_role}</strong>. Waiting
              for an admin to review.
              {roleRequest.reason && (
                <div style={{ marginTop: '5px' }}>
                  <em>Your reason:</em> {roleRequest.reason}
                </div>
              )}
            </div>
          </div>
        )}

        {roleRequest?.status === 'rejected' && (
          <div
            style={{
              backgroundColor: '#fdecea',
              borderLeft: '4px solid #e53935',
              padding: '12px 15px',
              borderRadius: '6px',
              marginBottom: '15px',
            }}
          >
            <strong>Previous request rejected</strong>
            <div style={{ fontSize: '14px', color: '#555', marginTop: '5px' }}>
              Your request to become <strong>{roleRequest.requested_role}</strong>{' '}
              was rejected.
              {roleRequest.admin_notes && (
                <div style={{ marginTop: '5px' }}>
                  <em>Admin note:</em> {roleRequest.admin_notes}
                </div>
              )}
              <div style={{ marginTop: '5px' }}>
                You may submit a new request below.
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleRoleSubmit}>
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={roleValue}
              onChange={(e) => {
                setRoleValue(e.target.value);
                setRoleError('');
                setRoleSuccess('');
              }}
              disabled={hasPendingRequest}
            >
              <option value="client">Client</option>
              <option value="coach">Coach</option>
              <option value="both">Both (Client and Coach)</option>
            </select>
          </div>

          {needsApproval && !hasPendingRequest && (
            <div className="form-group">
              <label htmlFor="role_reason">
                Reason for request{' '}
                <span style={{ color: '#666', fontWeight: 'normal' }}>(optional)</span>
              </label>
              <textarea
                id="role_reason"
                name="role_reason"
                value={roleReason}
                onChange={(e) => setRoleReason(e.target.value)}
                placeholder="Tell the admin why you want to become a coach (e.g., certifications, experience)"
                rows="3"
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={roleSaving || hasPendingRequest}
            style={{ minWidth: '150px' }}
          >
            {roleSaving
              ? 'Saving...'
              : needsApproval
              ? 'Submit Request'
              : 'Save Role'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card">
        <h2>Change Password</h2>
        <p style={{ color: '#666', marginBottom: '15px' }}>
          Enter your current password and choose a new one.
        </p>
        <SectionMessage error={passwordError} success={passwordSuccess} />

        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group">
            <label htmlFor="current_password">Current Password</label>
            <input
              type="password"
              id="current_password"
              name="current_password"
              value={passwordForm.current_password}
              onChange={handlePasswordChange}
              placeholder="Enter current password"
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '15px',
            }}
          >
            <div className="form-group">
              <label htmlFor="new_password">New Password</label>
              <input
                type="password"
                id="new_password"
                name="new_password"
                value={passwordForm.new_password}
                onChange={handlePasswordChange}
                placeholder="New password"
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                8+ chars, upper, lower, digit
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirm_password">Confirm New Password</label>
              <input
                type="password"
                id="confirm_password"
                name="confirm_password"
                value={passwordForm.confirm_password}
                onChange={handlePasswordChange}
                placeholder="Re-enter new password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={passwordSaving}
            style={{ minWidth: '150px' }}
          >
            {passwordSaving ? 'Saving...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Fitness Survey */}
      <div className="card">
        <h2>Fitness Survey</h2>
        <p style={{ color: '#666', marginBottom: '15px' }}>
          Update your weight, age, fitness level, and goals.
        </p>
        <SectionMessage error={surveyError} success={surveySuccess} />

        {surveyLoading ? (
          <p style={{ color: '#666' }}>Loading survey...</p>
        ) : (
          <form onSubmit={handleSurveySubmit}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '15px',
              }}
            >
              <div className="form-group">
                <label htmlFor="weight">Weight (kg)</label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={surveyForm.weight}
                  onChange={handleSurveyChange}
                  placeholder="70"
                  min="0"
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label htmlFor="age">Age</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={surveyForm.age}
                  onChange={handleSurveyChange}
                  placeholder="25"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="fitness_level">Fitness Level</label>
                <select
                  id="fitness_level"
                  name="fitness_level"
                  value={surveyForm.fitness_level}
                  onChange={handleSurveyChange}
                >
                  <option value="">Select fitness level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="goals">Goals</label>
              <textarea
                id="goals"
                name="goals"
                value={surveyForm.goals}
                onChange={handleSurveyChange}
                placeholder="e.g., Build muscle, lose 10 lbs, run a 5K"
                rows="3"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={surveySaving}
              style={{ minWidth: '150px' }}
            >
              {surveySaving ? 'Saving...' : 'Save Fitness Survey'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AccountSettings;
