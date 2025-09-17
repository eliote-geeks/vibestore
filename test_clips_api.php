<?php

require_once 'vendor/autoload.php';

use App\Models\Clip;
use App\Models\User;
use Illuminate\Support\Facades\DB;

// Configuration Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Test API Clips ===" . PHP_EOL;

// Vérifier les clips
$totalClips = Clip::count();
echo "Total clips dans la DB: " . $totalClips . PHP_EOL;

if ($totalClips > 0) {
    $firstClip = Clip::with('user')->first();
    echo "Premier clip: " . $firstClip->title . PHP_EOL;
    echo "Statut: " . $firstClip->status . PHP_EOL;
    echo "Utilisateur: " . ($firstClip->user ? $firstClip->user->name : 'Pas d\'utilisateur') . PHP_EOL;
}

// Vérifier les utilisateurs admin
$adminUser = User::where('role', 'admin')->first();
if ($adminUser) {
    echo "Admin trouvé: " . $adminUser->name . PHP_EOL;
    echo "Email: " . $adminUser->email . PHP_EOL;
} else {
    echo "Aucun admin trouvé dans la DB" . PHP_EOL;
}

// Test du contrôleur
try {
    $controller = new App\Http\Controllers\ClipManagementController();

    // Test des stats
    $request = new Illuminate\Http\Request();
    $response = $controller->getClipStats();

    $responseData = json_decode($response->getContent(), true);

    if ($responseData['success'] ?? false) {
        echo "API Stats fonctionnelle!" . PHP_EOL;
        echo "Stats: " . json_encode($responseData['stats'], JSON_PRETTY_PRINT) . PHP_EOL;
    } else {
        echo "Erreur API: " . ($responseData['error'] ?? 'Erreur inconnue') . PHP_EOL;
    }

    // Test récupération des clips
    $clipsResponse = $controller->getClips($request);
    $clipsData = json_decode($clipsResponse->getContent(), true);

    if ($clipsData['success'] ?? false) {
        echo "API Clips fonctionnelle!" . PHP_EOL;
        echo "Nombre de clips récupérés: " . count($clipsData['clips']['data'] ?? []) . PHP_EOL;
    } else {
        echo "Erreur API clips: " . ($clipsData['error'] ?? 'Erreur inconnue') . PHP_EOL;
    }

    // Test API Certifications
    $certController = new App\Http\Controllers\CertificationController();
    $certResponse = $certController->getCertificationStats();
    $certData = json_decode($certResponse->getContent(), true);

    if ($certData['success'] ?? false) {
        echo "API Certifications fonctionnelle!" . PHP_EOL;
        echo "Nombre de sons avec données: " . count($certData['sounds'] ?? []) . PHP_EOL;
        echo "Sons certifiés: " . ($certData['stats']['certified_sounds'] ?? 0) . PHP_EOL;
    } else {
        echo "Erreur API certifications: " . ($certData['error'] ?? 'Erreur inconnue') . PHP_EOL;
    }

} catch (Exception $e) {
    echo "Erreur test contrôleur: " . $e->getMessage() . PHP_EOL;
}

echo "=== Fin du test ===" . PHP_EOL;
