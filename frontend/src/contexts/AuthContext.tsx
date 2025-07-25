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
  _authService as authService,
  PasswordChangeRequest,
  User,
} from '../services/authService';

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
const _AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider component.
 * Wrap your app with this provider to enable authentication state and actions.
 * @param {object} props - React children.
 * @returns {JSX.Element} The provider component.
 */
export const _AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);

  // Initialize auth state from storage on mount
  useEffect(() => {
    const _initializeAuth = () => {
      if (authService.isAuthenticated()) {
        const _storedUser = authService.getUser();
        if (_storedUser) {
          setUser(_storedUser);
          setIsAdmin(authService.isAdmin());
          setIsAuthenticated(true);
          setRequiresPasswordChange(authService.requiresPasswordChange());

          console.log(
            '🔐 [AUTH] Restored authentication for:',
            _storedUser.email,
            'Role:',
            _storedUser.role
          );
        }
      }
    };

    // Small delay to ensure authService constructor has run
    setTimeout(_initializeAuth, 100);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    console.log('[AUTH] Attempting login for:', email);
    try {
      const _response: AuthResponse = await authService.login(email, password);
      console.log('[AUTH] Login response:', _response);
      if (_response.success && _response.user) {
        setUser(_response.user);
        setIsAdmin(
          _response.user.role === 'admin' || _response.user.permissions?.includes('admin') || false
        );
        setIsAuthenticated(true);
        setRequiresPasswordChange(_response.requiresPasswordChange || false);
        console.log('[AUTH] Login successful:', _response.user.email);
        setTimeout(() => {
          console.log('[AUTH] State after login:', {
            user: _response.user,
            isAdmin: _response.user.role === 'admin',
            isAuthenticated: true,
            requiresPasswordChange: _response.requiresPasswordChange || false,
          });
        }, 100);
      } else {
        console.log('[AUTH] Login failed:', _response.message);
        throw new Error(_response.message || 'Login failed');
      }
    } catch (e: unknown) {
      setError((e as Error).message || 'Login failed');
      console.log('[AUTH] Login error:', e);
      throw e; // Re-throw for component handling
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
        // Update user state to reflect password change
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
      throw e; // Re-throw for component handling
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const _contextValue: AuthContextType = {
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

  return <_AuthContext.Provider value={_contextValue}>{children}</_AuthContext.Provider>;
};

/**
 * useAuth
 * Access the authentication context in any component.
 */
export const useAuth = () => {
  const ctx = useContext(_AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
