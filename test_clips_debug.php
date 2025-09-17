<?php

require_once 'vendor/autoload.php';

use App\Models\User;
use App\Models\Clip;

// Configuration Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Debug API Clips ===\n";

// Vérifier les données
echo "1. Vérification base de données:\n";
$totalClips = Clip::count();
echo "   Total clips: $totalClips\n";

$activeClips = Clip::where('is_active', true)->count();
echo "   Clips actifs: $activeClips\n";

$inactiveClips = Clip::where('is_active', false)->count();
echo "   Clips inactifs: $inactiveClips\n";

$featuredClips = Clip::where('featured', true)->count();
echo "   Clips en vedette: $featuredClips\n";

// Afficher quelques clips
echo "\n2. Premiers clips:\n";
$clips = Clip::with('user')->limit(3)->get();
foreach ($clips as $clip) {
    echo "   - ID: {$clip->id}, Titre: {$clip->title}, Actif: " . ($clip->is_active ? 'Oui' : 'Non') .
         ", Utilisateur: " . ($clip->user ? $clip->user->name : 'N/A') . "\n";
}

// Vérifier admin
echo "\n3. Vérification admin:\n";
$admin = User::where('role', 'admin')->first();
if ($admin) {
    echo "   Admin trouvé: {$admin->name} ({$admin->email})\n";

    // Créer token et tester API
    $token = $admin->createToken('test-clips')->plainTextToken;
    echo "   Token créé: " . substr($token, 0, 20) . "...\n";

    // Test direct du contrôleur
    echo "\n4. Test contrôleur direct:\n";
    try {
        $controller = new App\Http\Controllers\ClipManagementController();

        // Test stats
        $statsResponse = $controller->getClipStats();
        $statsData = json_decode($statsResponse->getContent(), true);
        echo "   Stats API: " . ($statsData['success'] ? 'SUCCESS' : 'FAILED') . "\n";
        if ($statsData['success']) {
            echo "      Total clips: " . $statsData['stats']['total_clips'] . "\n";
            echo "      Clips actifs: " . $statsData['stats']['active_clips'] . "\n";
        } else {
            echo "      Erreur: " . ($statsData['error'] ?? 'Inconnue') . "\n";
        }

        // Test liste clips
        $request = new Illuminate\Http\Request();
        $clipsResponse = $controller->getClips($request);
        $clipsData = json_decode($clipsResponse->getContent(), true);
        echo "   Liste API: " . ($clipsData['success'] ? 'SUCCESS' : 'FAILED') . "\n";
        if ($clipsData['success']) {
            $clipsList = $clipsData['clips']['data'] ?? $clipsData['clips'] ?? [];
            echo "      Clips récupérés: " . count($clipsList) . "\n";

            if (count($clipsList) > 0) {
                $firstClip = $clipsList[0];
                echo "      Premier clip: {$firstClip['title']} (Statut: {$firstClip['status']})\n";
            }
        } else {
            echo "      Erreur: " . ($clipsData['error'] ?? 'Inconnue') . "\n";
        }

    } catch (Exception $e) {
        echo "   ERREUR contrôleur: " . $e->getMessage() . "\n";
    }

    // Nettoyage
    \Laravel\Sanctum\PersonalAccessToken::where('tokenable_id', $admin->id)
        ->where('name', 'test-clips')
        ->delete();

} else {
    echo "   ERREUR: Aucun admin trouvé!\n";
}

echo "\n=== Fin debug ===\n";
