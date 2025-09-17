import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Tab, Nav, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUser, faMusic, faHeart, faPlay, faDownload, faShare,
    faMapMarkerAlt, faCalendar, faCheckCircle, faUsers,
    faHeadphones, faPlus, faUserPlus, faUserCheck, faSpinner,
    faTicketAlt, faClock, faEuroSign, faArrowLeft, faEye, faStar,
    faChartLine, faTrophy, faFire, faCrown, faGem, faThumbsUp,
    faRocket, faAward, faShield, faBolt, faVideo
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const ArtistDetail = () => {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('overview');
    const [isFollowing, setIsFollowing] = useState(false);
    const [artist, setArtist] = useState(null);
    const [stats, setStats] = useState({});
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [popularSounds, setPopularSounds] = useState([]);
    const [recentSounds, setRecentSounds] = useState([]);
    const [artistCompetitions, setArtistCompetitions] = useState([]);
    const [artistClips, setArtistClips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const { token, user } = useAuth();
    const toast = useToast();

    useEffect(() => {
        loadArtist();
    }, [id]);

    const loadArtist = async () => {
        try {
            setLoading(true);
            const [artistRes, competitionsRes, clipsRes] = await Promise.all([
                fetch(`/api/artists/${id}`, {
                    headers: {
                        ...(token && { 'Authorization': `Bearer ${token}` }),
                        'Content-Type': 'application/json'
                    }
                }),
                fetch(`/api/artists/${id}/competitions`),
                fetch(`/api/artists/${id}/clips`)
            ]);

            const [artistData, competitionsData, clipsData] = await Promise.all([
                artistRes.json(),
                competitionsRes.json(),
                clipsRes.json()
            ]);

            if (artistData.success) {
                setArtist(artistData.artist);
                setStats(artistData.stats);
                setIsFollowing(artistData.is_following);
                setUpcomingEvents(artistData.upcoming_events);
                setPopularSounds(artistData.popular_sounds);
                setRecentSounds(artistData.recent_sounds);
            }

            if (competitionsData.success) {
                setArtistCompetitions(competitionsData.competitions || []);
            }

            if (clipsData.success) {
                setArtistClips(clipsData.clips || []);
            }
        } catch (error) {
            console.error('Erreur lors du chargement de l\'artiste:', error);
            toast.error('Erreur', 'Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        if (!user || !token) {
            toast.error('Connexion requise', 'Vous devez être connecté pour suivre un artiste');
            return;
        }

        try {
            setActionLoading(true);

            const response = await fetch(`/api/artists/${id}/follow`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                setIsFollowing(data.is_following);
                setArtist(prev => ({
                    ...prev,
                    followers_count: data.followers_count
                }));
                toast.success('Succès', data.message);
            } else {
                toast.error('Erreur', data.message);
            }
        } catch (error) {
            console.error('Erreur lors du suivi:', error);
            toast.error('Erreur', 'Erreur de connexion au serveur');
        } finally {
            setActionLoading(false);
        }
    };

    const formatNumber = (num) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num?.toString() || '0';
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-CM', {
            style: 'currency',
            currency: 'XAF',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getRoleDisplayName = (role) => {
        const roles = {
            'artist': 'Artiste',
            'producer': 'Producteur'
        };
        return roles[role] || role;
    };

    const getPopularityLevel = (plays) => {
        if (plays > 100000) return { level: 'Légende', color: '#FFD700', icon: faCrown };
        if (plays > 50000) return { level: 'Star', color: '#FF6B6B', icon: faStar };
        if (plays > 10000) return { level: 'Populaire', color: '#4ECDC4', icon: faFire };
        if (plays > 5000) return { level: 'Montant', color: '#45B7D1', icon: faRocket };
        return { level: 'Émergent', color: '#96CEB4', icon: faBolt };
    };

    if (loading) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
                <div className="text-center">
                    <Spinner animation="border" variant="primary" size="lg" className="mb-3" />
                    <h5 className="text-muted">Chargement des détails...</h5>
                </div>
            </div>
        );
    }

    if (!artist) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
                <div className="text-center">
                    <h5 className="text-muted">Artiste non trouvé</h5>
                    <Button as={Link} to="/artists" variant="primary" className="mt-3">
                        Retour aux artistes
                    </Button>
                </div>
            </div>
        );
    }

    const popularityData = getPopularityLevel(stats.total_plays || 0);

    return (
        <div className="social-artist-detail">
            {/* Header Section avec image de couverture */}
            <section className="artist-cover-section">
                <div className="artist-cover-container">
                    <div
                        className="artist-cover-bg"
                        style={{
                            backgroundImage: `url(${artist?.cover_image_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=400&fit=crop'})`,
                        }}
                    >
                        <div className="cover-overlay"></div>
                    </div>

                    {/* Back button */}
                    <div className="back-button-container">
                        <Button
                            as={Link}
                            to="/artists"
                            variant="light"
                            className="back-btn"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                            Retour
                        </Button>
                    </div>

                    {/* Informations principales */}
                    <Container className="artist-info-container">
                        <Row className="align-items-end">
                            <Col lg={8}>
                                <div className="artist-main-info">
                                    <div className="artist-avatar-section">
                                        <img
                                            src={artist.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.name)}&color=7F9CF5&background=EBF4FF&size=150`}
                                            alt={artist.name}
                                            className="artist-avatar"
                                        />
                                        <div className="artist-title-section">
                                            <h1 className="artist-name">{artist.name}</h1>
                                            <div className="artist-badges">
                                                <Badge bg="primary" className="role-badge">
                                                    {getRoleDisplayName(artist.role)}
                                                </Badge>
                                                {artist.verified && (
                                                    <Badge bg="success" className="verified-badge">
                                                        <FontAwesomeIcon icon={faShield} className="me-1" />
                                                        Vérifié
                                                    </Badge>
                                                )}
                                                <Badge
                                                    className="popularity-badge"
                                                    style={{ backgroundColor: popularityData.color }}
                                                >
                                                    <FontAwesomeIcon icon={popularityData.icon} className="me-1" />
                                                    {popularityData.level}
                                                </Badge>
                                            </div>
                                            <div className="artist-location">
                                                <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" />
                                                {artist.city || 'Localisation non renseignée'}
                                            </div>
                                            <div className="artist-member-since">
                                                Membre depuis {new Date(artist.created_at).toLocaleDateString('fr-FR', {
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                            <Col lg={4} className="text-end">
                                <div className="artist-actions">
                                    <Button
                                        variant={isFollowing ? "outline-light" : "primary"}
                                        size="lg"
                                        onClick={handleFollow}
                                        className="follow-btn"
                                        disabled={actionLoading || !user}
                                    >
                                        {actionLoading ? (
                                            <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                                        ) : isFollowing ? (
                                            <FontAwesomeIcon icon={faUserCheck} className="me-2" />
                                        ) : (
                                            <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                                        )}
                                        {isFollowing ? 'Suivi' : 'Suivre'}
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </div>
            </section>

            {/* Statistiques en cartes flottantes */}
            <section className="stats-floating-section">
                <Container>
                    <Row className="g-4">
                        <Col lg={3} md={6}>
                            <Card className="stat-card">
                                <Card.Body className="text-center">
                                    <div className="stat-icon text-primary">
                                        <FontAwesomeIcon icon={faHeadphones} size="2x" />
                                    </div>
                                    <h2 className="stat-number text-primary">{formatNumber(stats.total_plays || 0)}</h2>
                                    <p className="stat-label">Écoutes totales</p>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={3} md={6}>
                            <Card className="stat-card">
                                <Card.Body className="text-center">
                                    <div className="stat-icon text-success">
                                        <FontAwesomeIcon icon={faUsers} size="2x" />
                                    </div>
                                    <h2 className="stat-number text-success">{formatNumber(artist.followers_count || 0)}</h2>
                                    <p className="stat-label">Followers</p>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={3} md={6}>
                            <Card className="stat-card">
                                <Card.Body className="text-center">
                                    <div className="stat-icon text-warning">
                                        <FontAwesomeIcon icon={faMusic} size="2x" />
                                    </div>
                                    <h2 className="stat-number text-warning">{artist.sounds_count || 0}</h2>
                                    <p className="stat-label">Sons publiés</p>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={3} md={6}>
                            <Card className="stat-card">
                                <Card.Body className="text-center">
                                    <div className="stat-icon text-info">
                                        <FontAwesomeIcon icon={faCalendar} size="2x" />
                                    </div>
                                    <h2 className="stat-number text-info">{artist.events_count || 0}</h2>
                                    <p className="stat-label">Événements</p>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Content Tabs */}
            <section className="content-tabs-section">
                <Container>
                    <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
                        <Nav variant="pills" className="social-nav-pills">
                            <Nav.Item>
                                <Nav.Link eventKey="overview" className="nav-pill">
                                    <FontAwesomeIcon icon={faChartLine} className="me-2" />
                                    Vue d'ensemble
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="sounds" className="nav-pill">
                                    <FontAwesomeIcon icon={faMusic} className="me-2" />
                                    Sons ({popularSounds.length})
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="clips" className="nav-pill">
                                    <FontAwesomeIcon icon={faVideo} className="me-2" />
                                    Clips ({artistClips.length})
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="competitions" className="nav-pill">
                                    <FontAwesomeIcon icon={faTrophy} className="me-2" />
                                    Compétitions ({artistCompetitions.length})
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="events" className="nav-pill">
                                    <FontAwesomeIcon icon={faCalendar} className="me-2" />
                                    Événements ({upcomingEvents.length})
                                </Nav.Link>
                            </Nav.Item>
                        </Nav>

                        <div className="tab-content-area">
                            <Tab.Content>
                                {/* Overview Tab */}
                                <Tab.Pane eventKey="overview">
                                    <Row className="g-4">
                                        <Col lg={8}>
                                            {/* À propos */}
                                            <Card className="content-card">
                                                <Card.Body>
                                                    <h5 className="section-title">À propos de {artist.name}</h5>
                                                    <p className="bio-text">
                                                        {artist.bio || 'Aucune biographie disponible pour cet artiste.'}
                                                    </p>

                                                    <div className="artist-details">
                                                        <Row className="g-3">
                                                            <Col sm={6}>
                                                                <div className="detail-item">
                                                                    <span className="detail-label">Genre principal :</span>
                                                                    <span className="detail-value">{artist.genre || 'Non défini'}</span>
                                                                </div>
                                                            </Col>
                                                            <Col sm={6}>
                                                                <div className="detail-item">
                                                                    <span className="detail-label">Statut :</span>
                                                                    <span className="detail-value">
                                                                        {artist.verified ? (
                                                                            <Badge bg="success">Vérifié</Badge>
                                                                        ) : (
                                                                            <Badge bg="secondary">Non vérifié</Badge>
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                    </div>
                                                </Card.Body>
                                            </Card>

                                            {/* Top Songs Preview */}
                                            {popularSounds.length > 0 && (
                                                <Card className="content-card">
                                                    <Card.Header className="card-header-social">
                                                        <div className="header-title">
                                                            <FontAwesomeIcon icon={faTrophy} className="text-warning me-2" />
                                                            Top Sons
                                                        </div>
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => setActiveTab('sounds')}
                                                        >
                                                            Voir tout
                                                        </Button>
                                                    </Card.Header>
                                                    <Card.Body>
                                                        {popularSounds.slice(0, 4).map((sound, index) => (
                                                            <div key={sound.id} className="top-sound-item">
                                                                <div className="sound-rank">
                                                                    <Badge
                                                                        bg={index === 0 ? "warning" : index === 1 ? "secondary" : "light"}
                                                                        text={index === 2 ? "dark" : "white"}
                                                                        className="rank-badge"
                                                                    >
                                                                        {index + 1}
                                                                    </Badge>
                                                                </div>
                                                                <img
                                                                    src={sound.cover_image_url}
                                                                    alt={sound.title}
                                                                    className="sound-thumbnail"
                                                                />
                                                                <div className="sound-info">
                                                                    <h6 className="sound-title">{sound.title}</h6>
                                                                    <small className="sound-genre">{sound.genre}</small>
                                                                </div>
                                                                <div className="sound-stats">
                                                                    <div className="stat-number">{formatNumber(sound.plays_count || 0)}</div>
                                                                    <small className="stat-label">écoutes</small>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </Card.Body>
                                                </Card>
                                            )}
                                        </Col>
                                        <Col lg={4}>
                                            {/* Contact et actions */}
                                            <Card className="content-card">
                                                <Card.Body>
                                                    <h6 className="section-title">Contact</h6>
                                                    <div className="contact-actions">
                                                        {artist.email && (
                                                            <Button variant="outline-primary" size="sm" className="w-100 mb-2">
                                                                Envoyer un message
                                                            </Button>
                                                        )}
                                                        <Button variant="outline-secondary" size="sm" className="w-100">
                                                            Signaler le profil
                                                        </Button>
                                                    </div>
                                                </Card.Body>
                                            </Card>

                                            {/* Événements à venir */}
                                            {upcomingEvents.length > 0 && (
                                                <Card className="content-card">
                                                    <Card.Body>
                                                        <h6 className="section-title">
                                                            <FontAwesomeIcon icon={faCalendar} className="text-info me-2" />
                                                            Prochains événements
                                                        </h6>
                                                        {upcomingEvents.slice(0, 3).map((event) => (
                                                            <div key={event.id} className="event-preview-item">
                                                                <h6 className="event-title">{event.title}</h6>
                                                                <p className="event-location">
                                                                    <FontAwesomeIcon icon={faMapMarkerAlt} className="me-1" />
                                                                    {event.city}
                                                                </p>
                                                                <p className="event-date">
                                                                    <FontAwesomeIcon icon={faClock} className="me-1" />
                                                                    {new Date(event.event_date).toLocaleDateString('fr-FR')}
                                                                </p>
                                                            </div>
                                                        ))}
                                                        {upcomingEvents.length > 3 && (
                                                            <Button
                                                                variant="outline-info"
                                                                size="sm"
                                                                className="w-100"
                                                                onClick={() => setActiveTab('events')}
                                                            >
                                                                Voir tous les événements
                                                            </Button>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            )}
                                        </Col>
                                    </Row>
                                </Tab.Pane>

                                {/* Clips Tab */}
                                <Tab.Pane eventKey="clips">
                                    {artistClips.length === 0 ? (
                                        <div className="empty-state">
                                            <FontAwesomeIcon icon={faVideo} size="3x" className="text-muted mb-3" />
                                            <h5 className="text-muted">Aucun clip disponible</h5>
                                            <p className="text-muted">Cet artiste n'a pas encore publié de clips vidéos</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="section-header">
                                                <h4 className="section-title">
                                                    <FontAwesomeIcon icon={faVideo} className="text-primary me-2" />
                                                    Clips Vidéos de {artist.name}
                                                </h4>
                                                <Badge bg="primary" className="count-badge">
                                                    {artistClips.length} clip{artistClips.length > 1 ? 's' : ''}
                                                </Badge>
                                            </div>
                                            <Row className="g-4">
                                                {artistClips.map((clip, index) => (
                                                    <Col lg={4} md={6} key={clip.id}>
                                                        <Card className="media-card">
                                                            <div className="media-cover">
                                                                <img
                                                                    src={clip.thumbnail_url || `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=225&fit=crop`}
                                                                    alt={clip.title}
                                                                    className="media-image"
                                                                />
                                                                <div className="media-overlay">
                                                                    <Button
                                                                        variant="light"
                                                                        className="play-btn"
                                                                        size="lg"
                                                                    >
                                                                        <FontAwesomeIcon icon={faPlay} />
                                                                    </Button>
                                                                </div>
                                                                <div className="video-duration">
                                                                    {clip.duration || '0:00'}
                                                                </div>
                                                            </div>
                                                            <Card.Body>
                                                                <h6 className="media-title">{clip.title}</h6>
                                                                <p className="media-description">
                                                                    {clip.description?.substring(0, 80) || 'Aucune description'}...
                                                                </p>
                                                                <div className="media-stats">
                                                                    <span className="stat-item">
                                                                        <FontAwesomeIcon icon={faEye} />
                                                                        {formatNumber(clip.views || 0)}
                                                                    </span>
                                                                    <span className="stat-item">
                                                                        <FontAwesomeIcon icon={faHeart} />
                                                                        {formatNumber(clip.likes || 0)}
                                                                    </span>
                                                                    <span className="media-date">
                                                                        {new Date(clip.created_at).toLocaleDateString('fr-FR')}
                                                                    </span>
                                                                </div>
                                                                <Button
                                                                    as={Link}
                                                                    to={`/clips/${clip.id}`}
                                                                    variant="primary"
                                                                    size="sm"
                                                                    className="w-100 mt-2"
                                                                >
                                                                    <FontAwesomeIcon icon={faEye} className="me-1" />
                                                                    Regarder
                                                                </Button>
                                                            </Card.Body>
                                                        </Card>
                                                    </Col>
                                                ))}
                                            </Row>
                                        </div>
                                    )}
                                </Tab.Pane>

                                {/* Competitions Tab */}
                                <Tab.Pane eventKey="competitions">
                                    {artistCompetitions.length === 0 ? (
                                        <div className="empty-state">
                                            <FontAwesomeIcon icon={faTrophy} size="3x" className="text-muted mb-3" />
                                            <h5 className="text-muted">Aucune compétition créée</h5>
                                            <p className="text-muted">Cet artiste n'a pas encore organisé de compétitions</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="section-header">
                                                <h4 className="section-title">
                                                    <FontAwesomeIcon icon={faTrophy} className="text-warning me-2" />
                                                    Compétitions organisées par {artist.name}
                                                </h4>
                                                <Badge bg="warning" className="count-badge">
                                                    {artistCompetitions.length} compétition{artistCompetitions.length > 1 ? 's' : ''}
                                                </Badge>
                                            </div>
                                            <Row className="g-4">
                                                {artistCompetitions.map((competition, index) => (
                                                    <Col lg={6} key={competition.id}>
                                                        <Card className="media-card competition-card">
                                                            <div className="media-cover">
                                                                <img
                                                                    src={competition.image_url || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop`}
                                                                    alt={competition.title}
                                                                    className="media-image"
                                                                />
                                                                <div className="competition-overlay">
                                                                    <div className="prize-badge">
                                                                        <FontAwesomeIcon icon={faTrophy} className="me-1" />
                                                                        {competition.formatted_total_prize_pool || 'Prix à gagner'}
                                                                    </div>
                                                                </div>
                                                                {competition.status === 'active' && (
                                                                    <div className="status-indicator live">
                                                                        <div className="live-dot"></div>
                                                                        EN COURS
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <Card.Body>
                                                                <h6 className="media-title">{competition.title}</h6>
                                                                <p className="media-description">
                                                                    {competition.description?.substring(0, 80) || 'Participez à cette compétition'}...
                                                                </p>
                                                                <div className="competition-details">
                                                                    <div className="detail-row">
                                                                        <FontAwesomeIcon icon={faUsers} className="me-2" />
                                                                        {competition.current_participants || 0}/{competition.max_participants || '∞'} participants
                                                                    </div>
                                                                    <div className="detail-row">
                                                                        <FontAwesomeIcon icon={faCalendar} className="me-2" />
                                                                        {new Date(competition.start_date).toLocaleDateString('fr-FR')}
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    as={Link}
                                                                    to={`/competitions/${competition.id}`}
                                                                    variant="warning"
                                                                    size="sm"
                                                                    className="w-100 mt-2"
                                                                >
                                                                    <FontAwesomeIcon icon={faTrophy} className="me-1" />
                                                                    Voir détails
                                                                </Button>
                                                            </Card.Body>
                                                        </Card>
                                                    </Col>
                                                ))}
                                            </Row>
                                        </div>
                                    )}
                                </Tab.Pane>

                                {/* Autres tabs existants... */}
                                <Tab.Pane eventKey="sounds">
                                    {popularSounds.length === 0 ? (
                                        <div className="text-center py-5">
                                            <FontAwesomeIcon icon={faMusic} size="3x" className="text-muted mb-3" />
                                            <h5 className="text-muted">Aucun son disponible</h5>
                                            <p className="text-muted">Cet artiste n'a pas encore publié de sons</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Sons populaires */}
                                            <div className="mb-5">
                                                <div className="d-flex align-items-center justify-content-between mb-4">
                                                    <h4 className="fw-bold mb-0">
                                                        <FontAwesomeIcon icon={faTrophy} className="text-warning me-2" />
                                                        Sons populaires
                                                    </h4>
                                                    <Badge bg="warning" className="rounded-pill">
                                                        {popularSounds.length} son{popularSounds.length > 1 ? 's' : ''}
                                                    </Badge>
                                                </div>
                                                <Row className="g-4">
                                                    {popularSounds.map((sound, index) => (
                                                        <Col lg={3} md={4} sm={6} key={sound.id}>
                                                            <Card className="sound-card border-0 shadow-sm h-100 overflow-hidden">
                                                                <div className="position-relative">
                                                                    <img
                                                                        src={sound.cover_image_url}
                                                                        alt={sound.title}
                                                                        className="card-img-top"
                                                                        style={{ height: '200px', objectFit: 'cover' }}
                                                                    />
                                                                    <div className="position-absolute top-0 start-0 p-2">
                                                                        <Badge
                                                                            bg={index < 3 ? "warning" : "dark"}
                                                                            className="rounded-pill opacity-90"
                                                                        >
                                                                            #{index + 1}
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="position-absolute top-0 end-0 p-2">
                                                                        {sound.is_featured && (
                                                                            <Badge bg="success" className="rounded-pill">
                                                                                Vedette
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <Button
                                                                        variant="light"
                                                                        className="position-absolute top-50 start-50 translate-middle rounded-circle shadow-sm play-btn"
                                                                        style={{ width: '60px', height: '60px', opacity: 0.9 }}
                                                                    >
                                                                        <FontAwesomeIcon icon={faPlay} className="text-primary" />
                                                                    </Button>
                                                                </div>
                                                                <Card.Body className="p-3">
                                                                    <h6 className="fw-bold mb-2 text-truncate">{sound.title}</h6>
                                                                    <p className="text-muted small mb-2">{sound.genre || 'Non défini'}</p>
                                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                                        <div className="d-flex gap-3">
                                                                            <small className="text-primary">
                                                                                <FontAwesomeIcon icon={faPlay} className="me-1" />
                                                                                {formatNumber(sound.plays_count || 0)}
                                                                            </small>
                                                                            <small className="text-danger">
                                                                                <FontAwesomeIcon icon={faHeart} className="me-1" />
                                                                                {formatNumber(sound.likes_count || 0)}
                                                                            </small>
                                                                        </div>
                                                                    </div>
                                                                    <div className="d-flex justify-content-between align-items-center">
                                                                        <div className="fw-bold text-success">
                                                                            {sound.formatted_price || (sound.is_free ? 'Gratuit' : formatCurrency(sound.price || 0))}
                                                                        </div>
                                                                        <Button
                                                                            variant="outline-primary"
                                                                            size="sm"
                                                                            as={Link}
                                                                            to={`/sound/${sound.id}`}
                                                                        >
                                                                            <FontAwesomeIcon icon={faEye} className="me-1" />
                                                                            Voir
                                                                        </Button>
                                                                    </div>
                                                                </Card.Body>
                                                            </Card>
                                                        </Col>
                                                    ))}
                                                </Row>
                                            </div>

                                            {/* Sons récents */}
                                            {recentSounds.length > 0 && (
                                                <div>
                                                    <div className="d-flex align-items-center justify-content-between mb-4">
                                                        <h4 className="fw-bold mb-0">
                                                            <FontAwesomeIcon icon={faClock} className="text-info me-2" />
                                                            Nouveautés
                                                        </h4>
                                                        <Badge bg="info" className="rounded-pill">
                                                            {recentSounds.length} nouveau{recentSounds.length > 1 ? 'x' : ''}
                                                        </Badge>
                                                    </div>
                                                    <Row className="g-4">
                                                        {recentSounds.map((sound) => (
                                                            <Col lg={3} md={4} sm={6} key={sound.id}>
                                                                <Card className="sound-card border-0 shadow-sm h-100 overflow-hidden">
                                                                    <div className="position-relative">
                                                                        <img
                                                                            src={sound.cover_image_url}
                                                                            alt={sound.title}
                                                                            className="card-img-top"
                                                                            style={{ height: '200px', objectFit: 'cover' }}
                                                                        />
                                                                        <div className="position-absolute top-0 start-0 p-2">
                                                                            <Badge bg="dark" className="rounded-pill opacity-75">
                                                                                {sound.formatted_duration || '0:00'}
                                                                            </Badge>
                                                                        </div>
                                                                        <div className="position-absolute top-0 end-0 p-2">
                                                                            <Badge bg="info" className="rounded-pill">
                                                                                Nouveau
                                                                            </Badge>
                                                                        </div>
                                                                        <Button
                                                                            variant="light"
                                                                            className="position-absolute top-50 start-50 translate-middle rounded-circle shadow-sm play-btn"
                                                                            style={{ width: '60px', height: '60px', opacity: 0.9 }}
                                                                        >
                                                                            <FontAwesomeIcon icon={faPlay} className="text-primary" />
                                                                        </Button>
                                                                    </div>
                                                                    <Card.Body className="p-3">
                                                                        <h6 className="fw-bold mb-2 text-truncate">{sound.title}</h6>
                                                                        <p className="text-muted small mb-2">{sound.genre || 'Non défini'}</p>
                                                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                                                            <small className="text-muted">
                                                                                Publié le {new Date(sound.created_at).toLocaleDateString('fr-FR')}
                                                                            </small>
                                                                        </div>
                                                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                                                            <div className="d-flex gap-3">
                                                                                <small className="text-primary">
                                                                                    <FontAwesomeIcon icon={faPlay} className="me-1" />
                                                                                    {formatNumber(sound.plays_count || 0)}
                                                                                </small>
                                                                                <small className="text-danger">
                                                                                    <FontAwesomeIcon icon={faHeart} className="me-1" />
                                                                                    {formatNumber(sound.likes_count || 0)}
                                                                                </small>
                                                                            </div>
                                                                        </div>
                                                                        <div className="d-flex justify-content-between align-items-center">
                                                                            <div className="fw-bold text-success">
                                                                                {sound.formatted_price || (sound.is_free ? 'Gratuit' : formatCurrency(sound.price || 0))}
                                                                            </div>
                                                                            <Button
                                                                                variant="outline-primary"
                                                                                size="sm"
                                                                                as={Link}
                                                                                to={`/sound/${sound.id}`}
                                                                            >
                                                                                <FontAwesomeIcon icon={faEye} className="me-1" />
                                                                                Voir
                                                                            </Button>
                                                                        </div>
                                                                    </Card.Body>
                                                                </Card>
                                                            </Col>
                                                        ))}
                                                    </Row>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </Tab.Pane>

                                <Tab.Pane eventKey="events">
                                    {upcomingEvents.length === 0 ? (
                                        <div className="text-center py-5">
                                            <FontAwesomeIcon icon={faCalendar} size="3x" className="text-muted mb-3" />
                                            <h5 className="text-muted">Aucun événement à venir</h5>
                                            <p className="text-muted">Cet artiste n'a pas d'événements prévus</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="d-flex align-items-center justify-content-between mb-4">
                                                <h4 className="fw-bold mb-0">
                                                    <FontAwesomeIcon icon={faCalendar} className="text-primary me-2" />
                                                    Événements à venir
                                                </h4>
                                                <Badge bg="primary" className="rounded-pill">
                                                    {upcomingEvents.length} événement{upcomingEvents.length > 1 ? 's' : ''}
                                                </Badge>
                                            </div>
                                            <Row className="g-4">
                                                {upcomingEvents.map((event) => (
                                                    <Col lg={6} key={event.id}>
                                                        <Card className="event-card border-0 shadow-sm h-100" style={{ borderRadius: '15px' }}>
                                                            <Row className="g-0 h-100">
                                                                <Col md={4}>
                                                                    <img
                                                                        src={event.poster_image || `https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=300&h=200&fit=crop`}
                                                                        alt={event.title}
                                                                        className="img-fluid h-100"
                                                                        style={{ objectFit: 'cover', borderRadius: '15px 0 0 15px' }}
                                                                    />
                                                                </Col>
                                                                <Col md={8}>
                                                                    <Card.Body className="h-100 d-flex flex-column p-4">
                                                                        <div>
                                                                            <h5 className="fw-bold mb-2">{event.title}</h5>
                                                                            <p className="text-muted mb-2">
                                                                                <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" />
                                                                                {event.venue}, {event.city}
                                                                            </p>
                                                                            <p className="text-muted mb-2">
                                                                                <FontAwesomeIcon icon={faClock} className="me-2" />
                                                                                {new Date(event.event_date).toLocaleDateString('fr-FR')} à {event.start_time}
                                                                            </p>
                                                                            <div className="d-flex align-items-center gap-3 mb-3">
                                                                                <small className="text-primary">
                                                                                    <FontAwesomeIcon icon={faUsers} className="me-1" />
                                                                                    {event.current_attendees || 0}/{event.max_attendees || 'Illimité'}
                                                                                </small>
                                                                                <div className="fw-bold text-success">
                                                                                    {event.is_free ? 'Gratuit' : formatCurrency(event.ticket_price || 0)}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="mt-auto">
                                                                            <Button
                                                                                as={Link}
                                                                                to={`/event/${event.id}`}
                                                                                variant="primary"
                                                                                className="w-100"
                                                                                style={{ borderRadius: '10px' }}
                                                                            >
                                                                                <FontAwesomeIcon icon={faEye} className="me-2" />
                                                                                Voir l'événement
                                                                            </Button>
                                                                        </div>
                                                                    </Card.Body>
                                                                </Col>
                                                            </Row>
                                                        </Card>
                                                    </Col>
                                                ))}
                                            </Row>
                                        </div>
                                    )}
                                </Tab.Pane>
                            </Tab.Content>
                        </div>
                    </Tab.Container>
                </Container>
            </section>

            <style jsx>{`
                .social-artist-detail {
                    min-height: 100vh;
                    background: #f8f9fa;
                    padding-top: 80px;
                }

                .artist-cover-section {
                    position: relative;
                    margin-bottom: -80px;
                }

                .artist-cover-container {
                    position: relative;
                    height: 450px;
                    overflow: hidden;
                }

                .artist-cover-bg {
                    width: 100%;
                    height: 100%;
                    background-size: cover;
                    background-position: center;
                    filter: blur(1px);
                }

                .cover-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(45deg, rgba(0,0,0,0.7), rgba(0,0,0,0.3));
                }

                .back-button-container {
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    z-index: 10;
                }

                .back-btn {
                    border-radius: 25px;
                    padding: 10px 20px;
                    font-weight: 600;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    transition: all 0.3s ease;
                }

                .back-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
                }

                .artist-info-container {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding-bottom: 30px;
                }

                .artist-avatar-section {
                    display: flex;
                    align-items: center;
                    gap: 25px;
                }

                .artist-avatar {
                    width: 150px;
                    height: 150px;
                    border-radius: 50%;
                    border: 5px solid white;
                    object-fit: cover;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.3);
                }

                .artist-name {
                    color: white;
                    font-size: 3rem;
                    font-weight: 800;
                    margin-bottom: 15px;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                }

                .artist-badges {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 15px;
                    flex-wrap: wrap;
                }

                .role-badge, .verified-badge, .popularity-badge {
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-weight: 600;
                    font-size: 14px;
                }

                .artist-location, .artist-member-since {
                    color: rgba(255,255,255,0.9);
                    margin-bottom: 8px;
                    font-size: 16px;
                }

                .follow-btn {
                    border-radius: 25px;
                    padding: 12px 30px;
                    font-weight: 600;
                    min-width: 140px;
                    transition: all 0.3s ease;
                }

                .follow-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.2);
                }

                .stats-floating-section {
                    padding: 80px 0 40px 0;
                }

                .stat-card {
                    border: none;
                    border-radius: 20px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.08);
                    transition: all 0.3s ease;
                    background: white;
                    height: 100%;
                }

                .stat-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 15px 35px rgba(0,0,0,0.15);
                }

                .stat-icon {
                    margin-bottom: 15px;
                }

                .stat-number {
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin-bottom: 8px;
                }

                .stat-label {
                    color: #6c757d;
                    font-weight: 500;
                    margin: 0;
                }

                .content-tabs-section {
                    padding: 40px 0;
                }

                .social-nav-pills {
                    justify-content: center;
                    margin-bottom: 40px;
                    background: white;
                    padding: 20px;
                    border-radius: 25px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                }

                .nav-pill {
                    color: #6c757d;
                    background-color: transparent;
                    border: 2px solid transparent;
                    transition: all 0.3s ease;
                    border-radius: 20px;
                    padding: 12px 24px;
                    margin: 0 8px;
                    font-weight: 600;
                }

                .nav-pill:hover {
                    color: #667eea;
                    background-color: rgba(102, 126, 234, 0.1);
                    transform: translateY(-2px);
                }

                .nav-pill.active {
                    color: white;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    border-color: transparent;
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
                    transform: translateY(-2px);
                }

                .tab-content-area {
                    min-height: 500px;
                }

                .content-card {
                    border: none;
                    border-radius: 20px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                    margin-bottom: 30px;
                    background: white;
                }

                .card-header-social {
                    background: transparent;
                    border: none;
                    padding: 25px 25px 0 25px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .header-title {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: #333;
                }

                .section-title {
                    font-weight: 700;
                    margin-bottom: 20px;
                    color: #333;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                }

                .count-badge {
                    border-radius: 15px;
                    padding: 6px 12px;
                    font-weight: 600;
                }

                .bio-text {
                    color: #666;
                    line-height: 1.6;
                    margin-bottom: 25px;
                }

                .artist-details {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 15px;
                }

                .detail-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .detail-label {
                    color: #6c757d;
                    font-weight: 500;
                }

                .detail-value {
                    font-weight: 600;
                    color: #333;
                }

                .top-sound-item {
                    display: flex;
                    align-items: center;
                    padding: 15px 0;
                    border-bottom: 1px solid #f8f9fa;
                    gap: 15px;
                }

                .top-sound-item:last-child {
                    border-bottom: none;
                }

                .rank-badge {
                    width: 35px;
                    height: 35px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                }

                .sound-thumbnail {
                    width: 60px;
                    height: 60px;
                    border-radius: 12px;
                    object-fit: cover;
                }

                .sound-info {
                    flex-grow: 1;
                }

                .sound-title {
                    font-weight: 700;
                    margin-bottom: 4px;
                    color: #333;
                }

                .sound-genre {
                    color: #6c757d;
                }

                .sound-stats {
                    text-align: right;
                }

                .stat-number {
                    font-weight: 700;
                    color: #667eea;
                }

                .contact-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .event-preview-item {
                    padding: 15px 0;
                    border-bottom: 1px solid #f8f9fa;
                }

                .event-preview-item:last-child {
                    border-bottom: none;
                }

                .event-title {
                    font-weight: 700;
                    margin-bottom: 8px;
                    color: #333;
                }

                .event-location, .event-date {
                    color: #6c757d;
                    margin-bottom: 4px;
                    font-size: 14px;
                }

                .media-card {
                    border: none;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                    transition: all 0.3s ease;
                    background: white;
                    height: 100%;
                }

                .media-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 15px 35px rgba(0,0,0,0.15);
                }

                .media-cover {
                    position: relative;
                    height: 200px;
                    overflow: hidden;
                }

                .media-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.3s ease;
                }

                .media-card:hover .media-image {
                    transform: scale(1.1);
                }

                .media-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: all 0.3s ease;
                }

                .media-card:hover .media-overlay {
                    opacity: 1;
                }

                .play-btn {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    transform: scale(0.8);
                    transition: all 0.3s ease;
                }

                .media-overlay:hover .play-btn {
                    transform: scale(1);
                }

                .video-duration {
                    position: absolute;
                    bottom: 12px;
                    right: 12px;
                    background: rgba(0,0,0,0.8);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .competition-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(45deg, rgba(0,0,0,0.7), rgba(0,0,0,0.3));
                    display: flex;
                    justify-content: flex-end;
                    align-items: flex-start;
                    padding: 15px;
                }

                .prize-badge {
                    background: rgba(255,215,0,0.9);
                    color: #333;
                    padding: 8px 12px;
                    border-radius: 20px;
                    font-weight: 600;
                    font-size: 12px;
                }

                .status-indicator {
                    position: absolute;
                    top: 15px;
                    left: 15px;
                    padding: 6px 12px;
                    border-radius: 15px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: white;
                }

                .status-indicator.live {
                    background: #ef4444;
                    animation: pulse 2s ease-in-out infinite;
                }

                .live-dot {
                    display: inline-block;
                    width: 6px;
                    height: 6px;
                    background: white;
                    border-radius: 50%;
                    margin-right: 4px;
                    animation: blink 1.5s ease-in-out infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.8; }
                }

                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }

                .media-title {
                    font-weight: 700;
                    margin-bottom: 8px;
                    color: #333;
                }

                .media-description {
                    color: #666;
                    font-size: 14px;
                    margin-bottom: 15px;
                    line-height: 1.5;
                }

                .media-stats {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    font-size: 14px;
                    color: #6c757d;
                }

                .stat-item {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .media-date {
                    font-size: 12px;
                    color: #999;
                }

                .competition-details {
                    margin-bottom: 15px;
                }

                .detail-row {
                    display: flex;
                    align-items: center;
                    margin-bottom: 8px;
                    color: #666;
                    font-size: 14px;
                }

                .empty-state {
                    text-align: center;
                    padding: 80px 20px;
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                }

                @media (max-width: 768px) {
                    .artist-avatar-section {
                        flex-direction: column;
                        text-align: center;
                        gap: 15px;
                    }

                    .artist-name {
                        font-size: 2rem;
                    }

                    .artist-badges {
                        justify-content: center;
                    }

                    .social-nav-pills {
                        flex-wrap: wrap;
                        gap: 8px;
                        padding: 15px;
                    }

                    .nav-pill {
                        margin: 4px;
                        padding: 8px 16px;
                        font-size: 14px;
                    }
                }
            `}</style>
        </div>
    );
};

export default ArtistDetail;
