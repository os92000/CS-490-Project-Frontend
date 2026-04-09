import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/api';

const INITIAL_FORM = {
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  phone: '',
  bio: '',
  role: 'client',
  weight: '',
  age: '',
  fitness_level: '',
  goals: '',
};

const validatePassword = (password) => {
  if (password.length < 8) return 'Password must be at least 8 characters long';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one digit';
  return null;
};

const EMPTY_EDIT_FORM = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  bio: '',
  role: 'client',
  status: 'active',
  weight: '',
  age: '',
  fitness_level: '',
  goals: '',
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);

  // Edit modal state
  const [editingUser, setEditingUser] = useState(null); // the user object being edited
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Role change requests state
  const [roleRequests, setRoleRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestActionId, setRequestActionId] = useState(null);

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await adminAPI.listUsers();
      if (response.data.success) {
        // Backend returns { users: [...] } wrapped in data
        setUsers(response.data.data?.users || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadRoleRequests = async () => {
    setRequestsLoading(true);
    try {
      const response = await adminAPI.listRoleRequests({ status: 'pending' });
      if (response.data.success) {
        setRoleRequests(response.data.data?.role_requests || []);
      }
    } catch (err) {
      console.error('Failed to load role requests:', err);
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadUsers();
      loadRoleRequests();
    } else {
      setUsersLoading(false);
      setRequestsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Gate the page to admins only
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Email and password fields are required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsSubmitting(true);

    const payload = {
      email: formData.email.trim(),
      password: formData.password,
      role: formData.role,
    };

    if (formData.firstName.trim()) payload.first_name = formData.firstName.trim();
    if (formData.lastName.trim()) payload.last_name = formData.lastName.trim();
    if (formData.phone.trim()) payload.phone = formData.phone.trim();
    if (formData.bio.trim()) payload.bio = formData.bio.trim();

    // Fitness survey — only send if at least one field is filled
    const survey = {};
    if (formData.weight !== '') survey.weight = Number(formData.weight);
    if (formData.age !== '') survey.age = Number(formData.age);
    if (formData.fitness_level) survey.fitness_level = formData.fitness_level;
    if (formData.goals.trim()) survey.goals = formData.goals.trim();
    if (Object.keys(survey).length > 0) {
      payload.fitness_survey = survey;
    }

    try {
      const response = await adminAPI.createUser(payload);
      if (response.data.success) {
        setSuccess(`User ${payload.email} created successfully`);
        setFormData(INITIAL_FORM);
        loadUsers();
      } else {
        setError(response.data.message || 'Failed to create user');
      }
    } catch (err) {
      console.error('Create user error:', err);
      setError(err.response?.data?.message || 'An error occurred while creating the user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`Delete user ${email}? This cannot be undone.`)) return;

    try {
      const response = await adminAPI.deleteUser(userId);
      if (response.data.success) {
        setSuccess(`User ${email} deleted`);
        loadUsers();
      } else {
        setError(response.data.message || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Delete user error:', err);
      setError(err.response?.data?.message || 'An error occurred while deleting the user');
    }
  };

  const handleRespondToRequest = async (requestId, newStatus) => {
    const action = newStatus === 'approved' ? 'approve' : 'reject';
    let adminNotes = '';
    if (newStatus === 'rejected') {
      const notes = window.prompt(
        `Optional note for the user about why this request is being rejected:`,
        ''
      );
      // prompt returns null if cancelled — treat as abort
      if (notes === null) return;
      adminNotes = notes;
    } else {
      if (!window.confirm(`Approve this role change request?`)) return;
    }

    setRequestActionId(requestId);
    setError('');
    setSuccess('');
    try {
      const response = await adminAPI.respondToRoleRequest(requestId, {
        status: newStatus,
        admin_notes: adminNotes || undefined,
      });
      if (response.data.success) {
        setSuccess(`Role change request ${action}d successfully`);
        loadRoleRequests();
        // Also refresh the users list since an approval changes the user's role
        if (newStatus === 'approved') loadUsers();
      } else {
        setError(response.data.message || `Failed to ${action} request`);
      }
    } catch (err) {
      console.error('Respond to role request error:', err);
      setError(
        err.response?.data?.message ||
          `An error occurred while trying to ${action} the request`
      );
    } finally {
      setRequestActionId(null);
    }
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setEditError('');
    setEditForm({
      email: u.email || '',
      password: '',
      firstName: u.profile?.first_name || '',
      lastName: u.profile?.last_name || '',
      phone: u.profile?.phone || '',
      bio: u.profile?.bio || '',
      role: u.role || 'client',
      status: u.status || 'active',
      weight: u.fitness_survey?.weight ?? '',
      age: u.fitness_survey?.age ?? '',
      fitness_level: u.fitness_survey?.fitness_level || '',
      goals: u.fitness_survey?.goals || '',
    });
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditForm(EMPTY_EDIT_FORM);
    setEditError('');
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');

    if (!editingUser) return;

    if (!editForm.email.trim()) {
      setEditError('Email is required');
      return;
    }

    if (editForm.password) {
      const pwError = validatePassword(editForm.password);
      if (pwError) {
        setEditError(pwError);
        return;
      }
    }

    const payload = {
      email: editForm.email.trim(),
      role: editForm.role,
      status: editForm.status,
      first_name: editForm.firstName.trim(),
      last_name: editForm.lastName.trim(),
      phone: editForm.phone.trim(),
      bio: editForm.bio.trim(),
      fitness_survey: {
        weight: editForm.weight === '' ? null : Number(editForm.weight),
        age: editForm.age === '' ? null : Number(editForm.age),
        fitness_level: editForm.fitness_level || null,
        goals: editForm.goals.trim() || null,
      },
    };

    if (editForm.password) {
      payload.password = editForm.password;
    }

    setEditSubmitting(true);
    try {
      const response = await adminAPI.updateUser(editingUser.id, payload);
      if (response.data.success) {
        setSuccess(`User ${payload.email} updated successfully`);
        closeEditModal();
        loadUsers();
      } else {
        setEditError(response.data.message || 'Failed to update user');
      }
    } catch (err) {
      console.error('Update user error:', err);
      setEditError(err.response?.data?.message || 'An error occurred while updating the user');
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ marginTop: '30px', maxWidth: '900px' }}>
      <div className="card">
        <h1>Admin Dashboard</h1>
        <p style={{ color: '#666', marginTop: '8px' }}>
          Manually create users and manage accounts.
        </p>
      </div>

      <div className="card">
        <h2>Add New User</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Fill in the required fields marked with *. Profile and fitness info are optional.
        </p>

        {error && <div className="error-message">{error}</div>}
        {success && (
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
        )}

        <form onSubmit={handleSubmit}>
          <h3 style={{ marginTop: '10px', marginBottom: '10px' }}>Account Information</h3>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="user@example.com"
              required
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
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Temporary password"
                required
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                8+ chars, upper, lower, digit
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="role">Role *</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="client">Client</option>
              <option value="coach">Coach</option>
              <option value="both">Both</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <h3 style={{ marginTop: '25px', marginBottom: '10px' }}>Profile (optional)</h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '15px',
            }}
          >
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone number"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Short bio"
              rows="2"
            />
          </div>

          <h3 style={{ marginTop: '25px', marginBottom: '10px' }}>
            Fitness Survey (optional)
          </h3>

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
                value={formData.weight}
                onChange={handleChange}
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
                value={formData.age}
                onChange={handleChange}
                placeholder="25"
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="fitness_level">Fitness Level</label>
              <select
                id="fitness_level"
                name="fitness_level"
                value={formData.fitness_level}
                onChange={handleChange}
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
              value={formData.goals}
              onChange={handleChange}
              placeholder="e.g., Build muscle, lose 10 lbs, run a 5K"
              rows="2"
            />
          </div>

          <div className="flex gap-10" style={{ justifyContent: 'flex-start', marginTop: '15px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ minWidth: '150px' }}
            >
              {isSubmitting ? 'Creating...' : 'Create User'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="btn"
              style={{ backgroundColor: '#666', color: 'white', minWidth: '120px' }}
              disabled={isSubmitting}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Pending Role Change Requests</h2>
        <p style={{ color: '#666', marginBottom: '15px' }}>
          Clients requesting to become coaches need admin approval before their role is changed.
        </p>
        {requestsLoading ? (
          <p style={{ color: '#666' }}>Loading requests...</p>
        ) : roleRequests.length === 0 ? (
          <p style={{ color: '#666' }}>No pending role change requests.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5', textAlign: 'left' }}>
                  <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>User</th>
                  <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Requested</th>
                  <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Reason</th>
                  <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Submitted</th>
                  <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roleRequests.map((r) => {
                  const submittedAt = r.created_at
                    ? new Date(r.created_at).toLocaleString()
                    : '—';
                  const acting = requestActionId === r.id;
                  return (
                    <tr key={r.id}>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                        <div>{r.user_email || `User #${r.user_id}`}</div>
                        {r.user_name && (
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {r.user_name}
                          </div>
                        )}
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          Currently: {r.current_role || '—'}
                        </div>
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                        <strong>{r.requested_role}</strong>
                      </td>
                      <td
                        style={{
                          padding: '10px',
                          borderBottom: '1px solid #eee',
                          maxWidth: '250px',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {r.reason || <span style={{ color: '#999' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                        {submittedAt}
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleRespondToRequest(r.id, 'approved')}
                            className="btn"
                            style={{
                              backgroundColor: '#43a047',
                              color: 'white',
                              padding: '5px 12px',
                              fontSize: '13px',
                            }}
                            disabled={acting}
                          >
                            {acting ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleRespondToRequest(r.id, 'rejected')}
                            className="btn"
                            style={{
                              backgroundColor: '#e53935',
                              color: 'white',
                              padding: '5px 12px',
                              fontSize: '13px',
                            }}
                            disabled={acting}
                          >
                            {acting ? '...' : 'Reject'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Existing Users</h2>
        {usersLoading ? (
          <p style={{ color: '#666' }}>Loading users...</p>
        ) : users.length === 0 ? (
          <p style={{ color: '#666' }}>No users to display.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5', textAlign: 'left' }}>
                  <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Email</th>
                  <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Name</th>
                  <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Role</th>
                  <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Status</th>
                  <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const firstName = u.profile?.first_name;
                  const lastName = u.profile?.last_name;
                  const fullName = [firstName, lastName].filter(Boolean).join(' ') || '—';
                  return (
                    <tr key={u.id}>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                        {u.email}
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                        {fullName}
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                        {u.role || '—'}
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                        {u.status || '—'}
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => openEditModal(u)}
                            className="btn"
                            style={{
                              backgroundColor: '#1976d2',
                              color: 'white',
                              padding: '5px 12px',
                              fontSize: '13px',
                            }}
                            title="Edit user"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            className="btn"
                            style={{
                              backgroundColor: '#e53935',
                              color: 'white',
                              padding: '5px 12px',
                              fontSize: '13px',
                            }}
                            disabled={u.id === user.id}
                            title={u.id === user.id ? "You can't delete yourself" : 'Delete user'}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingUser && (
        <div
          onClick={closeEditModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '40px 20px',
            overflowY: 'auto',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              margin: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <h2 style={{ margin: 0 }}>Edit User</h2>
              <button
                onClick={closeEditModal}
                className="btn"
                style={{
                  backgroundColor: 'transparent',
                  color: '#666',
                  fontSize: '24px',
                  padding: '0 10px',
                  lineHeight: 1,
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p style={{ color: '#666', marginBottom: '15px' }}>
              Editing <strong>{editingUser.email}</strong> (ID {editingUser.id})
            </p>

            {editError && <div className="error-message">{editError}</div>}

            <form onSubmit={handleEditSubmit}>
              <h3 style={{ marginBottom: '10px' }}>Account</h3>

              <div className="form-group">
                <label htmlFor="edit-email">Email *</label>
                <input
                  type="email"
                  id="edit-email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-password">
                  New Password <span style={{ color: '#666', fontWeight: 'normal' }}>(leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  id="edit-password"
                  name="password"
                  value={editForm.password}
                  onChange={handleEditChange}
                  placeholder="New password"
                />
                <small style={{ color: '#666', fontSize: '12px' }}>
                  8+ chars, upper, lower, digit
                </small>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '15px',
                }}
              >
                <div className="form-group">
                  <label htmlFor="edit-role">Role</label>
                  <select
                    id="edit-role"
                    name="role"
                    value={editForm.role}
                    onChange={handleEditChange}
                  >
                    <option value="client">Client</option>
                    <option value="coach">Coach</option>
                    <option value="both">Both</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-status">Status</label>
                  <select
                    id="edit-status"
                    name="status"
                    value={editForm.status}
                    onChange={handleEditChange}
                    disabled={editingUser.id === user.id}
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                  {editingUser.id === user.id && (
                    <small style={{ color: '#666', fontSize: '12px' }}>
                      You can't disable your own account
                    </small>
                  )}
                </div>
              </div>

              <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Profile</h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '15px',
                }}
              >
                <div className="form-group">
                  <label htmlFor="edit-firstName">First Name</label>
                  <input
                    type="text"
                    id="edit-firstName"
                    name="firstName"
                    value={editForm.firstName}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-lastName">Last Name</label>
                  <input
                    type="text"
                    id="edit-lastName"
                    name="lastName"
                    value={editForm.lastName}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-phone">Phone</label>
                  <input
                    type="text"
                    id="edit-phone"
                    name="phone"
                    value={editForm.phone}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="edit-bio">Bio</label>
                <textarea
                  id="edit-bio"
                  name="bio"
                  value={editForm.bio}
                  onChange={handleEditChange}
                  rows="2"
                />
              </div>

              <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Fitness Survey</h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '15px',
                }}
              >
                <div className="form-group">
                  <label htmlFor="edit-weight">Weight (kg)</label>
                  <input
                    type="number"
                    id="edit-weight"
                    name="weight"
                    value={editForm.weight}
                    onChange={handleEditChange}
                    min="0"
                    step="0.1"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-age">Age</label>
                  <input
                    type="number"
                    id="edit-age"
                    name="age"
                    value={editForm.age}
                    onChange={handleEditChange}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-fitness_level">Fitness Level</label>
                  <select
                    id="edit-fitness_level"
                    name="fitness_level"
                    value={editForm.fitness_level}
                    onChange={handleEditChange}
                  >
                    <option value="">(none)</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="edit-goals">Goals</label>
                <textarea
                  id="edit-goals"
                  name="goals"
                  value={editForm.goals}
                  onChange={handleEditChange}
                  rows="2"
                />
              </div>

              <div
                className="flex gap-10"
                style={{ justifyContent: 'flex-end', marginTop: '20px' }}
              >
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="btn"
                  style={{ backgroundColor: '#666', color: 'white', minWidth: '100px' }}
                  disabled={editSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editSubmitting}
                  style={{ minWidth: '140px' }}
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
