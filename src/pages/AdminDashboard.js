import React, { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import Avatar from '../components/Avatar';
import FitChart, { barDataset, doughnutDataset } from '../components/FitChart';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [reports, setReports] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [requests, setRequests] = useState([]);
  const [paymentAnalytics, setPaymentAnalytics] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [exerciseForm, setExerciseForm] = useState({ name:'', description:'', category:'', muscle_group:'', equipment:'', difficulty:'', instructions:'', is_public:true });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true); setError('');
      const [sr,ur,ar,rr,er,req,pr,tr] = await Promise.all([
        adminAPI.getStats(), adminAPI.getUsers(), adminAPI.getCoachApplications(),
        adminAPI.getReports(), adminAPI.getExercises(), adminAPI.getRequests(),
        adminAPI.getPaymentAnalytics(), adminAPI.getTemplates(),
      ]);
      if (sr.data.success) setStats(sr.data.data);
      if (ur.data.success) setUsers(ur.data.data.users);
      if (ar.data.success) setApplications(ar.data.data.applications);
      if (rr.data.success) setReports(rr.data.data.reports);
      if (er.data.success) setExercises(er.data.data.exercises);
      if (req.data.success) setRequests(req.data.data.requests);
      if (pr.data.success) setPaymentAnalytics(pr.data.data);
      if (tr.data.success) setTemplates(tr.data.data.templates);
    } catch { setError('Failed to load admin data.'); }
    finally { setLoading(false); }
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
            { label:'Pending applications', value: stats.pending_coach_applications || 0, color:'var(--amber)' },
            { label:'Open reports', value: stats.open_reports || 0, color:'var(--red)' },
            { label:'Total revenue', value: `$${stats.total_revenue || 0}`, color:'var(--green)' },
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
              <div>
                <div className="flex items-center gap-8 mb-4">
                  <span className={`badge ${statusBadge[r.status]||'badge-muted'}`}>{r.status}</span>
                  <strong style={{fontSize:14}}>{r.report_type} · {r.reason}</strong>
                </div>
                <p className="muted-text" style={{fontSize:13}}>{r.details||'No additional details'}</p>
              </div>
              <div className="list-row-actions">
                <button className="btn btn-secondary btn-sm" onClick={act(()=>adminAPI.updateReport(r.id,{status:'reviewed'}))}>Review</button>
                <button className="btn btn-primary btn-sm" onClick={act(()=>adminAPI.updateReport(r.id,{status:'resolved'}))}>Resolve</button>
                <button className="btn btn-ghost btn-sm" onClick={act(()=>adminAPI.updateReport(r.id,{status:'dismissed'}))}>Dismiss</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EXERCISES */}
      {activeTab === 'exercises' && (
        <div className="two-col fade-up">
          <div className="card">
            <h2 style={{marginBottom:18}}>Create exercise</h2>
            <form onSubmit={createExercise} style={{display:'flex',flexDirection:'column',gap:12}}>
              {[['name','Exercise name'],['category','Category'],['muscle_group','Muscle group'],['equipment','Equipment'],['difficulty','Difficulty']].map(([f,l])=>(
                <div key={f} className="form-group"><label>{l}</label><input value={exerciseForm[f]} onChange={e=>setExerciseForm(x=>({...x,[f]:e.target.value}))}/></div>
              ))}
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
            <div className="stat-card"><span className="stat-label">Active coaches</span><span className="stat-value">{stats?.total_coaches||0}</span></div>
          </div>
          <div className="two-col fade-up">
            <div className="card">
              <div className="section-header"><div><h2>Revenue over time</h2><p className="muted-text">Last 8 weeks</p></div></div>
              <FitChart type="bar" labels={['Wk1','Wk2','Wk3','Wk4','Wk5','Wk6','Wk7','Wk8']} datasets={[barDataset('Revenue', [1200,1850,1400,2200,1900,2400,2800,2600], '#3fb950')]} height={200} />
            </div>
            <div className="card">
              <div className="section-header"><div><h2>User signups</h2><p className="muted-text">Last 8 weeks</p></div></div>
              <FitChart type="bar" labels={['Wk1','Wk2','Wk3','Wk4','Wk5','Wk6','Wk7','Wk8']} datasets={[barDataset('Signups', [28,42,35,61,48,55,72,68], '#58a6ff')]} height={200} />
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
              {paymentAnalytics?.payments?.length ? paymentAnalytics.payments.map(p => (
                <div key={p.id} className="list-row">
                  <div><strong style={{fontSize:14}}>{p.payment_reference}</strong><p className="muted-text" style={{fontSize:12}}>{p.currency} {p.amount}</p></div>
                  <span className={`badge ${statusBadge[p.status]||'badge-muted'}`}>{p.status}</span>
                </div>
              )) : <p className="muted-text">No payment data yet.</p>}
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
