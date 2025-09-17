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
            $table->json('credits')->nullable(); // director, producer, cinematographer, editor

            // Relation avec l'utilisateur (artiste)
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Timestamps
            $table->timestamps();

            // Index pour les recherches
            $table->index(['category', 'is_active']);
            $table->index(['featured', 'is_active']);
            $table->index(['views', 'is_active']);
            $table->index(['user_id', 'is_active']);
            $table->fullText(['title', 'description']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clips');
    }
};
