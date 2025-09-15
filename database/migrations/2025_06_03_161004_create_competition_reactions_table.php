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
        Schema::create('competition_reactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('competition_id')->constrained()->onDelete('cascade');
            $table->foreignId('participant_id')->constrained('competition_participants')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('reaction_type', ['hearts', 'likes', 'fire', 'clap', 'wow', 'sad'])->default('likes');
            $table->timestamp('reacted_at')->useCurrent();
            $table->timestamps();

            // Un utilisateur ne peut donner qu'une seule réaction par type et par participant
            $table->unique(['competition_id', 'participant_id', 'user_id', 'reaction_type'], 'unique_user_reaction');
            $table->index(['participant_id', 'reaction_type']);
            $table->index(['competition_id', 'reacted_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('competition_reactions');
    }
};
