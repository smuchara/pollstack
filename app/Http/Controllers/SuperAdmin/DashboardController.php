<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('dashboard', [
            'stats' => [
                'total' => User::count(),
                'total_verified' => User::whereNotNull('email_verified_at')->count(),
                'total_unverified' => User::whereNull('email_verified_at')->count(),
                'total_super_admins' => User::where('role', 'super_admin')->count(),
                'total_admins' => User::where('role', 'admin')->count(),
                'total_users' => User::where('role', 'user')->count(),
                'recent_signups' => User::where('created_at', '>=', now()->subDays(7))->count(),
            ],
        ]);
    }
}
