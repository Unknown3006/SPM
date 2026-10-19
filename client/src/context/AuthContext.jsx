import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load current user profile if token is in localStorage
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('tms_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      if (response.data && response.data.success) {
        setUser(response.data.user);
      } else {
        localStorage.removeItem('tms_token');
        setUser(null);
      }
    } catch (err) {
      console.error('[AuthContext] Failed to load user:', err?.response?.data?.message || err.message);
      localStorage.removeItem('tms_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Login handler
  const login = async (email, password, rememberMe = true) => {
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user: loggedInUser } = response.data;

      localStorage.setItem('tms_token', token);
      if (rememberMe) {
        localStorage.setItem('tms_remember_me', 'true');
      } else {
        localStorage.removeItem('tms_remember_me');
      }

      setUser(loggedInUser);
      return { success: true, user: loggedInUser };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(message);
      return { success: false, message, errors: err.response?.data?.errors || [] };
    }
  };

  // Register customer handler
  const register = async (userData) => {
    setError(null);
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user: newUser } = response.data;

      localStorage.setItem('tms_token', token);
      setUser(newUser);
      return { success: true, user: newUser };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed.';
      setError(message);
      return { success: false, message, errors: err.response?.data?.errors || [] };
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('tms_token');
    setUser(null);
    setError(null);
  };

  // Update profile
  const updateProfile = async (profileData) => {
    try {
      const response = await api.patch('/users/me', profileData);
      if (response.data?.success) {
        setUser(response.data.user);
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data?.message || 'Failed to update profile' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Update failed',
        errors: err.response?.data?.errors || []
      };
    }
  };

  // Update password
  const updatePassword = async (currentPassword, newPassword) => {
    try {
      const response = await api.patch('/users/me/password', {
        currentPassword,
        newPassword
      });
      return { success: true, message: response.data?.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to update password',
        errors: err.response?.data?.errors || []
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        setError,
        login,
        register,
        logout,
        updateProfile,
        updatePassword,
        loadUser,
        isAuthenticated: !!user,
        role: user?.role || null
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
