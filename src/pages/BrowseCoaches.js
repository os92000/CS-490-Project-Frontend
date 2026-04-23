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

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const BrowseCoaches = () => {
  const [coaches, setCoaches] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [availableStart, setAvailableStart] = useState('');
  const [availableEnd, setAvailableEnd] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    coachesAPI.getSpecializations()
      .then(r => { if (r.data.success) setSpecializations(r.data.data.specializations); })
      .catch(() => {});
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadCoaches(); }, [page, selectedSpec]);

  const buildParams = (pageOverride = page) => {
    const params = { page: pageOverride, per_page: 12 };
    if (search.trim()) params.search = search.trim();
    if (selectedSpec) params.specialization = selectedSpec;
    if (priceMin) params.price_min = priceMin;
    if (priceMax) params.price_max = priceMax;
    if (selectedDay !== '') params.day_of_week = selectedDay;
    if (availableStart) params.start_time = availableStart;
    if (availableEnd) params.end_time = availableEnd;
    return params;
  };

  const loadCoaches = async (pageOverride = page) => {
    try {
      setLoading(true); setError('');
      const params = buildParams(pageOverride);
      const r = await coachesAPI.getCoaches(params);
      if (r.data.success) {
        setCoaches(r.data.data.coaches);
        setTotalPages(r.data.data.pages);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load coaches. Please try again.');
    }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadCoaches(1);
  };

  const formatPrice = (coach) => {
    const prices = Array.isArray(coach.pricing)
      ? coach.pricing.map(item => Number(item.price)).filter(price => Number.isFinite(price))
      : [];
    if (prices.length === 0) {
      return null;
    }
    return Math.min(...prices).toFixed(2);
  };

  const formatAvailability = (coach) => {
    const slots = Array.isArray(coach.availability) ? coach.availability : [];
    if (slots.length === 0) {
      return null;
    }

    const dayIndices = [...new Set(
      slots
        .map(slot => Number(slot.day_of_week))
        .filter(day => Number.isInteger(day) && day >= 0 && day < DAY_NAMES.length)
    )].sort((left, right) => left - right);

    if (dayIndices.length === 0) {
      return null;
    }

    return dayIndices.map(day => DAY_NAMES[day]).join(', ');
  };

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
        <form onSubmit={handleSearch} style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span className="muted-text" style={{ fontSize: 12 }}>Search</span>
              <input
                type="text"
                placeholder="Search by name or bio…"
                value={search}
                onChange={e => { setSearch(e.target.value); }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span className="muted-text" style={{ fontSize: 12 }}>Specialization</span>
              <select
                value={selectedSpec}
                onChange={e => { setSelectedSpec(e.target.value); setPage(1); }}
              >
                <option value="">All specializations</option>
                {specializations.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span className="muted-text" style={{ fontSize: 12 }}>Min price</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={priceMin}
                onChange={e => { setPriceMin(e.target.value); }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span className="muted-text" style={{ fontSize: 12 }}>Max price</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Any"
                value={priceMax}
                onChange={e => { setPriceMax(e.target.value); }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span className="muted-text" style={{ fontSize: 12 }}>Available day</span>
              <select value={selectedDay} onChange={e => { setSelectedDay(e.target.value); }}>
                <option value="">Any day</option>
                {DAY_NAMES.map((dayName, index) => (
                  <option key={dayName} value={index}>{dayName}</option>
                ))}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span className="muted-text" style={{ fontSize: 12 }}>Start time</span>
              <input
                type="time"
                value={availableStart}
                onChange={e => { setAvailableStart(e.target.value); }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span className="muted-text" style={{ fontSize: 12 }}>End time</span>
              <input
                type="time"
                value={availableEnd}
                onChange={e => { setAvailableEnd(e.target.value); }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary">Search</button>
          </div>
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Finding coaches…</div>
      ) : coaches.length === 0 ? (
        <div className="card fade-up" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
          <h3 style={{ marginBottom: 8 }}>No coaches found</h3>
          <p className="muted-text">Try broadening your search, price range, or availability filters.</p>
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
                  {formatPrice(coach) && (
                    <span className="coach-price">
                      ${formatPrice(coach)}
                      <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-2)' }}> / session</span>
                    </span>
                  )}
                </div>

                {formatAvailability(coach) && (
                  <p className="muted-text" style={{ fontSize: 12, marginTop: 10, marginBottom: 0 }}>
                    Available: {formatAvailability(coach)}
                  </p>
                )}

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
