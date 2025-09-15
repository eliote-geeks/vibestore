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
        Schema::create('clip_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clip_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->text('content');
            $table->foreignId('parent_id')->nullable()->constrained('clip_comments')->onDelete('cascade');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Index pour les performances
            $table->index(['clip_id', 'is_active']);
            $table->index(['user_id', 'is_active']);
            $table->index(['parent_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clip_comments');
    }
};
