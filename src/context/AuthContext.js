import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Optionally verify token by fetching current user
          const response = await authAPI.getCurrentUser();
          if (response.data.success) {
            setUser(response.data.data);
            localStorage.setItem('user', JSON.stringify(response.data.data));
          }
        } catch (error) {
          // Token invalid, clear auth
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const signup = async (email, password) => {
    try {
      setError(null);
      const response = await authAPI.signup({ email, password });
      console.log('Signup response:', response.data);

      if (response.data.success) {
        const { user: userData, access_token, refresh_token } = response.data.data;
        console.log('Extracted tokens:', {
          has_access_token: !!access_token,
          has_refresh_token: !!refresh_token,
          access_token_length: access_token?.length,
          user_id: userData?.id
        });
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('Tokens saved to localStorage');
        setUser(userData);
        return { success: true, user: userData };
      }
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = error.response?.data?.message || 'Signup failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authAPI.login({ email, password });

      if (response.data.success) {
        const { user: userData, access_token, refresh_token } = response.data.data;
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return { success: true, user: userData };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
      setError(null);
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const isAuthenticated = !!user;

  const hasRole = (roles) => {
    if (!user || !user.role) return false;

    // Convert single role to array
    const roleArray = Array.isArray(roles) ? roles : [roles];

    // 'both' role has access to both client and coach features
    if (user.role === 'both' && (roleArray.includes('client') || roleArray.includes('coach'))) {
      return true;
    }

    return roleArray.includes(user.role);
  };

  const value = {
    user,
    loading,
    error,
    signup,
    login,
    logout,
    updateUser,
    isAuthenticated,
    hasRole,
    clearError: () => setError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
