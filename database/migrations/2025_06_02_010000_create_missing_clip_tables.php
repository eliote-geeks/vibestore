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
        // Créer la table clips si elle n'existe pas
        if (!Schema::hasTable('clips')) {
            Schema::create('clips', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->text('description');
                $table->string('category');
                $table->json('tags')->nullable();
                $table->string('video_path');
                $table->string('thumbnail_path');
                $table->string('duration')->nullable();
                $table->unsignedBigInteger('views')->default(0);
                $table->unsignedBigInteger('likes')->default(0);
                $table->unsignedBigInteger('comments_count')->default(0);
                $table->unsignedBigInteger('shares')->default(0);
                $table->boolean('featured')->default(false);
                $table->boolean('is_active')->default(true);
                $table->json('credits')->nullable();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->timestamps();

                // Index pour les recherches
                $table->index(['category', 'is_active']);
                $table->index(['featured', 'is_active']);
                $table->index(['views', 'is_active']);
                $table->index(['user_id', 'is_active']);
            });
        }

        // Créer la table clip_likes si elle n'existe pas
        if (!Schema::hasTable('clip_likes')) {
            Schema::create('clip_likes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('clip_id')->constrained()->onDelete('cascade');
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->timestamps();

                // Contrainte unique pour éviter les doublons
                $table->unique(['clip_id', 'user_id']);

                // Index pour les performances
                $table->index(['user_id']);
                $table->index(['clip_id']);
            });
        }

        // Créer la table clip_comments si elle n'existe pas
        if (!Schema::hasTable('clip_comments')) {
            Schema::create('clip_comments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('clip_id')->constrained()->onDelete('cascade');
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->text('content');
                $table->foreignId('parent_id')->nullable()->constrained('clip_comments')->onDelete('cascade');
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                // Index pour les performances
                $table->index(['clip_id', 'is_active']);
                $table->index(['user_id', 'is_active']);
                $table->index(['parent_id']);
            });
        }

        // Créer la table clip_comment_likes si elle n'existe pas
        if (!Schema::hasTable('clip_comment_likes')) {
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

        // Créer la table clip_bookmarks si elle n'existe pas
        if (!Schema::hasTable('clip_bookmarks')) {
            Schema::create('clip_bookmarks', function (Blueprint $table) {
                $table->id();
                $table->foreignId('clip_id')->constrained()->onDelete('cascade');
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->timestamps();

                // Contrainte unique pour éviter les doublons
                $table->unique(['clip_id', 'user_id']);

                // Index pour les performances
                $table->index(['user_id']);
                $table->index(['clip_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clip_bookmarks');
        Schema::dropIfExists('clip_comment_likes');
        Schema::dropIfExists('clip_comments');
        Schema::dropIfExists('clip_likes');
        Schema::dropIfExists('clips');
    }
};
