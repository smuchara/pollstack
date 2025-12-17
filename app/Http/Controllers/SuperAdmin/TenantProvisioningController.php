<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Organization;
use App\Models\User;
use App\Enums\Role;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\UserInvitation;
use App\Jobs\SendUserInvitationJob;

class TenantProvisioningController extends Controller
{
    public function index()
    {
        $organizations = Organization::withCount('users')
            ->with([
                'users' => function ($query) {
                    $query->whereIn('role', [Role::CLIENT_SUPER_ADMIN->value, Role::ADMIN->value])
                        ->orderByRaw("CASE WHEN role = ? THEN 1 ELSE 2 END", [Role::CLIENT_SUPER_ADMIN->value])
                        ->limit(1);
                }
            ])
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($org) {
                // Determine status based on admin user and invitation state
                $adminUser = $org->users->first();
                $pendingInvitation = UserInvitation::where('organization_id', $org->id)
                    ->whereNull('accepted_at')
                    ->exists();

                if ($pendingInvitation && !$adminUser) {
                    $status = 'pending_signup';
                } elseif ($adminUser && !$adminUser->email_verified_at) {
                    $status = 'pending_verification';
                } else {
                    $status = 'active';
                }

                return [
                    'id' => $org->id,
                    'name' => $org->name,
                    'slug' => $org->slug,
                    'users_count' => $org->users_count,
                    'status' => $status,
                    'created_at' => $org->created_at->format('M d, Y'),
                ];
            });

        // Calculate status counts
        $activeCount = $organizations->where('status', 'active')->count();
        $pendingSignupCount = $organizations->where('status', 'pending_signup')->count();
        $pendingVerificationCount = $organizations->where('status', 'pending_verification')->count();

        $stats = [
            'total_organizations' => Organization::count(),
            'total_users_in_tenants' => User::whereNotNull('organization_id')->count(),
            'recent_organizations' => Organization::where('created_at', '>=', now()->subDays(30))->count(),
            'active_count' => $activeCount,
            'pending_signup_count' => $pendingSignupCount,
            'pending_verification_count' => $pendingVerificationCount,
        ];

        return \Inertia\Inertia::render('super-admin/onboarding', [
            'organizations' => $organizations,
            'stats' => $stats,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:organizations,slug'],
            'admin_name' => ['required', 'string', 'max:255'],
            'admin_email' => ['required', 'email', 'max:255', 'unique:users,email', 'unique:user_invitations,email'],
            'admin_phone' => ['nullable', 'string', 'max:20'],
        ]);

        return DB::transaction(function () use ($validated, $request) {
            // Create the organization
            $organization = Organization::create([
                'name' => $validated['company_name'],
                'slug' => $validated['slug'],
            ]);

            // Create invitation for the admin (not the user directly)
            $invitation = UserInvitation::create([
                'email' => $validated['admin_email'],
                'name' => $validated['admin_name'],
                'token' => UserInvitation::generateToken(),
                'invited_by' => $request->user()->id,
                'role' => Role::CLIENT_SUPER_ADMIN->value,
                'organization_id' => $organization->id,
                'expires_at' => now()->addDays(7),
            ]);

            // Dispatch the job to send the invitation email
            SendUserInvitationJob::dispatch($invitation);

            return redirect()->back()->with('success', 'Tenant provisioned successfully. An invitation email has been sent to the admin.');
        });
    }
}
