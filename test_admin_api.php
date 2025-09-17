<?php

require_once 'vendor/autoload.php';

use App\Models\User;
use Laravel\Sanctum\PersonalAccessToken;

// Configuration Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Test API Admin ===\n";

// 1. Créer un token admin pour les tests
$admin = User::where('role', 'admin')->first();

if (!$admin) {
    echo "ERREUR: Aucun admin trouvé!\n";
    exit(1);
}

echo "Admin trouvé: {$admin->name} ({$admin->email})\n";

// Créer un token de test
$token = $admin->createToken('test-admin-token')->plainTextToken;
echo "Token créé: " . substr($token, 0, 20) . "...\n\n";

// 2. Tester les routes admin avec curl
$baseUrl = 'http://127.0.0.1:8000'; // Changez selon votre config
$headers = [
    'Authorization: Bearer ' . $token,
    'Accept: application/json',
    'Content-Type: application/json'
];

// Test des routes
$routes = [
    'GET /api/admin/clips/stats' => 'Statistiques clips',
    'GET /api/admin/clips' => 'Liste des clips',
    'GET /api/admin/clips/pending' => 'Clips en attente',
    'GET /api/admin/certifications/stats' => 'Statistiques certifications',
    'GET /api/admin/analytics/global' => 'Analytics globales',
    'GET /api/admin/payments/stats' => 'Statistiques paiements',
];

foreach ($routes as $route => $description) {
    [$method, $url] = explode(' ', $route, 2);

    echo "Test: {$description}\n";
    echo "Route: {$method} {$url}\n";

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $baseUrl . $url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);

    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false) {
        echo "❌ ERREUR: Impossible de contacter le serveur\n";
        echo "Assurez-vous que le serveur Laravel est démarré avec: php artisan serve\n\n";
        continue;
    }

    $data = json_decode($response, true);

    echo "Code HTTP: {$httpCode}\n";

    if ($httpCode === 200) {
        if (isset($data['success']) && $data['success']) {
            echo "✅ SUCCESS: API fonctionne\n";

            // Afficher quelques détails selon la route
            if (strpos($url, '/clips/stats') !== false && isset($data['stats'])) {
                echo "   📊 {$data['stats']['total_clips']} clips total\n";
            } elseif (strpos($url, '/clips') !== false && !strpos($url, '/stats') && isset($data['clips'])) {
                $clipsData = $data['clips']['data'] ?? $data['clips'];
                $count = is_array($clipsData) ? count($clipsData) : ($data['clips']['total'] ?? 'N/A');
                echo "   📱 {$count} clips récupérés\n";
            } elseif (strpos($url, '/certifications/stats') !== false && isset($data['stats'])) {
                echo "   🏆 {$data['stats']['certified_sounds']} sons certifiés\n";
            }
        } else {
            echo "❌ ERREUR API: " . ($data['error'] ?? 'Erreur inconnue') . "\n";
        }
    } elseif ($httpCode === 401) {
        echo "❌ ERREUR AUTH: Non autorisé\n";
    } elseif ($httpCode === 403) {
        echo "❌ ERREUR PERM: Permissions insuffisantes\n";
    } elseif ($httpCode === 404) {
        echo "❌ ERREUR 404: Route non trouvée\n";
    } else {
        echo "❌ ERREUR HTTP {$httpCode}\n";
        if ($data) {
            echo "   Réponse: " . json_encode($data, JSON_UNESCAPED_UNICODE) . "\n";
        }
    }

    echo "\n";
}

// 3. Nettoyage
PersonalAccessToken::where('tokenable_id', $admin->id)
    ->where('name', 'test-admin-token')
    ->delete();

echo "Token de test supprimé.\n";
echo "=== Fin des tests ===\n";
