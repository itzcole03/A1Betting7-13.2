// DISABLED - This file was conflicting with the main auth system in services/authService.ts
// Redirecting to the correct auth system to prevent import errors

export { useAuth, _AuthContext } from '../contexts/AuthContext';

// Stub functions to prevent import errors
export async function login(username: string, password: string) {
  console.warn('Deprecated auth utils - use AuthContext instead');
  return { success: false, error: 'Use AuthContext instead' };
}

export async function register(userData: Record<string, unknown>) {
  console.warn('Deprecated auth utils - use AuthContext instead');
  return { success: false, error: 'Use AuthContext instead' };
}
