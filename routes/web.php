<?php

use App\Http\Controllers\Admin\InvitationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

// Public invitation routes (accessible without authentication)
Route::get('invitations/accept/{token}', [InvitationController::class, 'show'])->name('invitations.show');
Route::post('invitations/accept/{token}', [InvitationController::class, 'accept'])->name('invitations.accept');

// Dashboard redirect - routes users to the appropriate context
Route::middleware(['auth', 'verified'])->get('dashboard', function () {
    $user = auth()->user();

    // Super Admins go to the super-admin portal
    if ($user->isSuperAdmin()) {
        return redirect()->route('super-admin.dashboard');
    }

    // Users with an organization go to their tenant dashboard
    if ($user->organization_id) {
        $slug = $user->organization->slug;

        return redirect()->route('tenant.dashboard', ['organization_slug' => $slug]);
    }

    // Global users (admins/users without organization) see global dashboard
    return \Inertia\Inertia::render('dashboard', [
        'stats' => [
            'total' => \App\Models\User::count(),
            'total_verified' => \App\Models\User::whereNotNull('email_verified_at')->count(),
            'total_unverified' => \App\Models\User::whereNull('email_verified_at')->count(),
            'total_super_admins' => \App\Models\User::where('role', \App\Enums\Role::SUPER_ADMIN)->count(),
            'total_admins' => \App\Models\User::where('role', \App\Enums\Role::ADMIN)->count(),
            'total_users' => \App\Models\User::where('role', \App\Enums\Role::USER)->count(),
            'recent_signups' => \App\Models\User::where('created_at', '>=', now()->subDays(7))->count(),
        ],
    ]);
})->name('dashboard');

// Tenant Routes
Route::prefix('organization/{organization_slug}')
    ->middleware(['auth', 'verified', 'tenant'])
    ->group(base_path('routes/tenant.php'));

// Global Settings Routes (for Super Admin who doesn't have an organization)
require __DIR__.'/settings.php';

// Public Polls Routes (accessible to all authenticated
// Poll Voting
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/polls', [\App\Http\Controllers\PollController::class, 'index'])->name('polls.index');
    Route::post('/polls/{poll}/vote', [\App\Http\Controllers\PollVoteController::class, 'store'])->name('polls.vote');
    Route::get('/polls/{poll}/results', [\App\Http\Controllers\PollResultsController::class, 'show'])->name('polls.results');

    // Presence Verification - User Routes
    Route::post('/presence/verify', [\App\Http\Controllers\PresenceVerificationController::class, 'verifyPresence'])->name('presence.verify');
    Route::get('/polls/{poll}/verification-status', [\App\Http\Controllers\PresenceVerificationController::class, 'getVerificationStatus'])->name('polls.verification-status');
});

// Presence Verification - QR Scan Route (public, handles auth redirect)
Route::get('/presence/scan/{token}', [\App\Http\Controllers\PresenceVerificationController::class, 'scanQrCode'])->name('presence.verify.scan');
