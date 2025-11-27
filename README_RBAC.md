# 🔐 PollStack - Role-Based Access Control System

> **Status**: ✅ **FULLY IMPLEMENTED AND VERIFIED**

A complete, production-ready role-based access control (RBAC) system for PollStack with three hierarchical roles.

## 🎯 Quick Start

### Test Accounts
```
Super Admin: superadmin@example.com / password
Admin:       admin@example.com / password
User:        user@example.com / password
```

### Available Routes
| Route | Super Admin | Admin | User |
|-------|:-----------:|:-----:|:----:|
| `/dashboard` | ✅ | ✅ | ✅ |
| `/admin/dashboard` | ✅ | ✅ | ❌ |
| `/admin/users` | ✅ | ✅ | ❌ |
| `/admin/settings` | ✅ | ✅ | ❌ |
| `/super-admin/dashboard` | ✅ | ❌ | ❌ |
| `/super-admin/config` | ✅ | ❌ | ❌ |
| `/super-admin/roles` | ✅ | ❌ | ❌ |

## 📚 Documentation

We've created comprehensive documentation for the RBAC system:

### Main Documentation
- **[ROLES.md](./ROLES.md)** - Complete RBAC guide with all features and usage patterns
- **[RBAC_EXAMPLE.md](./RBAC_EXAMPLE.md)** - Detailed code examples for backend and frontend
- **[RBAC_QUICK_REFERENCE.md](./RBAC_QUICK_REFERENCE.md)** - Quick reference card for daily use
- **[RBAC_VISUAL_GUIDE.md](./RBAC_VISUAL_GUIDE.md)** - Visual flowcharts and diagrams

### Implementation Details
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Full implementation details
- **[RBAC_COMPLETE.md](./RBAC_COMPLETE.md)** - Complete feature checklist

## 🏗️ Architecture Overview

```
User Request
    ↓
Authentication Middleware (Laravel Auth)
    ↓
Role Middleware (Custom RBAC)
    ↓
Controller Logic
    ↓
Frontend RoleGuard Components
    ↓
Response
```

## 🚀 Usage Examples

### Backend

#### Protect Routes
```php
// Admin or super admin
Route::middleware(['auth', 'admin'])->group(function () {
    Route::get('/admin/dashboard', [AdminController::class, 'index']);
});

// Super admin only
Route::middleware(['auth', 'super.admin'])->group(function () {
    Route::get('/super-admin/config', [ConfigController::class, 'index']);
});
```

#### Check Roles in Code
```php
use App\Enums\Role;

// Simple checks
if ($user->isSuperAdmin()) { /* ... */ }
if ($user->isAdmin()) { /* ... */ }
if ($user->isUser()) { /* ... */ }

// Specific role
if ($user->hasRole(Role::ADMIN)) { /* ... */ }

// Multiple roles
if ($user->hasAnyRole([Role::ADMIN, Role::SUPER_ADMIN])) { /* ... */ }

// Hierarchy check
if ($user->hasPrivilegeOf(Role::ADMIN)) { /* ... */ }
```

### Frontend

#### RoleGuard Component
```tsx
import { RoleGuard } from '@/components/role-guard';
import { Role } from '@/types/role';

// Super admin only
<RoleGuard requireSuperAdmin>
  <SystemConfigPanel />
</RoleGuard>

// Admin or super admin
<RoleGuard requireAdmin>
  <AdminPanel />
</RoleGuard>

// Specific role
<RoleGuard role={Role.ADMIN}>
  <AdminFeature />
</RoleGuard>

// With fallback
<RoleGuard requireAdmin fallback={<AccessDenied />}>
  <ProtectedContent />
</RoleGuard>
```

#### useRole Hook
```tsx
import { useRole } from '@/components/role-guard';

const MyComponent = () => {
  const { isAdmin, isSuperAdmin, role, roleLabel } = useRole();

  return (
    <div>
      <p>Your role: {roleLabel}</p>
      {isAdmin() && <AdminButton />}
      {isSuperAdmin() && <SuperAdminButton />}
    </div>
  );
};
```

## 🎨 Features

### ✅ Backend
- [x] Role enum with 3 levels (SUPER_ADMIN, ADMIN, USER)
- [x] Database migration with role column
- [x] User model with role methods
- [x] 4 middleware classes for protection
- [x] Middleware aliases registered
- [x] Admin & super admin routes
- [x] Factory support for roles
- [x] Database seeder with test users
- [x] Role hierarchy system

### ✅ Frontend
- [x] TypeScript types and enum
- [x] RoleGuard component
- [x] useRole() hook
- [x] Role data shared via Inertia
- [x] Example pages (admin & super-admin dashboards)
- [x] User management page with role-based permissions

### ✅ Testing & Docs
- [x] 16 comprehensive tests
- [x] 6 documentation files
- [x] Quick reference guide
- [x] Visual guide with flowcharts

## 📦 Files Overview

### Core Files
```
app/
  ├── Enums/Role.php                     # Role enum
  ├── Models/User.php                    # User with role methods
  └── Http/Middleware/
      ├── EnsureUserHasRole.php          # Role middleware
      ├── EnsureUserHasAnyRole.php       # Multiple roles
      ├── EnsureUserIsAdmin.php          # Admin check
      └── EnsureUserIsSuperAdmin.php     # Super admin check

resources/js/
  ├── types/role.ts                      # TypeScript types
  ├── components/role-guard.tsx          # React components
  └── pages/
      ├── admin/
      │   ├── dashboard.tsx              # Admin dashboard
      │   └── users/index.tsx            # User management
      └── super-admin/
          └── dashboard.tsx              # Super admin dashboard

routes/
  └── admin.php                          # Admin routes

database/
  └── migrations/
      └── 2025_11_27_110042_add_role_to_users_table.php
```

## 🔒 Middleware Aliases

| Alias | Class | Usage |
|-------|-------|-------|
| `role:X` | EnsureUserHasRole | Exact role match |
| `role.any:X,Y` | EnsureUserHasAnyRole | Any of listed roles |
| `admin` | EnsureUserIsAdmin | Admin or super admin |
| `super.admin` | EnsureUserIsSuperAdmin | Super admin only |

## 🌟 Best Practices

1. **Use enums**: Always use `Role::ADMIN` instead of strings
2. **Leverage hierarchy**: Use `isAdmin()` to include super admins
3. **Middleware first**: Prefer middleware over manual checks
4. **Frontend sync**: Keep frontend guards in sync with backend
5. **Test thoroughly**: Use provided test users to verify access

## 🧪 Testing

Run the test suite:
```bash
php artisan test --filter=RoleBasedAccessControlTest
```

Test manually:
1. Login with different role accounts
2. Try accessing various routes
3. Verify appropriate 403 responses
4. Check role-based UI rendering

## 📖 Learn More

- **Backend Guide**: Read [ROLES.md](./ROLES.md) for complete backend documentation
- **Frontend Guide**: Check [RBAC_EXAMPLE.md](./RBAC_EXAMPLE.md) for React/TypeScript examples
- **Quick Reference**: Use [RBAC_QUICK_REFERENCE.md](./RBAC_QUICK_REFERENCE.md) for daily reference
- **Visual Guide**: See [RBAC_VISUAL_GUIDE.md](./RBAC_VISUAL_GUIDE.md) for flowcharts

## 🤝 Contributing

When adding new role-protected features:
1. Add middleware to route/controller
2. Update tests
3. Add frontend RoleGuard where needed
4. Update documentation if necessary

## 📝 License

This RBAC implementation is part of the PollStack project.

---

**🎉 Your RBAC system is ready to use! Start building role-restricted features!**
