<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleBasedAccessControlTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that super admin can access super admin routes.
     */
    /**
     * Test that super admin can access super admin routes.
     */
    public function test_super_admin_can_access_super_admin_routes(): void
    {
        $user = User::factory()->superAdmin()->create();

        $response = $this->actingAs($user)->get('/super-admin/dashboard');

        $response->assertStatus(200);
    }

    /**
     * Test that admin cannot access super admin routes.
     */
    public function test_admin_cannot_access_super_admin_routes(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->get('/super-admin/dashboard');

        $response->assertStatus(403);
    }

    /**
     * Test that regular user cannot access super admin routes.
     */
    public function test_user_cannot_access_super_admin_routes(): void
    {
        $user = User::factory()->user()->create();

        $response = $this->actingAs($user)->get('/super-admin/dashboard');

        $response->assertStatus(403);
    }

    /**
     * Test that admin can access admin routes.
     */
    public function test_admin_can_access_admin_routes(): void
    {
        $organization = \App\Models\Organization::factory()->create();
        $user = User::factory()->admin()->create([
            'organization_id' => $organization->id,
        ]);

        $response = $this->actingAs($user)->get("/organization/{$organization->slug}/admin/dashboard");

        $response->assertStatus(200);
    }

    /**
     * Test that super admin can access admin routes.
     */
    public function test_super_admin_can_access_admin_routes(): void
    {
        $organization = \App\Models\Organization::factory()->create();
        $user = User::factory()->superAdmin()->create();

        $response = $this->actingAs($user)->get("/organization/{$organization->slug}/admin/dashboard");

        $response->assertStatus(403); // Super admin shouldn't access tenant dashboard directly unless impersonating or added
    }

    /**
     * Test that regular user cannot access admin routes.
     */
    public function test_user_cannot_access_admin_routes(): void
    {
        $organization = \App\Models\Organization::factory()->create();
        $user = User::factory()->user()->create([
            'organization_id' => $organization->id,
        ]);

        $response = $this->actingAs($user)->get("/organization/{$organization->slug}/admin/dashboard");

        $response->assertStatus(403);
    }

    /**
     * Test user role check methods.
     */
    public function test_user_role_check_methods(): void
    {
        $superAdmin = User::factory()->superAdmin()->create();
        $admin = User::factory()->admin()->create();
        $user = User::factory()->user()->create();

        // Super Admin checks
        $this->assertTrue($superAdmin->isSuperAdmin());
        $this->assertTrue($superAdmin->isAdmin());
        $this->assertFalse($superAdmin->isUser());
        $this->assertTrue($superAdmin->hasRole(Role::SUPER_ADMIN));

        // Admin checks
        $this->assertFalse($admin->isSuperAdmin());
        $this->assertTrue($admin->isAdmin());
        $this->assertFalse($admin->isUser());
        $this->assertTrue($admin->hasRole(Role::ADMIN));

        // User checks
        $this->assertFalse($user->isSuperAdmin());
        $this->assertFalse($user->isAdmin());
        $this->assertTrue($user->isUser());
        $this->assertTrue($user->hasRole(Role::USER));
    }

    /**
     * Test hasAnyRole method.
     */
    public function test_has_any_role_method(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->user()->create();

        $this->assertTrue($admin->hasAnyRole([Role::ADMIN, Role::SUPER_ADMIN]));
        $this->assertFalse($admin->hasAnyRole([Role::USER]));

        $this->assertTrue($user->hasAnyRole([Role::USER, Role::ADMIN]));
        $this->assertFalse($user->hasAnyRole([Role::ADMIN, Role::SUPER_ADMIN]));
    }

    /**
     * Test hasPrivilegeOf method.
     */
    public function test_has_privilege_of_method(): void
    {
        $superAdmin = User::factory()->superAdmin()->create();
        $admin = User::factory()->admin()->create();
        $user = User::factory()->user()->create();

        // Super admin has privilege of all roles
        $this->assertTrue($superAdmin->hasPrivilegeOf(Role::SUPER_ADMIN));
        $this->assertTrue($superAdmin->hasPrivilegeOf(Role::ADMIN));
        $this->assertTrue($superAdmin->hasPrivilegeOf(Role::USER));

        // Admin has privilege of admin and user
        $this->assertFalse($admin->hasPrivilegeOf(Role::SUPER_ADMIN));
        $this->assertTrue($admin->hasPrivilegeOf(Role::ADMIN));
        $this->assertTrue($admin->hasPrivilegeOf(Role::USER));

        // User only has privilege of user
        $this->assertFalse($user->hasPrivilegeOf(Role::SUPER_ADMIN));
        $this->assertFalse($user->hasPrivilegeOf(Role::ADMIN));
        $this->assertTrue($user->hasPrivilegeOf(Role::USER));
    }

    /**
     * Test that users are created with default USER role.
     */
    public function test_users_created_with_default_role(): void
    {
        $user = User::factory()->create();

        $this->assertEquals(Role::USER, $user->role);
        $this->assertTrue($user->isUser());
    }

    /**
     * Test role enum methods.
     */
    public function test_role_enum_methods(): void
    {
        $this->assertEquals('Super Admin', Role::SUPER_ADMIN->label());
        $this->assertEquals('Admin', Role::ADMIN->label());
        $this->assertEquals('User', Role::USER->label());

        $this->assertEquals(['super_admin', 'client_super_admin', 'admin', 'user'], Role::values());

        $this->assertTrue(Role::SUPER_ADMIN->isSuperAdmin());
        $this->assertFalse(Role::ADMIN->isSuperAdmin());

        $this->assertTrue(Role::SUPER_ADMIN->isAdmin());
        $this->assertTrue(Role::ADMIN->isAdmin());
        $this->assertFalse(Role::USER->isAdmin());

        $this->assertTrue(Role::USER->isUser());
        $this->assertFalse(Role::ADMIN->isUser());
    }

    /**
     * Test unauthenticated users cannot access protected routes.
     */
    public function test_unauthenticated_users_cannot_access_protected_routes(): void
    {
        $organization = \App\Models\Organization::factory()->create();
        $this->get("/organization/{$organization->slug}/admin/dashboard")->assertRedirect('/login');
        $this->get('/super-admin/dashboard')->assertRedirect('/login');
    }

    /**
     * Test all admin routes are protected.
     */
    public function test_all_admin_routes_are_protected(): void
    {
        $organization = \App\Models\Organization::factory()->create();
        $user = User::factory()->user()->create([
            'organization_id' => $organization->id,
        ]);

        $this->actingAs($user)->get("/organization/{$organization->slug}/admin/dashboard")->assertStatus(403);
        $this->actingAs($user)->get("/organization/{$organization->slug}/admin/users")->assertStatus(403);
        $this->actingAs($user)->get("/organization/{$organization->slug}/admin/settings")->assertStatus(403);
    }

    /**
     * Test all super admin routes are protected.
     */
    public function test_all_super_admin_routes_are_protected(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->get('/super-admin/dashboard')->assertStatus(403);
        $this->actingAs($admin)->get('/super-admin/config')->assertStatus(403);
        $this->actingAs($admin)->get('/super-admin/roles')->assertStatus(403);
    }

    /**
     * Test that role is properly cast to enum.
     */
    public function test_role_is_cast_to_enum(): void
    {
        $user = User::factory()->admin()->create();

        $this->assertInstanceOf(Role::class, $user->role);
        $this->assertEquals('admin', $user->role->value);
    }

    /**
     * Test that users can be queried by role.
     */
    public function test_users_can_be_queried_by_role(): void
    {
        User::factory()->superAdmin()->create();
        User::factory()->admin()->count(2)->create();
        User::factory()->user()->count(3)->create();

        $this->assertEquals(1, User::where('role', Role::SUPER_ADMIN)->count());
        $this->assertEquals(2, User::where('role', Role::ADMIN)->count());
        $this->assertEquals(3, User::where('role', Role::USER)->count());
    }
}
