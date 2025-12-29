<?php

use App\Http\Controllers\Admin\InvitationController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\UserPermissionController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\TwoFactorAuthenticationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Tenant Dashboard (User & Admin)
Route::get('/dashboard', function () {
    $user = auth()->user();
    if ($user->isAdmin()) {
        return redirect()->route('tenant.admin.dashboard', app('organization')->slug);
    }

    return Inertia::render('user-dashboard');
})->name('tenant.dashboard');

// Organization Admin Routes
Route::middleware(['admin'])->prefix('admin')->name('tenant.admin.')->group(function () {

    Route::get('dashboard', function () {
        $userController = new UserController;
        $stats = $userController->stats();

        return Inertia::render('dashboard', ['stats' => $stats]);
    })->name('dashboard');

    // User management
    Route::get('users', [UserController::class, 'index'])->name('users.index');

    // Invitations
    Route::post('invitations', [InvitationController::class, 'invite'])->name('invitations.send');
    Route::delete('invitations/{id}', [InvitationController::class, 'cancel'])->name('invitations.cancel');
    Route::post('invitations/{id}/resend', [InvitationController::class, 'resend'])->name('invitations.resend');

    // Permissions
    Route::get('users/{user}/permissions', [UserPermissionController::class, 'edit'])->name('users.permissions.edit');
    Route::get('users/{user}/permissions/show', [UserPermissionController::class, 'show'])->name('users.permissions.show');
    Route::put('users/{user}/permissions', [UserPermissionController::class, 'updatePermissions'])->name('users.permissions.update');
    Route::post('users/{user}/permissions/grant', [UserPermissionController::class, 'grantPermission'])->name('users.permissions.grant');
    Route::post('users/{user}/permissions/revoke', [UserPermissionController::class, 'revokePermission'])->name('users.permissions.revoke');
    Route::post('users/{user}/groups', [UserPermissionController::class, 'assignGroups'])->name('users.groups.assign');
    Route::put('users/{user}/role', [UserPermissionController::class, 'updateRole'])->name('users.role.update');

    // Settings
    Route::get('settings', function () {
        return Inertia::render('admin/settings');
    })->name('settings');

    // Permission Groups
    Route::get('permission-groups', [\App\Http\Controllers\Admin\PermissionGroupController::class, 'index'])->name('permission-groups.index');
    Route::get('permission-groups/list', [\App\Http\Controllers\Admin\PermissionGroupController::class, 'list'])->name('permission-groups.list');
    Route::post('permission-groups', [\App\Http\Controllers\Admin\PermissionGroupController::class, 'store'])->name('permission-groups.store');
    Route::put('permission-groups/{permissionGroup}', [\App\Http\Controllers\Admin\PermissionGroupController::class, 'update'])->name('permission-groups.update');
    Route::delete('permission-groups/{permissionGroup}', [\App\Http\Controllers\Admin\PermissionGroupController::class, 'destroy'])->name('permission-groups.destroy');

    // Polls management - organization admin (CRUD)
    Route::get('polls-management', [\App\Http\Controllers\Admin\PollController::class, 'index'])->name('polls-management.index');
    Route::post('polls-management', [\App\Http\Controllers\Admin\PollController::class, 'store'])->name('polls-management.store');
    Route::put('polls-management/{poll}', [\App\Http\Controllers\Admin\PollController::class, 'update'])->name('polls-management.update');
    Route::delete('polls-management/{poll}', [\App\Http\Controllers\Admin\PollController::class, 'destroy'])->name('polls-management.destroy');
    Route::get('polls-management/{poll}/results', [\App\Http\Controllers\Admin\PollController::class, 'results'])->name('polls-management.results');

    // Backward-compatible routes for tests (alias to polls-management)
    Route::get('polls', [\App\Http\Controllers\Admin\PollController::class, 'index'])->name('polls.index');
    Route::post('polls', [\App\Http\Controllers\Admin\PollController::class, 'store'])->name('polls.store');
    Route::put('polls/{poll}', [\App\Http\Controllers\Admin\PollController::class, 'update'])->name('polls.update');
    Route::delete('polls/{poll}', [\App\Http\Controllers\Admin\PollController::class, 'destroy'])->name('polls.destroy');
    Route::get('polls/{poll}/results', [\App\Http\Controllers\Admin\PollController::class, 'results'])->name('polls.results');

    // Polls voting - organization scoped
    Route::get('polls-voting', [\App\Http\Controllers\PollController::class, 'index'])->name('polls-voting.index');
    Route::post('polls-voting/{poll}/vote', [\App\Http\Controllers\PollVoteController::class, 'store'])->name('polls-voting.vote');
});

// User Profile Settings (within tenant context) - prefixed to avoid conflicts
Route::redirect('settings', 'settings/profile');
Route::get('settings/profile', [ProfileController::class, 'edit'])->name('tenant.profile.edit');
Route::patch('settings/profile', [ProfileController::class, 'update'])->name('tenant.profile.update');
Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('tenant.profile.destroy');

Route::get('settings/password', [PasswordController::class, 'edit'])->name('tenant.user-password.edit');
Route::put('settings/password', [PasswordController::class, 'update'])
    ->middleware('throttle:6,1')
    ->name('tenant.user-password.update');

Route::get('settings/appearance', function () {
    return Inertia::render('settings/appearance');
})->name('tenant.appearance.edit');

Route::get('settings/two-factor', [TwoFactorAuthenticationController::class, 'show'])
    ->name('tenant.two-factor.show');
