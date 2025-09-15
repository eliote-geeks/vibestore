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
        Schema::create('clip_comment_likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clip_comment_id')->constrained('clip_comments')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            // Contrainte unique pour éviter les doublons
            $table->unique(['clip_comment_id', 'user_id']);

            // Index pour les performances
            $table->index(['user_id']);
            $table->index(['clip_comment_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clip_comment_likes');
    }
};
