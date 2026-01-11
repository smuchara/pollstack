<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('poll_proxies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('poll_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->comment('The original voter')->constrained('users')->cascadeOnDelete();
            $table->foreignId('proxy_user_id')->comment('The designated proxy')->constrained('users')->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->unique(['poll_id', 'user_id'], 'poll_user_unique_proxy');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('poll_proxies');
    }
};
