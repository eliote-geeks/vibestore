<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Sound;
use App\Models\User;
use App\Models\Category;

class SoundSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Créer quelques utilisateurs de test s'ils n'existent pas
        $users = User::all();
        if ($users->count() === 0) {
            $users = collect([
                User::create([
                    'name' => 'DJ Cameroun',
                    'email' => 'dj@cameroun.cm',
                    'password' => bcrypt('password'),
                    'email_verified_at' => now(),
                ]),
                User::create([
                    'name' => 'UrbanSonic',
                    'email' => 'urban@sonic.cm',
                    'password' => bcrypt('password'),
                    'email_verified_at' => now(),
                ]),
                User::create([
                    'name' => 'BeatMaker237',
                    'email' => 'beat@maker237.cm',
                    'password' => bcrypt('password'),
                    'email_verified_at' => now(),
                ])
            ]);
        }

        // Créer quelques catégories de test si elles n'existent pas
        $categories = Category::all();
        if ($categories->count() === 0) {
            $categories = collect([
                Category::create(['name' => 'Afrobeat', 'description' => 'Musique afrobeat moderne']),
                Category::create(['name' => 'Makossa', 'description' => 'Musique traditionnelle camerounaise']),
                Category::create(['name' => 'Coupé-Décalé', 'description' => 'Musique ivoirienne populaire']),
                Category::create(['name' => 'Ndombolo', 'description' => 'Musique congolaise']),
                Category::create(['name' => 'Bikutsi', 'description' => 'Musique traditionnelle du Cameroun']),
            ]);
        }

        // Récupérer toutes les catégories existantes
        $allCategories = Category::all();

        // Données de test pour les sons
        $soundsData = [
            [
                'title' => 'Beat Afro Moderne',
                'description' => 'Un beat afrobeat moderne avec des influences contemporaines. Parfait pour des projets musicaux dynamiques.',
                'price' => 2500,
                'is_free' => false,
                'category' => 'Afrobeat',
                'genre' => 'Afrobeat',
                'duration' => 204, // En secondes (3:24)
                'cover_image' => 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
                'is_featured' => true,
                'status' => 'published'
            ],
            [
                'title' => 'Makossa Fusion',
                'description' => 'Fusion moderne du makossa traditionnel avec des éléments électroniques.',
                'price' => 3500,
                'is_free' => false,
                'category' => 'Makossa',
                'genre' => 'World Music',
                'duration' => 252, // En secondes (4:12)
                'cover_image' => 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop',
                'is_featured' => false,
                'status' => 'published'
            ],
            [
                'title' => 'Coupé-Décalé Beat',
                'description' => 'Beat énergique de coupé-décalé pour faire danser. Gratuit pour tous !',
                'price' => 0,
                'is_free' => true,
                'category' => 'Coupé-Décalé',
                'genre' => 'Coupé-Décalé',
                'duration' => 225, // En secondes (3:45)
                'cover_image' => 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
                'is_featured' => true,
                'status' => 'published'
            ],
            [
                'title' => 'Ndombolo Modern',
                'description' => 'Version moderne du ndombolo avec des arrangements contemporains.',
                'price' => 2000,
                'is_free' => false,
                'category' => 'Ndombolo',
                'genre' => 'Ndombolo',
                'duration' => 236, // En secondes (3:56)
                'cover_image' => 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
                'is_featured' => false,
                'status' => 'published'
            ],
            [
                'title' => 'Bikutsi Électro',
                'description' => 'Fusion électronique du bikutsi traditionnel camerounais.',
                'price' => 3000,
                'is_free' => false,
                'category' => 'Bikutsi',
                'genre' => 'Electronic',
                'duration' => 270, // En secondes (4:30)
                'cover_image' => 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
                'is_featured' => false,
                'status' => 'published'
            ],
            [
                'title' => 'Ambiance Douala',
                'description' => 'Ambiance sonore de la ville de Douala. Son gratuit pour tous les créateurs.',
                'price' => 0,
                'is_free' => true,
                'category' => 'Afrobeat',
                'genre' => 'Ambient',
                'duration' => 315, // En secondes (5:15)
                'cover_image' => 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop',
                'is_featured' => true,
                'status' => 'published'
            ]
        ];

        foreach ($soundsData as $index => $soundData) {
            $user = $users->get($index % $users->count());

            // Rechercher la catégorie ou utiliser la première disponible
            $category = $allCategories->where('name', $soundData['category'])->first();
            if (!$category) {
                $category = $allCategories->first();
            }

            // Vérifier si le son existe déjà pour éviter les doublons
            $existingSound = Sound::where('title', $soundData['title'])->first();
            if ($existingSound) {
                $this->command->info("Son '{$soundData['title']}' existe déjà, ignoré.");
                continue;
            }

            try {
                Sound::create([
                    'title' => $soundData['title'],
                    'description' => $soundData['description'],
                    'user_id' => $user->id,
                    'category_id' => $category->id,
                    'price' => $soundData['price'],
                    'is_free' => $soundData['is_free'],
                    'genre' => $soundData['genre'],
                    'duration' => $soundData['duration'],
                    'cover_image' => $soundData['cover_image'],
                    'file_path' => 'sounds/demo.mp3', // Chemin vers un fichier de démo
                    'is_featured' => $soundData['is_featured'],
                    'status' => $soundData['status'],
                    'plays_count' => rand(50, 1000),
                    'downloads_count' => rand(5, 100),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $this->command->info("Son '{$soundData['title']}' créé avec succès.");
            } catch (\Exception $e) {
                $this->command->error("Erreur lors de la création du son '{$soundData['title']}': " . $e->getMessage());
            }
        }

        $this->command->info('Sons de test créés avec succès !');
    }
}
