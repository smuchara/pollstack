<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\PermissionGroup;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserPermissionController extends Controller
{
    /**
     * Get the current organization ID from the authenticated user.
     */
    protected function getOrganizationId(): ?int
    {
        $org = null;
        if (app()->bound('organization')) {
            $org = app('organization')->id;
        } else {
            $org = auth()->user()?->organization_id;
        }

        return $org;
    }

    /**
     * Find a user within the current organization.
     */
    protected function findUser(string|int $userId): User
    {
        return User::where('id', (int) $userId)
            ->where('organization_id', $this->getOrganizationId())
            ->firstOrFail();
    }

    /**
     * Get user's permissions and groups.
     */
    public function show(string|int $user): JsonResponse
    {
        $user = $this->findUser($user);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'permission_groups' => $user->permissionGroups->map(fn ($g) => [
                'id' => $g->id,
                'name' => $g->name,
                'label' => $g->label,
            ]),
            'direct_permissions' => $user->directPermissions->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'label' => $p->label,
                'granted' => $p->pivot->granted,
            ]),
            'all_permissions' => $user->getAllPermissions(),
        ]);
    }

    /**
     * Display the user permission assignment page.
     */
    public function edit(string|int $user): Response
    {
        $user = $this->findUser($user);

        $permissionGroups = PermissionGroup::with('permissions')->get()->map(function ($group) {
            return [
                'id' => $group->id,
                'name' => $group->name,
                'label' => $group->label,
                'description' => $group->description,
                'is_system' => $group->is_system,
                'permissions_count' => $group->permissions->count(),
                'permissions' => $group->permissions->map(fn ($p) => [
                    'id' => $p->id,
                    'label' => $p->label,
                ]),
            ];
        });

        $permissions = Permission::all()->groupBy('model');

        return Inertia::render('admin/users/permissions', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'role_label' => $user->role_label,
            ],
            'permission_groups' => $permissionGroups,
            'permissions' => $permissions,
            'user_permission_groups' => $user->permissionGroups->pluck('id'),
            'user_direct_permissions' => $user->directPermissions->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'label' => $p->label,
                'granted' => $p->pivot->granted,
            ]),
            'all_permissions' => $user->getAllPermissions(),
        ]);
    }

    /**
     * Assign permission groups to a user.
     */
    public function assignGroups(Request $request, string|int $user): JsonResponse
    {
        $user = $this->findUser($user);

        $validated = $request->validate([
            'permission_group_ids' => 'required|array',
            'permission_group_ids.*' => 'exists:permission_groups,id',
        ]);

        $user->assignPermissionGroups($validated['permission_group_ids']);

        return response()->json([
            'message' => 'Permission groups assigned successfully',
            'user' => $user->load('permissionGroups'),
        ]);
    }

    /**
     * Grant a direct permission to a user.
     */
    public function grantPermission(Request $request, string|int $user): JsonResponse
    {
        $user = $this->findUser($user);

        $validated = $request->validate([
            'permission_id' => 'required|exists:permissions,id',
        ]);

        $user->grantPermission($validated['permission_id']);

        return response()->json([
            'message' => 'Permission granted successfully',
        ]);
    }

    /**
     * Revoke a permission from a user.
     */
    public function revokePermission(Request $request, string|int $user): JsonResponse
    {
        $user = $this->findUser($user);

        $validated = $request->validate([
            'permission_id' => 'required|exists:permissions,id',
        ]);

        $user->revokePermission($validated['permission_id']);

        return response()->json([
            'message' => 'Permission revoked successfully',
        ]);
    }

    /**
     * Update user's role (separate from permissions).
     */
    public function updateRole(Request $request, string|int $user): JsonResponse
    {
        $user = $this->findUser($user);

        $validated = $request->validate([
            'role' => 'required|in:super_admin,admin,user',
        ]);

        $user->update(['role' => $validated['role']]);

        return response()->json([
            'message' => 'User role updated successfully',
            'user' => $user,
        ]);
    }

    /**
     * Batch update user permissions (groups + direct permissions).
     */
    public function updatePermissions(Request $request, string|int $user): RedirectResponse
    {
        $user = $this->findUser($user);

        $validated = $request->validate([
            'permission_group_ids' => 'nullable|array',
            'permission_group_ids.*' => 'exists:permission_groups,id',
            'granted_permissions' => 'nullable|array',
            'granted_permissions.*' => 'exists:permissions,id',
            'revoked_permissions' => 'nullable|array',
            'revoked_permissions.*' => 'exists:permissions,id',
        ]);

        // Update permission groups
        if (isset($validated['permission_group_ids'])) {
            $user->assignPermissionGroups($validated['permission_group_ids']);
        }

        // Grant permissions
        if (isset($validated['granted_permissions'])) {
            foreach ($validated['granted_permissions'] as $permissionId) {
                $user->grantPermission($permissionId);
            }
        }

        // Revoke permissions
        if (isset($validated['revoked_permissions'])) {
            foreach ($validated['revoked_permissions'] as $permissionId) {
                $user->revokePermission($permissionId);
            }
        }

        return redirect()->back()->with('success', 'User permissions updated successfully');
    }
}
