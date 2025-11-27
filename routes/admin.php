<?php

use App\Http\Controllers\Admin\UserController;
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
        $userController = new UserController();
        $stats = $userController->stats();

        return Inertia::render('admin/dashboard', [
            'stats' => $stats,
        ]);
    })->name('dashboard');

    // User management - accessible by admin and super admin
    Route::get('users', [UserController::class, 'index'])->name('users.index');

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
    // Super admin dashboard
    Route::get('dashboard', function () {
        $userController = new UserController();
        $stats = $userController->stats();

        return Inertia::render('super-admin/dashboard', [
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
});
