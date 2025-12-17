<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Admin\UserPermissionController as BaseController;
use App\Models\User;

class UserPermissionController extends BaseController
{
    /**
     * Find a user without scoping to the current organization.
     */
    protected function findUser(string|int $userId): User
    {
        return User::findOrFail((int) $userId);
    }
}
