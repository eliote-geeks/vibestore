<?php

require_once 'vendor/autoload.php';

use App\Models\Competition;
use App\Models\User;

// Charger l'application Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Test API Compétitions ===\n\n";

// Test 1: Compter les compétitions
$competitionCount = Competition::count();
echo "Nombre de compétitions en base: {$competitionCount}\n\n";

// Test 2: Afficher les compétitions disponibles
echo "Compétitions disponibles:\n";
echo "------------------------\n";

$competitions = Competition::with('user')->get();

foreach ($competitions as $competition) {
    echo "• {$competition->title}\n";
    echo "  Catégorie: {$competition->category}\n";
    echo "  Organisateur: {$competition->user->name}\n";
    echo "  Frais d'inscription: {$competition->formatted_entry_fee}\n";
    echo "  Participants: {$competition->current_participants}/{$competition->max_participants}\n";
    echo "  Cagnotte: {$competition->formatted_total_prize_pool}\n";
    echo "  Date: {$competition->start_date->format('d/m/Y')} à {$competition->start_time->format('H:i')}\n";
    echo "  Durée: {$competition->formatted_duration}\n";
    echo "  Statut: {$competition->status_label}\n";
    echo "  Inscriptions ouvertes: " . ($competition->can_register ? 'Oui' : 'Non') . "\n\n";
}

// Test 3: Test des catégories
echo "Catégories disponibles:\n";
echo "----------------------\n";
$controller = new \App\Http\Controllers\CompetitionController();
$categories = $controller->getCategories()->getData()->categories;
foreach ($categories as $category) {
    echo "• {$category}\n";
}

// Test 4: Test des récompenses
echo "\nRépartition des prix (exemple Battle de Rap):\n";
echo "--------------------------------------------\n";
$battleRap = Competition::where('title', 'like', '%Battle de Rap%')->first();
if ($battleRap) {
    foreach ($battleRap->prize_amounts as $prize) {
        echo "• {$prize['label']}: {$prize['percentage']}% = " . number_format($prize['amount'], 0, ',', ' ') . " XAF\n";
    }
}

// Test 5: Test des critères de jugement
echo "\nCritères de jugement (exemple):\n";
echo "-------------------------------\n";
if ($battleRap) {
    foreach ($battleRap->judging_criteria as $criteria) {
        echo "• {$criteria['name']}: {$criteria['weight']}%\n";
    }
}

echo "\n=== Tests terminés ===\n";
