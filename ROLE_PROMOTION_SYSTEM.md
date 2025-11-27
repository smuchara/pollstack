# Role Promotion System

## Overview

The application implements an **automatic role promotion system** that ensures users with assigned permissions are automatically elevated to the `admin` role. This enables proper UI rendering and access control.

## Role Hierarchy

The system has three distinct role levels:

1. **Super Admin** (`super_admin`)
   - Full system access
   - All permissions by default
   - Access to super admin routes and features

2. **Admin** (`admin`)
   - Administrative access with specific permissions
   - Can manage users, settings, etc. based on assigned permissions
   - Access to admin routes and features

3. **User** (`user`)
   - Regular user with no administrative permissions
   - Limited to user-specific features
   - Cannot access admin routes

## Automatic Promotion Logic

### When Does Promotion Happen?

A regular user (`user`) is **automatically promoted to `admin`** when:
- Permission groups are assigned to them
- Direct permissions are granted to them

### Implementation

The promotion logic is implemented in the `User` model:

```php
// app/Models/User.php

protected function promoteToAdminIfNeeded(): void
{
    // Only promote if user is currently a regular user
    if (!$this->isUser()) {
        return;
    }

    // Check if user has any permission groups or direct granted permissions
    $hasPermissionGroups = $this->permissionGroups()->count() > 0;
    $hasDirectPermissions = $this->directPermissions()->wherePivot('granted', true)->count() > 0;

    // Promote to admin if they have any permissions
    if ($hasPermissionGroups || $hasDirectPermissions) {
        $this->update(['role' => Role::ADMIN]);
    }
}
```

This method is automatically called by:
- `assignPermissionGroups()` - When permission groups are assigned
- `grantPermission()` - When direct permissions are granted

## Frontend Integration

### Role Data in Inertia

The user's role is shared with the frontend via `HandleInertiaRequests` middleware:

```typescript
auth: {
  user: {
    role: 'admin',              // Role value
    role_label: 'Admin',         // Human-readable label
    is_super_admin: false,       // Boolean checks
    is_admin: true,
    is_user: false,
    permissions: [...],          // All user permissions
  }
}
```

### UI Routing

The dashboard route automatically redirects based on role:

- **Super Admins** → `/super-admin/dashboard` (unified admin dashboard with elevated UI)
- **Admins** → `/admin/dashboard` (unified admin dashboard)
- **Users** → `/dashboard` (user-specific dashboard)

### Role-Based Components

Use the `RoleGuard` component to conditionally render UI:

```tsx
import { RoleGuard } from '@/components/role-guard';

// Super admin only
<RoleGuard requireSuperAdmin>
  <SuperAdminFeature />
</RoleGuard>

// Admin or super admin
<RoleGuard requireAdmin>
  <AdminFeature />
</RoleGuard>

// Specific role
<RoleGuard role={Role.USER}>
  <UserFeature />
</RoleGuard>
```

### Permission-Based Components

Use the `PermissionGuard` component for permission-specific UI:

```tsx
import { PermissionGuard } from '@/components/permission-guard';

<PermissionGuard permission="view_users">
  <UserManagement />
</PermissionGuard>
```

## Use Cases

### Scenario 1: User Gets Permission Group
1. Admin assigns "User Management" permission group to a regular user
2. System automatically promotes user to `admin` role
3. User can now access admin dashboard
4. User sees UI elements for user management features

### Scenario 2: User Gets Direct Permission
1. Admin grants "manage_settings" permission directly to a regular user
2. System automatically promotes user to `admin` role
3. User can now access admin routes
4. User sees UI for managing settings

### Scenario 3: Admin Loses All Permissions
- **Note**: The system does NOT automatically demote admins to users
- Manual role change is required if needed
- This prevents accidental access loss during permission updates

## Middleware Protection

Routes are protected by role-based middleware:

```php
// Requires admin or super admin
Route::middleware(['auth', 'verified', 'admin'])->group(function () {
    // Admin routes
});

// Requires super admin only
Route::middleware(['auth', 'verified', 'super.admin'])->group(function () {
    // Super admin routes
});
```

## Best Practices

1. **Assign permissions to users, not roles manually** - Let the system handle role promotion
2. **Use permission groups** - For consistent permission sets
3. **Use RoleGuard and PermissionGuard** - For UI conditional rendering
4. **Test role changes** - Verify UI updates after permission assignment

## Technical Notes

- Role promotion happens immediately upon permission assignment
- The user model refreshes before checking permissions to ensure accuracy
- Super admins bypass all permission checks (they have all permissions by default)
- The promotion is one-way (user → admin), demotion requires manual role change
- Role changes trigger a fresh authentication state in Inertia
