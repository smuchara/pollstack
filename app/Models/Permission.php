<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permission extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'label',
        'category',
        'description',
    ];

    /**
     * Get the permission groups that have this permission.
     */
    public function permissionGroups(): BelongsToMany
    {
        return $this->belongsToMany(PermissionGroup::class, 'permission_group_permission')
            ->withTimestamps();
    }

    /**
     * Get the users that have this permission directly.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_permissions')
            ->withPivot('granted')
            ->withTimestamps();
    }

    /**
     * Get permissions grouped by category.
     */
    public static function groupedByCategory(): array
    {
        return self::all()
            ->groupBy('category')
            ->map(fn ($permissions) => $permissions->toArray())
            ->toArray();
    }
}
