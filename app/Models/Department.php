<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'organization_id',
        'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    /**
     * Default departments that are seeded for each organization.
     */
    public const DEFAULT_DEPARTMENTS = [
        [
            'name' => 'Board of Directors',
            'slug' => 'board-of-directors',
            'description' => 'Executive leadership and board members',
        ],
        [
            'name' => 'Executive',
            'slug' => 'executive',
            'description' => 'C-suite and senior executives',
        ],
        [
            'name' => 'Finance',
            'slug' => 'finance',
            'description' => 'Finance and accounting department',
        ],
        [
            'name' => 'Human Resources',
            'slug' => 'human-resources',
            'description' => 'HR and people operations',
        ],
        [
            'name' => 'Sales',
            'slug' => 'sales',
            'description' => 'Sales and business development',
        ],
        [
            'name' => 'Marketing',
            'slug' => 'marketing',
            'description' => 'Marketing and communications',
        ],
        [
            'name' => 'Technology',
            'slug' => 'technology',
            'description' => 'IT and software development',
        ],
        [
            'name' => 'Operations',
            'slug' => 'operations',
            'description' => 'Operations and logistics',
        ],
    ];

    /**
     * Boot the model.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Department $department) {
            if (empty($department->slug)) {
                $department->slug = Str::slug($department->name);
            }
        });
    }

    /**
     * Get the organization that owns the department.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Get the users that belong to this department.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'department_user')
            ->withTimestamps();
    }

    /**
     * Scope a query to only include default departments.
     */
    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    /**
     * Scope a query to only include custom departments.
     */
    public function scopeCustom($query)
    {
        return $query->where('is_default', false);
    }

    /**
     * Scope a query to only include departments for a specific organization.
     */
    public function scopeForOrganization($query, $organizationId)
    {
        return $query->where('organization_id', $organizationId);
    }

    /**
     * Create default departments for an organization.
     */
    public static function createDefaultsForOrganization(Organization $organization): void
    {
        foreach (self::DEFAULT_DEPARTMENTS as $department) {
            self::create([
                'name' => $department['name'],
                'slug' => $department['slug'],
                'description' => $department['description'],
                'organization_id' => $organization->id,
                'is_default' => true,
            ]);
        }
    }
}
