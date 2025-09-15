<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Pour PostgreSQL, on doit d'abord supprimer la contrainte existante puis la recréer
        DB::statement("ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check");

        // Ajouter la nouvelle contrainte avec toutes les valeurs nécessaires
        DB::statement("ALTER TABLE events ADD CONSTRAINT events_status_check CHECK (status IN ('draft', 'published', 'cancelled', 'completed', 'pending', 'active'))");

        // Faire de même pour category si nécessaire
        DB::statement("ALTER TABLE events DROP CONSTRAINT IF EXISTS events_category_check");
        DB::statement("ALTER TABLE events ADD CONSTRAINT events_category_check CHECK (category IN ('concert', 'festival', 'showcase', 'workshop', 'conference', 'party', 'soiree'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remettre les contraintes originales
        DB::statement("ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check");
        DB::statement("ALTER TABLE events ADD CONSTRAINT events_status_check CHECK (status IN ('draft', 'published', 'cancelled', 'completed'))");

        DB::statement("ALTER TABLE events DROP CONSTRAINT IF EXISTS events_category_check");
        DB::statement("ALTER TABLE events ADD CONSTRAINT events_category_check CHECK (category IN ('concert', 'festival', 'showcase', 'workshop', 'conference', 'party'))");
    }
};
