<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Clip;
use App\Models\User;

class ClipSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        // Récupérer quelques utilisateurs artistes ou créer un utilisateur test
        $artists = User::where('role', 'artist')->get();

        if ($artists->isEmpty()) {
            // Créer un utilisateur artiste test
            $artist = User::create([
                'name' => 'Artiste Test',
                'email' => 'artiste@test.com',
                'password' => bcrypt('password'),
                'role' => 'artist',
                'status' => 'active',
            ]);
            $artists = collect([$artist]);
        }

        $clips = [
            [
                'title' => 'Afrobeat Vibes',
                'description' => 'Un clip vibrant qui capture l\'essence de l\'Afrobeat moderne avec des rythmes entraînants et des visuels colorés.',
                'category' => 'Afrobeat',
                'tags' => ['afrobeat', 'cameroun', 'danse', 'moderne'],
                'video_path' => 'clips/videos/afrobeat-vibes.mp4',
                'thumbnail_path' => 'clips/thumbnails/afrobeat-vibes.jpg',
                'duration' => '3:45',
                'views' => 125000,
                'likes' => 8500,
                'comments_count' => 342,
                'shares' => 1200,
                'featured' => true,
                'credits' => [
                    'director' => 'Jean-Paul Mbarga',
                    'producer' => 'Afro Productions',
                    'cinematographer' => 'Marie Nkomo',
                    'editor' => 'Paul Essomba'
                ],
            ],
            [
                'title' => 'Rap Camerounais',
                'description' => 'Un clip de rap puissant qui raconte l\'histoire de la jeunesse camerounaise avec des paroles percutantes.',
                'category' => 'Rap',
                'tags' => ['rap', 'cameroun', 'jeunesse', 'social'],
                'video_path' => 'clips/videos/rap-camerounais.mp4',
                'thumbnail_path' => 'clips/thumbnails/rap-camerounais.jpg',
                'duration' => '4:12',
                'views' => 89000,
                'likes' => 6200,
                'comments_count' => 189,
                'shares' => 890,
                'featured' => true,
                'credits' => [
                    'director' => 'Samuel Fotso',
                    'producer' => 'Urban Beats',
                    'editor' => 'Grace Mballa'
                ],
            ],
            [
                'title' => 'Makossa Traditionnel',
                'description' => 'Un hommage au Makossa traditionnel avec des instruments authentiques et une chorégraphie traditionnelle.',
                'category' => 'Makossa',
                'tags' => ['makossa', 'traditionnel', 'culture', 'heritage'],
                'video_path' => 'clips/videos/makossa-traditionnel.mp4',
                'thumbnail_path' => 'clips/thumbnails/makossa-traditionnel.jpg',
                'duration' => '5:20',
                'views' => 67000,
                'likes' => 4800,
                'comments_count' => 156,
                'shares' => 620,
                'featured' => false,
                'credits' => [
                    'director' => 'Mama Nguea',
                    'producer' => 'Heritage Music',
                    'cinematographer' => 'Pierre Atangana'
                ],
            ],
            [
                'title' => 'Gospel Moderne',
                'description' => 'Un clip gospel inspirant qui mélange les sonorités modernes avec le message spirituel traditionnel.',
                'category' => 'Gospel',
                'tags' => ['gospel', 'spirituel', 'moderne', 'inspiration'],
                'video_path' => 'clips/videos/gospel-moderne.mp4',
                'thumbnail_path' => 'clips/thumbnails/gospel-moderne.jpg',
                'duration' => '4:35',
                'views' => 156000,
                'likes' => 12000,
                'comments_count' => 567,
                'shares' => 2100,
                'featured' => true,
                'credits' => [
                    'director' => 'Pastor Emmanuel',
                    'producer' => 'Divine Music',
                    'cinematographer' => 'Ruth Mbongo',
                    'editor' => 'David Tchoumi'
                ],
            ],
            [
                'title' => 'Zouk Passion',
                'description' => 'Un clip zouk romantique tourné dans les plus beaux paysages du Cameroun, célébrant l\'amour et la passion.',
                'category' => 'Zouk',
                'tags' => ['zouk', 'romantique', 'amour', 'paysages'],
                'video_path' => 'clips/videos/zouk-passion.mp4',
                'thumbnail_path' => 'clips/thumbnails/zouk-passion.jpg',
                'duration' => '3:58',
                'views' => 43000,
                'likes' => 3200,
                'comments_count' => 98,
                'shares' => 450,
                'featured' => false,
                'credits' => [
                    'director' => 'Romantic Visuals',
                    'producer' => 'Love Songs Prod'
                ],
            ],
        ];

        foreach ($clips as $clipData) {
            $clip = Clip::create([
                'title' => $clipData['title'],
                'description' => $clipData['description'],
                'category' => $clipData['category'],
                'tags' => $clipData['tags'],
                'video_path' => $clipData['video_path'],
                'thumbnail_path' => $clipData['thumbnail_path'],
                'duration' => $clipData['duration'],
                'views' => $clipData['views'],
                'likes' => $clipData['likes'],
                'comments_count' => $clipData['comments_count'],
                'shares' => $clipData['shares'],
                'featured' => $clipData['featured'],
                'credits' => $clipData['credits'],
                'user_id' => $artists->random()->id,
            ]);

            $this->command->info("Clip créé: {$clip->title}");
        }

        $this->command->info('Clips de test créés avec succès !');
    }
}
