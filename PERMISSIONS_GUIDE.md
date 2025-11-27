# Permission Management System Guide

## Overview

Your PollStack application now has a comprehensive permission management system that allows **Super Admins** to create custom permission groups and assign granular permissions to users. This system works alongside the existing role-based access control (RBAC) system.

## Features

### ✅ What's Been Implemented

1. **Permission Groups** - Create reusable permission templates
2. **Individual Permissions** - 20+ predefined permissions across 4 categories
3. **User Permission Assignment** - Assign groups or individual permissions to users
4. **Permission Override** - Grant or revoke specific permissions per user
5. **Super Admin Dashboard Integration** - Quick access to permission management
6. **User Management Integration** - Manage permissions directly from user list

---

## Available Permissions

### User Management
- **Invite Users** - Send invitation emails to new users
- **View Users** - View list of all users in the system
- **Edit Users** - Edit user details and profiles
- **Delete Users** - Delete users from the system
- **Assign Roles** - Assign and modify user roles
- **Send Password Reset** - Send password reset links to users
- **Manage Permissions** - Create and manage permission groups

### Poll Management
- **Create Polls** - Create new polls and voting campaigns
- **Edit Polls** - Edit existing polls
- **Delete Polls** - Delete polls from the system
- **View Polls** - View all polls and voting data
- **Publish Polls** - Publish and unpublish polls
- **Moderate Polls** - Moderate poll content and responses

### Voting Management
- **Cast Votes** - Participate in polls and cast votes
- **View Results** - View voting results and analytics
- **Export Results** - Export voting results and reports
- **Verify Votes** - Verify and audit voting records

### System Configuration
- **Manage Settings** - Configure system settings and preferences
- **View Audit Logs** - View system audit logs and activity
- **Manage Notifications** - Configure notification settings

---

## Default Permission Groups

The system comes with 4 pre-configured permission groups:

### 1. Poll Moderator
**Permissions:**
- Create Polls
- Edit Polls
- View Polls
- Publish Polls
- Moderate Polls
- View Results
- Cast Votes

**Use Case:** Users who manage poll content and oversee voting activities.

### 2. User Manager
**Permissions:**
- Invite Users
- View Users
- Edit Users
- Send Password Reset

**Use Case:** Users who handle user onboarding and basic account management.

### 3. Content Manager
**Permissions:**
- All Poll Management permissions
- All Voting Management permissions (except Cast Votes)

**Use Case:** Users with full control over polls and voting data.

### 4. Analyst
**Permissions:**
- View Polls
- View Results
- Export Results
- View Audit Logs

**Use Case:** Users who need read-only access to data and analytics.

---

## How to Use

### For Super Admins

#### Access Permission Management

1. **Navigate to Permission Groups:**
   - Login as Super Admin
   - Go to Dashboard → **Permission Groups**
   - Or visit: `/super-admin/permission-groups`

2. **Assign Permissions to Users:**
   - Go to **User Management** → Click user row
   - Click the purple **Shield** icon (Manage Permissions)
   - Or visit: `/admin/users/{user_id}/permissions`

#### Create a Custom Permission Group

```
1. Click "Create Group" button
2. Fill in the form:
   - Group Name (slug): e.g., "poll_moderator"
   - Display Label: e.g., "Poll Moderator"
   - Description: Optional description
3. Select permissions by category
4. Click "Create Group"
```

#### Assign Permissions to a User

**Option 1: Using Permission Groups (Recommended)**
```
1. Navigate to User → Permissions
2. Go to "Permission Groups" tab
3. Select one or more permission groups
4. Click "Save Changes"
```

**Option 2: Individual Permissions**
```
1. Navigate to User → Permissions
2. Go to "Individual Permissions" tab
3. Expand a category (e.g., "User Management")
4. Click "Grant" or "Revoke" for specific permissions
5. Click "Save Changes"
```

### Permission Inheritance

Users receive permissions from:
1. **Permission Groups** - All permissions from assigned groups
2. **Direct Grants** - Individually granted permissions
3. **Direct Revokes** - Override to remove specific permissions

**Example:**
- User has "Poll Moderator" group (includes "Create Polls")
- Admin grants "Delete Users" individually
- Admin revokes "Create Polls"
- **Result:** User can delete users but cannot create polls

---

## For Developers

### Using Permissions in Backend (PHP/Laravel)

#### Check Permission in Controller
```php
use App\Models\User;

public function store(Request $request)
{
    $user = $request->user();
    
    if (!$user->hasPermission('create_polls')) {
        abort(403, 'You do not have permission to create polls');
    }
    
    // Your logic here
}
```

#### Check Multiple Permissions
```php
// User needs ANY of these permissions
if ($user->hasAnyPermission(['edit_polls', 'delete_polls'])) {
    // Allow access
}

// User needs ALL of these permissions
if ($user->hasAllPermissions(['view_polls', 'export_results'])) {
    // Allow access
}
```

#### Protect Routes with Middleware
```php
// In routes/web.php or routes/admin.php
Route::get('/polls/create', [PollController::class, 'create'])
    ->middleware('permission:create_polls');

// Multiple permissions (user needs any)
Route::get('/polls/manage', [PollController::class, 'manage'])
    ->middleware('permission:edit_polls,delete_polls');
```

#### Grant/Revoke Permissions Programmatically
```php
use App\Models\User;
use App\Models\Permission;

$user = User::find(1);
$permission = Permission::where('name', 'create_polls')->first();

// Grant permission
$user->grantPermission($permission->id);

// Revoke permission
$user->revokePermission($permission->id);

// Assign permission groups
$user->assignPermissionGroups([1, 2, 3]); // IDs of permission groups
```

### Using Permissions in Frontend (React/TypeScript)

#### Check Permissions in Components
```tsx
import { useRole } from '@/components/role-guard';

export default function PollManagement() {
  const { user } = useRole();
  
  // For now, check role (permission checking hook coming soon)
  const canCreatePolls = user?.is_super_admin || user?.is_admin;
  
  return (
    <div>
      {canCreatePolls && (
        <button onClick={handleCreatePoll}>Create Poll</button>
      )}
    </div>
  );
}
```

---

## Database Structure

### Tables Created

1. **`permissions`** - All available permissions
2. **`permission_groups`** - Custom permission templates
3. **`permission_group_permission`** - Permissions in each group
4. **`user_permission_group`** - Groups assigned to users
5. **`user_permissions`** - Individual permission overrides

### Key Relationships

```
User
  ├─ hasMany PermissionGroups (through user_permission_group)
  ├─ hasMany DirectPermissions (through user_permissions)
  └─ method: getAllPermissions() - Computed permissions

PermissionGroup
  ├─ belongsToMany Permissions
  └─ belongsToMany Users

Permission
  ├─ belongsToMany PermissionGroups
  └─ belongsToMany Users
```

---

## Next Steps

### Recommended Implementation

1. **Run the migrations and seeder:**
   ```bash
   php artisan migrate
   php artisan db:seed --class=PermissionSeeder
   ```

2. **Test the system:**
   - Login as Super Admin
   - Navigate to Permission Groups
   - Create a custom group
   - Assign it to a test user

3. **Protect your routes:**
   - Add permission middleware to sensitive routes
   - Update controllers to check permissions

4. **Create custom permission groups** for your specific use cases:
   - Poll Creators
   - Vote Counters
   - Support Team
   - etc.

### Future Enhancements

Consider adding:
- **Permission caching** - Cache user permissions for better performance
- **Permission frontend hook** - `usePermission()` hook for React components
- **Audit logging** - Track permission changes
- **Bulk permission assignment** - Assign permissions to multiple users at once
- **Role-based defaults** - Auto-assign permission groups based on role

---

## Troubleshooting

### "Permission denied" errors
- Verify user has been assigned the required permission group or individual permission
- Check that Super Admin role bypasses all permission checks

### Permission groups not showing
- Ensure migrations ran successfully: `php artisan migrate:status`
- Verify seeder ran: Check `permissions` and `permission_groups` tables

### Changes not reflecting
- Clear application cache: `php artisan cache:clear`
- Clear route cache: `php artisan route:clear`
- Rebuild frontend: `npm run build`

---

## API Endpoints

### Permission Groups
- `GET /super-admin/permission-groups` - View permission groups page
- `GET /super-admin/permission-groups/list` - Get all groups (JSON)
- `POST /super-admin/permission-groups` - Create new group
- `PUT /super-admin/permission-groups/{id}` - Update group
- `DELETE /super-admin/permission-groups/{id}` - Delete group

### User Permissions
- `GET /admin/users/{user}/permissions` - View user permissions page
- `GET /admin/users/{user}/permissions/show` - Get user permissions (JSON)
- `PUT /admin/users/{user}/permissions` - Batch update permissions
- `POST /admin/users/{user}/permissions/grant` - Grant single permission
- `POST /admin/users/{user}/permissions/revoke` - Revoke single permission
- `POST /admin/users/{user}/groups` - Assign permission groups

### Permissions
- `GET /super-admin/permissions` - Get all permissions (JSON)
- `POST /super-admin/permissions` - Create new permission
- `PUT /super-admin/permissions/{id}` - Update permission
- `DELETE /super-admin/permissions/{id}` - Delete permission

---

## Support

For questions or issues:
1. Check this guide first
2. Review the code in `app/Models/Permission.php` and `app/Models/PermissionGroup.php`
3. Check the frontend components in `resources/js/pages/super-admin/permission-groups.tsx`

**Happy permission managing! 🚀**
