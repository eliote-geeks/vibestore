import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Form, InputGroup, ProgressBar, ListGroup, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTrophy,
    faPlay,
    faPause,
    faStop,
    faClock,
    faUsers,
    faCoins,
    faArrowLeft,
    faHeart,
    faThumbsUp,
    faThumbsDown,
    faComment,
    faPaperPlane,
    faMicrophone,
    faVolumeUp,
    faVolumeMute,
    faCrown,
    faFire,
    faEye,
    faShare,
    faStar,
    faMusic,
    faHeadphones,
    faLightbulb,
    faRecordVinyl,
    faStopCircle,
    faCheckCircle,
    faTimesCircle,
    faUserFriends,
    faGift,
    faCalendarAlt,
    faRocket,
    faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import LoadingScreen from '../common/LoadingScreen';
import { AnimatedElement } from '../common/PageTransition';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const LiveCompetition = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isDemoMode = searchParams.get('demo') === 'true';

    const [loading, setLoading] = useState(true);
    const [competition, setCompetition] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [currentPerformer, setCurrentPerformer] = useState(null);
    const [performanceQueue, setPerformanceQueue] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [reactions, setReactions] = useState({});
    const [viewers, setViewers] = useState(0);
    const [phase, setPhase] = useState('waiting'); // waiting, performing, voting, results
    const [timeLeft, setTimeLeft] = useState('');
    const [isUserParticipant, setIsUserParticipant] = useState(false);
    const [userVotes, setUserVotes] = useState({});
    const [liveStats, setLiveStats] = useState({ likes: 0, comments: 0, shares: 0 });
    const [competitionStarted, setCompetitionStarted] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    // États pour le live audio
    const [isLiveAudioEnabled, setIsLiveAudioEnabled] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [audioConnections, setAudioConnections] = useState(new Map());
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState(new Map());
    const [roomId, setRoomId] = useState(`competition_${id}`);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);
    const chatContainerRef = useRef(null);
    const websocketRef = useRef(null);

    // Refs pour WebRTC
    const localAudioRef = useRef(null);
    const remoteAudiosRef = useRef(new Map());
    const peerConnections = useRef(new Map());
    const webrtcSocket = useRef(null);

    const toast = useToast();
    const { user, token } = useAuth();

    // Nouvel état pour les animations de réactions
    const [reactionAnimations, setReactionAnimations] = useState([]);

    // Timer pour la performance individuelle (3 minutes par participant)
    const [performanceTimer, setPerformanceTimer] = useState(null);
    const [performanceTimeLeft, setPerformanceTimeLeft] = useState(180); // 3 minutes en secondes

    // Données de démonstration
    const demoParticipants = [
            {
                id: 1,
            user: {
                id: user?.id || 1, // Utiliser l'ID de l'utilisateur connecté ou 1 par défaut
                name: user?.name || 'MC Freestyle',
                avatar_url: user?.avatar_url || 'https://ui-avatars.com/api/?name=MC+Freestyle&background=3b82f6&color=fff'
            },
            performance_title: 'Ma Performance Live',
            status: 'performing' // Statut par défaut
            },
            {
                id: 2,
            user: {
                id: 2,
                name: 'Queen Vocal',
                avatar_url: 'https://ui-avatars.com/api/?name=Queen+Vocal&background=e74c3c&color=fff'
            },
            performance_title: 'Afrobeat Vibes',
            status: 'waiting'
            },
            {
                id: 3,
            user: {
                id: 3,
                name: 'Beat Master',
                avatar_url: 'https://ui-avatars.com/api/?name=Beat+Master&background=2ecc71&color=fff'
            },
            performance_title: 'Urban Flow',
            status: 'completed'
        },
        {
            id: 4,
            user: {
                id: 4,
                name: 'Melody Star',
                avatar_url: 'https://ui-avatars.com/api/?name=Melody+Star&background=f39c12&color=fff'
            },
            performance_title: 'Soul Expression',
            status: 'waiting'
        },
        {
            id: 5,
            user: {
                id: 5,
                name: 'Flow King',
                avatar_url: 'https://ui-avatars.com/api/?name=Flow+King&background=9b59b6&color=fff'
            },
            performance_title: 'Hip-Hop Legacy',
            status: 'waiting'
        }
    ];

    const demoChatMessages = [
        {
            id: 1,
            user: { name: 'MusicFan237' },
            message: 'Cette compétition est incroyable ! 🔥',
            created_at: new Date().toISOString()
        },
        {
            id: 2,
            user: { name: 'BeatLover' },
            message: 'MC Freestyle est sur le feu ! 💪',
            created_at: new Date().toISOString()
        },
        {
            id: 3,
            user: { name: 'VocalExpert' },
            message: 'Le niveau est vraiment élevé cette année',
            created_at: new Date().toISOString()
        },
        {
            id: 4,
            user: { name: 'CamerounPride' },
            message: 'Représentation du Cameroun ! 🇨🇲',
            created_at: new Date().toISOString()
        }
    ];

    useEffect(() => {
        if (isDemoMode) {
            loadDemoData();
        } else {
        loadCompetition();
        }
        // Initialiser WebSocket pour tous les modes (pas seulement démo)
        initializeWebSocket();

        return () => {
            // Nettoyer toutes les connexions
            if (websocketRef.current) {
                websocketRef.current.close();
            }
            if (webrtcSocket.current) {
                webrtcSocket.current.close();
            }
            // Arrêter tous les streams
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [id, isDemoMode]);

    useEffect(() => {
        if (competition) {
            startLiveTimer();
            if (!isDemoMode) {
                loadParticipants();
                loadChatMessages();
            }
        }
    }, [competition, isDemoMode]);

    useEffect(() => {
        // Auto-scroll chat to bottom
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const loadDemoData = async () => {
        try {
            setLoading(true);

            // Simuler le chargement de données de démonstration
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Créer une compétition fictive
            const demoCompetition = {
                id: parseInt(id),
                title: 'Battle of Champions - DEMO',
                description: 'Une compétition de démonstration pour tester l\'interface live',
                category: 'Rap',
                entry_fee: 5000,
                max_participants: 20,
                current_participants: 5,
                start_date: new Date().toISOString().split('T')[0],
                start_time: '20:00',
                duration: 120,
                status: 'active',
                user: {
                    id: 99,
                    name: 'Admin Demo'
                }
            };

            setCompetition(demoCompetition);
            setParticipants(demoParticipants);
            setCurrentPerformer(demoParticipants[0]); // Premier participant comme performer par défaut en démo
            setChatMessages(demoChatMessages);
            setIsUserParticipant(true);
            setPhase('performing'); // Directement en phase de performance pour les tests
            setViewers(Math.floor(Math.random() * 500) + 150);

            // En mode démo, considérer l'utilisateur comme admin ET comme participant actuel
            setIsAdmin(true);
            setCompetitionStarted(true); // Compétition déjà lancée en mode démo

            // Initialiser les réactions de démonstration
            const demoReactions = {};
            demoParticipants.forEach(participant => {
                demoReactions[participant.id] = {
                    hearts: Math.floor(Math.random() * 50) + 10,
                    likes: Math.floor(Math.random() * 75) + 20,
                    fire: Math.floor(Math.random() * 30) + 5
                };
            });
            setReactions(demoReactions);

        } catch (error) {
            console.error('Erreur lors du chargement des données de démo:', error);
            toast?.error('Erreur', 'Impossible de charger la démonstration');
        } finally {
            setLoading(false);
        }
    };

    const loadCompetition = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/competitions/${id}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Compétition non trouvée');
            }

            setCompetition(result.competition);
            setIsUserParticipant(result.user_participation ? true : false);
            setViewers(Math.floor(Math.random() * 500) + 50); // Simuler les viewers initiaux

            // Vérifier si l'utilisateur est l'organisateur (admin) de la compétition
            const isCompetitionOwner = user && result.competition.user_id === user.id;
            setIsAdmin(isCompetitionOwner);
            setCompetitionStarted(false); // Par défaut, la compétition n'a pas commencé

        } catch (error) {
            console.error('Erreur:', error);
            toast?.error('Erreur', error.message);
            navigate('/competitions');
        } finally {
            setLoading(false);
        }
    };

    const loadParticipants = async () => {
        try {
            const response = await fetch(`/api/competitions/${id}/participants`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            const result = await response.json();

            if (response.ok) {
                setParticipants(result.participants || []);
                setPerformanceQueue(result.participants || []);

                // Trouver le participant actuel en performance
                const current = result.participants?.find(p => p.status === 'performing');
                setCurrentPerformer(current || null);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des participants:', error);
        }
    };

    const loadChatMessages = async () => {
        try {
            const response = await fetch(`/api/competitions/${id}/chat`);
            const result = await response.json();

            if (response.ok) {
                setChatMessages(result.messages || []);
            }
        } catch (error) {
            console.error('Erreur lors du chargement du chat:', error);
        }
    };

    const initializeWebSocket = () => {
        // Détection automatique du mode hébergement
        const isDevelopment = import.meta.env.VITE_APP_ENV === 'development';
        const isProduction = import.meta.env.VITE_APP_ENV === 'production';
        const disableWebSocketInDev = import.meta.env.VITE_DISABLE_WEBSOCKET_DEV === 'true';
        const disableWebSocketInProd = import.meta.env.VITE_DISABLE_WEBSOCKET_PROD === 'true';

        // En production sur hébergement mutualisé, désactiver WebSocket
        if (isProduction && disableWebSocketInProd) {
            console.log('🌐 Mode production hébergement mutualisé - WebSocket désactivé');
            toast?.info('Mode production', 'Fonctionnalités live simulées - Hébergement mutualisé');

            // Utiliser uniquement les updates de simulation
            const interval = setInterval(() => {
                updateLiveData();
            }, 5000); // Plus lent en production

            return () => clearInterval(interval);
        }

        // En mode développement local, vérifier si on veut utiliser le WebSocket
        if (isDevelopment && disableWebSocketInDev) {
            console.log('🔇 WebSocket désactivé en mode développement');
            toast?.info('Mode développement', 'WebSocket désactivé - Utilisation du mode démo');

            // Utiliser uniquement les updates de démo
            const interval = setInterval(() => {
                updateLiveData();
            }, 3000);

            return () => clearInterval(interval);
        }

        if (isDemoMode) {
            // En mode démo, simuler WebSocket avec des updates périodiques
            const interval = setInterval(() => {
                updateLiveData();
            }, 3000);

            return () => clearInterval(interval);
        } else {
            // Mode réel : initialiser vraie connexion WebSocket
            initializeRealWebSocket();
        }
    };

    const initializeRealWebSocket = () => {
        try {
            // WebSocket principal pour les updates de compétition
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsHost = window.location.hostname;
            const wsPort = import.meta.env.VITE_WS_PORT || '8080';
            const wsUrl = `${wsProtocol}//${wsHost}:${wsPort}`;

            console.log('🔗 Connexion WebSocket:', wsUrl);

            websocketRef.current = new WebSocket(wsUrl);

            websocketRef.current.onopen = () => {
                console.log('✅ WebSocket connecté');
                toast?.success('Live', 'Connexion en temps réel établie');

                // Rejoindre la room de compétition
                websocketRef.current.send(JSON.stringify({
                    type: 'join-room',
                    roomId: `competition_${id}`,
                    userId: user?.id || 'anonymous',
                    userName: user?.name || 'Visiteur',
                    userRole: getUserRole()
                }));
            };

            websocketRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    handleWebSocketMessage(data);
                } catch (error) {
                    console.error('❌ Erreur parsing WebSocket message:', error);
                }
            };

            websocketRef.current.onclose = (event) => {
                console.log('❌ WebSocket fermé:', event.code, event.reason);

                if (event.code !== 1000) { // Pas une fermeture normale
                    toast?.warning('Live', 'Connexion interrompue, tentative de reconnexion...');

                    // Reconnexion automatique après 3 secondes
                    setTimeout(() => {
                        if (!websocketRef.current || websocketRef.current.readyState === WebSocket.CLOSED) {
                            initializeRealWebSocket();
                        }
                    }, 3000);
                }
            };

            websocketRef.current.onerror = (error) => {
                console.error('❌ Erreur WebSocket:', error);
                toast?.warning('Live', 'Serveur WebSocket non disponible (mode hors ligne)');
            };

        } catch (error) {
            console.error('❌ Erreur initialisation WebSocket:', error);
            toast?.info('Mode hors ligne', 'Fonctionnalités live limitées - Serveur WebSocket non disponible');
        }
    };

    const handleWebSocketMessage = (data) => {
        console.log('📨 Message WebSocket reçu:', data.type);

        switch (data.type) {
            case 'connection-established':
                console.log('🔗 Connexion établie:', data.connectionId);
                break;

            case 'room-joined':
                console.log('🏠 Room rejointe:', data.roomId);
                handleRoomJoined(data);
                break;

            case 'user-joined':
                handleUserJoined(data);
                break;

            case 'user-left':
                handleUserLeft(data);
                break;

            case 'broadcasting-started':
                handleBroadcastingStarted(data);
                break;

            case 'broadcasting-stopped':
                handleBroadcastingStopped(data);
                break;

            case 'participant-changed':
                handleParticipantChanged(data);
                break;

            case 'user-speaking':
                handleUserSpeaking(data);
                break;

            case 'webrtc-offer':
                handleWebRTCOffer(data);
                break;

            case 'webrtc-answer':
                handleWebRTCAnswer(data);
                break;

            case 'webrtc-ice-candidate':
                handleWebRTCIceCandidate(data);
                break;

            case 'competition-updated':
                handleCompetitionUpdate(data);
                break;

            case 'error':
                console.error('❌ Erreur serveur:', data.message);
                toast?.error('Erreur', data.message);
                break;

            case 'heartbeat-response':
                // Heartbeat reçu
                break;

            default:
                console.log('❓ Type de message non géré:', data.type);
        }
    };

    // =============== HANDLERS WebSocket ===============

    const handleRoomJoined = (data) => {
        console.log('🏠 Room rejointe avec succès:', data);
        setViewers(data.participants.length);

        // Si il y a des diffuseurs actifs, se connecter à eux
        if (data.currentBroadcasters && data.currentBroadcasters.length > 0) {
            data.currentBroadcasters.forEach(broadcasterId => {
                if (broadcasterId !== user?.id) {
                    initiateWebRTCConnection(broadcasterId);
                }
            });
        }
    };

    const handleUserJoined = (data) => {
        console.log('👋 Utilisateur rejoint:', data.userName);
        setViewers(data.totalParticipants);

        // Message dans le chat
        const joinMessage = {
            id: Date.now(),
            user: { name: 'Système 🔗' },
            message: `👋 ${data.userName} a rejoint la diffusion`,
            created_at: new Date().toISOString(),
            isSystem: true
        };
        setChatMessages(prev => [...prev.slice(-50), joinMessage]);
    };

    const handleUserLeft = (data) => {
        console.log('👋 Utilisateur parti:', data.userName);
        setViewers(data.totalParticipants);

        // Nettoyer les connexions WebRTC
        if (peerConnections.current.has(data.userId)) {
            peerConnections.current.get(data.userId).close();
            peerConnections.current.delete(data.userId);
        }

        // Nettoyer les streams distants
        if (remoteStreams.has(data.userId)) {
            const stream = remoteStreams.get(data.userId);
            stream.getTracks().forEach(track => track.stop());
            remoteStreams.delete(data.userId);
            setRemoteStreams(new Map(remoteStreams));
        }
    };

    const handleBroadcastingStarted = (data) => {
        console.log('🎤 Diffusion démarrée par:', data.userName);

        // Message dans le chat
        const broadcastMessage = {
            id: Date.now(),
            user: { name: 'Système Audio 🎵' },
            message: data.message,
            created_at: new Date().toISOString(),
            isSystem: true
        };
        setChatMessages(prev => [...prev.slice(-50), broadcastMessage]);

        // Si ce n'est pas nous qui diffusons, initier une connexion WebRTC
        if (data.userId !== user?.id && isListening) {
            initiateWebRTCConnection(data.userId);
        }

        // Mettre à jour le participant actuel si nécessaire
        if (data.isCurrentPerformer) {
            setCurrentPerformer(prev => ({
                ...prev,
                user: { id: data.userId, name: data.userName },
                status: 'performing'
            }));
        }
    };

    const handleBroadcastingStopped = (data) => {
        console.log('🔇 Diffusion arrêtée par:', data.userName);

        // Message dans le chat
        const stopMessage = {
            id: Date.now(),
            user: { name: 'Système Audio 🎵' },
            message: `🔇 ${data.userName} a arrêté sa diffusion`,
            created_at: new Date().toISOString(),
            isSystem: true
        };
        setChatMessages(prev => [...prev.slice(-50), stopMessage]);

        // Nettoyer les connexions WebRTC
        if (peerConnections.current.has(data.userId)) {
            peerConnections.current.get(data.userId).close();
            peerConnections.current.delete(data.userId);
        }
    };

    const handleParticipantChanged = (data) => {
        console.log('🔄 Participant changé:', data.newPerformerName);

        // Arrêter notre diffusion si on diffusait
        if (isBroadcasting) {
            stopAudioBroadcast();
        }

        // Mettre à jour le participant actuel
        setCurrentPerformer({
            user: { id: data.newPerformerId, name: data.newPerformerName },
            status: 'performing'
        });

        // Message dans le chat
        const changeMessage = {
            id: Date.now(),
            user: { name: 'Système 🎤' },
            message: data.message,
            created_at: new Date().toISOString(),
            isSystem: true
        };
        setChatMessages(prev => [...prev.slice(-50), changeMessage]);

        // Notifier l'utilisateur
        if (isListening) {
            toast?.info('🎧 Nouveau participant', `${data.newPerformerName} peut maintenant diffuser`);
        }
    };

    const handleUserSpeaking = (data) => {
        // Mettre en évidence le participant qui parle
        highlightSpeaker(data.userId);
    };

    const handleCompetitionUpdate = (data) => {
        console.log('🏆 Mise à jour compétition:', data.updateType);

        switch (data.updateType) {
            case 'phase-change':
                setPhase(data.data.newPhase);
                break;

            case 'reactions-update':
                setReactions(prev => ({
                    ...prev,
                    [data.data.participantId]: data.data.reactions
                }));
                break;

            case 'timer-update':
                setTimeLeft(data.data.timeLeft);
                break;
        }
    };

    // =============== WebRTC REAL IMPLEMENTATION ===============

    const initiateWebRTCConnection = async (targetUserId) => {
        try {
            console.log('🔗 Initiation connexion WebRTC vers:', targetUserId);

            const peerConnection = new RTCPeerConnection(rtcConfig);
            peerConnections.current.set(targetUserId, peerConnection);

            // Gérer les ICE candidates
            peerConnection.onicecandidate = (event) => {
                if (event.candidate && websocketRef.current) {
                    websocketRef.current.send(JSON.stringify({
                        type: 'webrtc-ice-candidate',
                        targetUserId: targetUserId,
                        candidate: event.candidate
                    }));
                }
            };

            // Gérer les streams entrants
            peerConnection.ontrack = (event) => {
                console.log('🎵 Stream reçu de:', targetUserId);
                const [remoteStream] = event.streams;
                addRemoteStream(targetUserId, remoteStream);
            };

            // Créer et envoyer l'offre
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            if (websocketRef.current) {
                websocketRef.current.send(JSON.stringify({
                    type: 'webrtc-offer',
                    targetUserId: targetUserId,
                    offer: offer
                }));
            }

        } catch (error) {
            console.error('❌ Erreur initiation WebRTC:', error);
        }
    };

    const handleWebRTCOffer = async (data) => {
        try {
            console.log('📞 Offer WebRTC reçu de:', data.fromUserName);

            const peerConnection = new RTCPeerConnection(rtcConfig);
            peerConnections.current.set(data.fromUserId, peerConnection);

            // Ajouter notre stream local si on diffuse
            if (localStream) {
                localStream.getTracks().forEach(track => {
                    peerConnection.addTrack(track, localStream);
                });
            }

            // Gérer les ICE candidates
            peerConnection.onicecandidate = (event) => {
                if (event.candidate && websocketRef.current) {
                    websocketRef.current.send(JSON.stringify({
                        type: 'webrtc-ice-candidate',
                        targetUserId: data.fromUserId,
                        candidate: event.candidate
                    }));
                }
            };

            // Gérer les streams entrants
            peerConnection.ontrack = (event) => {
                console.log('🎵 Stream reçu de:', data.fromUserName);
                const [remoteStream] = event.streams;
                addRemoteStream(data.fromUserId, remoteStream);
            };

            // Accepter l'offre et créer la réponse
            await peerConnection.setRemoteDescription(data.offer);
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            if (websocketRef.current) {
                websocketRef.current.send(JSON.stringify({
                    type: 'webrtc-answer',
                    targetUserId: data.fromUserId,
                    answer: answer
                }));
            }

        } catch (error) {
            console.error('❌ Erreur gestion offer WebRTC:', error);
        }
    };

    const handleWebRTCAnswer = async (data) => {
        try {
            console.log('✅ Answer WebRTC reçu de:', data.fromUserName);

            const peerConnection = peerConnections.current.get(data.fromUserId);
            if (peerConnection) {
                await peerConnection.setRemoteDescription(data.answer);
            }

        } catch (error) {
            console.error('❌ Erreur gestion answer WebRTC:', error);
        }
    };

    const handleWebRTCIceCandidate = async (data) => {
        try {
            const peerConnection = peerConnections.current.get(data.fromUserId);
            if (peerConnection) {
                await peerConnection.addIceCandidate(data.candidate);
            }

        } catch (error) {
            console.error('❌ Erreur gestion ICE candidate:', error);
        }
    };

    // =============== REAL AUDIO FUNCTIONS ===============

    // Modifier startAudioBroadcast pour le mode réel
    const startAudioBroadcast = async () => {
        try {
            // Vérifier les permissions de diffusion
            const canBroadcast = checkBroadcastPermissions();

            if (!canBroadcast.allowed) {
                toast?.warning('Audio Live', canBroadcast.message);
                return;
            }

            setIsBroadcasting(true);

            // Obtenir le microphone
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100
                }
            });

            setLocalStream(stream);

            if (localAudioRef.current) {
                localAudioRef.current.srcObject = stream;
            }

            // Informer le serveur WebSocket du début de diffusion
            if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
                websocketRef.current.send(JSON.stringify({
                    type: 'start-broadcasting',
                    userId: user?.id,
                    userName: user?.name || 'Utilisateur',
                    userRole: getUserRole()
                }));

                // Démarrer le heartbeat pour maintenir la connexion
                startHeartbeat();
            } else if (isDemoMode) {
                // Mode démo : ajouter message local
                const roleLabel = canBroadcast.roleLabel;
                let message = `🔊 ${user?.name || 'Utilisateur'} diffuse maintenant (${roleLabel})`;

                if (roleLabel === 'Participant') {
                    message = `🎤 ${user?.name || 'Utilisateur'} commence sa PERFORMANCE EN DIRECT ! 🎵`;
                }

                const demoMessage = {
                    id: Date.now(),
                    user: { name: 'Système Audio 🎵' },
                    message: message,
                    created_at: new Date().toISOString(),
                    isSystem: true
                };
                setChatMessages(prev => [...prev.slice(-50), demoMessage]);
            }

            // Ajouter le stream aux connexions peer existantes
            peerConnections.current.forEach((peerConnection) => {
                stream.getTracks().forEach(track => {
                    peerConnection.addTrack(track, stream);
                });
            });

            // Détecter quand l'utilisateur parle
            detectSpeaking(stream);

            toast?.success('🎤 Audio Live', `Diffusion audio démarrée ! (${canBroadcast.roleLabel})`);

            // Démarrer le timer de performance pour les participants
            if (canBroadcast.roleLabel === 'Participant') {
                startPerformanceTimer();
            }

        } catch (error) {
            console.error('❌ Erreur diffusion audio:', error);
            toast?.error('Audio Live', 'Impossible d\'accéder au microphone');
            setIsBroadcasting(false);
        }
    };

    // Modifier stopAudioBroadcast pour le mode réel
    const stopAudioBroadcast = () => {
        setIsBroadcasting(false);

        // Arrêter le timer de performance
        stopPerformanceTimer();

        // Arrêter le heartbeat
        stopHeartbeat();

        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }

        // Informer le serveur WebSocket
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
            websocketRef.current.send(JSON.stringify({
                type: 'stop-broadcasting',
                userId: user?.id
            }));
        }

        toast?.info('🎤 Audio Live', 'Diffusion audio arrêtée');
    };

    // Nouvelle fonction pour détecter la parole
    const detectSpeaking = (stream) => {
        try {
            const audioContext = new AudioContext();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            microphone.connect(analyser);
            analyser.fftSize = 256;

            const checkSpeaking = () => {
                if (!isBroadcasting) return;

                analyser.getByteFrequencyData(dataArray);
                const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;

                if (volume > 30) { // Seuil de détection de voix
                    // Notifier que l'utilisateur parle
                    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
                        websocketRef.current.send(JSON.stringify({
                            type: 'user-speaking',
                            userId: user?.id,
                            userRole: getUserRole(),
                            volume: volume
                        }));
                    }
                }

                if (isBroadcasting) {
                    requestAnimationFrame(checkSpeaking);
                }
            };

            checkSpeaking();

        } catch (error) {
            console.error('❌ Erreur détection parole:', error);
        }
    };

    // Nouveau système de heartbeat
    const heartbeatIntervalRef = useRef(null);

    const startHeartbeat = () => {
        heartbeatIntervalRef.current = setInterval(() => {
            if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
                websocketRef.current.send(JSON.stringify({
                    type: 'heartbeat',
                    timestamp: Date.now()
                }));
            }
        }, 30000); // Heartbeat toutes les 30 secondes
    };

    const stopHeartbeat = () => {
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
        }
    };

    // Modifier handleNextParticipant pour informer le serveur
    const handleNextParticipant = () => {
        if (!isAdmin) {
            toast?.warning('Accès restreint', 'Seul l\'administrateur peut changer de participant');
            return;
        }

        if (!competitionStarted) {
            toast?.warning('Compétition non lancée', 'Lancez d\'abord la compétition');
            return;
        }

        // Trouver le prochain participant en attente
        const waitingParticipants = participants.filter(p => p.status === 'waiting');

        if (waitingParticipants.length === 0) {
            // Tous les participants ont terminé, passer aux résultats
            setPhase('results');
            designateWinner();
            toast?.info('🏁 Fin des performances', 'Tous les participants ont chanté !');
            return;
        }

        const nextPerformer = waitingParticipants[0];

        // Informer le serveur WebSocket du changement
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
            websocketRef.current.send(JSON.stringify({
                type: 'participant-change',
                newPerformerId: nextPerformer.user?.id,
                newPerformerName: nextPerformer.user?.name
            }));
        }

        // Mettre à jour localement aussi
        setParticipants(prev => prev.map(p => {
            if (p.id === currentPerformer?.id) return { ...p, status: 'completed' };
            if (p.id === nextPerformer.id) return { ...p, status: 'performing' };
            return p;
        }));

        setCurrentPerformer(nextPerformer);

        toast?.success('🎵 Participant suivant', `C'est au tour de ${nextPerformer.user?.name} !`);
    };

    const updateLiveData = () => {
        // Simuler l'augmentation des viewers
        setViewers(prev => prev + Math.floor(Math.random() * 5));

        // Simuler nouveaux messages de chat
        if (Math.random() > 0.7) {
            addRandomMessage();
        }

        // Simuler des réactions
        if (currentPerformer && Math.random() > 0.6) {
            addRandomReaction();
        }

        // En mode démo, simuler des changements de phase et de participants seulement si la compétition a commencé
        if (isDemoMode && competitionStarted && Math.random() > 0.85) {
            simulatePhaseChange();
        }
    };

    const simulatePhaseChange = () => {
        // Simuler parfois le changement de participant en performance
        if (phase === 'performing' && Math.random() > 0.7) {
            const waitingParticipants = participants.filter(p => p.status === 'waiting');
            if (waitingParticipants.length > 0) {
                const nextPerformer = waitingParticipants[0];

                // Arrêter la diffusion du participant actuel s'il diffuse (mais maintenir l'écoute des autres)
                if (currentPerformer && isBroadcasting && currentPerformer.user?.id === user?.id) {
                    stopAudioBroadcast();
                }

                // Mettre à jour les statuts
                setParticipants(prev => prev.map(p => {
                    if (p.id === currentPerformer?.id) return { ...p, status: 'completed' };
                    if (p.id === nextPerformer.id) return { ...p, status: 'performing' };
                    return p;
                }));

                setCurrentPerformer(nextPerformer);

                // Ajouter un message système
                const systemMessage = {
                    id: Date.now(),
                    user: { name: 'Système' },
                    message: `🎤 ${nextPerformer.user.name} commence sa performance !`,
                    created_at: new Date().toISOString(),
                    isSystem: true
                };
                setChatMessages(prev => [...prev.slice(-50), systemMessage]);

                // Informer les auditeurs qu'un nouveau participant peut maintenant diffuser
                if (isListening) {
                    toast?.info('🎧 Nouveau participant', `${nextPerformer.user.name} peut maintenant diffuser`);
                }
            }
        }
    };

    const addRandomMessage = () => {
        const randomUsers = [
            "MusicFan237", "RapLover", "BeatMaster", "FlowExpert", "CamerounPride",
            "VocalStar", "HipHopHead", "AfrobeatVibes", "MelodyMaker", "RhymeTime",
            "SoundWave", "BassLover", "DrumLine", "VoiceOfGold", "UrbanLegend"
        ];

        const randomMessages = [
            "Excellent ! 🔥", "Le niveau monte ! 💪", "Bravo les artistes ! 👏",
            "Qui va gagner ? 🤔", "Performance incroyable ! ⭐", "Cameroun représente ! 🇨🇲",
            "Le flow est parfait ! 🎵", "J'adore cette compétition ! ❤️",
            "C'est du pur talent ! 💯", "On est en feu ce soir ! 🔥",
            "Cette voix me donne des frissons ! ✨", "Battle légendaire ! ⚡",
            "Du jamais vu ! 🚀", "Respect total ! 🙏", "Que du lourd ! 💎",
            "Mon cœur bat fort ! 💓", "Atmosphère de folie ! 🎪",
            "Niveau international ! 🌍", "Pure magie ! ✨", "Chapeau l'artiste ! 🎩"
        ];

        const reactions = ["❤️", "🔥", "👏", "💯", "⭐", "🚀", "✨", "💪", "🎵", "🎤"];

        // Parfois juste des emojis
        let message;
        if (Math.random() > 0.8) {
            message = reactions[Math.floor(Math.random() * reactions.length)].repeat(Math.floor(Math.random() * 3) + 1);
        } else {
            message = randomMessages[Math.floor(Math.random() * randomMessages.length)];
        }

        const newMsg = {
            id: Date.now() + Math.random(),
            user: { name: randomUsers[Math.floor(Math.random() * randomUsers.length)] },
            message: message,
            created_at: new Date().toISOString()
        };

        setChatMessages(prev => [...prev.slice(-50), newMsg]);
    };

    const addRandomReaction = () => {
        if (!currentPerformer) return;

        setReactions(prev => ({
            ...prev,
            [currentPerformer.id]: {
                likes: (prev[currentPerformer.id]?.likes || 0) + Math.floor(Math.random() * 3) + 1,
                hearts: (prev[currentPerformer.id]?.hearts || 0) + Math.floor(Math.random() * 2),
                fire: (prev[currentPerformer.id]?.fire || 0) + Math.floor(Math.random() * 2)
            }
        }));
    };

    const startLiveTimer = () => {
        const timer = setInterval(() => {
            // Ne démarrer le timer que si la compétition a été lancée manuellement
            if (!competitionStarted) {
                return;
            }

        const now = new Date();

            // En mode démo, utiliser 30 secondes pour les tests
            const durationMs = isDemoMode ? 30 * 1000 : 2 * 60 * 60 * 1000; // 30s en démo, 2h sinon
            const endTime = new Date(now.getTime() + durationMs);
            const diff = endTime - now;

        if (diff <= 0) {
            setTimeLeft('Terminé');
            setPhase('results');
                // Désigner le vainqueur automatiquement
                designateWinner();
                clearInterval(timer);
            return;
        }

            // Changer de phase selon le temps restant
            const totalTime = durationMs;
            const elapsed = totalTime - diff;
            const progressPercentage = (elapsed / totalTime) * 100;

            if (progressPercentage < 20) {
                setPhase('performing'); // Rester en performing après le lancement
            } else if (progressPercentage < 80) {
                setPhase('performing');
            } else if (progressPercentage < 100) {
                setPhase('voting');
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (isDemoMode) {
                // Afficher seulement les secondes en mode démo
                setTimeLeft(`${seconds}s`);
            } else {
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(timer);
    };

    const designateWinner = () => {
        if (!participants.length) return;

        // Calculer le score final pour chaque participant avec un système de points amélioré
        const participantsWithScores = participants.map(participant => {
            const participantReactions = reactions[participant.id] || {};
            const hearts = participantReactions.hearts || 0;
            const likes = participantReactions.likes || 0;
            const fire = participantReactions.fire || 0;

            // Système de points amélioré : hearts = 5 points, likes = 3 points, fire = 2 points
            const totalScore = (hearts * 5) + (likes * 3) + (fire * 2);

            return {
                ...participant,
                finalScore: totalScore,
                reactions: participantReactions,
                hearts,
                likes,
                fire
            };
        }).sort((a, b) => b.finalScore - a.finalScore);

        setParticipants(participantsWithScores);

        // Afficher les messages de victoire avec le podium complet
        if (participantsWithScores.length > 0) {
            const winner = participantsWithScores[0];
            const second = participantsWithScores[1];
            const third = participantsWithScores[2];

            // Message du gagnant
            const winnerMessage = {
            id: Date.now(),
                user: { name: 'Système 🏆' },
                message: `🎉 GRAND GAGNANT ! ${winner.user.name} remporte la compétition avec ${winner.finalScore} points ! 🏆`,
                created_at: new Date().toISOString(),
                isSystem: true,
                isWinner: true
            };
            setChatMessages(prev => [...prev.slice(-50), winnerMessage]);

            // Messages pour le podium complet
            setTimeout(() => {
                const podiumMessage = {
                    id: Date.now() + 1,
                    user: { name: 'Podium Final 🥇' },
                    message: `🥇 1er : ${winner.user.name} (${winner.finalScore} pts) • ❤️${winner.hearts} 👍${winner.likes} 🔥${winner.fire}${second ? ` | 🥈 2ème : ${second.user.name} (${second.finalScore} pts)` : ''}${third ? ` | 🥉 3ème : ${third.user.name} (${third.finalScore} pts)` : ''}`,
                    created_at: new Date().toISOString(),
                    isSystem: true,
                    isPodium: true
                };
                setChatMessages(prev => [...prev.slice(-50), podiumMessage]);
            }, 2000);

            // Détails du système de points
            setTimeout(() => {
                const pointsMessage = {
                    id: Date.now() + 2,
                    user: { name: 'Système Points 📊' },
                    message: `💡 Système de points : ❤️ Cœurs = 5 pts • 👍 Likes = 3 pts • 🔥 Feu = 2 pts`,
                    created_at: new Date().toISOString(),
                    isSystem: true,
                    isInfo: true
                };
                setChatMessages(prev => [...prev.slice(-50), pointsMessage]);
            }, 4000);

            // Toast de victoire avec confettis
            toast?.success('🏆 Compétition terminée !', `${winner.user.name} est le champion avec ${winner.finalScore} points !`);

            // Déclencher l'effet confettis (simulation)
            setTimeout(() => {
                for (let i = 0; i < 20; i++) {
                    setTimeout(() => {
                        const confettiReaction = {
                            id: Date.now() + Math.random(),
                            emoji: ['🎉', '🎊', '🏆', '👑', '⭐'][Math.floor(Math.random() * 5)],
                            x: Math.random() * window.innerWidth,
                            y: window.innerHeight,
                            type: 'confetti'
                        };
                        setReactionAnimations(prev => [...prev, confettiReaction]);

                        setTimeout(() => {
                            setReactionAnimations(prev => prev.filter(anim => anim.id !== confettiReaction.id));
                        }, 4000);
                    }, i * 200);
                }
            }, 1000);
        }
    };

    const handleStartRecording = async () => {
        if (!isUserParticipant) {
            toast?.warning('Participation requise', 'Vous devez être inscrit pour enregistrer');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);

            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                handleSubmitRecording(audioBlob);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            // Timer d'enregistrement (max 3 minutes)
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= 180) { // 3 minutes max
                        handleStopRecording();
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);

            toast?.success('Enregistrement', 'Enregistrement démarré ! Maximum 3 minutes');
            setShowRecordModal(true);

        } catch (error) {
            console.error('Erreur microphone:', error);
            toast?.error('Erreur', 'Impossible d\'accéder au microphone');
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);

            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }

            // Arrêter tous les tracks audio
            if (mediaRecorderRef.current.stream) {
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            }
        }
    };

    const handleSubmitRecording = async (audioBlob) => {
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'performance.wav');
            formData.append('competition_id', id);
            formData.append('duration', recordingTime);

            const response = await fetch('/api/competitions/submit-performance', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                toast?.success('Soumission réussie', 'Votre performance a été soumise !');
                setShowRecordModal(false);
                loadParticipants(); // Recharger les participants
            } else {
                throw new Error(result.message || 'Erreur lors de la soumission');
            }

        } catch (error) {
            console.error('Erreur soumission:', error);
            toast?.error('Erreur', error.message || 'Erreur lors de la soumission');
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        // En mode démonstration, ajouter le message localement
        if (isDemoMode) {
        const message = {
            id: Date.now(),
                user: { name: user?.name || 'Visiteur Demo' },
            message: newMessage,
                created_at: new Date().toISOString(),
            isOwn: true
        };

            setChatMessages(prev => [...prev.slice(-50), message]);
        setNewMessage('');
            return;
        }

        if (!token) {
            toast?.warning('Connexion requise', 'Connectez-vous pour chatter');
            return;
        }

        try {
            const response = await fetch('/api/competitions/chat', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    competition_id: id,
                    message: newMessage
                })
            });

            const result = await response.json();

            if (response.ok) {
                const message = {
                    id: Date.now(),
                    user: { name: user?.name || 'Vous' },
                    message: newMessage,
                    created_at: new Date().toISOString(),
                    isOwn: true
                };

                setChatMessages(prev => [...prev.slice(-50), message]);
                setNewMessage('');
            }

        } catch (error) {
            console.error('Erreur envoi message:', error);
        }
    };

    const handleReaction = async (type) => {
        if (!currentPerformer) {
            toast?.warning('Aucun participant', 'Aucune performance en cours');
            return;
        }

        // Créer une animation de réaction
        const animationId = Date.now() + Math.random();
        const reactionEmoji = type === 'hearts' ? '❤️' : type === 'likes' ? '👍' : '🔥';

        const newAnimation = {
            id: animationId,
            emoji: reactionEmoji,
            x: Math.random() * window.innerWidth,
            y: window.innerHeight,
            type: type
        };

        setReactionAnimations(prev => [...prev, newAnimation]);

        // Supprimer l'animation après 3 secondes
        setTimeout(() => {
            setReactionAnimations(prev => prev.filter(anim => anim.id !== animationId));
        }, 3000);

        // En mode démonstration, simuler la réaction localement
        if (isDemoMode) {
            setReactions(prev => ({
                ...prev,
                [currentPerformer.id]: {
                    ...prev[currentPerformer.id],
                    [type]: (prev[currentPerformer.id]?.[type] || 0) + 1
                }
            }));

            toast?.success('Réaction envoyée', `Votre ${reactionEmoji} a été envoyé !`);
            return;
        }

        if (!token) {
            toast?.warning('Connexion requise', 'Connectez-vous pour réagir');
            return;
        }

        try {
            const response = await fetch('/api/competitions/react', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    participant_id: currentPerformer.id,
                    reaction_type: type
                })
            });

            if (response.ok) {
                setReactions(prev => ({
                    ...prev,
                    [currentPerformer.id]: {
                        ...prev[currentPerformer.id],
                        [type]: (prev[currentPerformer.id]?.[type] || 0) + 1
                    }
                }));

                toast?.success('Réaction envoyée', `Votre ${reactionEmoji} a été envoyé !`);
            }

        } catch (error) {
            console.error('Erreur réaction:', error);
        }
    };

    const handleVote = async (participantId, voteType) => {
        // En mode démonstration, simuler le vote localement
        if (isDemoMode) {
            setUserVotes(prev => ({
            ...prev,
            [participantId]: voteType
        }));

            toast?.success('Vote enregistré', 'Votre vote a été pris en compte !');
            return;
        }

        if (!token) {
            toast?.warning('Connexion requise', 'Connectez-vous pour voter');
            return;
        }

        try {
            const response = await fetch('/api/competitions/vote', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    participant_id: participantId,
                    vote_type: voteType
                })
            });

            if (response.ok) {
                setUserVotes(prev => ({
                    ...prev,
                    [participantId]: voteType
                }));

                toast?.success('Vote enregistré', 'Votre vote a été pris en compte !');
            }

        } catch (error) {
            console.error('Erreur vote:', error);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-CM', {
            style: 'currency',
            currency: 'XAF',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatRecordingTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getPhaseDisplay = () => {
        switch (phase) {
            case 'waiting':
                return { text: 'En attente', color: 'secondary', icon: faClock };
            case 'performing':
                return { text: 'Performance', color: 'success', icon: faMicrophone };
            case 'voting':
                return { text: 'Votes', color: 'warning', icon: faThumbsUp };
            case 'results':
                return { text: 'Résultats', color: 'info', icon: faTrophy };
            default:
                return { text: 'Live', color: 'danger', icon: faPlay };
        }
    };

    const handleStartCompetition = () => {
        if (!isAdmin) {
            toast?.warning('Accès restreint', 'Seul l\'administrateur peut lancer la compétition');
            return;
        }

        if (participants.length === 0) {
            toast?.warning('Aucun participant', 'Attendez qu\'au moins un participant s\'inscrive');
            return;
        }

        // Lancer la compétition
        setCompetitionStarted(true);
        setPhase('performing');

        // Sélectionner le premier participant
        const firstPerformer = participants.find(p => p.status !== 'completed') || participants[0];
        setCurrentPerformer(firstPerformer);

        // Mettre à jour les statuts des participants
        setParticipants(prev => prev.map(p => ({
            ...p,
            status: p.id === firstPerformer.id ? 'performing' : 'waiting'
        })));

        // Message système de lancement
        const startMessage = {
            id: Date.now(),
            user: { name: 'Système 🎤' },
            message: `🚀 La compétition commence ! ${firstPerformer.user.name} ouvre le bal !`,
            created_at: new Date().toISOString(),
            isSystem: true
        };
        setChatMessages(prev => [...prev.slice(-50), startMessage]);

        toast?.success('🎤 Compétition lancée !', 'La compétition a officiellement commencé');
    };

    // =============== FONCTIONS MANQUANTES ===============

    const checkBroadcastPermissions = () => {
        // Vérifier si l'utilisateur peut diffuser
        if (!user) {
            return { allowed: false, message: 'Vous devez être connecté', roleLabel: 'Visiteur' };
        }

        // Admin de la plateforme peut toujours diffuser
        if (user.role === 'admin' || user.role === 'super_admin') {
            return { allowed: true, message: 'Admin plateforme peut diffuser', roleLabel: 'Admin Plateforme' };
        }

        // Créateur/organisateur de la compétition peut diffuser
        if (competition && competition.user_id === user.id) {
            return { allowed: true, message: 'Organisateur peut diffuser', roleLabel: 'Organisateur' };
        }

        // Dans tous les autres cas (participants, spectateurs), pas de diffusion autorisée
        return {
            allowed: false,
            message: 'Seuls l\'admin plateforme et l\'organisateur peuvent diffuser',
            roleLabel: 'Spectateur'
        };
    };

    const getUserRole = () => {
        if (!user) return 'visitor';

        // Admin de la plateforme (super privilèges)
        if (user.role === 'admin' || user.role === 'super_admin') {
            return 'platform_admin';
        }

        // Organisateur de cette compétition
        if (competition && competition.user_id === user.id) {
            return 'competition_admin';
        }

        // Participant inscrit
        if (isUserParticipant) {
            return 'participant';
        }

        // Spectateur simple
        return 'spectator';
    };

    const startListening = () => {
        setIsListening(true);
        toast?.success('🎧 Écoute activée', 'Vous recevrez les diffusions audio en direct');
    };

    const stopListening = () => {
        setIsListening(false);

        // Fermer toutes les connexions audio
        remoteStreams.forEach((stream, userId) => {
            stream.getTracks().forEach(track => track.stop());
        });
        setRemoteStreams(new Map());

        // Fermer toutes les connexions peer
        peerConnections.current.forEach((peer, userId) => {
            peer.close();
        });
        peerConnections.current.clear();

        toast?.info('🔇 Écoute désactivée', 'Vous ne recevrez plus les diffusions audio');
    };

    const addRemoteStream = (userId, stream) => {
        console.log('🎵 Ajout stream distant:', userId);
        setRemoteStreams(prev => {
            const newStreams = new Map(prev);
            newStreams.set(userId, stream);
            return newStreams;
        });

        // Créer un élément audio pour la lecture
        const audio = document.createElement('audio');
        audio.srcObject = stream;
        audio.autoplay = true;
        audio.playsInline = true;

        // Ajouter à la liste des audios distants
        remoteAudiosRef.current.set(userId, audio);

        toast?.success('🎵 Audio reçu', 'Vous entendez maintenant la diffusion en direct');
    };

    const highlightSpeaker = (userId) => {
        // Mettre en évidence le participant qui parle
        const participantCard = document.querySelector(`[data-participant-id="${userId}"]`);
        if (participantCard) {
            participantCard.classList.add('speaking');
            setTimeout(() => {
                participantCard.classList.remove('speaking');
            }, 1000);
        }
    };

    const formatPerformanceTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const startPerformanceTimer = () => {
        // Démarrer le timer de 3 minutes pour la performance (ou 1 minute en mode démo)
        const maxTime = isDemoMode ? 60 : 180; // 1 minute en démo, 3 minutes sinon
        setPerformanceTimeLeft(maxTime);

        const timer = setInterval(() => {
            setPerformanceTimeLeft(prev => {
                if (prev <= 1) {
                    // Temps écoulé, arrêter automatiquement la diffusion
                    clearInterval(timer);
                    setPerformanceTimer(null);

                    if (isBroadcasting) {
                        stopAudioBroadcast();
                        toast?.warning('⏰ Temps écoulé', 'Votre temps de performance est terminé');
                    }

                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        setPerformanceTimer(timer);
    };

    const stopPerformanceTimer = () => {
        if (performanceTimer) {
            clearInterval(performanceTimer);
            setPerformanceTimer(null);
        }
        setPerformanceTimeLeft(isDemoMode ? 60 : 180); // Reset au temps initial
    };

    // =============== FIN FONCTIONS MANQUANTES ===============

    // ============= FONCTIONS LIVE AUDIO WEBRTC (SUPPRIMÉES) =============

    // Les anciennes fonctions WebRTC sont maintenant remplacées par le nouveau système WebSocket
    // Configuration maintenue pour compatibilité
    const rtcConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };

    // ============= FIN FONCTIONS WEBRTC SUPPRIMÉES =============

    if (loading) {
        return <LoadingScreen />;
    }

    if (!competition) {
        return (
            <Container className="py-5 text-center">
                <h3>Compétition non trouvée</h3>
                <Button as={Link} to="/competitions" variant="primary">
                    Retour aux compétitions
                </Button>
            </Container>
        );
    }

    const phaseInfo = getPhaseDisplay();

    return (
        <div className="min-vh-100 bg-dark text-white live-competition-bg">
            {/* Header de diffusion */}
            <div className="live-header bg-gradient-dark py-3 border-bottom border-secondary">
                <Container>
                    <Row className="align-items-center">
                        <Col md={6}>
                            <div className="d-flex align-items-center">
                                <Button
                                    as={Link}
                                    to={`/competitions/${id}`}
                                    variant="outline-light"
                                    size="sm"
                                    className="me-3"
                                >
                                    <FontAwesomeIcon icon={faArrowLeft} />
                                </Button>

                                <div className="live-indicator me-3">
                                    <span className="live-dot"></span>
                                    <span className="fw-bold text-danger">EN DIRECT</span>
                                    {isDemoMode && (
                                        <Badge bg="warning" className="ms-2">
                                            <FontAwesomeIcon icon={faEye} className="me-1" />
                                            DEMO
                                        </Badge>
                                    )}
                                </div>

                                <div>
                                    <h5 className="mb-0 fw-bold">
                                        {competition.title}
                                        {isDemoMode && <small className=" text-muted ms-2">(Mode Démonstration)</small>}
                                    </h5>
                                    <small className="text-light">Organisé par {competition.user?.name}</small>
                                </div>
                            </div>
                        </Col>
                        <Col md={6} className="text-end">
                            <div className="d-flex align-items-center justify-content-end gap-3">
                                <Badge bg={phaseInfo.color} className="fs-6 px-3 py-2">
                                    <FontAwesomeIcon icon={phaseInfo.icon} className="me-2" />
                                    {phaseInfo.text}
                                </Badge>

                                <div className="d-flex align-items-center text-light">
                                    <FontAwesomeIcon icon={faEye} className="me-2" />
                                    <span className="fw-bold">{viewers.toLocaleString()}</span>
                                    <small className="ms-1">spectateurs</small>
                                </div>

                                <div className="d-flex align-items-center text-light">
                                    <FontAwesomeIcon icon={faClock} className="me-2" />
                                    <span className="fw-bold">{timeLeft}</span>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Contenu principal */}
            <Container fluid className="py-3">
                <Row className="g-3">
                    {/* Zone de performance principale - Colonne gauche */}
                    <Col lg={8}>
                        <AnimatedElement animation="slideInLeft" delay={100}>
                            {/* Contrôles Admin en haut */}
                            {isAdmin && !competitionStarted && (
                                <Card className="bg-gradient-primary border-0 mb-3 admin-control-card">
                                    <Card.Body className="text-center py-4">
                                        <div className="admin-badge mb-3">
                                            <FontAwesomeIcon icon={faCrown} className="me-2" />
                                            PANNEAU ADMINISTRATEUR
                                        </div>
                                        <h4 className="text-white mb-3">
                                            <FontAwesomeIcon icon={faPlay} className="me-2" />
                                            Prêt à lancer la compétition ?
                                        </h4>
                                        <p className="text-light mb-4">
                                            {participants.length} participant(s) inscrit(s) • Cliquez pour commencer le show !
                                        </p>
                                        <Button
                                            variant="warning"
                                            size="lg"
                                            onClick={handleStartCompetition}
                                            className="start-competition-btn"
                                            disabled={participants.length === 0}
                                        >
                                            <FontAwesomeIcon icon={faRocket} className="me-2" />
                                            🎤 LANCER LA COMPÉTITION
                                        </Button>
                                        {participants.length === 0 && (
                                            <div className="mt-3">
                                                <small className="text-warning">
                                                    <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                                                    En attente de participants...
                                                </small>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Contrôles admin pendant la compétition */}
                            {isAdmin && competitionStarted && phase !== 'results' && (
                                <Card className="bg-warning bg-opacity-10 border-warning mb-3 admin-live-controls">
                                    <Card.Body className="py-3">
                                        <Row className="align-items-center">
                                            <Col md={8}>
                                                <div className="d-flex align-items-center">
                                                    <FontAwesomeIcon icon={faCrown} className="text-warning me-2" />
                                                    <div>
                                                        <h6 className="mb-0 text-white">Contrôles Admin</h6>
                                                        <small className="text-muted">
                                                            Participant actuel : {currentPerformer?.user?.name || 'Aucun'}
                                                        </small>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col md={4} className="text-end">
                                                <Button
                                                    variant="warning"
                                                    size="sm"
                                                    onClick={handleNextParticipant}
                                                    className="next-participant-btn"
                                                >
                                                    <FontAwesomeIcon icon={faPlay} className="me-2" />
                                                    Participant suivant
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Section Performance Live spéciale en mode démo */}
                            {isDemoMode && checkBroadcastPermissions().allowed && (
                                <Card className="bg-dark border-warning mb-3 demo-performance-test">
                                    <Card.Header className="bg-transparent border-warning">
                                        <h5 className="text-white mb-0 d-flex align-items-center">
                                            <FontAwesomeIcon icon={faMicrophone} className="me-2 text-warning" />
                                            🎤 Test Diffusion Live ({checkBroadcastPermissions().roleLabel})
                                            {isBroadcasting && (
                                                <Badge bg="danger" className="ms-2 live-performance-badge">
                                                    <FontAwesomeIcon icon={faRecordVinyl} className="me-1" />
                                                    EN DIRECT
                                                </Badge>
                                            )}
                                        </h5>
                                    </Card.Header>
                                    <Card.Body className="text-center py-4">
                                        <div className="performance-control-section">
                                            <h6 className="text-light mb-3">
                                                <FontAwesomeIcon icon={faUsers} className="me-2 text-info" />
                                                {viewers.toLocaleString()} spectateurs vous écoutent en direct
                                            </h6>

                                            {!isBroadcasting ? (
                                                <div className="start-performance">
                                                    <p className="text-muted mb-4">
                                                        <strong>Mode {checkBroadcastPermissions().roleLabel}</strong> : Vous pouvez diffuser votre voix en direct !<br/>
                                                        Commentez la compétition, interagissez avec le public en temps réel.
                                                    </p>
                                                    <Button
                                                        variant="warning"
                                                        size="lg"
                                                        onClick={startAudioBroadcast}
                                                        className="start-live-performance-btn"
                                                    >
                                                        <FontAwesomeIcon icon={faMicrophone} className="me-2" />
                                                        🎤 COMMENCER LA DIFFUSION
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="live-performance-active">
                                                    <div className="performance-indicator mb-4">
                                                        <div className="live-pulse-large"></div>
                                                        <h5 className="text-warning mb-2">🔴 DIFFUSION EN DIRECT</h5>
                                                        <p className="text-light">Vous diffusez maintenant • Commentez, animez, interagissez !</p>

                                                        {/* Timer de performance */}
                                                        {performanceTimer && (
                                                            <div className="performance-timer mt-3">
                                                                <div className={`timer-display ${performanceTimeLeft <= 30 ? 'timer-warning' : ''} ${performanceTimeLeft <= 10 ? 'timer-danger' : ''}`}>
                                                                    <FontAwesomeIcon icon={faClock} className="me-2" />
                                                                    Temps restant : {formatPerformanceTime(performanceTimeLeft)}
                                                                </div>
                                                                <div className="timer-progress">
                                                                    <div
                                                                        className="timer-progress-bar"
                                                                        style={{
                                                                            width: `${(performanceTimeLeft / (isDemoMode ? 60 : 180)) * 100}%`,
                                                                            backgroundColor: performanceTimeLeft <= 30 ? '#ffc107' : performanceTimeLeft <= 10 ? '#dc3545' : '#198754'
                                                                        }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="performance-stats mb-4">
                                                        <Row className="text-center">
                                                            <Col md={4}>
                                                                <div className="stat-item">
                                                                    <div className="stat-number text-info">{audioConnections.size + remoteStreams.size}</div>
                                                                    <div className="stat-label">Auditeurs connectés</div>
                                                                </div>
                                                            </Col>
                                                            <Col md={4}>
                                                                <div className="stat-item">
                                                                    <div className="stat-number text-success">{reactions[currentPerformer?.id]?.hearts || 0}</div>
                                                                    <div className="stat-label">❤️ Réactions</div>
                                                                </div>
                                                            </Col>
                                                            <Col md={4}>
                                                                <div className="stat-item">
                                                                    <div className="stat-number text-warning">{chatMessages.length}</div>
                                                                    <div className="stat-label">💬 Messages</div>
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                    </div>

                                                    <Button
                                                        variant="outline-danger"
                                                        size="lg"
                                                        onClick={stopAudioBroadcast}
                                                        className="stop-live-performance-btn"
                                                    >
                                                        <FontAwesomeIcon icon={faStop} className="me-2" />
                                                        Terminer la diffusion
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Contrôles pour les spectateurs/participants non autorisés */}
                            {!isBroadcasting && !checkBroadcastPermissions().allowed && (
                                <Card className="bg-dark border-info mb-3 listening-instructions">
                                    <Card.Body className="text-center py-4">
                                        <h6 className="text-info mb-3">
                                            <FontAwesomeIcon icon={faHeadphones} className="me-2" />
                                            Mode Spectateur
                                        </h6>
                                        <p className="text-light mb-3">
                                            Seuls l'<strong>admin de la plateforme</strong> et l'<strong>organisateur</strong> peuvent diffuser leur voix en direct.
                                            Vous assistez à la compétition en tant que spectateur.
                                        </p>
                                        <div className="spectator-actions">
                                            <h6 className="text-white mb-3">Ce que vous pouvez faire :</h6>
                                            <Row className="text-center">
                                                <Col md={4}>
                                                    <div className="action-item">
                                                        <FontAwesomeIcon icon={faHeadphones} className="text-info mb-2" size="2x" />
                                                        <div className="action-text">Écouter les commentaires live</div>
                                                    </div>
                                                </Col>
                                                <Col md={4}>
                                                    <div className="action-item">
                                                        <FontAwesomeIcon icon={faHeart} className="text-danger mb-2" size="2x" />
                                                        <div className="action-text">Réagir et voter</div>
                                                    </div>
                                                </Col>
                                                <Col md={4}>
                                                    <div className="action-item">
                                                        <FontAwesomeIcon icon={faComment} className="text-primary mb-2" size="2x" />
                                                        <div className="action-text">Commenter en direct</div>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>

                                        {isListening ? (
                                            <div className="listening-status mt-4">
                                                <Badge bg="success" className="fs-6 px-3 py-2">
                                                    <FontAwesomeIcon icon={faVolumeUp} className="me-2" />
                                                    🎧 Écoute activée
                                                </Badge>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={stopListening}
                                                    className="ms-3"
                                                >
                                                    <FontAwesomeIcon icon={faVolumeMute} className="me-2" />
                                                    Arrêter l'écoute
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                variant="info"
                                                size="lg"
                                                onClick={startListening}
                                                className="mt-3"
                                            >
                                                <FontAwesomeIcon icon={faHeadphones} className="me-2" />
                                                🎧 Commencer l'écoute
                                            </Button>
                                        )}
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Scène principale/Lecteur */}
                            <Card className="bg-dark border-secondary mb-3 performance-stage">
                                <Card.Body className="p-4">
                                    {currentPerformer ? (
                                        <div className="text-center">
                                            <div className="performer-spotlight mb-4">
                                                <img
                                                    src={currentPerformer.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentPerformer.user?.name || 'Artiste')}&background=3b82f6&color=fff`}
                                                    alt={currentPerformer.user?.name}
                                                    className="rounded-circle performer-avatar"
                                                />
                                                <div className="performer-glow"></div>
                                            </div>

                                            <h3 className="text-white fw-bold mb-2">{currentPerformer.user?.name}</h3>
                                            <h5 className="text-primary mb-3">
                                                {currentPerformer.performance_title || 'Performance en cours'}
                                            </h5>

                                            {/* Réactions en temps réel */}
                                            <div className="reactions-display mb-4">
                                                <div className="d-flex justify-content-center gap-4">
                                                    <div className="reaction-count">
                                                        <FontAwesomeIcon icon={faHeart} className="text-danger" />
                                                        <span className="ms-1">{reactions[currentPerformer.id]?.hearts || 0}</span>
                                                    </div>
                                                    <div className="reaction-count">
                                                        <FontAwesomeIcon icon={faThumbsUp} className="text-success" />
                                                        <span className="ms-1">{reactions[currentPerformer.id]?.likes || 0}</span>
                                                    </div>
                                                    <div className="reaction-count">
                                                        <FontAwesomeIcon icon={faFire} className="text-warning" />
                                                        <span className="ms-1">{reactions[currentPerformer.id]?.fire || 0}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Boutons de réaction */}
                                            <div className="reaction-buttons mb-4">
                                                <h6 className="text-light mb-3">Réagissez en temps réel :</h6>
                                                <div className="d-flex justify-content-center gap-3">
                                                <Button
                                                        variant="outline-danger"
                                                    size="lg"
                                                        onClick={() => handleReaction('hearts')}
                                                        className="reaction-btn"
                                                >
                                                        <FontAwesomeIcon icon={faHeart} className="me-2" />
                                                        J'adore
                                                </Button>
                                                <Button
                                                        variant="outline-success"
                                                    size="lg"
                                                        onClick={() => handleReaction('likes')}
                                                        className="reaction-btn"
                                                    >
                                                        <FontAwesomeIcon icon={faThumbsUp} className="me-2" />
                                                        Excellent
                                                    </Button>
                                                    <Button
                                                        variant="outline-warning"
                                                        size="lg"
                                                        onClick={() => handleReaction('fire')}
                                                        className="reaction-btn"
                                                    >
                                                        <FontAwesomeIcon icon={faFire} className="me-2" />
                                                        Feu !
                                                </Button>
                                                </div>
                                            </div>

                                            {/* Vote final si disponible */}
                                            {phase === 'voting' && (
                                            <div className="vote-section">
                                                <h6 className="text-light mb-3">Votez pour cette performance :</h6>
                                                <div className="d-flex justify-content-center gap-3">
                                                    <Button
                                                            variant={userVotes[currentPerformer.id] === 'up' ? "success" : "outline-success"}
                                                        size="lg"
                                                        onClick={() => handleVote(currentPerformer.id, 'up')}
                                                        className="vote-btn"
                                                    >
                                                        <FontAwesomeIcon icon={faThumbsUp} className="me-2" />
                                                            Excellent
                                                    </Button>
                                                    <Button
                                                            variant={userVotes[currentPerformer.id] === 'down' ? "danger" : "outline-danger"}
                                                        size="lg"
                                                        onClick={() => handleVote(currentPerformer.id, 'down')}
                                                        className="vote-btn"
                                                    >
                                                        <FontAwesomeIcon icon={faThumbsDown} className="me-2" />
                                                            Pas terrible
                                                    </Button>
                                                </div>
                                            </div>
                                            )}

                                            {/* Affichage des résultats finaux */}
                                            {phase === 'results' && (
                                                <div className="results-section">
                                                    <h4 className="text-warning mb-3">
                                                        <FontAwesomeIcon icon={faTrophy} className="me-2" />
                                                        Compétition Terminée !
                                                    </h4>
                                                    <p className="text-light mb-3">
                                                        Les votes sont maintenant fermés. Voici le classement final basé sur les réactions du public !
                                                    </p>
                                                    <div className="final-winner-display">
                                                        {participants.length > 0 && participants[0].finalScore !== undefined && (
                                                            <div className="winner-spotlight">
                                                                <div className="winner-crown">👑</div>
                                                                <img
                                                                    src={participants[0].user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(participants[0].user?.name || 'Gagnant')}&background=ffd700&color=000`}
                                                                    alt={participants[0].user?.name}
                                                                    className="winner-avatar"
                                                                />
                                                                <h5 className="winner-name text-warning mt-2">{participants[0].user?.name}</h5>
                                                                <div className="winner-score">{participants[0].finalScore} points</div>
                                                                <div className="winner-confetti">🎉🎊🎉</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-5">
                                            <FontAwesomeIcon icon={faMicrophone} size="3x" className="text-muted mb-3" />
                                            <h4 className="text-light">En attente du prochain participant...</h4>
                                            <p className="text-muted">La prochaine performance va bientôt commencer</p>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>

                            {/* Bouton d'enregistrement pour les participants - DÉSACTIVÉ */}
                            {false && isUserParticipant && (
                                <Card className="bg-dark border-secondary mb-3">
                                    <Card.Body className="text-center">
                                        <h5 className="text-white mb-3">
                                            <FontAwesomeIcon icon={faMicrophone} className="me-2 text-primary" />
                                            Votre tour !
                                        </h5>
                                        <p className="text-muted mb-3">
                                            Enregistrez votre performance (maximum 3 minutes)
                                        </p>
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            onClick={handleStartRecording}
                                            disabled={isRecording}
                                            className="record-btn"
                                        >
                                            <FontAwesomeIcon icon={isRecording ? faRecordVinyl : faMicrophone} className="me-2" />
                                            {isRecording ? 'Enregistrement...' : 'Commencer à chanter'}
                                        </Button>
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Classement en temps réel */}
                            <Card className="bg-dark border-secondary">
                                <Card.Header className="bg-transparent border-secondary">
                                    <h5 className="mb-0 text-white fw-bold">
                                        <FontAwesomeIcon icon={faTrophy} className="me-2 text-warning" />
                                        Classement en temps réel
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    {participants.length > 0 ? (
                                    <Row className="g-2">
                                            {participants
                                                .map(participant => {
                                                    const participantReactions = reactions[participant.id] || {};
                                                    const hearts = participantReactions.hearts || 0;
                                                    const likes = participantReactions.likes || 0;
                                                    const fire = participantReactions.fire || 0;
                                                    // Utiliser le même système de points que designateWinner
                                                    const totalScore = (hearts * 5) + (likes * 3) + (fire * 2);

                                                    return {
                                                        ...participant,
                                                        hearts,
                                                        likes,
                                                        fire,
                                                        totalScore
                                                    };
                                                })
                                                .sort((a, b) => b.totalScore - a.totalScore)
                                                .map((participant, index) => {
                                                    const isWinner = phase === 'results' && index === 0;
                                                    const isLeader = phase !== 'results' && index === 0 && participant.totalScore > 0;

                                                    return (
                                                        <Col key={participant.id} md={6} lg={4}>
                                                            <div
                                                                className={`participant-rank-card ${participant.id === currentPerformer?.id ? 'performing' : ''} ${isWinner ? 'winner' : ''} ${isLeader ? 'leader' : ''} ${index < 3 ? 'podium' : ''}`}
                                                                data-participant-id={participant.id}
                                                            >
                                                        <div className="d-flex align-items-center">
                                                            <div className="rank-position me-3">
                                                                        {isWinner && '🏆'}
                                                                        {!isWinner && index === 0 && participant.totalScore > 0 && '👑'}
                                                                {index === 1 && <span className="rank-silver">🥈</span>}
                                                                {index === 2 && <span className="rank-bronze">🥉</span>}
                                                                {index > 2 && <span className="rank-number">#{index + 1}</span>}
                                                            </div>
                                                            <img
                                                                        src={participant.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(participant.user?.name || 'Artiste')}&background=3b82f6&color=fff`}
                                                                        alt={participant.user?.name}
                                                                className="rounded-circle me-2"
                                                                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                            />
                                                            <div className="flex-grow-1">
                                                                        <div className="participant-name">{participant.user?.name}</div>
                                                                        <div className="participant-score-display">
                                                                            <span className="total-score">{participant.totalScore} pts</span>
                                                                            <span className="score-breakdown ms-2">
                                                                                <small className="reaction-count hearts">❤️{participant.hearts}</small>
                                                                                <small className="reaction-count likes ms-1">👍{participant.likes}</small>
                                                                                <small className="reaction-count fire ms-1">🔥{participant.fire}</small>
                                                                            </span>
                                                            </div>
                                                                    </div>
                                                                    {participant.id === currentPerformer?.id && phase !== 'results' && (
                                                                <Badge bg="success" className="ms-2 performing-badge">
                                                                    <FontAwesomeIcon icon={faMicrophone} className="me-1" />
                                                                            EN COURS
                                                                        </Badge>
                                                                    )}
                                                                    {isWinner && (
                                                                        <Badge bg="warning" className="ms-2 winner-badge">
                                                                            <FontAwesomeIcon icon={faTrophy} className="me-1" />
                                                                            CHAMPION
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Col>
                                                    );
                                                })}
                                    </Row>
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className="no-participants-text">Aucun participant pour l'instant</p>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </AnimatedElement>
                    </Col>

                    {/* Sidebar - Chat et informations */}
                    <Col lg={4}>
                        <AnimatedElement animation="slideInRight" delay={200}>
                            {/* Informations de la compétition */}
                            <Card className="bg-dark border-secondary mb-3">
                                <Card.Header className="bg-transparent border-secondary">
                                    <h6 className="mb-0 text-white fw-bold">
                                        <FontAwesomeIcon icon={faCoins} className="me-2 text-warning" />
                                        Cagnotte : {formatCurrency(competition.entry_fee * (competition.current_participants || 0))}
                                    </h6>
                                </Card.Header>
                                <Card.Body className="py-2">
                                    <div className="d-flex justify-content-between text-light small">
                                        <span>Participants:</span>
                                        <span>{participants.length}/{competition.max_participants}</span>
                                    </div>
                                    <div className="d-flex justify-content-between text-light small">
                                        <span>Spectateurs:</span>
                                        <span>{viewers.toLocaleString()}</span>
                                    </div>
                                    <div className="d-flex justify-content-between text-light small">
                                        <span>Temps restant:</span>
                                        <span>{timeLeft}</span>
                                    </div>
                                </Card.Body>
                            </Card>

                            {/* Chat en direct */}
                            <Card className="bg-dark border-secondary chat-container">
                                <Card.Header className="bg-transparent border-secondary">
                                    <h6 className="mb-0 text-white fw-bold">
                                        <FontAwesomeIcon icon={faComment} className="me-2 text-primary" />
                                        Chat en direct ({chatMessages.length})
                                    </h6>
                                </Card.Header>
                                <Card.Body className="p-0">
                                    <div className="chat-messages" ref={chatContainerRef}>
                                        {chatMessages.map((msg) => (
                                            <div key={msg.id} className={`chat-message ${msg.isOwn ? 'own' : ''} ${msg.isSystem ? 'system' : ''} ${msg.isWinner ? 'winner' : ''}`}>
                                                <div className="d-flex align-items-start">
                                                    <div className="flex-grow-1">
                                                        <div className="d-flex align-items-center mb-1">
                                                            <span className={`chat-username fw-bold ${msg.isSystem ? 'text-warning' : 'text-primary'}`}>
                                                                {msg.user?.name || 'Anonyme'}
                                                            </span>
                                                            <small className="text-muted ms-2">
                                                                {formatTime(msg.created_at)}
                                                            </small>
                                                        </div>
                                                        <div className={`chat-text ${msg.isWinner ? 'winner-text' : 'text-light'}`}>
                                                            {msg.message}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card.Body>
                                <Card.Footer className="bg-transparent border-secondary">
                                    <Form onSubmit={handleSendMessage}>
                                        <InputGroup>
                                            <Form.Control
                                                type="text"
                                                placeholder={token ? "Écrivez votre message..." : "Connectez-vous pour chatter"}
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                disabled={!token}
                                                className="bg-dark text-light border-secondary"
                                            />
                                            <Button
                                                variant="primary"
                                                type="submit"
                                                disabled={!newMessage.trim() || !token}
                                            >
                                                <FontAwesomeIcon icon={faPaperPlane} />
                                            </Button>
                                        </InputGroup>
                                    </Form>
                                </Card.Footer>
                            </Card>
                        </AnimatedElement>
                    </Col>
                </Row>
            </Container>

            {/* Conteneur des animations de réactions */}
            <div className="reaction-animations-container">
                {reactionAnimations.map((animation) => (
                    <div
                        key={animation.id}
                        className={`reaction-animation reaction-${animation.type}`}
                        style={{
                            left: `${animation.x}px`,
                            top: `${animation.y}px`,
                        }}
                    >
                        {animation.emoji}
                    </div>
                ))}
            </div>

            <style jsx>{`
                /* =============== ANIMATIONS DES RÉACTIONS =============== */
                .reaction-animations-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 9999;
                    overflow: hidden;
                }

                .reaction-animation {
                    position: absolute;
                    font-size: 3rem;
                    z-index: 10000;
                    pointer-events: none;
                    animation: reaction-float 3s ease-out forwards;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
                }

                @keyframes reaction-float {
                    0% {
                        transform: translateY(0) scale(0.5) rotate(0deg);
                        opacity: 0;
                    }
                    20% {
                        transform: translateY(-100px) scale(1.2) rotate(10deg);
                        opacity: 1;
                    }
                    50% {
                        transform: translateY(-300px) scale(1) rotate(-5deg);
                        opacity: 0.8;
                    }
                    80% {
                        transform: translateY(-500px) scale(0.8) rotate(15deg);
                        opacity: 0.4;
                    }
                    100% {
                        transform: translateY(-700px) scale(0.3) rotate(25deg);
                        opacity: 0;
                    }
                }

                .reaction-animation.reaction-hearts {
                    color: #dc3545;
                    animation: reaction-hearts-float 3s ease-out forwards;
                }

                .reaction-animation.reaction-likes {
                    color: #198754;
                    animation: reaction-likes-float 3s ease-out forwards;
                }

                .reaction-animation.reaction-fire {
                    color: #ffc107;
                    animation: reaction-fire-float 3s ease-out forwards;
                }

                @keyframes reaction-hearts-float {
                    0% {
                        transform: translateY(0) scale(0.5) rotate(0deg);
                        opacity: 0;
                        filter: hue-rotate(0deg) brightness(1);
                    }
                    20% {
                        transform: translateY(-100px) scale(1.5) rotate(-10deg);
                        opacity: 1;
                        filter: hue-rotate(20deg) brightness(1.2);
                    }
                    50% {
                        transform: translateY(-300px) scale(1.2) rotate(10deg);
                        opacity: 0.9;
                        filter: hue-rotate(-10deg) brightness(1.1);
                    }
                    80% {
                        transform: translateY(-500px) scale(0.9) rotate(-20deg);
                        opacity: 0.5;
                        filter: hue-rotate(15deg) brightness(0.9);
                    }
                    100% {
                        transform: translateY(-700px) scale(0.4) rotate(30deg);
                        opacity: 0;
                        filter: hue-rotate(0deg) brightness(0.7);
                    }
                }

                @keyframes reaction-likes-float {
                    0% {
                        transform: translateY(0) scale(0.5) rotate(0deg);
                        opacity: 0;
                        filter: brightness(1);
                    }
                    20% {
                        transform: translateY(-120px) scale(1.3) rotate(15deg);
                        opacity: 1;
                        filter: brightness(1.3);
                    }
                    50% {
                        transform: translateY(-320px) scale(1.1) rotate(-10deg);
                        opacity: 0.8;
                        filter: brightness(1.1);
                    }
                    80% {
                        transform: translateY(-520px) scale(0.8) rotate(25deg);
                        opacity: 0.4;
                        filter: brightness(0.9);
                    }
                    100% {
                        transform: translateY(-720px) scale(0.3) rotate(-30deg);
                        opacity: 0;
                        filter: brightness(0.7);
                    }
                }

                @keyframes reaction-fire-float {
                    0% {
                        transform: translateY(0) scale(0.5) rotate(0deg);
                        opacity: 0;
                        filter: hue-rotate(0deg) brightness(1) saturate(1);
                    }
                    15% {
                        transform: translateY(-80px) scale(1.6) rotate(-15deg);
                        opacity: 1;
                        filter: hue-rotate(30deg) brightness(1.4) saturate(1.2);
                    }
                    30% {
                        transform: translateY(-180px) scale(1.4) rotate(20deg);
                        opacity: 0.9;
                        filter: hue-rotate(-20deg) brightness(1.3) saturate(1.1);
                    }
                    60% {
                        transform: translateY(-380px) scale(1) rotate(-25deg);
                        opacity: 0.7;
                        filter: hue-rotate(40deg) brightness(1.1) saturate(1);
                    }
                    85% {
                        transform: translateY(-580px) scale(0.7) rotate(35deg);
                        opacity: 0.3;
                        filter: hue-rotate(-15deg) brightness(0.9) saturate(0.8);
                    }
                    100% {
                        transform: translateY(-780px) scale(0.2) rotate(-40deg);
                        opacity: 0;
                        filter: hue-rotate(0deg) brightness(0.6) saturate(0.5);
                    }
                }

                /* Responsive animations */
                @media (max-width: 768px) {
                    .reaction-animation {
                        font-size: 2rem;
                    }

                    @keyframes reaction-float {
                        0% {
                            transform: translateY(0) scale(0.3) rotate(0deg);
                            opacity: 0;
                        }
                        20% {
                            transform: translateY(-80px) scale(1) rotate(8deg);
                            opacity: 1;
                        }
                        50% {
                            transform: translateY(-200px) scale(0.8) rotate(-4deg);
                            opacity: 0.8;
                        }
                        80% {
                            transform: translateY(-320px) scale(0.6) rotate(12deg);
                            opacity: 0.4;
                        }
                        100% {
                            transform: translateY(-450px) scale(0.2) rotate(20deg);
                            opacity: 0;
                        }
                    }
                }

                /* =============== STYLES PERFORMANCE LIVE =============== */
                .demo-performance-test {
                    border: 2px solid rgba(255, 193, 7, 0.6) !important;
                    background: linear-gradient(135deg, rgba(255, 193, 7, 0.15), rgba(255, 140, 0, 0.1)) !important;
                    animation: live-control-glow 3s ease-in-out infinite alternate;
                }

                @keyframes live-control-glow {
                    from { box-shadow: 0 0 20px rgba(255, 193, 7, 0.3); }
                    to { box-shadow: 0 0 30px rgba(255, 193, 7, 0.5); }
                }

                .live-performance-badge {
                    animation: live-badge-pulse 1.5s ease-in-out infinite;
                }

                @keyframes live-badge-pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                }

                .performance-control-section {
                    max-width: 600px;
                    margin: 0 auto;
                }

                .start-live-performance-btn {
                    background: linear-gradient(135deg, #ffc107, #ff8f00) !important;
                    border: none !important;
                    color: #000000 !important;
                    font-weight: 700;
                    font-size: 1.1rem;
                    padding: 15px 30px;
                    border-radius: 8px;
                    box-shadow: 0 4px 15px rgba(255, 193, 7, 0.4);
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .start-live-performance-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 25px rgba(255, 193, 7, 0.6);
                    background: linear-gradient(135deg, #ffcd39, #ffa000) !important;
                    color: #000000 !important;
                }

                .live-pulse-large {
                    width: 20px;
                    height: 20px;
                    background: #dc3545;
                    border-radius: 50%;
                    margin: 0 auto 15px;
                    animation: pulse-large 1.2s infinite;
                }

                @keyframes pulse-large {
                    0% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7); }
                    70% { opacity: 0.7; transform: scale(1.3); box-shadow: 0 0 0 10px rgba(220, 53, 69, 0); }
                    100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
                }

                .performance-stats {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 8px;
                    padding: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .stat-item {
                    text-align: center;
                }

                .stat-number {
                    font-size: 2rem;
                    font-weight: bold;
                    line-height: 1;
                    margin-bottom: 5px;
                }

                .stat-label {
                    font-size: 0.9rem;
                    color: #adb5bd;
                    font-weight: 500;
                }

                .stop-live-performance-btn {
                    border: 2px solid #dc3545 !important;
                    color: #dc3545 !important;
                    font-weight: 600;
                    padding: 12px 25px;
                    border-radius: 6px;
                    transition: all 0.3s ease;
                }

                .stop-live-performance-btn:hover {
                    background: #dc3545 !important;
                    color: #ffffff !important;
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(220, 53, 69, 0.4);
                }

                /* Responsive pour performance live */
                @media (max-width: 768px) {
                    .start-live-performance-btn {
                        font-size: 1rem;
                        padding: 12px 20px;
                    }

                    .stat-number {
                        font-size: 1.5rem;
                    }

                    .stat-label {
                        font-size: 0.8rem;
                    }

                    .performance-stats {
                        padding: 15px;
                    }

                    .live-pulse-large {
                        width: 16px;
                        height: 16px;
                    }
                }

                /* =============== TIMER DE PERFORMANCE =============== */
                .performance-timer {
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 8px;
                    padding: 12px;
                    margin-top: 15px;
                }

                .timer-display {
                    font-size: 1.1rem;
                    font-weight: 600;
                    text-align: center;
                    margin-bottom: 8px;
                    color: #198754;
                    transition: color 0.3s ease;
                }

                .timer-display.timer-warning {
                    color: #ffc107;
                    animation: timer-warning-pulse 1s infinite;
                }

                .timer-display.timer-danger {
                    color: #dc3545;
                    animation: timer-danger-pulse 0.5s infinite;
                }

                @keyframes timer-warning-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }

                @keyframes timer-danger-pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.05); }
                }

                .timer-progress {
                    width: 100%;
                    height: 6px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 3px;
                    overflow: hidden;
                }

                .timer-progress-bar {
                    height: 100%;
                    transition: width 1s linear, background-color 0.3s ease;
                    border-radius: 3px;
                }

                /* Instructions pour auditeurs */
                .listening-instructions {
                    background: rgba(23, 162, 184, 0.1);
                    border: 1px solid rgba(23, 162, 184, 0.3);
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 15px;
                }

                .listening-instructions h6 {
                    color: #17a2b8;
                    margin-bottom: 10px;
                }

                .listening-instructions p {
                    color: #ffffff;
                    margin-bottom: 0;
                    font-size: 0.9rem;
                }

                .spectator-actions {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                }

                .action-item {
                    padding: 15px;
                    margin-bottom: 15px;
                }

                .action-item:last-child {
                    margin-bottom: 0;
                }

                .action-text {
                    color: #ffffff;
                    font-weight: 500;
                    font-size: 0.9rem;
                    margin-top: 8px;
                }

                .listening-status {
                    background: rgba(25, 135, 84, 0.1);
                    border-radius: 8px;
                    padding: 15px;
                    border: 1px solid rgba(25, 135, 84, 0.3);
                }

                /* Responsive pour spectateurs */
                @media (max-width: 768px) {
                    .spectator-actions {
                        padding: 15px;
                    }

                    .action-item {
                        padding: 10px;
                        margin-bottom: 10px;
                    }

                    .action-text {
                        font-size: 0.8rem;
                    }
                }

                /* =============== CORRECTIONS COULEURS TEXTE =============== */
                .participant-name {
                    font-weight: bold;
                    color: #ffffff !important;
                    font-size: 0.95rem;
                }

                .participant-score-display {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                }

                .total-score {
                    color: #ffc107 !important;
                    font-weight: 600;
                    font-size: 0.9rem;
                }

                .reaction-count {
                    font-size: 0.8rem;
                    font-weight: 500;
                }

                .reaction-count.hearts {
                    color: #ff6b7a !important;
                }

                .reaction-count.likes {
                    color: #51cf66 !important;
                }

                .reaction-count.fire {
                    color: #ffc947 !important;
                }

                .rank-number {
                    color: #dee2e6 !important;
                    font-weight: 600;
                }

                .rank-silver {
                    color: #e9ecef !important;
                    font-size: 1.2rem;
                }

                .rank-bronze {
                    color: #cd7f32 !important;
                    font-size: 1.2rem;
                }

                .no-participants-text {
                    color: #adb5bd !important;
                    font-size: 0.95rem;
                }

                .performing-badge {
                    background-color: #198754 !important;
                    color: #ffffff !important;
                    font-size: 0.7rem;
                    padding: 4px 8px;
                }

                .winner-badge {
                    background-color: #ffc107 !important;
                    color: #000000 !important;
                    font-size: 0.75rem;
                    padding: 4px 8px;
                    font-weight: 700;
                    animation: winner-badge-glow 2s infinite;
                }

                @keyframes winner-badge-glow {
                    0%, 100% {
                        box-shadow: 0 0 5px rgba(255, 193, 7, 0.5);
                        transform: scale(1);
                    }
                    50% {
                        box-shadow: 0 0 15px rgba(255, 193, 7, 0.8);
                        transform: scale(1.05);
                    }
                }

                /* =============== CHAT SCROLLBAR =============== */
                .chat-messages {
                    height: 400px;
                    overflow-y: auto;
                    padding: 15px;
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 8px;
                    scrollbar-width: thin;
                    scrollbar-color: #6c757d #343a40;
                }

                .chat-messages::-webkit-scrollbar {
                    width: 8px;
                }

                .chat-messages::-webkit-scrollbar-track {
                    background: rgba(52, 58, 64, 0.5);
                    border-radius: 4px;
                }

                .chat-messages::-webkit-scrollbar-thumb {
                    background: linear-gradient(to bottom, #6c757d, #495057);
                    border-radius: 4px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .chat-messages::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(to bottom, #868e96, #6c757d);
                }

                /* =============== MESSAGES CHAT AMÉLIORÉS =============== */
                .chat-message {
                    margin-bottom: 12px;
                    padding: 8px 12px;
                    border-radius: 8px;
                    transition: all 0.3s ease;
                }

                .chat-message:hover {
                    background: rgba(255, 255, 255, 0.05);
                }

                .chat-message.own {
                    background: rgba(13, 110, 253, 0.15);
                    border-left: 3px solid #0d6efd;
                }

                .chat-message.system {
                    background: rgba(255, 193, 7, 0.15);
                    border-left: 3px solid #ffc107;
                    border-radius: 6px;
                }

                .chat-message.winner {
                    background: linear-gradient(135deg, rgba(255, 193, 7, 0.25), rgba(255, 140, 0, 0.15));
                    border: 2px solid #ffc107;
                    border-radius: 10px;
                    animation: winner-message-glow 3s ease-in-out;
                }

                .chat-message.system.isPodium {
                    background: linear-gradient(135deg, rgba(40, 167, 69, 0.2), rgba(25, 135, 84, 0.15));
                    border-left: 3px solid #28a745;
                }

                .chat-message.system.isInfo {
                    background: rgba(23, 162, 184, 0.15);
                    border-left: 3px solid #17a2b8;
                }

                @keyframes winner-message-glow {
                    0%, 100% {
                        box-shadow: 0 0 10px rgba(255, 193, 7, 0.3);
                        transform: scale(1);
                    }
                    50% {
                        box-shadow: 0 0 25px rgba(255, 193, 7, 0.6);
                        transform: scale(1.02);
                    }
                }

                .chat-username {
                    font-size: 0.85rem;
                    font-weight: 600;
                }

                .chat-text {
                    color: #ffffff !important;
                    font-size: 0.9rem;
                    line-height: 1.4;
                    word-wrap: break-word;
                }

                .winner-text {
                    color: #ffc107 !important;
                    font-weight: 600;
                    font-size: 0.95rem;
                    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
                }

                /* =============== CLASSEMENT AMÉLIORÉ =============== */
                .participant-rank-card {
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 8px;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                .participant-rank-card:hover {
                    background: rgba(255, 255, 255, 0.12);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                }

                .participant-rank-card.performing {
                    background: linear-gradient(135deg, rgba(25, 135, 84, 0.2), rgba(40, 167, 69, 0.1));
                    border: 2px solid #28a745;
                    animation: performing-pulse 2s infinite;
                }

                @keyframes performing-pulse {
                    0%, 100% {
                        box-shadow: 0 0 15px rgba(40, 167, 69, 0.3);
                        border-color: #28a745;
                    }
                    50% {
                        box-shadow: 0 0 25px rgba(40, 167, 69, 0.5);
                        border-color: #51cf66;
                    }
                }

                .participant-rank-card.winner {
                    background: linear-gradient(135deg, rgba(255, 193, 7, 0.25), rgba(255, 140, 0, 0.15));
                    border: 2px solid #ffc107;
                    animation: winner-card-celebration 3s infinite;
                }

                @keyframes winner-card-celebration {
                    0%, 100% {
                        box-shadow: 0 0 20px rgba(255, 193, 7, 0.4);
                        transform: scale(1);
                    }
                    50% {
                        box-shadow: 0 0 30px rgba(255, 193, 7, 0.6);
                        transform: scale(1.02);
                    }
                }

                .participant-rank-card.leader {
                    background: linear-gradient(135deg, rgba(255, 193, 7, 0.15), rgba(255, 140, 0, 0.1));
                    border: 1px solid rgba(255, 193, 7, 0.5);
                    animation: leader-glow 3s infinite;
                }

                @keyframes leader-glow {
                    0%, 100% {
                        box-shadow: 0 0 10px rgba(255, 193, 7, 0.2);
                    }
                    50% {
                        box-shadow: 0 0 20px rgba(255, 193, 7, 0.4);
                    }
                }

                .participant-rank-card.podium::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(90deg, #ffd700, #ffa500, #ff6347);
                    opacity: 0.8;
                }

                /* =============== ANIMATIONS CONFETTIS =============== */
                .reaction-animation.reaction-confetti {
                    animation: confetti-celebration 4s ease-out forwards;
                    font-size: 2.5rem;
                }

                @keyframes confetti-celebration {
                    0% {
                        transform: translateY(0) scale(0.5) rotate(0deg);
                        opacity: 0;
                    }
                    10% {
                        transform: translateY(-50px) scale(1.3) rotate(180deg);
                        opacity: 1;
                    }
                    30% {
                        transform: translateY(-200px) scale(1.1) rotate(360deg);
                        opacity: 1;
                    }
                    60% {
                        transform: translateY(-400px) scale(0.9) rotate(540deg);
                        opacity: 0.8;
                    }
                    90% {
                        transform: translateY(-600px) scale(0.6) rotate(720deg);
                        opacity: 0.3;
                    }
                    100% {
                        transform: translateY(-800px) scale(0.2) rotate(900deg);
                        opacity: 0;
                    }
                }

                /* =============== RESPONSIVE AMÉLIORATIONS =============== */
                @media (max-width: 768px) {
                    .chat-messages {
                        height: 300px;
                        padding: 10px;
                    }

                    .participant-rank-card {
                        padding: 10px;
                        margin-bottom: 6px;
                    }

                    .participant-name {
                        font-size: 0.9rem;
                    }

                    .total-score {
                        font-size: 0.85rem;
                    }

                    .reaction-count {
                        font-size: 0.75rem;
                    }

                    .chat-text {
                        font-size: 0.85rem;
                    }

                    .winner-text {
                        font-size: 0.9rem;
                    }

                    .chat-username {
                        font-size: 0.8rem;
                    }

                    .performing-badge,
                    .winner-badge {
                        font-size: 0.65rem;
                        padding: 3px 6px;
                    }

                    .reaction-animation.reaction-confetti {
                        font-size: 2rem;
                    }
                }

                /* =============== AUTRES AMÉLIORATIONS COULEURS =============== */
                .live-competition-bg {
                    background: linear-gradient(135deg, #1a1d3a 0%, #2d3561 50%, #1a1d3a 100%) !important;
                    min-height: 100vh;
                }

                .text-muted {
                    color: #adb5bd !important;
                }

                .text-light {
                    color: #f8f9fa !important;
                }

                .text-white {
                    color: #ffffff !important;
                }

                .card.bg-dark {
                    background: rgba(33, 37, 41, 0.9) !important;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                }

                /* =============== EFFET SPEAKING =============== */
                .participant-rank-card.speaking {
                    animation: speaking-pulse 1s ease-in-out;
                    border-color: #17a2b8 !important;
                    box-shadow: 0 0 20px rgba(23, 162, 184, 0.6) !important;
                }

                @keyframes speaking-pulse {
                    0%, 100% {
                        transform: scale(1);
                        border-color: #17a2b8;
                    }
                    50% {
                        transform: scale(1.02);
                        border-color: #20c997;
                    }
                }

                /* =============== RESPONSIVE FINAL =============== */
                @media (max-width: 576px) {
                    .live-header .d-flex {
                        flex-direction: column;
                        align-items: flex-start !important;
                        gap: 10px;
                    }

                    .live-header .text-end {
                        text-align: left !important;
                    }

                    .performance-stage {
                        padding: 15px !important;
                    }

                    .performer-avatar {
                        width: 80px !important;
                        height: 80px !important;
                    }

                    .reaction-buttons .d-flex {
                        flex-direction: column;
                        gap: 8px !important;
                    }

                    .admin-control-card,
                    .admin-live-controls {
                        margin-bottom: 15px !important;
                    }

                    .start-competition-btn {
                        width: 100%;
                        padding: 12px 20px;
                        font-size: 1rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default LiveCompetition;
