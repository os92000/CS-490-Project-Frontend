import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { coachesAPI } from '../services/api';

const Stars = ({ rating }) => (
  <div className="stars">{[1,2,3,4,5].map(i => <span key={i} className={`star ${i <= Math.round(rating) ? 'on' : ''}`}>★</span>)}</div>
);

const MyCoach = () => {
  const [coach, setCoach] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await coachesAPI.getMyCoach();
        if (res.data.success) setCoach(res.data.data);
      } catch (err) {
        if (err.response?.status === 404) {
          try {
            const rr = await coachesAPI.getMyRequests('sent');
            if (rr.data.success) setPendingRequest(rr.data.data.requests.find(r => r.status === 'pending') || null);
          } catch {}
          setError("You don't have an active coach yet.");
        } else setError('Failed to load coach data.');
      } finally { setLoading(false); }
    })();
  }, []);

  const submitReview = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError(''); setSuccess('');
    try {
      const res = await coachesAPI.submitReview(coach.id, { rating, comment });
      if (res.data.success) { setSuccess('Review submitted!'); setShowReviewForm(false); setComment(''); setRating(5); }
    } catch (err) { setError(err.response?.data?.message || 'Failed to submit review.'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="loading">Loading your coach…</div>;

  if (error && !coach) return (
    <div className="container page-shell">
      <div className="card fade-up" style={{ textAlign: 'center', padding: '60px 40px' }}>
        <p style={{ fontSize: 48, marginBottom: 16 }}>🔍</p>
        <h2 style={{ marginBottom: 8 }}>No active coach</h2>
        <p className="muted-text" style={{ marginBottom: 24 }}>
          {pendingRequest ? `You have a pending request with ${pendingRequest.coach?.profile?.first_name || 'a coach'}.` : "You don't have a coach yet. Browse coaches to get started."}
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/coaches')}>Browse coaches</button>
      </div>
    </div>
  );

  const name = coach.profile?.first_name && coach.profile?.last_name ? `${coach.profile.first_name} ${coach.profile.last_name}` : coach.profile?.first_name || 'Your Coach';
  const initials = (coach.profile?.first_name?.[0] || coach.email?.[0] || '?').toUpperCase();

  return (
    <div className="container page-shell">
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* COACH CARD */}
      <div className="card fade-up">
        <p className="eyebrow" style={{ marginBottom: 16 }}>Your coach</p>
        <div className="flex gap-20" style={{ flexWrap: 'wrap' }}>
          <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg, var(--green), var(--teal))', display: 'grid', placeItems: 'center', fontSize: 34, fontWeight: 700, color: '#000', flexShrink: 0, overflow: 'hidden', border: '3px solid rgba(63,185,80,0.3)' }}>
            {coach.profile?.profile_picture ? <img src={coach.profile.profile_picture} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : initials}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ marginBottom: 8 }}>{name}</h1>
            <div className="flex flex-wrap gap-8 mb-12">
              {coach.email && <span className="badge badge-muted">{coach.email}</span>}
              {coach.coach_info?.experience_years && <span className="badge badge-green">{coach.coach_info.experience_years} yrs experience</span>}
              {coach.start_date && <span className="badge badge-muted">Coach since {new Date(coach.start_date).toLocaleDateString()}</span>}
            </div>
            <div className="flex gap-10">
              <button className="btn btn-primary" onClick={() => navigate('/chat')}>Message coach</button>
              <button className="btn btn-secondary" onClick={() => setShowReviewForm(!showReviewForm)}>
                {showReviewForm ? 'Cancel review' : 'Leave a review'}
              </button>
            </div>
          </div>
        </div>

        {/* REVIEW FORM */}
        {showReviewForm && (
          <form onSubmit={submitReview} style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3>Leave a review</h3>
            <div className="form-group">
              <label>Star rating</label>
              <div className="flex gap-8 mt-8">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setRating(n)} style={{ fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', color: n <= rating ? 'var(--amber)' : 'var(--border-2)', padding: 0 }}>★</button>
                ))}
                <span className="muted-text" style={{ marginLeft: 8, alignSelf: 'center' }}>{['','Poor','Fair','Good','Very good','Excellent'][rating]}</span>
              </div>
            </div>
            <div className="form-group">
              <label>Comment (optional)</label>
              <textarea rows={3} value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience with this coach…" />
            </div>
            <div className="flex gap-10">
              <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit review'}</button>
            </div>
          </form>
        )}
      </div>

      {/* BIO & CERTS */}
      {(coach.coach_info?.bio || coach.coach_info?.certifications) && (
        <div className="two-col fade-up fade-up-1">
          {coach.coach_info?.bio && (
            <div className="card">
              <h2 style={{ marginBottom: 14 }}>About your coach</h2>
              <p className="muted-text" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{coach.coach_info.bio}</p>
            </div>
          )}
          {coach.coach_info?.certifications && (
            <div className="card">
              <h2 style={{ marginBottom: 14 }}>Certifications</h2>
              <p className="muted-text" style={{ whiteSpace: 'pre-wrap' }}>{coach.coach_info.certifications}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyCoach;
