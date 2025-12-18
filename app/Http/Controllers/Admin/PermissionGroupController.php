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
    /**
     * Display the permission groups management page.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isSuperAdmin = $user->isSuperAdmin();
        $organizationId = $user->organization_id;

        $query = PermissionGroup::with('permissions');

        if ($isSuperAdmin) {
            // Super Admin sees ALL global groups (null organization_id)
            // They can filter by scope on frontend if needed
            $query->whereNull('organization_id');
        } else {
            // Client Admin sees:
            // 1. Global "Client" scoped groups (seeded)
            // 2. Their OWN tenant groups
            $query->where(function ($q) use ($organizationId) {
                $q->where(function ($sub) {
                    $sub->whereNull('organization_id')->where('scope', 'client');
                })->orWhere('organization_id', $organizationId);
            });
        }

        $groups = $query->get()->map(function ($group) {
            return [
                'id' => $group->id,
                'name' => $group->name,
                'label' => $group->label,
                'description' => $group->description,
                'is_system' => $group->is_system,
                'scope' => $group->scope,
                'organization_id' => $group->organization_id,
                'permissions_count' => $group->permissions->count(),
                'users_count' => $group->users()->count(),
                'permissions' => $group->permissions->map(fn($p) => [
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
    public function list(Request $request): JsonResponse
    {
        $user = $request->user();
        $isSuperAdmin = $user->isSuperAdmin();
        $organizationId = $user->organization_id;

        $query = PermissionGroup::with('permissions');

        if ($isSuperAdmin) {
            $query->whereNull('organization_id');
        } else {
            $query->where(function ($q) use ($organizationId) {
                $q->where(function ($sub) {
                    $sub->whereNull('organization_id')->where('scope', 'client');
                })->orWhere('organization_id', $organizationId);
            });
        }

        $groups = $query->get()->map(function ($group) {
            return [
                'id' => $group->id,
                'name' => $group->name,
                'label' => $group->label,
                'description' => $group->description,
                'is_system' => $group->is_system,
                'scope' => $group->scope,
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
        $user = $request->user();
        $isSuperAdmin = $user->isSuperAdmin();

        $validated = $request->validate([
            // Unique check needs to be tenant-aware or global-aware
            'name' => [
                'required',
                'string',
                'max:255',
                function ($attribute, $value, $fail) use ($isSuperAdmin, $user) {
                    $query = PermissionGroup::where('name', $value);
                    if ($isSuperAdmin) {
                        $query->whereNull('organization_id');
                    } else {
                        $query->where('organization_id', $user->organization_id);
                    }
                    if ($query->exists()) {
                        $fail('The name has already been taken in this scope.');
                    }
                }
            ],
            'label' => 'required|string|max:255',
            'description' => 'nullable|string',
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,id',
            'scope' => 'nullable|in:system,client', // Passed from frontend
        ]);

        // Determine scope and org
        if ($isSuperAdmin) {
            // Super admin creating Global group
            $organizationId = null;
            $scope = $validated['scope'] ?? 'system'; // Default to system if not passed
        } else {
            // Client admin creating Tenant group
            $organizationId = $user->organization_id;
            $scope = 'client'; // Always client for tenant admins
        }

        $group = PermissionGroup::create([
            'name' => $validated['name'],
            'label' => $validated['label'],
            'description' => $validated['description'] ?? null,
            'is_system' => false,
            'scope' => $scope,
            'organization_id' => $organizationId,
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
        $user = $request->user();

        // Security Check: Tenant Isolation
        if ($permissionGroup->organization_id && $permissionGroup->organization_id !== $user->organization_id) {
            return response()->json(['message' => 'Unauthorized Access'], 403);
        }

        // Security Check: Global System Groups cannot be edited by Client Admins
        if (!$user->isSuperAdmin() && $permissionGroup->organization_id === null) {
            return response()->json(['message' => 'Cannot edit global system groups'], 403);
        }

        // Prevent editing seeded system groups (is_system=true)
        if ($permissionGroup->is_system) {
            return response()->json([
                'message' => 'System permission groups cannot be modified',
            ], 403);
        }

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'string',
                'max:255',
                function ($attribute, $value, $fail) use ($user, $permissionGroup) {
                    $query = PermissionGroup::where('name', $value)->where('id', '!=', $permissionGroup->id);
                    if ($permissionGroup->organization_id) {
                        $query->where('organization_id', $user->organization_id);
                    } else {
                        $query->whereNull('organization_id');
                    }
                    if ($query->exists()) {
                        $fail('The name has already been taken.');
                    }
                }
            ],
            'label' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'permissions' => 'sometimes|array',
            'permissions.*' => 'exists:permissions,id',
            // Scope cannot be changed after creation to avoid confusion
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
    public function destroy(Request $request, PermissionGroup $permissionGroup): JsonResponse
    {
        $user = $request->user();

        // Security Check: Tenant Isolation
        if ($permissionGroup->organization_id && $permissionGroup->organization_id !== $user->organization_id) {
            return response()->json(['message' => 'Unauthorized Access'], 403);
        }

        // Prevet client deleting global groups
        if (!$user->isSuperAdmin() && $permissionGroup->organization_id === null) {
            return response()->json(['message' => 'Cannot delete global groups'], 403);
        }

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
