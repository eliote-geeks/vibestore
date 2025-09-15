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
        Schema::create('competition_votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('competition_id')->constrained()->onDelete('cascade');
            $table->foreignId('participant_id')->constrained('competition_participants')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('vote_type', ['up', 'down'])->default('up');
            $table->integer('score')->default(1); // 1 pour up, -1 pour down
            $table->text('comment')->nullable();
            $table->timestamp('voted_at')->useCurrent();
            $table->timestamps();

            // Un utilisateur ne peut voter qu'une seule fois par participant
            $table->unique(['competition_id', 'participant_id', 'user_id'], 'unique_user_vote');
            $table->index(['participant_id', 'vote_type']);
            $table->index(['competition_id', 'voted_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('competition_votes');
    }
};
