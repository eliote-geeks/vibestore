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
        // Supprimer les anciens événements de test
        DB::table('events')->truncate();

        // Ajouter des événements de test complets
        $events = [
            [
                'title' => 'RéveilArt Festival 2024',
                'slug' => 'reveilart-festival-2024',
                'description' => 'Le plus grand festival de musique camerounaise de l\'année ! Venez découvrir les talents émergents et confirmés de la scène musicale camerounaise.',
                'user_id' => 1,
                'venue' => 'Stade Ahmadou Ahidjo',
                'address' => 'Boulevard du 20 Mai, Yaoundé',
                'city' => 'Yaoundé',
                'country' => 'Cameroun',
                'event_date' => '2024-06-15',
                'start_time' => '18:00',
                'end_time' => '23:30',
                'category' => 'festival',
                'status' => 'published',
                'is_featured' => true,
                'is_free' => false,
                'ticket_price' => 15000.00,
                'max_attendees' => 2000,
                'current_attendees' => 1250,
                'artists' => json_encode(['Locko', 'Charlotte Dipanda', 'Tenor', 'Daphné']),
                'sponsors' => json_encode(['MTN Cameroun', 'Orange Cameroun', 'ENEO']),
                'contact_phone' => '+237 677 123 456',
                'contact_email' => 'contact@reveilart.cm',
                'website_url' => 'https://reveilart.cm',
                'revenue' => 18750000.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'title' => 'Hip-Hop Night Douala',
                'slug' => 'hip-hop-night-douala',
                'description' => 'Une soirée dédiée au hip-hop camerounais avec les meilleurs rappeurs du moment.',
                'user_id' => 1,
                'venue' => 'Centre Culturel Français',
                'address' => 'Rue Joss, Bonanjo',
                'city' => 'Douala',
                'country' => 'Cameroun',
                'event_date' => '2024-05-20',
                'start_time' => '20:00',
                'end_time' => '02:00',
                'category' => 'concert',
                'status' => 'published',
                'is_featured' => false,
                'is_free' => false,
                'ticket_price' => 8500.00,
                'max_attendees' => 800,
                'current_attendees' => 680,
                'artists' => json_encode(['Franko', 'Jovi', 'Pit Baccardi', 'Nabila']),
                'sponsors' => json_encode(['Guinness Cameroun', 'Castel Beer']),
                'contact_phone' => '+237 699 987 654',
                'contact_email' => 'events@hiphop237.cm',
                'revenue' => 5780000.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'title' => 'Makossa Revival',
                'slug' => 'makossa-revival',
                'description' => 'Retour aux sources avec les légendes du Makossa et les nouveaux talents.',
                'user_id' => 1,
                'venue' => 'Palais des Sports',
                'address' => 'Quartier Tsinga, Yaoundé',
                'city' => 'Yaoundé',
                'country' => 'Cameroun',
                'event_date' => '2024-07-10',
                'start_time' => '19:00',
                'end_time' => '23:00',
                'category' => 'concert',
                'status' => 'published',
                'is_featured' => true,
                'is_free' => false,
                'ticket_price' => 12000.00,
                'max_attendees' => 1500,
                'current_attendees' => 156,
                'artists' => json_encode(['Manu Dibango Legacy', 'Grace Decca', 'Petit Pays']),
                'sponsors' => json_encode(['CAMTEL', 'Société Générale Cameroun']),
                'contact_phone' => '+237 655 444 333',
                'contact_email' => 'makossa@revival.cm',
                'revenue' => 1872000.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'title' => 'Electronic Vibes Showcase',
                'slug' => 'electronic-vibes-showcase',
                'description' => 'Découvrez la scène électronique camerounaise émergente.',
                'user_id' => 1,
                'venue' => 'Club Paradise',
                'address' => 'Rue de la Joie, Bonapriso',
                'city' => 'Douala',
                'country' => 'Cameroun',
                'event_date' => '2024-08-05',
                'start_time' => '21:00',
                'end_time' => '04:00',
                'category' => 'showcase',
                'status' => 'published',
                'is_featured' => false,
                'is_free' => false,
                'ticket_price' => 6000.00,
                'max_attendees' => 400,
                'current_attendees' => 89,
                'artists' => json_encode(['DJ Arafat CM', 'Electronic Pulse', 'Beat Makers 237']),
                'sponsors' => json_encode(['Red Bull Cameroun']),
                'contact_phone' => '+237 677 555 888',
                'contact_email' => 'electronic@vibes.cm',
                'revenue' => 534000.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'title' => 'Jazz & Blues Cameroun',
                'slug' => 'jazz-blues-cameroun',
                'description' => 'Une soirée intimiste avec les meilleurs musiciens de jazz et blues du Cameroun.',
                'user_id' => 1,
                'venue' => 'Hôtel Hilton',
                'address' => 'Boulevard du 20 Mai, Yaoundé',
                'city' => 'Yaoundé',
                'country' => 'Cameroun',
                'event_date' => '2024-09-12',
                'start_time' => '19:30',
                'end_time' => '22:30',
                'category' => 'concert',
                'status' => 'published',
                'is_featured' => false,
                'is_free' => false,
                'ticket_price' => 25000.00,
                'max_attendees' => 200,
                'current_attendees' => 145,
                'artists' => json_encode(['Moise Mbiye', 'Jazz Cameroun Ensemble']),
                'sponsors' => json_encode(['Hilton Hotels', 'Alliance Française']),
                'contact_phone' => '+237 699 111 222',
                'contact_email' => 'jazz@blues.cm',
                'revenue' => 3625000.00,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ];

        foreach ($events as $event) {
            DB::table('events')->insert($event);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('events')->truncate();
    }
};
