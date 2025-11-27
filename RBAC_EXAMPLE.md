# Role-Based Access Control - Usage Examples

## Backend Examples

### Example 1: Protected Routes

```php
// routes/web.php or routes/admin.php

use App\Enums\Role;
use Illuminate\Support\Facades\Route;

// Super admin only route
Route::middleware(['auth', 'super.admin'])->get('/system/config', function () {
    return view('system.config');
});

// Admin or super admin route
Route::middleware(['auth', 'admin'])->get('/admin/dashboard', function () {
    return view('admin.dashboard');
});

// Specific role required
Route::middleware(['auth', 'role:admin'])->get('/admin/reports', function () {
    return view('admin.reports');
});

// Any of multiple roles
Route::middleware(['auth', 'role.any:admin,super_admin'])->get('/management', function () {
    return view('management');
});
```

### Example 2: Controller with Role-Based Actions

```php
// app/Http/Controllers/UserManagementController.php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class UserManagementController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            // All methods require admin
            new Middleware('admin'),
            // Only super admin can delete users
            new Middleware('super.admin', only: ['destroy']),
        ];
    }

    public function index()
    {
        $users = User::all();
        return inertia('users/index', ['users' => $users]);
    }

    public function store(Request $request)
    {
        // Only super admin can create admin users
        if ($request->role === Role::ADMIN->value && !$request->user()->isSuperAdmin()) {
            abort(403, 'Only super admins can create admin users.');
        }

        $user = User::create($request->validated());
        return back()->with('success', 'User created.');
    }

    public function destroy(User $user)
    {
        // Only super admin can access this due to middleware
        $user->delete();
        return back()->with('success', 'User deleted.');
    }
}
```

### Example 3: Policy-Based Authorization

```php
// app/Policies/PostPolicy.php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    public function update(User $user, Post $post): bool
    {
        // Admins can edit any post
        if ($user->isAdmin()) {
            return true;
        }

        // Users can only edit their own posts
        return $user->id === $post->user_id;
    }

    public function delete(User $user, Post $post): bool
    {
        // Only super admin or post owner can delete
        return $user->isSuperAdmin() || $user->id === $post->user_id;
    }

    public function forceDelete(User $user, Post $post): bool
    {
        // Only super admin can permanently delete
        return $user->isSuperAdmin();
    }
}
```

## Frontend Examples (React/TypeScript with Inertia.js)

### Example 1: Using RoleGuard Component

```tsx
// resources/js/pages/dashboard.tsx

import { RoleGuard, useRole } from '@/components/role-guard';
import { Role } from '@/types/role';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard() {
  const { role, roleLabel, isAdmin, isSuperAdmin } = useRole();

  return (
    <>
      <Head title="Dashboard" />
      
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        
        <p>Your role: {roleLabel}</p>

        {/* Show to all authenticated users */}
        <div className="my-4">
          <Link href="/profile">My Profile</Link>
        </div>

        {/* Show only to admins */}
        <RoleGuard requireAdmin>
          <div className="bg-blue-100 p-4 rounded my-4">
            <h2 className="font-bold">Admin Tools</h2>
            <Link href="/admin/users">Manage Users</Link>
          </div>
        </RoleGuard>

        {/* Show only to super admins */}
        <RoleGuard requireSuperAdmin>
          <div className="bg-red-100 p-4 rounded my-4">
            <h2 className="font-bold">Super Admin Tools</h2>
            <Link href="/super-admin/config">System Configuration</Link>
          </div>
        </RoleGuard>

        {/* Show to specific role */}
        <RoleGuard role={Role.ADMIN}>
          <button>Admin Only Action</button>
        </RoleGuard>

        {/* Show to any of multiple roles */}
        <RoleGuard anyRole={[Role.ADMIN, Role.SUPER_ADMIN]}>
          <Link href="/reports">View Reports</Link>
        </RoleGuard>

        {/* With fallback */}
        <RoleGuard requireAdmin fallback={<p>You need admin access</p>}>
          <button>Delete Item</button>
        </RoleGuard>
      </div>
    </>
  );
}
```

### Example 2: Using useRole Hook

```tsx
// resources/js/pages/users/index.tsx

import { useRole } from '@/components/role-guard';
import { Role } from '@/types/role';
import { router } from '@inertiajs/react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Props {
  users: User[];
}

export default function UsersList({ users }: Props) {
  const { isSuperAdmin, hasRole, hasAnyRole } = useRole();

  const handleDelete = (userId: number) => {
    if (!isSuperAdmin()) {
      alert('Only super admins can delete users');
      return;
    }

    router.delete(`/users/${userId}`);
  };

  const canEditUser = (user: User) => {
    // Super admin can edit anyone
    if (isSuperAdmin()) return true;
    
    // Regular admin can edit users but not other admins
    if (hasRole(Role.ADMIN)) {
      return user.role === 'user';
    }
    
    return false;
  };

  return (
    <div>
      <h1>Users List</h1>
      
      {hasAnyRole([Role.ADMIN, Role.SUPER_ADMIN]) && (
        <button onClick={() => router.visit('/users/create')}>
          Create User
        </button>
      )}

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                {canEditUser(user) && (
                  <button onClick={() => router.visit(`/users/${user.id}/edit`)}>
                    Edit
                  </button>
                )}
                {isSuperAdmin() && (
                  <button onClick={() => handleDelete(user.id)}>
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Example 3: Navigation Menu with Role-Based Items

```tsx
// resources/js/layouts/navigation.tsx

import { RoleGuard } from '@/components/role-guard';
import { Link } from '@inertiajs/react';

export default function Navigation() {
  return (
    <nav className="bg-gray-800 text-white">
      <ul className="flex space-x-4 p-4">
        {/* Always visible */}
        <li>
          <Link href="/dashboard">Dashboard</Link>
        </li>
        <li>
          <Link href="/profile">Profile</Link>
        </li>

        {/* Admin menu items */}
        <RoleGuard requireAdmin>
          <li>
            <Link href="/admin/dashboard">Admin Dashboard</Link>
          </li>
          <li>
            <Link href="/admin/users">Users</Link>
          </li>
        </RoleGuard>

        {/* Super admin menu items */}
        <RoleGuard requireSuperAdmin>
          <li>
            <Link href="/super-admin/config">System Config</Link>
          </li>
          <li>
            <Link href="/super-admin/roles">Role Management</Link>
          </li>
        </RoleGuard>
      </ul>
    </nav>
  );
}
```

## Testing

### Example Tests

```php
// tests/Feature/RoleMiddlewareTest.php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_access_super_admin_routes(): void
    {
        $user = User::factory()->superAdmin()->create();

        $response = $this->actingAs($user)->get('/super-admin/dashboard');

        $response->assertStatus(200);
    }

    public function test_admin_cannot_access_super_admin_routes(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->get('/super-admin/dashboard');

        $response->assertStatus(403);
    }

    public function test_admin_can_access_admin_routes(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->get('/admin/dashboard');

        $response->assertStatus(200);
    }

    public function test_regular_user_cannot_access_admin_routes(): void
    {
        $user = User::factory()->user()->create();

        $response = $this->actingAs($user)->get('/admin/dashboard');

        $response->assertStatus(403);
    }
}
```

## Quick Reference

### Backend Role Checks
```php
$user->isSuperAdmin()           // Check if super admin
$user->isAdmin()                // Check if admin or super admin
$user->isUser()                 // Check if regular user
$user->hasRole(Role::ADMIN)     // Check specific role
$user->hasAnyRole([...])        // Check multiple roles
$user->hasPrivilegeOf(Role::X)  // Check hierarchy
```

### Middleware
```php
'super.admin'               // Super admin only
'admin'                     // Admin or super admin
'role:admin'                // Exact role match
'role.any:admin,super_admin' // Any of these roles
```

### Frontend (React/TypeScript)
```tsx
<RoleGuard requireSuperAdmin>...</RoleGuard>
<RoleGuard requireAdmin>...</RoleGuard>
<RoleGuard role={Role.ADMIN}>...</RoleGuard>
<RoleGuard anyRole={[Role.ADMIN]}>...</RoleGuard>

const { isAdmin, isSuperAdmin, hasRole } = useRole();
```
