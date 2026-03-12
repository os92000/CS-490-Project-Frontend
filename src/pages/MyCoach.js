import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { coachesAPI } from '../services/api';

const MyCoach = () => {
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    loadMyCoach();
  }, []);

  const loadMyCoach = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await coachesAPI.getMyCoach();
      if (response.data.success) {
        setCoach(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load coach:', err);
      if (err.response?.status === 404) {
        setError('You don\'t have an active coach yet. Browse coaches to find one!');
      } else {
        setError('Failed to load your coach. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      setSubmittingReview(true);
      setError('');
      setSuccessMessage('');

      const response = await coachesAPI.submitReview(coach.id, {
        rating,
        comment,
      });

      if (response.data.success) {
        setSuccessMessage('Review submitted successfully!');
        setShowReviewForm(false);
        setComment('');
        setRating(5);
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
      setError(err.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getDayName = (dayNum) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayNum] || '';
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '50px' }}>
        <p>Loading your coach...</p>
      </div>
    );
  }

  if (error && !coach) {
    return (
      <div className="container" style={{ maxWidth: '800px', marginTop: '50px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '50px' }}>
          <p style={{ color: '#666', fontSize: '18px', marginBottom: '30px' }}>
            {error}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/coaches')}
          >
            Browse Coaches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1000px', marginTop: '30px' }}>
      <h1>My Coach</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Your current fitness coach
      </p>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {/* Coach Card */}
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
            <h2 style={{ marginBottom: '10px' }}>
              {coach.profile?.first_name && coach.profile?.last_name
                ? `${coach.profile.first_name} ${coach.profile.last_name}`
                : 'Your Coach'}
            </h2>

            {coach.email && (
              <p style={{ color: '#666', marginBottom: '10px' }}>
                <strong>Email:</strong> {coach.email}
              </p>
            )}

            {coach.profile?.phone && (
              <p style={{ color: '#666', marginBottom: '10px' }}>
                <strong>Phone:</strong> {coach.profile.phone}
              </p>
            )}

            {coach.start_date && (
              <p style={{ color: '#666', marginBottom: '15px' }}>
                <strong>Coach since:</strong> {new Date(coach.start_date).toLocaleDateString()}
              </p>
            )}

            {coach.coach_info?.experience_years && (
              <p style={{ color: '#666', marginBottom: '10px' }}>
                <strong>Experience:</strong> {coach.coach_info.experience_years} years
              </p>
            )}

            <button
              className="btn btn-primary"
              style={{ marginTop: '15px' }}
              onClick={() => setShowReviewForm(!showReviewForm)}
            >
              {showReviewForm ? 'Cancel Review' : 'Leave a Review'}
            </button>
          </div>
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <div style={{ marginTop: '30px', paddingTop: '30px', borderTop: '2px solid #eee' }}>
            <h3 style={{ marginBottom: '20px' }}>Leave a Review</h3>
            <form onSubmit={handleSubmitReview}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                  Rating
                </label>
                <select
                  className="input"
                  value={rating}
                  onChange={(e) => setRating(parseInt(e.target.value))}
                  required
                >
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Very Good</option>
                  <option value="3">3 - Good</option>
                  <option value="2">2 - Fair</option>
                  <option value="1">1 - Poor</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                  Comment (Optional)
                </label>
                <textarea
                  className="input"
                  rows="4"
                  placeholder="Share your experience with this coach..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submittingReview}
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Bio */}
      {coach.coach_info?.bio && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h3>About Your Coach</h3>
          <p style={{ color: '#666', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {coach.coach_info.bio}
          </p>
        </div>
      )}

      {/* Certifications */}
      {coach.coach_info?.certifications && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h3>Certifications</h3>
          <p style={{ color: '#666', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {coach.coach_info.certifications}
          </p>
        </div>
      )}

      {/* Contact and Action Buttons */}
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/chat')}
        >
          Message Coach
        </button>
        <button
          className="btn"
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default MyCoach;
