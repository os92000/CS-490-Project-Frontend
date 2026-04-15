import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const navCls = ({ isActive }) => isActive ? 'active' : '';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.profile?.first_name
    ? user.profile.first_name[0].toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?';

  const roleLabel = user?.role === 'both' ? 'Client & Coach' : user?.role || '';

  return (
    <nav>
      <div className="container">
        <NavLink to="/dashboard" className="logo">FitApp</NavLink>

        <ul className="nav-links">
          <li><NavLink to="/dashboard" className={navCls}>Dashboard</NavLink></li>
          {hasRole(['client', 'both']) && (<>
            <li><NavLink to="/coaches" className={navCls}>Coaches</NavLink></li>
            <li><NavLink to="/my-workouts" className={navCls}>Workouts</NavLink></li>
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
            <div className="nav-user-pill">
              <div className="nav-avatar">{initials}</div>
              <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.profile?.first_name || user.email}
              </span>
              {roleLabel && <span className="badge badge-green" style={{ fontSize: 11 }}>{roleLabel}</span>}
            </div>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm">Logout</button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
