import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

const Navbar = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const navCls = ({ isActive }) => isActive ? 'active' : '';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = user?.profile?.first_name
    ? `${user.profile.first_name}${user.profile.last_name ? ' ' + user.profile.last_name : ''}`
    : user?.email?.split('@')[0] || 'User';

  const shortName = user?.profile?.first_name || user?.email?.split('@')[0] || 'User';

  const roleLabel = user?.role === 'both' ? 'Client & Coach'
    : user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : '';

  const roleBadgeClass = { client: 'badge-green', coach: 'badge-blue', both: 'badge-teal', admin: 'badge-amber' }[user?.role] || 'badge-muted';

  return (
    <nav>
      <div className="container">
        <NavLink to="/dashboard" className="logo">FitApp</NavLink>

        <ul className="nav-links">
          <li><NavLink to="/dashboard" className={navCls}>Dashboard</NavLink></li>

          {hasRole(['client', 'both']) && (<>
            <li><NavLink to="/coaches" className={navCls}>Coaches</NavLink></li>
            <li><NavLink to="/my-workouts" className={navCls}>Workouts</NavLink></li>
            <li><NavLink to="/calendar" className={navCls}>Calendar</NavLink></li>
            <li><NavLink to="/nutrition" className={navCls}>Nutrition</NavLink></li>
            <li><NavLink to="/analytics" className={navCls}>Analytics</NavLink></li>
            <li><NavLink to="/chat" className={navCls}>Chat</NavLink></li>
          </>)}

          {hasRole(['coach', 'both']) && (<>
            <li><NavLink to="/my-clients" className={navCls}>Clients</NavLink></li>
            <li><NavLink to="/coach-settings" className={navCls}>Coach</NavLink></li>
          </>)}

          {user?.role === 'admin' && (
            <li><NavLink to="/admin" className={navCls}>Admin</NavLink></li>
          )}

          <li><NavLink to="/profile" className={navCls}>Profile</NavLink></li>
        </ul>

        {user && (
          <div className="flex items-center gap-8">
            <div className="nav-user-pill" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
              <Avatar
                src={user.profile?.profile_picture}
                name={displayName}
                size={26}
              />
              <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {shortName}
              </span>
              {roleLabel && (
                <span className={`badge ${roleBadgeClass}`} style={{ fontSize: 11 }}>{roleLabel}</span>
              )}
            </div>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm">Logout</button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
