<?php

echo "=== Test de création de son via API ===\n\n";

// Configuration
$baseUrl = 'http://127.0.0.1:8000/api';

echo "1. Test des routes disponibles:\n";
echo "- GET    $baseUrl/sounds (public)\n";
echo "- POST   $baseUrl/sounds (authentifié)\n";
echo "- PUT    $baseUrl/sounds/{id} (authentifié)\n";
echo "- DELETE $baseUrl/sounds/{id} (authentifié)\n\n";

echo "2. Exemple de données pour créer un son:\n";
$exampleData = [
    'title' => 'Mon nouveau beat',
    'description' => 'Un beat afrobeat moderne',
    'category_id' => 1,
    'genre' => 'Afrobeat',
    'price' => 2500,
    'is_free' => false,
    // 'audio_file' => 'fichier.mp3',
    // 'cover_image' => 'cover.jpg'
];

echo json_encode($exampleData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";

echo "3. Headers requis:\n";
echo "- Content-Type: multipart/form-data (pour les fichiers)\n";
echo "- Authorization: Bearer {token} (obligatoire)\n\n";

echo "4. Validation des champs:\n";
echo "- title: requis, string, max 255 caractères\n";
echo "- description: optionnel, string\n";
echo "- category_id: requis, doit exister dans la table categories\n";
echo "- genre: optionnel, string, max 100 caractères\n";
echo "- price: optionnel, numérique, >= 0\n";
echo "- is_free: boolean\n";
echo "- audio_file: requis, fichier mp3/wav/m4a, max 50MB\n";
echo "- cover_image: optionnel, image, max 5MB\n\n";

echo "5. Réponse en cas de succès (201):\n";
$successResponse = [
    'success' => true,
    'message' => 'Son créé avec succès',
    'sound' => [
        'id' => 123,
        'title' => 'Mon nouveau beat',
        'slug' => 'mon-nouveau-beat',
        'artist' => 'Nom de l\'utilisateur',
        'category' => 'Afrobeat',
        'price' => 2500,
        'is_free' => false,
        'status' => 'published'
    ]
];

echo json_encode($successResponse, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";

echo "6. Réponse en cas d'erreur (422):\n";
$errorResponse = [
    'success' => false,
    'message' => 'Données invalides',
    'errors' => [
        'title' => ['Le titre est requis.'],
        'category_id' => ['La catégorie sélectionnée est invalide.'],
        'audio_file' => ['Le fichier audio est requis.']
    ]
];

echo json_encode($errorResponse, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";

echo "✅ L'API est maintenant prête pour créer des sons !\n";
echo "📝 N'oubliez pas de vous authentifier d'abord avec POST /api/login\n";
