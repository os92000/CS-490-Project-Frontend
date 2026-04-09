import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { coachesAPI } from '../services/api';

const MyClients = () => {
  const [clients, setClients] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('clients'); // 'clients' or 'requests'

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load clients
      const clientsResponse = await coachesAPI.getMyClients();
      if (clientsResponse.data.success) {
        setClients(clientsResponse.data.data.clients);
      }

      // Load pending requests
      const requestsResponse = await coachesAPI.getMyRequests('received');
      if (requestsResponse.data.success) {
        setRequests(requestsResponse.data.data.requests.filter(r => r.status === 'pending'));
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load clients. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResponse = async (requestId, status) => {
    try {
      setError('');
      setSuccessMessage('');

      const response = await coachesAPI.respondToRequest(requestId, status);

      if (response.data.success) {
        setSuccessMessage(`Request ${status} successfully!`);
        loadData(); // Reload data
      }
    } catch (err) {
      console.error('Failed to respond to request:', err);
      setError(err.response?.data?.message || 'Failed to respond to request.');
    }
  };

  return (
    <div className="container" style={{ maxWidth: '1000px', marginTop: '30px' }}>
      <h1>My Clients</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Manage your clients and respond to hire requests
      </p>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '2px solid #eee' }}>
        <button
          onClick={() => setActiveTab('clients')}
          style={{
            padding: '15px 30px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'clients' ? 'bold' : 'normal',
            borderBottom: activeTab === 'clients' ? '3px solid #4CAF50' : 'none',
            color: activeTab === 'clients' ? '#4CAF50' : '#666',
          }}
        >
          Active Clients ({clients.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          style={{
            padding: '15px 30px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'requests' ? 'bold' : 'normal',
            borderBottom: activeTab === 'requests' ? '3px solid #4CAF50' : 'none',
            color: activeTab === 'requests' ? '#4CAF50' : '#666',
          }}
        >
          Pending Requests ({requests.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Loading...</p>
        </div>
      ) : (
        <>
          {/* Active Clients Tab */}
          {activeTab === 'clients' && (
            <div>
              {clients.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '50px' }}>
                  <p style={{ color: '#666', fontSize: '18px' }}>
                    You don't have any active clients yet.
                  </p>
                  <p style={{ color: '#666', marginTop: '10px' }}>
                    Check the "Pending Requests" tab to see if any clients want to hire you.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {clients.map((client) => (
                    <div key={client.id} className="card">
                      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                        <div
                          style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '36px',
                            margin: '0 auto 15px',
                          }}
                        >
                          {client.profile?.first_name?.[0] || client.email[0].toUpperCase()}
                        </div>
                        <h3 style={{ marginBottom: '5px' }}>
                          {client.profile?.first_name && client.profile?.last_name
                            ? `${client.profile.first_name} ${client.profile.last_name}`
                            : 'Client'}
                        </h3>
                        <p style={{ color: '#666', fontSize: '14px' }}>
                          {client.email}
                        </p>
                      </div>

                      {client.profile?.phone && (
                        <p style={{ color: '#666', marginBottom: '10px' }}>
                          <strong>Phone:</strong> {client.profile.phone}
                        </p>
                      )}

                      {client.start_date && (
                        <p style={{ color: '#666', marginBottom: '15px' }}>
                          <strong>Client since:</strong> {new Date(client.start_date).toLocaleDateString()}
                        </p>
                      )}

                      <button
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        onClick={() => navigate(`/clients/${client.id}`)}
                      >
                        View Progress
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pending Requests Tab */}
          {activeTab === 'requests' && (
            <div>
              {requests.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '50px' }}>
                  <p style={{ color: '#666', fontSize: '18px' }}>
                    No pending hire requests.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                  {requests.map((request) => (
                    <div key={request.id} className="card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div
                          style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '36px',
                            flexShrink: 0,
                          }}
                        >
                          {request.client?.profile?.first_name?.[0] || request.client?.email[0].toUpperCase()}
                        </div>

                        <div style={{ flex: 1 }}>
                          <h3 style={{ marginBottom: '5px' }}>
                            {request.client?.profile?.first_name && request.client?.profile?.last_name
                              ? `${request.client.profile.first_name} ${request.client.profile.last_name}`
                              : 'Client'}
                          </h3>
                          <p style={{ color: '#666', marginBottom: '5px' }}>
                            {request.client?.email}
                          </p>
                          <p style={{ color: '#666', fontSize: '14px' }}>
                            Requested: {new Date(request.requested_at).toLocaleDateString()}
                          </p>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleRequestResponse(request.id, 'accepted')}
                          >
                            Accept
                          </button>
                          <button
                            className="btn"
                            style={{ backgroundColor: '#f44336', color: 'white' }}
                            onClick={() => handleRequestResponse(request.id, 'denied')}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyClients;
