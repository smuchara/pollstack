<?php

use App\Http\Controllers\Admin\InvitationController;
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\PermissionGroupController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\UserPermissionController;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
|
| These routes require admin or super admin role to access.
| They are protected by the 'admin' middleware.
|
*/

// Org Admin routes moved to routes/tenant.php

/*
|--------------------------------------------------------------------------
| Super Admin Routes
|--------------------------------------------------------------------------
|
| These routes require super admin role only.
| They are protected by the 'super.admin' middleware.
|
*/

use App\Http\Controllers\SuperAdmin\DashboardController as SADashboardController;
use App\Http\Controllers\SuperAdmin\PollController;
use App\Http\Controllers\SuperAdmin\UserController as SAUserController;
use App\Http\Controllers\SuperAdmin\UserPermissionController as SAUserPermissionController;

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
|
| These routes require admin or super admin role to access.
| They are protected by the 'admin' middleware.
|
*/

// Org Admin routes moved to routes/tenant.php

/*
|--------------------------------------------------------------------------
| Super Admin Routes
|--------------------------------------------------------------------------
|
| These routes require super admin role only.
| They are protected by the 'super.admin' middleware.
|
*/

Route::middleware(['auth', 'verified', 'super.admin'])->prefix('super-admin')->name('super-admin.')->group(function () {
    // Super admin dashboard
    Route::get('dashboard', [SADashboardController::class, 'index'])->name('dashboard');

    // Super admin user management
    Route::get('users', [SAUserController::class, 'index'])->name('users.index');
    Route::post('invitations', [InvitationController::class, 'invite'])->name('invitations.send');
    Route::delete('users/{user}', [SAUserController::class, 'destroy'])->name('users.destroy');

    // User Permissions
    Route::prefix('users/{user}/permissions')->name('users.permissions.')->group(function () {
        Route::get('/', [SAUserPermissionController::class, 'edit'])->name('edit');
        Route::post('assign-groups', [SAUserPermissionController::class, 'assignGroups'])->name('assign-groups');
        Route::post('grant', [SAUserPermissionController::class, 'grantPermission'])->name('grant');
        Route::post('revoke', [SAUserPermissionController::class, 'revokePermission'])->name('revoke');
        Route::post('roles', [SAUserPermissionController::class, 'updateRole'])->name('roles.update');
        Route::put('/', [SAUserPermissionController::class, 'updatePermissions'])->name('update');
    });

    // System configuration - super admin only
    Route::get('config', function () {
        return Inertia::render('super-admin/config');
    })->name('config');

    // Role management - super admin only
    Route::get('roles', function () {
        return Inertia::render('super-admin/roles');
    })->name('roles');

    // Permission management - super admin only
    Route::get('permissions', [PermissionController::class, 'index'])->name('permissions.index');
    Route::post('permissions', [PermissionController::class, 'store'])->name('permissions.store');
    Route::put('permissions/{permission}', [PermissionController::class, 'update'])->name('permissions.update');
    Route::delete('permissions/{permission}', [PermissionController::class, 'destroy'])->name('permissions.destroy');

    // Permission group management - super admin only
    Route::get('permission-groups', [PermissionGroupController::class, 'index'])->name('permission-groups.index');
    Route::get('permission-groups/list', [PermissionGroupController::class, 'list'])->name('permission-groups.list');
    Route::post('permission-groups', [PermissionGroupController::class, 'store'])->name('permission-groups.store');
    Route::put('permission-groups/{permissionGroup}', [PermissionGroupController::class, 'update'])->name('permission-groups.update');
    Route::delete('permission-groups/{permissionGroup}', [PermissionGroupController::class, 'destroy'])->name('permission-groups.destroy');

    // Polls management - super admin only
    Route::get('polls', [PollController::class, 'index'])->name('polls.index');
    Route::post('polls', [PollController::class, 'store'])->name('polls.store');
    Route::put('polls/{poll}', [PollController::class, 'update'])->name('polls.update');
    Route::delete('polls/{poll}', [PollController::class, 'destroy'])->name('polls.destroy');
    Route::get('polls/{poll}/results', [PollController::class, 'results'])->name('polls.results');

    // Agency onboarding - super admin only
    Route::get('onboarding', [\App\Http\Controllers\SuperAdmin\TenantProvisioningController::class, 'index'])->name('onboarding.index');

    Route::post('onboarding', [\App\Http\Controllers\SuperAdmin\TenantProvisioningController::class, 'store'])->name('onboarding.store');
});
