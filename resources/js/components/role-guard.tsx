import { usePage } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
import { Role, hasRole, hasAnyRole, isAdmin, isSuperAdmin, UserWithRole } from '@/types/role';

interface RoleGuardProps extends PropsWithChildren {
  /**
   * Require exact role match
   */
  role?: Role;
  /**
   * Require any of these roles
   */
  anyRole?: Role[];
  /**
   * Require admin or super admin role
   */
  requireAdmin?: boolean;
  /**
   * Require super admin role only
   */
  requireSuperAdmin?: boolean;
  /**
   * Fallback component if user doesn't have required role
   */
  fallback?: React.ReactNode;
}

/**
 * Guard component that shows/hides content based on user role
 *
 * @example
 * // Show content only to super admins
 * <RoleGuard requireSuperAdmin>
 *   <button>Delete System</button>
 * </RoleGuard>
 *
 * @example
 * // Show content to admins (including super admins)
 * <RoleGuard requireAdmin>
 *   <Link href="/admin">Admin Panel</Link>
 * </RoleGuard>
 *
 * @example
 * // Show content to specific role
 * <RoleGuard role={Role.ADMIN}>
 *   <p>Admin only content</p>
 * </RoleGuard>
 *
 * @example
 * // Show content to any of multiple roles
 * <RoleGuard anyRole={[Role.ADMIN, Role.SUPER_ADMIN]}>
 *   <p>Admin or Super Admin content</p>
 * </RoleGuard>
 *
 * @example
 * // With fallback
 * <RoleGuard requireAdmin fallback={<p>Access Denied</p>}>
 *   <AdminPanel />
 * </RoleGuard>
 */
export function RoleGuard({
  role,
  anyRole,
  requireAdmin,
  requireSuperAdmin,
  fallback = null,
  children,
}: RoleGuardProps) {
  const { auth } = usePage<{ auth: { user: UserWithRole } }>().props;
  const user = auth.user;

  // Check role conditions
  const hasAccess = (() => {
    if (requireSuperAdmin) return isSuperAdmin(user);
    if (requireAdmin) return isAdmin(user);
    if (role) return hasRole(user, role);
    if (anyRole) return hasAnyRole(user, anyRole);
    return false;
  })();

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook to check user roles
 */
export function useRole() {
  const { auth } = usePage<{ auth: { user: UserWithRole } }>().props;
  const user = auth.user;

  return {
    user,
    hasRole: (role: Role) => hasRole(user, role),
    hasAnyRole: (roles: Role[]) => hasAnyRole(user, roles),
    isAdmin: () => isAdmin(user),
    isSuperAdmin: () => isSuperAdmin(user),
    isUser: () => user?.is_user ?? false,
    role: user?.role as Role | undefined,
    roleLabel: user?.role_label,
  };
}
