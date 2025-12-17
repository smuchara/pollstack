import { usePage } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
import { Role, hasRole, hasAnyRole, isAdmin, isSuperAdmin, isClientSuperAdmin, UserWithRole } from '@/types/role';

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
   * Require client super admin (or super admin)
   */
  requireClientSuperAdmin?: boolean;
  /**
   * Fallback component if user doesn't have required role
   */
  fallback?: React.ReactNode;
}

/**
 * Guard component that shows/hides content based on user role
 */
export function RoleGuard({
  role,
  anyRole,
  requireAdmin,
  requireSuperAdmin,
  requireClientSuperAdmin,
  fallback = null,
  children,
}: RoleGuardProps) {
  const { auth } = usePage<{ auth: { user: UserWithRole } }>().props;
  const user = auth.user;

  // Check role conditions
  const hasAccess = (() => {
    if (requireSuperAdmin) return isSuperAdmin(user);
    if (requireClientSuperAdmin) return isClientSuperAdmin(user) || isSuperAdmin(user);
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
    isClientSuperAdmin: () => isClientSuperAdmin(user),
    isUser: () => user?.is_user ?? false,
    role: user?.role as Role | undefined,
    roleLabel: user?.role_label,
  };
}
