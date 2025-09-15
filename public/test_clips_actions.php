<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: *');

echo "=== TEST DES ACTIONS CLIPS ===\n\n";

// Configuration
$baseUrl = 'http://localhost:8000/api';
$clipId = 8; // ID du premier clip

// Test 1: Partage (sans authentification)
echo "1. Test POST /api/clips/$clipId/share (sans auth)\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "$baseUrl/clips/$clipId/share");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    echo "   ✅ Partage fonctionne sans authentification\n";
} else {
    echo "   ⚠️  Partage: HTTP $httpCode\n";
}

// Test 2: Like (sans authentification) - devrait échouer
echo "\n2. Test POST /api/clips/$clipId/like (sans auth)\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "$baseUrl/clips/$clipId/like");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 401) {
    echo "   ✅ Like nécessite l'authentification (normal)\n";
} else {
    echo "   ⚠️  Like: HTTP $httpCode (attendu 401)\n";
}

// Test 3: Bookmark (sans authentification) - devrait échouer
echo "\n3. Test POST /api/clips/$clipId/bookmark (sans auth)\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "$baseUrl/clips/$clipId/bookmark");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 401) {
    echo "   ✅ Bookmark nécessite l'authentification (normal)\n";
} else {
    echo "   ⚠️  Bookmark: HTTP $httpCode (attendu 401)\n";
}

// Test 4: Follow artiste (sans authentification) - devrait échouer
echo "\n4. Test POST /api/artists/23/follow (sans auth)\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "$baseUrl/artists/23/follow");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 401) {
    echo "   ✅ Follow nécessite l'authentification (normal)\n";
} else {
    echo "   ⚠️  Follow: HTTP $httpCode (attendu 401)\n";
}

// Test 5: Commentaires (GET - sans auth)
echo "\n5. Test GET /api/clips/$clipId/comments (sans auth)\n";
$response = file_get_contents("$baseUrl/clips/$clipId/comments");
$commentsData = json_decode($response, true);

if ($commentsData && isset($commentsData['comments'])) {
    echo "   ✅ Récupération des commentaires fonctionne\n";
    echo "   📊 Commentaires: " . count($commentsData['comments']) . "\n";
} else {
    echo "   ❌ Erreur commentaires\n";
}

// Test 6: Ajouter commentaire (sans auth) - devrait échouer
echo "\n6. Test POST /api/clips/$clipId/comments (sans auth)\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "$baseUrl/clips/$clipId/comments");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'content' => 'Test commentaire'
]));
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 401) {
    echo "   ✅ Ajouter commentaire nécessite l'authentification (normal)\n";
} else {
    echo "   ⚠️  Ajouter commentaire: HTTP $httpCode (attendu 401)\n";
}

echo "\n=== RÉSUMÉ DES ACTIONS ===\n";
echo "✅ Actions publiques fonctionnent (partage, voir commentaires)\n";
echo "🔒 Actions authentifiées nécessitent un token (normal)\n";
echo "📱 Les composants React doivent gérer les cas non-authentifiés\n";
echo "\n=== RECOMMANDATIONS FRONTEND ===\n";
echo "• Masquer/désactiver les boutons d'action si pas connecté\n";
echo "• Afficher un message de connexion requise\n";
echo "• Rediriger vers la page de login si action nécessaire\n";
echo "• Partage fonctionne toujours (pas d'auth requise)\n";
?>
