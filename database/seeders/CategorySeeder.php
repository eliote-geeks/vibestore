<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Category;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Afrobeat',
                'description' => 'Musique afrobeat moderne avec des rythmes entraînants et des mélodies africaines contemporaines.',
                'color' => '#FF6B35',
                'icon' => 'faHeart',
                'sort_order' => 1,
            ],
            [
                'name' => 'Hip-Hop',
                'description' => 'Rap et hip-hop camerounais avec des beats urbains et des paroles engagées.',
                'color' => '#4ECDC4',
                'icon' => 'faMicrophone',
                'sort_order' => 2,
            ],
            [
                'name' => 'Makossa',
                'description' => 'Genre musical traditionnel camerounais modernisé avec des sonorités électroniques.',
                'color' => '#45B7D1',
                'icon' => 'faMusic',
                'sort_order' => 3,
            ],
            [
                'name' => 'Bikutsi',
                'description' => 'Rythmes bikutsi traditionnels revisités avec des arrangements contemporains.',
                'color' => '#96CEB4',
                'icon' => 'faDrum',
                'sort_order' => 4,
            ],
            [
                'name' => 'R&B',
                'description' => 'Rhythm and Blues avec une touche africaine et des voix soul.',
                'color' => '#FFEAA7',
                'icon' => 'faHeartbeat',
                'sort_order' => 5,
            ],
            [
                'name' => 'Gospel',
                'description' => 'Musique gospel et spirituelle avec des arrangements modernes.',
                'color' => '#DDA0DD',
                'icon' => 'faHandsPraying',
                'sort_order' => 6,
            ],
            [
                'name' => 'Électro',
                'description' => 'Musique électronique et dance avec des influences afro.',
                'color' => '#74B9FF',
                'icon' => 'faBolt',
                'sort_order' => 7,
            ],
            [
                'name' => 'Coupé-Décalé',
                'description' => 'Rythmes coupé-décalé énergiques pour les pistes de danse.',
                'color' => '#FD79A8',
                'icon' => 'faUsers',
                'sort_order' => 8,
            ],
            [
                'name' => 'Zouk',
                'description' => 'Zouk doux et romantique avec des arrangements caribéens.',
                'color' => '#FDCB6E',
                'icon' => 'faSmile',
                'sort_order' => 9,
            ],
            [
                'name' => 'Drill',
                'description' => 'Style drill camerounais avec des beats agressifs et des flows rapides.',
                'color' => '#636E72',
                'icon' => 'faFire',
                'sort_order' => 10,
            ],
            [
                'name' => 'Ambiance',
                'description' => 'Sons d\'ambiance et atmosphères pour créer des moods spécifiques.',
                'color' => '#A29BFE',
                'icon' => 'faCloud',
                'sort_order' => 11,
            ],
            [
                'name' => 'Reggae',
                'description' => 'Reggae et dancehall avec des influences africaines.',
                'color' => '#00B894',
                'icon' => 'faLeaf',
                'sort_order' => 12,
            ]
        ];

        foreach ($categories as $categoryData) {
            Category::create([
                'name' => $categoryData['name'],
                'slug' => Str::slug($categoryData['name']),
                'description' => $categoryData['description'],
                'color' => $categoryData['color'],
                'icon' => $categoryData['icon'],
                'sort_order' => $categoryData['sort_order'],
                'is_active' => true,
            ]);
        }
    }
}
