# Role-Based Access Control (RBAC) Documentation

This application implements a role-based access control system with three roles:
- **SUPER_ADMIN**: Highest privilege level
- **ADMIN**: Administrative access
- **USER**: Regular user access

## Role Hierarchy

The role hierarchy follows this privilege structure:
```
SUPER_ADMIN (Level 3) > ADMIN (Level 2) > USER (Level 1)
```

## Usage in Code

### 1. Checking Roles in Controllers/Code

```php
use App\Enums\Role;

// Check if user is a super admin
if ($user->isSuperAdmin()) {
    // Super admin only logic
}

// Check if user is an admin (includes super admin)
if ($user->isAdmin()) {
    // Admin logic
}

// Check if user is a regular user
if ($user->isUser()) {
    // User logic
}

// Check if user has a specific role
if ($user->hasRole(Role::ADMIN)) {
    // Role-specific logic
}

// Check if user has any of the given roles
if ($user->hasAnyRole([Role::ADMIN, Role::SUPER_ADMIN])) {
    // Multiple role logic
}

// Check if user has privilege of a certain role
if ($user->hasPrivilegeOf(Role::ADMIN)) {
    // This returns true if user is ADMIN or SUPER_ADMIN
}
```

### 2. Using Middleware in Routes

#### Protect routes for specific roles

```php
// Require super admin role
Route::middleware(['auth', 'super.admin'])->group(function () {
    Route::get('/super-admin-dashboard', [SuperAdminController::class, 'index']);
});

// Require admin role (includes super admin)
Route::middleware(['auth', 'admin'])->group(function () {
    Route::get('/admin-panel', [AdminController::class, 'index']);
});

// Require a specific role (exact match)
Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/admin-only', [AdminController::class, 'show']);
});

// Require any of the specified roles
Route::middleware(['auth', 'role.any:admin,super_admin'])->group(function () {
    Route::get('/admin-area', [AdminController::class, 'area']);
});
```

#### Example in Controller

```php
use App\Http\Controllers\Controller;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class AdminController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('admin', only: ['index', 'show']),
            new Middleware('super.admin', only: ['destroy']),
        ];
    }
    
    public function index()
    {
        // Accessible by admin and super admin
    }
    
    public function destroy()
    {
        // Accessible only by super admin
    }
}
```

### 3. Creating Users with Roles

#### Using UserFactory

```php
// Create a super admin user
$superAdmin = User::factory()->superAdmin()->create();

// Create an admin user
$admin = User::factory()->admin()->create();

// Create a regular user
$user = User::factory()->user()->create();

// Create users in bulk
User::factory()->count(5)->admin()->create();
```

#### Manual User Creation

```php
use App\Enums\Role;
use App\Models\User;

User::create([
    'name' => 'John Doe',
    'email' => 'john@example.com',
    'password' => 'password',
    'role' => Role::ADMIN,
]);
```

### 4. Available Middleware Aliases

| Alias | Description |
|-------|-------------|
| `role:role_name` | Requires the exact role specified |
| `role.any:role1,role2` | Requires any of the specified roles |
| `admin` | Requires admin or super admin role |
| `super.admin` | Requires super admin role only |

## Seeded Users

When you run `php artisan db:seed`, the following test users are created:

| Email | Password | Role |
|-------|----------|------|
| superadmin@example.com | password | SUPER_ADMIN |
| admin@example.com | password | ADMIN |
| user@example.com | password | USER |
| test@example.com | password | USER |

## Role Enum Methods

The `Role` enum provides helpful methods:

```php
use App\Enums\Role;

// Get all role values
Role::values(); // ['super_admin', 'admin', 'user']

// Get role label
Role::ADMIN->label(); // 'Admin'

// Check privilege hierarchy
Role::SUPER_ADMIN->hasPrivilegeOf(Role::ADMIN); // true
Role::USER->hasPrivilegeOf(Role::ADMIN); // false

// Role type checks
Role::SUPER_ADMIN->isSuperAdmin(); // true
Role::ADMIN->isAdmin(); // true
Role::USER->isUser(); // true
```

## Best Practices

1. **Always use enums**: Use `Role::ADMIN` instead of string values
2. **Leverage hierarchy**: Use `isAdmin()` when you want to include super admins
3. **Middleware first**: Prefer middleware protection over manual checks
4. **Test access**: Create tests for role-based access control
5. **Frontend sync**: Pass role information to frontend for UI adjustments

## Frontend Integration (Inertia.js)

Share the user role with the frontend in `HandleInertiaRequests`:

```php
public function share(Request $request): array
{
    return array_merge(parent::share($request), [
        'auth' => [
            'user' => $request->user() ? [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'role' => $request->user()->role->value,
                'role_label' => $request->user()->role->label(),
            ] : null,
        ],
    ]);
}
```

Then in your React/TypeScript components:

```tsx
import { usePage } from '@inertiajs/react';

const { auth } = usePage().props;

// Check role in frontend
if (auth.user?.role === 'super_admin') {
    // Show super admin features
}

if (auth.user?.role === 'admin' || auth.user?.role === 'super_admin') {
    // Show admin features
}
```

## Migration

To apply the role system to your database:

```bash
php artisan migrate
php artisan db:seed
```

This will add the `role` column to the `users` table and create the test users.
