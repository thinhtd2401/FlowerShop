/**
 * context/AuthContext.jsx - Authentication & RBAC Screen Permissions Context
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('flowershop_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('flowershop_token') || null;
  });

  const [loading, setLoading] = useState(true);

  // Sync state to localStorage
  const saveSession = useCallback((newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    if (newToken) {
      localStorage.setItem('flowershop_token', newToken);
    } else {
      localStorage.removeItem('flowershop_token');
    }
    if (newUser) {
      localStorage.setItem('flowershop_user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('flowershop_user');
    }
  }, []);

  const logout = useCallback(() => {
    saveSession(null, null);
  }, [saveSession]);

  // Check current session validity on mount
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('flowershop_token');
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await authApi.getMe();
        if (res?.user) {
          setUser(res.user);
          localStorage.setItem('flowershop_user', JSON.stringify(res.user));
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Session verification failed, logging out:', err?.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen to unauthorized event from axios interceptor
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('flowershop:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('flowershop:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  // Email + Password login
  const loginWithEmail = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res?.token && res?.user) {
      saveSession(res.token, res.user);
      return res.user;
    }
    throw new Error(res?.error || 'Đăng nhập không thành công');
  }, [saveSession]);

  // Google Sign-In login
  const loginWithGoogle = useCallback(async (credential, devMock) => {
    const res = await authApi.googleLogin({ credential, devMock });
    if (res?.token && res?.user) {
      saveSession(res.token, res.user);
      return res.user;
    }
    throw new Error(res?.error || 'Đăng nhập Google không thành công');
  }, [saveSession]);

  // Register new staff user
  const registerUser = useCallback(async (name, email, password) => {
    const res = await authApi.register({ name, email, password });
    if (res?.token && res?.user) {
      saveSession(res.token, res.user);
      return res.user;
    }
    throw new Error(res?.error || 'Đăng ký không thành công');
  }, [saveSession]);

  // Update current user locally (e.g. avatar or name change)
  const updateCurrentUser = useCallback((updatedFields) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('flowershop_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  /**
   * Screen Permission Checker
   * @param {string} screenKey - 'dashboard' | 'orders' | 'timeline' | 'expenses' | 'users'
   */
  const hasPermission = useCallback((screenKey) => {
    if (!user) return false;

    // Admin & Manager have full access to everything
    if (user.role === 'admin' || user.role === 'manager') {
      return true;
    }

    // Staff cannot access Dashboard or User Management
    if (screenKey === 'dashboard' || screenKey === 'users') {
      return false;
    }

    // Staff granular permissions
    const perms = Array.isArray(user.permissions) ? user.permissions : [];
    return perms.includes(screenKey);
  }, [user]);

  /**
   * Get default landing screen based on permissions
   */
  const getDefaultScreen = useCallback(() => {
    if (!user) return 'orders';
    if (user.role === 'admin' || user.role === 'manager') {
      return 'dashboard';
    }
    const perms = Array.isArray(user.permissions) ? user.permissions : [];
    if (perms.includes('orders')) return 'orders';
    if (perms.includes('timeline')) return 'timeline';
    if (perms.includes('expenses')) return 'expenses';
    return 'orders';
  }, [user]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    loginWithEmail,
    loginWithGoogle,
    registerUser,
    logout,
    updateCurrentUser,
    hasPermission,
    getDefaultScreen
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
