<?php

require_once __DIR__ . '/vendor/autoload.php';

use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use App\Http\Controllers\AudioLiveController;

// Créer le serveur WebSocket pour l'audio live
$audioServer = IoServer::factory(
    new HttpServer(
        new WsServer(
            new AudioLiveController()
        )
    ),
    8080 // Port pour l'audio WebSocket
);

echo "🎵 Serveur WebSocket Audio Live démarré sur le port 8080\n";
echo "📡 WebRTC Signaling Server actif\n";
echo "🔗 Connexion: ws://localhost:8080/ws/audio/{roomId}\n";
echo "▶️  Prêt pour les connexions audio...\n\n";

$audioServer->run(); 