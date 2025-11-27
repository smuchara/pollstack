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

Route::middleware(['auth', 'verified', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    // Admin dashboard - accessible by admin and super admin
    Route::get('dashboard', function () {
        $userController = new UserController;
        $stats = $userController->stats();

        return Inertia::render('dashboard', [
            'stats' => $stats,
        ]);
    })->name('dashboard');

    // User management - accessible by admin and super admin
    Route::get('users', [UserController::class, 'index'])->name('users.index');

    // User invitations - accessible by admin and super admin
    Route::post('invitations', [InvitationController::class, 'invite'])->name('invitations.send');
    Route::delete('invitations/{id}', [InvitationController::class, 'cancel'])->name('invitations.cancel');
    Route::post('invitations/{id}/resend', [InvitationController::class, 'resend'])->name('invitations.resend');

    // User permissions - accessible by admin and super admin
    Route::get('users/{user}/permissions', [UserPermissionController::class, 'edit'])->name('users.permissions.edit');
    Route::get('users/{user}/permissions/show', [UserPermissionController::class, 'show'])->name('users.permissions.show');
    Route::put('users/{user}/permissions', [UserPermissionController::class, 'updatePermissions'])->name('users.permissions.update');
    Route::post('users/{user}/permissions/grant', [UserPermissionController::class, 'grantPermission'])->name('users.permissions.grant');
    Route::post('users/{user}/permissions/revoke', [UserPermissionController::class, 'revokePermission'])->name('users.permissions.revoke');
    Route::post('users/{user}/groups', [UserPermissionController::class, 'assignGroups'])->name('users.groups.assign');
    Route::put('users/{user}/role', [UserPermissionController::class, 'updateRole'])->name('users.role.update');

    // Settings - accessible by admin and super admin
    Route::get('settings', function () {
        return Inertia::render('admin/settings');
    })->name('settings');
});

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
    // Super admin dashboard - unified with admin dashboard
    Route::get('dashboard', function () {
        $userController = new UserController;
        $stats = $userController->stats();

        return Inertia::render('dashboard', [
            'stats' => $stats,
        ]);
    })->name('dashboard');

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
});
