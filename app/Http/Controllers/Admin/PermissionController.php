<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    /**
     * Get all permissions grouped by category.
     */
    public function index(): JsonResponse
    {
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

        return response()->json([
            'permissions' => $permissions,
            'categories' => Permission::distinct('category')->pluck('category'),
        ]);
    }

    /**
     * Create a new permission.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:permissions,name|max:255',
            'label' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $permission = Permission::create($validated);

        return response()->json([
            'message' => 'Permission created successfully',
            'permission' => $permission,
        ], 201);
    }

    /**
     * Update an existing permission.
     */
    public function update(Request $request, Permission $permission): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|unique:permissions,name,'.$permission->id.'|max:255',
            'label' => 'sometimes|string|max:255',
            'category' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
        ]);

        $permission->update($validated);

        return response()->json([
            'message' => 'Permission updated successfully',
            'permission' => $permission,
        ]);
    }

    /**
     * Delete a permission.
     */
    public function destroy(Permission $permission): JsonResponse
    {
        // Check if permission is in use
        $inUse = $permission->permissionGroups()->exists() || $permission->users()->exists();

        if ($inUse) {
            return response()->json([
                'message' => 'Cannot delete permission that is currently assigned to groups or users',
            ], 422);
        }

        $permission->delete();

        return response()->json([
            'message' => 'Permission deleted successfully',
        ]);
    }
}
