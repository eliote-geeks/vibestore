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
        Schema::create('sound_certifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sound_id')->constrained()->onDelete('cascade');
            $table->enum('certification_type', ['bronze', 'silver', 'gold', 'platinum', 'diamond']);
            $table->integer('threshold_reached');
            $table->integer('metric_value'); // Valeur atteinte (ventes/téléchargements)
            $table->string('certificate_number')->unique();
            $table->timestamp('achieved_at');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['sound_id', 'certification_type']);
            $table->index('achieved_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sound_certifications');
    }
};
