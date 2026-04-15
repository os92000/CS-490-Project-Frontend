import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coachesAPI } from '../services/api';

const Stars = ({ rating, size = 16 }) => (
  <div className="stars">
    {[1,2,3,4,5].map(i => <span key={i} className={`star ${i <= Math.round(rating) ? 'on' : ''}`} style={{ fontSize: size }}>★</span>)}
  </div>
);

const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const CoachProfile = () => {
  const { coachId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coach, setCoach] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sending, setSending] = useState(false);
  const [reportForm, setReportForm] = useState({ reason: '', details: '' });
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [cr, rr] = await Promise.all([
          coachesAPI.getCoachDetails(coachId),
          coachesAPI.getCoachReviews(coachId, { page: 1, per_page: 10 }),
        ]);
        if (cr.data.success) setCoach(cr.data.data);
        if (rr.data.success) setReviews(rr.data.data.reviews);
      } catch { setError('Failed to load coach profile.'); }
      finally { setLoading(false); }
    })();
  }, [coachId]);

  const sendHire = async () => {
    setSending(true); setError(''); setSuccess('');
    try {
      const res = await coachesAPI.sendHireRequest(coachId);
      if (res.data.success) setSuccess('Hire request sent! The coach will review your request.');
    } catch (err) { setError(err.response?.data?.message || 'Failed to send request.'); }
    finally { setSending(false); }
  };

  const reportCoach = async (e) => {
    e.preventDefault();
    try {
      await coachesAPI.reportCoach(coachId, reportForm);
      setSuccess('Coach reported.'); setReportForm({ reason: '', details: '' }); setShowReport(false);
    } catch (err) { setError(err.response?.data?.message || 'Failed to report.'); }
  };

  const initials = coach ? (coach.profile?.first_name?.[0] || coach.email?.[0] || '?').toUpperCase() : '?';
  const name = coach ? (coach.profile?.first_name && coach.profile?.last_name ? `${coach.profile.first_name} ${coach.profile.last_name}` : coach.profile?.first_name || 'Coach') : '';

  if (loading) return <div className="loading">Loading coach profile…</div>;
  if (error && !coach) return <div className="container page-shell"><div className="error-message">{error}</div><button className="btn btn-secondary mt-16" onClick={() => navigate('/coaches')}>← Back to coaches</button></div>;

  return (
    <div className="container page-shell">
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/coaches')} style={{ alignSelf: 'flex-start' }}>← Back to coaches</button>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* HERO CARD */}
      <div className="card fade-up">
        <div className="flex gap-24" style={{ flexWrap: 'wrap' }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, var(--green), var(--teal))', display: 'grid', placeItems: 'center', fontSize: 38, fontWeight: 700, color: '#000', flexShrink: 0, overflow: 'hidden', border: '3px solid rgba(63,185,80,0.3)' }}>
            {coach.profile?.profile_picture ? <img src={coach.profile.profile_picture} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : initials}
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <h1 style={{ marginBottom: 6 }}>{name}</h1>
            <div className="flex items-center gap-10 mb-12">
              <Stars rating={Math.round(coach.rating?.average || 0)} size={18} />
              <span className="muted-text">{coach.rating?.average?.toFixed(1) || '0.0'} ({coach.rating?.count || 0} reviews)</span>
            </div>
            <div className="flex flex-wrap gap-8 mb-16">
              {coach.coach_info?.experience_years && <span className="badge badge-muted">{coach.coach_info.experience_years} yrs experience</span>}
              {coach.specializations?.map(s => <span key={s.id} className="badge badge-teal">{s.specialization?.name}</span>)}
            </div>
            {user?.id !== parseInt(coachId) && (
              <div className="flex gap-10">
                <button className="btn btn-primary" onClick={sendHire} disabled={sending}>{sending ? 'Sending…' : 'Hire this coach'}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowReport(!showReport)}>Report</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="two-col fade-up fade-up-1">
        {/* ABOUT */}
        {coach.coach_info?.bio && (
          <div className="card">
            <h2 style={{ marginBottom: 14 }}>About</h2>
            <p className="muted-text" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{coach.coach_info.bio}</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* PRICING */}
          {coach.pricing?.length > 0 && (
            <div className="card">
              <h2 style={{ marginBottom: 14 }}>Pricing</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                {coach.pricing.map(p => (
                  <div key={p.id} style={{ border: '2px solid rgba(63,185,80,0.3)', borderRadius: 12, padding: 16, textAlign: 'center', background: 'var(--green-dim)' }}>
                    <p className="muted-text" style={{ fontSize: 12, marginBottom: 6 }}>{p.session_type || 'Session'}</p>
                    <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--green)', fontFamily: "'Syne', sans-serif" }}>${p.price}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AVAILABILITY */}
          {coach.availability?.length > 0 && (
            <div className="card">
              <h2 style={{ marginBottom: 14 }}>Availability</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {coach.availability.map(slot => (
                  <div key={slot.id} className="flex justify-between items-center" style={{ padding: '10px 14px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <strong style={{ fontSize: 13 }}>{days[slot.day_of_week]}</strong>
                    <span className="muted-text" style={{ fontSize: 13 }}>{slot.start_time} – {slot.end_time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CERTIFICATIONS */}
      {coach.coach_info?.certifications && (
        <div className="card fade-up">
          <h2 style={{ marginBottom: 14 }}>Certifications</h2>
          <p className="muted-text" style={{ whiteSpace: 'pre-wrap' }}>{coach.coach_info.certifications}</p>
        </div>
      )}

      {/* REVIEWS */}
      <div className="card fade-up">
        <div className="section-header"><div><h2>Reviews</h2><p className="muted-text">{reviews.length} total</p></div></div>
        {reviews.length === 0 ? (
          <p className="muted-text">No reviews yet — be the first!</p>
        ) : reviews.map(r => (
          <div key={r.id} className="list-row">
            <div style={{ flex: 1 }}>
              <div className="flex items-center gap-10 mb-8">
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, var(--teal), var(--blue))', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, color: '#000' }}>
                  {(r.client?.profile?.first_name?.[0] || 'A').toUpperCase()}
                </div>
                <strong style={{ fontSize: 14 }}>{r.client?.profile?.first_name || 'Client'}</strong>
                <span className="muted-text" style={{ fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <div className="mb-8"><Stars rating={r.rating} /></div>
              {r.comment && <p className="muted-text" style={{ fontSize: 14 }}>{r.comment}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* REPORT FORM */}
      {showReport && user?.id !== parseInt(coachId) && (
        <div className="card fade-up" style={{ borderColor: 'rgba(248,81,73,0.25)', background: 'rgba(248,81,73,0.04)' }}>
          <h2 style={{ color: 'var(--red)', marginBottom: 16 }}>Report this coach</h2>
          <form onSubmit={reportCoach} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label>Reason</label>
              <input value={reportForm.reason} onChange={e => setReportForm(f => ({ ...f, reason: e.target.value }))} placeholder="Misleading profile, abuse, spam…" />
            </div>
            <div className="form-group">
              <label>Details</label>
              <textarea rows={3} value={reportForm.details} onChange={e => setReportForm(f => ({ ...f, details: e.target.value }))} />
            </div>
            <div className="flex gap-10">
              <button type="submit" className="btn btn-danger btn-sm">Submit report</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowReport(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CoachProfile;
