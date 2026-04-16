import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coachesAPI } from '../services/api';

const displayName = (c) =>
  c.profile?.first_name && c.profile?.last_name
    ? `${c.profile.first_name} ${c.profile.last_name}`
    : c.profile?.first_name || c.email?.split('@')[0] || 'Coach';

const Stars = ({ value }) => {
  const rounded = Math.round(value || 0);
  return (
    <span>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: i <= rounded ? '#FFD700' : '#ddd' }}>
          ★
        </span>
      ))}
    </span>
  );
};

const LandingPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const [topCoaches, setTopCoaches] = useState([]);
  const [coachesLoading, setCoachesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await coachesAPI.getPublicTopCoaches({ limit: 5 });
        if (cancelled) return;
        if (res.data.success) {
          setTopCoaches(res.data.data.coaches || []);
        }
      } catch (err) {
        // Non-fatal: just hide the section if it fails
        console.warn('Could not load top coaches:', err);
      } finally {
        if (!cancelled) setCoachesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingBottom: 16 }}>
          <Link to="/" className="auth-logo" style={{ display: 'inline-block', marginBottom: 0, textDecoration: 'none' }}>
            FitApp
          </Link>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" className="btn btn-secondary" style={{ textDecoration: 'none', display: 'inline-block' }}>
              Log in
            </Link>
            <Link to="/signup" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: 48, paddingBottom: 64 }}>
        <section style={{ maxWidth: 640, marginBottom: 48 }}>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginBottom: 16, lineHeight: 1.25 }}>
            Train smarter with coaches who fit your life
          </h1>
          <p style={{ color: '#555', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: 28 }}>
            Connect with certified coaches, book sessions around your schedule, and track workouts and progress in one
            place - whether you&apos;re just starting out or leveling up.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Link to="/signup" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-block', padding: '12px 24px' }}>
              Create an account
            </Link>
            <Link to="/login" className="btn" style={{ textDecoration: 'none', display: 'inline-block', padding: '12px 24px', background: '#fff', border: '1px solid #ccc', color: '#000' }}>
              I already have an account
            </Link>
          </div>
        </section>

        {/* Top 5 Coaches */}
        {!coachesLoading && topCoaches.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 16,
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <h2 style={{ margin: 0, fontSize: '1.35rem' }}>Top coaches</h2>
              <Link
                to="/top-coaches"
                style={{ color: '#4CAF50', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}
              >
                See all →
              </Link>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
              }}
            >
              {topCoaches.map((c) => {
                const name = displayName(c);
                const avg = c.rating?.average;
                const count = c.rating?.count ?? 0;
                const bio = c.coach_info?.bio;
                return (
                  <div key={c.id} className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          backgroundColor: '#4CAF50',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 20,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {(name[0] || '?').toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: '1rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {name}
                        </h3>
                        <div style={{ fontSize: 13, color: '#666' }}>
                          <Stars value={avg} />
                          <span style={{ marginLeft: 6 }}>
                            {avg != null ? avg.toFixed(1) : '0.0'} ({count})
                          </span>
                        </div>
                      </div>
                    </div>
                    {bio && (
                      <p
                        style={{
                          color: '#555',
                          fontSize: 13,
                          lineHeight: 1.5,
                          margin: 0,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {bio}
                      </p>
                    )}
                    <Link
                      to="/signup"
                      className="btn btn-primary"
                      style={{
                        textDecoration: 'none',
                        textAlign: 'center',
                        marginTop: 'auto',
                        padding: '8px 12px',
                        fontSize: 14,
                      }}
                    >
                      Sign up to connect
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ marginBottom: 16, fontSize: '1.15rem' }}>What you can do here</h2>
          <ul style={{ color: '#555', lineHeight: 1.8, paddingLeft: 20 }}>
            <li>Browse coaches, compare experience and pricing, and request to work with someone who matches your goals.</li>
            <li>Log workouts, meals, and wellness check-ins so you and your coach stay aligned.</li>
            <li>Message your coach in-app once you&apos;re connected - no scattered texts or emails.</li>
          </ul>
        </section>

        <p style={{ color: '#888', fontSize: 14 }}>
          New here?{' '}
          <Link to="/signup" style={{ color: '#4CAF50', fontWeight: 600 }}>
            Sign up free
          </Link>
          {' · '}
          <Link to="/login" style={{ color: '#4CAF50', fontWeight: 600 }}>
            Log in
          </Link>
        </p>
      </main>
    </div>
  );
};

export default LandingPage;
