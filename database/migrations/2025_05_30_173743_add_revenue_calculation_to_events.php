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
        // Ajouter la colonne revenue si elle n'existe pas
        if (!Schema::hasColumn('events', 'revenue')) {
            Schema::table('events', function (Blueprint $table) {
                $table->decimal('revenue', 12, 2)->default(0)->after('views_count');
            });
        }

        // Vérifier si la table events a des données
        $eventsCount = DB::table('events')->count();

        if ($eventsCount === 0) {
            // Aucun événement trouvé, rien à faire
            return;
        }

        // Mettre à jour quelques événements avec des données de revenus estimés
        // basés sur les billets vendus simulés
        $events = DB::table('events')->get();

        foreach ($events as $event) {
            $tickets = null;

            // Vérifier si la colonne tickets existe et a des données
            if (property_exists($event, 'tickets') && $event->tickets) {
                $tickets = json_decode($event->tickets, true);
            }

            $estimatedRevenue = 0;
            $totalAttendees = 0;

            if ($tickets && is_array($tickets)) {
                foreach ($tickets as $ticket) {
                    // Simuler des ventes : entre 10% et 80% des places disponibles
                    $soldPercentage = rand(10, 80) / 100;
                    $ticketsSold = (int) floor(($ticket['available'] ?? 0) * $soldPercentage);
                    $estimatedRevenue += $ticketsSold * ($ticket['price'] ?? 0);
                    $totalAttendees += $ticketsSold;
                }
            } else {
                // Si pas de tickets définis, utiliser des données par défaut
                $totalAttendees = rand(50, min(500, ($event->capacity ?? 1000) * 0.8));
                if (!$event->is_free && $event->ticket_price) {
                    $estimatedRevenue = $totalAttendees * $event->ticket_price;
                }
            }

            // Mettre à jour l'événement avec des données simulées
            DB::table('events')
                ->where('id', $event->id)
                ->update([
                    'current_attendees' => $totalAttendees,
                    'revenue' => $estimatedRevenue
                ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reset revenue and attendance data
        DB::table('events')->update([
            'current_attendees' => 0,
            'revenue' => 0
        ]);
    }
};
