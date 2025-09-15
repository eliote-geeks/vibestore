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
        Schema::create('sound_likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('sound_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            // Contrainte d'unicité pour éviter les doublons
            $table->unique(['user_id', 'sound_id']);

            // Index pour optimiser les requêtes
            $table->index(['sound_id']);
            $table->index(['user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sound_likes');
    }
};
