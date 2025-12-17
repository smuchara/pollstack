<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserInvitation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Get the current organization ID from the authenticated user.
     */
    protected function getOrganizationId(): ?int
    {
        if (app()->bound('organization')) {
            return app('organization')->id;
        }

        return auth()->user()?->organization_id;
    }

    /**
     * Display a listing of users with pagination.
     */
    public function index(Request $request): Response
    {
        $organizationId = $this->getOrganizationId();

        $perPage = $request->input('per_page', 10);
        $page = $request->input('page', 1);
        $search = $request->input('search', '');
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');

        // Build query scoped to the organization
        $query = User::query()
            ->where('organization_id', $organizationId)
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

        // Paginate
        $users = $query->paginate($perPage);

        // Get pending invitations for this organization
        $pendingInvitations = UserInvitation::where('organization_id', $organizationId)
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($inv) => [
                'id' => $inv->id,
                'name' => $inv->name,
                'email' => $inv->email,
                'role' => $inv->role,
                'expires_at' => $inv->expires_at->format('M d, Y'),
                'created_at' => $inv->created_at->format('M d, Y'),
            ]);

        return Inertia::render('admin/users/index', [
            'users' => $users->items(),
            'pendingInvitations' => $pendingInvitations,
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
     * Get user statistics for dashboard (scoped to organization).
     */
    public function stats(): array
    {
        $organizationId = $this->getOrganizationId();

        $query = User::where('organization_id', $organizationId);

        return [
            'total' => (clone $query)->count(),
            'total_verified' => (clone $query)->whereNotNull('email_verified_at')->count(),
            'total_unverified' => (clone $query)->whereNull('email_verified_at')->count(),
            'total_admins' => (clone $query)->where('role', 'admin')->count(),
            'total_users' => (clone $query)->where('role', 'user')->count(),
            'recent_signups' => (clone $query)->where('created_at', '>=', now()->subDays(7))->count(),
            'pending_invitations' => UserInvitation::where('organization_id', $organizationId)
                ->whereNull('accepted_at')
                ->where('expires_at', '>', now())
                ->count(),
        ];
    }
}

