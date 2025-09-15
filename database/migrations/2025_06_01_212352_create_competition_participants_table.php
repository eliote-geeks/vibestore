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
        Schema::create('competition_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('competition_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('status', ['registered', 'confirmed', 'disqualified', 'winner'])->default('registered');
            $table->decimal('entry_fee_paid', 10, 2)->default(0);
            $table->string('payment_status')->default('pending'); // pending, paid, refunded
            $table->string('performance_file')->nullable(); // fichier de performance uploadé
            $table->json('scores')->nullable(); // scores par critère
            $table->decimal('total_score', 5, 2)->nullable();
            $table->integer('position')->nullable(); // position finale dans la compétition
            $table->timestamps();

            // Contrainte unique pour éviter les doublons
            $table->unique(['competition_id', 'user_id']);

            // Index pour les performances
            $table->index(['competition_id', 'status']);
            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('competition_participants');
    }
};
