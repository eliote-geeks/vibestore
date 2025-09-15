<?php

namespace App\Http\Controllers;

use App\Models\Competition;
use App\Models\CompetitionParticipant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use SplObjectStorage;

class AudioLiveController implements MessageComponentInterface
{
    protected $clients;
    protected $rooms;
    protected $userConnections;
    protected $participantStatus;

    public function __construct()
    {
        $this->clients = new \SplObjectStorage;
        $this->rooms = [];
        $this->userConnections = [];
        $this->participantStatus = [];

        echo "🎵 AudioLiveController initialisé\n";
    }

    public function onOpen(ConnectionInterface $conn)
    {
        $this->clients->attach($conn);
        echo "🔗 Nouvelle connexion audio: {$conn->resourceId}\n";

        // Envoyer un message de bienvenue
        $conn->send(json_encode([
            'type' => 'connection-established',
            'connectionId' => $conn->resourceId,
            'message' => 'Connexion audio établie',
            'timestamp' => time()
        ]));
    }

    public function onMessage(ConnectionInterface $from, $msg)
    {
        try {
            $data = json_decode($msg, true);

            if (!$data || !isset($data['type'])) {
                $this->sendError($from, 'Format de message invalide');
                return;
            }

            echo "📨 Message reçu: {$data['type']} de {$from->resourceId}\n";

            switch ($data['type']) {
                case 'join-room':
                    $this->handleJoinRoom($from, $data);
                    break;

                case 'leave-room':
                    $this->handleLeaveRoom($from, $data);
                    break;

                case 'start-broadcasting':
                    $this->handleStartBroadcasting($from, $data);
                    break;

                case 'stop-broadcasting':
                    $this->handleStopBroadcasting($from, $data);
                    break;

                case 'webrtc-offer':
                    $this->handleWebRTCOffer($from, $data);
                    break;

                case 'webrtc-answer':
                    $this->handleWebRTCAnswer($from, $data);
                    break;

                case 'webrtc-ice-candidate':
                    $this->handleWebRTCIceCandidate($from, $data);
                    break;

                case 'user-speaking':
                    $this->handleUserSpeaking($from, $data);
                    break;

                case 'competition-update':
                    $this->handleCompetitionUpdate($from, $data);
                    break;

                case 'participant-change':
                    $this->handleParticipantChange($from, $data);
                    break;

                case 'heartbeat':
                    $this->handleHeartbeat($from, $data);
                    break;

                default:
                    $this->sendError($from, "Type de message non supporté: {$data['type']}");
            }

        } catch (\Exception $e) {
            echo "❌ Erreur lors du traitement du message: " . $e->getMessage() . "\n";
            $this->sendError($from, 'Erreur lors du traitement du message');
        }
    }

    public function onClose(ConnectionInterface $conn)
    {
        $this->clients->detach($conn);

        // Nettoyer les données de l'utilisateur
        $this->cleanupUserConnection($conn);

        echo "❌ Connexion fermée: {$conn->resourceId}\n";
    }

    public function onError(ConnectionInterface $conn, \Exception $e)
    {
        echo "💥 Erreur WebSocket: " . $e->getMessage() . "\n";
        Log::error('WebSocket Audio Error', [
            'connection_id' => $conn->resourceId,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);

        $conn->close();
    }

    // =============== GESTION DES ROOMS ===============

    protected function handleJoinRoom(ConnectionInterface $conn, array $data)
    {
        $roomId = $data['roomId'] ?? null;
        $userId = $data['userId'] ?? null;
        $userName = $data['userName'] ?? 'Utilisateur';
        $userRole = $data['userRole'] ?? 'spectator';

        if (!$roomId) {
            $this->sendError($conn, 'ID de room manquant');
            return;
        }

        // Initialiser la room si elle n'existe pas
        if (!isset($this->rooms[$roomId])) {
            $this->rooms[$roomId] = [
                'participants' => [],
                'broadcasters' => [],
                'listeners' => [],
                'currentPerformer' => null,
                'competitionId' => str_replace('competition_', '', $roomId)
            ];
        }

        // Ajouter l'utilisateur à la room
        $userInfo = [
            'connection' => $conn,
            'userId' => $userId,
            'userName' => $userName,
            'userRole' => $userRole,
            'connectionId' => $conn->resourceId,
            'joinedAt' => time(),
            'isBroadcasting' => false,
            'isListening' => true
        ];

        $this->rooms[$roomId]['participants'][$conn->resourceId] = $userInfo;
        $this->userConnections[$conn->resourceId] = [
            'roomId' => $roomId,
            'userInfo' => $userInfo
        ];

        // Informer les autres participants
        $this->broadcastToRoom($roomId, [
            'type' => 'user-joined',
            'userId' => $userId,
            'userName' => $userName,
            'userRole' => $userRole,
            'connectionId' => $conn->resourceId,
            'totalParticipants' => count($this->rooms[$roomId]['participants'])
        ], $conn);

        // Envoyer la liste des participants existants au nouveau client
        $conn->send(json_encode([
            'type' => 'room-joined',
            'roomId' => $roomId,
            'participants' => $this->getRoomParticipants($roomId),
            'currentBroadcasters' => array_keys($this->rooms[$roomId]['broadcasters']),
            'currentPerformer' => $this->rooms[$roomId]['currentPerformer']
        ]));

        echo "✅ Utilisateur {$userName} ({$userRole}) a rejoint la room {$roomId}\n";
    }

    protected function handleLeaveRoom(ConnectionInterface $conn, array $data)
    {
        $this->cleanupUserConnection($conn);
    }

    // =============== GESTION BROADCAST ===============

    protected function handleStartBroadcasting(ConnectionInterface $conn, array $data)
    {
        $userConnection = $this->userConnections[$conn->resourceId] ?? null;

        if (!$userConnection) {
            $this->sendError($conn, 'Utilisateur non trouvé dans une room');
            return;
        }

        $roomId = $userConnection['roomId'];
        $userId = $data['userId'] ?? null;
        $userName = $data['userName'] ?? 'Utilisateur';
        $userRole = $data['userRole'] ?? 'spectator';

        // Vérifier les permissions de diffusion
        $canBroadcast = $this->checkBroadcastPermissions($userRole, $roomId, $userId);

        if (!$canBroadcast['allowed']) {
            $this->sendError($conn, $canBroadcast['message']);
            return;
        }

        // Ajouter aux diffuseurs
        $this->rooms[$roomId]['broadcasters'][$conn->resourceId] = [
            'connection' => $conn,
            'userId' => $userId,
            'userName' => $userName,
            'userRole' => $userRole,
            'startedAt' => time()
        ];

        // Marquer comme diffuseur
        $this->rooms[$roomId]['participants'][$conn->resourceId]['isBroadcasting'] = true;

        // Si c'est un participant, le marquer comme performer actuel
        if ($userRole === 'current_participant') {
            $this->rooms[$roomId]['currentPerformer'] = [
                'userId' => $userId,
                'userName' => $userName,
                'connectionId' => $conn->resourceId,
                'startedAt' => time()
            ];
        }

        // Informer tous les participants
        $this->broadcastToRoom($roomId, [
            'type' => 'broadcasting-started',
            'userId' => $userId,
            'userName' => $userName,
            'userRole' => $userRole,
            'connectionId' => $conn->resourceId,
            'isCurrentPerformer' => $userRole === 'current_participant',
            'message' => $this->getBroadcastMessage($userRole, $userName)
        ]);

        echo "🎤 {$userName} ({$userRole}) a commencé à diffuser dans {$roomId}\n";
    }

    protected function handleStopBroadcasting(ConnectionInterface $conn, array $data)
    {
        $userConnection = $this->userConnections[$conn->resourceId] ?? null;

        if (!$userConnection) {
            return;
        }

        $roomId = $userConnection['roomId'];
        $userId = $data['userId'] ?? null;

        // Retirer des diffuseurs
        if (isset($this->rooms[$roomId]['broadcasters'][$conn->resourceId])) {
            $broadcasterInfo = $this->rooms[$roomId]['broadcasters'][$conn->resourceId];
            unset($this->rooms[$roomId]['broadcasters'][$conn->resourceId]);

            // Marquer comme non-diffuseur
            if (isset($this->rooms[$roomId]['participants'][$conn->resourceId])) {
                $this->rooms[$roomId]['participants'][$conn->resourceId]['isBroadcasting'] = false;
            }

            // Si c'était le performer actuel, le retirer
            if ($this->rooms[$roomId]['currentPerformer'] &&
                $this->rooms[$roomId]['currentPerformer']['connectionId'] === $conn->resourceId) {
                $this->rooms[$roomId]['currentPerformer'] = null;
            }

            // Informer tous les participants
            $this->broadcastToRoom($roomId, [
                'type' => 'broadcasting-stopped',
                'userId' => $userId,
                'userName' => $broadcasterInfo['userName'],
                'userRole' => $broadcasterInfo['userRole'],
                'connectionId' => $conn->resourceId
            ]);

            echo "🔇 {$broadcasterInfo['userName']} a arrêté de diffuser dans {$roomId}\n";
        }
    }

    // =============== GESTION WEBRTC ===============

    protected function handleWebRTCOffer(ConnectionInterface $from, array $data)
    {
        $targetUserId = $data['targetUserId'] ?? null;
        $offer = $data['offer'] ?? null;

        if (!$targetUserId || !$offer) {
            $this->sendError($from, 'Données WebRTC offer incomplètes');
            return;
        }

        $userConnection = $this->userConnections[$from->resourceId] ?? null;
        if (!$userConnection) {
            return;
        }

        $roomId = $userConnection['roomId'];

        // Trouver la connexion cible
        $targetConnection = $this->findUserConnectionInRoom($roomId, $targetUserId);

        if ($targetConnection) {
            $targetConnection->send(json_encode([
                'type' => 'webrtc-offer',
                'offer' => $offer,
                'fromUserId' => $userConnection['userInfo']['userId'],
                'fromUserName' => $userConnection['userInfo']['userName']
            ]));

            echo "📡 WebRTC Offer envoyé de {$userConnection['userInfo']['userName']} vers {$targetUserId}\n";
        }
    }

    protected function handleWebRTCAnswer(ConnectionInterface $from, array $data)
    {
        $targetUserId = $data['targetUserId'] ?? null;
        $answer = $data['answer'] ?? null;

        if (!$targetUserId || !$answer) {
            $this->sendError($from, 'Données WebRTC answer incomplètes');
            return;
        }

        $userConnection = $this->userConnections[$from->resourceId] ?? null;
        if (!$userConnection) {
            return;
        }

        $roomId = $userConnection['roomId'];

        // Trouver la connexion cible
        $targetConnection = $this->findUserConnectionInRoom($roomId, $targetUserId);

        if ($targetConnection) {
            $targetConnection->send(json_encode([
                'type' => 'webrtc-answer',
                'answer' => $answer,
                'fromUserId' => $userConnection['userInfo']['userId'],
                'fromUserName' => $userConnection['userInfo']['userName']
            ]));

            echo "📡 WebRTC Answer envoyé de {$userConnection['userInfo']['userName']} vers {$targetUserId}\n";
        }
    }

    protected function handleWebRTCIceCandidate(ConnectionInterface $from, array $data)
    {
        $targetUserId = $data['targetUserId'] ?? null;
        $candidate = $data['candidate'] ?? null;

        if (!$targetUserId || !$candidate) {
            return;
        }

        $userConnection = $this->userConnections[$from->resourceId] ?? null;
        if (!$userConnection) {
            return;
        }

        $roomId = $userConnection['roomId'];

        // Trouver la connexion cible
        $targetConnection = $this->findUserConnectionInRoom($roomId, $targetUserId);

        if ($targetConnection) {
            $targetConnection->send(json_encode([
                'type' => 'webrtc-ice-candidate',
                'candidate' => $candidate,
                'fromUserId' => $userConnection['userInfo']['userId']
            ]));
        }
    }

    // =============== GESTION COMPÉTITION ===============

    protected function handleParticipantChange(ConnectionInterface $from, array $data)
    {
        $userConnection = $this->userConnections[$from->resourceId] ?? null;
        if (!$userConnection) {
            return;
        }

        $roomId = $userConnection['roomId'];
        $newPerformerId = $data['newPerformerId'] ?? null;
        $newPerformerName = $data['newPerformerName'] ?? null;

        // Vérifier que l'utilisateur est admin
        $userRole = $userConnection['userInfo']['userRole'];
        if (!in_array($userRole, ['competition_admin', 'platform_admin'])) {
            $this->sendError($from, 'Permissions insuffisantes pour changer de participant');
            return;
        }

        // Arrêter le diffuseur actuel s'il y en a un
        if ($this->rooms[$roomId]['currentPerformer']) {
            $currentPerformerConn = $this->findConnectionById($this->rooms[$roomId]['currentPerformer']['connectionId']);
            if ($currentPerformerConn) {
                $this->handleStopBroadcasting($currentPerformerConn, [
                    'userId' => $this->rooms[$roomId]['currentPerformer']['userId']
                ]);
            }
        }

        // Informer tout le monde du changement
        $this->broadcastToRoom($roomId, [
            'type' => 'participant-changed',
            'newPerformerId' => $newPerformerId,
            'newPerformerName' => $newPerformerName,
            'adminName' => $userConnection['userInfo']['userName'],
            'message' => "🎵 {$newPerformerName} monte sur scène ! À vous de jouer !"
        ]);

        echo "🔄 Admin {$userConnection['userInfo']['userName']} a changé le participant vers {$newPerformerName}\n";
    }

    protected function handleCompetitionUpdate(ConnectionInterface $from, array $data)
    {
        $userConnection = $this->userConnections[$from->resourceId] ?? null;
        if (!$userConnection) {
            return;
        }

        $roomId = $userConnection['roomId'];

        // Diffuser la mise à jour à tous les participants
        $this->broadcastToRoom($roomId, [
            'type' => 'competition-updated',
            'updateType' => $data['updateType'] ?? 'general',
            'data' => $data['data'] ?? [],
            'timestamp' => time()
        ]);
    }

    protected function handleUserSpeaking(ConnectionInterface $from, array $data)
    {
        $userConnection = $this->userConnections[$from->resourceId] ?? null;
        if (!$userConnection) {
            return;
        }

        $roomId = $userConnection['roomId'];
        $userId = $data['userId'] ?? null;
        $userRole = $data['userRole'] ?? 'spectator';

        // Informer les autres de l'activité vocale
        $this->broadcastToRoom($roomId, [
            'type' => 'user-speaking',
            'userId' => $userId,
            'userRole' => $userRole,
            'connectionId' => $from->resourceId,
            'timestamp' => time()
        ], $from);
    }

    protected function handleHeartbeat(ConnectionInterface $from, array $data)
    {
        // Répondre au ping pour maintenir la connexion
        $from->send(json_encode([
            'type' => 'heartbeat-response',
            'timestamp' => time()
        ]));
    }

    // =============== FONCTIONS UTILITAIRES ===============

    protected function checkBroadcastPermissions(string $userRole, string $roomId, $userId): array
    {
        switch ($userRole) {
            case 'current_participant':
                return ['allowed' => true, 'message' => ''];

            case 'competition_admin':
            case 'platform_admin':
                return ['allowed' => true, 'message' => ''];

            default:
                return [
                    'allowed' => false,
                    'message' => 'Seuls les participants en cours de performance et les administrateurs peuvent diffuser'
                ];
        }
    }

    protected function getBroadcastMessage(string $userRole, string $userName): string
    {
        switch ($userRole) {
            case 'current_participant':
                return "🎤 {$userName} commence sa PERFORMANCE EN DIRECT ! 🎵";

            case 'competition_admin':
                return "👑 L'organisateur {$userName} diffuse maintenant";

            case 'platform_admin':
                return "⚡ L'administrateur {$userName} diffuse maintenant";

            default:
                return "🔊 {$userName} diffuse maintenant";
        }
    }

    protected function broadcastToRoom(string $roomId, array $message, ConnectionInterface $exclude = null)
    {
        if (!isset($this->rooms[$roomId])) {
            return;
        }

        $messageJson = json_encode($message);

        foreach ($this->rooms[$roomId]['participants'] as $participant) {
            if ($exclude && $participant['connection'] === $exclude) {
                continue;
            }

            try {
                $participant['connection']->send($messageJson);
            } catch (\Exception $e) {
                echo "❌ Erreur envoi message à {$participant['userName']}: " . $e->getMessage() . "\n";
            }
        }
    }

    protected function findUserConnectionInRoom(string $roomId, $userId): ?ConnectionInterface
    {
        if (!isset($this->rooms[$roomId])) {
            return null;
        }

        foreach ($this->rooms[$roomId]['participants'] as $participant) {
            if ($participant['userId'] == $userId) {
                return $participant['connection'];
            }
        }

        return null;
    }

    protected function findConnectionById(string $connectionId): ?ConnectionInterface
    {
        foreach ($this->clients as $client) {
            if ($client->resourceId == $connectionId) {
                return $client;
            }
        }

        return null;
    }

    protected function getRoomParticipants(string $roomId): array
    {
        if (!isset($this->rooms[$roomId])) {
            return [];
        }

        $participants = [];
        foreach ($this->rooms[$roomId]['participants'] as $participant) {
            $participants[] = [
                'userId' => $participant['userId'],
                'userName' => $participant['userName'],
                'userRole' => $participant['userRole'],
                'connectionId' => $participant['connectionId'],
                'isBroadcasting' => $participant['isBroadcasting'],
                'isListening' => $participant['isListening'],
                'joinedAt' => $participant['joinedAt']
            ];
        }

        return $participants;
    }

    protected function cleanupUserConnection(ConnectionInterface $conn)
    {
        $connectionId = $conn->resourceId;

        if (isset($this->userConnections[$connectionId])) {
            $userConnection = $this->userConnections[$connectionId];
            $roomId = $userConnection['roomId'];
            $userInfo = $userConnection['userInfo'];

            // Retirer de la room
            if (isset($this->rooms[$roomId])) {
                unset($this->rooms[$roomId]['participants'][$connectionId]);
                unset($this->rooms[$roomId]['broadcasters'][$connectionId]);

                // Si c'était le performer actuel, le retirer
                if ($this->rooms[$roomId]['currentPerformer'] &&
                    $this->rooms[$roomId]['currentPerformer']['connectionId'] === $connectionId) {
                    $this->rooms[$roomId]['currentPerformer'] = null;
                }

                // Informer les autres participants
                $this->broadcastToRoom($roomId, [
                    'type' => 'user-left',
                    'userId' => $userInfo['userId'],
                    'userName' => $userInfo['userName'],
                    'userRole' => $userInfo['userRole'],
                    'connectionId' => $connectionId,
                    'totalParticipants' => count($this->rooms[$roomId]['participants'])
                ]);

                // Nettoyer la room si elle est vide
                if (empty($this->rooms[$roomId]['participants'])) {
                    unset($this->rooms[$roomId]);
                    echo "🧹 Room {$roomId} supprimée (vide)\n";
                }
            }

            unset($this->userConnections[$connectionId]);
            echo "🧹 Connexion {$userInfo['userName']} nettoyée\n";
        }
    }

    protected function sendError(ConnectionInterface $conn, string $message)
    {
        $conn->send(json_encode([
            'type' => 'error',
            'message' => $message,
            'timestamp' => time()
        ]));
    }

    // API REST pour obtenir les statistiques audio
    public function getAudioStats(Request $request, $competitionId)
    {
        $roomId = "competition_{$competitionId}";
        $totalConnections = count($this->rooms[$roomId] ?? []);

        $broadcasters = 0;
        $listeners = 0;

        if (isset($this->rooms[$roomId])) {
            foreach ($this->rooms[$roomId] as $client) {
                if ($client->broadcaster ?? false) {
                    $broadcasters++;
                } else {
                    $listeners++;
                }
            }
        }

        return response()->json([
            'success' => true,
            'stats' => [
                'total_connections' => $totalConnections,
                'broadcasters' => $broadcasters,
                'listeners' => $listeners,
                'room_id' => $roomId
            ]
        ]);
    }
}
