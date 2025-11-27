# Permission-Based UI Implementation Examples

This document provides concrete examples of how to implement the permission-based UI architecture in your PollStack application.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Dashboard Example](#dashboard-example)
- [Navigation/Sidebar Example](#navigationsidebar-example)
- [Action Buttons](#action-buttons)
- [Page-Level Protection](#page-level-protection)
- [Migration Guide](#migration-guide)

---

## Basic Usage

### Using PermissionGuard Component

```tsx
import { PermissionGuard } from '@/components/permission-guard';

// Simple: Hide feature if user doesn't have permission
<PermissionGuard permission="invite_users">
  <Button>Invite User</Button>
</PermissionGuard>

// With fallback: Show locked state
<PermissionGuard 
  permission="invite_users"
  showFallback
  fallback={<LockedFeatureCard feature="Invite Users" requiredPermission="invite_users" />}>
  <InviteUserForm />
</PermissionGuard>

// Multiple permissions (OR logic)
<PermissionGuard anyPermission={['edit_polls', 'delete_polls']}>
  <PollActions />
</PermissionGuard>

// Multiple permissions (AND logic)
<PermissionGuard allPermissions={['view_polls', 'export_results']}>
  <ExportButton />
</PermissionGuard>
```

### Using usePermission Hook

```tsx
import { usePermission } from '@/components/permission-guard';

function MyComponent() {
  const { hasPermission, hasAnyPermission, permissions } = usePermission();

  // Imperative checks
  if (hasPermission('invite_users')) {
    // Show something
  }

  // In render
  return (
    <div>
      {hasPermission('view_users') && <UserList />}
      {hasAnyPermission(['edit_polls', 'delete_polls']) && <PollActions />}
      <p>You have {permissions.length} permissions</p>
    </div>
  );
}
```

---

## Dashboard Example

### Unified Dashboard with Dynamic Features

Here's how to refactor the current dashboard to use permissions:

```tsx
// resources/js/pages/dashboard.tsx
import { Head } from '@inertiajs/react';
import { PermissionGuard, usePermission } from '@/components/permission-guard';
import { LockedFeatureCard } from '@/components/locked-feature-card';
import AppLayout from '@/layouts/app-layout';
import { StatCard } from '@/components/stat-card';
import { ActionCard } from '@/components/action-card';
import {
  Users, Vote, BarChart3, Settings,
  UserPlus, PlusCircle, FileSpreadsheet
} from 'lucide-react';

interface Props {
  stats: {
    total_users?: number;
    active_polls?: number;
    total_votes?: number;
    recent_activity?: number;
  };
}

export default function UnifiedDashboard({ stats }: Props) {
  const { hasPermission, hasAnyPermission } = usePermission();

  return (
    <AppLayout>
      <Head title="Dashboard" />

      <div className="space-y-8 p-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening.
          </p>
        </div>

        {/* Stats Grid - Shows stats based on permissions */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PermissionGuard permission="view_users">
            <StatCard
              title="Total Users"
              value={stats.total_users ?? 0}
              icon={Users}
              description="Registered accounts"
              href="/admin/users"
              bgClass="bg-blue-500/10"
              colorClass="text-blue-600"
            />
          </PermissionGuard>

          <PermissionGuard permission="view_polls">
            <StatCard
              title="Active Polls"
              value={stats.active_polls ?? 0}
              icon={Vote}
              description="Running campaigns"
              href="/polls"
              bgClass="bg-purple-500/10"
              colorClass="text-purple-600"
            />
          </PermissionGuard>

          <PermissionGuard permission="view_results">
            <StatCard
              title="Total Votes"
              value={stats.total_votes ?? 0}
              icon={BarChart3}
              description="Responses collected"
              href="/results"
              bgClass="bg-emerald-500/10"
              colorClass="text-emerald-600"
            />
          </PermissionGuard>

          <PermissionGuard permission="manage_settings">
            <StatCard
              title="System Health"
              value="Healthy"
              icon={Settings}
              description="All systems operational"
              bgClass="bg-amber-500/10"
              colorClass="text-amber-600"
            />
          </PermissionGuard>
        </div>

        {/* Quick Actions - Show locked states */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            
            {/* Invite Users - Show locked if no permission */}
            <PermissionGuard 
              permission="invite_users"
              showFallback
              fallback={
                <LockedFeatureCard
                  feature="Invite Users"
                  requiredPermission="invite_users"
                  description="Send invitations to new team members"
                  variant="default"
                />
              }>
              <ActionCard
                title="Invite Users"
                description="Add new team members"
                href="/users/invite"
                icon={UserPlus}
                iconColor="text-blue-500"
              />
            </PermissionGuard>

            {/* Create Poll - Show locked if no permission */}
            <PermissionGuard 
              permission="create_polls"
              showFallback
              fallback={
                <LockedFeatureCard
                  feature="Create Poll"
                  requiredPermission="create_polls"
                  description="Launch new voting campaigns"
                  variant="default"
                />
              }>
              <ActionCard
                title="Create Poll"
                description="Start a new campaign"
                href="/polls/create"
                icon={PlusCircle}
                iconColor="text-purple-500"
              />
            </PermissionGuard>

            {/* Export Data - Show locked if no permission */}
            <PermissionGuard 
              permission="export_results"
              showFallback
              fallback={
                <LockedFeatureCard
                  feature="Export Results"
                  requiredPermission="export_results"
                  description="Download analytics and reports"
                  variant="default"
                />
              }>
              <ActionCard
                title="Export Data"
                description="Download reports"
                href="/results/export"
                icon={FileSpreadsheet}
                iconColor="text-emerald-500"
              />
            </PermissionGuard>
          </div>
        </div>

        {/* Conditional Sections - Only render if user has access */}
        <PermissionGuard permission="view_users">
          <div>
            <h2 className="text-xl font-semibold mb-4">User Management</h2>
            {/* User management content */}
          </div>
        </PermissionGuard>

        <PermissionGuard permission="view_results">
          <div>
            <h2 className="text-xl font-semibold mb-4">Analytics</h2>
            {/* Analytics content */}
          </div>
        </PermissionGuard>

        {/* Empty state if user has no features */}
        {!hasAnyPermission(['view_users', 'view_polls', 'view_results', 'create_polls']) && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Getting Started</h3>
            <p className="text-muted-foreground">
              Contact your administrator to get access to features.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
```

---

## Navigation/Sidebar Example

### Dynamic Sidebar with Permission Filtering

```tsx
// resources/js/components/app-sidebar.tsx
import { PermissionGuard } from '@/components/permission-guard';
import { Link } from '@inertiajs/react';
import {
  Home, Users, Vote, BarChart3, Settings,
  Shield, FileText, Database
} from 'lucide-react';

export function AppSidebar() {
  return (
    <aside className="w-64 border-r bg-card">
      <nav className="space-y-1 p-4">
        {/* Always visible */}
        <NavItem href="/dashboard" icon={Home}>
          Dashboard
        </NavItem>

        {/* Permission-based items */}
        <PermissionGuard permission="view_users">
          <NavItem href="/admin/users" icon={Users}>
            Users
          </NavItem>
        </PermissionGuard>

        <PermissionGuard permission="view_polls">
          <NavItem href="/polls" icon={Vote}>
            Polls
          </NavItem>
        </PermissionGuard>

        <PermissionGuard permission="view_results">
          <NavItem href="/results" icon={BarChart3}>
            Analytics
          </NavItem>
        </PermissionGuard>

        <PermissionGuard permission="manage_settings">
          <NavItem href="/settings" icon={Settings}>
            Settings
          </NavItem>
        </PermissionGuard>

        {/* Super Admin Only */}
        <PermissionGuard permission="manage_permissions">
          <div className="pt-4 mt-4 border-t">
            <p className="text-xs font-semibold text-muted-foreground mb-2 px-3">
              Administration
            </p>
            <NavItem href="/super-admin/permission-groups" icon={Shield}>
              Permission Groups
            </NavItem>
            <NavItem href="/super-admin/logs" icon={FileText}>
              Audit Logs
            </NavItem>
            <NavItem href="/super-admin/backup" icon={Database}>
              Backup
            </NavItem>
          </div>
        </PermissionGuard>
      </nav>
    </aside>
  );
}

function NavItem({ 
  href, 
  icon: Icon, 
  children 
}: { 
  href: string; 
  icon: any; 
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
    >
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </Link>
  );
}
```

---

## Action Buttons

### Permission-Protected Buttons

```tsx
// In a component
import { usePermission } from '@/components/permission-guard';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';

function UserActions({ user }) {
  const { hasPermission } = usePermission();

  return (
    <div className="flex gap-2">
      {/* Option 1: Hide button if no permission */}
      {hasPermission('edit_users') && (
        <Button onClick={() => editUser(user)}>
          Edit
        </Button>
      )}

      {/* Option 2: Disable button with tooltip */}
      <Tooltip 
        content={
          hasPermission('delete_users') 
            ? 'Delete this user'
            : 'You need delete_users permission'
        }>
        <Button
          variant="destructive"
          disabled={!hasPermission('delete_users')}
          onClick={() => deleteUser(user)}
        >
          Delete
        </Button>
      </Tooltip>

      {/* Option 3: Show locked state */}
      {hasPermission('assign_roles') ? (
        <Button onClick={() => manageRoles(user)}>
          Manage Roles
        </Button>
      ) : (
        <Button variant="ghost" disabled>
          Manage Roles 🔒
        </Button>
      )}
    </div>
  );
}
```

---

## Page-Level Protection

### Protecting Entire Pages

```tsx
// resources/js/pages/users/invite.tsx
import { Head } from '@inertiajs/react';
import { PermissionDeniedEmptyState } from '@/components/locked-feature-card';
import { usePermission } from '@/components/permission-guard';
import AppLayout from '@/layouts/app-layout';

export default function InviteUsersPage() {
  const { hasPermission } = usePermission();

  // Show permission denied if user doesn't have access
  if (!hasPermission('invite_users')) {
    return (
      <AppLayout>
        <Head title="Invite Users - Access Denied" />
        <PermissionDeniedEmptyState
          feature="User Invitations"
          requiredPermission="invite_users"
          description="You need the 'invite_users' permission to send invitations. Please contact your administrator."
        />
      </AppLayout>
    );
  }

  // Normal page content
  return (
    <AppLayout>
      <Head title="Invite Users" />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Invite Users</h1>
        {/* Invite form */}
      </div>
    </AppLayout>
  );
}
```

### Backend Route Protection (Always Required!)

```php
// routes/web.php or routes/admin.php
use App\Http\Middleware\CheckPermission;

// Single permission
Route::get('/users/invite', [UserController::class, 'invite'])
    ->middleware(['auth', 'permission:invite_users']);

// Multiple permissions (OR logic)
Route::get('/polls/manage', [PollController::class, 'manage'])
    ->middleware(['auth', 'permission:edit_polls,delete_polls']);

// In controller for additional checks
public function invite(Request $request)
{
    if (!$request->user()->hasPermission('invite_users')) {
        abort(403, 'You do not have permission to invite users.');
    }

    // ... rest of logic
}
```

---

## Migration Guide

### Step 1: Update Existing Dashboard

**Before:**
```tsx
// Old dashboard with role checks only
export default function Dashboard() {
  const { isAdmin } = useRole();

  return (
    <div>
      {isAdmin && <UserManagementCard />}
      <PollsCard />
    </div>
  );
}
```

**After:**
```tsx
// New dashboard with permission checks
import { PermissionGuard } from '@/components/permission-guard';

export default function Dashboard() {
  return (
    <div>
      <PermissionGuard permission="view_users">
        <UserManagementCard />
      </PermissionGuard>
      
      <PermissionGuard permission="view_polls">
        <PollsCard />
      </PermissionGuard>
    </div>
  );
}
```

### Step 2: Update Navigation

**Before:**
```tsx
<RoleGuard requireAdmin>
  <NavItem href="/admin/users">Users</NavItem>
</RoleGuard>
```

**After:**
```tsx
<PermissionGuard permission="view_users">
  <NavItem href="/admin/users">Users</NavItem>
</PermissionGuard>
```

### Step 3: Update Action Buttons

**Before:**
```tsx
{user.is_admin && (
  <Button onClick={inviteUser}>Invite User</Button>
)}
```

**After:**
```tsx
<PermissionGuard permission="invite_users">
  <Button onClick={inviteUser}>Invite User</Button>
</PermissionGuard>
```

### Step 4: Test Permission Changes

```bash
# Test in browser console
# Open DevTools → Console
const user = usePage().props.auth.user;
console.log('My permissions:', user.permissions);

# Verify specific permission
console.log('Can invite users:', user.permissions.includes('invite_users'));
```

---

## Best Practices Summary

1. **Always protect routes on backend** - Frontend is for UX, backend is for security
2. **Use showFallback strategically** - Show locked features for self-service, hide for enterprise
3. **Provide clear feedback** - Tell users why features are locked
4. **Keep navigation consistent** - Don't change layout drastically based on permissions
5. **Test with different permission sets** - Create test users with various permission combinations
6. **Cache permissions** - Already done via Inertia shared data
7. **Progressive enhancement** - Show features as users gain permissions

---

## Testing Checklist

- [ ] Super admin can see all features
- [ ] Admin can see appropriate admin features
- [ ] Regular user sees limited features
- [ ] Locked features show upgrade prompts
- [ ] Navigation updates based on permissions
- [ ] Backend routes are protected
- [ ] Permission changes reflect immediately
- [ ] Empty states show when no features available
- [ ] Tooltips explain locked features
- [ ] Request access buttons work

---

**Next Steps:**
1. Start with one module (e.g., User Management)
2. Wrap features with PermissionGuard
3. Test with different user permission sets
4. Gradually migrate all modules
5. Remove old role-based guards

For questions or issues, refer to:
- `PERMISSION_UI_UX_ARCHITECTURE.md` - Architectural decisions
- `PERMISSION_ARCHITECTURE.md` - System design
- `PERMISSION_QUICK_REFERENCE.md` - API reference
