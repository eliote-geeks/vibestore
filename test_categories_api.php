<?php

require_once 'vendor/autoload.php';

// Charger l'application Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Test API Catégories ===\n\n";

try {
    // Test du modèle Category
    $categories = \App\Models\Category::active()
        ->ordered()
        ->select('id', 'name', 'color', 'icon', 'description')
        ->get();

    echo "Nombre de catégories trouvées: {$categories->count()}\n\n";

    if ($categories->count() > 0) {
        echo "Catégories disponibles:\n";
        echo "----------------------\n";
        foreach ($categories as $cat) {
            echo "• {$cat->name}\n";
            echo "  ID: {$cat->id}\n";
            echo "  Couleur: {$cat->color}\n";
            echo "  Icône: {$cat->icon}\n";
            echo "  Description: " . substr($cat->description ?? 'N/A', 0, 50) . "...\n\n";
        }
    } else {
        echo "Aucune catégorie trouvée. Exécution du seeder...\n";

        // Essayer d'exécuter le seeder
        Artisan::call('db:seed', ['--class' => 'CategorySeeder']);
        echo "Seeder exécuté.\n";

        // Retester
        $categories = \App\Models\Category::active()->ordered()->get();
        echo "Nouvelles catégories trouvées: {$categories->count()}\n";
    }

    // Test des endpoints API
    echo "\n=== Test des endpoints API ===\n";

    // Simuler une requête HTTP vers l'API
    $controller = new \App\Http\Controllers\ClipController();
    $response = $controller->getCategories();
    $data = $response->getData();

    echo "Réponse API clips/categories:\n";
    echo "Statut: " . ($data->message ?? 'OK') . "\n";
    echo "Nombre de catégories: " . count($data->categories) . "\n";

    // Test pour les compétitions
    $competitionController = new \App\Http\Controllers\CompetitionController();
    $response2 = $competitionController->getCategories();
    $data2 = $response2->getData();

    echo "\nRéponse API competitions/categories:\n";
    echo "Statut: " . ($data2->message ?? 'OK') . "\n";
    echo "Nombre de catégories: " . count($data2->categories) . "\n";

    // Afficher quelques exemples de structure
    if (count($data->categories) > 0) {
        echo "\nExemple de structure de catégorie:\n";
        $firstCat = $data->categories[0];
        echo "Structure: " . json_encode($firstCat, JSON_PRETTY_PRINT) . "\n";
    }

} catch (\Exception $e) {
    echo "ERREUR: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";

    // Test du fallback
    echo "\n=== Test du fallback ===\n";
    $fallback = [
        ['id' => null, 'name' => 'Afrobeat', 'color' => '#FF6B35', 'icon' => 'faHeart'],
        ['id' => null, 'name' => 'Rap', 'color' => '#4ECDC4', 'icon' => 'faMicrophone'],
        ['id' => null, 'name' => 'Makossa', 'color' => '#45B7D1', 'icon' => 'faMusic'],
    ];

    echo "Catégories de fallback: " . count($fallback) . "\n";
    foreach ($fallback as $cat) {
        echo "• {$cat['name']} - {$cat['color']}\n";
    }
}

echo "\n=== Tests terminés ===\n";
