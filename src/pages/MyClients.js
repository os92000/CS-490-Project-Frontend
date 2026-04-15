import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { coachesAPI } from '../services/api';

const MyClients = () => {
  const [clients, setClients] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('clients');
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cr, rr] = await Promise.all([
        coachesAPI.getMyClients(),
        coachesAPI.getMyRequests('received'),
      ]);
      if (cr.data.success) setClients(cr.data.data.clients);
      if (rr.data.success) setRequests(rr.data.data.requests.filter(r => r.status === 'pending'));
    } catch { setError('Failed to load client data.'); }
    finally { setLoading(false); }
  };

  const respond = async (id, status) => {
    try {
      setError(''); setSuccess('');
      const res = await coachesAPI.respondToRequest(id, status);
      if (res.data.success) { setSuccess(`Request ${status}!`); loadData(); }
    } catch (err) { setError(err.response?.data?.message || 'Failed to respond.'); }
  };

  const initials = (p, e) => ((p?.first_name?.[0] || e?.[0] || '?')).toUpperCase();
  const fullName = (p, e) => p?.first_name && p?.last_name ? `${p.first_name} ${p.last_name}` : p?.first_name || e || 'Client';

  return (
    <div className="container page-shell">
      <div className="page-hero fade-up">
        <div className="hero-copy">
          <p className="eyebrow">Coach workspace</p>
          <h1>My Clients</h1>
          <p className="page-copy">Manage your active clients and respond to hire requests.</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="flex gap-6 fade-up fade-up-1">
        {[['clients', `Clients (${clients.length})`], ['requests', `Requests (${requests.length})`]].map(([v, label]) => (
          <button key={v} className={`tab-button ${activeTab === v ? 'active' : ''}`} onClick={() => setActiveTab(v)}>{label}</button>
        ))}
      </div>

      {loading ? <div className="loading">Loading…</div> : (
        <>
          {activeTab === 'clients' && (
            clients.length === 0 ? (
              <div className="card fade-up" style={{ textAlign: 'center', padding: '60px 40px' }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>👥</p>
                <h3 style={{ marginBottom: 8 }}>No active clients yet</h3>
                <p className="muted-text">Check the Requests tab — clients may be waiting for your approval.</p>
              </div>
            ) : (
              <div className="coach-grid fade-up">
                {clients.map(client => (
                  <div key={client.id} className="card card-hover" style={{ borderRadius: 16 }}>
                    <div className="flex items-center gap-14 mb-14">
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue), var(--teal))', display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 700, color: '#000', flexShrink: 0, overflow: 'hidden' }}>
                        {client.profile?.profile_picture ? <img src={client.profile.profile_picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : initials(client.profile, client.email)}
                      </div>
                      <div>
                        <h3 style={{ marginBottom: 3 }}>{fullName(client.profile, client.email)}</h3>
                        <p className="muted-text" style={{ fontSize: 12 }}>{client.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-6 mb-14">
                      {client.profile?.phone && <span className="badge badge-muted">{client.profile.phone}</span>}
                      {client.start_date && <span className="badge badge-green">Since {new Date(client.start_date).toLocaleDateString()}</span>}
                    </div>
                    <button className="btn btn-secondary btn-sm w-full" onClick={() => navigate(`/clients/${client.id}`)}>View progress →</button>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'requests' && (
            requests.length === 0 ? (
              <div className="card fade-up" style={{ textAlign: 'center', padding: '60px 40px' }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>📬</p>
                <h3 style={{ marginBottom: 8 }}>No pending requests</h3>
                <p className="muted-text">New hire requests from clients will appear here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} className="fade-up">
                {requests.map(req => (
                  <div key={req.id} className="card" style={{ borderRadius: 16 }}>
                    <div className="flex items-center gap-16" style={{ flexWrap: 'wrap' }}>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue), var(--teal))', display: 'grid', placeItems: 'center', fontSize: 20, fontWeight: 700, color: '#000', flexShrink: 0 }}>
                        {initials(req.client?.profile, req.client?.email)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ marginBottom: 4 }}>{fullName(req.client?.profile, req.client?.email)}</h3>
                        <p className="muted-text" style={{ fontSize: 13 }}>{req.client?.email}</p>
                        <p className="muted-text" style={{ fontSize: 12, marginTop: 4 }}>Requested {new Date(req.requested_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-8">
                        <button className="btn btn-primary btn-sm" onClick={() => respond(req.id, 'accepted')}>Accept</button>
                        <button className="btn btn-danger btn-sm" onClick={() => respond(req.id, 'denied')}>Decline</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
};

export default MyClients;
