/**
 * Permission types for role-based access control
 */

export interface Permission {
  id: number;
  name: string;
  label: string;
  category: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PermissionGroup {
  id: number;
  name: string;
  label: string;
  description?: string;
  is_system: boolean;
  scope: 'system' | 'client';
  organization_id?: number | null;
  permissions: Permission[];
  permissions_count?: number;
  users_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface GroupedPermissions {
  [category: string]: Permission[];
}

export interface UserPermissions {
  permission_groups: PermissionGroup[];
  direct_permissions: Array<{
    id: number;
    name: string;
    label: string;
    granted: boolean;
  }>;
  all_permissions: string[];
}

/**
 * Permission categories
 */
export enum PermissionCategory {
  USER_MANAGEMENT = 'user_management',
  POLLS = 'polls',
  VOTING = 'voting',
  SYSTEM = 'system',
  GENERAL = 'general',
}

/**
 * Permission names (enum for type safety)
 */
export enum PermissionName {
  // User Management
  INVITE_USERS = 'invite_users',
  VIEW_USERS = 'view_users',
  EDIT_USERS = 'edit_users',
  DELETE_USERS = 'delete_users',
  ASSIGN_ROLES = 'assign_roles',
  SEND_PASSWORD_RESET = 'send_password_reset',
  MANAGE_PERMISSIONS = 'manage_permissions',

  // Poll Management
  CREATE_POLLS = 'create_polls',
  EDIT_POLLS = 'edit_polls',
  DELETE_POLLS = 'delete_polls',
  VIEW_POLLS = 'view_polls',
  PUBLISH_POLLS = 'publish_polls',
  MODERATE_POLLS = 'moderate_polls',

  // Voting Management
  CAST_VOTES = 'cast_votes',
  VIEW_RESULTS = 'view_results',
  EXPORT_RESULTS = 'export_results',
  VERIFY_VOTES = 'verify_votes',

  // System Configuration
  MANAGE_SETTINGS = 'manage_settings',
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  MANAGE_NOTIFICATIONS = 'manage_notifications',
}

/**
 * Category labels
 */
export const CATEGORY_LABELS: Record<string, string> = {
  user_management: 'User Management',
  polls: 'Poll Management',
  voting: 'Voting & Results',
  system: 'System Settings',
  general: 'General',
};

/**
 * Category icons (Lucide icon names)
 */
export const CATEGORY_ICONS: Record<string, string> = {
  user_management: 'Users',
  polls: 'Vote',
  voting: 'BarChart3',
  system: 'Settings',
  general: 'Shield',
};
