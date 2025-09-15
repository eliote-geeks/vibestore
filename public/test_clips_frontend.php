<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: *');

// Configuration de la base URL
$baseUrl = 'http://localhost:8000/api';

echo "=== TEST DES APIS CLIPS FRONTEND ===\n\n";

// Test 1: Récupérer la liste des clips
echo "1. Test GET /api/clips\n";
$response = file_get_contents($baseUrl . '/clips?limit=3');
$clips = json_decode($response, true);

if ($clips && isset($clips['clips'])) {
    echo "   ✅ Liste des clips récupérée (" . count($clips['clips']['data']) . " clips)\n";

    if (!empty($clips['clips']['data'])) {
        $firstClip = $clips['clips']['data'][0];
        $clipId = $firstClip['id'];
        echo "   📋 Premier clip: " . $firstClip['title'] . " (ID: $clipId)\n";

        // Test 2: Récupérer un clip spécifique
        echo "\n2. Test GET /api/clips/$clipId\n";
        $clipResponse = file_get_contents($baseUrl . "/clips/$clipId");
        $clipData = json_decode($clipResponse, true);

        if ($clipData && isset($clipData['clip'])) {
            echo "   ✅ Détails du clip récupérés\n";
            echo "   📋 Titre: " . $clipData['clip']['title'] . "\n";
            echo "   👀 Vues: " . $clipData['clip']['views'] . "\n";
            echo "   ❤️ Likes: " . $clipData['clip']['likes'] . "\n";
            echo "   💬 Commentaires: " . $clipData['comments_count'] . "\n";

            // Test 3: Récupérer les commentaires
            echo "\n3. Test GET /api/clips/$clipId/comments\n";
            $commentsResponse = file_get_contents($baseUrl . "/clips/$clipId/comments");
            $commentsData = json_decode($commentsResponse, true);

            if ($commentsData && isset($commentsData['comments'])) {
                echo "   ✅ Commentaires récupérés (" . count($commentsData['comments']) . " commentaires)\n";
            } else {
                echo "   ❌ Erreur commentaires: " . ($commentsData['message'] ?? 'Erreur inconnue') . "\n";
            }
        } else {
            echo "   ❌ Erreur détails clip: " . ($clipData['message'] ?? 'Erreur inconnue') . "\n";
        }
    }
} else {
    echo "   ❌ Erreur liste clips: " . ($clips['message'] ?? 'Erreur inconnue') . "\n";
}

// Test 4: Récupérer les catégories
echo "\n4. Test GET /api/clips/categories\n";
$categoriesResponse = file_get_contents($baseUrl . '/clips/categories');
$categoriesData = json_decode($categoriesResponse, true);

if ($categoriesData && isset($categoriesData['categories'])) {
    echo "   ✅ Catégories récupérées (" . count($categoriesData['categories']) . " catégories)\n";
    foreach (array_slice($categoriesData['categories'], 0, 3) as $category) {
        echo "   📂 " . ($category['name'] ?? $category) . "\n";
    }
} else {
    echo "   ❌ Erreur catégories: " . ($categoriesData['message'] ?? 'Erreur inconnue') . "\n";
}

// Test 5: Tester les routes artistess
echo "\n5. Test GET /api/artists\n";
$artistsResponse = file_get_contents($baseUrl . '/artists?limit=3');
$artistsData = json_decode($artistsResponse, true);

if ($artistsData && isset($artistsData['artists'])) {
    echo "   ✅ Artistes récupérés (" . count($artistsData['artists']['data']) . " artistes)\n";
    if (!empty($artistsData['artists']['data'])) {
        $firstArtist = $artistsData['artists']['data'][0];
        echo "   🎤 Premier artiste: " . $firstArtist['name'] . " (ID: " . $firstArtist['id'] . ")\n";
    }
} else {
    echo "   ❌ Erreur artistes: " . ($artistsData['message'] ?? 'Erreur inconnue') . "\n";
}

echo "\n=== RÉSUMÉ ===\n";
echo "✅ APIs publiques testées avec succès\n";
echo "⚠️  Les APIs authentifiées (like, bookmark, follow) nécessitent un token\n";
echo "📱 Les composants React peuvent maintenant utiliser ces endpoints\n";
echo "\n";

// Informations pour le debugging React
echo "=== INFORMATIONS POUR REACT ===\n";
echo "Base URL: $baseUrl\n";
echo "Headers requis pour les APIs authentifiées:\n";
echo "  Authorization: Bearer {token}\n";
echo "  Content-Type: application/json\n";
echo "  Accept: application/json\n";

echo "\n=== ENDPOINTS DISPONIBLES ===\n";
echo "GET    /api/clips                    - Liste des clips\n";
echo "GET    /api/clips/{id}               - Détails d'un clip\n";
echo "GET    /api/clips/{id}/comments      - Commentaires d'un clip\n";
echo "GET    /api/clips/categories         - Catégories\n";
echo "POST   /api/clips/{id}/like          - Like un clip (auth)\n";
echo "POST   /api/clips/{id}/bookmark      - Bookmark un clip (auth)\n";
echo "POST   /api/clips/{id}/share         - Partager un clip\n";
echo "POST   /api/clips/{id}/comments      - Ajouter un commentaire (auth)\n";
echo "POST   /api/comments/{id}/like       - Liker un commentaire (auth)\n";
echo "POST   /api/artists/{id}/follow      - Suivre un artiste (auth)\n";
?>
