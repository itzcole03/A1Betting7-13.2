/**
 * Advanced Permission System
 * Handles role hierarchies, granular permissions, and access control
 */

export type Permission =
  // Basic permissions
  | 'read'
  | 'write'
  | 'delete'
  // System permissions
  | 'admin.full_access'
  | 'admin.user_management'
  | 'admin.system_config'
  // User management
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete'
  | 'users.suspend'
  // Analytics permissions
  | 'analytics.view'
  | 'analytics.export'
  | 'analytics.advanced'
  // Trading permissions
  | 'trading.view'
  | 'trading.place_bets'
  | 'trading.manage_bankroll'
  | 'trading.arbitrage'
  // AI/ML permissions
  | 'ai.basic'
  | 'ai.advanced'
  | 'ai.model_management'
  | 'ai.training'
  // Data permissions
  | 'data.view'
  | 'data.export'
  | 'data.import'
  | 'data.manage_sources'
  // Financial permissions
  | 'finance.view_reports'
  | 'finance.manage_accounts'
  | 'finance.configure_limits'
  // System monitoring
  | 'monitor.view_logs'
  | 'monitor.system_health'
  | 'monitor.alerts'
  // Content management
  | 'content.view'
  | 'content.edit'
  | 'content.publish'
  | 'content.moderate';

export type Role =
  | 'super_admin' // Full system access
  | 'admin' // Administrative access
  | 'analyst' // Analytics and reporting
  | 'trader' // Trading and betting
  | 'viewer' // Read-only access
  | 'user' // Basic user access
  | 'guest'; // Limited access

export interface RoleDefinition {
  name: Role;
  displayName: string;
  description: string;
  permissions: Permission[];
  inherits?: Role[];
  priority: number; // Higher number = higher priority
  canManage?: Role[]; // Roles this role can manage
}

export interface UserPermissions {
  userId: string;
  email: string;
  roles: Role[];
  customPermissions: Permission[];
  deniedPermissions: Permission[];
  isActive: boolean;
  expiresAt?: Date;
}

class PermissionService {
  private roleDefinitions: Map<Role, RoleDefinition> = new Map();

  constructor() {
    this.initializeRoles();
  }

  /**
   * Initialize default role definitions
   */
  private initializeRoles(): void {
    const roles: RoleDefinition[] = [
      {
        name: 'super_admin',
        displayName: 'Super Administrator',
        description: 'Full system access with all permissions',
        permissions: [
          'admin.full_access',
          'admin.user_management',
          'admin.system_config',
          'users.view',
          'users.create',
          'users.edit',
          'users.delete',
          'users.suspend',
          'analytics.view',
          'analytics.export',
          'analytics.advanced',
          'trading.view',
          'trading.place_bets',
          'trading.manage_bankroll',
          'trading.arbitrage',
          'ai.basic',
          'ai.advanced',
          'ai.model_management',
          'ai.training',
          'data.view',
          'data.export',
          'data.import',
          'data.manage_sources',
          'finance.view_reports',
          'finance.manage_accounts',
          'finance.configure_limits',
          'monitor.view_logs',
          'monitor.system_health',
          'monitor.alerts',
          'content.view',
          'content.edit',
          'content.publish',
          'content.moderate',
          'read',
          'write',
          'delete',
        ],
        priority: 1000,
        canManage: ['admin', 'analyst', 'trader', 'viewer', 'user', 'guest'],
      },
      {
        name: 'admin',
        displayName: 'Administrator',
        description: 'Administrative access with user and system management',
        permissions: [
          'admin.user_management',
          'users.view',
          'users.create',
          'users.edit',
          'users.suspend',
          'analytics.view',
          'analytics.export',
          'analytics.advanced',
          'trading.view',
          'trading.place_bets',
          'trading.manage_bankroll',
          'trading.arbitrage',
          'ai.basic',
          'ai.advanced',
          'data.view',
          'data.export',
          'data.import',
          'finance.view_reports',
          'finance.manage_accounts',
          'monitor.view_logs',
          'monitor.system_health',
          'monitor.alerts',
          'content.view',
          'content.edit',
          'content.publish',
          'content.moderate',
          'read',
          'write',
        ],
        priority: 900,
        canManage: ['analyst', 'trader', 'viewer', 'user', 'guest'],
      },
      {
        name: 'analyst',
        displayName: 'Data Analyst',
        description: 'Analytics and reporting specialist',
        permissions: [
          'analytics.view',
          'analytics.export',
          'analytics.advanced',
          'ai.basic',
          'ai.advanced',
          'data.view',
          'data.export',
          'finance.view_reports',
          'monitor.view_logs',
          'content.view',
          'read',
        ],
        priority: 600,
        canManage: ['viewer', 'guest'],
      },
      {
        name: 'trader',
        displayName: 'Professional Trader',
        description: 'Advanced trading and betting capabilities',
        permissions: [
          'trading.view',
          'trading.place_bets',
          'trading.manage_bankroll',
          'trading.arbitrage',
          'analytics.view',
          'analytics.export',
          'ai.basic',
          'ai.advanced',
          'data.view',
          'finance.view_reports',
          'content.view',
          'read',
          'write',
        ],
        priority: 700,
        canManage: ['viewer', 'guest'],
      },
      {
        name: 'viewer',
        displayName: 'Read-Only User',
        description: 'View-only access to platform features',
        permissions: [
          'analytics.view',
          'trading.view',
          'ai.basic',
          'data.view',
          'content.view',
          'read',
        ],
        priority: 400,
        canManage: ['guest'],
      },
      {
        name: 'user',
        displayName: 'Standard User',
        description: 'Basic platform access with limited features',
        permissions: [
          'trading.view',
          'trading.place_bets',
          'analytics.view',
          'ai.basic',
          'content.view',
          'read',
        ],
        priority: 500,
        canManage: ['guest'],
      },
      {
        name: 'guest',
        displayName: 'Guest',
        description: 'Limited access for trial users',
        permissions: ['content.view', 'read'],
        priority: 100,
        canManage: [],
      },
    ];

    roles.forEach(role => {
      this.roleDefinitions.set(role.name, role);
    });
  }

  /**
   * Get role definition
   */
  getRoleDefinition(role: Role): RoleDefinition | undefined {
    return this.roleDefinitions.get(role);
  }

  /**
   * Get all available roles
   */
  getAllRoles(): RoleDefinition[] {
    return Array.from(this.roleDefinitions.values()).sort((a, b) => b.priority - a.priority);
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(userPermissions: UserPermissions, permission: Permission): boolean {
    if (!userPermissions.isActive) return false;

    // Check if permission is explicitly denied
    if (userPermissions.deniedPermissions.includes(permission)) {
      return false;
    }

    // Check custom permissions first
    if (userPermissions.customPermissions.includes(permission)) {
      return true;
    }

    // Check role-based permissions
    return userPermissions.roles.some(role => {
      const roleDefinition = this.getRoleDefinition(role);
      return roleDefinition?.permissions.includes(permission) || false;
    });
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(userPermissions: UserPermissions, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(userPermissions, permission));
  }

  /**
   * Check if user has all specified permissions
   */
  hasAllPermissions(userPermissions: UserPermissions, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(userPermissions, permission));
  }

  /**
   * Check if user can manage another user based on roles
   */
  canManageUser(managerPermissions: UserPermissions, targetRoles: Role[]): boolean {
    if (!managerPermissions.isActive) return false;

    // Super admin can manage anyone
    if (managerPermissions.roles.includes('super_admin')) return true;

    // Check if any of the manager's roles can manage the target roles
    return managerPermissions.roles.some(managerRole => {
      const roleDefinition = this.getRoleDefinition(managerRole);
      return targetRoles.every(
        targetRole => roleDefinition?.canManage?.includes(targetRole) || false
      );
    });
  }

  /**
   * Get highest priority role for a user
   */
  getHighestRole(roles: Role[]): Role | null {
    let highestRole: Role | null = null;
    let highestPriority = -1;

    roles.forEach(role => {
      const definition = this.getRoleDefinition(role);
      if (definition && definition.priority > highestPriority) {
        highestPriority = definition.priority;
        highestRole = role;
      }
    });

    return highestRole;
  }

  /**
   * Get all permissions for a user (computed from roles + custom permissions)
   */
  getAllPermissions(userPermissions: UserPermissions): Permission[] {
    const allPermissions = new Set<Permission>();

    // Add role-based permissions
    userPermissions.roles.forEach(role => {
      const roleDefinition = this.getRoleDefinition(role);
      roleDefinition?.permissions.forEach(permission => {
        allPermissions.add(permission);
      });
    });

    // Add custom permissions
    userPermissions.customPermissions.forEach(permission => {
      allPermissions.add(permission);
    });

    // Remove denied permissions
    userPermissions.deniedPermissions.forEach(permission => {
      allPermissions.delete(permission);
    });

    return Array.from(allPermissions);
  }

  /**
   * Create user permissions object
   */
  createUserPermissions(
    userId: string,
    email: string,
    roles: Role[],
    customPermissions: Permission[] = [],
    deniedPermissions: Permission[] = [],
    isActive: boolean = true,
    expiresAt?: Date
  ): UserPermissions {
    return {
      userId,
      email,
      roles,
      customPermissions,
      deniedPermissions,
      isActive,
      expiresAt,
    };
  }

  /**
   * Check if permissions are expired
   */
  isExpired(userPermissions: UserPermissions): boolean {
    if (!userPermissions.expiresAt) return false;
    return new Date() > userPermissions.expiresAt;
  }

  /**
   * Get permissions for Cole Madison (admin)
   */
  getColePermissions(): UserPermissions {
    return this.createUserPermissions(
      'cole_admin',
      'cole@example.com',
      ['super_admin'],
      [],
      [],
      true
    );
  }

  /**
   * Validate permission string
   */
  isValidPermission(permission: string): permission is Permission {
    const validPermissions: Permission[] = [
      'read',
      'write',
      'delete',
      'admin.full_access',
      'admin.user_management',
      'admin.system_config',
      'users.view',
      'users.create',
      'users.edit',
      'users.delete',
      'users.suspend',
      'analytics.view',
      'analytics.export',
      'analytics.advanced',
      'trading.view',
      'trading.place_bets',
      'trading.manage_bankroll',
      'trading.arbitrage',
      'ai.basic',
      'ai.advanced',
      'ai.model_management',
      'ai.training',
      'data.view',
      'data.export',
      'data.import',
      'data.manage_sources',
      'finance.view_reports',
      'finance.manage_accounts',
      'finance.configure_limits',
      'monitor.view_logs',
      'monitor.system_health',
      'monitor.alerts',
      'content.view',
      'content.edit',
      'content.publish',
      'content.moderate',
    ];

    return validPermissions.includes(permission as Permission);
  }
}

// Export singleton instance
export const permissionService = new PermissionService();

// Export class for testing
export default PermissionService;
