<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class PermissionGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'label',
        'description',
        'is_system',
    ];

    protected $casts = [
        'is_system' => 'boolean',
    ];

    /**
     * Get the permissions for this group.
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'permission_group_permission')
            ->withTimestamps();
    }

    /**
     * Get the users assigned to this permission group.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_permission_group')
            ->withTimestamps();
    }

    /**
     * Sync permissions for this group.
     */
    public function syncPermissions(array $permissionIds): void
    {
        $this->permissions()->sync($permissionIds);
    }

    /**
     * Check if this group has a specific permission.
     */
    public function hasPermission(string $permissionName): bool
    {
        return $this->permissions()->where('name', $permissionName)->exists();
    }
}
