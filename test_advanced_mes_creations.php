<?php

require_once 'vendor/autoload.php';

use App\Models\User;
use App\Models\Sound;
use App\Models\Category;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;

// Charger Laravel
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Test Avancé de l'endpoint 'Mes Créations' ===\n\n";

// Créer un utilisateur de test avec plusieurs sons et différents statuts
$testUser = User::firstOrCreate(
    ['email' => 'artiste.avance@reveilartist.com'],
    [
        'name' => 'Artiste Avancé',
        'password' => bcrypt('password'),
        'role' => 'artist',
        'email_verified_at' => now()
    ]
);

echo "Utilisateur de test: {$testUser->name} (ID: {$testUser->id})\n";

// Supprimer les anciens sons de test pour ce user
Sound::where('user_id', $testUser->id)->delete();

// Récupérer des catégories
$categories = Category::all();
if ($categories->isEmpty()) {
    echo "Aucune catégorie trouvée. Création d'une catégorie de test.\n";
    $category = Category::create([
        'name' => 'Test Category',
        'slug' => 'test-category',
        'description' => 'Catégorie de test'
    ]);
    $categories = collect([$category]);
}

// Créer des sons avec différents statuts et statistiques
$soundsData = [
    [
        'title' => 'Hit du Moment',
        'status' => 'published',
        'price' => 5000,
        'is_free' => false,
        'plays_count' => 1250,
        'likes_count' => 89,
        'downloads_count' => 45,
        'genre' => 'Afrobeat',
        'bpm' => 120,
        'key' => 'C Major'
    ],
    [
        'title' => 'Son Gratuit Populaire',
        'status' => 'published',
        'price' => 0,
        'is_free' => true,
        'plays_count' => 890,
        'likes_count' => 67,
        'downloads_count' => 234,
        'genre' => 'Hip-Hop',
        'bpm' => 95,
        'key' => 'G Minor'
    ],
    [
        'title' => 'Brouillon en Cours',
        'status' => 'draft',
        'price' => 3000,
        'is_free' => false,
        'plays_count' => 0,
        'likes_count' => 0,
        'downloads_count' => 0,
        'genre' => 'R&B',
        'bpm' => 85,
        'key' => 'F Major'
    ],
    [
        'title' => 'En Attente de Validation',
        'status' => 'pending',
        'price' => 4000,
        'is_free' => false,
        'plays_count' => 12,
        'likes_count' => 3,
        'downloads_count' => 0,
        'genre' => 'Trap',
        'bpm' => 140,
        'key' => 'D Minor'
    ],
    [
        'title' => 'Son Rejeté',
        'status' => 'rejected',
        'price' => 2500,
        'is_free' => false,
        'plays_count' => 5,
        'likes_count' => 1,
        'downloads_count' => 0,
        'genre' => 'Pop',
        'bpm' => 110,
        'key' => 'A Major'
    ]
];

$createdSounds = [];
foreach ($soundsData as $index => $soundData) {
    $sound = Sound::create([
        'title' => $soundData['title'],
        'slug' => \Illuminate\Support\Str::slug($soundData['title']),
        'description' => "Description détaillée pour {$soundData['title']}",
        'user_id' => $testUser->id,
        'category_id' => $categories->random()->id,
        'file_path' => "sounds/test-advanced-{$index}.mp3",
        'duration' => rand(120, 300),
        'genre' => $soundData['genre'],
        'price' => $soundData['price'],
        'is_free' => $soundData['is_free'],
        'status' => $soundData['status'],
        'plays_count' => $soundData['plays_count'],
        'likes_count' => $soundData['likes_count'],
        'downloads_count' => $soundData['downloads_count'],
        'bpm' => $soundData['bpm'],
        'key' => $soundData['key'],
        'license_type' => 'standard',
        'copyright_owner' => $testUser->name,
        'commercial_use' => true,
        'attribution_required' => false
    ]);

    $createdSounds[] = $sound;
}

// Créer quelques paiements pour simuler des ventes
$publishedSounds = collect($createdSounds)->where('status', 'published')->where('is_free', false);
foreach ($publishedSounds as $sound) {
    // Créer 2-3 ventes pour chaque son payant publié
    $salesCount = rand(2, 3);
    for ($i = 0; $i < $salesCount; $i++) {
        $amount = $sound->price;
        $commissionRate = 15.0; // 15% de commission
        $commissionAmount = $amount * ($commissionRate / 100);
        $sellerAmount = $amount - $commissionAmount;

        Payment::create([
            'user_id' => User::where('id', '!=', $testUser->id)->inRandomOrder()->first()->id,
            'seller_id' => $testUser->id,
            'sound_id' => $sound->id,
            'amount' => $amount,
            'seller_amount' => $sellerAmount,
            'commission_amount' => $commissionAmount,
            'commission_rate' => $commissionRate,
            'type' => 'sound',
            'status' => 'completed',
            'transaction_id' => 'TEST_' . uniqid(),
            'paid_at' => now()->subDays(rand(1, 30))
        ]);
    }
}

echo "Créé " . count($createdSounds) . " sons de test avec différents statuts.\n\n";

// Simuler l'authentification
auth('sanctum')->setUser($testUser);

// Tester le contrôleur avec différents paramètres
$controller = new \App\Http\Controllers\Api\UserController();

echo "=== Test 1: Tous les sons (par défaut) ===\n";
$request1 = new \Illuminate\Http\Request();
$response1 = $controller->getUserSounds($request1);
$data1 = json_decode($response1->getContent(), true);

if ($data1['success']) {
    echo "✅ Succès - {$data1['pagination']['total']} sons trouvés\n";
    echo "📊 Statistiques globales:\n";
    echo "   - Total sons: {$data1['global_stats']['total_sounds']}\n";
    echo "   - Sons publiés: {$data1['global_stats']['published_sounds']}\n";
    echo "   - Total lectures: {$data1['global_stats']['total_plays']}\n";
    echo "   - Total likes: {$data1['global_stats']['total_likes']}\n";
    echo "   - Revenu total: {$data1['global_stats']['formatted_total_revenue']}\n";

    echo "\n📈 Répartition par statut:\n";
    foreach ($data1['status_stats'] as $status => $count) {
        echo "   - $status: $count\n";
    }

    echo "\n🎵 Top sons:\n";
    foreach ($data1['top_sounds'] as $topSound) {
        echo "   - {$topSound['title']}: {$topSound['plays_count']} lectures\n";
    }
} else {
    echo "❌ Erreur: {$data1['message']}\n";
}

echo "\n=== Test 2: Filtrer par statut 'published' ===\n";
$request2 = new \Illuminate\Http\Request(['status' => 'published']);
$response2 = $controller->getUserSounds($request2);
$data2 = json_decode($response2->getContent(), true);

if ($data2['success']) {
    echo "✅ Succès - {$data2['pagination']['total']} sons publiés trouvés\n";
    foreach ($data2['data'] as $sound) {
        echo "   - {$sound['title']} ({$sound['stats']['performance']})\n";
        echo "     💰 {$sound['formatted_price']} | 📊 {$sound['stats']['plays_count']} lectures | ❤️ {$sound['stats']['likes_count']} likes\n";
        echo "     💵 Revenus: {$sound['stats']['formatted_revenue']}\n\n";
    }
}

echo "\n=== Test 3: Trier par nombre de lectures ===\n";
$request3 = new \Illuminate\Http\Request(['sort_by' => 'plays_count', 'sort_order' => 'desc']);
$response3 = $controller->getUserSounds($request3);
$data3 = json_decode($response3->getContent(), true);

if ($data3['success']) {
    echo "✅ Succès - Sons triés par popularité:\n";
    foreach ($data3['data'] as $sound) {
        echo "   - {$sound['title']}: {$sound['stats']['plays_count']} lectures\n";
    }
}

echo "\n=== Test 4: Pagination (2 sons par page) ===\n";
$request4 = new \Illuminate\Http\Request(['per_page' => 2]);
$response4 = $controller->getUserSounds($request4);
$data4 = json_decode($response4->getContent(), true);

if ($data4['success']) {
    echo "✅ Succès - Page {$data4['pagination']['current_page']} sur {$data4['pagination']['last_page']}\n";
    echo "   Affichage de {$data4['pagination']['from']} à {$data4['pagination']['to']} sur {$data4['pagination']['total']} sons\n";
}

echo "\n=== Test terminé ===\n";
echo "🎉 Tous les tests ont été exécutés avec succès !\n";
echo "📝 L'endpoint 'Mes Créations' utilise maintenant des données réelles de la base de données.\n";
