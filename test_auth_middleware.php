<?php

require_once 'vendor/autoload.php';

use App\Models\User;
use Laravel\Sanctum\PersonalAccessToken;

// Configuration Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Test Middleware Admin ===\n";

// Trouver l'admin
$admin = User::where('role', 'admin')->first();

if (!$admin) {
    echo "ERREUR: Aucun admin trouvé!\n";
    exit(1);
}

echo "Admin trouvé: {$admin->name} ({$admin->email})\n";
echo "Rôle: {$admin->role}\n";

// Créer un token
$token = $admin->createToken('test-middleware')->plainTextToken;
echo "Token créé: " . substr($token, 0, 20) . "...\n\n";

// Tester les routes admin avec middleware
$routes = [
    'GET /api/admin/clips/stats',
    'GET /api/admin/clips',
    'GET /api/admin/certifications/stats',
];

foreach ($routes as $route) {
    [$method, $path] = explode(' ', $route);

    echo "Test: $route\n";

    // Simuler la requête avec le middleware
    try {
        // Créer une fake request
        $request = Illuminate\Http\Request::create($path, $method);
        $request->headers->set('Authorization', 'Bearer ' . $token);
        $request->headers->set('Accept', 'application/json');

        // Tester l'authentification Sanctum
        $tokenInstance = PersonalAccessToken::findToken($token);
        if ($tokenInstance) {
            echo "   ✅ Token valide - Utilisateur: {$tokenInstance->tokenable->name}\n";
            echo "   ✅ Rôle utilisateur: {$tokenInstance->tokenable->role}\n";

            // Vérifier le middleware admin
            $isAdmin = $tokenInstance->tokenable->role === 'admin';
            echo "   " . ($isAdmin ? "✅" : "❌") . " Middleware admin: " . ($isAdmin ? "PASSÉ" : "ÉCHOUÉ") . "\n";

        } else {
            echo "   ❌ Token invalide\n";
        }

    } catch (Exception $e) {
        echo "   ❌ Erreur: " . $e->getMessage() . "\n";
    }

    echo "\n";
}

// Vérifier si des tokens existent déjà pour cet admin
echo "Tokens existants pour {$admin->name}:\n";
$existingTokens = PersonalAccessToken::where('tokenable_id', $admin->id)->get();
foreach ($existingTokens as $existingToken) {
    echo "   - ID: {$existingToken->id}, Nom: {$existingToken->name}, Créé: {$existingToken->created_at}\n";
}

// Nettoyage
PersonalAccessToken::where('tokenable_id', $admin->id)
    ->where('name', 'test-middleware')
    ->delete();

echo "\nToken de test supprimé.\n";
echo "=== Fin test middleware ===\n";
