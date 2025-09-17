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
        Schema::create('competition_chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('competition_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->text('message');
            $table->enum('type', ['text', 'system', 'emoji'])->default('text');
            $table->json('metadata')->nullable(); // Pour des données additionnelles (mentions, liens, etc.)
            $table->boolean('is_visible')->default(true);
            $table->timestamp('edited_at')->nullable();
            $table->timestamps();

            $table->index(['competition_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('competition_chat_messages');
    }
};
