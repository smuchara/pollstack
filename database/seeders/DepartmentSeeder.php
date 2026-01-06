<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Organization;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Seeds default departments for all existing organizations.
     * New organizations will automatically get default departments via the Organization model's boot method.
     */
    public function run(): void
    {
        // Get all organizations
        $organizations = Organization::all();

        foreach ($organizations as $organization) {
            // Check if this organization already has default departments
            $hasDefaults = $organization->departments()->where('is_default', true)->exists();

            if (! $hasDefaults) {
                Department::createDefaultsForOrganization($organization);
                $this->command->info("Created default departments for organization: {$organization->name}");
            } else {
                $this->command->info("Skipped organization (already has defaults): {$organization->name}");
            }
        }

        if ($organizations->isEmpty()) {
            $this->command->warn('No organizations found. Default departments will be created automatically when organizations are created.');
        }
    }
}
