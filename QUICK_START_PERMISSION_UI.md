# Quick Start: Implementing Permission-Based UI

## 🎯 What We're Building

**One unified dashboard** where features dynamically appear/disappear based on user permissions. Users with `invite_users` permission see the "Invite Users" module, users without it see a locked state.

---

## ✅ What's Already Done

Your permission system is **fully implemented** on the backend:

- ✅ Permission tables and migrations
- ✅ Permission groups (user_manager, poll_moderator, etc.)
- ✅ User model methods (`hasPermission()`, `getAllPermissions()`)
- ✅ Middleware for route protection
- ✅ Backend is secure and working

**What's NEW:**
- ✅ `PermissionGuard` component for frontend
- ✅ `usePermission` hook for imperative checks
- ✅ `LockedFeatureCard` component for upgrade prompts
- ✅ Permissions shared with frontend via Inertia
- ✅ Updated TypeScript types

---

## 🚀 5-Minute Implementation

### Step 1: Import the Components

```tsx
import { PermissionGuard, usePermission } from '@/components/permission-guard';
import { LockedFeatureCard } from '@/components/locked-feature-card';
```

### Step 2: Wrap Features with PermissionGuard

**Before:**
```tsx
<Button>Invite User</Button>
```

**After (Option A - Hide):**
```tsx
<PermissionGuard permission="invite_users">
  <Button>Invite User</Button>
</PermissionGuard>
```

**After (Option B - Show Locked):**
```tsx
<PermissionGuard 
  permission="invite_users"
  showFallback
  fallback={<LockedFeatureCard feature="Invite Users" requiredPermission="invite_users" />}>
  <Button>Invite User</Button>
</PermissionGuard>
```

### Step 3: Use Hook for Conditional Logic

```tsx
function MyComponent() {
  const { hasPermission } = usePermission();

  if (hasPermission('view_users')) {
    // Show something
  }

  return (
    <div>
      {hasPermission('create_polls') && <CreatePollButton />}
    </div>
  );
}
```

---

## 📋 Available Permissions

You already have these permissions in your system:

### User Management
- `invite_users` - Send invitations
- `view_users` - View user list
- `edit_users` - Edit profiles
- `delete_users` - Delete users
- `assign_roles` - Change roles
- `send_password_reset` - Password resets
- `manage_permissions` - Manage permission groups

### Poll Management
- `create_polls` - Create polls
- `edit_polls` - Edit polls
- `delete_polls` - Delete polls
- `view_polls` - View polls
- `publish_polls` - Publish/unpublish
- `moderate_polls` - Moderate content

### Voting & Results
- `cast_votes` - Vote in polls
- `view_results` - View results
- `export_results` - Export data
- `verify_votes` - Audit votes

### System
- `manage_settings` - System settings
- `view_audit_logs` - View logs
- `manage_notifications` - Configure notifications

---

## 🎨 UI Patterns

### Pattern 1: Hide Feature (Simple)

Use when: Users shouldn't know the feature exists

```tsx
<PermissionGuard permission="delete_users">
  <Button variant="destructive">Delete User</Button>
</PermissionGuard>
```

### Pattern 2: Show Locked (Discovery)

Use when: You want users to discover and request features

```tsx
<PermissionGuard 
  permission="invite_users"
  showFallback
  fallback={
    <LockedFeatureCard 
      feature="Invite Users"
      requiredPermission="invite_users"
      description="Add team members to your workspace"
    />
  }>
  <InviteUserModule />
</PermissionGuard>
```

### Pattern 3: Conditional Rendering

Use when: You need imperative checks

```tsx
const { hasPermission, hasAnyPermission } = usePermission();

// Show different UIs
if (hasPermission('manage_permissions')) {
  return <AdminPanel />;
}

// Check multiple
if (hasAnyPermission(['edit_polls', 'delete_polls'])) {
  return <PollActions />;
}

return <LimitedView />;
```

---

## 🛠️ Common Use Cases

### Use Case 1: Dashboard Stats

```tsx
<div className="grid grid-cols-4 gap-4">
  <PermissionGuard permission="view_users">
    <StatCard title="Total Users" value={100} />
  </PermissionGuard>

  <PermissionGuard permission="view_polls">
    <StatCard title="Active Polls" value={25} />
  </PermissionGuard>

  <PermissionGuard permission="view_results">
    <StatCard title="Total Votes" value={500} />
  </PermissionGuard>
</div>
```

### Use Case 2: Action Buttons

```tsx
<div className="flex gap-2">
  <PermissionGuard permission="edit_users">
    <Button>Edit</Button>
  </PermissionGuard>

  <PermissionGuard permission="delete_users">
    <Button variant="destructive">Delete</Button>
  </PermissionGuard>

  <PermissionGuard permission="assign_roles">
    <Button variant="outline">Change Role</Button>
  </PermissionGuard>
</div>
```

### Use Case 3: Navigation

```tsx
<nav>
  <NavItem href="/dashboard">Dashboard</NavItem>

  <PermissionGuard permission="view_users">
    <NavItem href="/users">Users</NavItem>
  </PermissionGuard>

  <PermissionGuard permission="view_polls">
    <NavItem href="/polls">Polls</NavItem>
  </PermissionGuard>

  <PermissionGuard permission="view_results">
    <NavItem href="/analytics">Analytics</NavItem>
  </PermissionGuard>
</nav>
```

### Use Case 4: Page Protection

```tsx
export default function InviteUsersPage() {
  const { hasPermission } = usePermission();

  if (!hasPermission('invite_users')) {
    return (
      <PermissionDeniedEmptyState
        feature="User Invitations"
        requiredPermission="invite_users"
      />
    );
  }

  return <InviteForm />;
}
```

---

## 🔒 Security Reminder

**Frontend guards are for UX only!**

Always protect routes on the backend:

```php
// routes/admin.php
Route::get('/users/invite', [UserController::class, 'invite'])
    ->middleware(['auth', 'permission:invite_users']);
```

The frontend `PermissionGuard` just **hides the UI**. The backend middleware **enforces security**.

---

## 🧪 Testing Your Implementation

### 1. Test as Super Admin
```
1. Log in as super admin
2. You should see ALL features
3. No locked states should appear
```

### 2. Test as Regular User
```
1. Create a test user with NO permissions
2. Dashboard should show locked features
3. Navigation should be minimal
```

### 3. Test Permission Changes
```
1. Assign "User Manager" permission group to a user
2. Log in as that user
3. User management features should now appear
4. Other features should still be locked
```

### 4. Debug in Browser
```javascript
// Open browser console
const user = usePage().props.auth.user;
console.log('My permissions:', user.permissions);
console.log('Can invite users:', user.permissions.includes('invite_users'));
```

---

## 📁 Files Created

Your new permission UI system includes:

```
resources/js/components/
├── permission-guard.tsx           ← Main guard component + hook
└── locked-feature-card.tsx        ← Locked feature UI

resources/js/pages/
└── dashboard-example-with-permissions.tsx  ← Full example

Documentation:
├── PERMISSION_UI_UX_ARCHITECTURE.md       ← Full architecture guide
├── IMPLEMENTATION_EXAMPLE.md              ← Code examples
└── QUICK_START_PERMISSION_UI.md          ← This file
```

---

## 🎯 Next Steps

### Immediate (Today)
1. ✅ Review the example dashboard: `dashboard-example-with-permissions.tsx`
2. ✅ Test with your existing user accounts
3. ✅ Start with one simple feature (e.g., "Invite Users" button)

### This Week
1. Wrap dashboard stats with `PermissionGuard`
2. Add permission checks to action buttons
3. Update navigation/sidebar with permission filtering
4. Test with different user permission combinations

### Next Week
1. Migrate all modules to use permission guards
2. Add locked feature cards for discoverability
3. Remove old role-only checks
4. Add "Request Access" workflow (optional)

---

## 💡 Design Philosophy

### ✅ DO:
- **Single dashboard** - One layout for all users
- **Progressive disclosure** - Show features as users gain permissions
- **Clear feedback** - Tell users why features are locked
- **Backend security** - Always enforce on server

### ❌ DON'T:
- Multiple dashboards per role
- Show features that error on click
- Rely only on frontend checks
- Make users guess requirements

---

## 🆘 Common Questions

**Q: Should I hide or show locked features?**
A: Depends on your use case:
- **Self-service app?** Show locked features with upgrade prompts
- **Enterprise app?** Hide features completely (cleaner)

**Q: What if user has no permissions?**
A: Show an empty state with "Contact Administrator" button

**Q: How do I know if someone can invite users?**
A: They need the `invite_users` permission, usually from "User Manager" group

**Q: Can I check multiple permissions?**
A: Yes! Use `anyPermission={['perm1', 'perm2']}` for OR logic, or `allPermissions={['perm1', 'perm2']}` for AND logic

**Q: Does Super Admin bypass checks?**
A: Yes! Super admins automatically pass all permission checks

---

## 📚 Additional Resources

- **PERMISSION_UI_UX_ARCHITECTURE.md** - Detailed architecture decisions
- **IMPLEMENTATION_EXAMPLE.md** - More code examples
- **PERMISSION_ARCHITECTURE.md** - Backend system design
- **PERMISSION_QUICK_REFERENCE.md** - API reference

---

## ✅ Success Criteria

You'll know it's working when:

- ✅ Super admin sees all features
- ✅ Users with "User Manager" permission group see user management
- ✅ Users with "Poll Moderator" permission group see poll features
- ✅ Users with no permissions see minimal dashboard with locked states
- ✅ Navigation updates based on permissions
- ✅ Locked features show clear "Request Access" prompts
- ✅ Backend routes return 403 for unauthorized access

---

**Ready to start?** Open `dashboard-example-with-permissions.tsx` and see a full working example!

**Questions?** Check the comprehensive guide: `PERMISSION_UI_UX_ARCHITECTURE.md`
