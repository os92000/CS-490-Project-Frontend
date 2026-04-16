import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, profileAPI, surveysAPI, usersAPI } from '../services/api';
import Avatar from '../components/Avatar';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [survey, setSurvey] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [profileForm, setProfileForm] = useState({ first_name:'', last_name:'', phone:'', bio:'', profile_picture:'' });
  const [goalsForm, setGoalsForm] = useState({ age:'', weight:'', fitness_level:'', goals:'' });
  const [passwordForm, setPasswordForm] = useState({ current_password:'', new_password:'' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [pr, sr, nr] = await Promise.all([
        profileAPI.getProfile(),
        surveysAPI.getMyFitnessSurvey().catch(()=>null),
        profileAPI.getNotifications(),
      ]);
      if (pr.data.success) {
        const d = pr.data.data;
        setProfile(d);
        setProfileForm({ first_name:d.profile?.first_name||'', last_name:d.profile?.last_name||'', phone:d.profile?.phone||'', bio:d.profile?.bio||'', profile_picture:d.profile?.profile_picture||'' });
      }
      if (sr?.data?.success) {
        setSurvey(sr.data.data);
        setGoalsForm({ age:sr.data.data.age||'', weight:sr.data.data.weight||'', fitness_level:sr.data.data.fitness_level||'', goals:sr.data.data.goals||'' });
      }
      if (nr.data.success) setNotifications(nr.data.data.notifications);
    } catch { setError('Failed to load profile data.'); }
  };

  const saveProfile = async e => {
    e.preventDefault(); setError(''); setMessage('');
    try {
      const res = await profileAPI.updateProfile(profileForm);
      if (res.data.success) { updateUser({...user, profile:res.data.data}); setMessage('Profile updated.'); loadData(); }
    } catch(err) { setError(err.response?.data?.message||'Failed to update profile.'); }
  };

  const saveGoals = async e => {
    e.preventDefault(); setError(''); setMessage('');
    try { await surveysAPI.createFitnessSurvey(goalsForm); setMessage('Goals updated.'); loadData(); }
    catch(err) { setError(err.response?.data?.message||'Failed to update goals.'); }
  };

  const changePassword = async e => {
    e.preventDefault(); setError(''); setMessage('');
    try { await authAPI.changePassword(passwordForm); setPasswordForm({current_password:'',new_password:''}); setMessage('Password changed.'); }
    catch(err) { setError(err.response?.data?.message||'Failed to change password.'); }
  };

  const uploadPicture = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    try { await profileAPI.uploadProfilePicture(fd); setMessage('Profile picture updated.'); loadData(); }
    catch(err) { setError(err.response?.data?.message||'Failed to upload picture.'); }
  };

  const deleteAccount = async () => {
    if (!window.confirm('Delete your account and all associated data? This cannot be undone.')) return;
    try { await usersAPI.deleteAccount(user.id); await logout(); window.location.href='/login'; }
    catch(err) { setError(err.response?.data?.message||'Failed to delete account.'); }
  };

  const name = profile?.profile?.first_name
    ? `${profile.profile.first_name} ${profile.profile.last_name||''}`.trim()
    : user?.email || '';
  const initials = (profile?.profile?.first_name?.[0] || user?.email?.[0] || '?').toUpperCase();
  const roleColor = { client:'badge-green', coach:'badge-blue', both:'badge-teal', admin:'badge-amber' };

  return (
    <div className="container page-shell">
      {/* PROFILE HERO */}
      <div className="page-hero fade-up">
        <div className="flex items-center gap-24" style={{ flexWrap:'wrap' }}>
          <div style={{ position:'relative' }}>
            <Avatar src={profile?.profile?.profile_picture} name={name} size={80} style={{ border: '3px solid rgba(63,185,80,0.3)' }} />
            <label htmlFor="pic-upload" style={{ position:'absolute',bottom:0,right:0,background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'50%',width:24,height:24,display:'grid',placeItems:'center',cursor:'pointer',fontSize:12 }} title="Upload photo">📷</label>
            <input id="pic-upload" type="file" accept="image/*" onChange={uploadPicture} style={{display:'none'}}/>
          </div>
          <div>
            <p className="eyebrow" style={{marginBottom:6}}>Account</p>
            <h1 style={{marginBottom:8}}>{name}</h1>
            <div className="flex gap-8 flex-wrap">
              <span className="muted-text" style={{fontSize:14}}>{user?.email}</span>
              {user?.role && <span className={`badge ${roleColor[user.role]||'badge-muted'}`}>{user.role === 'both' ? 'Client & Coach' : user.role}</span>}
              {survey?.fitness_level && <span className="badge badge-muted">{survey.fitness_level}</span>}
            </div>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      <div className="two-col fade-up fade-up-1">
        {/* EDIT PROFILE */}
        <div className="card">
          <h2 style={{marginBottom:18}}>Edit profile</h2>
          <form onSubmit={saveProfile} style={{display:'flex',flexDirection:'column',gap:14}}>
            <div className="flex gap-12">
              <div className="form-group w-full"><label>First name</label><input value={profileForm.first_name} onChange={e=>setProfileForm(f=>({...f,first_name:e.target.value}))}/></div>
              <div className="form-group w-full"><label>Last name</label><input value={profileForm.last_name} onChange={e=>setProfileForm(f=>({...f,last_name:e.target.value}))}/></div>
            </div>
            <div className="form-group"><label>Phone</label><input value={profileForm.phone} onChange={e=>setProfileForm(f=>({...f,phone:e.target.value}))} placeholder="+1 (555) 000-0000"/></div>
            <div className="form-group"><label>Profile picture URL</label><input value={profileForm.profile_picture} onChange={e=>setProfileForm(f=>({...f,profile_picture:e.target.value}))} placeholder="https://…"/></div>
            <div className="form-group"><label>Bio</label><textarea rows={4} value={profileForm.bio} onChange={e=>setProfileForm(f=>({...f,bio:e.target.value}))} placeholder="Tell us a bit about yourself…"/></div>
            <button type="submit" className="btn btn-primary btn-sm">Save profile</button>
          </form>
        </div>

        {/* FITNESS GOALS */}
        <div className="card">
          <h2 style={{marginBottom:18}}>Fitness goals</h2>
          <form onSubmit={saveGoals} style={{display:'flex',flexDirection:'column',gap:14}}>
            <div className="flex gap-12">
              <div className="form-group w-full"><label>Age</label><input type="number" value={goalsForm.age} onChange={e=>setGoalsForm(f=>({...f,age:e.target.value}))} placeholder="25"/></div>
              <div className="form-group w-full"><label>Weight (kg)</label><input type="number" value={goalsForm.weight} onChange={e=>setGoalsForm(f=>({...f,weight:e.target.value}))} placeholder="70"/></div>
            </div>
            <div className="form-group">
              <label>Fitness level</label>
              <select value={goalsForm.fitness_level} onChange={e=>setGoalsForm(f=>({...f,fitness_level:e.target.value}))}>
                <option value="">Select level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="form-group"><label>Goals</label><textarea rows={4} value={goalsForm.goals} onChange={e=>setGoalsForm(f=>({...f,goals:e.target.value}))} placeholder="e.g. Lose 8kg, build muscle, run a 5K…"/></div>
            <button type="submit" className="btn btn-primary btn-sm">Save goals</button>
          </form>
        </div>
      </div>

      <div className="two-col fade-up fade-up-2">
        {/* SECURITY */}
        <div className="card">
          <h2 style={{marginBottom:18}}>Security</h2>
          <form onSubmit={changePassword} style={{display:'flex',flexDirection:'column',gap:14}}>
            <div className="form-group"><label>Current password</label><input type="password" value={passwordForm.current_password} onChange={e=>setPasswordForm(f=>({...f,current_password:e.target.value}))} placeholder="••••••••"/></div>
            <div className="form-group"><label>New password</label><input type="password" value={passwordForm.new_password} onChange={e=>setPasswordForm(f=>({...f,new_password:e.target.value}))} placeholder="Min. 6 characters"/></div>
            <button type="submit" className="btn btn-primary btn-sm">Change password</button>
          </form>
        </div>

        {/* NOTIFICATIONS */}
        <div className="card">
          <h2 style={{marginBottom:16}}>Notifications</h2>
          {notifications.length === 0 ? (
            <div style={{textAlign:'center',padding:'30px 0'}}><p style={{fontSize:28,marginBottom:8}}>🔔</p><p className="muted-text">No notifications yet.</p></div>
          ) : notifications.map(n => (
            <div key={n.id} className="list-row">
              <div className="flex gap-10">
                {!n.read && <div style={{width:7,height:7,borderRadius:'50%',background:'var(--green)',flexShrink:0,marginTop:6}}/>}
                {n.read && <div style={{width:7,flexShrink:0}}/>}
                <div>
                  <strong style={{fontSize:14}}>{n.title}</strong>
                  <p className="muted-text" style={{fontSize:13}}>{n.message}</p>
                </div>
              </div>
              {!n.read && (
                <button className="btn btn-ghost btn-sm" onClick={() => profileAPI.markNotificationRead(n.id).then(loadData)}>Read</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* DANGER ZONE */}
      <div className="card fade-up" style={{borderColor:'rgba(248,81,73,0.3)',background:'rgba(248,81,73,0.04)'}}>
        <h2 style={{color:'var(--red)',marginBottom:6}}>Danger zone</h2>
        <p className="muted-text" style={{marginBottom:16}}>Permanently deletes your account and all associated data. This action cannot be undone.</p>
        <button className="btn btn-danger btn-sm" onClick={deleteAccount}>Delete my account</button>
      </div>
    </div>
  );
};

export default Profile;
