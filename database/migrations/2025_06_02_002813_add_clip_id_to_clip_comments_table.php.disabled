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
        // Vérifier si les colonnes existent avant de les ajouter
        if (Schema::hasTable('clip_comments')) {
            Schema::table('clip_comments', function (Blueprint $table) {
                // Ajouter clip_id si elle n'existe pas
                if (!Schema::hasColumn('clip_comments', 'clip_id')) {
                    $table->foreignId('clip_id')->constrained()->onDelete('cascade');
                }

                // Ajouter user_id si elle n'existe pas
                if (!Schema::hasColumn('clip_comments', 'user_id')) {
                    $table->foreignId('user_id')->constrained()->onDelete('cascade');
                }

                // Ajouter content si elle n'existe pas
                if (!Schema::hasColumn('clip_comments', 'content')) {
                    $table->text('content');
                }

                // Ajouter parent_id si elle n'existe pas
                if (!Schema::hasColumn('clip_comments', 'parent_id')) {
                    $table->foreignId('parent_id')->nullable()->constrained('clip_comments')->onDelete('cascade');
                }

                // Ajouter is_active si elle n'existe pas
                if (!Schema::hasColumn('clip_comments', 'is_active')) {
                    $table->boolean('is_active')->default(true);
                }
            });

            // Ajouter les index après avoir ajouté les colonnes
            Schema::table('clip_comments', function (Blueprint $table) {
                try {
                    $table->index(['clip_id', 'is_active']);
                    $table->index(['user_id', 'is_active']);
                    $table->index(['parent_id']);
                } catch (\Exception $e) {
                    // Index peut déjà exister
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('clip_comments')) {
            Schema::table('clip_comments', function (Blueprint $table) {
                $table->dropIndex(['clip_id', 'is_active']);
                $table->dropIndex(['user_id', 'is_active']);
                $table->dropIndex(['parent_id']);

                if (Schema::hasColumn('clip_comments', 'clip_id')) {
                    $table->dropForeign(['clip_id']);
                    $table->dropColumn('clip_id');
                }

                if (Schema::hasColumn('clip_comments', 'user_id')) {
                    $table->dropForeign(['user_id']);
                    $table->dropColumn('user_id');
                }

                if (Schema::hasColumn('clip_comments', 'content')) {
                    $table->dropColumn('content');
                }

                if (Schema::hasColumn('clip_comments', 'parent_id')) {
                    $table->dropForeign(['parent_id']);
                    $table->dropColumn('parent_id');
                }

                if (Schema::hasColumn('clip_comments', 'is_active')) {
                    $table->dropColumn('is_active');
                }
            });
        }
    }
};
