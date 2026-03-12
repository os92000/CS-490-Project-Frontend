import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav>
      <div className="container">
        <Link to="/dashboard" className="logo">
          Fitness App
        </Link>

        <ul className="nav-links">
          <li>
            <Link to="/dashboard">Dashboard</Link>
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
