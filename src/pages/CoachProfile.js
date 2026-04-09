import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coachesAPI } from '../services/api';

const CoachProfile = () => {
  const { coachId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [coach, setCoach] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [reportForm, setReportForm] = useState({ reason: '', details: '' });

  useEffect(() => {
    loadCoachData();
  }, [coachId]);

  const loadCoachData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load coach details
      const coachResponse = await coachesAPI.getCoachDetails(coachId);
      if (coachResponse.data.success) {
        setCoach(coachResponse.data.data);
      }

      // Load reviews
      const reviewsResponse = await coachesAPI.getCoachReviews(coachId, { page: 1, per_page: 10 });
      if (reviewsResponse.data.success) {
        setReviews(reviewsResponse.data.data.reviews);
      }
    } catch (err) {
      console.error('Failed to load coach data:', err);
      setError('Failed to load coach profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendHireRequest = async () => {
    try {
      setSendingRequest(true);
      setError('');
      setSuccessMessage('');

      const response = await coachesAPI.sendHireRequest(coachId);

      if (response.data.success) {
        setSuccessMessage('Hire request sent successfully! The coach will review your request.');
      }
    } catch (err) {
      console.error('Failed to send hire request:', err);
      setError(err.response?.data?.message || 'Failed to send hire request. Please try again.');
    } finally {
      setSendingRequest(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ color: i <= rating ? '#FFD700' : '#ddd', fontSize: '24px' }}>
          ★
        </span>
      );
    }
    return stars;
  };

  const handleReportCoach = async (e) => {
    e.preventDefault();
    try {
      await coachesAPI.reportCoach(coachId, reportForm);
      setSuccessMessage('Coach reported successfully.');
      setReportForm({ reason: '', details: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to report coach.');
    }
  };

  const getDayName = (dayNum) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayNum] || '';
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '50px' }}>
        <p>Loading coach profile...</p>
      </div>
    );
  }

  if (error && !coach) {
    return (
      <div className="container" style={{ marginTop: '50px' }}>
        <div className="error-message">{error}</div>
        <button className="btn" onClick={() => navigate('/coaches')}>
          Back to Coaches
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1000px', marginTop: '30px' }}>
      {/* Back Button */}
      <button
        className="btn"
        onClick={() => navigate('/coaches')}
        style={{ marginBottom: '20px' }}
      >
        ← Back to Coaches
      </button>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {/* Coach Header */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
          {/* Avatar */}
          <div
            style={{
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              backgroundColor: '#4CAF50',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '64px',
              flexShrink: 0,
            }}
          >
            {coach.profile?.first_name?.[0] || coach.email[0].toUpperCase()}
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <h1 style={{ marginBottom: '10px' }}>
              {coach.profile?.first_name && coach.profile?.last_name
                ? `${coach.profile.first_name} ${coach.profile.last_name}`
                : 'Coach'}
            </h1>

            <div style={{ marginBottom: '15px' }}>
              {renderStars(Math.round(coach.rating?.average || 0))}
              <span style={{ color: '#666', marginLeft: '10px', fontSize: '18px' }}>
                {coach.rating?.average?.toFixed(1) || '0.0'} ({coach.rating?.count || 0} reviews)
              </span>
            </div>

            {coach.coach_info?.experience_years && (
              <p style={{ color: '#666', fontSize: '16px', marginBottom: '10px' }}>
                <strong>Experience:</strong> {coach.coach_info.experience_years} years
              </p>
            )}

            {coach.email && (
              <p style={{ color: '#666', fontSize: '16px', marginBottom: '10px' }}>
                <strong>Email:</strong> {coach.email}
              </p>
            )}

            {coach.profile?.phone && (
              <p style={{ color: '#666', fontSize: '16px', marginBottom: '10px' }}>
                <strong>Phone:</strong> {coach.profile.phone}
              </p>
            )}

            {/* Specializations */}
            {coach.specializations?.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <strong>Specializations:</strong>
                <div style={{ marginTop: '8px' }}>
                  {coach.specializations.map((spec) => (
                    <span
                      key={spec.id}
                      style={{
                        display: 'inline-block',
                        backgroundColor: '#e3f2fd',
                        color: '#1976d2',
                        padding: '6px 16px',
                        borderRadius: '16px',
                        fontSize: '14px',
                        marginRight: '10px',
                        marginBottom: '10px',
                      }}
                    >
                      {spec.specialization?.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Hire Button */}
            {user?.id !== parseInt(coachId) && (
              <button
                className="btn btn-primary"
                style={{ marginTop: '20px', fontSize: '18px', padding: '12px 30px' }}
                onClick={handleSendHireRequest}
                disabled={sendingRequest}
              >
                {sendingRequest ? 'Sending Request...' : 'Hire This Coach'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {coach.coach_info?.bio && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h2>About</h2>
          <p style={{ color: '#666', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {coach.coach_info.bio}
          </p>
        </div>
      )}

      {/* Certifications */}
      {coach.coach_info?.certifications && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h2>Certifications</h2>
          <p style={{ color: '#666', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {coach.coach_info.certifications}
          </p>
        </div>
      )}

      {/* Pricing */}
      {coach.pricing?.length > 0 && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h2>Pricing</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
            {coach.pricing.map((price) => (
              <div
                key={price.id}
                style={{
                  border: '2px solid #4CAF50',
                  borderRadius: '8px',
                  padding: '20px',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                  {price.session_type || 'Session'}
                </p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#4CAF50' }}>
                  ${price.price}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Availability */}
      {coach.availability?.length > 0 && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h2>Availability</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
            {coach.availability.map((slot) => (
              <div
                key={slot.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                }}
              >
                <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  {getDayName(slot.day_of_week)}
                </p>
                <p style={{ color: '#666' }}>
                  {slot.start_time} - {slot.end_time}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="card">
        <h2>Reviews ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p style={{ color: '#666' }}>No reviews yet.</p>
        ) : (
          <div>
            {reviews.map((review) => (
              <div
                key={review.id}
                style={{
                  borderBottom: '1px solid #eee',
                  padding: '20px 0',
                }}
              >
                <div style={{ marginBottom: '10px' }}>
                  {renderStars(review.rating)}
                  <span style={{ color: '#666', marginLeft: '10px' }}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                {review.client && (
                  <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                    {review.client.profile?.first_name || 'Anonymous'}
                  </p>
                )}
                {review.comment && (
                  <p style={{ color: '#666', lineHeight: '1.6' }}>
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {user?.id !== parseInt(coachId) && (
        <div className="card" style={{ marginTop: '30px' }}>
          <h2>Report Coach</h2>
          <form onSubmit={handleReportCoach}>
            <div className="form-group">
              <label>Reason</label>
              <input
                value={reportForm.reason}
                onChange={(e) => setReportForm({ ...reportForm, reason: e.target.value })}
                placeholder="Misleading profile, abuse, spam..."
              />
            </div>
            <div className="form-group">
              <label>Details</label>
              <textarea
                rows="4"
                value={reportForm.details}
                onChange={(e) => setReportForm({ ...reportForm, details: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-danger">Submit Report</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default CoachProfile;
