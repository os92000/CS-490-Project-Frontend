import React, { useEffect, useState } from 'react';
import { coachesAPI } from '../services/api';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const CoachSettings = () => {
  const [specializations, setSpecializations] = useState([]);
  const [form, setForm] = useState({ experience_years:'', certifications:'', bio:'', specialization_notes:'', specialization_ids:[], availability:[], pricing:[{session_type:'Monthly Coaching',price:'',currency:'USD'}] });
  const [application, setApplication] = useState(null);
  const [appNotes, setAppNotes] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [sr, st] = await Promise.all([coachesAPI.getSpecializations(), coachesAPI.getCoachSettings()]);
      if (sr.data.success) setSpecializations(sr.data.data.specializations);
      if (st.data.success) {
        const d = st.data.data;
        setApplication(d.application || null);
        setAppNotes(d.application?.notes || '');
        setForm({ experience_years: d.coach_info?.experience_years||'', certifications: d.coach_info?.certifications||'', bio: d.coach_info?.bio||'', specialization_notes: d.coach_info?.specialization_notes||'', specialization_ids: d.specializations.map(s=>s.specialization_id), availability: d.availability.length>0?d.availability:[], pricing: d.pricing.length>0?d.pricing:[{session_type:'Monthly Coaching',price:'',currency:'USD'}] });
      }
    } catch { setError('Failed to load settings.'); }
  };

  const toggleSpec = id => setForm(f => ({ ...f, specialization_ids: f.specialization_ids.includes(id) ? f.specialization_ids.filter(x=>x!==id) : [...f.specialization_ids, id] }));
  const updAvail = (i,k,v) => { const a=[...form.availability]; a[i]={...a[i],[k]:v}; setForm({...form,availability:a}); };
  const updPrice = (i,k,v) => { const p=[...form.pricing]; p[i]={...p[i],[k]:v}; setForm({...form,pricing:p}); };

  const save = async e => {
    e.preventDefault(); setError(''); setMessage('');
    try { await coachesAPI.updateCoachSettings(form); setMessage('Settings saved.'); loadData(); }
    catch(err) { setError(err.response?.data?.message||'Failed to save.'); }
  };

  const submitApp = async () => {
    try { setError(''); await coachesAPI.submitCoachApplication({notes:appNotes}); setMessage('Application submitted for admin review.'); loadData(); }
    catch(err) { setError(err.response?.data?.message||'Failed to submit.'); }
  };

  const statusColor = { approved:'badge-green', pending:'badge-amber', denied:'badge-red' };

  return (
    <div className="container page-shell">
      <div className="page-hero fade-up">
        <div className="hero-copy">
          <p className="eyebrow">Coach workspace</p>
          <h1>Coach settings</h1>
          <p className="page-copy">Update your profile, specializations, availability, and pricing so clients can find and hire you.</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      {/* APPLICATION STATUS */}
      <div className="card fade-up">
        <div className="flex justify-between items-center flex-wrap gap-12" style={{ marginBottom: 16 }}>
          <div>
            <h2 style={{ marginBottom: 4 }}>Coach application</h2>
            <div className="flex items-center gap-10">
              <p className="muted-text">Status:</p>
              <span className={`badge ${statusColor[application?.status] || 'badge-muted'}`}>{application?.status || 'Not submitted'}</span>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={submitApp}>Submit for approval</button>
        </div>
        <div className="form-group">
          <label>Application notes</label>
          <textarea rows={3} value={appNotes} onChange={e => setAppNotes(e.target.value)} placeholder="Tell admins why you'd be a great coach on FitApp…" />
        </div>
      </div>

      <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="two-col fade-up fade-up-1">
          {/* PROFILE */}
          <div className="card">
            <h2 style={{ marginBottom: 18 }}>Coach profile</h2>
            <div className="form-group"><label>Years of experience</label><input type="number" value={form.experience_years} onChange={e => setForm(f=>({...f,experience_years:e.target.value}))} placeholder="e.g. 5" /></div>
            <div className="form-group" style={{ marginTop: 14 }}><label>Bio</label><textarea rows={4} value={form.bio} onChange={e => setForm(f=>({...f,bio:e.target.value}))} placeholder="Describe your coaching style and approach…" /></div>
            <div className="form-group" style={{ marginTop: 14 }}><label>Certifications</label><textarea rows={3} value={form.certifications} onChange={e => setForm(f=>({...f,certifications:e.target.value}))} placeholder="List your fitness certifications…" /></div>
            <div className="form-group" style={{ marginTop: 14 }}><label>Specialization notes</label><textarea rows={2} value={form.specialization_notes} onChange={e => setForm(f=>({...f,specialization_notes:e.target.value}))} /></div>
          </div>

          {/* SPECIALIZATIONS */}
          <div className="card">
            <h2 style={{ marginBottom: 18 }}>Specializations</h2>
            <p className="muted-text" style={{ marginBottom: 14 }}>Select all that apply. These appear on your public profile.</p>
            <div className="badge-picker">
              {specializations.map(s => (
                <button key={s.id} type="button" className={`badge-option ${form.specialization_ids.includes(s.id)?'selected':''}`} onClick={() => toggleSpec(s.id)}>{s.name}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="two-col fade-up fade-up-2">
          {/* AVAILABILITY */}
          <div className="card">
            <div className="section-header">
              <div><h2>Availability</h2><p className="muted-text">Days and hours you're available to coach</p></div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setForm(f=>({...f,availability:[...f.availability,{day_of_week:0,start_time:'09:00',end_time:'17:00'}]}))}>+ Add slot</button>
            </div>
            {form.availability.length === 0 ? <p className="muted-text">No slots added yet.</p> : form.availability.map((slot, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, marginBottom: 10 }}>
                <div className="form-group"><label>Day</label>
                  <select value={slot.day_of_week} onChange={e => updAvail(i,'day_of_week',parseInt(e.target.value))}>{DAYS.map((d,di)=><option key={d} value={di}>{d}</option>)}</select>
                </div>
                <div className="form-group"><label>Start</label><input type="time" value={slot.start_time} onChange={e => updAvail(i,'start_time',e.target.value)} /></div>
                <div className="form-group"><label>End</label><input type="time" value={slot.end_time} onChange={e => updAvail(i,'end_time',e.target.value)} /></div>
                <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-end', marginBottom: 2 }} onClick={() => setForm(f=>({...f,availability:f.availability.filter((_,j)=>j!==i)}))}>✕</button>
              </div>
            ))}
          </div>

          {/* PRICING */}
          <div className="card">
            <div className="section-header">
              <div><h2>Pricing</h2><p className="muted-text">Set your session rates</p></div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setForm(f=>({...f,pricing:[...f.pricing,{session_type:'',price:'',currency:'USD'}]}))}>+ Add price</button>
            </div>
            {form.pricing.map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px auto', gap: 10, marginBottom: 10 }}>
                <div className="form-group"><label>Session type</label><input value={item.session_type||''} onChange={e => updPrice(i,'session_type',e.target.value)} placeholder="e.g. Monthly" /></div>
                <div className="form-group"><label>Price (USD)</label><input type="number" value={item.price||''} onChange={e => updPrice(i,'price',e.target.value)} placeholder="75" /></div>
                <div className="form-group"><label>Currency</label><input value={item.currency||'USD'} onChange={e => updPrice(i,'currency',e.target.value)} /></div>
                <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-end', marginBottom: 2 }} onClick={() => setForm(f=>({...f,pricing:f.pricing.filter((_,j)=>j!==i)}))}>✕</button>
              </div>
            ))}
          </div>
        </div>

        <div className="fade-up">
          <button type="submit" className="btn btn-primary btn-lg">Save all settings</button>
        </div>
      </form>
    </div>
  );
};

export default CoachSettings;
