import React from 'react';
import { Shield, Lock, AlertTriangle } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission, Role } from '../../services/PermissionService';

interface PermissionGuardProps {
  children: React.ReactNode;

  // Permission requirements (at least one must be met)
  permissions?: Permission[];

  // Role requirements (at least one must be met)
  roles?: Role[];

  // Require all permissions instead of any
  requireAll?: boolean;

  // Custom access check function
  accessCheck?: () => boolean;

  // What to show when access is denied
  fallback?: React.ReactNode;

  // Whether to show a fallback or just hide content
  showFallback?: boolean;

  // Custom error message
  errorMessage?: string;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permissions = [],
  roles = [],
  requireAll = false,
  accessCheck,
  fallback,
  showFallback = true,
  errorMessage,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, getUserRoles, isAuthenticated } =
    usePermissions();

  // Check if user has access
  const hasAccess = (): boolean => {
    // Not authenticated - no access
    if (!isAuthenticated) return false;

    // Custom access check takes precedence
    if (accessCheck) {
      return accessCheck();
    }

    // Check role requirements
    if (roles.length > 0) {
      const userRoles = getUserRoles();
      const hasRequiredRole = roles.some(role => userRoles.includes(role));
      if (!hasRequiredRole) return false;
    }

    // Check permission requirements
    if (permissions.length > 0) {
      if (requireAll) {
        return hasAllPermissions(permissions);
      } else {
        return hasAnyPermission(permissions);
      }
    }

    // If no specific requirements, allow access for authenticated users
    return true;
  };

  // If user has access, render children
  if (hasAccess()) {
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    return <>{children}</>;
  }

  // If access denied and we shouldn't show fallback, render nothing
  if (!showFallback) {
    return null;
  }

  // Show custom fallback if provided
  if (fallback) {
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    return <>{fallback}</>;
  }

  // Default access denied UI
  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='flex items-center justify-center min-h-32 p-6'>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='text-center max-w-md'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center'>
          {!isAuthenticated ? (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Lock className='w-8 h-8 text-red-400' />
          ) : (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Shield className='w-8 h-8 text-red-400' />
          )}
        </div>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <h3 className='text-lg font-semibold text-white mb-2'>
          {!isAuthenticated ? 'Authentication Required' : 'Access Denied'}
        </h3>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <p className='text-gray-400 text-sm'>
          {errorMessage ||
            (!isAuthenticated
              ? 'You must be logged in to view this content.'
              : 'You do not have permission to access this feature.')}
        </p>

        {!isAuthenticated && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <button
            onClick={() => (window.location.href = '/auth')}
            className='mt-4 px-4 py-2 bg-cyber-primary hover:bg-cyber-secondary rounded-lg text-slate-900 font-medium transition-colors'
          >
            Sign In
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Higher-order component for permission-based access control
 */
export const withPermissions = <P extends object>(
  Component: React.ComponentType<P>,
  guardProps: Omit<PermissionGuardProps, 'children'>
) => {
  return (props: P) => (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <PermissionGuard {...guardProps}>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <Component {...props} />
    </PermissionGuard>
  );
};

/**
 * Component for admin-only content
 */
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback,
}) => (
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <PermissionGuard permissions={['admin.full_access', 'admin.user_management']} fallback={fallback}>
    {children}
  </PermissionGuard>
);

/**
 * Component for super admin only content
 */
export const SuperAdminOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <PermissionGuard permissions={['admin.full_access']} fallback={fallback}>
    {children}
  </PermissionGuard>
);

/**
 * Component for authenticated users only
 */
export const AuthenticatedOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <PermissionGuard
    accessCheck={() => true} // Just need to be authenticated
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export default PermissionGuard;
