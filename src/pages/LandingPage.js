import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coachesAPI, workoutsAPI } from '../services/api';

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

const TESTIMONIALS = [
  {
    id: 1,
    quote: 'The coach-matching flow made it easy to find someone who understood my schedule and my goals.',
    author: 'Alyssa M.',
    tag: 'Client testimonial',
  },
  {
    id: 2,
    quote: 'I can track workouts, meals, and messages in one place. It finally feels organized.',
    author: 'Darren K.',
    tag: 'Client testimonial',
  },
  {
    id: 3,
    quote: 'The exercise bank helps me discover variations quickly when my gym is crowded.',
    author: 'Samir R.',
    tag: 'Client testimonial',
  },
];

const EXERCISE_CATEGORIES = [
  'strength',
  'cardio',
  'flexibility',
  'balance',
  'sports',
];

const MUSCLE_GROUPS = [
  'full-body',
  'chest',
  'back',
  'legs',
  'shoulders',
  'arms',
  'core',
];

const DIFFICULTY_LEVELS = [
  'beginner',
  'intermediate',
  'advanced',
];

const LandingPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const [topCoaches, setTopCoaches] = useState([]);
  const [coachesLoading, setCoachesLoading] = useState(true);
  const [exerciseLoading, setExerciseLoading] = useState(true);
  const [exercisesError, setExercisesError] = useState('');
  const [exercises, setExercises] = useState([]);
  const [exercisePage, setExercisePage] = useState(1);
  const [exercisePages, setExercisePages] = useState(1);
  const [exerciseTotal, setExerciseTotal] = useState(0);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [appliedExerciseSearch, setAppliedExerciseSearch] = useState('');
  const [exerciseCategory, setExerciseCategory] = useState('');
  const [exerciseMuscleGroup, setExerciseMuscleGroup] = useState('');
  const [exerciseDifficulty, setExerciseDifficulty] = useState('');

  const EXERCISES_PER_PAGE = 9;

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setExerciseLoading(true);
      setExercisesError('');
      try {
        const res = await workoutsAPI.getPublicExercises({
          page: exercisePage,
          per_page: EXERCISES_PER_PAGE,
          search: appliedExerciseSearch || undefined,
          category: exerciseCategory || undefined,
          muscle_group: exerciseMuscleGroup || undefined,
          difficulty: exerciseDifficulty || undefined,
        });
        if (cancelled) return;

        if (res.data?.success) {
          const payload = res.data.data || {};
          setExercises(payload.exercises || []);
          setExercisePages(Math.max(payload.pages || 1, 1));
          setExerciseTotal(payload.total || 0);
        } else {
          setExercises([]);
          setExercisePages(1);
          setExerciseTotal(0);
        }
      } catch (err) {
        if (cancelled) return;
        setExercises([]);
        setExercisePages(1);
        setExerciseTotal(0);
        setExercisesError('Exercise bank is temporarily unavailable.');
      } finally {
        if (!cancelled) setExerciseLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [exercisePage, appliedExerciseSearch, exerciseCategory, exerciseMuscleGroup, exerciseDifficulty]);

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

        <section style={{ marginBottom: 40 }}>
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
              <h2 style={{ margin: 0, fontSize: '1.35rem' }}>Coach discovery and reviews</h2>
              <Link
                to="/top-coaches"
                style={{ color: '#4CAF50', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}
              >
                See all →
              </Link>
            </div>

            {coachesLoading && <div className="loading" style={{ minHeight: 80 }}>Loading coaches...</div>}
            {!coachesLoading && topCoaches.length === 0 && (
              <div className="card" style={{ margin: 0 }}>
                <p style={{ color: '#8b949e', margin: 0 }}>No coaches are available yet.</p>
              </div>
            )}

            {!coachesLoading && topCoaches.length > 0 && (
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
                const sampleReview = c.sample_reviews?.[0];
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
                    {sampleReview?.comment && (
                      <div style={{ background: '#1b2330', borderRadius: 10, padding: 10, border: '1px solid #2f3a4c' }}>
                        <p style={{ margin: 0, fontSize: 13, color: '#d2d9e2', lineHeight: 1.45 }}>
                          "{sampleReview.comment}"
                        </p>
                        <p style={{ margin: '8px 0 0 0', fontSize: 12, color: '#8b949e' }}>
                          - {sampleReview.reviewer_label || 'Member'}
                        </p>
                      </div>
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
            )}
          </section>

        <section className="card" style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Client testimonials</h2>
            <span className="badge badge-blue">Discovery preview</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {TESTIMONIALS.map((t) => (
              <div key={t.id} style={{ background: '#151b24', border: '1px solid #2a3343', borderRadius: 12, padding: 14 }}>
                <p style={{ fontSize: 14, color: '#d2d9e2', margin: 0, lineHeight: 1.55 }}>
                  "{t.quote}"
                </p>
                <p style={{ fontSize: 12, color: '#8b949e', margin: '8px 0 0 0' }}>
                  {t.author} · {t.tag}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="card" style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Exercise bank</h2>
            <span style={{ color: '#8b949e', fontSize: 13 }}>
              {exerciseTotal} exercise{exerciseTotal === 1 ? '' : 's'} available
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setExercisePage(1);
              setAppliedExerciseSearch(exerciseSearch.trim());
            }}
            style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}
          >
            <input
              value={exerciseSearch}
              onChange={(e) => setExerciseSearch(e.target.value)}
              placeholder="Search exercises by name"
              style={{ flex: '1 1 260px' }}
            />
            <button type="submit" className="btn btn-primary">Search</button>
            {(appliedExerciseSearch || exerciseCategory || exerciseMuscleGroup || exerciseDifficulty) && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setExerciseSearch('');
                  setAppliedExerciseSearch('');
                  setExerciseCategory('');
                  setExerciseMuscleGroup('');
                  setExerciseDifficulty('');
                  setExercisePage(1);
                }}
              >
                Clear
              </button>
            )}
          </form>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 14 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Category</label>
              <select
                value={exerciseCategory}
                onChange={(e) => {
                  setExercisePage(1);
                  setExerciseCategory(e.target.value);
                }}
              >
                <option value="">All categories</option>
                {EXERCISE_CATEGORIES.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Muscle group</label>
              <select
                value={exerciseMuscleGroup}
                onChange={(e) => {
                  setExercisePage(1);
                  setExerciseMuscleGroup(e.target.value);
                }}
              >
                <option value="">All muscle groups</option>
                {MUSCLE_GROUPS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Difficulty</label>
              <select
                value={exerciseDifficulty}
                onChange={(e) => {
                  setExercisePage(1);
                  setExerciseDifficulty(e.target.value);
                }}
              >
                <option value="">All levels</option>
                {DIFFICULTY_LEVELS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {exerciseLoading && <div className="loading" style={{ minHeight: 120 }}>Loading exercise bank...</div>}

          {!exerciseLoading && exercisesError && (
            <div className="error-message">{exercisesError}</div>
          )}

          {!exerciseLoading && !exercisesError && exercises.length === 0 && (
            <p style={{ color: '#8b949e', margin: 0 }}>No exercises found for this filter.</p>
          )}

          {!exerciseLoading && !exercisesError && exercises.length > 0 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                {exercises.map((ex) => (
                  <div key={ex.id} style={{ background: '#151b24', border: '1px solid #2a3343', borderRadius: 12, padding: 14 }}>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '1rem' }}>{ex.name}</h3>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                      {ex.category && <span className="badge badge-teal">{ex.category}</span>}
                      {ex.muscle_group && <span className="badge badge-blue">{ex.muscle_group}</span>}
                      {ex.difficulty && <span className="badge badge-amber">{ex.difficulty}</span>}
                    </div>
                    <p style={{ color: '#8b949e', fontSize: 13, margin: 0, lineHeight: 1.45 }}>
                      {ex.description || 'No description available yet.'}
                    </p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, gap: 10, flexWrap: 'wrap' }}>
                <span style={{ color: '#8b949e', fontSize: 13 }}>
                  Page {exercisePage} of {exercisePages}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={exercisePage <= 1}
                    onClick={() => setExercisePage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={exercisePage >= exercisePages}
                    onClick={() => setExercisePage((p) => Math.min(exercisePages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

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
