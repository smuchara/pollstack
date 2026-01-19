<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Organization extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug'];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get all departments for this organization.
     */
    public function departments()
    {
        return $this->hasMany(Department::class);
    }

    /**
     * Get only custom (non-default) departments for this organization.
     */
    public function customDepartments()
    {
        return $this->hasMany(Department::class)->where('is_default', false);
    }

    /**
     * Boot the model to auto-create default departments.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::created(function (Organization $organization) {
            Department::createDefaultsForOrganization($organization);
        });
    }
}
