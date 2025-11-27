import { usePage } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

interface PermissionGuardProps extends PropsWithChildren {
  /**
   * Require a specific permission
   */
  permission?: string;
  /**
   * Require any of these permissions (OR logic)
   */
  anyPermission?: string[];
  /**
   * Require all of these permissions (AND logic)
   */
  allPermissions?: string[];
  /**
   * Fallback component if user doesn't have required permission
   */
  fallback?: React.ReactNode;
  /**
   * If true, shows fallback when permission is denied. If false, hides completely.
   * @default false
   */
  showFallback?: boolean;
}

/**
 * Guard component that shows/hides content based on user permissions
 *
 * @example
 * // Show content only to users with specific permission
 * <PermissionGuard permission="invite_users">
 *   <Button>Invite User</Button>
 * </PermissionGuard>
 *
 * @example
 * // Show content to users with any of multiple permissions
 * <PermissionGuard anyPermission={['edit_polls', 'delete_polls']}>
 *   <PollActions />
 * </PermissionGuard>
 *
 * @example
 * // Show content to users with all of multiple permissions
 * <PermissionGuard allPermissions={['view_polls', 'export_results']}>
 *   <ExportButton />
 * </PermissionGuard>
 *
 * @example
 * // With fallback (locked feature)
 * <PermissionGuard 
 *   permission="invite_users"
 *   showFallback
 *   fallback={<LockedFeatureCard feature="Invite Users" />}>
 *   <InviteUserModule />
 * </PermissionGuard>
 */
export function PermissionGuard({
  permission,
  anyPermission,
  allPermissions,
  fallback = null,
  showFallback = false,
  children,
}: PermissionGuardProps) {
  const { auth } = usePage<{ 
    auth: { 
      user: { 
        permissions?: string[]; 
        is_super_admin?: boolean;
      } 
    } 
  }>().props;
  
  const user = auth.user;
  const userPermissions = user.permissions || [];

  // Super admin bypasses all permission checks
  if (user.is_super_admin) {
    return <>{children}</>;
  }

  // Check permission conditions
  const hasAccess = (() => {
    if (permission) {
      return userPermissions.includes(permission);
    }
    if (anyPermission) {
      return anyPermission.some((p) => userPermissions.includes(p));
    }
    if (allPermissions) {
      return allPermissions.every((p) => userPermissions.includes(p));
    }
    return false;
  })();

  if (!hasAccess) {
    return showFallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

/**
 * Hook to check user permissions imperatively
 *
 * @example
 * const { hasPermission, hasAnyPermission, permissions } = usePermission();
 * 
 * if (hasPermission('invite_users')) {
 *   // Show invite button
 * }
 * 
 * if (hasAnyPermission(['edit_polls', 'delete_polls'])) {
 *   // Show poll management
 * }
 */
export function usePermission() {
  const { auth } = usePage<{ 
    auth: { 
      user: { 
        permissions?: string[]; 
        is_super_admin?: boolean;
      } 
    } 
  }>().props;
  
  const user = auth.user;
  const permissions = user.permissions || [];

  return {
    /**
     * Check if user has a specific permission
     */
    hasPermission: (permission: string): boolean => {
      return user.is_super_admin || permissions.includes(permission);
    },
    /**
     * Check if user has any of the given permissions
     */
    hasAnyPermission: (perms: string[]): boolean => {
      return user.is_super_admin || perms.some((p) => permissions.includes(p));
    },
    /**
     * Check if user has all of the given permissions
     */
    hasAllPermissions: (perms: string[]): boolean => {
      return user.is_super_admin || perms.every((p) => permissions.includes(p));
    },
    /**
     * Array of all user permissions
     */
    permissions,
    /**
     * Check if user is super admin (bypasses all checks)
     */
    isSuperAdmin: user.is_super_admin || false,
  };
}
