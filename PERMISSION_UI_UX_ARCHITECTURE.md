# Permission-Based UI/UX Architecture Guide

## 🎯 Executive Summary

**Recommended Approach: Single Unified Dashboard with Dynamic Feature Rendering**

This document outlines the professional architectural structure for implementing a permission-based user interface where features are dynamically shown/hidden based on user permissions.

---

## 📐 Architectural Decision: One Dashboard vs. Multiple Dashboards

### ✅ **RECOMMENDED: Single Unified Dashboard (Adaptive UI)**

**Why This is Better:**

1. **Maintainability** - One codebase, easier to update and debug
2. **User Experience** - Consistent navigation, users don't get confused by different layouts
3. **Scalability** - Easy to add new features and permissions without creating new dashboards
4. **Industry Standard** - Used by enterprise applications (Salesforce, HubSpot, AWS Console, GitHub)
5. **Progressive Disclosure** - Show features as users gain permissions naturally
6. **Lower Complexity** - Less routing logic, fewer components to manage

**How It Works:**
- All users see the same base dashboard layout
- Features/modules appear or disappear based on permissions
- Components render conditionally using permission guards
- Empty states guide users when they lack permissions

### ❌ **NOT RECOMMENDED: Multiple Dashboards**

**Problems with this approach:**
- Creates fragmented user experience
- Difficult to maintain (3+ dashboard codebases)
- Confusing navigation when users gain/lose permissions
- Higher development and testing costs
- Users feel "locked out" rather than "growing into" the platform

---

## 🏗️ Implementation Architecture

### Backend Structure (Already in Place ✅)

Your current architecture is solid:
```
Role Hierarchy:
Super Admin (bypasses all checks)
    ↓
Admin (role-based access)
    ↓
User (role-based + permission-based access)

Permission Resolution:
1. Check if Super Admin → Grant all
2. Get Permission Groups → Collect permissions
3. Add Direct Grants → Merge permissions
4. Remove Direct Revokes → Filter out
5. Check required permission → Allow/Deny
```

### Frontend Architecture (To Implement)

```
┌─────────────────────────────────────────────────────────────┐
│                    Unified Dashboard                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Navigation Bar (Always Visible)                       │ │
│  │  - Logo, User Menu, Settings                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Dynamic Sidebar                                       │ │
│  │  ┌─────────────────────────────────────────────┐      │ │
│  │  │ <PermissionGuard permission="view_users">   │      │ │
│  │  │   <NavItem>User Management</NavItem>         │      │ │
│  │  │ </PermissionGuard>                           │      │ │
│  │  │                                              │      │ │
│  │  │ <PermissionGuard permission="create_polls"> │      │ │
│  │  │   <NavItem>Poll Creator</NavItem>            │      │ │
│  │  │ </PermissionGuard>                           │      │ │
│  │  │                                              │      │ │
│  │  │ <PermissionGuard permission="view_results"> │      │ │
│  │  │   <NavItem>Analytics</NavItem>               │      │ │
│  │  │ </PermissionGuard>                           │      │ │
│  │  └─────────────────────────────────────────────┘      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Main Content Area                                     │ │
│  │                                                        │ │
│  │  <PermissionGuard permission="view_users">           │ │
│  │    <StatCard title="Total Users" />                   │ │
│  │  </PermissionGuard>                                    │ │
│  │                                                        │ │
│  │  <PermissionGuard permission="create_polls">          │ │
│  │    <ActionCard title="Create Poll" />                 │ │
│  │  </PermissionGuard>                                    │ │
│  │                                                        │ │
│  │  <PermissionGuard                                      │ │
│  │    permission="invite_users"                           │ │
│  │    fallback={<UpgradePrompt />}>                       │ │
│  │    <InviteUserModule />                                │ │
│  │  </PermissionGuard>                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Professional UI/UX Best Practices

### 1. **Progressive Disclosure Pattern**

Show features incrementally as users gain permissions:

```tsx
// ❌ BAD: User sees everything but gets errors
<Button onClick={createPoll}>Create Poll</Button>

// ✅ GOOD: Button only appears when user has permission
<PermissionGuard permission="create_polls">
  <Button onClick={createPoll}>Create Poll</Button>
</PermissionGuard>

// ✅ EVEN BETTER: Show upgrade prompt for locked features
<PermissionGuard 
  permission="create_polls"
  fallback={
    <LockedFeatureCard 
      feature="Poll Creation"
      requiredPermission="create_polls"
    />
  }>
  <Button onClick={createPoll}>Create Poll</Button>
</PermissionGuard>
```

### 2. **Visual Hierarchy for Permissions**

```
Tier 1: Available Features (Full Opacity)
  └─ Users can interact immediately
  
Tier 2: Locked Features (Dimmed with Lock Icon)
  └─ Shows what's possible with upgrade
  └─ Click shows permission requirements
  
Tier 3: Hidden Features (Not Rendered)
  └─ System-critical features (e.g., super admin only)
```

### 3. **Graceful Degradation**

When users lose permissions:
- Don't break existing UI
- Show informative empty states
- Preserve navigation structure
- Cache previous data with "Refresh Required" notice

### 4. **Clear Communication**

**Empty States:**
```tsx
<PermissionGuard 
  permission="view_users"
  fallback={
    <EmptyState
      icon={Lock}
      title="User Management Unavailable"
      description="Contact your administrator to request access to user management features."
      action={<Button>Request Access</Button>}
    />
  }>
  <UserManagementModule />
</PermissionGuard>
```

**Feature Tooltips:**
```tsx
<Tooltip content="Requires 'Invite Users' permission">
  <Button disabled={!hasPermission('invite_users')}>
    Invite User
  </Button>
</Tooltip>
```

### 5. **Adaptive Navigation**

**Smart Sidebar:**
- Always show main categories
- Expand/collapse based on permissions
- Badge count shows available sub-features
- Disabled items with tooltip (optional)

**Example:**
```
Dashboard (Always visible)
├─ Users ⟨3⟩
│  ├─ View Users ✓
│  ├─ Invite Users ✓
│  └─ Manage Roles 🔒 (Hover: "Requires admin role")
├─ Polls ⟨2⟩
│  ├─ My Polls ✓
│  └─ Create Poll ✓
└─ Analytics 🔒 (Hidden or dimmed)
```

---

## 🛠️ Technical Implementation

### 1. Create Permission Guard Component

```tsx
// resources/js/components/permission-guard.tsx
import { usePage } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

interface PermissionGuardProps extends PropsWithChildren {
  permission?: string;
  anyPermission?: string[];
  allPermissions?: string[];
  fallback?: React.ReactNode;
  showFallback?: boolean; // New: controls whether to show fallback or hide completely
}

export function PermissionGuard({
  permission,
  anyPermission,
  allPermissions,
  fallback = null,
  showFallback = false,
  children,
}: PermissionGuardProps) {
  const { auth } = usePage<{ auth: { user: any } }>().props;
  const user = auth.user;
  const userPermissions = user.permissions || [];

  // Super admin bypasses all checks
  if (user.is_super_admin) {
    return <>{children}</>;
  }

  const hasAccess = (() => {
    if (permission) return userPermissions.includes(permission);
    if (anyPermission) return anyPermission.some(p => userPermissions.includes(p));
    if (allPermissions) return allPermissions.every(p => userPermissions.includes(p));
    return false;
  })();

  if (!hasAccess) {
    return showFallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

// Hook for imperative permission checks
export function usePermission() {
  const { auth } = usePage<{ auth: { user: any } }>().props;
  const user = auth.user;
  const permissions = user.permissions || [];

  return {
    hasPermission: (permission: string) => 
      user.is_super_admin || permissions.includes(permission),
    hasAnyPermission: (perms: string[]) => 
      user.is_super_admin || perms.some(p => permissions.includes(p)),
    hasAllPermissions: (perms: string[]) => 
      user.is_super_admin || perms.every(p => permissions.includes(p)),
    permissions,
  };
}
```

### 2. Update Backend to Pass Permissions

```php
// app/Http/Middleware/HandleInertiaRequests.php
public function share(Request $request): array
{
    return [
        ...parent::share($request),
        'auth' => [
            'user' => $request->user() ? [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'role' => $request->user()->role,
                'role_label' => $request->user()->role->label(),
                'is_super_admin' => $request->user()->isSuperAdmin(),
                'is_admin' => $request->user()->isAdmin(),
                'is_user' => $request->user()->isUser(),
                'permissions' => $request->user()->getAllPermissions(), // ← Add this
            ] : null,
        ],
    ];
}
```

### 3. Create Locked Feature Component

```tsx
// resources/js/components/locked-feature-card.tsx
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface LockedFeatureCardProps {
  feature: string;
  requiredPermission: string;
  description?: string;
}

export function LockedFeatureCard({ 
  feature, 
  requiredPermission,
  description 
}: LockedFeatureCardProps) {
  return (
    <Card className="border-dashed border-2 border-muted bg-muted/20 p-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{feature}</h3>
          <p className="text-sm text-muted-foreground">
            {description || `Requires '${requiredPermission}' permission`}
          </p>
        </div>
        <Button variant="outline" size="sm">
          Request Access
        </Button>
      </div>
    </Card>
  );
}
```

---

## 🎯 Dashboard Layout Strategy

### Unified Dashboard Sections

```tsx
export default function UnifiedDashboard() {
  const { hasPermission } = usePermission();

  return (
    <AppLayout>
      {/* Stats Section - Dynamic based on permissions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PermissionGuard permission="view_users">
          <StatCard title="Total Users" value={stats.users} />
        </PermissionGuard>

        <PermissionGuard permission="view_polls">
          <StatCard title="Active Polls" value={stats.polls} />
        </PermissionGuard>

        <PermissionGuard permission="view_results">
          <StatCard title="Total Votes" value={stats.votes} />
        </PermissionGuard>

        <PermissionGuard permission="view_audit_logs">
          <StatCard title="System Health" value="Healthy" />
        </PermissionGuard>
      </div>

      {/* Quick Actions - Show all with locked states */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PermissionGuard 
          permission="invite_users"
          showFallback
          fallback={
            <LockedFeatureCard 
              feature="Invite Users" 
              requiredPermission="invite_users"
            />
          }>
          <ActionCard title="Invite Users" href="/users/invite" />
        </PermissionGuard>

        <PermissionGuard 
          permission="create_polls"
          showFallback
          fallback={
            <LockedFeatureCard 
              feature="Create Poll" 
              requiredPermission="create_polls"
            />
          }>
          <ActionCard title="Create Poll" href="/polls/create" />
        </PermissionGuard>

        <PermissionGuard 
          permission="manage_settings"
          showFallback
          fallback={
            <LockedFeatureCard 
              feature="System Settings" 
              requiredPermission="manage_settings"
            />
          }>
          <ActionCard title="Settings" href="/settings" />
        </PermissionGuard>
      </div>

      {/* Module Sections - Only render if user has access */}
      <PermissionGuard permission="view_users">
        <UserManagementModule />
      </PermissionGuard>

      <PermissionGuard permission="view_results">
        <AnalyticsModule />
      </PermissionGuard>
    </AppLayout>
  );
}
```

---

## 🎨 Visual Design Patterns

### 1. **Permission States**

```css
/* Available Feature */
.feature-available {
  opacity: 1;
  cursor: pointer;
  transition: all 0.2s;
}

/* Locked Feature */
.feature-locked {
  opacity: 0.6;
  cursor: not-allowed;
  position: relative;
}

.feature-locked::after {
  content: '🔒';
  position: absolute;
  top: 8px;
  right: 8px;
}

/* Hidden Feature */
.feature-hidden {
  display: none;
}
```

### 2. **Empty State Hierarchy**

```
Priority 1: Contextual Empty State
  "You don't have permission to view users"
  [Request Access Button]

Priority 2: Educational Empty State
  "User management lets you invite and manage team members"
  [Learn More] [Contact Admin]

Priority 3: Generic Empty State
  "This feature is not available"
  [Go to Dashboard]
```

### 3. **Navigation Patterns**

**Option A: Hide Restricted Items**
```tsx
<Sidebar>
  <PermissionGuard permission="view_users">
    <NavItem>Users</NavItem>
  </PermissionGuard>
  <PermissionGuard permission="view_polls">
    <NavItem>Polls</NavItem>
  </PermissionGuard>
</Sidebar>
```

**Option B: Show Locked Items (Better for Discovery)**
```tsx
<Sidebar>
  <NavItem 
    disabled={!hasPermission('view_users')}
    tooltip="Requires 'View Users' permission">
    Users {!hasPermission('view_users') && <Lock />}
  </NavItem>
</Sidebar>
```

**Recommendation: Use Option A for production, Option B for self-service platforms**

---

## 📊 User Journey Examples

### Scenario 1: New User (No Extra Permissions)
```
Dashboard
├─ Welcome Card
├─ My Profile (Always available)
├─ My Polls (If has create_polls)
└─ [Locked] User Management 🔒
   └─ Tooltip: "Available with User Manager role"
```

### Scenario 2: User Manager (Gained invite_users)
```
Dashboard
├─ Welcome Card
├─ Stats: Total Users ✅ (New!)
├─ Quick Action: Invite Users ✅ (Unlocked!)
├─ User Management Module ✅ (Appears)
└─ [Locked] System Settings 🔒
```

### Scenario 3: Content Manager (Multiple Permissions)
```
Dashboard
├─ Stats Grid (4 cards visible)
├─ Quick Actions (8 actions unlocked)
├─ User Management ✅
├─ Poll Management ✅
├─ Analytics Dashboard ✅
└─ [Locked] Super Admin Tools 🔒
```

---

## 🔐 Security Best Practices

### Frontend Guards (UI Layer)
```tsx
// For UX only - easily bypassed
<PermissionGuard permission="delete_users">
  <Button>Delete User</Button>
</PermissionGuard>
```

### Backend Guards (Security Layer)
```php
// Always enforce on server
Route::delete('/users/{user}', [UserController::class, 'destroy'])
    ->middleware('permission:delete_users');

// In controller
if (!$request->user()->hasPermission('delete_users')) {
    abort(403, 'Unauthorized action.');
}
```

**Rule: Frontend hides UI, Backend enforces rules**

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [x] Permission system (Already done ✅)
- [ ] Create `PermissionGuard` component
- [ ] Create `usePermission` hook
- [ ] Update Inertia to share permissions
- [ ] Create `LockedFeatureCard` component

### Phase 2: Dashboard (Week 2)
- [ ] Refactor unified dashboard with permission guards
- [ ] Add permission-based sidebar filtering
- [ ] Implement empty states for restricted features
- [ ] Add tooltips for locked features

### Phase 3: Modules (Week 3-4)
- [ ] Wrap all feature modules with guards
- [ ] Add permission checks to action buttons
- [ ] Implement "Request Access" workflow
- [ ] Add analytics for feature usage by permission

### Phase 4: Polish (Week 5)
- [ ] Add animations for permission changes
- [ ] Implement permission change notifications
- [ ] Add onboarding tour showing available features
- [ ] Performance optimization (permission caching)

---

## 📱 Responsive Considerations

### Mobile Strategy
```
Desktop: Show locked features with upgrade prompts
Mobile: Hide locked features (cleaner, less clutter)
Tablet: Show locked features as compact cards
```

### Accessibility
- Use `aria-disabled` for locked features
- Provide screen-reader text: "Feature requires permission"
- Keyboard navigation should skip locked items
- Focus management when permissions change

---

## 🎯 Key Takeaways

✅ **DO:**
- Use one unified dashboard with dynamic rendering
- Show locked features as upgrade opportunities (self-service)
- Hide features completely for simpler UX (enterprise)
- Always enforce permissions on backend
- Provide clear feedback about why features are locked
- Use progressive disclosure patterns

❌ **DON'T:**
- Create multiple dashboards per role
- Show features that error on click
- Make users guess why something is locked
- Rely only on frontend permission checks
- Remove features abruptly without notice

---

## 🔗 Additional Resources

- **Existing Docs:**
  - `PERMISSION_ARCHITECTURE.md` - System design
  - `PERMISSION_QUICK_REFERENCE.md` - API reference
  - `PERMISSIONS_GUIDE.md` - Comprehensive guide

- **UI/UX Patterns:**
  - Nielsen Norman Group: Progressive Disclosure
  - Material Design: States & Permissions
  - Apple HIG: Conditional Features

---

**Questions?** Review the implementation examples above or check the existing permission system documentation.
