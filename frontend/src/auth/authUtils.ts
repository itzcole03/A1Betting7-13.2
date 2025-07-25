import { createContext, useContext } from 'react';
import api from '../api';

export interface AuthContextValue {
  user: unknown;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const _AuthContext = createContext<AuthContextValue | undefined>(undefined);

  const context = useContext(_AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Backend login function
export async function login(username: string, password: string) {
  try {
    const resp = await api.post('/token', new URLSearchParams({ username, password }));
    if (resp.status === 200 && resp.data.access_token) {
      localStorage.setItem('auth_token', resp.data.access_token);
      return { success: true };
    }
    return { success: false, error: resp.data.detail || 'Login failed' };
  } catch (err: any) {
    return { success: false, error: err?.response?.data?.detail || 'Login error' };
  }
}

// Backend registration function
export async function register(userData: Record<string, unknown>) {
  try {
    const resp = await api.post('/register', userData);
    if (resp.status === 200 && resp.data.message === 'User registered successfully') {
      return { success: true };
    }
    return { success: false, error: resp.data.detail || 'Registration failed' };
  } catch (err: any) {
    return { success: false, error: err?.response?.data?.detail || 'Registration error' };
  }
}
