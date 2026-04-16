import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { coachesAPI, workoutsAPI } from '../services/api';

const CreateWorkoutPlan = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [planForm, setPlanForm] = useState({
    name:'', description:'', client_id:'', start_date:'', end_date:'',
    metadata:{ goal:'', difficulty:'', plan_type:'', duration_weeks:'' },
    days:[]
  });

  useEffect(() => {
    Promise.all([coachesAPI.getMyClients(), workoutsAPI.getExercises()])
      .then(([cr, er]) => {
        if (cr.data.success) setClients(cr.data.data.clients.filter(c=>c.status==='active'));
        if (er.data.success) setExercises(er.data.data.exercises);
      })
      .catch(() => setError('Failed to load data.'))
      .finally(() => setLoading(false));
  }, []);

  const setMeta = (k,v) => setPlanForm(f=>({...f,metadata:{...f.meta,...f.metadata,[k]:v}}));
  const addDay = () => setPlanForm(f=>({...f,days:[...f.days,{name:`Day ${f.days.length+1}`,day_number:f.days.length+1,notes:'',exercises:[]}]}));
  const removeDay = i => setPlanForm(f=>({...f,days:f.days.filter((_,j)=>j!==i)}));
  const updDay = (i,k,v) => { const d=[...planForm.days]; d[i]={...d[i],[k]:v}; setPlanForm(f=>({...f,days:d})); };
  const addEx = i => { const d=[...planForm.days]; d[i].exercises.push({exercise_id:exercises[0]?.id||'',sets:3,reps:'10',weight:'bodyweight',rest_seconds:60,notes:''}); setPlanForm(f=>({...f,days:d})); };
  const removeEx = (di,ei) => { const d=[...planForm.days]; d[di].exercises=d[di].exercises.filter((_,j)=>j!==ei); setPlanForm(f=>({...f,days:d})); };
  const updEx = (di,ei,k,v) => { const d=[...planForm.days]; d[di].exercises[ei]={...d[di].exercises[ei],[k]:v}; setPlanForm(f=>({...f,days:d})); };

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setSuccess('');
    if (!planForm.client_id) { setError('Please select a client.'); return; }
    try {
      const res = await workoutsAPI.createWorkoutPlan(planForm);
      if (res.data.success) { setSuccess('Workout plan created!'); setTimeout(() => navigate('/my-workouts'), 1800); }
    } catch(err) { setError(err.response?.data?.message || 'Failed to create plan.'); }
  };

  const saveTemplate = async () => {
    setError(''); setSuccess('');
    if (!planForm.name || planForm.days.length === 0) { setError('Add a name and at least one day before saving a template.'); return; }
    try {
      await workoutsAPI.createTemplate({ name:planForm.name, description:planForm.description, goal:planForm.metadata.goal, difficulty:planForm.metadata.difficulty, plan_type:planForm.metadata.plan_type, duration_weeks:planForm.metadata.duration_weeks, is_public:true, template_data:{days:planForm.days} });
      setSuccess('Template submitted for admin approval.');
    } catch(err) { setError(err.response?.data?.message || 'Failed to save template.'); }
  };

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <div className="container page-shell">
      <div className="page-hero fade-up">
        <div className="flex justify-between items-center flex-wrap gap-16">
          <div className="hero-copy">
            <p className="eyebrow">Coach workspace</p>
            <h1>Create workout plan</h1>
            <p className="page-copy">Build a custom workout plan for one of your clients, day by day.</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/my-workouts')}>← Back to plans</button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>

        {/* PLAN DETAILS */}
        <div className="card fade-up fade-up-1">
          <h2 style={{ marginBottom:18 }}>Plan details</h2>
          <div className="flex gap-12" style={{ flexWrap:'wrap' }}>
            <div className="form-group w-full">
              <label>Client *</label>
              <select value={planForm.client_id} onChange={e=>setPlanForm(f=>({...f,client_id:e.target.value}))} required>
                <option value="">Select a client</option>
                {clients.map(c=><option key={c.id} value={c.id}>{c.profile?.first_name||c.email}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group mt-12">
            <label>Plan name *</label>
            <input value={planForm.name} onChange={e=>setPlanForm(f=>({...f,name:e.target.value}))} placeholder="e.g. 4-Week Strength Builder" required/>
          </div>
          <div className="form-group mt-12">
            <label>Description</label>
            <textarea rows={2} value={planForm.description} onChange={e=>setPlanForm(f=>({...f,description:e.target.value}))} placeholder="Describe the goals and approach…"/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginTop:14 }}>
            <div className="form-group"><label>Start date</label><input type="date" value={planForm.start_date} onChange={e=>setPlanForm(f=>({...f,start_date:e.target.value}))}/></div>
            <div className="form-group"><label>End date</label><input type="date" value={planForm.end_date} onChange={e=>setPlanForm(f=>({...f,end_date:e.target.value}))}/></div>
            <div className="form-group"><label>Goal</label><input value={planForm.metadata.goal} onChange={e=>setMeta('goal',e.target.value)} placeholder="Fat loss, strength…"/></div>
            <div className="form-group"><label>Difficulty</label>
              <select value={planForm.metadata.difficulty} onChange={e=>setMeta('difficulty',e.target.value)}>
                <option value="">Select</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="form-group"><label>Plan type</label><input value={planForm.metadata.plan_type} onChange={e=>setMeta('plan_type',e.target.value)} placeholder="Full body, split…"/></div>
            <div className="form-group"><label>Duration (weeks)</label><input type="number" value={planForm.metadata.duration_weeks} onChange={e=>setMeta('duration_weeks',e.target.value)}/></div>
          </div>
        </div>

        {/* WORKOUT DAYS */}
        <div className="card fade-up fade-up-2">
          <div className="section-header">
            <div><h2>Workout days</h2><p className="muted-text">{planForm.days.length} day{planForm.days.length!==1?'s':''} added</p></div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addDay}>+ Add day</button>
          </div>

          {planForm.days.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 0' }}>
              <p style={{fontSize:32,marginBottom:8}}>💪</p>
              <p className="muted-text">No workout days yet. Click "+ Add day" to build your plan.</p>
            </div>
          ) : planForm.days.map((day, di) => (
            <div key={di} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:18, marginBottom:14 }}>
              <div className="flex justify-between items-center mb-12">
                <h3 style={{ color:'var(--green)' }}>Day {di+1}</h3>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeDay(di)}>Remove day</button>
              </div>
              <div className="flex gap-12 mb-12" style={{ flexWrap:'wrap' }}>
                <div className="form-group w-full"><label>Day name</label><input value={day.name} onChange={e=>updDay(di,'name',e.target.value)} placeholder="e.g. Upper Body, Leg Day"/></div>
                <div className="form-group w-full"><label>Notes</label><textarea rows={2} value={day.notes} onChange={e=>updDay(di,'notes',e.target.value)} placeholder="Instructions for this day…"/></div>
              </div>

              <div className="flex justify-between items-center mb-10">
                <strong style={{ fontSize:13, color:'var(--text-2)' }}>Exercises ({day.exercises.length})</strong>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => addEx(di)}>+ Add exercise</button>
              </div>

              {day.exercises.length === 0 ? (
                <p className="muted-text" style={{ fontSize:13, fontStyle:'italic' }}>No exercises yet.</p>
              ) : day.exercises.map((ex, ei) => (
                <div key={ei} style={{ background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:8, padding:14, marginBottom:10 }}>
                  <div className="flex justify-between items-center mb-10">
                    <div className="form-group w-full" style={{ marginBottom:0 }}>
                      <label>Exercise</label>
                      <select value={ex.exercise_id} onChange={e=>updEx(di,ei,'exercise_id',e.target.value)}>
                        {exercises.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                    </div>
                    <button type="button" className="btn btn-danger btn-sm" style={{ marginLeft:10, alignSelf:'flex-end' }} onClick={() => removeEx(di,ei)}>✕</button>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                    <div className="form-group"><label>Sets</label><input type="number" value={ex.sets} onChange={e=>updEx(di,ei,'sets',e.target.value)}/></div>
                    <div className="form-group"><label>Reps</label><input value={ex.reps} onChange={e=>updEx(di,ei,'reps',e.target.value)} placeholder="10-12"/></div>
                    <div className="form-group"><label>Weight</label><input value={ex.weight} onChange={e=>updEx(di,ei,'weight',e.target.value)} placeholder="20kg"/></div>
                    <div className="form-group"><label>Rest (sec)</label><input type="number" value={ex.rest_seconds} onChange={e=>updEx(di,ei,'rest_seconds',e.target.value)}/></div>
                  </div>
                  <div className="form-group mt-8"><label>Notes</label><input value={ex.notes} onChange={e=>updEx(di,ei,'notes',e.target.value)} placeholder="Exercise instructions…"/></div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* ACTIONS */}
        <div className="flex justify-between items-center flex-wrap gap-10 fade-up">
          <div className="flex gap-10">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/my-clients')}>Cancel</button>
          </div>
          <div className="flex gap-10">
            <button type="button" className="btn btn-secondary" onClick={saveTemplate}>Save as template</button>
            <button type="submit" className="btn btn-primary">Create workout plan</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateWorkoutPlan;
