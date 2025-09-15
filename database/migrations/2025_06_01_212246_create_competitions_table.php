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
        Schema::create('competitions', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->string('category');
            $table->decimal('entry_fee', 10, 2);
            $table->integer('max_participants');
            $table->date('start_date');
            $table->time('start_time');
            $table->integer('duration'); // en minutes
            $table->json('rules');
            $table->json('prizes'); // répartition des prix en pourcentages
            $table->json('judging_criteria'); // critères de jugement avec poids
            $table->string('image_path')->nullable();
            $table->enum('status', ['draft', 'published', 'active', 'completed', 'cancelled'])->default('draft');
            $table->integer('current_participants')->default(0);
            $table->boolean('is_active')->default(true);
            $table->decimal('total_prize_pool', 12, 2)->default(0);
            $table->timestamp('registration_deadline')->nullable();

            // Relation avec l'utilisateur (organisateur)
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Timestamps
            $table->timestamps();

            // Index pour les recherches
            $table->index(['category', 'is_active']);
            $table->index(['status', 'is_active']);
            $table->index(['start_date', 'is_active']);
            $table->index(['user_id', 'is_active']);
            $table->fullText(['title', 'description']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('competitions');
    }
};
