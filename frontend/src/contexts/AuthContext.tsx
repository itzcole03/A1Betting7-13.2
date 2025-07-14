import React, { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { authService, User, PasswordChangeRequest } from '../services/AuthService';

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
  checkAdminStatus: () => boolean;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider
 * Wrap your app with this provider to enable authentication state and actions.
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);

  // Initialize auth state from storage on mount
  useEffect(() => {
    const initializeAuth = () => {
      if (authService.isAuthenticated()) {
        const storedUser = authService.getUser();
        if (storedUser) {
          setUser(storedUser);
          setIsAdmin(authService.isAdmin());
          setIsAuthenticated(true);
          setRequiresPasswordChange(authService.requiresPasswordChange());

          console.log(
            '🔐 [AUTH] Restored authentication for:',
            storedUser.email,
            'Role:',
            storedUser.role
          );
        }
      }
    };

    // Small delay to ensure authService constructor has run
    setTimeout(initializeAuth, 100);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(email, password);

      if (response.success && response.user) {
        setUser(response.user);
        setIsAdmin(
          response.user.role === 'admin' || response.user.permissions?.includes('admin') || false
        );
        setIsAuthenticated(true);
        setRequiresPasswordChange(response.requiresPasswordChange || false);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (e: any) {
      setError(e.message || 'Login failed');
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
    } catch (e: any) {
      setError(e.message || 'Logout failed');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (data: PasswordChangeRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.changePassword(data);

      if (response.success) {
        // Update user state to reflect password change
        const updatedUser = authService.getUser();
        if (updatedUser) {
          setUser(updatedUser);
          setRequiresPasswordChange(false);
        }
      } else {
        throw new Error(response.message || 'Password change failed');
      }
    } catch (e: any) {
      setError(e.message || 'Password change failed');
      throw e; // Re-throw for component handling
    } finally {
      setLoading(false);
    }
  };

  const checkAdminStatus = () => {
    return isAdmin && user && (user.role === 'admin' || user.permissions?.includes('admin'));
  };

  const clearError = () => {
    setError(null);
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    error,
    isAdmin,
    isAuthenticated,
    requiresPasswordChange,
    login,
    logout,
    changePassword,
    checkAdminStatus,
    clearError,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

/**
 * useAuth
 * Access the authentication context in any component.
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
