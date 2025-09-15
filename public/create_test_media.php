<?php

// Script pour créer des médias de test et corriger les chemins

// Configuration des chemins
$basePublic = __DIR__;
$storageClips = __DIR__ . '/../storage/app/public/clips';
$publicClips = __DIR__ . '/storage/clips';

// Créer les dossiers nécessaires
$dirs = [
    $storageClips . '/videos',
    $storageClips . '/thumbnails',
    $publicClips . '/videos',
    $publicClips . '/thumbnails'
];

foreach ($dirs as $dir) {
    if (!file_exists($dir)) {
        mkdir($dir, 0755, true);
        echo "Dossier créé: $dir\n";
    }
}

// Créer des fichiers vidéo de test (fichiers vides mais avec les bonnes extensions)
$testVideos = [
    'afrobeat-vibes.mp4',
    'rap-camerounais.mp4',
    'makossa-traditionnel.mp4',
    'gospel-moderne.mp4',
    'zouk-passion.mp4'
];

foreach ($testVideos as $video) {
    $storageFile = $storageClips . '/videos/' . $video;
    $publicFile = $publicClips . '/videos/' . $video;

    if (!file_exists($storageFile)) {
        file_put_contents($storageFile, '');
        echo "Fichier vidéo créé: $video\n";
    }

    // Créer aussi dans public/storage pour l'accès direct
    if (!file_exists($publicFile)) {
        file_put_contents($publicFile, '');
    }
}

// Créer des miniatures de test (fichiers vides avec extension jpg)
$testThumbnails = [
    'afrobeat-vibes.jpg',
    'rap-camerounais.jpg',
    'makossa-traditionnel.jpg',
    'gospel-moderne.jpg',
    'zouk-passion.jpg'
];

foreach ($testThumbnails as $thumbnail) {
    $storageFile = $storageClips . '/thumbnails/' . $thumbnail;
    $publicFile = $publicClips . '/thumbnails/' . $thumbnail;

    if (!file_exists($storageFile)) {
        file_put_contents($storageFile, '');
        echo "Miniature créée: $thumbnail\n";
    }

    // Créer aussi dans public/storage pour l'accès direct
    if (!file_exists($publicFile)) {
        file_put_contents($publicFile, '');
    }
}

echo "\n=== Médias de test créés ===\n";

// Maintenant, mettons à jour la base de données pour corriger les URLs
require_once __DIR__ . '/../vendor/autoload.php';

try {
    // Configuration de la base de données (ajustez selon votre configuration)
    $host = 'localhost';
    $port = '5432';
    $dbname = 'reveilartist';
    $username = 'postgres';
    $password = 'Dieunedort@1997';

    $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Mettre à jour les clips avec les bonnes URLs
    $clips = [
        ['id' => 8, 'video' => 'gospel-moderne.mp4', 'thumbnail' => 'gospel-moderne.jpg'],
        ['id' => 9, 'video' => 'zouk-passion.mp4', 'thumbnail' => 'zouk-passion.jpg'],
    ];

    foreach ($clips as $clip) {
        $stmt = $pdo->prepare("
            UPDATE clips
            SET video_path = ?, thumbnail_path = ?
            WHERE id = ?
        ");

        $videoPath = 'clips/videos/' . $clip['video'];
        $thumbnailPath = 'clips/thumbnails/' . $clip['thumbnail'];

        $stmt->execute([$videoPath, $thumbnailPath, $clip['id']]);
        echo "Clip {$clip['id']} mis à jour avec $videoPath et $thumbnailPath\n";
    }

    echo "\n=== Base de données mise à jour ===\n";

} catch (Exception $e) {
    echo "Erreur base de données: " . $e->getMessage() . "\n";
}

echo "\n✅ Script terminé !\n";
echo "Les médias sont maintenant disponibles via /storage/clips/videos/ et /storage/clips/thumbnails/\n";
?>
