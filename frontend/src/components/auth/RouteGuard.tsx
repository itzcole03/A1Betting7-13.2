import React, { useEffect } from 'react';
// @ts-expect-error TS(6142): Module '../../contexts/AuthContext' was resolved t... Remove this comment to see the full error message
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission, Role } from '../../services/PermissionService';
// @ts-expect-error TS(6142): Module './PermissionGuard' was resolved to 'C:/Use... Remove this comment to see the full error message
import PermissionGuard from './PermissionGuard';

interface RouteGuardProps {
  children: React.ReactNode;

  // Route protection level
  requiresAuth?: boolean;
  requiresAdmin?: boolean;

  // Specific permissions required
  permissions?: Permission[];
  roles?: Role[];
  requireAll?: boolean;

  // Redirect behavior
  redirectTo?: string;
  showFallback?: boolean;

  // Custom access check
  accessCheck?: () => boolean;
}

const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requiresAuth = true,
  requiresAdmin = false,
  permissions = [],
  roles = [],
  requireAll = false,
  redirectTo,
  showFallback = true,
  accessCheck,
}) => {
  const { isAuthenticated, requiresPasswordChange } = useAuth();
  const { canAccessAdminDashboard } = usePermissions();

  // Handle redirects
  useEffect(() => {
    if (!isAuthenticated && requiresAuth && redirectTo) {
      window.location.href = redirectTo;
      return;
    }

    if (requiresAdmin && !canAccessAdminDashboard() && redirectTo) {
      window.location.href = redirectTo;
      return;
    }
  }, [isAuthenticated, requiresAuth, requiresAdmin, canAccessAdminDashboard, redirectTo]);

  // If user needs to change password, handle that first
  if (isAuthenticated && requiresPasswordChange) {
    return (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='text-center'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h2 className='text-xl font-bold text-white mb-4'>Password Change Required</h2>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <p className='text-gray-400'>You must change your password before accessing this page.</p>
        </div>
      </div>
    );
  }

  // Basic auth check
  if (requiresAuth && !isAuthenticated) {
    if (!showFallback) return null;

    return (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='text-center max-w-md'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span className='text-red-400 text-2xl'>🔒</span>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h2 className='text-xl font-bold text-white mb-4'>Authentication Required</h2>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <p className='text-gray-400 mb-6'>You must be logged in to access this page.</p>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <button
            onClick={() => (window.location.href = '/auth')}
            className='px-6 py-3 bg-gradient-to-r from-cyber-primary to-cyber-accent rounded-lg text-slate-900 font-medium hover:from-cyber-secondary hover:to-cyber-primary transition-all'
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Admin check
  if (requiresAdmin && !canAccessAdminDashboard()) {
    if (!showFallback) return null;

    return (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='text-center max-w-md'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span className='text-red-400 text-2xl'>🛡️</span>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h2 className='text-xl font-bold text-white mb-4'>Admin Access Required</h2>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <p className='text-gray-400 mb-6'>
            You need administrator privileges to access this page.
          </p>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <button
            onClick={() => (window.location.href = '/')}
            className='px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors'
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Use PermissionGuard for detailed permission checking
  if (permissions.length > 0 || roles.length > 0 || accessCheck) {
    return (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <PermissionGuard
        permissions={permissions}
        roles={roles}
        requireAll={requireAll}
        accessCheck={accessCheck}
        showFallback={showFallback}
      >
        {children}
      </PermissionGuard>
    );
  }

  // If all checks pass, render children
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  return <>{children}</>;
};

/**
 * Higher-order component for route protection
 */
export const withRouteGuard = <P extends object>(
  Component: React.ComponentType<P>,
  guardProps: Omit<RouteGuardProps, 'children'>
) => {
  return (props: P) => (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <RouteGuard {...guardProps}>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <Component {...props} />
    </RouteGuard>
  );
};

/**
 * Admin route guard
 */
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <RouteGuard requiresAdmin={true} redirectTo='/auth'>
    {children}
  </RouteGuard>
);

/**
 * Protected route (requires authentication)
 */
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <RouteGuard requiresAuth={true} redirectTo='/auth'>
    {children}
  </RouteGuard>
);

export default RouteGuard;
