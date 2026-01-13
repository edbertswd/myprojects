// src/context/AuthContext.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import { AuthContext } from './AuthContextBase';

const DEV_DEFAULT_SIGNED_IN = false;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = localStorage.getItem('sessionId');

    // --- DEV branch: if sessionId is a known fake OR we want default signed-in locally, seed a fake user
    if (import.meta.env.DEV) {
      // 1) if sessionId is our dev sessionId → trust and hydrate a fake user (skip API)
      if (sessionId === 'DEV_FAKE_SESSION') {
        setUser({
          user_id: 1,
          name: 'Dev User',
          email: 'dev@example.com',
          role: 'user',        // or 'manager' / 'admin'
          phone_number: '+61 400 000 000',
          is_admin: false,     // for compatibility if some code still checks is_admin
          verification_status: 'verified',
        });
        setLoading(false);
        return;
      }
      // 2) or, if you prefer always logged-in in dev even without sessionId:
      if (!sessionId && DEV_DEFAULT_SIGNED_IN) {
        localStorage.setItem('sessionId', 'DEV_FAKE_SESSION');
        setUser({
          user_id: 1,
          name: 'Dev User',
          email: 'dev@example.com',
          role: 'user',
          phone_number: '+61 400 000 000',
          is_admin: false,
          verification_status: 'verified',
        });
        setLoading(false);
        return;
      }
      // else → fall through to normal flow
    }

    // --- normal flow (session-based auth)
    if (sessionId) {
      api.get('/auth/profile/')
        .then(res => {
          // Backend returns user data with role included
          setUser(res.data);
        })
        .catch(() => {
          localStorage.removeItem('sessionId');
          // Also clear session cookie
          document.cookie = 'session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    // real backend login with session-based auth
    const res = await api.post('/auth/login/', { email, password });
    const data = res.data;

    // Check if MFA is required
    if (data.requiresMfa) {
      // Return special flag so LoginPage knows to show OTP input
      return { requiresMfa: true, message: data.message, email: data.email };
    }

    // Normal login flow
    const { user, session_id } = data;

    // Store session ID in localStorage and let cookie handle the rest
    localStorage.setItem('sessionId', session_id);
    setUser(user);
    return user;
  };

  const verifyLoginMfa = async (code) => {
    // Verify OTP code for login MFA
    const res = await api.post('/auth/verify-mfa/', { code });
    const { user, session_id } = res.data;

    // Store session ID in localStorage
    localStorage.setItem('sessionId', session_id);
    setUser(user);
    return user;
  };

  const logout = async () => {
    try {
      // Call logout endpoint to invalidate session on backend
      await api.post('/auth/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    }

    // Clear local storage and state
    localStorage.removeItem('sessionId');
    // Clear session cookie
    document.cookie = 'session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setUser(null);
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register/', userData);
    const data = res.data;

    // Check if email verification is required
    if (data.requiresVerification) {
      // Return special flag so RegisterPage knows to show OTP input
      return { requiresVerification: true, message: data.message, email: data.email };
    }

    // Normal registration flow (if email verification is not required)
    const { user, session_id } = data;

    // Store session ID in localStorage
    localStorage.setItem('sessionId', session_id);
    setUser(user);
    return user;
  };

  const verifyEmail = async (code) => {
    // Verify OTP code for email verification during registration
    const res = await api.post('/auth/verify-email/', { code });
    const { user, session_id } = res.data;

    // Store session ID in localStorage
    localStorage.setItem('sessionId', session_id);
    setUser(user);
    return user;
  };

  // helper for ProfilePanel to update phone and keep it globally in sync
  const updatePhone = (newPhone) => {
    setUser(prev => (prev ? { ...prev, phone_number: newPhone } : prev));
  };

  return (
    <AuthContext.Provider
      value={{
        user,                      // must include user.role from backend in real use
        loading,
        isAuthenticated: !!user,
        login,
        verifyLoginMfa,           // MFA verification for login
        logout,
        register,
        verifyEmail,              // Email verification for registration
        setUser,                   // handy for dev
        updatePhone,               // used by ProfilePanel after save
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
