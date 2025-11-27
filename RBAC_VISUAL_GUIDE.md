# 🎨 RBAC Visual Guide

## 🔺 Role Hierarchy

```
┌─────────────────────────────────────────┐
│         SUPER ADMIN (Level 3)           │
│  ✓ Full System Access                   │
│  ✓ Manage All Users & Roles             │
│  ✓ System Configuration                 │
│  ✓ All Admin Features                   │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│           ADMIN (Level 2)               │
│  ✓ Manage Regular Users                 │
│  ✓ View Reports & Analytics             │
│  ✓ Access Admin Panel                   │
│  ✗ Cannot access Super Admin features   │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│            USER (Level 1)               │
│  ✓ Basic Dashboard Access               │
│  ✓ Manage Own Profile                   │
│  ✗ No Admin Features                    │
│  ✗ Cannot manage other users            │
└─────────────────────────────────────────┘
```

## 🚪 Access Matrix

| Route/Feature | SUPER_ADMIN | ADMIN | USER |
|---------------|:-----------:|:-----:|:----:|
| `/dashboard` | ✅ | ✅ | ✅ |
| `/profile` | ✅ | ✅ | ✅ |
| `/admin/dashboard` | ✅ | ✅ | ❌ |
| `/admin/users` | ✅ | ✅ | ❌ |
| `/admin/settings` | ✅ | ✅ | ❌ |
| `/super-admin/dashboard` | ✅ | ❌ | ❌ |
| `/super-admin/config` | ✅ | ❌ | ❌ |
| `/super-admin/roles` | ✅ | ❌ | ❌ |

## 🎯 Permission Flowchart

```
User tries to access route
        │
        ▼
  Is authenticated?
    │         │
   No        Yes
    │         │
    └─► 401   └─► Check role requirement
              │
              ├─► Requires USER role?
              │   └─► Any authenticated user ✓
              │
              ├─► Requires ADMIN role?
              │   ├─► Is ADMIN? ✓
              │   └─► Is SUPER_ADMIN? ✓
              │
              └─► Requires SUPER_ADMIN role?
                  ├─► Is SUPER_ADMIN? ✓
                  └─► Is ADMIN or USER? ✗ (403)
```

## 🔄 Role Check Flow

### Backend Flow
```
Request
  │
  ▼
Middleware (role:admin)
  │
  ├─► Has role? ──Yes──► Continue
  │
  └─► No ──► 403 Forbidden
```

### Frontend Flow
```
Component Render
  │
  ▼
<RoleGuard requireAdmin>
  │
  ├─► Has role? ──Yes──► Render children
  │
  └─► No ──► Render fallback or null
```

## 📊 Implementation Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     APPLICATION                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐      ┌──────────────┐                │
│  │   Frontend   │◄────►│   Backend    │                │
│  │              │      │              │                │
│  │ - RoleGuard  │      │ - Middleware │                │
│  │ - useRole()  │      │ - Policies   │                │
│  │ - Types      │      │ - Gates      │                │
│  └──────────────┘      └──────┬───────┘                │
│                                │                         │
│                                ▼                         │
│                        ┌──────────────┐                 │
│                        │  User Model  │                 │
│                        │              │                 │
│                        │ - role: Enum │                 │
│                        │ - isAdmin()  │                 │
│                        │ - hasRole()  │                 │
│                        └──────┬───────┘                 │
│                               │                          │
│                               ▼                          │
│                        ┌──────────────┐                 │
│                        │   Database   │                 │
│                        │              │                 │
│                        │ users table  │                 │
│                        │ - role col   │                 │
│                        └──────────────┘                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 🎨 UI Component Examples

### Admin Dashboard Section
```tsx
<RoleGuard requireAdmin>
  ┌──────────────────────────────┐
  │   ADMIN DASHBOARD            │
  ├──────────────────────────────┤
  │                              │
  │  📊 Statistics               │
  │  👥 User Management          │
  │  ⚙️  Settings                │
  │                              │
  └──────────────────────────────┘
</RoleGuard>
```

### Super Admin Section
```tsx
<RoleGuard requireSuperAdmin>
  ┌──────────────────────────────┐
  │   SUPER ADMIN DASHBOARD      │
  ├──────────────────────────────┤
  │                              │
  │  ⚠️  System Config           │
  │  🔐 Role Management          │
  │  📋 System Logs              │
  │  💾 Backups                  │
  │                              │
  └──────────────────────────────┘
</RoleGuard>
```

### Navigation Menu
```tsx
<nav>
  <Link href="/dashboard">Dashboard</Link>      ← All users
  
  <RoleGuard requireAdmin>
    <Link href="/admin">Admin Panel</Link>      ← Admin + Super Admin
  </RoleGuard>
  
  <RoleGuard requireSuperAdmin>
    <Link href="/super-admin">System</Link>     ← Super Admin only
  </RoleGuard>
</nav>
```

## 🔐 Security Layers

```
┌─────────────────────────────────────┐
│         User Request                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│    Layer 1: Authentication          │
│    (Laravel Auth Middleware)        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│    Layer 2: Role Middleware         │
│    (Custom RBAC Middleware)         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│    Layer 3: Controller Logic        │
│    (Additional role checks)         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│    Layer 4: Frontend Guards         │
│    (RoleGuard components)           │
└──────────────┬──────────────────────┘
               │
               ▼
         Final Response
```

## 📈 User Journey Examples

### Example 1: Regular User
```
1. User logs in
   └─► Redirected to /dashboard
       └─► Sees: Profile, Settings, Basic Features
       └─► Cannot see: Admin Panel, System Config
```

### Example 2: Admin User
```
1. Admin logs in
   └─► Redirected to /dashboard
       ├─► Sees: All regular user features
       └─► Plus: Admin Panel link
           └─► Can access: /admin/dashboard, /admin/users
           └─► Cannot access: /super-admin/* routes
```

### Example 3: Super Admin User
```
1. Super Admin logs in
   └─► Redirected to /dashboard
       ├─► Sees: All user features
       ├─► Sees: All admin features
       └─► Sees: Super Admin panel
           └─► Can access: Everything
               ├─► /admin/*
               └─► /super-admin/*
```

## 🎭 Real-World Scenarios

### Scenario 1: User Management
```
┌──────────────────────────────────────┐
│  Who can manage users?               │
├──────────────────────────────────────┤
│                                      │
│  SUPER ADMIN:                        │
│  ✓ View all users                   │
│  ✓ Edit all users                   │
│  ✓ Delete users                     │
│  ✓ Change user roles                │
│                                      │
│  ADMIN:                              │
│  ✓ View all users                   │
│  ✓ Edit regular users only          │
│  ✗ Cannot edit other admins         │
│  ✗ Cannot delete users              │
│  ✗ Cannot change roles              │
│                                      │
│  USER:                               │
│  ✓ View own profile                 │
│  ✓ Edit own profile                 │
│  ✗ Cannot see other users           │
│                                      │
└──────────────────────────────────────┘
```

### Scenario 2: Content Moderation
```
┌──────────────────────────────────────┐
│  Who can moderate content?           │
├──────────────────────────────────────┤
│                                      │
│  SUPER ADMIN: Delete any content    │
│       │                              │
│       ▼                              │
│  ADMIN: Delete inappropriate content│
│       │                              │
│       ▼                              │
│  USER: Report content               │
│                                      │
└──────────────────────────────────────┘
```

## 🎁 Code Pattern Examples

### Pattern 1: Progressive Access
```php
// Everyone can view
public function index() {
    return $posts;
}

// Only authenticated users can create
public function store() {
    // Implicitly checked by 'auth' middleware
}

// Only admins can edit
public function update() {
    if (!auth()->user()->isAdmin()) abort(403);
}

// Only super admin can delete
public function destroy() {
    if (!auth()->user()->isSuperAdmin()) abort(403);
}
```

### Pattern 2: Role-Based Data Access
```php
$query = Post::query();

if ($user->isUser()) {
    // Regular users see only their own posts
    $query->where('user_id', $user->id);
} elseif ($user->isAdmin()) {
    // Admins see all posts from regular users
    $query->whereHas('user', fn($q) => $q->where('role', 'user'));
} elseif ($user->isSuperAdmin()) {
    // Super admins see everything
    // No filtering needed
}

return $query->get();
```

### Pattern 3: UI Adaptation
```tsx
const Dashboard = () => {
  const { role, isAdmin, isSuperAdmin } = useRole();

  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* All users see this */}
      <UserStats />
      
      {/* Admin and Super Admin see this */}
      {isAdmin() && <AdminStats />}
      
      {/* Only Super Admin sees this */}
      {isSuperAdmin() && <SystemStats />}
      
      {/* Different greeting based on role */}
      <p>Welcome, {role === 'super_admin' ? 'System Administrator' : 'User'}!</p>
    </div>
  );
};
```

---

## 🎯 Quick Decision Tree

**"Which role should I use for this feature?"**

```
Does this feature affect system-wide settings?
├─ Yes → SUPER_ADMIN
└─ No
   └─ Does this feature manage other users?
      ├─ Yes → ADMIN (or SUPER_ADMIN)
      └─ No → USER (all authenticated users)
```

---

**Need help? Refer to:**
- `ROLES.md` - Complete documentation
- `RBAC_EXAMPLE.md` - Code examples
- `RBAC_QUICK_REFERENCE.md` - Quick reference
