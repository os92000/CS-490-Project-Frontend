import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coachesAPI } from '../services/api';

const emptyForm = {
  first_name: '',
  last_name: '',
  bio: '',
  phone: '',
  experience_years: '',
  certifications: '',
  coach_bio: '',
  specialization_notes: '',
};

const CoachProfileSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const res = await coachesAPI.getMyCoachProfile();
      if (!res.data.success) {
        setError(res.data.message || 'Could not load your coach profile.');
        return;
      }
      const d = res.data.data;
      const info = d.coach_info || {};
      setForm({
        first_name: d.profile?.first_name || '',
        last_name: d.profile?.last_name || '',
        bio: d.profile?.bio || '',
        phone: d.profile?.phone || '',
        experience_years: info.experience_years != null ? String(info.experience_years) : '',
        certifications: info.certifications || '',
        coach_bio: info.bio || '',
        specialization_notes: info.specialization_notes || '',
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not load your coach profile.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!['coach', 'both'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }
    load();
  }, [user, navigate, load]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        first_name: form.first_name.trim() || null,
        last_name: form.last_name.trim() || null,
        bio: form.bio.trim() || null,
        phone: form.phone.trim() || null,
        certifications: form.certifications.trim() || null,
        coach_bio: form.coach_bio.trim() || null,
        specialization_notes: form.specialization_notes.trim() || null,
      };
      const ey = form.experience_years.trim();
      payload.experience_years = ey === '' ? null : parseInt(ey, 10);
      if (ey !== '' && Number.isNaN(payload.experience_years)) {
        setError('Years of experience must be a number.');
        setSaving(false);
        return;
      }

      const res = await coachesAPI.updateMyCoachProfile(payload);
      if (res.data.success) {
        setSuccess('Profile saved.');
        const d = res.data.data;
        const info = d.coach_info || {};
        setForm({
          first_name: d.profile?.first_name || '',
          last_name: d.profile?.last_name || '',
          bio: d.profile?.bio || '',
          phone: d.profile?.phone || '',
          experience_years: info.experience_years != null ? String(info.experience_years) : '',
          certifications: info.certifications || '',
          coach_bio: info.bio || '',
          specialization_notes: info.specialization_notes || '',
        });
      } else {
        setError(res.data.message || 'Save failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="container" style={{ marginTop: '40px' }}>
        <p>Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '720px', marginTop: '30px' }}>
      <button type="button" className="btn" onClick={() => navigate('/dashboard')} style={{ marginBottom: '16px' }}>
        ← Back to dashboard
      </button>

      <div className="card">
        <h1>Coach profile & qualifications</h1>
        <p style={{ color: '#666', marginBottom: '24px' }}>
          Update how you appear to clients and keep your coaching credentials current.
        </p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Basic info</h2>
          <div className="form-group">
            <label htmlFor="first_name">First name</label>
            <input id="first_name" name="first_name" value={form.first_name} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="last_name">Last name</label>
            <input id="last_name" name="last_name" value={form.last_name} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input id="phone" name="phone" value={form.phone} onChange={handleChange} placeholder="Optional" />
          </div>
          <div className="form-group">
            <label htmlFor="bio">Short profile bio</label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              value={form.bio}
              onChange={handleChange}
              placeholder="Optional — brief intro on your profile"
            />
          </div>

          <h2 style={{ fontSize: '1.1rem', margin: '24px 0 12px' }}>Qualifications & coaching focus</h2>
          <div className="form-group">
            <label htmlFor="experience_years">Years of experience</label>
            <input
              id="experience_years"
              name="experience_years"
              type="text"
              inputMode="numeric"
              value={form.experience_years}
              onChange={handleChange}
              placeholder="e.g. 5"
            />
          </div>
          <div className="form-group">
            <label htmlFor="certifications">Certifications</label>
            <textarea
              id="certifications"
              name="certifications"
              rows={4}
              value={form.certifications}
              onChange={handleChange}
              placeholder="Degrees, certs, licenses…"
            />
          </div>
          <div className="form-group">
            <label htmlFor="coach_bio">About (coaching)</label>
            <textarea
              id="coach_bio"
              name="coach_bio"
              rows={5}
              value={form.coach_bio}
              onChange={handleChange}
              placeholder="What clients see in your public “About” section"
            />
          </div>
          <div className="form-group">
            <label htmlFor="specialization_notes">Specialization notes</label>
            <textarea
              id="specialization_notes"
              name="specialization_notes"
              rows={3}
              value={form.specialization_notes}
              onChange={handleChange}
              placeholder="Areas you emphasize (text for now; tags may come later)"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: '8px' }}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CoachProfileSettings;
