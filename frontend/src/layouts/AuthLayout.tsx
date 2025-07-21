import React, { ReactNode } from 'react';
// @ts-expect-error TS(6142): Module '../contexts/AuthContext' was resolved to '... Remove this comment to see the full error message
import { AuthProvider, useAuth } from '../contexts/AuthContext';

/**
 * AuthLayout
 * Layout wrapper for authenticated pages. Redirects to login if not authenticated.
 * @param {ReactNode} children
 */
export const AuthLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Example: useAuth for redirect logic (replace with real router logic)
  const { user, loading } = useAuth();
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  if (loading) return <div>Loading...</div>;
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  if (!user) return <div>Please log in to access this page.</div>;
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  return <>{children}</>;
};

/**
 * AuthLayoutProvider
 * Wraps children with AuthProvider for context.
 */
export const AuthLayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => (
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <AuthProvider>{children}</AuthProvider>
);
