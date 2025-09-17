<?php
header('Content-Type: text/plain; charset=utf-8');

echo "=== TEST DE LIKE CLIP ===\n\n";

// Configuration
$baseUrl = 'http://localhost:8000/api';
$clipId = 8;

// D'abord, testons l'authentification
echo "1. Test d'authentification\n";

// Données de connexion (utilisez un utilisateur existant)
$loginData = [
    'email' => 'neverurora@mailinator.com',
    'password' => 'Pa$$w0rd!'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "$baseUrl/login");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($loginData));
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    $result = json_decode($response, true);
    $token = $result['token'];
    echo "   ✅ Connexion réussie, token obtenu\n";
    echo "   📋 Utilisateur: {$result['user']['name']}\n\n";
} else {
    echo "   ❌ Échec de connexion: HTTP $httpCode\n";
    echo "   📋 Réponse: $response\n";

    // Essayons de créer un utilisateur de test
    echo "\n2. Création d'un utilisateur de test\n";
    $registerData = [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'fan'
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "$baseUrl/register");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($registerData));
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 201) {
        $result = json_decode($response, true);
        $token = $result['token'];
        echo "   ✅ Utilisateur créé et connecté\n";
        echo "   📋 Utilisateur: {$result['user']['name']}\n\n";
    } else {
        echo "   ❌ Échec de création: HTTP $httpCode\n";
        echo "   📋 Réponse: $response\n";
        exit;
    }
}

// Maintenant testons le like
echo "3. Test de like du clip $clipId\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "$baseUrl/clips/$clipId/like");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json',
    'Authorization: Bearer ' . $token
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "   HTTP Code: $httpCode\n";
echo "   Réponse: $response\n";

if ($httpCode === 200) {
    $result = json_decode($response, true);
    echo "   ✅ Like fonctionne !\n";
    echo "   📊 Is liked: " . ($result['is_liked'] ? 'Oui' : 'Non') . "\n";
    echo "   📊 Likes count: {$result['likes_count']}\n";
    echo "   💬 Message: {$result['message']}\n";
} else {
    echo "   ❌ Erreur lors du like\n";

    if ($httpCode === 500) {
        echo "   🔍 Erreur serveur - vérifier les logs Laravel\n";
    }
}

echo "\n=== TEST TERMINÉ ===\n";
?>
