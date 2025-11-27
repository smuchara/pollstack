<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\PermissionGroup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PermissionGroupController extends Controller
{
    /**
     * Display the permission groups management page.
     */
    public function index(): Response
    {
        $groups = PermissionGroup::with('permissions')->get()->map(function ($group) {
            return [
                'id' => $group->id,
                'name' => $group->name,
                'label' => $group->label,
                'description' => $group->description,
                'is_system' => $group->is_system,
                'permissions_count' => $group->permissions->count(),
                'users_count' => $group->users()->count(),
                'permissions' => $group->permissions->map(fn ($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'label' => $p->label,
                    'category' => $p->category,
                ]),
                'created_at' => $group->created_at,
            ];
        });

        $permissions = Permission::all()->groupBy('category')->map(function ($group) {
            return $group->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'name' => $permission->name,
                    'label' => $permission->label,
                    'description' => $permission->description,
                    'category' => $permission->category,
                ];
            });
        });

        return Inertia::render('super-admin/permission-groups', [
            'groups' => $groups,
            'permissions' => $permissions,
        ]);
    }

    /**
     * Get all permission groups.
     */
    public function list(): JsonResponse
    {
        $groups = PermissionGroup::with('permissions')->get()->map(function ($group) {
            return [
                'id' => $group->id,
                'name' => $group->name,
                'label' => $group->label,
                'description' => $group->description,
                'is_system' => $group->is_system,
                'permissions' => $group->permissions->pluck('id'),
                'users_count' => $group->users()->count(),
            ];
        });

        return response()->json(['groups' => $groups]);
    }

    /**
     * Create a new permission group.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:permission_groups,name|max:255',
            'label' => 'required|string|max:255',
            'description' => 'nullable|string',
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        $group = PermissionGroup::create([
            'name' => $validated['name'],
            'label' => $validated['label'],
            'description' => $validated['description'] ?? null,
            'is_system' => false,
        ]);

        $group->permissions()->sync($validated['permissions']);

        return response()->json([
            'message' => 'Permission group created successfully',
            'group' => $group->load('permissions'),
        ], 201);
    }

    /**
     * Update an existing permission group.
     */
    public function update(Request $request, PermissionGroup $permissionGroup): JsonResponse
    {
        // Prevent editing system groups
        if ($permissionGroup->is_system) {
            return response()->json([
                'message' => 'System permission groups cannot be modified',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|unique:permission_groups,name,'.$permissionGroup->id.'|max:255',
            'label' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'permissions' => 'sometimes|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        $permissionGroup->update([
            'name' => $validated['name'] ?? $permissionGroup->name,
            'label' => $validated['label'] ?? $permissionGroup->label,
            'description' => $validated['description'] ?? $permissionGroup->description,
        ]);

        if (isset($validated['permissions'])) {
            $permissionGroup->permissions()->sync($validated['permissions']);
        }

        return response()->json([
            'message' => 'Permission group updated successfully',
            'group' => $permissionGroup->load('permissions'),
        ]);
    }

    /**
     * Delete a permission group.
     */
    public function destroy(PermissionGroup $permissionGroup): JsonResponse
    {
        // Prevent deleting system groups
        if ($permissionGroup->is_system) {
            return response()->json([
                'message' => 'System permission groups cannot be deleted',
            ], 403);
        }

        // Check if group has users
        $hasUsers = $permissionGroup->users()->exists();

        if ($hasUsers) {
            return response()->json([
                'message' => 'Cannot delete permission group that has users assigned. Please reassign users first.',
            ], 422);
        }

        $permissionGroup->delete();

        return response()->json([
            'message' => 'Permission group deleted successfully',
        ]);
    }
}
