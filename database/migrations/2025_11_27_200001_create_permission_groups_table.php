<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('permission_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // e.g., 'poll_moderator', 'content_manager'
            $table->string('label'); // e.g., 'Poll Moderator', 'Content Manager'
            $table->text('description')->nullable();
            $table->boolean('is_system')->default(false); // System groups can't be deleted
            $table->timestamps();
        });

        // Pivot table for permission groups and permissions
        Schema::create('permission_group_permission', function (Blueprint $table) {
            $table->id();
            $table->foreignId('permission_group_id')->constrained()->cascadeOnDelete();
            $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['permission_group_id', 'permission_id']);
        });

        // Pivot table for users and permission groups
        Schema::create('user_permission_group', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('permission_group_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'permission_group_id']);
        });

        // Direct user permissions (for individual permission overrides)
        Schema::create('user_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $table->boolean('granted')->default(true); // true = granted, false = revoked
            $table->timestamps();

            $table->unique(['user_id', 'permission_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_permissions');
        Schema::dropIfExists('user_permission_group');
        Schema::dropIfExists('permission_group_permission');
        Schema::dropIfExists('permission_groups');
    }
};
