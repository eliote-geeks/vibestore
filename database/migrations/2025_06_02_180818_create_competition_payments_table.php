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
        Schema::create('competition_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Participant
            $table->foreignId('competition_id')->constrained()->onDelete('cascade'); // Compétition
            $table->foreignId('organizer_id')->constrained('users')->onDelete('cascade'); // Organisateur

            // Montants
            $table->decimal('amount', 10, 2); // Frais d'inscription
            $table->decimal('organizer_amount', 10, 2); // Montant pour l'organisateur (après commission)
            $table->decimal('commission_amount', 10, 2); // Montant de la commission
            $table->decimal('commission_rate', 5, 2); // Taux de commission (en %)

            // Informations de paiement
            $table->string('payment_method')->default('card'); // card, mobile_money, bank_transfer
            $table->string('payment_provider')->nullable(); // stripe, paypal, orange_money, mtn_money
            $table->string('transaction_id')->unique(); // ID de la transaction
            $table->string('external_payment_id')->nullable(); // ID du paiement externe

            // Statut
            $table->enum('status', ['pending', 'completed', 'failed', 'refunded', 'cancelled'])->default('pending');
            $table->text('failure_reason')->nullable();
            $table->string('currency', 3)->default('XAF'); // Devise

            // Métadonnées
            $table->json('metadata')->nullable(); // Informations supplémentaires du paiement
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('refunded_at')->nullable();

            $table->timestamps();

            // Index pour optimiser les requêtes
            $table->index(['user_id', 'competition_id']);
            $table->index(['organizer_id', 'status']);
            $table->index(['competition_id', 'status']);
            $table->index('transaction_id');

            // Contrainte unique pour éviter les doublons de paiement
            $table->unique(['user_id', 'competition_id'], 'unique_user_competition_payment');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('competition_payments');
    }
};
