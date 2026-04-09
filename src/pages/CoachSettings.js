import React, { useEffect, useState } from 'react';
import { coachesAPI } from '../services/api';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const CoachSettings = () => {
  const [specializations, setSpecializations] = useState([]);
  const [form, setForm] = useState({
    experience_years: '',
    certifications: '',
    bio: '',
    specialization_notes: '',
    specialization_ids: [],
    availability: [],
    pricing: [{ session_type: 'Monthly Coaching', price: '', currency: 'USD' }],
  });
  const [application, setApplication] = useState(null);
  const [applicationNotes, setApplicationNotes] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [specializationsResponse, settingsResponse] = await Promise.all([
        coachesAPI.getSpecializations(),
        coachesAPI.getCoachSettings(),
      ]);

      if (specializationsResponse.data.success) {
        setSpecializations(specializationsResponse.data.data.specializations);
      }

      if (settingsResponse.data.success) {
        const data = settingsResponse.data.data;
        setApplication(data.application || null);
        setApplicationNotes(data.application?.notes || '');
        setForm({
          experience_years: data.coach_info?.experience_years || '',
          certifications: data.coach_info?.certifications || '',
          bio: data.coach_info?.bio || '',
          specialization_notes: data.coach_info?.specialization_notes || '',
          specialization_ids: data.specializations.map((item) => item.specialization_id),
          availability: data.availability.length > 0 ? data.availability : [],
          pricing: data.pricing.length > 0 ? data.pricing : [{ session_type: 'Monthly Coaching', price: '', currency: 'USD' }],
        });
      }
    } catch (err) {
      setError('Failed to load coach settings.');
    }
  };

  const toggleSpecialization = (id) => {
    setForm((current) => ({
      ...current,
      specialization_ids: current.specialization_ids.includes(id)
        ? current.specialization_ids.filter((item) => item !== id)
        : [...current.specialization_ids, id],
    }));
  };

  const updateAvailability = (index, field, value) => {
    const next = [...form.availability];
    next[index][field] = value;
    setForm({ ...form, availability: next });
  };

  const updatePricing = (index, field, value) => {
    const next = [...form.pricing];
    next[index][field] = value;
    setForm({ ...form, pricing: next });
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await coachesAPI.updateCoachSettings(form);
      setMessage('Coach settings updated successfully.');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update coach settings.');
    }
  };

  const submitApplication = async () => {
    try {
      setError('');
      await coachesAPI.submitCoachApplication({ notes: applicationNotes });
      setMessage('Coach application submitted for admin review.');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit coach application.');
    }
  };

  return (
    <div className="container page-shell">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Coach Settings</p>
          <h1>Profile details, specializations, availability, and pricing</h1>
          <p className="page-copy">Complete the coach profile so clients can view experience, rates, and available hours.</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      <div className="card">
        <h3>Coach Application</h3>
        <p className="muted-text">
          Status: <strong>{application?.status || 'not submitted'}</strong>
        </p>
        <div className="form-group" style={{ marginTop: '12px' }}>
          <label>Application Notes</label>
          <textarea rows="3" value={applicationNotes} onChange={(e) => setApplicationNotes(e.target.value)} />
        </div>
        <button type="button" className="btn btn-primary" onClick={submitApplication}>
          Submit for Approval
        </button>
      </div>

      <form onSubmit={saveSettings}>
        <div className="two-column-grid">
          <div className="card">
            <h3>Coach profile</h3>
            <div className="form-group">
              <label>Experience (years)</label>
              <input type="number" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Certifications</label>
              <textarea rows="4" value={form.certifications} onChange={(e) => setForm({ ...form, certifications: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea rows="5" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Specialization notes</label>
              <textarea rows="3" value={form.specialization_notes} onChange={(e) => setForm({ ...form, specialization_notes: e.target.value })} />
            </div>
          </div>

          <div className="card">
            <h3>Specializations</h3>
            <div className="badge-picker">
              {specializations.map((specialization) => (
                <button
                  key={specialization.id}
                  type="button"
                  className={`badge-option ${form.specialization_ids.includes(specialization.id) ? 'selected' : ''}`}
                  onClick={() => toggleSpecialization(specialization.id)}
                >
                  {specialization.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="two-column-grid">
          <div className="card">
            <div className="section-header">
              <h3>Availability</h3>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setForm({ ...form, availability: [...form.availability, { day_of_week: 0, start_time: '09:00', end_time: '17:00' }] })}
              >
                Add Slot
              </button>
            </div>
            {form.availability.length === 0 ? (
              <p className="muted-text">No availability saved yet.</p>
            ) : (
              form.availability.map((slot, index) => (
                <div key={`${slot.day_of_week}-${index}`} className="detail-grid compact-grid">
                  <div className="form-group">
                    <label>Day</label>
                    <select value={slot.day_of_week} onChange={(e) => updateAvailability(index, 'day_of_week', parseInt(e.target.value, 10))}>
                      {days.map((day, dayIndex) => <option key={day} value={dayIndex}>{day}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Start</label>
                    <input type="time" value={slot.start_time} onChange={(e) => updateAvailability(index, 'start_time', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>End</label>
                    <input type="time" value={slot.end_time} onChange={(e) => updateAvailability(index, 'end_time', e.target.value)} />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="card">
            <div className="section-header">
              <h3>Pricing</h3>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setForm({ ...form, pricing: [...form.pricing, { session_type: '', price: '', currency: 'USD' }] })}
              >
                Add Price
              </button>
            </div>
            {form.pricing.map((item, index) => (
              <div key={`${item.session_type}-${index}`} className="detail-grid compact-grid">
                <div className="form-group">
                  <label>Session Type</label>
                  <input value={item.session_type || ''} onChange={(e) => updatePricing(index, 'session_type', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Price</label>
                  <input type="number" value={item.price || ''} onChange={(e) => updatePricing(index, 'price', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Currency</label>
                  <input value={item.currency || 'USD'} onChange={(e) => updatePricing(index, 'currency', e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="btn btn-primary">Save Coach Settings</button>
      </form>
    </div>
  );
};

export default CoachSettings;
