# RBAC Quick Reference Card

## 🔐 Test Accounts

```
superadmin@example.com : password  (SUPER_ADMIN)
admin@example.com      : password  (ADMIN)
user@example.com       : password  (USER)
test@example.com       : password  (USER)
```

## 🛡️ Backend

### Route Protection

```php
// Super admin only
Route::middleware(['auth', 'super.admin'])->get('/system', ...);

// Admin or super admin
Route::middleware(['auth', 'admin'])->get('/admin', ...);

// Exact role
Route::middleware(['auth', 'role:admin'])->get('/managers', ...);

// Any of multiple roles
Route::middleware(['auth', 'role.any:admin,super_admin'])->get('/staff', ...);
```

### User Role Checks

```php
use App\Enums\Role;

$user->isSuperAdmin()              // true for SUPER_ADMIN only
$user->isAdmin()                   // true for ADMIN or SUPER_ADMIN
$user->isUser()                    // true for USER only
$user->hasRole(Role::ADMIN)        // true for ADMIN only
$user->hasAnyRole([Role::ADMIN, Role::SUPER_ADMIN])
$user->hasPrivilegeOf(Role::ADMIN) // true for ADMIN or higher
```

### Create Users

```php
// Factory
User::factory()->superAdmin()->create();
User::factory()->admin()->create();
User::factory()->user()->create();

// Manual
User::create([
    'name' => 'John',
    'email' => 'john@example.com',
    'password' => 'password',
    'role' => Role::ADMIN,
]);
```

## 💻 Frontend (React/TypeScript)

### RoleGuard Component

```tsx
import { RoleGuard } from '@/components/role-guard';
import { Role } from '@/types/role';

// Super admin only
<RoleGuard requireSuperAdmin>
  <button>Delete System</button>
</RoleGuard>

// Admin or super admin
<RoleGuard requireAdmin>
  <Link href="/admin">Admin Panel</Link>
</RoleGuard>

// Exact role
<RoleGuard role={Role.ADMIN}>
  <p>Admin only</p>
</RoleGuard>

// Any of multiple roles
<RoleGuard anyRole={[Role.ADMIN, Role.SUPER_ADMIN]}>
  <p>Staff only</p>
</RoleGuard>

// With fallback
<RoleGuard requireAdmin fallback={<p>Access Denied</p>}>
  <AdminPanel />
</RoleGuard>
```

### useRole Hook

```tsx
import { useRole } from '@/components/role-guard';

const { 
  user,              // User object with role data
  role,              // Current role enum
  roleLabel,         // Human-readable role
  isAdmin,           // Function: () => boolean
  isSuperAdmin,      // Function: () => boolean
  hasRole,           // Function: (role: Role) => boolean
  hasAnyRole,        // Function: (roles: Role[]) => boolean
} = useRole();

if (isAdmin()) {
  // Show admin features
}
```

### TypeScript Role Helpers

```tsx
import { Role, hasRole, isAdmin, isSuperAdmin } from '@/types/role';

hasRole(user, Role.ADMIN)
hasAnyRole(user, [Role.ADMIN, Role.SUPER_ADMIN])
isAdmin(user)
isSuperAdmin(user)
```

## 🧪 Testing

```php
// tests/Feature/RoleTest.php

$superAdmin = User::factory()->superAdmin()->create();
$admin = User::factory()->admin()->create();
$user = User::factory()->user()->create();

$this->actingAs($superAdmin)->get('/super-admin/dashboard')->assertOk();
$this->actingAs($admin)->get('/super-admin/dashboard')->assertForbidden();
$this->actingAs($user)->get('/admin/dashboard')->assertForbidden();
```

## 📊 Role Hierarchy

```
SUPER_ADMIN (Level 3)  ← Highest privilege
    ↓
ADMIN (Level 2)
    ↓
USER (Level 1)         ← Lowest privilege
```

## 🔑 Middleware Aliases

| Alias | Class | Description |
|-------|-------|-------------|
| `super.admin` | EnsureUserIsSuperAdmin | Super admin only |
| `admin` | EnsureUserIsAdmin | Admin or super admin |
| `role:X` | EnsureUserHasRole | Exact role match |
| `role.any:X,Y` | EnsureUserHasAnyRole | Any of listed roles |

## 📁 Key Files

```
app/
  ├── Enums/Role.php                          ← Role enum
  ├── Models/User.php                         ← User model with role methods
  └── Http/Middleware/
      ├── EnsureUserHasRole.php               ← Role middleware
      ├── EnsureUserHasAnyRole.php
      ├── EnsureUserIsAdmin.php
      └── EnsureUserIsSuperAdmin.php

resources/js/
  ├── types/role.ts                           ← TypeScript types
  └── components/role-guard.tsx               ← React components

routes/
  ├── web.php                                 ← Main routes
  └── admin.php                               ← Admin routes

database/
  ├── migrations/
  │   └── 2025_11_27_110042_add_role_to_users_table.php
  └── seeders/DatabaseSeeder.php              ← Sample users
```

## 🚀 Common Patterns

### Protected Admin Section

```php
// routes/admin.php
Route::middleware(['auth', 'admin'])->prefix('admin')->group(function () {
    Route::get('dashboard', [AdminController::class, 'index']);
    Route::get('users', [UserController::class, 'index']);
});
```

### Controller with Mixed Access

```php
class UserController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('auth'),
            new Middleware('admin', only: ['index', 'edit']),
            new Middleware('super.admin', only: ['destroy']),
        ];
    }
}
```

### Frontend Navigation

```tsx
export default function Navigation() {
  return (
    <nav>
      <Link href="/dashboard">Dashboard</Link>
      
      <RoleGuard requireAdmin>
        <Link href="/admin">Admin Panel</Link>
      </RoleGuard>
      
      <RoleGuard requireSuperAdmin>
        <Link href="/super-admin">System Config</Link>
      </RoleGuard>
    </nav>
  );
}
```

---

📖 **Full Documentation**: See `ROLES.md` and `RBAC_EXAMPLE.md`
