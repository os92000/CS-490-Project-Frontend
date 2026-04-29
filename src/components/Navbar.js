import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

const Navbar = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isCompactNav, setIsCompactNav] = useState(window.innerWidth < 1380);
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

  const isClient = hasRole(['client', 'both']);
  const isCoach = hasRole(['coach', 'both']);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const onOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onResize = () => setIsCompactNav(window.innerWidth < 1380);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const primaryLinks = useMemo(() => {
    const links = [{ to: '/dashboard', label: 'Dashboard' }];
    if (isClient) {
      links.push(
        { to: '/coaches', label: 'Coaches' },
        { to: '/my-workouts', label: 'Workouts' },
        { to: '/calendar', label: 'Calendar' },
      );
    }
    if (isCoach) {
      links.push({ to: '/my-clients', label: 'Clients' });
    }
    if (isClient || isCoach) {
      links.push({ to: '/chat', label: 'Chat' });
    }
    if (isAdmin) {
      links.push({ to: '/admin', label: 'Admin' });
    }
    return links;
  }, [isClient, isCoach, isAdmin]);

  const moreLinks = useMemo(() => {
    const links = [];
    if (isClient) {
      links.push(
        { to: '/exercises', label: 'Exercises' },
        { to: '/nutrition', label: 'Nutrition' },
        { to: '/analytics', label: 'Analytics' },
      );
    }
    if (isClient || isCoach) {
      links.push(
        { to: '/progress-photos', label: 'Progress Photos' },
        { to: '/payments', label: 'Payments' },
      );
    }
    if (isCoach) {
      links.push({ to: '/coach-settings', label: 'Coach Settings' });
    }
    links.push({ to: '/profile', label: 'Profile' });

    const dedup = [];
    const seen = new Set();
    links.forEach((l) => {
      if (!seen.has(l.to)) {
        dedup.push(l);
        seen.add(l.to);
      }
    });
    return dedup;
  }, [isClient, isCoach]);

  const moreActive = moreLinks.some((l) => location.pathname === l.to);

  return (
    <nav>
      <div className="container">
        <NavLink to="/dashboard" className="logo">FitApp</NavLink>

        <ul className="nav-links">
          {primaryLinks.map((l) => (
            <li key={l.to}><NavLink to={l.to} className={navCls}>{l.label}</NavLink></li>
          ))}

          {isCompactNav ? (
            <li ref={menuRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className={`nav-menu-btn ${moreActive ? 'active' : ''}`}
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
              >
                More
                <span style={{ fontSize: 10, marginLeft: 5 }}>▾</span>
              </button>
              {menuOpen && (
                <div className="nav-dropdown-menu">
                  {moreLinks.map((l) => (
                    <NavLink key={l.to} to={l.to} className={navCls}>{l.label}</NavLink>
                  ))}
                </div>
              )}
            </li>
          ) : (
            moreLinks.map((l) => (
              <li key={l.to}><NavLink to={l.to} className={navCls}>{l.label}</NavLink></li>
            ))
          )}
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
