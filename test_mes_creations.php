<?php

require_once 'vendor/autoload.php';

use App\Models\User;
use App\Models\Sound;
use Illuminate\Support\Facades\DB;

// Charger Laravel
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Test de l'endpoint 'Mes Créations' ===\n\n";

// Récupérer un utilisateur qui a des sons
$userWithSounds = User::whereHas('sounds')->first();

if (!$userWithSounds) {
    echo "Aucun utilisateur avec des sons trouvé.\n";

    // Créer un utilisateur de test avec des sons
    $testUser = User::create([
        'name' => 'Artiste Test',
        'email' => 'artiste.test@reveilartist.com',
        'password' => bcrypt('password'),
        'role' => 'artist',
        'email_verified_at' => now()
    ]);

    // Créer quelques sons de test
    $category = \App\Models\Category::first();

    for ($i = 1; $i <= 3; $i++) {
        Sound::create([
            'title' => "Son de Test $i",
            'slug' => "son-de-test-$i",
            'description' => "Description du son de test $i",
            'user_id' => $testUser->id,
            'category_id' => $category->id,
            'file_path' => "sounds/test-$i.mp3",
            'duration' => rand(120, 300),
            'genre' => 'Hip-Hop',
            'price' => rand(1000, 5000),
            'is_free' => $i == 1, // Premier son gratuit
            'status' => 'published',
            'plays_count' => rand(10, 100),
            'likes_count' => rand(5, 50),
            'downloads_count' => rand(2, 20),
            'bpm' => rand(80, 140),
            'key' => 'C Major'
        ]);
    }

    $userWithSounds = $testUser;
    echo "Utilisateur de test créé avec 3 sons.\n\n";
}

echo "Utilisateur testé: {$userWithSounds->name} (ID: {$userWithSounds->id})\n";
echo "Nombre de sons: " . $userWithSounds->sounds()->count() . "\n\n";

// Simuler l'authentification
auth('sanctum')->setUser($userWithSounds);

// Tester le contrôleur
$controller = new \App\Http\Controllers\Api\UserController();
$request = new \Illuminate\Http\Request();

try {
    $response = $controller->getUserSounds($request);
    $data = json_decode($response->getContent(), true);

    echo "=== Résultat de l'API ===\n";
    echo "Succès: " . ($data['success'] ? 'Oui' : 'Non') . "\n";

    if ($data['success']) {
        echo "Nombre de sons retournés: " . count($data['data']) . "\n";
        echo "Total des sons: " . $data['global_stats']['total_sounds'] . "\n";
        echo "Sons publiés: " . $data['global_stats']['published_sounds'] . "\n";
        echo "Total des lectures: " . $data['global_stats']['total_plays'] . "\n";
        echo "Total des likes: " . $data['global_stats']['total_likes'] . "\n";
        echo "Revenu total: " . $data['global_stats']['formatted_total_revenue'] . "\n\n";

        echo "=== Détails des sons ===\n";
        foreach ($data['data'] as $sound) {
            echo "- {$sound['title']} ({$sound['status_label']})\n";
            echo "  Catégorie: {$sound['category']['name']}\n";
            echo "  Prix: {$sound['formatted_price']}\n";
            echo "  Statistiques: {$sound['stats']['plays_count']} lectures, {$sound['stats']['likes_count']} likes\n";
            echo "  Performance: {$sound['stats']['performance']}\n\n";
        }

        echo "=== Statistiques par statut ===\n";
        foreach ($data['status_stats'] as $status => $count) {
            echo "- $status: $count\n";
        }

    } else {
        echo "Erreur: " . $data['message'] . "\n";
        if (isset($data['error'])) {
            echo "Détail: " . $data['error'] . "\n";
        }
    }

} catch (Exception $e) {
    echo "Erreur lors du test: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}

echo "\n=== Test terminé ===\n";
