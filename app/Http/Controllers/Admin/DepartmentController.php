<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDepartmentRequest;
use App\Http\Requests\Admin\UpdateDepartmentRequest;
use App\Models\Department;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DepartmentController extends Controller
{
    /**
     * Display a listing of the organization's departments.
     */
    public function index()
    {
        $organization = app('organization');

        $departments = Department::where('organization_id', $organization->id)
            ->withCount('users')
            ->orderBy('is_default', 'desc')
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/departments', [
            'departments' => $departments,
        ]);
    }

    /**
     * Get departments as JSON (for API calls).
     */
    public function list()
    {
        $organization = app('organization');

        $departments = Department::where('organization_id', $organization->id)
            ->withCount('users')
            ->orderBy('name')
            ->get();

        return response()->json([
            'departments' => $departments,
        ]);
    }

    /**
     * Store a newly created department.
     */
    public function store(StoreDepartmentRequest $request)
    {
        $organization = app('organization');

        Department::create([
            'name' => $request->validated('name'),
            'description' => $request->validated('description'),
            'organization_id' => $organization->id,
            'is_default' => false,
        ]);

        return back()->with('success', 'Department created successfully.');
    }

    /**
     * Update the specified department.
     */
    public function update(UpdateDepartmentRequest $request, Department $department)
    {
        $organization = app('organization');

        // Ensure department belongs to this organization
        if ($department->organization_id !== $organization->id) {
            abort(403, 'Unauthorized access to department.');
        }

        // Prevent editing default departments name (can only edit description)
        if ($department->is_default && $request->validated('name') !== $department->name) {
            return back()->with('error', 'Cannot rename default departments.');
        }

        $department->update([
            'name' => $request->validated('name'),
            'description' => $request->validated('description'),
        ]);

        return back()->with('success', 'Department updated successfully.');
    }

    /**
     * Remove the specified department.
     */
    public function destroy(Department $department)
    {
        $organization = app('organization');

        // Ensure department belongs to this organization
        if ($department->organization_id !== $organization->id) {
            abort(403, 'Unauthorized access to department.');
        }

        // Prevent deleting default departments
        if ($department->is_default) {
            return back()->with('error', 'Cannot delete default departments.');
        }

        $department->delete();

        return back()->with('success', 'Department deleted successfully.');
    }

    /**
     * Get users in a department.
     */
    public function users(Department $department)
    {
        $organization = app('organization');

        // Ensure department belongs to this organization
        if ($department->organization_id !== $organization->id) {
            abort(403, 'Unauthorized access to department.');
        }

        $users = $department->users()
            ->select('users.id', 'users.name', 'users.email')
            ->orderBy('name')
            ->get();

        return response()->json([
            'users' => $users,
        ]);
    }

    /**
     * Add users to a department.
     */
    public function addUsers(Request $request, Department $department)
    {
        $organization = app('organization');

        // Ensure department belongs to this organization
        if ($department->organization_id !== $organization->id) {
            abort(403, 'Unauthorized access to department.');
        }

        $validated = $request->validate([
            'user_ids' => ['required', 'array', 'min:1'],
            'user_ids.*' => ['integer', 'exists:users,id'],
        ]);

        // Validate that users belong to the same organization
        $validUserIds = User::whereIn('id', $validated['user_ids'])
            ->where('organization_id', $organization->id)
            ->pluck('id')
            ->toArray();

        $department->users()->syncWithoutDetaching($validUserIds);

        $count = count($validUserIds);

        return back()->with('success', "{$count} user(s) added to department.");
    }

    /**
     * Remove users from a department.
     */
    public function removeUsers(Request $request, Department $department)
    {
        $organization = app('organization');

        // Ensure department belongs to this organization
        if ($department->organization_id !== $organization->id) {
            abort(403, 'Unauthorized access to department.');
        }

        $validated = $request->validate([
            'user_ids' => ['required', 'array', 'min:1'],
            'user_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $department->users()->detach($validated['user_ids']);

        $count = count($validated['user_ids']);

        return back()->with('success', "{$count} user(s) removed from department.");
    }
}
