import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Nav, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUser,
    faPlay,
    faDownload,
    faEdit,
    faMusic,
    faCalendarAlt,
    faMapMarkerAlt,
    faClock,
    faEye,
    faShoppingCart,
    faTicketAlt,
    faPlus,
    faTrash,
    faCheckCircle,
    faTimesCircle,
    faExclamationTriangle,
    faChartBar,
    faHeart,
    faTrophy,
    faCoins
} from '@fortawesome/free-solid-svg-icons';
import { AnimatedElement } from '../common/PageTransition';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const MyCreations = () => {
    const [activeTab, setActiveTab] = useState('stats');
    const [loading, setLoading] = useState(true);
    const [mySounds, setMySounds] = useState([]);
    const [myEvents, setMyEvents] = useState([]);
    const [stats, setStats] = useState({
        sounds: {
            pending: 0,
            published: 0,
            rejected: 0,
            total: 0,
            totalPlays: 0,
            totalLikes: 0,
            totalDownloads: 0,
            totalRevenue: 0
        },
        events: {
            pending: 0,
            active: 0,
            inactive: 0,
            total: 0,
            totalParticipants: 0,
            totalRevenue: 0
        }
    });
    const [error, setError] = useState('');
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedSound, setSelectedSound] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const { token, user } = useAuth();
    const toast = useToast();

    useEffect(() => {
        if (token) {
            loadMyCreations();
        }
    }, [token]);

    // Calculer les statistiques quand les données changent
    useEffect(() => {
        calculateStats();
    }, [mySounds, myEvents]);

    const calculateStats = () => {
        // Stats des sons
        const soundStats = {
            pending: mySounds.filter(s => s.status === 'pending').length,
            published: mySounds.filter(s => s.status === 'published').length,
            rejected: mySounds.filter(s => s.status === 'rejected').length,
            total: mySounds.length,
            totalPlays: mySounds.reduce((sum, s) => sum + (s.plays_count || s.plays || 0), 0),
            totalLikes: mySounds.reduce((sum, s) => sum + (s.likes_count || s.likes || 0), 0),
            totalDownloads: mySounds.reduce((sum, s) => sum + (s.downloads_count || s.downloads || 0), 0),
            totalRevenue: mySounds
                .filter(s => !s.is_free && s.status === 'published')
                .reduce((sum, s) => sum + (s.price || 0), 0)
        };

        // Stats des événements
        const eventStats = {
            pending: myEvents.filter(e => e.status === 'pending').length,
            active: myEvents.filter(e => e.status === 'active' || e.status === 'published').length,
            inactive: myEvents.filter(e => e.status === 'inactive' || e.status === 'cancelled').length,
            total: myEvents.length,
            totalParticipants: myEvents.reduce((sum, e) => sum + (e.tickets_sold || e.attendees_count || 0), 0),
            totalRevenue: myEvents
                .filter(e => !e.is_free)
                .reduce((sum, e) => sum + ((e.ticket_price || e.price || 0) * (e.tickets_sold || 0)), 0)
        };

        setStats({
            sounds: soundStats,
            events: eventStats
        });
    };

    const loadMyCreations = async () => {
        try {
            setLoading(true);
            setError('');

            // Charger mes sons créés (incluant ceux en attente d'approbation)
            const soundsResponse = await fetch('/api/sounds', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // Charger mes événements créés
            const eventsResponse = await fetch('/api/events', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (soundsResponse.ok) {
                const soundsData = await soundsResponse.json();
                console.log('Sons data:', soundsData); // Debug

                // Gérer différents formats de réponse API
                let soundsArray = [];
                if (Array.isArray(soundsData)) {
                    soundsArray = soundsData;
                } else if (soundsData.data && Array.isArray(soundsData.data)) {
                    soundsArray = soundsData.data;
                } else if (soundsData.sounds && Array.isArray(soundsData.sounds)) {
                    soundsArray = soundsData.sounds;
                }

                // Filtrer pour ne garder que les sons créés par l'utilisateur connecté
                // Maintenant inclut aussi les sons en attente
                const userSounds = soundsArray.filter(sound =>
                    sound.user_id === user?.id ||
                    sound.artist_id === user?.id ||
                    sound.created_by === user?.id
                );
                setMySounds(userSounds);
            } else {
                console.error('Erreur lors du chargement des sons');
                setMySounds([]);
            }

            if (eventsResponse.ok) {
                const eventsData = await eventsResponse.json();
                console.log('Événements data:', eventsData); // Debug

                // Gérer différents formats de réponse API
                let eventsArray = [];
                if (Array.isArray(eventsData)) {
                    eventsArray = eventsData;
                } else if (eventsData.data && Array.isArray(eventsData.data)) {
                    eventsArray = eventsData.data;
                } else if (eventsData.events && Array.isArray(eventsData.events)) {
                    eventsArray = eventsData.events;
                }

                // Filtrer pour ne garder que les événements créés par l'utilisateur connecté
                const userEvents = eventsArray.filter(event =>
                    event.user_id === user?.id ||
                    event.organizer_id === user?.id ||
                    event.created_by === user?.id
                );
                setMyEvents(userEvents);
            } else {
                console.error('Erreur lors du chargement des événements');
                setMyEvents([]);
            }

        } catch (error) {
            console.error('Erreur lors du chargement des créations:', error);
            setError('Impossible de charger vos créations');
            setMySounds([]);
            setMyEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveSound = async (soundId) => {
        setActionLoading(true);
        try {
            const response = await fetch(`/api/admin/sounds/${soundId}/approve`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                toast.success('Son approuvé', 'Le son a été approuvé avec succès');
                loadMyCreations(); // Recharger les données
                setShowApproveModal(false);
                setSelectedSound(null);
            } else {
                const errorData = await response.json();
                toast.error('Erreur', errorData.message || 'Impossible d\'approuver le son');
            }
        } catch (error) {
            console.error('Erreur lors de l\'approbation:', error);
            toast.error('Erreur', 'Erreur de connexion lors de l\'approbation');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectSound = async () => {
        if (!rejectReason.trim()) {
            toast.error('Erreur', 'La raison du rejet est obligatoire');
            return;
        }

        setActionLoading(true);
        try {
            const response = await fetch(`/api/admin/sounds/${selectedSound.id}/reject`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason: rejectReason.trim() })
            });

            if (response.ok) {
                toast.success('Son rejeté', 'Le son a été rejeté');
                loadMyCreations(); // Recharger les données
                setShowRejectModal(false);
                setRejectReason('');
                setSelectedSound(null);
            } else {
                const errorData = await response.json();
                toast.error('Erreur', errorData.message || 'Impossible de rejeter le son');
            }
        } catch (error) {
            console.error('Erreur lors du rejet:', error);
            toast.error('Erreur', 'Erreur de connexion lors du rejet');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteSound = async (soundId) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce son ?')) return;

        try {
            const response = await fetch(`/api/sounds/${soundId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setMySounds(prev => prev.filter(sound => sound.id !== soundId));
                toast.success('Supprimé', 'Son supprimé avec succès');
            } else {
                toast.error('Erreur', 'Impossible de supprimer le son');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            toast.error('Erreur', 'Erreur de connexion');
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;

        try {
            const response = await fetch(`/api/events/${eventId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setMyEvents(prev => prev.filter(event => event.id !== eventId));
                toast.success('Supprimé', 'Événement supprimé avec succès');
            } else {
                toast.error('Erreur', 'Impossible de supprimer l\'événement');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            toast.error('Erreur', 'Erreur de connexion');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-CM', {
            style: 'currency',
            currency: 'XAF',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'published': { variant: 'success', text: 'Publié', icon: faCheckCircle },
            'draft': { variant: 'warning', text: 'Brouillon', icon: faClock },
            'pending': { variant: 'info', text: 'En attente', icon: faClock },
            'rejected': { variant: 'danger', text: 'Rejeté', icon: faTimesCircle },
            'active': { variant: 'success', text: 'Actif', icon: faCheckCircle },
            'inactive': { variant: 'secondary', text: 'Inactif', icon: faTimesCircle }
        };
        const config = statusConfig[status] || { variant: 'secondary', text: status, icon: faClock };
        return (
            <Badge bg={config.variant}>
                <FontAwesomeIcon icon={config.icon} className="me-1" />
                {config.text}
            </Badge>
        );
    };

    // Séparer les sons par statut pour un meilleur affichage
    const pendingSounds = mySounds.filter(sound => sound.status === 'pending');
    const publishedSounds = mySounds.filter(sound => sound.status === 'published');
    const rejectedSounds = mySounds.filter(sound => sound.status === 'rejected');

    if (!token) {
        return (
            <div className="bg-light min-vh-100 d-flex align-items-center justify-content-center avoid-header-overlap">
                <div className="text-center">
                    <FontAwesomeIcon icon={faUser} size="3x" className="text-muted mb-3" />
                    <h3 className="text-muted mb-3">Connexion requise</h3>
                    <p className="text-secondary mb-4">Vous devez être connecté pour voir vos créations</p>
                    <Button as={Link} to="/login" variant="primary">
                        Se connecter
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-light min-vh-100 avoid-header-overlap">
            {/* Hero Section */}
            <section className="hero-gradient text-white py-4">
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={8} md={10} className="text-center">
                            <div className="slide-in">
                                <div className="mb-3">
                                    <FontAwesomeIcon
                                        icon={faUser}
                                        className="float-animation text-white"
                                        style={{ fontSize: '2.5rem', opacity: 0.9 }}
                                    />
                                </div>
                                <h1 className="mb-3 fw-bold text-white">
                                    Mes
                                    <br className="d-md-none" />
                                    <span className="text-gradient-light"> Créations</span>
                                </h1>
                                <p className="mb-0 opacity-90 fs-6">
                                    Gérez tous vos sons et événements créés
                                </p>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            <Container className="py-4">
                {error && (
                    <Alert variant="danger" className="mb-4">
                        <FontAwesomeIcon icon={faUser} className="me-2" />
                        {error}
                        <Button variant="link" className="p-0 ms-2" onClick={loadMyCreations}>
                            Réessayer
                        </Button>
                    </Alert>
                )}

                {/* Navigation Tabs */}
                <Row className="mb-4">
                    <Col>
                        <AnimatedElement animation="slideInUp" delay={200}>
                            <Nav variant="pills" className="justify-content-center">
                                <Nav.Item>
                                    <Nav.Link
                                        active={activeTab === 'sons'}
                                        onClick={() => setActiveTab('sons')}
                                        className="rounded-pill px-4"
                                    >
                                        <FontAwesomeIcon icon={faMusic} className="me-2" />
                                        Mes Sons ({mySounds.length})
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link
                                        active={activeTab === 'events'}
                                        onClick={() => setActiveTab('events')}
                                        className="rounded-pill px-4"
                                    >
                                        <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                                        Mes Événements ({myEvents.length})
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link
                                        active={activeTab === 'stats'}
                                        onClick={() => setActiveTab('stats')}
                                        className="rounded-pill px-4"
                                    >
                                        <FontAwesomeIcon icon={faChartBar} className="me-2" />
                                        Statistiques
                                    </Nav.Link>
                                </Nav.Item>
                            </Nav>
                        </AnimatedElement>
                    </Col>
                </Row>

                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" className="mb-3" />
                        <h5 className="text-muted">Chargement de vos créations...</h5>
                    </div>
                ) : (
                    <>
                        {/* Statistiques */}
                        {activeTab === 'stats' && (
                            <>
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h4>Tableau de bord</h4>
                                </div>

                                {/* Statistiques globales */}
                                <Row className="g-4 mb-5">
                                    <Col md={6} lg={3}>
                                        <AnimatedElement animation="slideInUp" delay={100}>
                                            <Card className="border-0 shadow-sm h-100">
                                                <Card.Body className="text-center">
                                                    <div className="text-primary mb-3">
                                                        <FontAwesomeIcon icon={faMusic} size="2x" />
                                                    </div>
                                                    <h3 className="fw-bold text-primary">{stats.sounds.total}</h3>
                                                    <p className="text-muted mb-0">Sons créés</p>
                                                </Card.Body>
                                            </Card>
                                        </AnimatedElement>
                                    </Col>
                                    <Col md={6} lg={3}>
                                        <AnimatedElement animation="slideInUp" delay={200}>
                                            <Card className="border-0 shadow-sm h-100">
                                                <Card.Body className="text-center">
                                                    <div className="text-success mb-3">
                                                        <FontAwesomeIcon icon={faCalendarAlt} size="2x" />
                                                    </div>
                                                    <h3 className="fw-bold text-success">{stats.events.total}</h3>
                                                    <p className="text-muted mb-0">Événements organisés</p>
                                                </Card.Body>
                                            </Card>
                                        </AnimatedElement>
                                    </Col>
                                    <Col md={6} lg={3}>
                                        <AnimatedElement animation="slideInUp" delay={300}>
                                            <Card className="border-0 shadow-sm h-100">
                                                <Card.Body className="text-center">
                                                    <div className="text-info mb-3">
                                                        <FontAwesomeIcon icon={faPlay} size="2x" />
                                                    </div>
                                                    <h3 className="fw-bold text-info">{stats.sounds.totalPlays}</h3>
                                                    <p className="text-muted mb-0">Écoutes totales</p>
                                                </Card.Body>
                                            </Card>
                                        </AnimatedElement>
                                    </Col>
                                    <Col md={6} lg={3}>
                                        <AnimatedElement animation="slideInUp" delay={400}>
                                            <Card className="border-0 shadow-sm h-100">
                                                <Card.Body className="text-center">
                                                    <div className="text-warning mb-3">
                                                        <FontAwesomeIcon icon={faCoins} size="2x" />
                                                    </div>
                                                    <h3 className="fw-bold text-warning">{formatCurrency(stats.sounds.totalRevenue + stats.events.totalRevenue)}</h3>
                                                    <p className="text-muted mb-0">Revenus générés</p>
                                                </Card.Body>
                                            </Card>
                                        </AnimatedElement>
                                    </Col>
                                </Row>

                                {/* Statistiques détaillées des sons */}
                                <Row className="g-4 mb-5">
                                    <Col lg={6}>
                                        <AnimatedElement animation="slideInLeft" delay={200}>
                                            <Card className="border-0 shadow-sm h-100">
                                                <Card.Header className="bg-light border-0">
                                                    <h5 className="mb-0">
                                                        <FontAwesomeIcon icon={faMusic} className="me-2 text-primary" />
                                                        Mes Sons
                                                    </h5>
                                                </Card.Header>
                                                <Card.Body>
                                                    <Row className="g-3">
                                                        <Col sm={6}>
                                                            <div className="d-flex align-items-center">
                                                                <div className="flex-shrink-0">
                                                                    <div className="bg-info bg-opacity-10 text-info rounded-circle p-2 d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                                                                        <FontAwesomeIcon icon={faClock} />
                                                                    </div>
                                                                </div>
                                                                <div className="flex-grow-1 ms-3">
                                                                    <h6 className="mb-0">{stats.sounds.pending}</h6>
                                                                    <small className="text-muted">En attente</small>
                                                                </div>
                                                            </div>
                                                        </Col>
                                                        <Col sm={6}>
                                                            <div className="d-flex align-items-center">
                                                                <div className="flex-shrink-0">
                                                                    <div className="bg-success bg-opacity-10 text-success rounded-circle p-2 d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                                                                        <FontAwesomeIcon icon={faCheckCircle} />
                                                                    </div>
                                                                </div>
                                                                <div className="flex-grow-1 ms-3">
                                                                    <h6 className="mb-0">{stats.sounds.published}</h6>
                                                                    <small className="text-muted">Publiés</small>
                                                                </div>
                                                            </div>
                                                        </Col>
                                                        <Col sm={6}>
                                                            <div className="d-flex align-items-center">
                                                                <div className="flex-shrink-0">
                                                                    <div className="bg-danger bg-opacity-10 text-danger rounded-circle p-2 d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                                                                        <FontAwesomeIcon icon={faTimesCircle} />
                                                                    </div>
                                                                </div>
                                                                <div className="flex-grow-1 ms-3">
                                                                    <h6 className="mb-0">{stats.sounds.rejected}</h6>
                                                                    <small className="text-muted">Rejetés</small>
                                                                </div>
                                                            </div>
                                                        </Col>
                                                        <Col sm={6}>
                                                            <div className="d-flex align-items-center">
                                                                <div className="flex-shrink-0">
                                                                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-2 d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                                                                        <FontAwesomeIcon icon={faHeart} />
                                                                    </div>
                                                                </div>
                                                                <div className="flex-grow-1 ms-3">
                                                                    <h6 className="mb-0">{stats.sounds.totalLikes}</h6>
                                                                    <small className="text-muted">Likes reçus</small>
                                                                </div>
                                                            </div>
                                                        </Col>
                                                        <Col sm={6}>
                                                            <div className="d-flex align-items-center">
                                                                <div className="flex-shrink-0">
                                                                    <div className="bg-warning bg-opacity-10 text-warning rounded-circle p-2 d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                                                                        <FontAwesomeIcon icon={faDownload} />
                                                                    </div>
                                                                </div>
                                                                <div className="flex-grow-1 ms-3">
                                                                    <h6 className="mb-0">{stats.sounds.totalDownloads}</h6>
                                                                    <small className="text-muted">Téléchargements</small>
                                                                </div>
                                                            </div>
                                                        </Col>
                                                        <Col sm={6}>
                                                            <div className="d-flex align-items-center">
                                                                <div className="flex-shrink-0">
                                                                    <div className="bg-success bg-opacity-10 text-success rounded-circle p-2 d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                                                                        <FontAwesomeIcon icon={faCoins} />
                                                                    </div>
                                                                </div>
                                                                <div className="flex-grow-1 ms-3">
                                                                    <h6 className="mb-0">{formatCurrency(stats.sounds.totalRevenue)}</h6>
                                                                    <small className="text-muted">Revenus sons</small>
                                                                </div>
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                </Card.Body>
                                            </Card>
                                        </AnimatedElement>
                                    </Col>

                                    {/* Statistiques détaillées des événements */}
                                    <Col lg={6}>
                                        <AnimatedElement animation="slideInRight" delay={200}>
                                            <Card className="border-0 shadow-sm h-100">
                                                <Card.Header className="bg-light border-0">
                                                    <h5 className="mb-0">
                                                        <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-success" />
                                                        Mes Événements
                                                    </h5>
                                                </Card.Header>
                                                <Card.Body>
                                                    <Row className="g-3">
                                                        <Col sm={6}>
                                                            <div className="d-flex align-items-center">
                                                                <div className="flex-shrink-0">
                                                                    <div className="bg-info bg-opacity-10 text-info rounded-circle p-2 d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                                                                        <FontAwesomeIcon icon={faClock} />
                                                                    </div>
                                                                </div>
                                                                <div className="flex-grow-1 ms-3">
                                                                    <h6 className="mb-0">{stats.events.pending}</h6>
                                                                    <small className="text-muted">En attente</small>
                                                                </div>
                                                            </div>
                                                        </Col>
                                                        <Col sm={6}>
                                                            <div className="d-flex align-items-center">
                                                                <div className="flex-shrink-0">
                                                                    <div className="bg-success bg-opacity-10 text-success rounded-circle p-2 d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                                                                        <FontAwesomeIcon icon={faCheckCircle} />
                                                                    </div>
                                                                </div>
                                                                <div className="flex-grow-1 ms-3">
                                                                    <h6 className="mb-0">{stats.events.active}</h6>
                                                                    <small className="text-muted">Actifs</small>
                                                                </div>
                                                            </div>
                                                        </Col>
                                                        <Col sm={6}>
                                                            <div className="d-flex align-items-center">
                                                                <div className="flex-shrink-0">
                                                                    <div className="bg-secondary bg-opacity-10 text-secondary rounded-circle p-2 d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                                                                        <FontAwesomeIcon icon={faTimesCircle} />
                                                                    </div>
                                                                </div>
                                                                <div className="flex-grow-1 ms-3">
                                                                    <h6 className="mb-0">{stats.events.inactive}</h6>
                                                                    <small className="text-muted">Inactifs</small>
                                                                </div>
                                                            </div>
                                                        </Col>
                                                        <Col sm={6}>
                                                            <div className="d-flex align-items-center">
                                                                <div className="flex-shrink-0">
                                                                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-2 d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                                                                        <FontAwesomeIcon icon={faUser} />
                                                                    </div>
                                                                </div>
                                                                <div className="flex-grow-1 ms-3">
                                                                    <h6 className="mb-0">{stats.events.totalParticipants}</h6>
                                                                    <small className="text-muted">Participants</small>
                                                                </div>
                                                            </div>
                                                        </Col>
                                                        <Col sm={12}>
                                                            <div className="d-flex align-items-center">
                                                                <div className="flex-shrink-0">
                                                                    <div className="bg-warning bg-opacity-10 text-warning rounded-circle p-2 d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                                                                        <FontAwesomeIcon icon={faCoins} />
                                                                    </div>
                                                                </div>
                                                                <div className="flex-grow-1 ms-3">
                                                                    <h6 className="mb-0">{formatCurrency(stats.events.totalRevenue)}</h6>
                                                                    <small className="text-muted">Revenus événements</small>
                                                                </div>
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                </Card.Body>
                                            </Card>
                                        </AnimatedElement>
                                    </Col>
                                </Row>

                                {/* Aperçu rapide des contenus récents */}
                                <Row className="g-4">
                                    {stats.sounds.pending > 0 && (
                                        <Col lg={6}>
                                            <AnimatedElement animation="slideInUp" delay={300}>
                                                <Card className="border-0 shadow-sm">
                                                    <Card.Header className="bg-warning bg-opacity-10 border-0">
                                                        <h6 className="mb-0 text-warning">
                                                            <FontAwesomeIcon icon={faClock} className="me-2" />
                                                            Sons en attente d'approbation
                                                        </h6>
                                                    </Card.Header>
                                                    <Card.Body>
                                                        {pendingSounds.slice(0, 3).map(sound => (
                                                            <div key={sound.id} className="d-flex align-items-center mb-2">
                                                                <div className="flex-shrink-0 me-3">
                                                                    <img
                                                                        src={sound.cover_image || sound.cover_image_url || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=50&h=50&fit=crop`}
                                                                        alt={sound.title}
                                                                        className="rounded"
                                                                        style={{width: '40px', height: '40px', objectFit: 'cover'}}
                                                                    />
                                                                </div>
                                                                <div className="flex-grow-1">
                                                                    <h6 className="mb-0 small">{sound.title}</h6>
                                                                    <small className="text-muted">Créé le {formatDate(sound.created_at)}</small>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {stats.sounds.pending > 3 && (
                                                            <small className="text-muted">+{stats.sounds.pending - 3} autres...</small>
                                                        )}
                                                        <div className="mt-3">
                                                            <Button
                                                                variant="warning"
                                                                size="sm"
                                                                onClick={() => setActiveTab('sons')}
                                                            >
                                                                Voir tous les sons
                                                            </Button>
                                                        </div>
                                                    </Card.Body>
                                                </Card>
                                            </AnimatedElement>
                                        </Col>
                                    )}

                                    {stats.sounds.published > 0 && (
                                        <Col lg={6}>
                                            <AnimatedElement animation="slideInUp" delay={400}>
                                                <Card className="border-0 shadow-sm">
                                                    <Card.Header className="bg-success bg-opacity-10 border-0">
                                                        <h6 className="mb-0 text-success">
                                                            <FontAwesomeIcon icon={faTrophy} className="me-2" />
                                                            Sons les plus populaires
                                                        </h6>
                                                    </Card.Header>
                                                    <Card.Body>
                                                        {publishedSounds
                                                            .sort((a, b) => (b.plays_count || 0) - (a.plays_count || 0))
                                                            .slice(0, 3)
                                                            .map(sound => (
                                                            <div key={sound.id} className="d-flex align-items-center mb-2">
                                                                <div className="flex-shrink-0 me-3">
                                                                    <img
                                                                        src={sound.cover_image || sound.cover_image_url || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=50&h=50&fit=crop`}
                                                                        alt={sound.title}
                                                                        className="rounded"
                                                                        style={{width: '40px', height: '40px', objectFit: 'cover'}}
                                                                    />
                                                                </div>
                                                                <div className="flex-grow-1">
                                                                    <h6 className="mb-0 small">{sound.title}</h6>
                                                                    <small className="text-muted">{sound.plays_count || 0} écoutes</small>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <div className="mt-3">
                                                            <Button
                                                                variant="success"
                                                                size="sm"
                                                                onClick={() => setActiveTab('sons')}
                                                            >
                                                                Voir tous les sons
                                                            </Button>
                                                        </div>
                                                    </Card.Body>
                                                </Card>
                                            </AnimatedElement>
                                        </Col>
                                    )}
                                </Row>
                            </>
                        )}

                        {/* Mes Sons */}
                        {activeTab === 'sons' && (
                            <>
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h4>Mes Sons</h4>
                                    <Button as={Link} to="/add-sound" variant="primary">
                                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                                        Nouveau son
                                    </Button>
                                </div>

                                {mySounds.length === 0 ? (
                                    <div className="text-center py-5">
                                        <FontAwesomeIcon
                                            icon={faMusic}
                                            size="3x"
                                            className="text-muted mb-3"
                                        />
                                        <h4 className="text-muted mb-3">Aucun son créé</h4>
                                        <p className="text-muted mb-4">
                                            Commencez par ajouter votre premier son
                                        </p>
                                        <Button as={Link} to="/add-sound" variant="primary">
                                            Créer mon premier son
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Sons en attente */}
                                        {pendingSounds.length > 0 && (
                                            <>
                                                <h5>Sons en attente</h5>
                                                <Row className="g-4">
                                                    {pendingSounds.map((sound, index) => (
                                                        <Col key={sound.id} lg={6} md={6}>
                                                            <AnimatedElement animation="slideInUp" delay={300 + (index * 100)}>
                                                                <Card className="h-100 shadow-sm border-0">
                                                                    <Row className="g-0">
                                                                        <Col md={4}>
                                                                            <Card.Img
                                                                                src={sound.cover_image || sound.cover_image_url || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=280&h=160&fit=crop`}
                                                                                alt={sound.title}
                                                                                style={{ height: '140px', objectFit: 'cover' }}
                                                                            />
                                                                        </Col>
                                                                        <Col md={8}>
                                                                            <Card.Body className="d-flex flex-column h-100">
                                                                                <div className="flex-grow-1">
                                                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                                                        <div>
                                                                                            <Card.Title className="h6 mb-1">{sound.title}</Card.Title>
                                                                                            <Card.Text className="small text-muted mb-1">
                                                                                                par {sound.artist || sound.user?.name || 'Artiste'}
                                                                                            </Card.Text>
                                                                                        </div>
                                                                                        {getStatusBadge(sound.status || 'published')}
                                                                                    </div>
                                                                                    <p className="small text-muted mb-2">
                                                                                        Créé le {formatDate(sound.created_at)}
                                                                                    </p>
                                                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                                                        <span className="small text-muted">
                                                                                            <FontAwesomeIcon icon={faClock} className="me-1" />
                                                                                            {sound.duration || '0:00'}
                                                                                        </span>
                                                                                        {sound.is_free || sound.price === 0 ? (
                                                                                            <span className="fw-bold text-success">Gratuit</span>
                                                                                        ) : (
                                                                                            <span className="fw-bold text-primary">
                                                                                                {formatCurrency(sound.price || 0)}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="d-flex justify-content-between align-items-center small text-muted">
                                                                                        <span>{sound.plays_count || sound.plays || 0} écoutes</span>
                                                                                        <span>{sound.downloads_count || sound.downloads || 0} téléchargements</span>
                                                                                    </div>
                                                                                    {sound.category && (
                                                                                        <Badge bg="secondary" className="mt-2">
                                                                                            {sound.category.name || sound.category}
                                                                                        </Badge>
                                                                                    )}
                                                                                </div>
                                                                                <div className="d-flex gap-2 mt-2">
                                                                                    <Button
                                                                                        as={Link}
                                                                                        to={`/sound/${sound.id}`}
                                                                                        variant="outline-primary"
                                                                                        size="sm"
                                                                                    >
                                                                                        <FontAwesomeIcon icon={faEye} />
                                                                                    </Button>
                                                                                    <Button
                                                                                        as={Link}
                                                                                        to={`/edit-sound/${sound.id}`}
                                                                                        variant="outline-success"
                                                                                        size="sm"
                                                                                    >
                                                                                        <FontAwesomeIcon icon={faEdit} />
                                                                                    </Button>
                                                                                    {/* Boutons d'approbation/rejet pour les admins */}
                                                                                    {user?.role === 'admin' && sound.status === 'pending' && (
                                                                                        <>
                                                                                            <Button
                                                                                                variant="success"
                                                                                                size="sm"
                                                                                                onClick={() => {
                                                                                                    setSelectedSound(sound);
                                                                                                    setShowApproveModal(true);
                                                                                                }}
                                                                                                disabled={actionLoading}
                                                                                                title="Approuver le son"
                                                                                            >
                                                                                                <FontAwesomeIcon icon={faCheckCircle} />
                                                                                            </Button>
                                                                                            <Button
                                                                                                variant="danger"
                                                                                                size="sm"
                                                                                                onClick={() => {
                                                                                                    setSelectedSound(sound);
                                                                                                    setShowRejectModal(true);
                                                                                                }}
                                                                                                disabled={actionLoading}
                                                                                                title="Rejeter le son"
                                                                                            >
                                                                                                <FontAwesomeIcon icon={faTimesCircle} />
                                                                                            </Button>
                                                                                        </>
                                                                                    )}
                                                                                    <Button
                                                                                        variant="outline-danger"
                                                                                        size="sm"
                                                                                        onClick={() => handleDeleteSound(sound.id)}
                                                                                    >
                                                                                        <FontAwesomeIcon icon={faTrash} />
                                                                                    </Button>
                                                                                </div>
                                                                            </Card.Body>
                                                                        </Col>
                                                                    </Row>
                                                                </Card>
                                                            </AnimatedElement>
                                                        </Col>
                                                    ))}
                                                </Row>
                                            </>
                                        )}

                                        {/* Sons publiés */}
                                        {publishedSounds.length > 0 && (
                                            <>
                                                <h5>Sons publiés</h5>
                                                <Row className="g-4">
                                                    {publishedSounds.map((sound, index) => (
                                                        <Col key={sound.id} lg={6} md={6}>
                                                            <AnimatedElement animation="slideInUp" delay={300 + (index * 100)}>
                                                                <Card className="h-100 shadow-sm border-0">
                                                                    <Row className="g-0">
                                                                        <Col md={4}>
                                                                            <Card.Img
                                                                                src={sound.cover_image || sound.cover_image_url || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=280&h=160&fit=crop`}
                                                                                alt={sound.title}
                                                                                style={{ height: '140px', objectFit: 'cover' }}
                                                                            />
                                                                        </Col>
                                                                        <Col md={8}>
                                                                            <Card.Body className="d-flex flex-column h-100">
                                                                                <div className="flex-grow-1">
                                                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                                                        <div>
                                                                                            <Card.Title className="h6 mb-1">{sound.title}</Card.Title>
                                                                                            <Card.Text className="small text-muted mb-1">
                                                                                                par {sound.artist || sound.user?.name || 'Artiste'}
                                                                                            </Card.Text>
                                                                                        </div>
                                                                                        {getStatusBadge(sound.status || 'published')}
                                                                                    </div>
                                                                                    <p className="small text-muted mb-2">
                                                                                        Créé le {formatDate(sound.created_at)}
                                                                                    </p>
                                                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                                                        <span className="small text-muted">
                                                                                            <FontAwesomeIcon icon={faClock} className="me-1" />
                                                                                            {sound.duration || '0:00'}
                                                                                        </span>
                                                                                        {sound.is_free || sound.price === 0 ? (
                                                                                            <span className="fw-bold text-success">Gratuit</span>
                                                                                        ) : (
                                                                                            <span className="fw-bold text-primary">
                                                                                                {formatCurrency(sound.price || 0)}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="d-flex justify-content-between align-items-center small text-muted">
                                                                                        <span>{sound.plays_count || sound.plays || 0} écoutes</span>
                                                                                        <span>{sound.downloads_count || sound.downloads || 0} téléchargements</span>
                                                                                    </div>
                                                                                    {sound.category && (
                                                                                        <Badge bg="secondary" className="mt-2">
                                                                                            {sound.category.name || sound.category}
                                                                                        </Badge>
                                                                                    )}
                                                                                </div>
                                                                                <div className="d-flex gap-2 mt-2">
                                                                                    <Button
                                                                                        as={Link}
                                                                                        to={`/sound/${sound.id}`}
                                                                                        variant="outline-primary"
                                                                                        size="sm"
                                                                                    >
                                                                                        <FontAwesomeIcon icon={faEye} />
                                                                                    </Button>
                                                                                    <Button
                                                                                        as={Link}
                                                                                        to={`/edit-sound/${sound.id}`}
                                                                                        variant="outline-success"
                                                                                        size="sm"
                                                                                    >
                                                                                        <FontAwesomeIcon icon={faEdit} />
                                                                                    </Button>
                                                                                    <Button
                                                                                        variant="outline-danger"
                                                                                        size="sm"
                                                                                        onClick={() => handleDeleteSound(sound.id)}
                                                                                    >
                                                                                        <FontAwesomeIcon icon={faTrash} />
                                                                                    </Button>
                                                                                </div>
                                                                            </Card.Body>
                                                                        </Col>
                                                                    </Row>
                                                                </Card>
                                                            </AnimatedElement>
                                                        </Col>
                                                    ))}
                                                </Row>
                                            </>
                                        )}

                                        {/* Sons rejetés */}
                                        {rejectedSounds.length > 0 && (
                                            <>
                                                <h5>Sons rejetés</h5>
                                                <Row className="g-4">
                                                    {rejectedSounds.map((sound, index) => (
                                                        <Col key={sound.id} lg={6} md={6}>
                                                            <AnimatedElement animation="slideInUp" delay={300 + (index * 100)}>
                                                                <Card className="h-100 shadow-sm border-0">
                                                                    <Row className="g-0">
                                                                        <Col md={4}>
                                                                            <Card.Img
                                                                                src={sound.cover_image || sound.cover_image_url || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=280&h=160&fit=crop`}
                                                                                alt={sound.title}
                                                                                style={{ height: '140px', objectFit: 'cover' }}
                                                                            />
                                                                        </Col>
                                                                        <Col md={8}>
                                                                            <Card.Body className="d-flex flex-column h-100">
                                                                                <div className="flex-grow-1">
                                                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                                                        <div>
                                                                                            <Card.Title className="h6 mb-1">{sound.title}</Card.Title>
                                                                                            <Card.Text className="small text-muted mb-1">
                                                                                                par {sound.artist || sound.user?.name || 'Artiste'}
                                                                                            </Card.Text>
                                                                                        </div>
                                                                                        {getStatusBadge(sound.status || 'published')}
                                                                                    </div>
                                                                                    <p className="small text-muted mb-2">
                                                                                        Créé le {formatDate(sound.created_at)}
                                                                                    </p>
                                                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                                                        <span className="small text-muted">
                                                                                            <FontAwesomeIcon icon={faClock} className="me-1" />
                                                                                            {sound.duration || '0:00'}
                                                                                        </span>
                                                                                        {sound.is_free || sound.price === 0 ? (
                                                                                            <span className="fw-bold text-success">Gratuit</span>
                                                                                        ) : (
                                                                                            <span className="fw-bold text-primary">
                                                                                                {formatCurrency(sound.price || 0)}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="d-flex justify-content-between align-items-center small text-muted">
                                                                                        <span>{sound.plays_count || sound.plays || 0} écoutes</span>
                                                                                        <span>{sound.downloads_count || sound.downloads || 0} téléchargements</span>
                                                                                    </div>
                                                                                    {sound.category && (
                                                                                        <Badge bg="secondary" className="mt-2">
                                                                                            {sound.category.name || sound.category}
                                                                                        </Badge>
                                                                                    )}
                                                                                </div>
                                                                                <div className="d-flex gap-2 mt-2">
                                                                                    <Button
                                                                                        as={Link}
                                                                                        to={`/sound/${sound.id}`}
                                                                                        variant="outline-primary"
                                                                                        size="sm"
                                                                                    >
                                                                                        <FontAwesomeIcon icon={faEye} />
                                                                                    </Button>
                                                                                    <Button
                                                                                        as={Link}
                                                                                        to={`/edit-sound/${sound.id}`}
                                                                                        variant="outline-success"
                                                                                        size="sm"
                                                                                    >
                                                                                        <FontAwesomeIcon icon={faEdit} />
                                                                                    </Button>
                                                                                    <Button
                                                                                        variant="outline-danger"
                                                                                        size="sm"
                                                                                        onClick={() => handleDeleteSound(sound.id)}
                                                                                    >
                                                                                        <FontAwesomeIcon icon={faTrash} />
                                                                                    </Button>
                                                                                </div>
                                                                            </Card.Body>
                                                                        </Col>
                                                                    </Row>
                                                                </Card>
                                                            </AnimatedElement>
                                                        </Col>
                                                    ))}
                                                </Row>
                                            </>
                                        )}
                                    </>
                                )}
                            </>
                        )}

                        {/* Mes Événements */}
                        {activeTab === 'events' && (
                            <>
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h4>Mes Événements</h4>
                                    <Button as={Link} to="/add-event" variant="primary">
                                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                                        Nouvel événement
                                    </Button>
                                </div>

                                {myEvents.length === 0 ? (
                                    <div className="text-center py-5">
                                        <FontAwesomeIcon
                                            icon={faCalendarAlt}
                                            size="3x"
                                            className="text-muted mb-3"
                                        />
                                        <h4 className="text-muted mb-3">Aucun événement créé</h4>
                                        <p className="text-muted mb-4">
                                            Commencez par organiser votre premier événement
                                        </p>
                                        <Button as={Link} to="/add-event" variant="primary">
                                            Créer mon premier événement
                                        </Button>
                                    </div>
                                ) : (
                                    <Row className="g-4">
                                        {myEvents.map((event, index) => (
                                            <Col key={event.id} lg={4} md={6}>
                                                <AnimatedElement animation="slideInUp" delay={300 + (index * 100)}>
                                                    <Card className="h-100 shadow-sm border-0">
                                                        <div className="position-relative">
                                                            <Card.Img
                                                                variant="top"
                                                                src={event.poster_image_url || event.featured_image || event.image_url || `https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&h=250&fit=crop`}
                                                                style={{ height: '180px', objectFit: 'cover' }}
                                                            />
                                                            {(event.is_free || event.ticket_price === 0) && (
                                                                <Badge bg="success" className="position-absolute top-0 start-0 m-3">
                                                                    Gratuit
                                                                </Badge>
                                                            )}
                                                            <div className="position-absolute top-0 end-0 m-3">
                                                                {getStatusBadge(event.status || 'active')}
                                                            </div>
                                                        </div>
                                                        <Card.Body className="d-flex flex-column">
                                                            <div className="flex-grow-1">
                                                                <Card.Title className="h6 mb-2">{event.title}</Card.Title>
                                                                <div className="d-flex align-items-center text-muted small mb-2">
                                                                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                                                                    {formatDate(event.event_date || event.date)}
                                                                </div>
                                                                <div className="d-flex align-items-center text-muted small mb-2">
                                                                    <FontAwesomeIcon icon={faClock} className="me-2" />
                                                                    {event.start_time || event.time}
                                                                </div>
                                                                <div className="d-flex align-items-center text-muted small mb-3">
                                                                    <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" />
                                                                    {event.venue || event.location}, {event.city}
                                                                </div>
                                                                <div className="text-center mb-3">
                                                                    {event.is_free || event.ticket_price === 0 ? (
                                                                        <span className="fw-bold text-success">Entrée gratuite</span>
                                                                    ) : (
                                                                        <span className="fw-bold text-primary">
                                                                            À partir de {formatCurrency(event.ticket_price || event.price || 0)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="d-flex justify-content-between small text-muted">
                                                                    <span>{event.tickets_sold || event.attendees_count || 0} participants</span>
                                                                    <span>{event.max_attendees || event.capacity || 'Illimité'} places</span>
                                                                </div>
                                                                {event.category && (
                                                                    <Badge bg="info" className="mt-2">
                                                                        {event.category.name || event.category}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="d-flex gap-2 mt-3">
                                                                <Button
                                                                    as={Link}
                                                                    to={`/event/${event.id}`}
                                                                    variant="outline-primary"
                                                                    size="sm"
                                                                >
                                                                    <FontAwesomeIcon icon={faEye} />
                                                                </Button>
                                                                <Button
                                                                    as={Link}
                                                                    to={`/edit-event/${event.id}`}
                                                                    variant="outline-success"
                                                                    size="sm"
                                                                >
                                                                    <FontAwesomeIcon icon={faEdit} />
                                                                </Button>
                                                                <Button
                                                                    variant="outline-danger"
                                                                    size="sm"
                                                                    onClick={() => handleDeleteEvent(event.id)}
                                                                >
                                                                    <FontAwesomeIcon icon={faTrash} />
                                                                </Button>
                                                            </div>
                                                        </Card.Body>
                                                    </Card>
                                                </AnimatedElement>
                                            </Col>
                                        ))}
                                    </Row>
                                )}
                            </>
                        )}
                    </>
                )}
            </Container>

            {/* Modales d'approbation/rejet pour les admins */}
            {user?.role === 'admin' && (
                <>
                    {/* Modal d'approbation */}
                    <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)}>
                        <Modal.Header closeButton>
                            <Modal.Title>
                                <FontAwesomeIcon icon={faCheckCircle} className="me-2 text-success" />
                                Approuver le son
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            {selectedSound && (
                                <div className="text-center">
                                    <div className="mb-3 p-3 bg-light rounded">
                                        <h6 className="fw-bold">{selectedSound.title}</h6>
                                        <small className="text-muted">par {selectedSound.artist || selectedSound.user?.name}</small>
                                    </div>
                                    <p>Êtes-vous sûr de vouloir approuver ce son ?</p>
                                    <p className="text-muted small">L'utilisateur recevra une notification d'approbation.</p>
                                </div>
                            )}
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowApproveModal(false)} disabled={actionLoading}>
                                Annuler
                            </Button>
                            <Button
                                variant="success"
                                onClick={() => handleApproveSound(selectedSound?.id)}
                                disabled={actionLoading}
                            >
                                {actionLoading ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Approbation...
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                                        Approuver
                                    </>
                                )}
                            </Button>
                        </Modal.Footer>
                    </Modal>

                    {/* Modal de rejet */}
                    <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)}>
                        <Modal.Header closeButton>
                            <Modal.Title>
                                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2 text-warning" />
                                Rejeter le son
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Alert variant="warning">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                                <strong>Attention !</strong> L'utilisateur sera automatiquement notifié par email.
                            </Alert>

                            {selectedSound && (
                                <div className="mb-3 p-3 bg-light rounded">
                                    <h6 className="fw-bold">{selectedSound.title}</h6>
                                    <small className="text-muted">par {selectedSound.artist || selectedSound.user?.name}</small>
                                </div>
                            )}

                            <Form.Group>
                                <Form.Label className="fw-bold">
                                    Raison du rejet <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={4}
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Expliquez clairement pourquoi ce son est rejeté (qualité audio, droits d'auteur, contenu inapproprié, etc.)..."
                                    required
                                />
                                <Form.Text className="text-muted">
                                    Cette raison sera envoyée à l'artiste. Soyez constructif et précis.
                                </Form.Text>
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectReason('');
                                }}
                                disabled={actionLoading}
                            >
                                Annuler
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleRejectSound}
                                disabled={!rejectReason.trim() || actionLoading}
                            >
                                {actionLoading ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Rejet en cours...
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faTimesCircle} className="me-2" />
                                        Confirmer le rejet
                                    </>
                                )}
                            </Button>
                        </Modal.Footer>
                    </Modal>
                </>
            )}
        </div>
    );
};

export default MyCreations;
