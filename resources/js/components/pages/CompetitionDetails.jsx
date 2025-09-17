import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, ProgressBar, Modal, Spinner, Form, Tab, Tabs, ListGroup } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTrophy,
    faMusic,
    faClock,
    faUsers,
    faCoins,
    faPlay,
    faStop,
    faPause,
    faArrowLeft,
    faShare,
    faHeart,
    faCheck,
    faLightbulb,
    faMicrophone,
    faHeadphones,
    faVolumeUp,
    faCrown,
    faFire,
    faCalendarAlt,
    faMapMarkerAlt,
    faEye,
    faThumbsUp,
    faComment,
    faDownload,
    faStar,
    faUpload,
    faInfo,
    faUserPlus,
    faUserMinus,
    faCommentDots,
    faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { AnimatedElement } from '../common/PageTransition';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import CategoryBadge from '../common/CategoryBadge';

const CompetitionDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [competition, setCompetition] = useState(null);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [activeTab, setActiveTab] = useState('participants');
    const [timeLeft, setTimeLeft] = useState('');
    const [isLive, setIsLive] = useState(false);
    const [userParticipation, setUserParticipation] = useState(null);
    const [isJoining, setIsJoining] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    const toast = useToast();
    const { token, user } = useAuth();

    useEffect(() => {
        loadCompetition();
    }, [id]);

    useEffect(() => {
        // Timer pour le compte à rebours
        const timer = setInterval(() => {
            if (competition) {
                updateTimeLeft();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [competition]);

    const loadCompetition = async () => {
        try {
            setLoading(true);

            const response = await fetch(`/api/competitions/${id}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Compétition non trouvée');
            }

            setCompetition(result.competition);
            setUserParticipation(result.user_participation);

        } catch (error) {
            console.error('Erreur lors du chargement de la compétition:', error);
            toast?.error('Erreur', error.message || 'Compétition non trouvée');
            navigate('/competitions');
        } finally {
            setLoading(false);
        }
    };

    const updateTimeLeft = () => {
        try {
            if (!competition || !competition.start_date || !competition.start_time) {
                setTimeLeft('Date non définie');
                return;
            }

            const now = new Date();

            // Créer la date de début
            let startDateTimeString;
            if (competition.start_time.includes('T') || competition.start_time.includes(' ')) {
                startDateTimeString = competition.start_time;
            } else {
                startDateTimeString = `${competition.start_date} ${competition.start_time}`;
            }

            const start = new Date(startDateTimeString);

            // Vérifier si la date est valide
            if (isNaN(start.getTime())) {
                setTimeLeft('Date invalide');
                return;
            }

            const end = new Date(start.getTime() + (competition.duration * 60 * 1000));

            if (now >= start && now <= end) {
                setIsLive(true);
                const diff = end - now;
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            } else if (now < start) {
                setIsLive(false);
                const diff = start - now;
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

                if (days > 0) {
                    setTimeLeft(`${days}j ${hours}h ${minutes}m`);
                } else if (hours > 0) {
                    setTimeLeft(`${hours}h ${minutes}m`);
                } else {
                    setTimeLeft(`${minutes}m`);
                }
            } else {
                setTimeLeft('Terminé');
                setIsLive(false);
            }
        } catch (error) {
            console.error('Erreur lors du calcul du temps restant:', error);
            setTimeLeft('Erreur de calcul');
            setIsLive(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-CM', {
            style: 'currency',
            currency: 'XAF',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDateTime = () => {
        try {
            if (!competition.start_date || !competition.start_time) {
                return 'Date non définie';
            }

            // Créer un objet Date valide
            let dateTimeString;

            // Si start_time contient déjà une date complète
            if (competition.start_time.includes('T') || competition.start_time.includes(' ')) {
                dateTimeString = competition.start_time;
            } else {
                // Combiner la date et l'heure
                dateTimeString = `${competition.start_date} ${competition.start_time}`;
            }

            const dateTime = new Date(dateTimeString);

            // Vérifier si la date est valide
            if (isNaN(dateTime.getTime())) {
                return 'Date invalide';
            }

            return dateTime.toLocaleString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Erreur lors du formatage de la date:', error);
            return 'Erreur de date';
        }
    };

    const getStatusBadge = (status) => {
        const spotsLeft = competition?.max_participants - competition?.current_participants;

        // Vérifier d'abord le statut de la compétition
        if (status === 'completed') {
            return (
                <Badge className="status-badge status-completed">
                    Terminé
                </Badge>
            );
        }

        if (status === 'active') {
            return (
                <Badge className="status-badge status-active">
                    <div className="live-dot"></div>
                    EN DIRECT
                </Badge>
            );
        }

        if (status === 'draft') {
            return (
                <Badge className="status-badge status-soon">
                    En préparation
                </Badge>
            );
        }

        if (status === 'cancelled') {
            return (
                <Badge className="status-badge status-full">
                    Annulée
                </Badge>
            );
        }

        // Pour les compétitions publiées, vérifier les conditions d'inscription
        if (status === 'published') {
            // Vérifier si les places sont épuisées
            if (spotsLeft <= 0) {
                return (
                    <Badge className="status-badge status-full">
                        Complet
                    </Badge>
                );
            }

            // Vérifier si la date est passée
            try {
                if (competition?.start_date && competition?.start_time) {
                    let startDateTimeString;
                    if (competition.start_time.includes('T') || competition.start_time.includes(' ')) {
                        startDateTimeString = competition.start_time;
                    } else {
                        startDateTimeString = `${competition.start_date} ${competition.start_time}`;
                    }

                    const startDate = new Date(startDateTimeString);
                    if (!isNaN(startDate.getTime()) && new Date() >= startDate) {
                        return (
                            <Badge className="status-badge status-full">
                                Déjà commencée
                            </Badge>
                        );
                    }
                }
            } catch (error) {
                console.error('Erreur lors de la vérification de la date:', error);
            }

            // Vérifier s'il y a urgence (peu de places restantes)
            if (spotsLeft <= 5) {
                return (
                    <Badge className="status-badge status-urgent">
                        🔥 {spotsLeft} places restantes
                    </Badge>
                );
            }

            // Inscriptions normalement ouvertes
            return (
                <Badge className="status-badge status-open">
                    <div className="status-dot"></div>
                    Inscriptions ouvertes
                </Badge>
            );
        }

        // Statut par défaut
        return <Badge className="status-badge status-soon">Bientôt</Badge>;
    };

    const getRegistrationMessage = () => {
        if (!competition) return null;

        const spotsLeft = competition.max_participants - competition.current_participants;

        // Vérifier le statut de la compétition
        if (competition.status !== 'published') {
            return {
                canRegister: false,
                title: "Inscriptions fermées",
                message: "Cette compétition n'est pas encore ouverte aux inscriptions.",
                reason: "not_published"
            };
        }

        // Vérifier si c'est complet
        if (spotsLeft <= 0) {
            return {
                canRegister: false,
                title: "Compétition complète",
                message: "Toutes les places ont été prises. Restez connecté pour les prochaines compétitions !",
                reason: "full"
            };
        }

        // Vérifier si la date est passée
        try {
            if (competition.start_date && competition.start_time) {
                let startDateTimeString;
                if (competition.start_time.includes('T') || competition.start_time.includes(' ')) {
                    startDateTimeString = competition.start_time;
                } else {
                    startDateTimeString = `${competition.start_date} ${competition.start_time}`;
                }

                const startDate = new Date(startDateTimeString);
                if (!isNaN(startDate.getTime()) && new Date() >= startDate) {
                    return {
                        canRegister: false,
                        title: "Compétition déjà commencée",
                        message: "Il n'est plus possible de s'inscrire car la compétition a déjà débuté.",
                        reason: "already_started"
                    };
                }
            }
        } catch (error) {
            console.error('Erreur lors de la vérification de la date:', error);
        }

        // Vérifier la deadline d'inscription
        if (competition.registration_deadline) {
            const deadline = new Date(competition.registration_deadline);
            if (!isNaN(deadline.getTime()) && new Date() > deadline) {
                return {
                    canRegister: false,
                    title: "Période d'inscription terminée",
                    message: "La date limite d'inscription est dépassée.",
                    reason: "deadline_passed"
                };
            }
        }

        // Inscriptions ouvertes
        return {
            canRegister: true,
            title: "Prêt à montrer votre talent ?",
            message: spotsLeft <= 5
                ? `⚡ Plus que ${spotsLeft} places disponibles !`
                : `${spotsLeft} places disponibles`,
            reason: "open"
        };
    };

    const handleJoinCompetition = () => {
        if (!token) {
            toast?.warning('Connexion requise', 'Vous devez être connecté pour participer');
            return;
        }

        const spotsLeft = competition.max_participants - competition.current_participants;
        if (spotsLeft <= 0) {
            toast?.error('Compétition complète', 'Toutes les places ont été prises');
            return;
        }

        setShowJoinModal(true);
    };

    const confirmJoinCompetition = async () => {
        try {
            setIsJoining(true);
            setPaymentLoading(true);

            // Étape 1: Créer le paiement avec la nouvelle route spécialisée
            const paymentResponse = await fetch('/api/competition-payments', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    user_id: user.id,
                    competition_id: competition.id,
                    amount: competition.entry_fee,
                    payment_method: 'card',
                    payment_provider: 'test_payment',
                    description: `Inscription à la compétition: ${competition.title}`
                })
            });

            const paymentResult = await paymentResponse.json();

            if (!paymentResponse.ok) {
                throw new Error(paymentResult.message || 'Erreur lors du traitement du paiement');
            }

            setPaymentLoading(false);
            setPaymentSuccess(true);

            // Attendre un peu pour l'effet visuel
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Étape 2: Procéder à l'inscription après paiement réussi
            const response = await fetch(`/api/competitions/${id}/register`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    payment_id: paymentResult.payment.id
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Erreur lors de l\'inscription');
            }

            toast?.success('Inscription confirmée', `Paiement réussi ! Vous êtes inscrit à "${competition.title}"`);
            setShowJoinModal(false);
            setPaymentSuccess(false);

            // Recharger les données de la compétition
            await loadCompetition();

        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);
            toast?.error('Erreur', error.message || 'Erreur lors de l\'inscription ou du paiement');
            setPaymentLoading(false);
            setPaymentSuccess(false);
        } finally {
            setIsJoining(false);
        }
    };

    const handleUnregister = async () => {
        try {
            const response = await fetch(`/api/competitions/${id}/unregister`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Erreur lors de la désinscription');
            }

            toast?.success('Désinscription confirmée', result.message || 'Vous êtes désinscrit de la compétition');

            // Recharger les données de la compétition
            await loadCompetition();

        } catch (error) {
            console.error('Erreur lors de la désinscription:', error);
            toast?.error('Erreur', error.message || 'Erreur lors de la désinscription');
        }
    };

    const handleUploadEntry = () => {
        if (!token) {
            toast?.warning('Connexion requise', 'Vous devez être connecté pour soumettre');
            return;
        }
        setShowUploadModal(true);
    };

    if (loading) {
        return (
            <div className="min-vh-100 bg-light avoid-header-overlap d-flex align-items-center justify-content-center">
                <div className="text-center">
                    <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
                    <h5 className="mt-3 text-muted">Chargement de la compétition...</h5>
                </div>
            </div>
        );
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

    return (
        <div className="social-container">
            {/* Header Section */}
            <div className="hero-section-social">
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={10} xl={8}>
                            <AnimatedElement animation="slideInUp" delay={100}>
                                <Button
                                    as={Link}
                                    to="/competitions"
                                    variant="outline-secondary"
                                    className="back-button mb-4"
                                    size="sm"
                                >
                                    <FontAwesomeIcon icon={faArrowLeft} className="me-2" size="xs" />
                                    Retour
                                </Button>

                                <Card className="hero-card">
                                    {competition.image_url && (
                                        <div className="hero-image-container">
                                            <img
                                                src={competition.image_url}
                                                alt={competition.title}
                                                className="hero-image"
                                            />
                                            <div className="hero-overlay"></div>
                                        </div>
                                    )}

                                    <Card.Body className="hero-content">
                                        <div className="status-section mb-3">
                                            {getStatusBadge(competition.status)}
                                            {competition.featured && (
                                                <Badge className="featured-badge ms-2">
                                                    <FontAwesomeIcon icon={faStar} className="me-1" size="xs" />
                                                    Populaire
                                                </Badge>
                                            )}
                                        </div>

                                        <h1 className="competition-title">{competition.title}</h1>

                                        <div className="organizer-info">
                                            <img
                                                src={competition.user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(competition.user.name)}&background=3b82f6&color=fff`}
                                                alt={competition.user.name}
                                                className="organizer-avatar"
                                            />
                                            <div className="organizer-details">
                                                <Link
                                                    to={`/artists/${competition.user.id}`}
                                                    className="organizer-name"
                                                >
                                                    {competition.user.name}
                                                </Link>
                                                <div className="organizer-role">Organisateur</div>
                                            </div>
                                        </div>

                                        <p className="competition-description">{competition.description}</p>
                                    </Card.Body>
                                </Card>
                            </AnimatedElement>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Main Content */}
            <Container>
                <Row className="justify-content-center">
                    <Col lg={10} xl={8}>
                        <AnimatedElement animation="slideInUp" delay={200}>
                            {/* Info Cards */}
                            <Row className="g-3 mb-4">
                                <Col md={3} sm={6}>
                                    <Card className="info-card text-center">
                                        <Card.Body className="py-3">
                                            <FontAwesomeIcon icon={faTrophy} className="info-icon text-warning" />
                                            <div className="info-value">{competition.formatted_total_prize_pool}</div>
                                            <div className="info-label">Cagnotte</div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3} sm={6}>
                                    <Card className="info-card text-center">
                                        <Card.Body className="py-3">
                                            <FontAwesomeIcon icon={faUsers} className="info-icon text-primary" />
                                            <div className="info-value">
                                                {competition.current_participants}/{competition.max_participants}
                                            </div>
                                            <div className="info-label">Participants</div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3} sm={6}>
                                    <Card className="info-card text-center">
                                        <Card.Body className="py-3">
                                            <FontAwesomeIcon icon={faCoins} className="info-icon text-success" />
                                            <div className="info-value">{competition.formatted_entry_fee}</div>
                                            <div className="info-label">Inscription</div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3} sm={6}>
                                    <Card className="info-card text-center">
                                        <Card.Body className="py-3">
                                            <FontAwesomeIcon icon={faClock} className="info-icon text-info" />
                                            <div className="info-value">{timeLeft}</div>
                                            <div className="info-label">{isLive ? 'Temps restant' : 'Débute dans'}</div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {/* Action Section */}
                            <Card className="action-card mb-4">
                                <Card.Body className="text-center py-4">
                                    {competition.status === 'published' && (
                                        <>
                                            {userParticipation ? (
                                                <div className="joined-state">
                                                    <FontAwesomeIcon icon={faCheck} className="check-icon" />
                                                    <h5 className="mb-2">Vous participez !</h5>
                                                    <p className="text-muted mb-3">Vous êtes inscrit à cette compétition</p>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={handleUnregister}
                                                    >
                                                        <FontAwesomeIcon icon={faUserMinus} className="me-2" size="xs" />
                                                        Se désinscrire
                                                    </Button>
                                                </div>
                                            ) : (
                                                (() => {
                                                    const regStatus = getRegistrationMessage();
                                                    return (
                                                        <div className="join-state">
                                                            <h5 className="mb-2">{regStatus.title}</h5>
                                                            <p className="text-muted mb-3">{regStatus.message}</p>
                                                            {regStatus.canRegister ? (
                                                                <Button
                                                                    variant="primary"
                                                                    size="lg"
                                                                    onClick={handleJoinCompetition}
                                                                    className="join-button"
                                                                >
                                                                    <FontAwesomeIcon icon={faUserPlus} className="me-2" size="xs" />
                                                                    Participer
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    variant="secondary"
                                                                    size="lg"
                                                                    disabled
                                                                    className="join-button-disabled"
                                                                >
                                                                    <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" size="xs" />
                                                                    Inscription fermée
                                                                </Button>
                                                            )}
                                                        </div>
                                                    );
                                                })()
                                            )}
                                        </>
                                    )}

                                    {competition.status === 'active' && (
                                        <div className="live-state">
                                            <div className="live-indicator mb-3">
                                                <div className="live-dot"></div>
                                                <span>EN DIRECT</span>
                                            </div>
                                            <Button
                                                variant="success"
                                                size="lg"
                                                as={Link}
                                                to={`/competitions/${competition.id}/live`}
                                                className="live-button"
                                            >
                                                <FontAwesomeIcon icon={faPlay} className="me-2" size="xs" />
                                                Regarder maintenant
                                            </Button>
                                        </div>
                                    )}

                                    {/* Bouton de démonstration live (toujours visible) */}
                                    <div className="demo-section mt-3">
                                        <div className="demo-divider mb-3">
                                            <hr className="demo-line" />
                                            <span className="demo-text">Mode Démonstration</span>
                                            <hr className="demo-line" />
                                        </div>
                                        <Button
                                            variant="outline-warning"
                                            size="md"
                                            as={Link}
                                            to={`/competitions/${competition.id}/live?demo=true`}
                                            className="demo-button"
                                        >
                                            <FontAwesomeIcon icon={faEye} className="me-2" size="xs" />
                                            Aperçu Live (Démo)
                                        </Button>
                                        <div className="demo-description mt-2">
                                            <small className="text-muted">
                                                Découvrez l'interface de compétition en direct avec des données simulées
                                            </small>
                                        </div>
                                    </div>

                                    {competition.status === 'completed' && (
                                        <div className="completed-state">
                                            <FontAwesomeIcon icon={faTrophy} className="trophy-icon mb-3" />
                                            <h5 className="mb-2">Compétition terminée</h5>
                                            <p className="text-muted mb-3">Cette compétition est maintenant terminée</p>
                                            <Button
                                                variant="outline-primary"
                                                size="lg"
                                                as={Link}
                                                to={`/competitions/${competition.id}/results`}
                                                className="results-button"
                                            >
                                                <FontAwesomeIcon icon={faTrophy} className="me-2" size="xs" />
                                                Voir les résultats
                                            </Button>
                                        </div>
                                    )}

                                    {(competition.status === 'draft' || competition.status === 'cancelled') && (
                                        <div className="unavailable-state">
                                            <FontAwesomeIcon icon={faExclamationTriangle} className="warning-icon mb-3" />
                                            <h5 className="mb-2">
                                                {competition.status === 'draft' ? 'En préparation' : 'Compétition annulée'}
                                            </h5>
                                            <p className="text-muted mb-3">
                                                {competition.status === 'draft'
                                                    ? 'Cette compétition est en cours de préparation'
                                                    : 'Cette compétition a été annulée'
                                                }
                                            </p>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>

                            {/* Tabs Content */}
                            <Tabs
                                activeKey={activeTab}
                                onSelect={(k) => setActiveTab(k)}
                                className="social-tabs mb-4"
                            >
                                {/* Participants Tab */}
                                <Tab
                                    eventKey="participants"
                                    title={
                                        <span>
                                            <FontAwesomeIcon icon={faUsers} className="me-2" size="xs" />
                                            Participants ({competition.current_participants})
                                        </span>
                                    }
                                >
                                    <Card className="participants-card">
                                        <Card.Body>
                                            {competition.participants && competition.participants.length > 0 ? (
                                                <div className="participants-grid">
                                                    {competition.participants.map((participant, index) => (
                                                        <div key={participant.id} className="participant-item">
                                                            <Link
                                                                to={`/artists/${participant.user.id}`}
                                                                className="participant-link"
                                                            >
                                                                <img
                                                                    src={participant.user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(participant.user.name)}&background=3b82f6&color=fff`}
                                                                    alt={participant.user.name}
                                                                    className="participant-avatar"
                                                                />
                                                                <div className="participant-info">
                                                                    <div className="participant-name">{participant.user.name}</div>
                                                                    <div className="participant-date">
                                                                        Inscrit le {new Date(participant.created_at).toLocaleDateString('fr-FR')}
                                                                    </div>
                                                                </div>
                                                                {index < 3 && (
                                                                    <div className="participant-rank">
                                                                        {index === 0 && '🥇'}
                                                                        {index === 1 && '🥈'}
                                                                        {index === 2 && '🥉'}
                                                                    </div>
                                                                )}
                                                            </Link>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="empty-state">
                                                    <FontAwesomeIcon icon={faUsers} className="empty-icon" />
                                                    <h5>Aucun participant</h5>
                                                    <p className="text-muted">Soyez le premier à vous inscrire !</p>
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Tab>

                                {/* Rules Tab */}
                                <Tab
                                    eventKey="rules"
                                    title={
                                        <span>
                                            <FontAwesomeIcon icon={faLightbulb} className="me-2" size="xs" />
                                            Règles
                                        </span>
                                    }
                                >
                                    <Card className="rules-card">
                                        <Card.Body>
                                            <h5 className="section-title">
                                                <FontAwesomeIcon icon={faLightbulb} className="me-2 text-primary" size="xs" />
                                                Règles de la compétition
                                            </h5>
                                            <div className="rules-list">
                                                {competition.rules && competition.rules.map((rule, index) => (
                                                    <div key={index} className="rule-item">
                                                        <FontAwesomeIcon icon={faCheck} className="rule-check" />
                                                        <span>{rule}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Tab>

                                {/* Prizes Tab */}
                                <Tab
                                    eventKey="prizes"
                                    title={
                                        <span>
                                            <FontAwesomeIcon icon={faTrophy} className="me-2" size="xs" />
                                            Prix
                                        </span>
                                    }
                                >
                                    <Card className="prizes-card">
                                        <Card.Body>
                                            <h5 className="section-title">
                                                <FontAwesomeIcon icon={faTrophy} className="me-2 text-warning" size="xs" />
                                                Répartition des prix
                                            </h5>
                                            <div className="prizes-list">
                                                {competition.prizes && competition.prizes.map((prize, index) => (
                                                    <div key={index} className="prize-item">
                                                        <div className="prize-rank">
                                                            {index === 0 && '🥇'}
                                                            {index === 1 && '🥈'}
                                                            {index === 2 && '🥉'}
                                                            {index > 2 && `#${index + 1}`}
                                                        </div>
                                                        <div className="prize-details">
                                                            <div className="prize-position">{prize.label}</div>
                                                            <div className="prize-percentage">{prize.percentage}% de la cagnotte</div>
                                                        </div>
                                                        <div className="prize-amount">
                                                            {formatCurrency((competition.entry_fee * competition.max_participants * prize.percentage) / 100)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Tab>

                                {/* Info Tab */}
                                <Tab
                                    eventKey="info"
                                    title={
                                        <span>
                                            <FontAwesomeIcon icon={faCalendarAlt} className="me-2" size="xs" />
                                            Infos
                                        </span>
                                    }
                                >
                                    <Row className="g-4">
                                        <Col md={8}>
                                            <Card className="info-details-card">
                                                <Card.Body>
                                                    <h5 className="section-title">
                                                        <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" size="xs" />
                                                        Détails de la compétition
                                                    </h5>
                                                    <div className="details-grid">
                                                        <div className="detail-item">
                                                            <div className="detail-label">Date et heure</div>
                                                            <div className="detail-value">{formatDateTime()}</div>
                                                        </div>
                                                        <div className="detail-item">
                                                            <div className="detail-label">Durée</div>
                                                            <div className="detail-value">{competition.duration} minutes</div>
                                                        </div>
                                                        <div className="detail-item">
                                                            <div className="detail-label">Catégorie</div>
                                                            <div className="detail-value">
                                                                <CategoryBadge category={competition.category} />
                                                            </div>
                                                        </div>
                                                        <div className="detail-item">
                                                            <div className="detail-label">Places disponibles</div>
                                                            <div className="detail-value">
                                                                {competition.max_participants - competition.current_participants} / {competition.max_participants}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col md={4}>
                                            <Card className="organizer-card">
                                                <Card.Body className="text-center">
                                                    <h5 className="section-title mb-3">Organisateur</h5>
                                                    <Link to={`/artists/${competition.user.id}`} className="organizer-profile-link">
                                                        <img
                                                            src={competition.user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(competition.user.name)}&background=3b82f6&color=fff`}
                                                            alt={competition.user.name}
                                                            className="organizer-profile-avatar"
                                                        />
                                                        <h6 className="organizer-profile-name">{competition.user.name}</h6>
                                                        <p className="organizer-profile-bio">
                                                            {competition.user.bio || 'Organisateur passionné de compétitions musicales'}
                                                        </p>
                                                    </Link>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>
                                </Tab>
                            </Tabs>
                        </AnimatedElement>
                    </Col>
                </Row>
            </Container>

            {/* Join Modal */}
            <Modal show={showJoinModal} onHide={() => setShowJoinModal(false)} centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title>
                        <FontAwesomeIcon icon={faTrophy} className="me-2 text-warning" size="xs" />
                        Rejoindre la compétition
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center">
                    <h5 className="mb-3">{competition.title}</h5>

                    {!paymentLoading && !paymentSuccess && (
                        <>
                            <div className="join-modal-stats">
                                <div className="join-stat">
                                    <div className="join-stat-value">{competition.formatted_entry_fee}</div>
                                    <div className="join-stat-label">Frais d'inscription</div>
                                </div>
                                <div className="join-stat">
                                    <div className="join-stat-value text-warning">
                                        {competition.prizes && competition.prizes[0] ?
                                            formatCurrency((competition.entry_fee * competition.max_participants * competition.prizes[0].percentage) / 100)
                                            : formatCurrency(competition.entry_fee * competition.max_participants * 0.5)
                                        }
                                    </div>
                                    <div className="join-stat-label">Premier prix</div>
                                </div>
                            </div>

                            <div className="payment-section">
                                <h6 className="payment-title">💳 Informations de paiement</h6>
                                <div className="payment-details">
                                    <div className="payment-item">
                                        <span className="payment-label">Type:</span>
                                        <span className="payment-value">Inscription compétition</span>
                                    </div>
                                    <div className="payment-item">
                                        <span className="payment-label">Montant:</span>
                                        <span className="payment-value">{competition.formatted_entry_fee}</span>
                                    </div>
                                    <div className="payment-item">
                                        <span className="payment-label">Devise:</span>
                                        <span className="payment-value">XAF (Franc CFA)</span>
                                    </div>
                                </div>
                            </div>

                            <div className="join-modal-info">
                                <FontAwesomeIcon icon={faLightbulb} className="me-2 text-primary" size="xs" />
                                En participant, vous acceptez les règles et autorisez la diffusion de votre performance.
                            </div>
                        </>
                    )}

                    {paymentLoading && (
                        <div className="payment-loading">
                            <div className="payment-spinner">
                                <Spinner animation="border" variant="primary" />
                            </div>
                            <h5 className="mt-3">Traitement du paiement...</h5>
                            <p className="text-muted">Veuillez patienter pendant que nous traitons votre paiement</p>
                            <div className="payment-progress">
                                <div className="progress-step active">
                                    <FontAwesomeIcon icon={faCoins} />
                                    <span>Paiement</span>
                                </div>
                                <div className="progress-step">
                                    <FontAwesomeIcon icon={faCheck} />
                                    <span>Confirmation</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {paymentSuccess && (
                        <div className="payment-success">
                            <div className="success-icon">
                                <FontAwesomeIcon icon={faCheck} />
                            </div>
                            <h5 className="text-success mt-3">Paiement réussi !</h5>
                            <p className="text-muted">Finalisation de votre inscription...</p>
                            <div className="payment-progress">
                                <div className="progress-step completed">
                                    <FontAwesomeIcon icon={faCoins} />
                                    <span>Paiement</span>
                                </div>
                                <div className="progress-step active">
                                    <FontAwesomeIcon icon={faCheck} />
                                    <span>Confirmation</span>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 justify-content-center">
                    {!paymentLoading && !paymentSuccess && (
                        <>
                            <Button variant="outline-secondary" onClick={() => setShowJoinModal(false)} disabled={isJoining}>
                                Annuler
                            </Button>
                            <Button variant="primary" onClick={confirmJoinCompetition} disabled={isJoining}>
                                {isJoining ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Traitement...
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faCoins} className="me-2" size="xs" />
                                        Payer et s'inscrire
                                    </>
                                )}
                            </Button>
                        </>
                    )}

                    {(paymentLoading || paymentSuccess) && (
                        <div className="payment-footer-text">
                            <small className="text-muted">
                                {paymentLoading && "Traitement du paiement en cours..."}
                                {paymentSuccess && "Finalisation de l'inscription..."}
                            </small>
                        </div>
                    )}
                </Modal.Footer>
            </Modal>

            {/* Upload Modal */}
            <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FontAwesomeIcon icon={faMicrophone} className="me-2 text-primary" />
                        Soumettre votre performance
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">Titre de votre performance</Form.Label>
                            <Form.Control type="text" placeholder="Ex: Mon freestyle de folie" />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">Fichier audio</Form.Label>
                            <Form.Control type="file" accept="audio/*" />
                            <Form.Text className="text-muted">
                                Formats acceptés: MP3, WAV, M4A (max 50MB)
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">Description (optionnel)</Form.Label>
                            <Form.Control as="textarea" rows={3} placeholder="Parlez-nous de votre performance..." />
                        </Form.Group>

                        <div className="alert alert-warning">
                            <FontAwesomeIcon icon={faLightbulb} className="me-2" />
                            <strong>Important :</strong> Assurez-vous que votre performance respecte
                            la durée maximum de 3 minutes et les règles de la compétition.
                        </div>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
                        Annuler
                    </Button>
                    <Button variant="primary">
                        <FontAwesomeIcon icon={faUpload} className="me-2" />
                        Soumettre
                    </Button>
                </Modal.Footer>
            </Modal>

            <style jsx>{`
                .social-container {
                    min-height: 100vh;
                    background: #f8fafc;
                    padding: 20px 0;
                }

                .hero-section-social {
                    margin-bottom: 2rem;
                }

                .back-button {
                    border: 1px solid #e2e8f0;
                    color: #64748b;
                    background: white;
                    font-weight: 500;
                    padding: 6px 12px;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                }

                .back-button:hover {
                    background: #f1f5f9;
                    border-color: #cbd5e1;
                    color: #3b82f6;
                }

                .hero-card {
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    overflow: hidden;
                    background: white;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }

                .hero-image-container {
                    position: relative;
                    height: 200px;
                    overflow: hidden;
                }

                .hero-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .hero-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%);
                }

                .hero-content {
                    padding: 24px;
                }

                .status-section {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .status-badge {
                    font-size: 0.7rem;
                    font-weight: 600;
                    padding: 4px 10px;
                    border-radius: 12px;
                    border: none;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .status-active {
                    background: #ef4444;
                    color: white;
                }

                .status-open {
                    background: #10b981;
                    color: white;
                }

                .status-urgent {
                    background: #f59e0b;
                    color: white;
                    animation: urgent-pulse 2s ease-in-out infinite;
                }

                .status-full {
                    background: #6b7280;
                    color: white;
                }

                .status-completed {
                    background: #6b7280;
                    color: white;
                }

                .status-soon {
                    background: #3b82f6;
                    color: white;
                }

                .featured-badge {
                    background: #fbbf24;
                    color: #1f2937;
                    font-size: 0.7rem;
                    font-weight: 600;
                    padding: 4px 10px;
                    border-radius: 12px;
                    border: none;
                }

                @keyframes urgent-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }

                .status-dot, .live-dot {
                    width: 6px;
                    height: 6px;
                    background: white;
                    border-radius: 50%;
                    animation: blink 1.5s ease-in-out infinite;
                }

                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }

                .competition-title {
                    font-size: 2rem;
                    font-weight: 800;
                    color: #1a202c;
                    margin-bottom: 1.5rem;
                    line-height: 1.2;
                }

                .organizer-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 1.5rem;
                }

                .organizer-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid #e2e8f0;
                }

                .organizer-name {
                    font-weight: 600;
                    color: #1a202c;
                    text-decoration: none;
                    transition: color 0.2s ease;
                }

                .organizer-name:hover {
                    color: #3b82f6;
                }

                .organizer-role {
                    font-size: 0.8rem;
                    color: #64748b;
                }

                .competition-description {
                    color: #64748b;
                    line-height: 1.6;
                    margin: 0;
                }

                .info-card {
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    background: white;
                    transition: all 0.2s ease;
                }

                .info-card:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    transform: translateY(-1px);
                }

                .info-icon {
                    font-size: 1.5rem;
                    margin-bottom: 8px;
                }

                .info-value {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: #1a202c;
                    margin-bottom: 4px;
                }

                .info-label {
                    font-size: 0.8rem;
                    color: #64748b;
                }

                .action-card {
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    background: white;
                }

                .joined-state .check-icon {
                    font-size: 3rem;
                    color: #10b981;
                    margin-bottom: 1rem;
                }

                .join-button {
                    background: #3b82f6;
                    border: none;
                    font-weight: 600;
                    padding: 12px 24px;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                }

                .join-button:hover {
                    background: #2563eb;
                    transform: translateY(-1px);
                }

                .join-button-disabled {
                    background: #9ca3af;
                    border: none;
                    font-weight: 600;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: not-allowed;
                }

                .live-indicator {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-weight: 600;
                    color: #ef4444;
                }

                .live-button {
                    background: #10b981;
                    border: none;
                    font-weight: 600;
                    padding: 12px 24px;
                    border-radius: 8px;
                }

                .social-tabs .nav-link {
                    border: none;
                    color: #64748b;
                    font-weight: 600;
                    padding: 8px 16px;
                    border-radius: 6px;
                    margin-right: 8px;
                    transition: all 0.2s ease;
                    background: transparent;
                    font-size: 0.9rem;
                }

                .social-tabs .nav-link.active {
                    background: #3b82f6;
                    color: white;
                }

                .social-tabs .nav-link:hover:not(.active) {
                    background: #f1f5f9;
                    color: #3b82f6;
                }

                .participants-card,
                .rules-card,
                .prizes-card,
                .info-details-card,
                .organizer-card {
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    background: white;
                }

                .participants-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .participant-item {
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 16px;
                    transition: all 0.2s ease;
                    background: white;
                }

                .participant-item:hover {
                    border-color: #3b82f6;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }

                .participant-link {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    text-decoration: none;
                    color: inherit;
                    position: relative;
                }

                .participant-avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid #e2e8f0;
                }

                .participant-name {
                    font-weight: 600;
                    color: #1a202c;
                    margin-bottom: 2px;
                }

                .participant-date {
                    font-size: 0.8rem;
                    color: #64748b;
                }

                .participant-rank {
                    position: absolute;
                    right: 0;
                    font-size: 1.5rem;
                }

                .empty-state {
                    text-align: center;
                    padding: 3rem 1rem;
                }

                .empty-icon {
                    font-size: 4rem;
                    color: #cbd5e1;
                    margin-bottom: 1rem;
                }

                .section-title {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: #1a202c;
                    margin-bottom: 1.5rem;
                    display: flex;
                    align-items: center;
                }

                .rules-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .rule-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    font-size: 0.9rem;
                    line-height: 1.5;
                }

                .rule-check {
                    color: #10b981;
                    margin-top: 2px;
                    flex-shrink: 0;
                }

                .prizes-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .prize-item {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px;
                    background: #f8fafc;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                }

                .prize-rank {
                    font-size: 2rem;
                    min-width: 60px;
                    text-align: center;
                }

                .prize-details {
                    flex: 1;
                }

                .prize-position {
                    font-weight: 600;
                    color: #1a202c;
                    margin-bottom: 2px;
                }

                .prize-percentage {
                    font-size: 0.8rem;
                    color: #64748b;
                }

                .prize-amount {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: #3b82f6;
                }

                .details-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .detail-item {
                    padding: 12px 0;
                    border-bottom: 1px solid #f1f5f9;
                }

                .detail-item:last-child {
                    border-bottom: none;
                }

                .detail-label {
                    font-size: 0.8rem;
                    color: #64748b;
                    margin-bottom: 4px;
                }

                .detail-value {
                    font-weight: 600;
                    color: #1a202c;
                }

                .organizer-profile-link {
                    text-decoration: none;
                    color: inherit;
                    transition: all 0.2s ease;
                }

                .organizer-profile-link:hover {
                    color: #3b82f6;
                }

                .organizer-profile-avatar {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 3px solid #e2e8f0;
                    margin-bottom: 12px;
                }

                .organizer-profile-name {
                    font-weight: 700;
                    color: #1a202c;
                    margin-bottom: 8px;
                }

                .organizer-profile-bio {
                    font-size: 0.9rem;
                    color: #64748b;
                    line-height: 1.4;
                    margin: 0;
                }

                .join-modal-stats {
                    display: flex;
                    gap: 20px;
                    justify-content: center;
                    margin: 2rem 0;
                }

                .join-stat {
                    text-align: center;
                }

                .join-stat-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1a202c;
                    margin-bottom: 4px;
                }

                .join-stat-label {
                    font-size: 0.8rem;
                    color: #64748b;
                }

                .join-modal-info {
                    background: #f1f5f9;
                    padding: 12px;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    color: #64748b;
                    margin-top: 1.5rem;
                }

                .payment-footer-text {
                    text-align: center;
                    padding: 1rem;
                }

                .payment-section {
                    margin-top: 1.5rem;
                    padding: 12px;
                    background: #f1f5f9;
                    border-radius: 8px;
                }

                .payment-title {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: #1a202c;
                    margin-bottom: 1.5rem;
                }

                .payment-details {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .payment-item {
                    display: flex;
                    justify-content: space-between;
                }

                .payment-label {
                    font-size: 0.8rem;
                    color: #64748b;
                }

                .payment-value {
                    font-size: 1rem;
                    font-weight: 600;
                    color: #1a202c;
                }

                .payment-loading {
                    text-align: center;
                    padding: 3rem 1rem;
                }

                .payment-spinner {
                    margin-bottom: 1rem;
                }

                .payment-progress {
                    display: flex;
                    justify-content: center;
                    gap: 16px;
                    margin-top: 1rem;
                }

                .progress-step {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .progress-step.active {
                    color: #3b82f6;
                }

                .progress-step.completed {
                    color: #10b981;
                }

                .payment-success {
                    text-align: center;
                    padding: 3rem 1rem;
                }

                .success-icon {
                    font-size: 4rem;
                    color: #10b981;
                    margin-bottom: 1rem;
                }

                .completed-state .trophy-icon {
                    font-size: 3rem;
                    color: #fbbf24;
                    margin-bottom: 1rem;
                }

                .unavailable-state .warning-icon {
                    font-size: 3rem;
                    color: #f59e0b;
                    margin-bottom: 1rem;
                }

                .results-button {
                    background: transparent;
                    border: 2px solid #3b82f6;
                    color: #3b82f6;
                    font-weight: 600;
                    padding: 12px 24px;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                }

                .results-button:hover {
                    background: #3b82f6;
                    color: white;
                    transform: translateY(-1px);
                }

                .demo-section {
                    text-align: center;
                    padding: 1rem;
                }

                .demo-divider {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    margin-bottom: 1rem;
                }

                .demo-line {
                    flex-grow: 1;
                    height: 1px;
                    background: #e2e8f0;
                }

                .demo-text {
                    font-weight: 600;
                    color: #64748b;
                }

                .demo-button {
                    background: transparent;
                    border: 2px solid #3b82f6;
                    color: #3b82f6;
                    font-weight: 600;
                    padding: 12px 24px;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                }

                .demo-button:hover {
                    background: #3b82f6;
                    color: white;
                    transform: translateY(-1px);
                }

                .demo-description {
                    font-size: 0.8rem;
                    color: #64748b;
                }

                @media (max-width: 768px) {
                    .competition-title {
                        font-size: 1.5rem;
                    }

                    .info-card .info-icon {
                        font-size: 1.2rem;
                    }

                    .info-value {
                        font-size: 1rem;
                    }

                    .participant-item {
                        padding: 12px;
                    }

                    .participant-avatar {
                        width: 40px;
                        height: 40px;
                    }

                    .join-modal-stats {
                        flex-direction: column;
                        gap: 16px;
                    }

                    .organizer-profile-avatar {
                        width: 60px;
                        height: 60px;
                    }
                }
            `}</style>
        </div>
    );
};

export default CompetitionDetails;
