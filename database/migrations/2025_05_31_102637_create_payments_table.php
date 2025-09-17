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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Acheteur
            $table->foreignId('seller_id')->nullable()->constrained('users')->onDelete('set null'); // Vendeur (artiste/organisateur)

            // Type de paiement
            $table->enum('type', ['sound', 'event']); // Son ou événement
            $table->foreignId('sound_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('event_id')->nullable()->constrained()->onDelete('cascade');

            // Montants
            $table->decimal('amount', 10, 2); // Montant total payé
            $table->decimal('seller_amount', 10, 2); // Montant pour le vendeur (après commission)
            $table->decimal('commission_amount', 10, 2); // Montant de la commission
            $table->decimal('commission_rate', 5, 2); // Taux de commission (en %)

            // Informations de paiement
            $table->string('payment_method')->default('card'); // card, mobile_money, bank_transfer
            $table->string('payment_provider')->nullable(); // stripe, paypal, orange_money, mtn_money
            $table->string('transaction_id')->unique(); // ID de la transaction
            $table->string('external_payment_id')->nullable(); // ID du paiement externe (Stripe, etc.)

            // Statut
            $table->enum('status', ['pending', 'completed', 'failed', 'refunded', 'cancelled'])->default('pending');
            $table->text('failure_reason')->nullable();

            // Métadonnées
            $table->json('metadata')->nullable(); // Informations supplémentaires du paiement
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('refunded_at')->nullable();

            $table->timestamps();

            // Index pour optimiser les requêtes
            $table->index(['user_id', 'type']);
            $table->index(['seller_id', 'status']);
            $table->index(['type', 'status']);
            $table->index('transaction_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
