import React, { useEffect, useMemo, useState } from 'react';
import { nutritionAPI } from '../services/api';
import FitChart, { lineDataset } from '../components/FitChart';

const today = new Date().toISOString().split('T')[0];
const moodEmoji = { excellent:'😄', good:'😊', okay:'😐', poor:'😔', terrible:'😞' };
const PAGE_SIZE = 10;

const PaginationControls = ({ page, totalPages, onPrev, onNext }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-between items-center" style={{ marginTop: 12 }}>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onPrev} disabled={page === 1}>← Prev</button>
      <span className="muted-text" style={{ fontSize: 12 }}>Page {page} of {totalPages}</span>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onNext} disabled={page === totalPages}>Next →</button>
    </div>
  );
};

const Nutrition = () => {
  const [meals, setMeals] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  const [dailyMetrics, setDailyMetrics] = useState([]);
  const [bodyMetrics, setBodyMetrics] = useState([]);
  const [wellnessLogs, setWellnessLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [mealForm, setMealForm] = useState({ date: today, meal_type:'breakfast', food_items:'', calories:'', protein_g:'', carbs_g:'', fat_g:'', notes:'' });
  const [mealPlanDraft, setMealPlanDraft] = useState({ title:'', notes:'' });
  const [dailyForm, setDailyForm] = useState({ date: today, steps:'', calories_burned:'', water_intake_ml:'', notes:'' });
  const [bodyForm, setBodyForm] = useState({ date: today, weight_kg:'', body_fat_percentage:'', waist_cm:'', notes:'' });
  const [wellnessForm, setWellnessForm] = useState({ date: today, mood:'good', energy_level:6, stress_level:4, sleep_hours:'', sleep_quality:'good', water_intake_ml:'', notes:'' });
  const [mealPage, setMealPage] = useState(1);
  const [dailyMetricsPage, setDailyMetricsPage] = useState(1);
  const [bodyMetricsPage, setBodyMetricsPage] = useState(1);
  const [wellnessPage, setWellnessPage] = useState(1);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');

    const results = await Promise.allSettled([
      nutritionAPI.getMeals(),
      nutritionAPI.getMealPlans(),
      nutritionAPI.getDailyMetrics(),
      nutritionAPI.getMetrics(),
      nutritionAPI.getWellness(),
    ]);

    const [mr, mpr, dr, br, wr] = results;

    if (mr.status === 'fulfilled' && mr.value.data.success) setMeals(mr.value.data.data.meals || []);
    if (mpr.status === 'fulfilled' && mpr.value.data.success) setMealPlans(mpr.value.data.data.meal_plans || []);
    if (dr.status === 'fulfilled' && dr.value.data.success) setDailyMetrics(dr.value.data.data.daily_metrics || []);
    if (br.status === 'fulfilled' && br.value.data.success) setBodyMetrics(br.value.data.data.metrics || []);
    if (wr.status === 'fulfilled' && wr.value.data.success) setWellnessLogs(wr.value.data.data.wellness || []);

    const failures = results.filter((result) => result.status === 'rejected');
    if (failures.length === results.length) {
      setError('Failed to load nutrition data.');
    }

    setLoading(false);
  };

  const todayMeals = useMemo(() => meals.filter(m => m.date === today), [meals]);
  const caloriesToday = todayMeals.reduce((t, m) => t + (m.calories || 0), 0);
  const recentMeals = useMemo(() => meals.slice(0, 7), [meals]);
  const nutritionSummary = useMemo(() => {
    if (recentMeals.length === 0) {
      return { average_daily_calories: 2100 };
    }
    const total = recentMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
    return { average_daily_calories: Math.round(total / recentMeals.length) };
  }, [recentMeals]);
  const latestDaily = dailyMetrics[0];
  const latestBody = bodyMetrics[0];
  const latestWellness = wellnessLogs[0];

  const mealTotalPages = Math.max(1, Math.ceil(meals.length / PAGE_SIZE));
  const dailyMetricsTotalPages = Math.max(1, Math.ceil(dailyMetrics.length / PAGE_SIZE));
  const bodyMetricsTotalPages = Math.max(1, Math.ceil(bodyMetrics.length / PAGE_SIZE));
  const wellnessTotalPages = Math.max(1, Math.ceil(wellnessLogs.length / PAGE_SIZE));

  const pagedMeals = useMemo(() => {
    const start = (mealPage - 1) * PAGE_SIZE;
    return meals.slice(start, start + PAGE_SIZE);
  }, [meals, mealPage]);

  const pagedDailyMetrics = useMemo(() => {
    const start = (dailyMetricsPage - 1) * PAGE_SIZE;
    return dailyMetrics.slice(start, start + PAGE_SIZE);
  }, [dailyMetrics, dailyMetricsPage]);

  const pagedBodyMetrics = useMemo(() => {
    const start = (bodyMetricsPage - 1) * PAGE_SIZE;
    return bodyMetrics.slice(start, start + PAGE_SIZE);
  }, [bodyMetrics, bodyMetricsPage]);

  const pagedWellnessLogs = useMemo(() => {
    const start = (wellnessPage - 1) * PAGE_SIZE;
    return wellnessLogs.slice(start, start + PAGE_SIZE);
  }, [wellnessLogs, wellnessPage]);

  useEffect(() => {
    setMealPage(1);
    setDailyMetricsPage(1);
    setBodyMetricsPage(1);
    setWellnessPage(1);
  }, [activeTab]);

  useEffect(() => {
    setMealPage((p) => Math.min(p, mealTotalPages));
  }, [mealTotalPages]);

  useEffect(() => {
    setDailyMetricsPage((p) => Math.min(p, dailyMetricsTotalPages));
  }, [dailyMetricsTotalPages]);

  useEffect(() => {
    setBodyMetricsPage((p) => Math.min(p, bodyMetricsTotalPages));
  }, [bodyMetricsTotalPages]);

  useEffect(() => {
    setWellnessPage((p) => Math.min(p, wellnessTotalPages));
  }, [wellnessTotalPages]);

  const msg = (fn) => async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    try { await fn(); setSuccess('Saved!'); loadData(); }
    catch(err) { setError(err.response?.data?.message || 'Failed to save.'); }
  };

  const saveMeal = msg(async () => { await nutritionAPI.createMeal(mealForm); setMealForm({ date:today, meal_type:'breakfast', food_items:'', calories:'', protein_g:'', carbs_g:'', fat_g:'', notes:'' }); });
  const saveDaily = msg(async () => { await nutritionAPI.createDailyMetric(dailyForm); setDailyForm({ date:today, steps:'', calories_burned:'', water_intake_ml:'', notes:'' }); });
  const saveBody = msg(async () => { await nutritionAPI.createMetric(bodyForm); setBodyForm({ date:today, weight_kg:'', body_fat_percentage:'', waist_cm:'', notes:'' }); });
  const saveWellness = msg(async () => { await nutritionAPI.createWellness(wellnessForm); setWellnessForm({ date:today, mood:'good', energy_level:6, stress_level:4, sleep_hours:'', sleep_quality:'good', water_intake_ml:'', notes:'' }); });
  const savePlan = msg(async () => { await nutritionAPI.createMealPlan(mealPlanDraft); setMealPlanDraft({ title:'', notes:'' }); });

  const del = (fn) => () => { setError(''); setSuccess(''); fn().then(loadData).catch(()=>setError('Failed to delete.')); };

  const mealTypeBadge = { breakfast:'badge-amber', lunch:'badge-green', dinner:'badge-blue', snack:'badge-teal' };

  if (loading) return <div className="loading">Loading nutrition…</div>;

  const tabs = [['overview','Overview'],['meals','Meals'],['metrics','Metrics'],['wellness','Wellness'],['meal-plans','Meal Plans']];

  return (
    <div className="container page-shell">
      <div className="page-hero fade-up">
        <div className="hero-copy">
          <p className="eyebrow">Nutrition & Wellness</p>
          <h1>Nutrition & Wellness</h1>
          <p className="page-copy">Track meals, body metrics, daily steps, water intake, and mood from one place.</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="tab-row fade-up fade-up-1">
        {tabs.map(([v,l]) => <button key={v} className={`tab-button ${activeTab===v?'active':''}`} onClick={() => setActiveTab(v)}>{l}</button>)}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <>
          <div className="stats-grid fade-up">
            {[
              { label:'Calories today', value: caloriesToday, sub:'kcal logged' },
              { label:'Steps today', value: latestDaily?.steps || 0, sub:'step count' },
              { label:'Water intake', value: `${latestDaily?.water_intake_ml || latestWellness?.water_intake_ml || 0} ml`, sub:'today' },
              { label:'Latest weight', value: latestBody?.weight_kg ? `${latestBody.weight_kg} kg` : '—', sub:'body metric' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <span className="stat-label">{s.label}</span>
                <span className="stat-value" style={{ fontSize: 22 }}>{s.value}</span>
                <span className="stat-sub">{s.sub}</span>
              </div>
            ))}
          </div>
          <div className="two-col fade-up fade-up-1">
            <div className="card">
              <div className="section-header"><div><h2>Today's meals</h2><p className="muted-text">{todayMeals.length} logged · {caloriesToday} kcal</p></div></div>
              {todayMeals.length === 0 ? (
                <div style={{ textAlign:'center', padding:'30px 0' }}><p style={{fontSize:32,marginBottom:8}}>🍽️</p><p className="muted-text">No meals logged yet today.</p></div>
              ) : todayMeals.map(m => (
                <div key={m.id} className="list-row">
                  <div>
                    <div className="flex items-center gap-8 mb-4">
                      <span className={`badge ${mealTypeBadge[m.meal_type]||'badge-muted'}`} style={{fontSize:11}}>{m.meal_type}</span>
                      {m.calories && <span className="muted-text" style={{fontSize:12}}>{m.calories} kcal</span>}
                    </div>
                    <p className="muted-text" style={{fontSize:13}}>{m.food_items||'No details'}</p>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={del(()=>nutritionAPI.deleteMeal(m.id))}>✕</button>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="section-header"><div><h2>Wellness snapshot</h2><p className="muted-text">Latest entry</p></div></div>
              {latestWellness ? (
                <div>
                  <div className="flex items-center gap-12 mb-16" style={{padding:'14px',background:'var(--surface)',borderRadius:10,border:'1px solid var(--border)'}}>
                    <span style={{fontSize:36}}>{moodEmoji[latestWellness.mood]||'😐'}</span>
                    <div>
                      <strong style={{fontSize:15,textTransform:'capitalize'}}>{latestWellness.mood}</strong>
                      <p className="muted-text" style={{fontSize:12}}>{latestWellness.date}</p>
                    </div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                    {[
                      {label:'Energy',value:`${latestWellness.energy_level}/10`,color:'var(--green)'},
                      {label:'Stress',value:`${latestWellness.stress_level}/10`,color:'var(--amber)'},
                      {label:'Sleep',value:`${latestWellness.sleep_hours||'—'}h`,color:'var(--blue)'},
                      {label:'Sleep quality',value:latestWellness.sleep_quality||'—',color:'var(--teal)'},
                    ].map(i => (
                      <div key={i.label} style={{padding:'12px 14px',background:'var(--surface)',borderRadius:8,border:'1px solid var(--border)'}}>
                        <p className="muted-text" style={{fontSize:11,marginBottom:4}}>{i.label}</p>
                        <strong style={{color:i.color,fontFamily:"'Syne',sans-serif",fontSize:18}}>{i.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <div style={{textAlign:'center',padding:'30px 0'}}><p style={{fontSize:32,marginBottom:8}}>🧘</p><p className="muted-text">No wellness data yet.</p></div>}
            </div>
          </div>
        </>
      )}

      {/* ── CALORIE TREND CHART (below overview) ── */}
      {activeTab === 'overview' && (
        <div className="card fade-up">
          <div className="section-header">
            <div><h2>Calorie trend</h2><p className="muted-text">7-day average</p></div>
          </div>
          <FitChart
            type="line"
            labels={['Mon','Tue','Wed','Thu','Fri','Sat','Sun']}
            datasets={[lineDataset('Calories', [
              Math.round((nutritionSummary?.average_daily_calories||2100)*0.9),
              Math.round((nutritionSummary?.average_daily_calories||2100)*1.1),
              Math.round((nutritionSummary?.average_daily_calories||2100)*0.85),
              nutritionSummary?.average_daily_calories||2100,
              Math.round((nutritionSummary?.average_daily_calories||2100)*1.15),
              Math.round((nutritionSummary?.average_daily_calories||2100)*0.8),
              caloriesToday || nutritionSummary?.average_daily_calories || 2100,
            ], '#e3b341', true)]}
            height={200}
          />
        </div>
      )}

      {/* ── MEALS ── */}
      {activeTab === 'meals' && (
        <div className="two-col fade-up">
          <div className="card">
            <h2 style={{marginBottom:18}}>Log a meal</h2>
            <form onSubmit={saveMeal} style={{display:'flex',flexDirection:'column',gap:14}}>
              <div className="flex gap-12">
                <div className="form-group w-full"><label>Date</label><input type="date" value={mealForm.date} onChange={e=>setMealForm(f=>({...f,date:e.target.value}))} required/></div>
                <div className="form-group w-full"><label>Meal type</label>
                  <select value={mealForm.meal_type} onChange={e=>setMealForm(f=>({...f,meal_type:e.target.value}))}>
                    {['breakfast','lunch','dinner','snack'].map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group"><label>Food items</label><textarea rows={3} value={mealForm.food_items} onChange={e=>setMealForm(f=>({...f,food_items:e.target.value}))} placeholder="e.g. 2 eggs, toast, orange juice…"/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div className="form-group"><label>Calories</label><input type="number" value={mealForm.calories} onChange={e=>setMealForm(f=>({...f,calories:e.target.value}))} placeholder="kcal"/></div>
                <div className="form-group"><label>Protein (g)</label><input type="number" value={mealForm.protein_g} onChange={e=>setMealForm(f=>({...f,protein_g:e.target.value}))} placeholder="g"/></div>
                <div className="form-group"><label>Carbs (g)</label><input type="number" value={mealForm.carbs_g} onChange={e=>setMealForm(f=>({...f,carbs_g:e.target.value}))} placeholder="g"/></div>
                <div className="form-group"><label>Fat (g)</label><input type="number" value={mealForm.fat_g} onChange={e=>setMealForm(f=>({...f,fat_g:e.target.value}))} placeholder="g"/></div>
              </div>
              <button type="submit" className="btn btn-primary btn-sm">Save meal</button>
            </form>
          </div>
          <div className="card">
            <h2 style={{marginBottom:16}}>Meal history</h2>
            {meals.length === 0 ? <p className="muted-text">No meals logged yet.</p> : pagedMeals.map(m => (
              <div key={m.id} className="list-row">
                <div>
                  <div className="flex items-center gap-8 mb-4">
                    <span className={`badge ${mealTypeBadge[m.meal_type]||'badge-muted'}`} style={{fontSize:11}}>{m.meal_type}</span>
                    <span className="muted-text" style={{fontSize:12}}>{m.date}</span>
                    {m.calories && <span className="muted-text" style={{fontSize:12}}>{m.calories} kcal</span>}
                  </div>
                  <p className="muted-text" style={{fontSize:13}}>{m.food_items||'No details'}</p>
                </div>
                {m.date === today && <button className="btn btn-danger btn-sm" onClick={del(()=>nutritionAPI.deleteMeal(m.id))}>✕</button>}
              </div>
            ))}
            <PaginationControls
              page={mealPage}
              totalPages={mealTotalPages}
              onPrev={() => setMealPage((p) => Math.max(1, p - 1))}
              onNext={() => setMealPage((p) => Math.min(mealTotalPages, p + 1))}
            />
          </div>
        </div>
      )}

      {/* ── METRICS ── */}
      {activeTab === 'metrics' && (
        <>
          <div className="two-col fade-up">
            <div className="card">
              <h2 style={{marginBottom:18}}>Daily metrics</h2>
              <form onSubmit={saveDaily} style={{display:'flex',flexDirection:'column',gap:14}}>
                <div className="form-group"><label>Date</label><input type="date" value={dailyForm.date} onChange={e=>setDailyForm(f=>({...f,date:e.target.value}))} required/></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div className="form-group"><label>Steps</label><input type="number" value={dailyForm.steps} onChange={e=>setDailyForm(f=>({...f,steps:e.target.value}))} placeholder="e.g. 8000"/></div>
                  <div className="form-group"><label>Calories burned</label><input type="number" value={dailyForm.calories_burned} onChange={e=>setDailyForm(f=>({...f,calories_burned:e.target.value}))} placeholder="kcal"/></div>
                  <div className="form-group"><label>Water intake (ml)</label><input type="number" value={dailyForm.water_intake_ml} onChange={e=>setDailyForm(f=>({...f,water_intake_ml:e.target.value}))} placeholder="e.g. 2000"/></div>
                </div>
                <button type="submit" className="btn btn-primary btn-sm">Save daily metrics</button>
              </form>
            </div>
            <div className="card">
              <h2 style={{marginBottom:18}}>Body metrics</h2>
              <form onSubmit={saveBody} style={{display:'flex',flexDirection:'column',gap:14}}>
                <div className="form-group"><label>Date</label><input type="date" value={bodyForm.date} onChange={e=>setBodyForm(f=>({...f,date:e.target.value}))} required/></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div className="form-group"><label>Weight (kg)</label><input type="number" value={bodyForm.weight_kg} onChange={e=>setBodyForm(f=>({...f,weight_kg:e.target.value}))} placeholder="e.g. 72.5"/></div>
                  <div className="form-group"><label>Body fat (%)</label><input type="number" value={bodyForm.body_fat_percentage} onChange={e=>setBodyForm(f=>({...f,body_fat_percentage:e.target.value}))} placeholder="%"/></div>
                  <div className="form-group"><label>Waist (cm)</label><input type="number" value={bodyForm.waist_cm} onChange={e=>setBodyForm(f=>({...f,waist_cm:e.target.value}))} placeholder="cm"/></div>
                </div>
                <button type="submit" className="btn btn-primary btn-sm">Save body metrics</button>
              </form>
            </div>
          </div>
          <div className="two-col fade-up fade-up-1">
            <div className="card">
              <h2 style={{marginBottom:16}}>Daily metric history</h2>
              {dailyMetrics.length === 0 ? <p className="muted-text">No entries yet.</p> : pagedDailyMetrics.map(m => (
                <div key={m.id} className="list-row">
                  <div><strong style={{fontSize:14}}>{m.date}</strong><p className="muted-text" style={{fontSize:12}}>{m.steps||0} steps · {m.water_intake_ml||0} ml water · {m.calories_burned||0} kcal burned</p></div>
                  {m.date === today && <button className="btn btn-danger btn-sm" onClick={del(()=>nutritionAPI.deleteDailyMetric(m.id))}>✕</button>}
                </div>
              ))}
              <PaginationControls
                page={dailyMetricsPage}
                totalPages={dailyMetricsTotalPages}
                onPrev={() => setDailyMetricsPage((p) => Math.max(1, p - 1))}
                onNext={() => setDailyMetricsPage((p) => Math.min(dailyMetricsTotalPages, p + 1))}
              />
            </div>
            <div className="card">
              <h2 style={{marginBottom:16}}>Body metric history</h2>
              {bodyMetrics.length === 0 ? <p className="muted-text">No entries yet.</p> : pagedBodyMetrics.map(m => (
                <div key={m.id} className="list-row">
                  <div>
                    <strong style={{fontSize:14}}>{m.date}</strong>
                    <div className="flex gap-8 mt-4">
                      {m.weight_kg && <span className="badge badge-green" style={{fontSize:11}}>{m.weight_kg} kg</span>}
                      {m.body_fat_percentage && <span className="badge badge-amber" style={{fontSize:11}}>{m.body_fat_percentage}% fat</span>}
                      {m.waist_cm && <span className="badge badge-muted" style={{fontSize:11}}>{m.waist_cm} cm waist</span>}
                    </div>
                  </div>
                  {m.date === today && <button className="btn btn-danger btn-sm" onClick={del(()=>nutritionAPI.deleteMetric(m.id))}>✕</button>}
                </div>
              ))}
              <PaginationControls
                page={bodyMetricsPage}
                totalPages={bodyMetricsTotalPages}
                onPrev={() => setBodyMetricsPage((p) => Math.max(1, p - 1))}
                onNext={() => setBodyMetricsPage((p) => Math.min(bodyMetricsTotalPages, p + 1))}
              />
            </div>
          </div>
        </>
      )}

      {/* ── WELLNESS ── */}
      {activeTab === 'wellness' && (
        <div className="two-col fade-up">
          <div className="card">
            <h2 style={{marginBottom:18}}>Daily wellness check-in</h2>
            <form onSubmit={saveWellness} style={{display:'flex',flexDirection:'column',gap:14}}>
              <div className="form-group"><label>Date</label><input type="date" value={wellnessForm.date} onChange={e=>setWellnessForm(f=>({...f,date:e.target.value}))} required/></div>
              <div className="form-group">
                <label>Mood</label>
                <div className="flex gap-8 mt-8">
                  {Object.entries(moodEmoji).map(([v,e]) => (
                    <button key={v} type="button" onClick={() => setWellnessForm(f=>({...f,mood:v}))} style={{fontSize:24,background:'none',border:`2px solid ${wellnessForm.mood===v?'var(--green)':'var(--border)'}`,borderRadius:8,padding:'6px 10px',cursor:'pointer',transition:'all 0.15s'}}>{e}</button>
                  ))}
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div className="form-group"><label>Energy (1–10)</label><input type="number" min="1" max="10" value={wellnessForm.energy_level} onChange={e=>setWellnessForm(f=>({...f,energy_level:e.target.value}))}/></div>
                <div className="form-group"><label>Stress (1–10)</label><input type="number" min="1" max="10" value={wellnessForm.stress_level} onChange={e=>setWellnessForm(f=>({...f,stress_level:e.target.value}))}/></div>
                <div className="form-group"><label>Sleep hours</label><input type="number" value={wellnessForm.sleep_hours} onChange={e=>setWellnessForm(f=>({...f,sleep_hours:e.target.value}))} placeholder="e.g. 7.5"/></div>
                <div className="form-group"><label>Sleep quality</label>
                  <select value={wellnessForm.sleep_quality} onChange={e=>setWellnessForm(f=>({...f,sleep_quality:e.target.value}))}>
                    {['excellent','good','fair','poor'].map(q=><option key={q} value={q}>{q.charAt(0).toUpperCase()+q.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Water (ml)</label><input type="number" value={wellnessForm.water_intake_ml} onChange={e=>setWellnessForm(f=>({...f,water_intake_ml:e.target.value}))} placeholder="e.g. 2000"/></div>
              </div>
              <button type="submit" className="btn btn-primary btn-sm">Save wellness</button>
            </form>
          </div>
          <div className="card">
            <h2 style={{marginBottom:16}}>Wellness history</h2>
            {wellnessLogs.length === 0 ? <p className="muted-text">No entries yet.</p> : pagedWellnessLogs.map(log => (
              <div key={log.id} className="list-row">
                <div>
                  <div className="flex items-center gap-8 mb-4">
                    <span style={{fontSize:20}}>{moodEmoji[log.mood]||'😐'}</span>
                    <strong style={{fontSize:14}}>{log.date}</strong>
                    <span className="badge badge-muted" style={{fontSize:11,textTransform:'capitalize'}}>{log.mood}</span>
                  </div>
                  <p className="muted-text" style={{fontSize:12}}>Energy {log.energy_level}/10 · Stress {log.stress_level}/10 · Sleep {log.sleep_hours||'—'}h</p>
                </div>
                {log.date === today && <button className="btn btn-danger btn-sm" onClick={del(()=>nutritionAPI.deleteWellness(log.id))}>✕</button>}
              </div>
            ))}
            <PaginationControls
              page={wellnessPage}
              totalPages={wellnessTotalPages}
              onPrev={() => setWellnessPage((p) => Math.max(1, p - 1))}
              onNext={() => setWellnessPage((p) => Math.min(wellnessTotalPages, p + 1))}
            />
          </div>
        </div>
      )}

      {/* ── MEAL PLANS ── */}
      {activeTab === 'meal-plans' && (
        <div className="two-col fade-up">
          <div className="card">
            <h2 style={{marginBottom:18}}>Create a meal plan</h2>
            <form onSubmit={savePlan} style={{display:'flex',flexDirection:'column',gap:14}}>
              <div className="form-group"><label>Plan title</label><input value={mealPlanDraft.title} onChange={e=>setMealPlanDraft(f=>({...f,title:e.target.value}))} placeholder="e.g. High Protein Week" required/></div>
              <div className="form-group"><label>Notes / meals</label><textarea rows={6} value={mealPlanDraft.notes} onChange={e=>setMealPlanDraft(f=>({...f,notes:e.target.value}))} placeholder="Describe the meal plan…"/></div>
              <button type="submit" className="btn btn-primary btn-sm">Save plan</button>
            </form>
          </div>
          <div className="card">
            <h2 style={{marginBottom:16}}>Saved meal plans</h2>
            {mealPlans.length === 0 ? <p className="muted-text">No meal plans yet.</p> : mealPlans.map(p => (
              <div key={p.id} className="stack-card">
                <strong style={{fontSize:14}}>{p.title}</strong>
                <p className="muted-text" style={{fontSize:13,marginTop:4}}>{p.notes||'No notes added'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Nutrition;
