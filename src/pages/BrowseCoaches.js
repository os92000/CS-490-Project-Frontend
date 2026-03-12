import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { coachesAPI } from '../services/api';

const BrowseCoaches = () => {
  const [coaches, setCoaches] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();

  useEffect(() => {
    loadSpecializations();
  }, []);

  useEffect(() => {
    loadCoaches();
  }, [page, search, selectedSpec]);

  const loadSpecializations = async () => {
    try {
      const response = await coachesAPI.getSpecializations();
      if (response.data.success) {
        setSpecializations(response.data.data.specializations);
      }
    } catch (err) {
      console.error('Failed to load specializations:', err);
    }
  };

  const loadCoaches = async () => {
    try {
      setLoading(true);
      setError('');

      const params = { page, per_page: 12 };
      if (search) params.search = search;
      if (selectedSpec) params.specialization = selectedSpec;

      const response = await coachesAPI.getCoaches(params);

      if (response.data.success) {
        setCoaches(response.data.data.coaches);
        setTotalPages(response.data.data.pages);
      }
    } catch (err) {
      console.error('Failed to load coaches:', err);
      setError('Failed to load coaches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadCoaches();
  };

  const viewCoachProfile = (coachId) => {
    navigate(`/coaches/${coachId}`);
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ color: i <= rating ? '#FFD700' : '#ddd', fontSize: '20px' }}>
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="container" style={{ maxWidth: '1200px', marginTop: '30px' }}>
      <h1>Find Your Coach</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Browse and connect with certified fitness coaches
      </p>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <form onSubmit={handleSearch}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 150px', gap: '15px' }}>
            <input
              type="text"
              className="input"
              placeholder="Search coaches by name or bio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="input"
              value={selectedSpec}
              onChange={(e) => {
                setSelectedSpec(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Specializations</option>
              {specializations.map((spec) => (
                <option key={spec.id} value={spec.id}>
                  {spec.name}
                </option>
              ))}
            </select>

            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Loading coaches...</p>
        </div>
      ) : coaches.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px' }}>
          <p style={{ color: '#666', fontSize: '18px' }}>
            No coaches found. Try adjusting your search filters.
          </p>
        </div>
      ) : (
        <>
          {/* Coaches Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {coaches.map((coach) => (
              <div
                key={coach.id}
                className="card"
                style={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
                onClick={() => viewCoachProfile(coach.id)}
              >
                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                  <div
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '48px',
                      margin: '0 auto 15px',
                    }}
                  >
                    {coach.profile?.first_name?.[0] || coach.email[0].toUpperCase()}
                  </div>
                  <h3 style={{ marginBottom: '5px' }}>
                    {coach.profile?.first_name && coach.profile?.last_name
                      ? `${coach.profile.first_name} ${coach.profile.last_name}`
                      : 'Coach'}
                  </h3>
                  <div style={{ marginBottom: '10px' }}>
                    {renderStars(Math.round(coach.rating?.average || 0))}
                    <span style={{ color: '#666', marginLeft: '10px' }}>
                      ({coach.rating?.count || 0} reviews)
                    </span>
                  </div>
                </div>

                {coach.coach_info?.bio && (
                  <p
                    style={{
                      color: '#666',
                      fontSize: '14px',
                      marginBottom: '15px',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {coach.coach_info.bio}
                  </p>
                )}

                {coach.specializations?.length > 0 && (
                  <div style={{ marginBottom: '15px' }}>
                    {coach.specializations.slice(0, 3).map((spec) => (
                      <span
                        key={spec.id}
                        style={{
                          display: 'inline-block',
                          backgroundColor: '#e3f2fd',
                          color: '#1976d2',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          marginRight: '8px',
                          marginBottom: '8px',
                        }}
                      >
                        {spec.specialization?.name}
                      </span>
                    ))}
                  </div>
                )}

                {coach.coach_info?.experience_years && (
                  <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                    {coach.coach_info.experience_years} years experience
                  </p>
                )}

                {coach.pricing && (
                  <p style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '18px' }}>
                    ${coach.pricing.price} / session
                  </p>
                )}

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '15px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    viewCoachProfile(coach.id);
                  }}
                >
                  View Profile
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button
                className="btn"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span style={{ padding: '10px 20px', color: '#666' }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="btn"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BrowseCoaches;
