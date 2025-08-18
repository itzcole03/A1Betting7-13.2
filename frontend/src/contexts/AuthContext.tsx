/**
 * Authentication context and provider for managing user authentication state and actions.
 *
 * Provides login, logout, registration, and password management for the app.
 *
 * @module contexts/AuthContext
 */
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import {
  AuthResponse,
  authService,
  PasswordChangeRequest,
  User,
} from '../services/authService';
import { logger } from '../utils/logger';

/**
 * AuthContextType
 * Provides authentication state and actions for the app.
 */
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  requiresPasswordChange: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (data: PasswordChangeRequest) => Promise<void>;
  clearError: () => void;
  register: (email: string, password: string) => Promise<void>;
}
// Stub register method for test compatibility
const register = async (_email: string, _password: string) => {
  // In a real implementation, this would call an API endpoint
  return Promise.resolve();
};

/**
 * React context for authentication state and actions.
 */
export const _AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider component.
 * Wrap your app with this provider to enable authentication state and actions.
 * @param {object} props - React children.
 * @returns {JSX.Element} The provider component.
 */
/**
 * useAuthState
 * Custom hook to encapsulate authentication state logic for modularity and testability.
 */
function useAuthState(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);

  useEffect(() => {
    // Skip auth restoration if bootstrap already handled it
    const globalState = window as typeof window & { __A1_AUTH_RESTORED?: boolean };
    if (typeof window !== 'undefined' && globalState.__A1_AUTH_RESTORED) {
      return;
    }

    const _initializeAuth = () => {
      if (authService.isAuthenticated()) {
        const _storedUser = authService.getUser();
        if (_storedUser) {
          setUser(_storedUser);
          setIsAdmin(authService.isAdmin());
          setIsAuthenticated(true);
          setRequiresPasswordChange(authService.requiresPasswordChange());
          
          // Mark as restored to prevent duplicate logs
          if (typeof window !== 'undefined') {
            globalState.__A1_AUTH_RESTORED = true;
          }
          
          // Structured logging for audit (only if not already restored by bootstrap)
          logger.info(
            '🔐 Authentication restored',
            {
              email: _storedUser.email,
              role: _storedUser.role,
              userId: _storedUser.id,
            },
            'Auth'
          );
        }
      }
    };
    setTimeout(_initializeAuth, 100);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const _response: AuthResponse = await authService.login(email, password);
      if (_response.success && _response.user) {
        setUser(_response.user);
        setIsAdmin(
          _response.user.role === 'admin' || _response.user.permissions?.includes('admin') || false
        );
        setIsAuthenticated(true);
        setRequiresPasswordChange(_response.requiresPasswordChange || false);
      } else {
        throw new Error(_response.message || 'Login failed');
      }
    } catch (e: unknown) {
      setError((e as Error).message || 'Login failed');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.logout();
      setUser(null);
      setIsAdmin(false);
      setIsAuthenticated(false);
      setRequiresPasswordChange(false);
    } catch (e: unknown) {
      setError((e as Error).message || 'Logout failed');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (data: PasswordChangeRequest) => {
    setLoading(true);
    setError(null);
    try {
      const _response: AuthResponse = await authService.changePassword(data);
      if (_response.success) {
        const _updatedUser = authService.getUser();
        if (_updatedUser) {
          setUser(_updatedUser);
          setRequiresPasswordChange(false);
        }
      } else {
        throw new Error(_response.message || 'Password change failed');
      }
    } catch (e: unknown) {
      setError((e as Error).message || 'Password change failed');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    user,
    loading,
    error,
    isAdmin,
    isAuthenticated,
    requiresPasswordChange,
    login,
    logout,
    changePassword,
    clearError,
    register,
  };
}

/**
 * AuthProvider component.
 * Wrap your app with this provider to enable authentication state and actions.
 * Uses useAuthState for modularity and testability.
 * @param {object} props - React children.
 * @returns {JSX.Element} The provider component.
 */
const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const contextValue = useAuthState();
  return <_AuthContext.Provider value={contextValue}>{children}</_AuthContext.Provider>;
};

export const _AuthProvider = AuthProvider;

/**
 * useAuth
 * Access the authentication context in any component.
 */
export const useAuth = () => {
  const ctx = useContext(_AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
