<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class ArtistSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $artists = [
            [
                'name' => 'UrbanSonic',
                'email' => 'urbansonic@reveilart4artist.com',
                'password' => Hash::make('password123'),
                'role' => 'artist',
                'bio' => 'Producteur camerounais passionné par la création de beats urbains authentiques. Spécialisé dans le hip-hop et les sonorités afro-urbaines, je puise mon inspiration dans les rues de Douala pour créer des ambiances uniques qui capturent l\'essence de la vie urbaine camerounaise.',
                'city' => 'Douala',
                'genre' => 'Hip-Hop',
                'phone' => '+237 650 123 456',
                'status' => 'active',
                'verified' => true,
                'created_at' => now()->subMonths(8),
                'updated_at' => now()
            ],
            [
                'name' => 'CamerSounds',
                'email' => 'camersounds@reveilart4artist.com',
                'password' => Hash::make('password123'),
                'role' => 'producer',
                'bio' => 'Artiste multi-genres, créateur d\'ambiances authentiques. Ma musique mélange les rythmes traditionnels camerounais avec les sonorités modernes pour créer un style unique qui traverse les frontières.',
                'city' => 'Yaoundé',
                'genre' => 'Afrobeat',
                'phone' => '+237 670 234 567',
                'status' => 'active',
                'verified' => true,
                'created_at' => now()->subMonths(12),
                'updated_at' => now()
            ],
            [
                'name' => 'NightLife237',
                'email' => 'nightlife237@reveilart4artist.com',
                'password' => Hash::make('password123'),
                'role' => 'artist',
                'bio' => 'DJ producteur spécialisé en électro et house music. Depuis 5 ans, j\'anime les plus grandes soirées de Douala et je produis des tracks qui font danser toute l\'Afrique centrale.',
                'city' => 'Douala',
                'genre' => 'Électro',
                'phone' => '+237 680 345 678',
                'status' => 'active',
                'verified' => false,
                'created_at' => now()->subMonths(6),
                'updated_at' => now()
            ],
            [
                'name' => 'FlowMaster CM',
                'email' => 'flowmaster@reveilart4artist.com',
                'password' => Hash::make('password123'),
                'role' => 'artist',
                'bio' => 'Rappeur et producteur, pionnier du drill camerounais. Mes textes reflètent la réalité de la jeunesse camerounaise avec un flow unique et des beats percutants qui marquent les esprits.',
                'city' => 'Bafoussam',
                'genre' => 'Rap/Drill',
                'phone' => '+237 690 456 789',
                'status' => 'active',
                'verified' => true,
                'created_at' => now()->subMonths(4),
                'updated_at' => now()
            ],
            [
                'name' => 'SoulRhythm',
                'email' => 'soulrhythm@reveilart4artist.com',
                'password' => Hash::make('password123'),
                'role' => 'artist',
                'bio' => 'Artiste R&B avec une touche moderne africaine. Ma voix soul et mes mélodies envoûtantes racontent l\'histoire de l\'amour et de la vie en Afrique avec une sensibilité contemporaine.',
                'city' => 'Limbé',
                'genre' => 'R&B/Soul',
                'phone' => '+237 655 567 890',
                'status' => 'active',
                'verified' => true,
                'created_at' => now()->subMonths(10),
                'updated_at' => now()
            ],
            [
                'name' => 'AmbientMaster',
                'email' => 'ambientmaster@reveilart4artist.com',
                'password' => Hash::make('password123'),
                'role' => 'producer',
                'bio' => 'Créateur d\'atmosphères sonores et d\'ambiances urbaines. Je compose des paysages musicaux qui transportent l\'auditeur dans un voyage émotionnel à travers les sons du Cameroun moderne.',
                'city' => 'Garoua',
                'genre' => 'Ambient/Experimental',
                'phone' => '+237 665 678 901',
                'status' => 'active',
                'verified' => false,
                'created_at' => now()->subMonths(7),
                'updated_at' => now()
            ],
            [
                'name' => 'Makossa Queen',
                'email' => 'makossaqueen@reveilart4artist.com',
                'password' => Hash::make('password123'),
                'role' => 'artist',
                'bio' => 'Chanteuse et compositrice spécialisée dans la modernisation du makossa. Je perpétue la tradition musicale camerounaise tout en l\'adaptant aux goûts contemporains.',
                'city' => 'Douala',
                'genre' => 'Makossa/Traditional',
                'phone' => '+237 675 789 012',
                'status' => 'active',
                'verified' => true,
                'created_at' => now()->subMonths(15),
                'updated_at' => now()
            ],
            [
                'name' => 'BeatCrafters',
                'email' => 'beatcrafters@reveilart4artist.com',
                'password' => Hash::make('password123'),
                'role' => 'producer',
                'bio' => 'Duo de producteurs spécialisés dans les beats trap et afrotrap. Nous créons des instrumentales sur mesure pour les artistes émergents et confirmés du Cameroun et d\'ailleurs.',
                'city' => 'Yaoundé',
                'genre' => 'Trap/Afrotrap',
                'phone' => '+237 685 890 123',
                'status' => 'active',
                'verified' => false,
                'created_at' => now()->subMonths(3),
                'updated_at' => now()
            ]
        ];

        foreach ($artists as $artistData) {
            User::create($artistData);
        }

        // Créer quelques relations de follow
        $users = User::whereIn('role', ['artist', 'producer'])->get();

        if ($users->count() >= 4) {
            // UrbanSonic suit CamerSounds et SoulRhythm
            $users[0]->following()->attach([$users[1]->id, $users[4]->id]);

            // CamerSounds suit FlowMaster et NightLife237
            $users[1]->following()->attach([$users[3]->id, $users[2]->id]);

            // FlowMaster suit UrbanSonic et Makossa Queen
            $users[3]->following()->attach([$users[0]->id, $users[6]->id]);

            // SoulRhythm suit tout le monde (artiste populaire)
            $followIds = $users->where('id', '!=', $users[4]->id)->pluck('id')->toArray();
            $users[4]->following()->attach($followIds);
        }
    }
}
