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
            $table->string('city')->nullable()->after('location');
            $table->string('genre')->nullable()->after('city');
            $table->boolean('verified')->default(false)->after('status');
            $table->text('social_links')->nullable()->after('verified');
            $table->string('website')->nullable()->after('social_links');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['city', 'genre', 'verified', 'social_links', 'website']);
        });
    }
};
