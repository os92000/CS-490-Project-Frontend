import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { coachesAPI } from '../services/api';
import Avatar from '../components/Avatar';

const Stars = ({ rating }) => (
  <div className="stars">
    {[1,2,3,4,5].map(i => (
      <span key={i} className={`star ${i <= Math.round(rating) ? 'on' : ''}`}>★</span>
    ))}
  </div>
);

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
    coachesAPI.getSpecializations()
      .then(r => { if (r.data.success) setSpecializations(r.data.data.specializations); })
      .catch(() => {});
  }, []);

  useEffect(() => { loadCoaches(); }, [page, selectedSpec]);

  const loadCoaches = async () => {
    try {
      setLoading(true); setError('');
      const params = { page, per_page: 12 };
      if (search) params.search = search;
      if (selectedSpec) params.specialization = selectedSpec;
      const r = await coachesAPI.getCoaches(params);
      if (r.data.success) {
        setCoaches(r.data.data.coaches);
        setTotalPages(r.data.data.pages);
      }
    } catch { setError('Failed to load coaches. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => { e.preventDefault(); setPage(1); loadCoaches(); };

  const coachName = (c) => c.profile?.first_name && c.profile?.last_name
    ? `${c.profile.first_name} ${c.profile.last_name}`
    : c.profile?.first_name || 'Coach';

  return (
    <div className="container page-shell">
      {/* HERO */}
      <div className="page-hero fade-up">
        <div className="hero-copy">
          <p className="eyebrow">Coach Discovery</p>
          <h1>Find your coach</h1>
          <p className="page-copy">Browse certified fitness coaches, view profiles, and send a hire request.</p>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="card fade-up fade-up-1" style={{ padding: '16px 20px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by name or bio…"
            value={search}
            onChange={e => { setSearch(e.target.value); }}
            style={{ flex: '1 1 180px', maxWidth: 360 }}
          />
          <select
            value={selectedSpec}
            onChange={e => { setSelectedSpec(e.target.value); setPage(1); }}
            style={{ flex: '1 1 160px', maxWidth: 260 }}
          >
            <option value="">All specializations</option>
            {specializations.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Finding coaches…</div>
      ) : coaches.length === 0 ? (
        <div className="card fade-up" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
          <h3 style={{ marginBottom: 8 }}>No coaches found</h3>
          <p className="muted-text">Try adjusting your search or clearing the specialization filter.</p>
        </div>
      ) : (
        <>
          <div className="coach-grid fade-up fade-up-2">
            {coaches.map(coach => (
              <div key={coach.id} className="coach-card" onClick={() => navigate(`/coaches/${coach.id}`)}>
                {/* HEADER with real avatar */}
                <div className="coach-card-header">
                  <Avatar
                    src={coach.profile?.profile_picture}
                    name={coachName(coach)}
                    size={52}
                  />
                  <div>
                    <h3 style={{ marginBottom: 3 }}>{coachName(coach)}</h3>
                    <div className="flex items-center gap-8">
                      <Stars rating={coach.rating?.average || 0} />
                      <span className="text-dim" style={{ fontSize: 12 }}>({coach.rating?.count || 0})</span>
                    </div>
                  </div>
                </div>

                {/* BIO */}
                {coach.coach_info?.bio && (
                  <p className="coach-bio">{coach.coach_info.bio}</p>
                )}

                {/* SPECIALIZATION TAGS */}
                {coach.specializations?.length > 0 && (
                  <div className="coach-specs">
                    {coach.specializations.slice(0, 3).map(s => (
                      <span key={s.id} className="badge badge-teal" style={{ fontSize: 11 }}>
                        {s.specialization?.name}
                      </span>
                    ))}
                    {coach.specializations.length > 3 && (
                      <span className="badge badge-muted" style={{ fontSize: 11 }}>+{coach.specializations.length - 3}</span>
                    )}
                  </div>
                )}

                {/* EXPERIENCE + PRICE */}
                <div className="flex items-center justify-between">
                  {coach.coach_info?.experience_years && (
                    <span className="text-dim" style={{ fontSize: 13 }}>{coach.coach_info.experience_years} yrs experience</span>
                  )}
                  {coach.pricing?.length > 0 && (
                    <span className="coach-price">
                      ${coach.pricing[0].price}
                      <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-2)' }}> / session</span>
                    </span>
                  )}
                </div>

                <button
                  className="btn btn-secondary btn-sm w-full"
                  onClick={e => { e.stopPropagation(); navigate(`/coaches/${coach.id}`); }}
                >
                  View Profile →
                </button>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-12">
              <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span className="muted-text">Page {page} of {totalPages}</span>
              <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BrowseCoaches;
