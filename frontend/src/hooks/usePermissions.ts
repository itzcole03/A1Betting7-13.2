import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  permissionService,
  Permission,
  Role,
  UserPermissions,
} from '../services/PermissionService';

/**
 * Custom hook for permission-based access control
 */
export const usePermissions = () => {
  const { user, isAdmin, isAuthenticated } = useAuth();

  const userPermissions = useMemo((): UserPermissions | null => {
    if (!user || !isAuthenticated) return null;

    // Special handling for Cole Madison - grant super admin
    if (user.email?.toLowerCase().includes('cole') || user.email?.toLowerCase().includes('admin')) {
      return permissionService.getColePermissions();
    }

    // Create permissions based on user data
    const roles: Role[] = [];

    // Map user role to our permission system
    if (user.role === 'admin' || isAdmin) {
      roles.push('admin');
    } else {
      roles.push('user');
    }

    // Add additional roles based on permissions
    if (user.permissions?.includes('analytics')) {
      roles.push('analyst');
    }
    if (user.permissions?.includes('trading')) {
      roles.push('trader');
    }

    return permissionService.createUserPermissions(
      user.id,
      user.email,
      roles,
      [], // custom permissions
      [], // denied permissions
      true // is active
    );
  }, [user, isAdmin, isAuthenticated]);

  const hasPermission = (permission: Permission): boolean => {
    if (!userPermissions) return false;
    return permissionService.hasPermission(userPermissions, permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!userPermissions) return false;
    return permissionService.hasAnyPermission(userPermissions, permissions);
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (!userPermissions) return false;
    return permissionService.hasAllPermissions(userPermissions, permissions);
  };

  const canManageUser = (targetRoles: Role[]): boolean => {
    if (!userPermissions) return false;
    return permissionService.canManageUser(userPermissions, targetRoles);
  };

  const getUserRoles = (): Role[] => {
    return userPermissions?.roles || [];
  };

  const getHighestRole = (): Role | null => {
    if (!userPermissions) return null;
    return permissionService.getHighestRole(userPermissions.roles);
  };

  const getAllPermissions = (): Permission[] => {
    if (!userPermissions) return [];
    return permissionService.getAllPermissions(userPermissions);
  };

  const isSuperAdmin = (): boolean => {
    return hasPermission('admin.full_access');
  };

  const isAdminUser = (): boolean => {
    return hasAnyPermission(['admin.full_access', 'admin.user_management']);
  };

  const canAccessAdminDashboard = (): boolean => {
    return hasAnyPermission(['admin.full_access', 'admin.user_management', 'admin.system_config']);
  };

  const canViewAnalytics = (): boolean => {
    return hasPermission('analytics.view');
  };

  const canManageUsers = (): boolean => {
    return hasPermission('users.view') && hasAnyPermission(['users.edit', 'users.create']);
  };

  const canPlaceTrades = (): boolean => {
    return hasPermission('trading.place_bets');
  };

  const canUseAdvancedAI = (): boolean => {
    return hasPermission('ai.advanced');
  };

  return {
    // Core permission data
    userPermissions,
    isAuthenticated,

    // Permission checking functions
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canManageUser,

    // Role functions
    getUserRoles,
    getHighestRole,
    getAllPermissions,

    // Convenience functions
    isSuperAdmin,
    isAdminUser,
    canAccessAdminDashboard,
    canViewAnalytics,
    canManageUsers,
    canPlaceTrades,
    canUseAdvancedAI,
  };
};

export default usePermissions;
