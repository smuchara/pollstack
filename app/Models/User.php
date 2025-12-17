<?php

namespace App\Models;

use App\Enums\Role;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'organization_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'role' => Role::class,
        ];
    }


    /**
     * Check if the user is a super admin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === Role::SUPER_ADMIN;
    }

    /**
     * Check if the user is a client super admin.
     */
    public function isClientSuperAdmin(): bool
    {
        return $this->role === Role::CLIENT_SUPER_ADMIN;
    }

    /**
     * Check if the user is an admin (including super admin).
     */
    public function isAdmin(): bool
    {
        return $this->role === Role::ADMIN || $this->role === Role::SUPER_ADMIN || $this->role === Role::CLIENT_SUPER_ADMIN;
    }

    // ... (keep isUser, hasRole etc as is, no changes needed if they just check Enum values)

    // ...

    /**
     * Sync user role with their permission state.
     * Promotes regular users to admin when they get permissions.
     * Demotes admins to regular users when they lose all permissions.
     */
    protected function syncRoleWithPermissions(): void
    {
        // Never modify super admin or client super admin role
        if ($this->isSuperAdmin() || $this->isClientSuperAdmin()) {
            return;
        }

        // Refresh to get latest permission associations
        $this->refresh();

        // Check if user has any permission groups or direct granted permissions
        $hasPermissionGroups = $this->permissionGroups()->count() > 0;
        $hasDirectPermissions = $this->directPermissions()->wherePivot('granted', true)->count() > 0;
        $hasAnyPermissions = $hasPermissionGroups || $hasDirectPermissions;

        // Promote user to admin if they have permissions
        if ($this->isUser() && $hasAnyPermissions) {
            $this->update(['role' => Role::ADMIN]);
        }

        // Demote admin to user if they have no permissions
        // Note: We only demote 'admin', not 'client_super_admin' (handled by guard above)
        if ($this->role === Role::ADMIN && !$hasAnyPermissions) {
            $this->update(['role' => Role::USER]);
        }
    }

    /**
     * Check if the user is a regular user.
     */
    public function isUser(): bool
    {
        return $this->role === Role::USER;
    }

    /**
     * Check if the user has a specific role.
     */
    public function hasRole(Role $role): bool
    {
        return $this->role === $role;
    }

    /**
     * Check if the user has any of the given roles.
     */
    public function hasAnyRole(array $roles): bool
    {
        foreach ($roles as $role) {
            if ($this->hasRole($role)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if the user has privilege of the given role.
     */
    public function hasPrivilegeOf(Role $role): bool
    {
        return $this->role->hasPrivilegeOf($role);
    }

    /**
     * Get the permission groups assigned to this user.
     */
    public function permissionGroups(): BelongsToMany
    {
        return $this->belongsToMany(PermissionGroup::class, 'user_permission_group')
            ->withTimestamps();
    }

    /**
     * Get direct permissions assigned to this user.
     */
    public function directPermissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'user_permissions')
            ->withPivot('granted')
            ->withTimestamps();
    }

    /**
     * Get all permissions for this user (from groups + direct).
     */
    public function getAllPermissions(): array
    {
        // Super admin has all permissions
        if ($this->isSuperAdmin()) {
            return Permission::pluck('name')->toArray();
        }

        // Collect permissions from groups
        $groupPermissions = $this->permissionGroups()
            ->with('permissions')
            ->get()
            ->pluck('permissions')
            ->flatten()
            ->pluck('name')
            ->unique();

        // Collect direct permissions
        $directPermissions = $this->directPermissions()
            ->wherePivot('granted', true)
            ->pluck('name');

        // Collect revoked permissions
        $revokedPermissions = $this->directPermissions()
            ->wherePivot('granted', false)
            ->pluck('name');

        // Merge and filter
        return $groupPermissions
            ->merge($directPermissions)
            ->diff($revokedPermissions)
            ->unique()
            ->values()
            ->toArray();
    }

    /**
     * Check if the user has a specific permission.
     */
    public function hasPermission(string $permissionName): bool
    {
        // Super admin always has all permissions
        if ($this->isSuperAdmin()) {
            return true;
        }

        return in_array($permissionName, $this->getAllPermissions());
    }

    /**
     * Check if the user has any of the given permissions.
     */
    public function hasAnyPermission(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if ($this->hasPermission($permission)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if the user has all of the given permissions.
     */
    public function hasAllPermissions(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if (!$this->hasPermission($permission)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Assign permission groups to this user.
     * Auto-promotes user to admin if they are a regular user.
     */
    public function assignPermissionGroups(array $groupIds): void
    {
        $this->permissionGroups()->sync($groupIds);
        $this->syncRoleWithPermissions();
    }

    /**
     * Grant a direct permission to this user.
     * Auto-promotes user to admin if they are a regular user.
     */
    public function grantPermission(int $permissionId): void
    {
        $this->directPermissions()->syncWithoutDetaching([
            $permissionId => ['granted' => true],
        ]);
        $this->syncRoleWithPermissions();
    }

    /**
     * Revoke a permission from this user.
     */
    public function revokePermission(int $permissionId): void
    {
        $this->directPermissions()->syncWithoutDetaching([
            $permissionId => ['granted' => false],
        ]);
        $this->syncRoleWithPermissions();
    }


    /**
     * Get the organization that owns the user.
     */
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}
