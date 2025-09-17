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
        Schema::create('sounds', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Créateur du son
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->string('file_path'); // Chemin du fichier audio
            $table->string('cover_image')->nullable(); // Image de couverture
            $table->integer('duration')->nullable(); // Durée en secondes
            $table->string('genre')->nullable(); // Genre musical
            $table->decimal('price', 10, 2)->default(0); // Prix en XAF
            $table->boolean('is_free')->default(false);
            $table->boolean('is_featured')->default(false);
            $table->enum('status', ['draft', 'pending', 'published', 'rejected'])->default('draft');
            $table->integer('plays_count')->default(0);
            $table->integer('downloads_count')->default(0);
            $table->integer('likes_count')->default(0);
            $table->json('tags')->nullable(); // Tags pour la recherche
            $table->string('bpm')->nullable(); // Beats per minute
            $table->string('key')->nullable(); // Tonalité musicale
            $table->text('credits')->nullable(); // Crédits (producteur, mixage, etc.)
            $table->timestamps();

            // Index pour les recherches
            $table->index(['status', 'is_featured']);
            $table->index(['category_id', 'status']);
            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sounds');
    }
};
