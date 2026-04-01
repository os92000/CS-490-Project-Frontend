import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { isAuthenticated, loading } = useAuth();

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
          <Link to="/" style={{ fontWeight: 700, fontSize: '1.25rem', color: '#2e7d32', textDecoration: 'none' }}>
            Fitness App
          </Link>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/top-coaches" style={{ color: '#2e7d32', fontWeight: 600, textDecoration: 'none', marginRight: 8 }}>
              Top coaches
            </Link>
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
            place — whether you&apos;re just starting out or leveling up.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Link to="/signup" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-block', padding: '12px 24px' }}>
              Create an account
            </Link>
            <Link to="/login" className="btn" style={{ textDecoration: 'none', display: 'inline-block', padding: '12px 24px', background: '#fff', border: '1px solid #ccc' }}>
              I already have an account
            </Link>
          </div>
        </section>

        <section className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ marginBottom: 16, fontSize: '1.15rem' }}>What you can do here</h2>
          <ul style={{ color: '#555', lineHeight: 1.8, paddingLeft: 20 }}>
            <li>Browse coaches, compare experience and pricing, and request to work with someone who matches your goals.</li>
            <li>Log workouts, meals, and wellness check-ins so you and your coach stay aligned.</li>
            <li>Message your coach in-app once you&apos;re connected — no scattered texts or emails.</li>
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
