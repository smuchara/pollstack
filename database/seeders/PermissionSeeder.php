<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\PermissionGroup;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Define all permissions for the voting system
        $permissions = [
            // User Management
            [
                'name' => 'invite_users',
                'label' => 'Invite Users',
                'category' => 'user_management',
                'description' => 'Send invitation emails to new users',
            ],
            [
                'name' => 'view_users',
                'label' => 'View Users',
                'category' => 'user_management',
                'description' => 'View list of all users in the system',
            ],
            [
                'name' => 'edit_users',
                'label' => 'Edit Users',
                'category' => 'user_management',
                'description' => 'Edit user details and profiles',
            ],
            [
                'name' => 'delete_users',
                'label' => 'Delete Users',
                'category' => 'user_management',
                'description' => 'Delete users from the system',
            ],
            [
                'name' => 'assign_roles',
                'label' => 'Assign Roles',
                'category' => 'user_management',
                'description' => 'Assign and modify user roles',
            ],
            [
                'name' => 'send_password_reset',
                'label' => 'Send Password Reset',
                'category' => 'user_management',
                'description' => 'Send password reset links to users',
            ],
            [
                'name' => 'manage_permissions',
                'label' => 'Manage Permissions',
                'category' => 'user_management',
                'description' => 'Create and manage permission groups',
            ],

            // Poll Management
            [
                'name' => 'create_polls',
                'label' => 'Create Polls',
                'category' => 'polls',
                'description' => 'Create new polls and voting campaigns',
            ],
            [
                'name' => 'edit_polls',
                'label' => 'Edit Polls',
                'category' => 'polls',
                'description' => 'Edit existing polls',
            ],
            [
                'name' => 'delete_polls',
                'label' => 'Delete Polls',
                'category' => 'polls',
                'description' => 'Delete polls from the system',
            ],
            [
                'name' => 'view_polls',
                'label' => 'View Polls',
                'category' => 'polls',
                'description' => 'View all polls and voting data',
            ],
            [
                'name' => 'publish_polls',
                'label' => 'Publish Polls',
                'category' => 'polls',
                'description' => 'Publish and unpublish polls',
            ],
            [
                'name' => 'moderate_polls',
                'label' => 'Moderate Polls',
                'category' => 'polls',
                'description' => 'Moderate poll content and responses',
            ],

            // Voting Management
            [
                'name' => 'cast_votes',
                'label' => 'Cast Votes',
                'category' => 'voting',
                'description' => 'Participate in polls and cast votes',
            ],
            [
                'name' => 'view_results',
                'label' => 'View Results',
                'category' => 'voting',
                'description' => 'View voting results and analytics',
            ],
            [
                'name' => 'export_results',
                'label' => 'Export Results',
                'category' => 'voting',
                'description' => 'Export voting results and reports',
            ],
            [
                'name' => 'verify_votes',
                'label' => 'Verify Votes',
                'category' => 'voting',
                'description' => 'Verify and audit voting records',
            ],

            // System Configuration
            [
                'name' => 'manage_settings',
                'label' => 'Manage Settings',
                'category' => 'system',
                'description' => 'Configure system settings and preferences',
            ],
            [
                'name' => 'view_audit_logs',
                'label' => 'View Audit Logs',
                'category' => 'system',
                'description' => 'View system audit logs and activity',
            ],
            [
                'name' => 'manage_notifications',
                'label' => 'Manage Notifications',
                'category' => 'system',
                'description' => 'Configure notification settings',
            ],
        ];

        // Create all permissions
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission['name']],
                $permission
            );
        }

        // Create default permission groups
        $this->createDefaultPermissionGroups();
    }

    /**
     * Create default permission groups.
     */
    private function createDefaultPermissionGroups(): void
    {
        // Poll Moderator Group
        $pollModerator = PermissionGroup::firstOrCreate(
            ['name' => 'poll_moderator'],
            [
                'label' => 'Poll Moderator',
                'description' => 'Can create, edit, and moderate polls',
                'is_system' => true,
            ]
        );

        $pollModerator->permissions()->sync(
            Permission::whereIn('name', [
                'create_polls',
                'edit_polls',
                'view_polls',
                'publish_polls',
                'moderate_polls',
                'view_results',
                'cast_votes',
            ])->pluck('id')
        );

        // User Manager Group
        $userManager = PermissionGroup::firstOrCreate(
            ['name' => 'user_manager'],
            [
                'label' => 'User Manager',
                'description' => 'Can manage users and send invitations',
                'is_system' => true,
            ]
        );

        $userManager->permissions()->sync(
            Permission::whereIn('name', [
                'invite_users',
                'view_users',
                'edit_users',
                'send_password_reset',
            ])->pluck('id')
        );

        // Content Manager Group
        $contentManager = PermissionGroup::firstOrCreate(
            ['name' => 'content_manager'],
            [
                'label' => 'Content Manager',
                'description' => 'Full access to poll and voting management',
                'is_system' => true,
            ]
        );

        $contentManager->permissions()->sync(
            Permission::whereIn('name', [
                'create_polls',
                'edit_polls',
                'delete_polls',
                'view_polls',
                'publish_polls',
                'moderate_polls',
                'view_results',
                'export_results',
                'verify_votes',
            ])->pluck('id')
        );

        // Analyst Group
        $analyst = PermissionGroup::firstOrCreate(
            ['name' => 'analyst'],
            [
                'label' => 'Analyst',
                'description' => 'Can view and export voting results',
                'is_system' => true,
            ]
        );

        $analyst->permissions()->sync(
            Permission::whereIn('name', [
                'view_polls',
                'view_results',
                'export_results',
                'view_audit_logs',
            ])->pluck('id')
        );
    }
}
