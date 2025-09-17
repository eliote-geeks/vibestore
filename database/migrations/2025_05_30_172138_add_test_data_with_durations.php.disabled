<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Mettre à jour les durées existantes des sons (si elles sont à 0)
        DB::table('sounds')
            ->where('duration', 0)
            ->orWhereNull('duration')
            ->update([
                'duration' => DB::raw('FLOOR(RANDOM() * 240) + 60') // Durée aléatoire entre 1-4 minutes
            ]);

        // Ajouter des événements de test si aucun n'existe
        $eventsCount = DB::table('events')->count();

        if ($eventsCount === 0) {
            // Créer un utilisateur de test si nécessaire
            $testUser = DB::table('users')->where('email', 'admin@reveilartist.com')->first();
            if (!$testUser) {
                $testUserId = DB::table('users')->insertGetId([
                    'name' => 'Admin RéveilArtist',
                    'email' => 'admin@reveilartist.com',
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            } else {
                $testUserId = $testUser->id;
            }

            // Insérer des événements de test
            DB::table('events')->insert([
                [
                    'title' => 'RéveilArt Festival 2024',
                    'slug' => 'reveilart-festival-2024',
                    'description' => 'Le plus grand festival de musique urbaine du Cameroun. Une célébration de 3 jours avec les meilleurs artistes locaux et internationaux.',
                    'user_id' => $testUserId,
                    'venue' => 'Stade Ahmadou Ahidjo',
                    'location' => 'Stade Ahmadou Ahidjo',
                    'address' => 'Avenue du 20 Mai, Quartier Tsinga',
                    'city' => 'Yaoundé',
                    'country' => 'Cameroun',
                    'event_date' => '2024-06-15',
                    'start_time' => '18:00:00',
                    'end_time' => '23:59:00',
                    'category' => 'festival',
                    'status' => 'active',
                    'is_featured' => true,
                    'is_free' => false,
                    'price_min' => 15000,
                    'price_max' => 75000,
                    'capacity' => 15000,
                    'current_attendees' => 0,
                    'views_count' => 1250,
                    'artist' => 'Multi-artistes',
                    'artists' => json_encode(['DJ Cameroun', 'BeatMaster237', 'Makossa Revival', 'UrbanFlow']),
                    'tickets' => json_encode([
                        [
                            'type' => 'Pelouse',
                            'price' => 15000,
                            'description' => 'Accès pelouse, ambiance festive',
                            'available' => 8000
                        ],
                        [
                            'type' => 'Tribune Standard',
                            'price' => 35000,
                            'description' => 'Accès tribune couverte, vue panoramique',
                            'available' => 2000
                        ],
                        [
                            'type' => 'Tribune VIP',
                            'price' => 75000,
                            'description' => 'Accès tribune VIP, catering inclus, meet & greet',
                            'available' => 500
                        ]
                    ]),
                    'contact_email' => 'contact@reveilartist.com',
                    'contact_phone' => '+237 6 78 90 12 34',
                    'created_at' => now(),
                    'updated_at' => now()
                ],
                [
                    'title' => 'Hip-Hop Night Douala',
                    'slug' => 'hip-hop-night-douala',
                    'description' => 'Une soirée dédiée au Hip-Hop camerounais avec les artistes les plus talentueux de la scène urbaine.',
                    'user_id' => $testUserId,
                    'venue' => 'Centre Culturel Français',
                    'location' => 'Centre Culturel Français',
                    'address' => 'Avenue du Général de Gaulle',
                    'city' => 'Douala',
                    'country' => 'Cameroun',
                    'event_date' => '2024-05-25',
                    'start_time' => '20:00:00',
                    'end_time' => '02:00:00',
                    'category' => 'concert',
                    'status' => 'active',
                    'is_featured' => false,
                    'is_free' => false,
                    'price_min' => 8000,
                    'price_max' => 20000,
                    'capacity' => 500,
                    'current_attendees' => 0,
                    'views_count' => 890,
                    'artist' => 'BeatMaster237',
                    'artists' => json_encode(['BeatMaster237', 'UrbanFlow', 'RapCamer', 'FlowQueen']),
                    'tickets' => json_encode([
                        [
                            'type' => 'Entrée Standard',
                            'price' => 8000,
                            'description' => 'Accès à la salle principale',
                            'available' => 300
                        ],
                        [
                            'type' => 'VIP',
                            'price' => 20000,
                            'description' => 'Accès VIP avec boissons incluses',
                            'available' => 50
                        ]
                    ]),
                    'contact_email' => 'contact@reveilartist.com',
                    'contact_phone' => '+237 6 78 90 12 34',
                    'created_at' => now(),
                    'updated_at' => now()
                ],
                [
                    'title' => 'Makossa Revival',
                    'slug' => 'makossa-revival',
                    'description' => 'Célébration de la musique traditionnelle camerounaise avec les légendes du Makossa.',
                    'user_id' => $testUserId,
                    'venue' => 'Palais des Sports',
                    'location' => 'Palais des Sports',
                    'address' => 'Boulevard du 20 Mai',
                    'city' => 'Yaoundé',
                    'country' => 'Cameroun',
                    'event_date' => '2024-07-10',
                    'start_time' => '19:30:00',
                    'end_time' => '23:30:00',
                    'category' => 'festival',
                    'status' => 'published',
                    'is_featured' => true,
                    'is_free' => false,
                    'price_min' => 5000,
                    'price_max' => 25000,
                    'capacity' => 3000,
                    'current_attendees' => 0,
                    'views_count' => 567,
                    'artist' => 'Heritage Sound',
                    'artists' => json_encode(['Heritage Sound', 'Makossa Legend', 'Traditional Vibes']),
                    'tickets' => json_encode([
                        [
                            'type' => 'Pelouse',
                            'price' => 5000,
                            'description' => 'Accès pelouse',
                            'available' => 2000
                        ],
                        [
                            'type' => 'Tribune',
                            'price' => 12000,
                            'description' => 'Accès tribune couverte',
                            'available' => 800
                        ],
                        [
                            'type' => 'VIP',
                            'price' => 25000,
                            'description' => 'Accès VIP avec restauration',
                            'available' => 200
                        ]
                    ]),
                    'contact_email' => 'heritage@reveilartist.com',
                    'contact_phone' => '+237 6 78 90 12 35',
                    'created_at' => now(),
                    'updated_at' => now()
                ],
                [
                    'title' => 'Electronic Vibes Showcase',
                    'slug' => 'electronic-vibes-showcase',
                    'description' => 'Découverte des nouveaux talents de la musique électronique camerounaise.',
                    'user_id' => $testUserId,
                    'venue' => 'Club Paradise',
                    'location' => 'Club Paradise',
                    'address' => 'Quartier Bonapriso',
                    'city' => 'Douala',
                    'country' => 'Cameroun',
                    'event_date' => '2024-06-30',
                    'start_time' => '22:00:00',
                    'end_time' => '04:00:00',
                    'category' => 'soiree',
                    'status' => 'active',
                    'is_featured' => false,
                    'is_free' => false,
                    'ticket_price' => 10000,
                    'capacity' => 300,
                    'current_attendees' => 0,
                    'views_count' => 234,
                    'artist' => 'DJ TechCamer',
                    'artists' => json_encode(['DJ TechCamer', 'ElectroVibes', 'DigitalBeats']),
                    'tickets' => json_encode([
                        [
                            'type' => 'Entrée',
                            'price' => 10000,
                            'description' => 'Accès à la soirée',
                            'available' => 300
                        ]
                    ]),
                    'contact_email' => 'clubparadise@reveilartist.com',
                    'contact_phone' => '+237 6 78 90 12 36',
                    'created_at' => now(),
                    'updated_at' => now()
                ],
                [
                    'title' => 'Jazz & Blues Cameroun',
                    'slug' => 'jazz-blues-cameroun',
                    'description' => 'Une soirée dédiée au jazz et blues avec les meilleurs musiciens du Cameroun.',
                    'user_id' => $testUserId,
                    'venue' => 'Hôtel Hilton',
                    'location' => 'Hôtel Hilton Yaoundé',
                    'address' => 'Boulevard du 20 Mai',
                    'city' => 'Yaoundé',
                    'country' => 'Cameroun',
                    'event_date' => '2024-08-15',
                    'start_time' => '20:00:00',
                    'end_time' => '01:00:00',
                    'category' => 'concert',
                    'status' => 'published',
                    'is_featured' => false,
                    'is_free' => false,
                    'price_min' => 15000,
                    'price_max' => 40000,
                    'capacity' => 200,
                    'current_attendees' => 0,
                    'views_count' => 456,
                    'artist' => 'JazzCamer Ensemble',
                    'artists' => json_encode(['JazzCamer Ensemble', 'Blues Master', 'Smooth Vibes']),
                    'tickets' => json_encode([
                        [
                            'type' => 'Standard',
                            'price' => 15000,
                            'description' => 'Accès standard avec boisson de bienvenue',
                            'available' => 120
                        ],
                        [
                            'type' => 'Premium',
                            'price' => 25000,
                            'description' => 'Accès premium avec dîner inclus',
                            'available' => 60
                        ],
                        [
                            'type' => 'VIP',
                            'price' => 40000,
                            'description' => 'Table VIP avec service complet',
                            'available' => 20
                        ]
                    ]),
                    'contact_email' => 'jazz@reveilartist.com',
                    'contact_phone' => '+237 6 78 90 12 37',
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Optionnel : supprimer les données de test
        DB::table('events')->where('title', 'LIKE', '%RéveilArt%')->delete();
        DB::table('events')->where('title', 'LIKE', '%Hip-Hop Night%')->delete();
        DB::table('events')->where('title', 'LIKE', '%Makossa Revival%')->delete();
        DB::table('events')->where('title', 'LIKE', '%Electronic Vibes%')->delete();
        DB::table('events')->where('title', 'LIKE', '%Jazz & Blues%')->delete();
    }
};
