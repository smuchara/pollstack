<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create a super admin user
        User::firstOrCreate(
            ['email' => 'superadmin@example.com'],
            [
                'name' => 'Super Admin',
                'password' => 'password',
                'role' => Role::SUPER_ADMIN,
                'email_verified_at' => now(),
            ]
        );

        // Create an admin user
        User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'password' => 'password',
                'role' => Role::ADMIN,
                'email_verified_at' => now(),
            ]
        );

        // Create a regular user
        User::firstOrCreate(
            ['email' => 'user@example.com'],
            [
                'name' => 'Regular User',
                'password' => 'password',
                'role' => Role::USER,
                'email_verified_at' => now(),
            ]
        );

        // Create the test user (default role: USER)
        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => 'password',
                'role' => Role::USER,
                'email_verified_at' => now(),
            ]
        );

        // Optionally create additional random users
        // User::factory(10)->create();
    }
}
