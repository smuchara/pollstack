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

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        $user = auth()->user();

        // Redirect admins and super admins to their dashboard with stats
        if ($user->isAdmin() || $user->isSuperAdmin()) {
            return redirect()->route($user->isSuperAdmin() ? 'super-admin.dashboard' : 'admin.dashboard');
        }

        // Regular users see placeholder dashboard
        return Inertia::render('user-dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
