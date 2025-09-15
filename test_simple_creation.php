<?php

echo "=== Test Simple - Mes Créations ===\n\n";

require_once 'vendor/autoload.php';

// Charger Laravel
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Laravel chargé!\n";

// Vérifier les modèles
echo "Nombre d'utilisateurs: " . App\Models\User::count() . "\n";
echo "Nombre de sons: " . App\Models\Sound::count() . "\n";
echo "Nombre d'événements: " . App\Models\Event::count() . "\n";

// Tester un utilisateur
$user = App\Models\User::first();
echo "Premier utilisateur: " . $user->name . "\n";

// Simuler l'authentification
auth('sanctum')->setUser($user);
echo "Utilisateur authentifié: " . auth('sanctum')->user()->name . "\n";

// Tester la méthode getUserSounds
try {
    $controller = new App\Http\Controllers\Api\UserController();
    $request = new Illuminate\Http\Request();

    echo "Test getUserSounds...\n";
    $response = $controller->getUserSounds($request);
    $data = json_decode($response->getContent(), true);

    if ($data['success']) {
        echo "✅ getUserSounds fonctionne! " . $data['pagination']['total'] . " sons trouvés\n";
    } else {
        echo "❌ getUserSounds erreur: " . $data['message'] . "\n";
    }

} catch (Exception $e) {
    echo "❌ Exception: " . $e->getMessage() . "\n";
}

echo "\nTest terminé!\n";
