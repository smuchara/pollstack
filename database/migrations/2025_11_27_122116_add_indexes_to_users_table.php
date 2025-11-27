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
        Schema::table('users', function (Blueprint $table) {
            // Add indexes for better query performance
            $table->index('name', 'users_name_index');
            $table->index('created_at', 'users_created_at_index');
            $table->index('email_verified_at', 'users_email_verified_at_index');
            // role already has an index from previous migration
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_name_index');
            $table->dropIndex('users_created_at_index');
            $table->dropIndex('users_email_verified_at_index');
        });
    }
};
