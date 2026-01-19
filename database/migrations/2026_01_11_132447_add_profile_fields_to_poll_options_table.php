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
        Schema::table('poll_options', function (Blueprint $table) {
            $table->string('image_url')->nullable()->after('text');
            $table->string('name')->nullable()->after('image_url');
            $table->string('position')->nullable()->after('name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('poll_options', function (Blueprint $table) {
            $table->dropColumn(['image_url', 'name', 'position']);
        });
    }
};
