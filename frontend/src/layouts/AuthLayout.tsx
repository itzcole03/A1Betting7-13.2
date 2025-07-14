import React, { ReactNode } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

/**
 * AuthLayout
 * Layout wrapper for authenticated pages. Redirects to login if not authenticated.
 * @param {ReactNode} children
 */
export const AuthLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Example: useAuth for redirect logic (replace with real router logic)
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in to access this page.</div>;
  return <>{children}</>;
};

/**
 * AuthLayoutProvider
 * Wraps children with AuthProvider for context.
 */
export const AuthLayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);
