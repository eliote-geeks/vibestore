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
        Schema::table('sounds', function (Blueprint $table) {
            // Informations de licence
            $table->string('license_type')->default('royalty_free')->after('credits');
            $table->string('copyright_owner')->nullable()->after('license_type');
            $table->string('composer')->nullable()->after('copyright_owner');
            $table->string('performer')->nullable()->after('composer');
            $table->string('producer')->nullable()->after('performer');
            $table->date('release_date')->nullable()->after('producer');
            $table->string('isrc_code', 30)->nullable()->after('release_date');
            $table->text('publishing_rights')->nullable()->after('isrc_code');

            // Droits d'utilisation
            $table->json('usage_rights')->nullable()->after('publishing_rights');
            $table->boolean('commercial_use')->default(true)->after('usage_rights');
            $table->boolean('attribution_required')->default(false)->after('commercial_use');
            $table->boolean('modifications_allowed')->default(true)->after('attribution_required');
            $table->boolean('distribution_allowed')->default(true)->after('modifications_allowed');

            // Durée et territoire
            $table->string('license_duration')->default('perpetual')->after('distribution_allowed');
            $table->string('territory')->default('worldwide')->after('license_duration');
            $table->text('rights_statement')->nullable()->after('territory');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sounds', function (Blueprint $table) {
            $table->dropColumn([
                'license_type',
                'copyright_owner',
                'composer',
                'performer',
                'producer',
                'release_date',
                'isrc_code',
                'publishing_rights',
                'usage_rights',
                'commercial_use',
                'attribution_required',
                'modifications_allowed',
                'distribution_allowed',
                'license_duration',
                'territory',
                'rights_statement'
            ]);
        });
    }
};
