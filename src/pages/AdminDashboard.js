import React, { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [reports, setReports] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [requests, setRequests] = useState([]);
  const [paymentAnalytics, setPaymentAnalytics] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    description: '',
    category: '',
    muscle_group: '',
    equipment: '',
    difficulty: '',
    instructions: '',
    is_public: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [
        statsResponse,
        usersResponse,
        applicationsResponse,
        reportsResponse,
        exercisesResponse,
        requestsResponse,
        paymentsResponse,
        templatesResponse,
      ] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(),
        adminAPI.getCoachApplications(),
        adminAPI.getReports(),
        adminAPI.getExercises(),
        adminAPI.getRequests(),
        adminAPI.getPaymentAnalytics(),
        adminAPI.getTemplates(),
      ]);

      if (statsResponse.data.success) setStats(statsResponse.data.data);
      if (usersResponse.data.success) setUsers(usersResponse.data.data.users);
      if (applicationsResponse.data.success) setApplications(applicationsResponse.data.data.applications);
      if (reportsResponse.data.success) setReports(reportsResponse.data.data.reports);
      if (exercisesResponse.data.success) setExercises(exercisesResponse.data.data.exercises);
      if (requestsResponse.data.success) setRequests(requestsResponse.data.data.requests);
      if (paymentsResponse.data.success) setPaymentAnalytics(paymentsResponse.data.data);
      if (templatesResponse.data.success) setTemplates(templatesResponse.data.data.templates);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  const createExercise = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createExercise(exerciseForm);
      setExerciseForm({
        name: '',
        description: '',
        category: '',
        muscle_group: '',
        equipment: '',
        difficulty: '',
        instructions: '',
        is_public: true,
      });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create exercise.');
    }
  };

  const editExercise = async (exercise) => {
    const nextName = window.prompt('Exercise name', exercise.name);
    if (nextName === null) return;
    const nextEquipment = window.prompt('Equipment', exercise.equipment || '');
    try {
      await adminAPI.updateExercise(exercise.id, {
        name: nextName,
        equipment: nextEquipment,
      });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to edit exercise.');
    }
  };

  const updateUserRole = async (userId, role) => {
    try {
      await adminAPI.updateUser(userId, { role });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user role.');
    }
  };

  if (loading) {
    return <div className="loading">Loading admin dashboard...</div>;
  }

  return (
    <div className="container page-shell">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Platform operations, moderation, and approvals</h1>
          <p className="page-copy">Manage users, coach applications, report queues, exercise inventory, request states, template approvals, and mock payment analytics.</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card"><span>Total users</span><strong>{stats.total_users}</strong></div>
          <div className="stat-card"><span>Open reports</span><strong>{stats.open_reports}</strong></div>
          <div className="stat-card"><span>Pending coach applications</span><strong>{stats.pending_coach_applications}</strong></div>
          <div className="stat-card"><span>Total revenue</span><strong>${stats.total_revenue}</strong></div>
        </div>
      )}

      <div className="tab-row">
        {['users', 'applications', 'reports', 'exercises', 'requests', 'payments', 'templates'].map((tab) => (
          <button key={tab} className={`tab-button ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div className="card">
          <h3>Users</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>{user.profile?.first_name || '--'} {user.profile?.last_name || ''}</td>
                    <td>
                      <select value={user.role || ''} onChange={(e) => updateUserRole(user.id, e.target.value)}>
                        <option value="client">client</option>
                        <option value="coach">coach</option>
                        <option value="both">both</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td>{user.status}</td>
                    <td>
                      <button
                        className={`btn ${user.status === 'active' ? 'btn-danger' : 'btn-primary'}`}
                        onClick={() => adminAPI.updateUserStatus(user.id, user.status === 'active' ? 'disabled' : 'active').then(loadData)}
                      >
                        {user.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="card">
          <h3>Coach Applications</h3>
          {applications.map((application) => (
            <div key={application.id} className="list-row">
              <div>
                <strong>{application.user?.email}</strong>
                <p className="muted-text">{application.notes || 'No notes provided'}</p>
              </div>
              <div className="list-row-actions">
                <span className="badge">{application.status}</span>
                <button className="btn btn-primary" onClick={() => adminAPI.reviewCoachApplication(application.id, { status: 'approved' }).then(loadData)}>Approve</button>
                <button className="btn btn-danger" onClick={() => adminAPI.reviewCoachApplication(application.id, { status: 'denied' }).then(loadData)}>Deny</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="card">
          <h3>Moderation Reports</h3>
          {reports.map((report) => (
            <div key={report.id} className="list-row">
              <div>
                <strong>{report.report_type} · {report.reason}</strong>
                <p className="muted-text">{report.details || 'No extra details'}</p>
              </div>
              <div className="list-row-actions">
                <span className="badge">{report.status}</span>
                <button className="btn btn-secondary" onClick={() => adminAPI.updateReport(report.id, { status: 'reviewed' }).then(loadData)}>Review</button>
                <button className="btn btn-primary" onClick={() => adminAPI.updateReport(report.id, { status: 'resolved' }).then(loadData)}>Resolve</button>
                <button className="btn btn-danger" onClick={() => adminAPI.updateReport(report.id, { status: 'dismissed' }).then(loadData)}>Dismiss</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'exercises' && (
        <div className="two-column-grid">
          <div className="card">
            <h3>Create Exercise</h3>
            <form onSubmit={createExercise}>
              {['name', 'description', 'category', 'muscle_group', 'equipment', 'difficulty', 'instructions'].map((field) => (
                <div className="form-group" key={field}>
                  <label>{field.replace('_', ' ')}</label>
                  {field === 'description' || field === 'instructions' ? (
                    <textarea rows="3" value={exerciseForm[field]} onChange={(e) => setExerciseForm({ ...exerciseForm, [field]: e.target.value })} />
                  ) : (
                    <input value={exerciseForm[field]} onChange={(e) => setExerciseForm({ ...exerciseForm, [field]: e.target.value })} />
                  )}
                </div>
              ))}
              <button type="submit" className="btn btn-primary">Create Exercise</button>
            </form>
          </div>
          <div className="card">
            <h3>Exercise Inventory</h3>
            {exercises.map((exercise) => (
                <div key={exercise.id} className="list-row">
                  <div>
                    <strong>{exercise.name}</strong>
                    <p className="muted-text">{exercise.equipment || 'No equipment'} · {exercise.difficulty || 'No difficulty'}</p>
                  </div>
                  <div className="list-row-actions">
                    <button className="btn btn-secondary" onClick={() => editExercise(exercise)}>
                      Edit
                    </button>
                    <button className="btn btn-secondary" onClick={() => adminAPI.updateExercise(exercise.id, { is_public: !exercise.is_public }).then(loadData)}>
                      {exercise.is_public ? 'Unapprove' : 'Approve'}
                    </button>
                  <button className="btn btn-danger" onClick={() => adminAPI.deleteExercise(exercise.id).then(loadData)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="card">
          <h3>Coach Requests</h3>
          {requests.map((request) => (
            <div key={request.id} className="list-row">
              <div>
                <strong>Client {request.client_id} → Coach {request.coach_id}</strong>
                <p className="muted-text">Requested at {request.requested_at}</p>
              </div>
              <div className="list-row-actions">
                <span className="badge">{request.status}</span>
                <button className="btn btn-primary" onClick={() => adminAPI.updateRequest(request.id, { status: 'accepted' }).then(loadData)}>Accept</button>
                <button className="btn btn-danger" onClick={() => adminAPI.updateRequest(request.id, { status: 'denied' }).then(loadData)}>Deny</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="card">
          <h3>Payment Analytics</h3>
          <div className="stats-grid" style={{ marginBottom: '20px' }}>
            <div className="stat-card"><span>Total Revenue</span><strong>${paymentAnalytics?.total_revenue || 0}</strong></div>
            <div className="stat-card"><span>Payment Count</span><strong>{paymentAnalytics?.payment_count || 0}</strong></div>
          </div>
          {paymentAnalytics?.payments?.map((payment) => (
            <div key={payment.id} className="list-row">
              <div>
                <strong>{payment.payment_reference}</strong>
                <p className="muted-text">{payment.currency} {payment.amount}</p>
              </div>
              <span className="badge">{payment.status}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="card">
          <h3>Workout Templates</h3>
          {templates.map((template) => (
            <div key={template.id} className="list-row">
              <div>
                <strong>{template.name}</strong>
                <p className="muted-text">{template.goal || 'No goal'} · {template.difficulty || 'No difficulty'} · {template.plan_type || 'No type'}</p>
              </div>
              <div className="list-row-actions">
                <span className="badge">{template.approved ? 'approved' : 'pending'}</span>
                <button className="btn btn-primary" onClick={() => adminAPI.updateTemplate({ template_id: template.id, approved: true, is_public: true }).then(loadData)}>
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
