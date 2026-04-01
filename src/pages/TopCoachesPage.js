import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coachesAPI } from '../services/api';

const TopCoachesPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await coachesAPI.getPublicTopCoaches({ limit: 15 });
        if (cancelled) return;
        if (res.data.success) {
          setCoaches(res.data.data.coaches || []);
        } else {
          setError(res.data.message || 'Could not load coaches.');
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.response?.data?.message || 'Could not load coaches.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stars = (n) =>
    [1, 2, 3, 4, 5].map((i) => (
      <span key={i} style={{ color: i <= n ? '#FFD700' : '#ddd' }}>
        ★
      </span>
    ));

  const displayName = (c) =>
    c.profile?.first_name && c.profile?.last_name
      ? `${c.profile.first_name} ${c.profile.last_name}`
      : c.profile?.first_name || c.email?.split('@')[0] || 'Coach';

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div
          className="container"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingBottom: 16 }}
        >
          <Link to="/" style={{ fontWeight: 700, fontSize: '1.25rem', color: '#2e7d32', textDecoration: 'none' }}>
            Fitness App
          </Link>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/top-coaches" style={{ color: '#2e7d32', fontWeight: 600, textDecoration: 'none', alignSelf: 'center' }}>
              Top coaches
            </Link>
            {isAuthenticated ? (
              <button type="button" className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                Dashboard
              </button>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary" style={{ textDecoration: 'none', display: 'inline-block' }}>
                  Log in
                </Link>
                <Link to="/signup" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <p style={{ marginBottom: 8 }}>
          <Link to="/" style={{ color: '#666', textDecoration: 'none', fontSize: 14 }}>
            ← Home
          </Link>
        </p>
        <h1 style={{ marginBottom: 8, fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>Top coaches</h1>
        <p style={{ color: '#666', marginBottom: 28, maxWidth: 640 }}>
          Coaches listed here have at least one client review, sorted by average rating.
        </p>

        {loading && <p>Loading…</p>}
        {error && <div className="error-message">{error}</div>}

        {!loading && !error && coaches.length === 0 && (
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: 8 }}>No top coaches available yet.</p>
            <p style={{ color: '#666' }}>
              Once coaches start collecting reviews, they&apos;ll show up here. Create an account to browse all coaches and leave feedback.
            </p>
            <div style={{ marginTop: 20 }}>
              <Link to="/signup" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
                Sign up
              </Link>
            </div>
          </div>
        )}

        {!loading &&
          coaches.map((c) => (
            <div key={c.id} className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    backgroundColor: '#4CAF50',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                    flexShrink: 0,
                  }}
                >
                  {(displayName(c)[0] || '?').toUpperCase()}
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <h2 style={{ fontSize: '1.25rem', marginBottom: 6 }}>{displayName(c)}</h2>
                  <div style={{ marginBottom: 8 }}>
                    {stars(Math.round(c.rating?.average || 0))}
                    <span style={{ color: '#666', marginLeft: 8 }}>
                      {c.rating?.average?.toFixed(1) ?? '0.0'} ({c.rating?.count ?? 0} reviews)
                    </span>
                  </div>
                  {c.coach_info?.bio && (
                    <p style={{ color: '#555', lineHeight: 1.5, marginBottom: 12, whiteSpace: 'pre-wrap' }}>
                      {c.coach_info.bio.length > 220 ? `${c.coach_info.bio.slice(0, 220)}…` : c.coach_info.bio}
                    </p>
                  )}
                  {c.sample_reviews?.length > 0 && (
                    <div style={{ borderTop: '1px solid #eee', paddingTop: 12, marginTop: 8 }}>
                      <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>Recent reviews</p>
                      {c.sample_reviews.map((r) => (
                        <div key={r.id} style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 13 }}>
                            {stars(r.rating)}
                            <span style={{ color: '#888', marginLeft: 8 }}>
                              {r.reviewer_label}
                              {r.created_at ? ` · ${new Date(r.created_at).toLocaleDateString()}` : ''}
                            </span>
                          </div>
                          {r.comment && (
                            <p style={{ color: '#666', fontSize: 14, marginTop: 4, lineHeight: 1.45 }}>{r.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {isAuthenticated ? (
                    <button type="button" className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate(`/coaches/${c.id}`)}>
                      View profile
                    </button>
                  ) : (
                    <p style={{ marginTop: 12, color: '#666', fontSize: 14 }}>
                      <Link to="/signup" style={{ color: '#4CAF50', fontWeight: 600 }}>
                        Sign up
                      </Link>{' '}
                      or{' '}
                      <Link to="/login" style={{ color: '#4CAF50', fontWeight: 600 }}>
                        log in
                      </Link>{' '}
                      to view full profile and book.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
      </main>
    </div>
  );
};

export default TopCoachesPage;
