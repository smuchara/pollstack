<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Display a listing of users with pagination.
     */
    public function index(Request $request): Response
    {
        $perPage = $request->input('per_page', 10);
        $page = $request->input('page', 1);
        $search = $request->input('search', '');
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');

        // Build query with optimized indexing
        $query = User::query()
            ->select('id', 'name', 'email', 'role', 'email_verified_at', 'created_at');

        // Search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Sorting
        $query->orderBy($sortBy, $sortOrder);

        // Paginate with cursor pagination for better performance on large datasets
        $users = $query->paginate($perPage);

        return Inertia::render('admin/users/index', [
            'users' => $users->items(),
            'pagination' => [
                'total' => $users->total(),
                'per_page' => $users->perPage(),
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'from' => $users->firstItem(),
                'to' => $users->lastItem(),
            ],
            'filters' => [
                'search' => $search,
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ],
        ]);
    }

    /**
     * Get user statistics for dashboard.
     */
    public function stats(): array
    {
        return [
            'total' => User::count(),
            'total_verified' => User::whereNotNull('email_verified_at')->count(),
            'total_unverified' => User::whereNull('email_verified_at')->count(),
            'total_super_admins' => User::where('role', 'super_admin')->count(),
            'total_admins' => User::where('role', 'admin')->count(),
            'total_users' => User::where('role', 'user')->count(),
            'recent_signups' => User::where('created_at', '>=', now()->subDays(7))->count(),
        ];
    }
}
