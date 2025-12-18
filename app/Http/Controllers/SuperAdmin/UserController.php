<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = $request->input('per_page', 10);
        $search = $request->input('search', '');
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');

        $query = User::with('organization')
            ->select('id', 'name', 'email', 'role', 'email_verified_at', 'created_at', 'organization_id');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $query->orderBy($sortBy, $sortOrder);

        $users = $query->paginate($perPage);

        // Filter permission groups based on user role
        $currentUser = $request->user();
        $query = \App\Models\PermissionGroup::select('id', 'name', 'label', 'scope', 'description');

        // Client Admins only see 'client' scoped groups
        if ($currentUser->isClientSuperAdmin() || $currentUser->isAdmin()) {
            $query->where('scope', 'client');
        }

        return Inertia::render('admin/users/index', [
            'users' => $users->items(),
            'pagination' => [
                'total' => $users->total(),
                'per_page' => $users->perPage(),
                'current_page' => $users->currentPage(),
                'to' => $users->lastItem(),
            ],
            'filters' => [
                'search' => $search,
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ],
            'permission_groups' => $query->get(),
        ]);
    }

    public function destroy($id)
    {
        User::findOrFail($id)->delete(); // Soft delete if trait used, or hard delete
        return redirect()->back();
    }
}
