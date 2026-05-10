import React, { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import Avatar from '../components/Avatar';
import FitChart, { barDataset, doughnutDataset } from '../components/FitChart';

const PAYMENTS_PAGE_SIZE = 10;

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

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [reports, setReports] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [requests, setRequests] = useState([]);
  const [paymentAnalytics, setPaymentAnalytics] = useState(null);
  const [paymentFilters, setPaymentFilters] = useState({ start_date: '', end_date: '', coach_id: '' });
  const [paymentPage, setPaymentPage] = useState(1);
  const [engagementFilters, setEngagementFilters] = useState({ period: 'day', count: 30 });
  const [engagementData, setEngagementData] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [exerciseForm, setExerciseForm] = useState({ name:'', description:'', category:'', muscle_group:'', equipment:'', difficulty:'', instructions:'', is_public:true });
  const [selectedReport, setSelectedReport] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [signupData, setSignupData] = useState(null);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { loadEngagement(); }, [engagementFilters]);

  const loadData = async () => {
    try {
      setLoading(true); setError('');
      const [sr,ur,ar,rr,er,req,pr,tr] = await Promise.all([
        adminAPI.getStats(), adminAPI.getUsers(), adminAPI.getCoachApplications(),
        adminAPI.getReports(), adminAPI.getExercises(), adminAPI.getRequests(),
        adminAPI.getPaymentAnalytics(paymentFilters), adminAPI.getTemplates(),
      ]);
      if (sr.data.success) setStats(sr.data.data);
      if (ur.data.success) setUsers(ur.data.data.users);
      if (ar.data.success) setApplications(ar.data.data.applications);
      if (rr.data.success) setReports(rr.data.data.reports);
      if (er.data.success) setExercises(er.data.data.exercises);
      if (req.data.success) setRequests(req.data.data.requests);
      if (pr.data.success) {
        setPaymentAnalytics(pr.data.data);
        // Calculate weekly revenue from payments
        const weeklyRevenue = calculateWeeklyRevenue(pr.data.data.payments || []);
        setRevenueData(weeklyRevenue);
      }
      if (tr.data.success) setTemplates(tr.data.data.templates);
      
      // Calculate weekly signups from users
      if (ur.data.success) {
        const weeklySignups = calculateWeeklySignups(ur.data.data.users || []);
        setSignupData(weeklySignups);
      }
    } catch { setError('Failed to load admin data.'); }
    finally { setLoading(false); }
  };

  const calculateWeeklyRevenue = (payments) => {
    const today = new Date();
    const weeks = [];
    const revenues = [];
    
    for (let i = 7; i >= 0; i--) {
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);
      
      const weekLabel = `${weekStart.toLocaleDateString('en-US', {month:'short',day:'numeric'})} - ${weekEnd.toLocaleDateString('en-US', {month:'short',day:'numeric'})}`;
      weeks.push(weekLabel);
      
      const weekRevenue = payments
        .filter(p => {
          const pDate = new Date(p.paid_at || p.created_at);
          return pDate >= weekStart && pDate <= weekEnd && p.status === 'completed';
        })
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      
      revenues.push(Math.round(weekRevenue * 100) / 100);
    }
    
    return { labels: weeks, values: revenues };
  };

  const calculateWeeklySignups = (users) => {
    const today = new Date();
    const weeks = [];
    const signups = [];
    
    for (let i = 7; i >= 0; i--) {
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);
      
      const weekLabel = `${weekStart.toLocaleDateString('en-US', {month:'short',day:'numeric'})} - ${weekEnd.toLocaleDateString('en-US', {month:'short',day:'numeric'})}`;
      weeks.push(weekLabel);
      
      const weekCount = users
        .filter(u => {
          const uDate = new Date(u.created_at);
          return uDate >= weekStart && uDate <= weekEnd;
        })
        .length;
      
      signups.push(weekCount);
    }
    
    return { labels: weeks, values: signups };
  };

  const loadEngagement = async (filters = engagementFilters) => {
    try {
      setLoading(true);
      const res = await adminAPI.getEngagement(filters);
      if (res.data.success) setEngagementData(res.data.data);
    } catch (e) {
      // ignore for now
    } finally { setLoading(false); }
  };

  const act = (fn) => () => { setError(''); setSuccess(''); fn().then(() => { setSuccess('Done.'); loadData(); }).catch(err => setError(err.response?.data?.message || 'Action failed.')); };

  const createExercise = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    try { await adminAPI.createExercise(exerciseForm); setSuccess('Exercise created.'); setExerciseForm({ name:'',description:'',category:'',muscle_group:'',equipment:'',difficulty:'',instructions:'',is_public:true }); loadData(); }
    catch(err) { setError(err.response?.data?.message || 'Failed to create exercise.'); }
  };

  const statusBadge = { active:'badge-green', disabled:'badge-red', pending:'badge-amber', approved:'badge-green', denied:'badge-red', open:'badge-amber', reviewed:'badge-blue', resolved:'badge-green', dismissed:'badge-muted' };

  const initials = (u) => (u.profile?.first_name?.[0] || u.email?.[0] || '?').toUpperCase();
  const name = (u) => u.profile?.first_name ? `${u.profile.first_name} ${u.profile.last_name||''}`.trim() : u.email;

  if (loading) return <div className="loading">Loading admin dashboard…</div>;

  const tabs = [['users','Users'],['applications','Applications'],['reports','Reports'],['exercises','Exercises'],['requests','Requests'],['payments','Payments'],['templates','Templates']];

  return (
    <div className="container page-shell">
      <div className="page-hero fade-up">
        <div className="hero-copy">
          <p className="eyebrow">Admin</p>
          <h1>Admin dashboard</h1>
          <p className="page-copy">Manage users, coach applications, reports, exercise inventory, and platform analytics.</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* STATS */}
      {stats && (
        <div className="stats-grid fade-up fade-up-1">
          {[
            { label:'Total users', value: stats.total_users || 0, color:'var(--text)' },
            { label:'Active coaches', value: stats.total_coaches || 0, color:'var(--blue)' },
            { label:'Pending applications', value: stats.pending_coach_applications || 0, color:'var(--amber)' },
            { label:'Open reports', value: stats.open_reports || 0, color:'var(--red)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <span className="stat-label">{s.label}</span>
              <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* TABS */}
      <div className="tab-row fade-up fade-up-2">
        {tabs.map(([v,l]) => <button key={v} className={`tab-button ${activeTab===v?'active':''}`} onClick={() => setActiveTab(v)}>{l}</button>)}
      </div>

      {/* USERS */}
      {activeTab === 'users' && (
        <div className="card fade-up">
          <div className="section-header"><div><h2>Users</h2><p className="muted-text">{users.length} registered accounts</p></div></div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-8">
                        <Avatar src={u.profile?.profile_picture} name={name(u)} size={30} />
                        <strong style={{color:'var(--text)',fontSize:13}}>{name(u)}</strong>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <select value={u.role||''} onChange={e => adminAPI.updateUser(u.id,{role:e.target.value}).then(loadData)} style={{ width:'auto',padding:'4px 8px',fontSize:12 }}>
                        {['client','coach','both','admin'].map(r=><option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td><span className={`badge ${statusBadge[u.status]||'badge-muted'}`}>{u.status}</span></td>
                    <td>
                      <button className={`btn btn-sm ${u.status==='active'?'btn-danger':'btn-primary'}`}
                        onClick={act(()=>adminAPI.updateUserStatus(u.id, u.status==='active'?'disabled':'active'))}>
                        {u.status==='active'?'Disable':'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* APPLICATIONS */}
      {activeTab === 'applications' && (
        <div className="card fade-up">
          <div className="section-header"><div><h2>Coach applications</h2><p className="muted-text">Review and approve coach registrations</p></div></div>
          {applications.length === 0 ? <p className="muted-text">No pending applications.</p> : applications.map(app => (
            <div key={app.id} className="list-row">
              <div className="flex items-center gap-12 flex-1" style={{minWidth:0}}>
                <Avatar src={app.user?.profile?.profile_picture} name={app.user?.profile?.first_name || app.user?.email || 'User'} size={38} />
                <div>
                  <strong style={{fontSize:14}}>{app.user?.email}</strong>
                  <p className="muted-text" style={{fontSize:12}}>{app.notes||'No notes provided'}</p>
                </div>
              </div>
              <div className="list-row-actions">
                <span className={`badge ${statusBadge[app.status]||'badge-muted'}`}>{app.status}</span>
                <button className="btn btn-primary btn-sm" onClick={act(()=>adminAPI.reviewCoachApplication(app.id,{status:'approved'}))}>Approve</button>
                <button className="btn btn-danger btn-sm" onClick={act(()=>adminAPI.reviewCoachApplication(app.id,{status:'denied'}))}>Deny</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REPORTS */}
      {activeTab === 'reports' && (
        <div className="card fade-up">
          <div className="section-header"><div><h2>Moderation reports</h2><p className="muted-text">User-submitted reports requiring review</p></div></div>
          {reports.length === 0 ? <p className="muted-text">No reports at this time.</p> : reports.map(r => (
            <div key={r.id} className="list-row">
              <div style={{flex:1,minWidth:0}}>
                <div className="flex items-center gap-8 mb-6">
                  <span className={`badge ${statusBadge[r.status]||'badge-muted'}`}>{r.status}</span>
                  <strong style={{fontSize:14,textTransform:'capitalize'}}>{r.report_type}</strong>
                  <span className="muted-text" style={{fontSize:12}}>·</span>
                  <span style={{fontSize:13,color:'var(--text)'}}>{r.reason}</span>
                </div>
                <div className="flex items-center gap-20 flex-wrap" style={{fontSize:12}}>
                  <div className="flex items-center gap-8" style={{minWidth:0}}>
                    <span className="muted-text" style={{whiteSpace:'nowrap'}}>Reported by:</span>
                    <Avatar src={r.reporter?.profile?.profile_picture} name={r.reporter?.profile?.first_name || r.reporter?.email} size={24} />
                    <span style={{color:'var(--text)',minWidth:0,overflow:'hidden',textOverflow:'ellipsis'}}>{r.reporter?.profile?.first_name ? `${r.reporter.profile.first_name} ${r.reporter.profile.last_name||''}`.trim() : r.reporter?.email}</span>
                  </div>
                  <span className="muted-text">→</span>
                  <div className="flex items-center gap-8" style={{minWidth:0}}>
                    <span className="muted-text" style={{whiteSpace:'nowrap'}}>Reported user:</span>
                    <Avatar src={r.reported_user?.profile?.profile_picture} name={r.reported_user?.profile?.first_name || r.reported_user?.email} size={24} />
                    <span style={{color:'var(--text)',minWidth:0,overflow:'hidden',textOverflow:'ellipsis'}}>{r.reported_user?.profile?.first_name ? `${r.reported_user.profile.first_name} ${r.reported_user.profile.last_name||''}`.trim() : r.reported_user?.email}</span>
                  </div>
                </div>
              </div>
              <div className="list-row-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedReport(r)}>Review</button>
                <button className="btn btn-primary btn-sm" onClick={act(()=>adminAPI.updateReport(r.id,{status:'resolved'}))} disabled={r.status === 'resolved' || r.status === 'dismissed'}>Resolve</button>
                <button className="btn btn-ghost btn-sm" onClick={act(()=>adminAPI.updateReport(r.id,{status:'dismissed'}))} disabled={r.status === 'resolved' || r.status === 'dismissed'}>Dismiss</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REPORT DETAIL MODAL */}
      {selectedReport && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.6)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div className="card" style={{width:'90%',maxWidth:600,maxHeight:'80vh',overflow:'auto'}}>
            <div className="flex items-center justify-between mb-16">
              <h2>Report details</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedReport(null)}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div>
                  <strong style={{fontSize:12,color:'var(--text-2)',textTransform:'uppercase',letterSpacing:0.5}}>Reported by</strong>
                  <div className="flex items-center gap-8 mt-8" style={{padding:10,background:'var(--bg-secondary)',borderRadius:6}}>
                    <Avatar src={selectedReport.reporter?.profile?.profile_picture} name={selectedReport.reporter?.profile?.first_name || selectedReport.reporter?.email} size={32} />
                    <div style={{minWidth:0,flex:1}}>
                      <p style={{fontSize:13,fontWeight:500}}>{selectedReport.reporter?.profile?.first_name ? `${selectedReport.reporter.profile.first_name} ${selectedReport.reporter.profile.last_name||''}`.trim() : selectedReport.reporter?.email}</p>
                      <p style={{fontSize:11,color:'var(--text-2)'}}>{selectedReport.reporter?.email}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <strong style={{fontSize:12,color:'var(--text-2)',textTransform:'uppercase',letterSpacing:0.5}}>Reported user</strong>
                  <div className="flex items-center gap-8 mt-8" style={{padding:10,background:'var(--bg-secondary)',borderRadius:6}}>
                    <Avatar src={selectedReport.reported_user?.profile?.profile_picture} name={selectedReport.reported_user?.profile?.first_name || selectedReport.reported_user?.email} size={32} />
                    <div style={{minWidth:0,flex:1}}>
                      <p style={{fontSize:13,fontWeight:500}}>{selectedReport.reported_user?.profile?.first_name ? `${selectedReport.reported_user.profile.first_name} ${selectedReport.reported_user.profile.last_name||''}`.trim() : selectedReport.reported_user?.email}</p>
                      <p style={{fontSize:11,color:'var(--text-2)'}}>{selectedReport.reported_user?.email}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <strong style={{fontSize:12,color:'var(--text-2)',textTransform:'uppercase',letterSpacing:0.5}}>Type</strong>
                <p style={{fontSize:14,marginTop:6,textTransform:'capitalize'}}>{selectedReport.report_type}</p>
              </div>
              <div>
                <strong style={{fontSize:12,color:'var(--text-2)',textTransform:'uppercase',letterSpacing:0.5}}>Reason</strong>
                <p style={{fontSize:14,marginTop:6}}>{selectedReport.reason}</p>
              </div>
              <div>
                <strong style={{fontSize:12,color:'var(--text-2)',textTransform:'uppercase',letterSpacing:0.5}}>Details</strong>
                <p style={{fontSize:14,marginTop:6,lineHeight:1.6,color:'var(--text)',background:'var(--bg-secondary)',padding:12,borderRadius:6}}>{selectedReport.details||'No additional details provided'}</p>
              </div>
              <div>
                <strong style={{fontSize:12,color:'var(--text-2)',textTransform:'uppercase',letterSpacing:0.5}}>Status</strong>
                <p style={{fontSize:14,marginTop:6}}><span className={`badge ${statusBadge[selectedReport.status]||'badge-muted'}`}>{selectedReport.status}</span></p>
              </div>
              <div style={{display:'flex',gap:8,marginTop:12}}>
                <button className="btn btn-primary btn-sm flex-1" onClick={() => {act(()=>adminAPI.updateReport(selectedReport.id,{status:'resolved'}))(); setSelectedReport(null);}} disabled={selectedReport.status === 'resolved' || selectedReport.status === 'dismissed'}>Resolve</button>
                <button className="btn btn-ghost btn-sm flex-1" onClick={() => {act(()=>adminAPI.updateReport(selectedReport.id,{status:'dismissed'}))(); setSelectedReport(null);}} disabled={selectedReport.status === 'resolved' || selectedReport.status === 'dismissed'}>Dismiss</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXERCISES */}
      {activeTab === 'exercises' && (
        <div className="two-col fade-up">
          <div className="card">
            <h2 style={{marginBottom:18}}>Create exercise</h2>
            <form onSubmit={createExercise} style={{display:'flex',flexDirection:'column',gap:12}}>
              <div className="form-group"><label>Exercise name</label><input value={exerciseForm.name} onChange={e=>setExerciseForm(x=>({...x,name:e.target.value}))}/></div>
              
              <div className="form-group">
                <label>Category</label>
                <select value={exerciseForm.category} onChange={e=>setExerciseForm(x=>({...x,category:e.target.value}))}>
                  <option value="">Select category</option>
                  <option value="Strength">Strength</option>
                  <option value="Cardio">Cardio</option>
                  <option value="Flexibility">Flexibility</option>
                  <option value="Balance">Balance</option>
                  <option value="Sports">Sports</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Muscle group</label>
                <select value={exerciseForm.muscle_group} onChange={e=>setExerciseForm(x=>({...x,muscle_group:e.target.value}))}>
                  <option value="">Select muscle group</option>
                  <option value="Chest">Chest</option>
                  <option value="Back">Back</option>
                  <option value="Shoulders">Shoulders</option>
                  <option value="Arms">Arms</option>
                  <option value="Legs">Legs</option>
                  <option value="Abs">Abs</option>
                  <option value="Glutes">Glutes</option>
                  <option value="Full body">Full body</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Equipment</label>
                <select value={exerciseForm.equipment} onChange={e=>setExerciseForm(x=>({...x,equipment:e.target.value}))}>
                  <option value="">Select equipment</option>
                  <option value="Dumbbells">Dumbbells</option>
                  <option value="Barbell">Barbell</option>
                  <option value="Kettlebell">Kettlebell</option>
                  <option value="Machine">Machine</option>
                  <option value="Bodyweight">Bodyweight</option>
                  <option value="Bands">Bands</option>
                  <option value="Cable">Cable</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Difficulty</label>
                <select value={exerciseForm.difficulty} onChange={e=>setExerciseForm(x=>({...x,difficulty:e.target.value}))}>
                  <option value="">Select difficulty</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              
              <div className="form-group"><label>Description</label><textarea rows={2} value={exerciseForm.description} onChange={e=>setExerciseForm(x=>({...x,description:e.target.value}))}/></div>
              <div className="form-group"><label>Instructions</label><textarea rows={3} value={exerciseForm.instructions} onChange={e=>setExerciseForm(x=>({...x,instructions:e.target.value}))}/></div>
              <button type="submit" className="btn btn-primary btn-sm">Create exercise</button>
            </form>
          </div>
          <div className="card">
            <h2 style={{marginBottom:16}}>Exercise inventory</h2>
            {exercises.map(ex => (
              <div key={ex.id} className="list-row">
                <div>
                  <strong style={{fontSize:14}}>{ex.name}</strong>
                  <p className="muted-text" style={{fontSize:12}}>{ex.equipment||'No equipment'} · {ex.difficulty||'—'} · {ex.muscle_group||'—'}</p>
                </div>
                <div className="list-row-actions">
                  <span className={`badge ${ex.is_public?'badge-green':'badge-muted'}`}>{ex.is_public?'Public':'Private'}</span>
                  <button className="btn btn-secondary btn-sm" onClick={act(()=>adminAPI.updateExercise(ex.id,{is_public:!ex.is_public}))}>{ex.is_public?'Unpublish':'Publish'}</button>
                  <button className="btn btn-danger btn-sm" onClick={act(()=>adminAPI.deleteExercise(ex.id))}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REQUESTS */}
      {activeTab === 'requests' && (
        <div className="card fade-up">
          <div className="section-header"><div><h2>Coach requests</h2><p className="muted-text">Client-to-coach hire requests</p></div></div>
          {requests.map(req => (
            <div key={req.id} className="list-row">
              <div>
                <strong style={{fontSize:14}}>Client #{req.client_id} → Coach #{req.coach_id}</strong>
                <p className="muted-text" style={{fontSize:12}}>Requested {new Date(req.requested_at).toLocaleDateString()}</p>
              </div>
              <div className="list-row-actions">
                <span className={`badge ${statusBadge[req.status]||'badge-muted'}`}>{req.status}</span>
                <button className="btn btn-primary btn-sm" onClick={act(()=>adminAPI.updateRequest(req.id,{status:'accepted'}))}>Accept</button>
                <button className="btn btn-danger btn-sm" onClick={act(()=>adminAPI.updateRequest(req.id,{status:'denied'}))}>Deny</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAYMENTS */}
      {activeTab === 'payments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="stats-grid fade-up">
            <div className="stat-card"><span className="stat-label">Total revenue</span><span className="stat-value" style={{color:'var(--green)'}}>${paymentAnalytics?.total_revenue||0}</span></div>
            <div className="stat-card"><span className="stat-label">Payment count</span><span className="stat-value">{paymentAnalytics?.payment_count||0}</span></div>
            <div className="stat-card"><span className="stat-label">Avg per session</span><span className="stat-value">$90</span></div>
          </div>
          <div className="two-col fade-up">
            <div className="card">
              <div className="section-header"><div><h2>Revenue over time</h2><p className="muted-text">Last 8 weeks (actual payment data)</p></div></div>
              {revenueData && revenueData.values.some(v => v > 0) ? (
                <FitChart type="bar" labels={revenueData.labels} datasets={[barDataset('Revenue', revenueData.values, '#3fb950')]} height={200} />
              ) : (
                <div style={{height:200,display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg-secondary)',borderRadius:6}}>
                  <p className="muted-text">No completed payments yet (graph will populate as coaches receive payments)</p>
                </div>
              )}
            </div>
            <div className="card">
              <div className="section-header"><div><h2>User signups</h2><p className="muted-text">Last 8 weeks (actual user registration data)</p></div></div>
              {signupData && signupData.values.some(v => v > 0) ? (
                <FitChart type="bar" labels={signupData.labels} datasets={[barDataset('Signups', signupData.values, '#58a6ff')]} height={200} />
              ) : (
                <div style={{height:200,display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg-secondary)',borderRadius:6}}>
                  <p className="muted-text">No signup data available yet</p>
                </div>
              )}
            </div>
          </div>
          <div className="card fade-up">
            <div className="section-header"><div><h2>Payment Filters</h2><p className="muted-text">Filter payment analytics by date range or coach</p></div></div>
            <div style={{display:'flex',gap:12,alignItems:'center'}}>
              <input type="date" value={paymentFilters.start_date} onChange={e=>setPaymentFilters(f=>({...f,start_date:e.target.value}))} />
              <input type="date" value={paymentFilters.end_date} onChange={e=>setPaymentFilters(f=>({...f,end_date:e.target.value}))} />
              <select value={paymentFilters.coach_id} onChange={e=>setPaymentFilters(f=>({...f,coach_id:e.target.value}))}>
                <option value="">All coaches</option>
                {users.filter(u=>u.role==='coach'||u.role==='both').map(c=> <option key={c.id} value={c.id}>{c.profile?.first_name || c.email}</option>)}
              </select>
              <button className="btn btn-primary btn-sm" onClick={async()=>{ setPaymentPage(1); setLoading(true); try{ const res=await adminAPI.getPaymentAnalytics(paymentFilters); if(res.data.success) setPaymentAnalytics(res.data.data); }catch(e){} finally{ setLoading(false); } }}>Apply</button>
            </div>
          </div>
          <div className="card fade-up">
            <div className="section-header"><div><h2>Engagement</h2><p className="muted-text">DAU / WAU / MAU and timeseries</p></div></div>
            <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:12}}>
              <select value={engagementFilters.period} onChange={e=>setEngagementFilters(f=>({...f,period:e.target.value}))}>
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </select>
              <input type="number" value={engagementFilters.count} onChange={e=>setEngagementFilters(f=>({...f,count:parseInt(e.target.value||0)}))} style={{width:90}} />
              <button className="btn btn-primary btn-sm" onClick={()=>loadEngagement(engagementFilters)}>Apply</button>
              <div style={{marginLeft:'auto',display:'flex',gap:24}}>
                <div style={{display:'flex',alignItems:'baseline',gap:6}}><strong>DAU:</strong><span style={{fontSize:16,fontWeight:700}}>{engagementData?.dau||0}</span></div>
                <div style={{display:'flex',alignItems:'baseline',gap:6}}><strong>WAU:</strong><span style={{fontSize:16,fontWeight:700}}>{engagementData?.wau||0}</span></div>
                <div style={{display:'flex',alignItems:'baseline',gap:6}}><strong>MAU:</strong><span style={{fontSize:16,fontWeight:700}}>{engagementData?.mau||0}</span></div>
              </div>
            </div>
            <div>
              {engagementData ? (
                <FitChart type="bar" labels={engagementData.labels} datasets={[barDataset('Active users', engagementData.values || [], '#3fb950')]} height={200} />
              ) : <p className="muted-text">No engagement data yet.</p>}
            </div>
          </div>
          <div className="two-col fade-up">
            <div className="card">
              <div className="section-header"><div><h2>User role breakdown</h2></div></div>
              <div className="flex items-center gap-20" style={{flexWrap:'wrap'}}>
                <div style={{width:160,flexShrink:0}}>
                  <FitChart type="doughnut" labels={['Clients','Coaches','Both']} datasets={[doughnutDataset([68,25,7],['#3fb950','#58a6ff','#39d0b4'])]} height={160} />
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {[['#3fb950','Clients','68%'],['#58a6ff','Coaches','25%'],['#39d0b4','Both roles','7%']].map(([c,l,p])=>(
                    <span key={l} style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'var(--text-2)'}}>
                      <span style={{width:10,height:10,borderRadius:2,background:c,flexShrink:0}}/>
                      {l} — {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="card">
              <div className="section-header"><div><h2>Recent payments</h2></div></div>
              {paymentAnalytics?.payments?.length ? (() => {
                const totalPayments = paymentAnalytics.payment_count || paymentAnalytics.payments.length;
                const totalPages = Math.ceil(totalPayments / PAYMENTS_PAGE_SIZE);
                const start = (paymentPage - 1) * PAYMENTS_PAGE_SIZE;
                const end = start + PAYMENTS_PAGE_SIZE;
                const paginatedPayments = paymentAnalytics.payments.slice(start, end);
                
                return (
                  <>
                    {paginatedPayments.map(p => (
                      <div key={p.id} className="list-row">
                        <div>
                          <strong style={{fontSize:14}}>{p.payment_reference}</strong>
                          <p className="muted-text" style={{fontSize:12}}>
                            {p.coach?.profile?.first_name || p.coach?.email || 'Unknown'} · {p.session_type || 'Session'} · {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <span style={{fontSize:14,fontWeight:700,color:'var(--green)'}}>${p.amount}</span>
                          <span className={`badge ${statusBadge[p.status]||'badge-muted'}`}>{p.status}</span>
                        </div>
                      </div>
                    ))}
                    <PaginationControls 
                      page={paymentPage} 
                      totalPages={totalPages} 
                      onPrev={() => setPaymentPage(p => Math.max(1, p - 1))}
                      onNext={() => setPaymentPage(p => Math.min(totalPages, p + 1))}
                    />
                  </>
                );
              })() : <p className="muted-text">No payment data yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="card fade-up">
          <div className="section-header"><div><h2>Workout templates</h2><p className="muted-text">Approve coach-submitted workout templates</p></div></div>
          {templates.map(t => (
            <div key={t.id} className="list-row">
              <div>
                <strong style={{fontSize:14}}>{t.name}</strong>
                <div className="flex gap-6 mt-4">
                  {t.goal && <span className="badge badge-green" style={{fontSize:11}}>{t.goal}</span>}
                  {t.difficulty && <span className="badge badge-amber" style={{fontSize:11}}>{t.difficulty}</span>}
                  {t.plan_type && <span className="badge badge-muted" style={{fontSize:11}}>{t.plan_type}</span>}
                </div>
              </div>
              <div className="list-row-actions">
                <span className={`badge ${t.approved?'badge-green':'badge-amber'}`}>{t.approved?'Approved':'Pending'}</span>
                {!t.approved && <button className="btn btn-primary btn-sm" onClick={act(()=>adminAPI.updateTemplate({template_id:t.id,approved:true,is_public:true}))}>Approve</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
