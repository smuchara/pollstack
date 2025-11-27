/**
 * Role-based access control types
 */

export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  USER = 'user',
}

export interface UserWithRole {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  role: Role;
  role_label: string;
  is_super_admin: boolean;
  is_admin: boolean;
  is_user: boolean;
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: UserWithRole | null, role: Role): boolean {
  return user?.role === role;
}

/**
 * Check if user has any of the given roles
 */
export function hasAnyRole(user: UserWithRole | null, roles: Role[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * Check if user is a super admin
 */
export function isSuperAdmin(user: UserWithRole | null): boolean {
  return user?.is_super_admin ?? false;
}

/**
 * Check if user is an admin (including super admin)
 */
export function isAdmin(user: UserWithRole | null): boolean {
  return user?.is_admin ?? false;
}

/**
 * Check if user is a regular user
 */
export function isUser(user: UserWithRole | null): boolean {
  return user?.is_user ?? false;
}
