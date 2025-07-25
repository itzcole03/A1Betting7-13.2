import React, { ReactNode } from 'react';
// @ts-expect-error TS(6142): Module '../contexts/AuthContext' was resolved to '... Remove this comment to see the full error message
import { _AuthProvider, useAuth } from '../contexts/AuthContext';

/**
 * AuthLayout
 * Layout wrapper for authenticated pages. Redirects to login if not authenticated.
 * @param {ReactNode} children
 */
export const _AuthLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
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
export const _AuthLayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => (
  <_AuthProvider>{children}</_AuthProvider>
);
