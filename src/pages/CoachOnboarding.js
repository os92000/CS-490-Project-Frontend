import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { coachesAPI } from '../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const emptyAvailabilitySlot = () => ({ day_of_week: 0, start_time: '09:00', end_time: '17:00' });
const emptyPricingItem = () => ({ session_type: '', price: '', currency: 'USD' });

const CoachOnboarding = () => {
  const [specializations, setSpecializations] = useState([]);
  const [form, setForm] = useState({
    experience_years: '',
    certifications: '',
    bio: '',
    specialization_notes: '',
    specialization_ids: [],
    availability: [emptyAvailabilitySlot()],
    pricing: [emptyPricingItem()],
  });
  const [applicationNotes, setApplicationNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [specResponse, settingsResponse, applicationResponse] = await Promise.all([
        coachesAPI.getSpecializations(),
        coachesAPI.getCoachSettings(),
        coachesAPI.getCoachApplication(),
      ]);

      if (specResponse.data.success) {
        setSpecializations(specResponse.data.data.specializations || []);
      }

      if (settingsResponse.data.success) {
        const data = settingsResponse.data.data;
        setForm({
          experience_years: data.coach_info?.experience_years || '',
          certifications: data.coach_info?.certifications || '',
          bio: data.coach_info?.bio || '',
          specialization_notes: data.coach_info?.specialization_notes || '',
          specialization_ids: (data.specializations || []).map(item => item.specialization_id),
          availability: data.availability?.length ? data.availability : [emptyAvailabilitySlot()],
          pricing: data.pricing?.length ? data.pricing : [emptyPricingItem()],
        });
      }

      if (applicationResponse.data.success && applicationResponse.data.data) {
        setApplicationNotes(applicationResponse.data.data.notes || '');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load coach onboarding.');
    }
  };

  const updateField = (field, value) => {
    setForm(current => ({ ...current, [field]: value }));
    setError('');
  };

  const toggleSpecialization = (specializationId) => {
    setForm(current => ({
      ...current,
      specialization_ids: current.specialization_ids.includes(specializationId)
        ? current.specialization_ids.filter(item => item !== specializationId)
        : [...current.specialization_ids, specializationId],
    }));
    setError('');
  };

  const updateAvailability = (index, field, value) => {
    setForm(current => {
      const availability = [...current.availability];
      availability[index] = { ...availability[index], [field]: value };
      return { ...current, availability };
    });
    setError('');
  };

  const updatePricing = (index, field, value) => {
    setForm(current => {
      const pricing = [...current.pricing];
      pricing[index] = { ...pricing[index], [field]: value };
      return { ...current, pricing };
    });
    setError('');
  };

  const addAvailability = () => {
    setForm(current => ({
      ...current,
      availability: [...current.availability, emptyAvailabilitySlot()],
    }));
  };

  const addPricing = () => {
    setForm(current => ({
      ...current,
      pricing: [...current.pricing, emptyPricingItem()],
    }));
  };

  const removeAvailability = (index) => {
    setForm(current => ({
      ...current,
      availability: current.availability.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const removePricing = (index) => {
    setForm(current => ({
      ...current,
      pricing: current.pricing.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const validateForm = () => {
    const experienceYears = Number(form.experience_years);
    if (!Number.isFinite(experienceYears) || experienceYears < 0) {
      return 'Years of experience is required.';
    }
    if (!form.bio.trim()) {
      return 'Coach bio is required.';
    }
    if (!form.certifications.trim()) {
      return 'Certifications are required.';
    }
    if (!form.specialization_notes.trim()) {
      return 'Specialization notes are required.';
    }
    if (form.specialization_ids.length === 0) {
      return 'Select at least one specialization.';
    }
    if (form.availability.length === 0) {
      return 'Add at least one availability slot.';
    }
    for (const slot of form.availability) {
      if (slot.day_of_week === '' || slot.day_of_week === null || slot.day_of_week === undefined) {
        return 'Each availability slot needs a day.';
      }
      if (!slot.start_time || !slot.end_time) {
        return 'Each availability slot needs a start and end time.';
      }
      if (slot.start_time >= slot.end_time) {
        return 'Availability start time must be earlier than end time.';
      }
    }
    const pricingRows = form.pricing.filter(item => item.session_type || item.price || item.currency);
    if (pricingRows.length === 0) {
      return 'Add at least one pricing row.';
    }
    for (const row of pricingRows) {
      if (!row.session_type?.trim()) {
        return 'Each pricing row needs a session type.';
      }
      if (row.price === '' || row.price === null || row.price === undefined || Number(row.price) <= 0) {
        return 'Each pricing row needs a price greater than zero.';
      }
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const sanitizedPayload = {
        ...form,
        experience_years: Number(form.experience_years),
        availability: form.availability.map(slot => ({
          day_of_week: Number(slot.day_of_week),
          start_time: slot.start_time,
          end_time: slot.end_time,
        })),
        pricing: form.pricing
          .filter(item => item.session_type || item.price || item.currency)
          .map(item => ({
            session_type: item.session_type,
            price: Number(item.price),
            currency: (item.currency || 'USD').toUpperCase(),
          })),
      };

      const saveResponse = await coachesAPI.updateCoachSettings(sanitizedPayload);
      if (!saveResponse.data.success) {
        setError(saveResponse.data.message || 'Failed to save coach profile.');
        return;
      }

      const applicationResponse = await coachesAPI.submitCoachApplication({
        notes: applicationNotes.trim(),
      });
      if (!applicationResponse.data.success) {
        setError(applicationResponse.data.message || 'Failed to submit coach application.');
        return;
      }

      setMessage('Coach application submitted successfully.');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete coach onboarding.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container page-shell">
      <div className="page-hero fade-up">
        <div className="hero-copy">
          <p className="eyebrow">Coach onboarding</p>
          <h1>Complete your coach application</h1>
          <p className="page-copy">Fill out your coach profile, pricing, availability, and specializations before we submit your application for review.</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="two-col fade-up fade-up-1">
          <div className="card">
            <h2 style={{ marginBottom: 18 }}>Coach profile</h2>
            <div className="form-group">
              <label>Years of experience *</label>
              <input
                type="number"
                min="0"
                value={form.experience_years}
                onChange={e => updateField('experience_years', e.target.value)}
                placeholder="e.g. 5"
                required
              />
            </div>
            <div className="form-group" style={{ marginTop: 14 }}>
              <label>Bio *</label>
              <textarea
                rows={4}
                value={form.bio}
                onChange={e => updateField('bio', e.target.value)}
                placeholder="Describe your coaching style and approach…"
                required
              />
            </div>
            <div className="form-group" style={{ marginTop: 14 }}>
              <label>Certifications *</label>
              <textarea
                rows={3}
                value={form.certifications}
                onChange={e => updateField('certifications', e.target.value)}
                placeholder="List your fitness certifications…"
                required
              />
            </div>
            <div className="form-group" style={{ marginTop: 14 }}>
              <label>Specialization notes *</label>
              <textarea
                rows={2}
                value={form.specialization_notes}
                onChange={e => updateField('specialization_notes', e.target.value)}
                placeholder="What kind of clients or goals do you specialize in?"
                required
              />
            </div>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: 18 }}>Specializations *</h2>
            <p className="muted-text" style={{ marginBottom: 14 }}>Select all that apply. These appear on your public profile.</p>
            <div className="badge-picker">
              {specializations.map(specialization => (
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

        <div className="two-col fade-up fade-up-2">
          <div className="card">
            <div className="section-header">
              <div>
                <h2>Availability *</h2>
                <p className="muted-text">Days and hours you&apos;re available to coach</p>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addAvailability}>+ Add slot</button>
            </div>
            {form.availability.length === 0 ? (
              <p className="muted-text">No slots added yet.</p>
            ) : form.availability.map((slot, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, marginBottom: 10 }}>
                <div className="form-group">
                  <label>Day</label>
                  <select value={slot.day_of_week} onChange={e => updateAvailability(index, 'day_of_week', e.target.value)}>
                    {DAYS.map((day, dayIndex) => <option key={day} value={dayIndex}>{day}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Start</label>
                  <input type="time" value={slot.start_time} onChange={e => updateAvailability(index, 'start_time', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>End</label>
                  <input type="time" value={slot.end_time} onChange={e => updateAvailability(index, 'end_time', e.target.value)} required />
                </div>
                <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-end', marginBottom: 2 }} onClick={() => removeAvailability(index)}>✕</button>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="section-header">
              <div>
                <h2>Pricing *</h2>
                <p className="muted-text">Set your session rates</p>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addPricing}>+ Add price</button>
            </div>
            {form.pricing.map((item, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px auto', gap: 10, marginBottom: 10 }}>
                <div className="form-group">
                  <label>Session type</label>
                  <input value={item.session_type || ''} onChange={e => updatePricing(index, 'session_type', e.target.value)} placeholder="e.g. Monthly" required />
                </div>
                <div className="form-group">
                  <label>Price (USD)</label>
                  <input type="number" min="0" step="0.01" value={item.price || ''} onChange={e => updatePricing(index, 'price', e.target.value)} placeholder="75" required />
                </div>
                <div className="form-group">
                  <label>Currency</label>
                  <input value={item.currency || 'USD'} onChange={e => updatePricing(index, 'currency', e.target.value)} />
                </div>
                <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-end', marginBottom: 2 }} onClick={() => removePricing(index)}>✕</button>
              </div>
            ))}
          </div>
        </div>

        <div className="card fade-up">
          <h2 style={{ marginBottom: 14 }}>Application notes</h2>
          <p className="muted-text" style={{ marginBottom: 12 }}>Add a short note for the review team.</p>
          <div className="form-group">
            <textarea
              rows={3}
              value={applicationNotes}
              onChange={e => setApplicationNotes(e.target.value)}
              placeholder="Tell admins why you'd be a great coach on FitApp…"
            />
          </div>
        </div>

        <div className="fade-up">
          <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting…' : 'Submit coach application'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CoachOnboarding;
