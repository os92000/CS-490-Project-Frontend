import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, profileAPI, surveysAPI, usersAPI } from '../services/api';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [survey, setSurvey] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    bio: '',
    profile_picture: '',
  });
  const [goalsForm, setGoalsForm] = useState({
    age: '',
    weight: '',
    fitness_level: '',
    goals: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileResponse, surveyResponse, notificationsResponse] = await Promise.all([
        profileAPI.getProfile(),
        surveysAPI.getMyFitnessSurvey().catch(() => null),
        profileAPI.getNotifications(),
      ]);

      if (profileResponse.data.success) {
        const profileData = profileResponse.data.data;
        setProfile(profileData);
        setProfileForm({
          first_name: profileData.profile?.first_name || '',
          last_name: profileData.profile?.last_name || '',
          phone: profileData.profile?.phone || '',
          bio: profileData.profile?.bio || '',
          profile_picture: profileData.profile?.profile_picture || '',
        });
      }

      if (surveyResponse?.data?.success) {
        setSurvey(surveyResponse.data.data);
        setGoalsForm({
          age: surveyResponse.data.data.age || '',
          weight: surveyResponse.data.data.weight || '',
          fitness_level: surveyResponse.data.data.fitness_level || '',
          goals: surveyResponse.data.data.goals || '',
        });
      }

      if (notificationsResponse.data.success) {
        setNotifications(notificationsResponse.data.data.notifications);
      }
    } catch (err) {
      setError('Failed to load profile data.');
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setMessage('');
      const response = await profileAPI.updateProfile(profileForm);
      if (response.data.success) {
        const updatedUser = { ...user, profile: response.data.data };
        updateUser(updatedUser);
        setMessage('Profile updated successfully.');
        loadData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  const saveGoals = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setMessage('');
      await surveysAPI.createFitnessSurvey(goalsForm);
      setMessage('Fitness goals updated successfully.');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update goals.');
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setMessage('');
      await authAPI.changePassword(passwordForm);
      setPasswordForm({ current_password: '', new_password: '' });
      setMessage('Password changed successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.');
    }
  };

  const uploadPicture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await profileAPI.uploadProfilePicture(formData);
      setMessage('Profile picture uploaded successfully.');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload profile picture.');
    }
  };

  const markNotificationRead = async (id) => {
    await profileAPI.markNotificationRead(id);
    loadData();
  };

  const deleteAccount = async () => {
    const confirmed = window.confirm('Delete your account and associated data?');
    if (!confirmed) return;

    try {
      await usersAPI.deleteAccount(user.id);
      await logout();
      window.location.href = '/login';
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account.');
    }
  };

  return (
    <div className="container page-shell">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Profile</p>
          <h1>Account settings, goals, and notifications</h1>
          <p className="page-copy">Update your profile, keep your goals current, and manage your account safely.</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      <div className="two-column-grid">
        <div className="card">
          <h3>Edit profile</h3>
          <form onSubmit={saveProfile}>
            <div className="detail-grid">
              <div className="form-group">
                <label>First name</label>
                <input value={profileForm.first_name} onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Last name</label>
                <input value={profileForm.last_name} onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Profile picture URL</label>
              <input value={profileForm.profile_picture} onChange={(e) => setProfileForm({ ...profileForm, profile_picture: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Upload profile picture</label>
              <input type="file" accept="image/*" onChange={uploadPicture} />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea rows="4" value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary">Save Profile</button>
          </form>
        </div>

        <div className="card">
          <h3>Edit fitness goals</h3>
          <form onSubmit={saveGoals}>
            <div className="detail-grid">
              <div className="form-group">
                <label>Age</label>
                <input type="number" value={goalsForm.age} onChange={(e) => setGoalsForm({ ...goalsForm, age: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Weight (kg)</label>
                <input type="number" value={goalsForm.weight} onChange={(e) => setGoalsForm({ ...goalsForm, weight: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Fitness level</label>
              <select value={goalsForm.fitness_level} onChange={(e) => setGoalsForm({ ...goalsForm, fitness_level: e.target.value })}>
                <option value="">Select one</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="form-group">
              <label>Goals</label>
              <textarea rows="4" value={goalsForm.goals} onChange={(e) => setGoalsForm({ ...goalsForm, goals: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary">Save Goals</button>
          </form>
        </div>
      </div>

      <div className="two-column-grid">
        <div className="card">
          <h3>Security</h3>
          <form onSubmit={changePassword}>
            <div className="form-group">
              <label>Current password</label>
              <input type="password" value={passwordForm.current_password} onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })} />
            </div>
            <div className="form-group">
              <label>New password</label>
              <input type="password" value={passwordForm.new_password} onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary">Change Password</button>
          </form>
        </div>

        <div className="card">
          <h3>Notifications</h3>
          {notifications.length === 0 ? (
            <p className="muted-text">No notifications yet.</p>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className="list-row">
                <div>
                  <strong>{notification.title}</strong>
                  <p className="muted-text">{notification.message}</p>
                </div>
                {!notification.read && (
                  <button className="btn btn-secondary" onClick={() => markNotificationRead(notification.id)}>
                    Mark Read
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card danger-card">
        <h3>Delete account</h3>
        <p className="muted-text">This removes your account and associated data. This action cannot be undone.</p>
        <button className="btn btn-danger" onClick={deleteAccount}>Delete My Account</button>
      </div>
    </div>
  );
};

export default Profile;
