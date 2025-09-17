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
        Schema::create('commission_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // Ex: 'sound_commission', 'event_commission'
            $table->decimal('value', 5, 2); // Pourcentage de commission (ex: 15.50)
            $table->string('description')->nullable(); // Description du paramètre
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Insérer les valeurs par défaut
        DB::table('commission_settings')->insert([
            [
                'key' => 'sound_commission',
                'value' => 15.00,
                'description' => 'Commission sur les ventes de sons (%)',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'event_commission',
                'value' => 10.00,
                'description' => 'Commission sur les ventes de billets d\'événements (%)',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('commission_settings');
    }
};
