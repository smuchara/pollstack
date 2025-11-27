# Permission System - Quick Reference Card

## 🚀 Quick Start

```bash
# Migrations already run ✅
# Seeder already run ✅
# Ready to use! 🎉
```

---

## 🎯 Common Tasks

### Access Permission Management
```
Super Admin Dashboard → Permission Groups card
Or navigate to: /super-admin/permission-groups
```

### Assign Permissions to User
```
User Management → Click user → Purple shield icon
Or navigate to: /admin/users/{id}/permissions
```

---

## 💻 Code Snippets

### Check Permission in Controller
```php
// Single permission
if (!$request->user()->hasPermission('create_polls')) {
    abort(403, 'Not authorized');
}

// Multiple (OR logic)
if (!$request->user()->hasAnyPermission(['edit_polls', 'delete_polls'])) {
    abort(403);
}

// Multiple (AND logic)
if (!$request->user()->hasAllPermissions(['view_polls', 'export_results'])) {
    abort(403);
}
```

### Protect Route with Middleware
```php
// Single permission
Route::get('/polls/create', [PollController::class, 'create'])
    ->middleware('permission:create_polls');

// Multiple permissions (OR logic)
Route::get('/polls/manage', [PollController::class, 'manage'])
    ->middleware('permission:edit_polls,delete_polls');

// In route group
Route::middleware(['auth', 'permission:manage_settings'])->group(function () {
    Route::get('/settings', [SettingsController::class, 'index']);
    Route::put('/settings', [SettingsController::class, 'update']);
});
```

### Assign Permissions Programmatically
```php
use App\Models\User;
use App\Models\Permission;
use App\Models\PermissionGroup;

$user = User::find(1);

// Assign permission groups
$pollModeratorGroup = PermissionGroup::where('name', 'poll_moderator')->first();
$user->assignPermissionGroups([$pollModeratorGroup->id]);

// Grant individual permission
$createPollsPerm = Permission::where('name', 'create_polls')->first();
$user->grantPermission($createPollsPerm->id);

// Revoke permission
$deletePollsPerm = Permission::where('name', 'delete_polls')->first();
$user->revokePermission($deletePollsPerm->id);

// Get all user permissions
$permissions = $user->getAllPermissions();
// Returns: ['create_polls', 'edit_polls', 'view_results', ...]
```

### Create Custom Permission
```php
use App\Models\Permission;

Permission::create([
    'name' => 'export_analytics',
    'label' => 'Export Analytics',
    'category' => 'system',
    'description' => 'Export detailed analytics reports',
]);
```

### Create Custom Permission Group
```php
use App\Models\PermissionGroup;
use App\Models\Permission;

$group = PermissionGroup::create([
    'name' => 'customer_support',
    'label' => 'Customer Support',
    'description' => 'Permissions for customer support team',
    'is_system' => false,
]);

// Assign permissions to the group
$permissions = Permission::whereIn('name', [
    'view_users',
    'send_password_reset',
    'view_polls',
])->pluck('id');

$group->permissions()->sync($permissions);
```

---

## 📋 Available Permissions

### User Management
```
invite_users          - Send invitations
view_users           - View user list
edit_users           - Edit user profiles
delete_users         - Delete users
assign_roles         - Change user roles
send_password_reset  - Send reset links
manage_permissions   - Manage permission groups
```

### Poll Management
```
create_polls    - Create new polls
edit_polls      - Edit existing polls
delete_polls    - Delete polls
view_polls      - View all polls
publish_polls   - Publish/unpublish
moderate_polls  - Moderate content
```

### Voting Management
```
cast_votes      - Vote in polls
view_results    - View results
export_results  - Export data
verify_votes    - Audit votes
```

### System Configuration
```
manage_settings       - System settings
view_audit_logs      - View logs
manage_notifications - Configure notifications
```

---

## 🎨 Default Permission Groups

### Poll Moderator
```php
Permissions: create_polls, edit_polls, view_polls, 
            publish_polls, moderate_polls, view_results, cast_votes
```

### User Manager
```php
Permissions: invite_users, view_users, edit_users, send_password_reset
```

### Content Manager
```php
Permissions: create_polls, edit_polls, delete_polls, view_polls,
            publish_polls, moderate_polls, view_results,
            export_results, verify_votes
```

### Analyst
```php
Permissions: view_polls, view_results, export_results, view_audit_logs
```

---

## 🔗 API Endpoints

### Permission Groups
```
GET    /super-admin/permission-groups          # View page
GET    /super-admin/permission-groups/list     # Get all (JSON)
POST   /super-admin/permission-groups          # Create
PUT    /super-admin/permission-groups/{id}     # Update
DELETE /super-admin/permission-groups/{id}     # Delete
```

### User Permissions
```
GET    /admin/users/{user}/permissions         # View page
GET    /admin/users/{user}/permissions/show    # Get (JSON)
PUT    /admin/users/{user}/permissions         # Batch update
POST   /admin/users/{user}/permissions/grant   # Grant one
POST   /admin/users/{user}/permissions/revoke  # Revoke one
POST   /admin/users/{user}/groups              # Assign groups
PUT    /admin/users/{user}/role                # Update role
```

### Permissions CRUD
```
GET    /super-admin/permissions                # Get all
POST   /super-admin/permissions                # Create
PUT    /super-admin/permissions/{id}           # Update
DELETE /super-admin/permissions/{id}           # Delete
```

---

## 🎭 User Model Methods

```php
// Check permissions
$user->hasPermission('create_polls')                          // bool
$user->hasAnyPermission(['edit_polls', 'delete_polls'])      // bool
$user->hasAllPermissions(['view_polls', 'export_results'])   // bool
$user->getAllPermissions()                                    // array

// Manage permissions
$user->grantPermission($permissionId)                         // void
$user->revokePermission($permissionId)                        // void
$user->assignPermissionGroups([$group1, $group2])            // void

// Relationships
$user->permissionGroups                                       // Collection
$user->directPermissions                                      // Collection
```

---

## 🛡️ Security Notes

- ✅ Super Admin bypasses ALL permission checks
- ✅ System groups cannot be deleted
- ✅ Groups with users cannot be deleted
- ✅ Permissions in use cannot be deleted
- ✅ Direct revokes override group permissions

---

## 📱 UI Access Points

```
Super Admin Dashboard
└── Permission Groups card → /super-admin/permission-groups

User Management
└── User row → Shield icon → /admin/users/{id}/permissions
    ├── Permission Groups tab
    └── Individual Permissions tab
```

---

## 🐛 Troubleshooting

**Permission denied errors:**
```bash
# Verify user has permission
php artisan tinker
>>> $user = User::find(1);
>>> $user->getAllPermissions();
```

**Changes not reflecting:**
```bash
php artisan cache:clear
php artisan route:clear
npm run build
```

**Database issues:**
```bash
php artisan migrate:status
php artisan db:seed --class=PermissionSeeder
```

---

## 📚 Full Documentation

- **Comprehensive Guide:** `PERMISSIONS_GUIDE.md`
- **Implementation Details:** `PERMISSION_SYSTEM_IMPLEMENTATION.md`
- **This Reference:** `PERMISSION_QUICK_REFERENCE.md`

---

**Need Help?** Check the models: `app/Models/Permission.php`, `app/Models/PermissionGroup.php`, `app/Models/User.php`
