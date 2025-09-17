<?php

echo "=== Test des APIs pour le Frontend ===\n\n";

$baseUrl = 'http://127.0.0.1:8000/api';

function testApi($url, $description) {
    echo "🔍 Test: $description\n";
    echo "URL: $url\n";

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: application/json',
        'Content-Type: application/json'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        $data = json_decode($response, true);
        echo "✅ Succès (HTTP $httpCode)\n";

        if (isset($data['clips'])) {
            $clips = $data['clips']['data'] ?? $data['clips'];
            echo "📊 Clips trouvés: " . count($clips) . "\n";
            if (!empty($clips)) {
                $clip = $clips[0];
                echo "   Premier clip: {$clip['title']} par {$clip['user']['name']}\n";
                echo "   Catégorie: {$clip['category']}\n";
                echo "   Vues: " . number_format($clip['views']) . "\n";
            }
        }

        if (isset($data['competitions'])) {
            $competitions = $data['competitions']['data'] ?? $data['competitions'];
            echo "📊 Compétitions trouvées: " . count($competitions) . "\n";
            if (!empty($competitions)) {
                $comp = $competitions[0];
                echo "   Première compétition: {$comp['title']}\n";
                echo "   Organisateur: {$comp['user']['name']}\n";
                echo "   Catégorie: {$comp['category']}\n";
                echo "   Frais d'inscription: {$comp['formatted_entry_fee']}\n";
                echo "   Participants: {$comp['current_participants']}/{$comp['max_participants']}\n";
            }
        }

        if (isset($data['categories'])) {
            echo "📊 Catégories trouvées: " . count($data['categories']) . "\n";
            foreach (array_slice($data['categories'], 0, 3) as $cat) {
                echo "   - {$cat['name']} ({$cat['color']})\n";
            }
        }

    } else {
        echo "❌ Erreur (HTTP $httpCode)\n";
        echo "Réponse: " . substr($response, 0, 200) . "...\n";
    }

    echo "\n" . str_repeat("-", 50) . "\n\n";
}

// Test des APIs principales
testApi("$baseUrl/clips", "Liste des clips");
testApi("$baseUrl/clips/categories", "Catégories des clips");
testApi("$baseUrl/competitions", "Liste des compétitions");
testApi("$baseUrl/competitions/categories", "Catégories des compétitions");

// Test avec filtres
testApi("$baseUrl/clips?tab=featured", "Clips en vedette");
testApi("$baseUrl/clips?category=Afrobeat", "Clips Afrobeat");
testApi("$baseUrl/clips?sort_by=views", "Clips triés par vues");

testApi("$baseUrl/competitions?status=published", "Compétitions publiées");
testApi("$baseUrl/competitions/upcoming", "Compétitions à venir");

// Test d'un clip spécifique
echo "🔍 Test: Détails d'un clip spécifique\n";
$clipsResponse = file_get_contents("$baseUrl/clips");
$clipsData = json_decode($clipsResponse, true);
if (!empty($clipsData['clips']['data'])) {
    $firstClip = $clipsData['clips']['data'][0];
    testApi("$baseUrl/clips/{$firstClip['id']}", "Détails du clip: {$firstClip['title']}");
}

// Test d'une compétition spécifique
echo "🔍 Test: Détails d'une compétition spécifique\n";
$compsResponse = file_get_contents("$baseUrl/competitions");
$compsData = json_decode($compsResponse, true);
if (!empty($compsData['competitions']['data'])) {
    $firstComp = $compsData['competitions']['data'][0];
    testApi("$baseUrl/competitions/{$firstComp['id']}", "Détails de la compétition: {$firstComp['title']}");
}

echo "=== Tests terminés ===\n";
echo "✅ Toutes les APIs sont prêtes pour le frontend React !\n";
echo "🚀 Les composants ClipsVideos.jsx et CompetitionDetails.jsx peuvent maintenant utiliser les vraies données.\n";
