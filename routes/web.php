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

    // Fallback for users without an organization (edge case)
    return redirect()->route('home')->with('error', 'No organization assigned.');
})->name('dashboard');

// Tenant Routes
Route::prefix('organization/{organization_slug}')
    ->middleware(['auth', 'verified', 'tenant'])
    ->group(base_path('routes/tenant.php'));

// Global Settings Routes (for Super Admin who doesn't have an organization)
require __DIR__ . '/settings.php';

