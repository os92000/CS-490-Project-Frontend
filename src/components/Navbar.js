import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const navClassName = ({ isActive }) => isActive ? 'active' : '';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav>
      <div className="container">
        <NavLink to="/dashboard" className="logo">
          Fitness App
        </NavLink>

        <ul className="nav-links">
          <li>
            <NavLink to="/dashboard" className={navClassName}>Dashboard</NavLink>
          </li>
          {hasRole(['client', 'both']) && (
            <>
              <li><NavLink to="/my-workouts" className={navClassName}>Workouts</NavLink></li>
              <li><NavLink to="/nutrition" className={navClassName}>Nutrition</NavLink></li>
              <li><NavLink to="/analytics" className={navClassName}>Analytics</NavLink></li>
            </>
          )}
          {hasRole(['coach', 'both']) && (
            <>
              <li><NavLink to="/my-clients" className={navClassName}>Clients</NavLink></li>
              <li><NavLink to="/coach-settings" className={navClassName}>Coach Settings</NavLink></li>
            </>
          )}
          {user?.role === 'admin' && (
            <li><NavLink to="/admin" className={navClassName}>Admin</NavLink></li>
          )}
          <li>
            <NavLink to="/profile" className={navClassName}>Profile</NavLink>
          </li>

          {user && (
            <>
              <li>
                <span style={{ color: '#4CAF50' }}>
                  {user.email} ({user.role})
                </span>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary"
                  style={{ padding: '5px 15px', fontSize: '14px' }}
                >
                  Logout
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
