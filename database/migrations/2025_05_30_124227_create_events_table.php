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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Organisateur
            $table->string('venue')->nullable(); // Lieu de l'événement
            $table->string('location'); // Nom du lieu
            $table->string('address')->nullable(); // Adresse complète
            $table->string('city');
            $table->string('country')->default('Cameroun');
            $table->date('event_date');
            $table->time('start_time');
            $table->time('end_time')->nullable();
            $table->string('poster_image')->nullable(); // Affiche de l'événement
            $table->string('featured_image')->nullable(); // Image principale
            $table->json('gallery_images')->nullable(); // Galerie d'images
            $table->enum('category', ['concert', 'festival', 'showcase', 'workshop', 'conference', 'party', 'soiree']);
            $table->enum('status', ['draft', 'published', 'cancelled', 'completed', 'pending', 'active'])->default('pending');
            $table->boolean('is_featured')->default(false);
            $table->boolean('featured')->default(false);
            $table->boolean('is_free')->default(false);
            $table->decimal('ticket_price', 10, 2)->nullable(); // Prix du billet
            $table->decimal('price_min', 10, 2)->nullable(); // Prix minimum
            $table->decimal('price_max', 10, 2)->nullable(); // Prix maximum
            $table->integer('max_attendees')->nullable(); // Capacité maximale
            $table->integer('capacity')->nullable(); // Capacité
            $table->integer('current_attendees')->default(0);
            $table->integer('views_count')->default(0);
            $table->string('artist')->nullable(); // Artiste principal
            $table->json('artists')->nullable(); // Liste des artistes participants
            $table->json('tickets')->nullable(); // Types de billets
            $table->json('sponsors')->nullable(); // Sponsors de l'événement
            $table->text('requirements')->nullable(); // Exigences (âge, dress code, etc.)
            $table->string('contact_phone')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('website_url')->nullable();
            $table->string('facebook_url')->nullable();
            $table->string('instagram_url')->nullable();
            $table->string('twitter_url')->nullable();
            $table->json('social_links')->nullable(); // Liens réseaux sociaux
            $table->softDeletes(); // Pour la suppression douce
            $table->timestamps();

            // Index pour les recherches
            $table->index(['status', 'event_date']);
            $table->index(['city', 'status']);
            $table->index(['category', 'status']);
            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
