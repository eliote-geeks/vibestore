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
        Schema::create('competition_performances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('competition_id')->constrained()->onDelete('cascade');
            $table->foreignId('participant_id')->constrained('competition_participants')->onDelete('cascade');
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->string('audio_file_path')->nullable();
            $table->string('audio_file_name')->nullable();
            $table->integer('duration_seconds')->default(0);
            $table->integer('file_size_kb')->default(0);
            $table->enum('status', ['pending', 'approved', 'rejected', 'playing'])->default('pending');
            $table->integer('play_order')->nullable();
            $table->timestamp('recorded_at')->useCurrent();
            $table->timestamp('played_at')->nullable();
            $table->json('metadata')->nullable(); // Format, qualité, etc.
            $table->timestamps();

            $table->index(['competition_id', 'status']);
            $table->index(['participant_id', 'recorded_at']);
            $table->index(['status', 'play_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('competition_performances');
    }
};
