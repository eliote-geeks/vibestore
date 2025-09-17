import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Tab, Nav, Spinner, Alert } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUser, faMusic, faHeart, faPlay, faDownload, faShare,
    faMapMarkerAlt, faCalendar, faCheckCircle, faUsers,
    faHeadphones, faPlus, faUserPlus, faUserCheck, faSpinner,
    faTicketAlt, faClock, faEuroSign, faArrowLeft, faEye, faStar,
    faVideo, faTrophy, faCoins
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const ArtistProfile = () => {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('sounds');
    const [isFollowing, setIsFollowing] = useState(false);
    const [artist, setArtist] = useState(null);
    const [stats, setStats] = useState({});
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [popularSounds, setPopularSounds] = useState([]);
    const [recentSounds, setRecentSounds] = useState([]);
    const [artistClips, setArtistClips] = useState([]);
    const [artistCompetitions, setArtistCompetitions] = useState([]);
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
            const response = await fetch(`/api/artists/${id}`, {
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                setArtist(data.artist);
                setStats(data.stats);
                setIsFollowing(data.is_following);
                setUpcomingEvents(data.upcoming_events);
                setPopularSounds(data.popular_sounds);
                setRecentSounds(data.recent_sounds);

                // Charger les clips et compétitions
                loadArtistClips();
                loadArtistCompetitions();
            } else {
                toast.error('Erreur', 'Artiste non trouvé');
            }
        } catch (error) {
            console.error('Erreur lors du chargement de l\'artiste:', error);
            toast.error('Erreur', 'Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    const loadArtistClips = async () => {
        try {
            const response = await fetch(`/api/artists/${id}/clips`, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setArtistClips(data.clips || []);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des clips:', error);
        }
    };

    const loadArtistCompetitions = async () => {
        try {
            const response = await fetch(`/api/artists/${id}/competitions`, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setArtistCompetitions(data.competitions || []);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des compétitions:', error);
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

    const handleShare = async () => {
        const profileUrl = window.location.href;
        const shareData = {
            title: `Profil de ${artist.name}`,
            text: `Découvrez le profil de ${artist.name} - ${artist.role === 'artist' ? 'Artiste' : 'Producteur'} ${artist.genre ? `spécialisé en ${artist.genre}` : ''}`,
            url: profileUrl
        };

        try {
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
                toast.success('Succès', 'Profil partagé avec succès');
            } else {
                // Fallback pour les navigateurs qui ne supportent pas l'API Web Share
                await navigator.clipboard.writeText(profileUrl);
                toast.success('Succès', 'Lien du profil copié dans le presse-papiers');
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                // Fallback en cas d'erreur
                try {
                    await navigator.clipboard.writeText(profileUrl);
                    toast.success('Succès', 'Lien du profil copié dans le presse-papiers');
                } catch (clipboardError) {
                    console.error('Erreur lors du partage:', error);
                    toast.error('Erreur', 'Impossible de partager le profil');
                }
            }
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-CM', {
            style: 'currency',
            currency: 'XAF',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatNumber = (num) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num?.toString() || '0';
    };

    const getRoleDisplayName = (role) => {
        const roles = {
            'artist': 'Artiste',
            'producer': 'Producteur'
        };
        return roles[role] || role;
    };

    if (loading) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
                <div className="text-center">
                    <Spinner animation="border" variant="primary" size="lg" className="mb-3" />
                    <h5 className="text-muted">Chargement du profil...</h5>
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

    return (
        <div className="bg-light min-vh-100" style={{ paddingTop: '80px' }}>
            {/* Cover & Profile Header */}
            <section className="position-relative">
                <div
                    className="artist-cover"
                    style={{
                        height: '350px',
                        background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    <div
                        className="position-absolute top-0 start-0 w-100 h-100"
                        style={{
                            background: 'linear-gradient(45deg, rgba(0,0,0,0.6), rgba(0,0,0,0.3))'
                        }}
                    ></div>

                    {/* Back button */}
                    <div className="position-absolute top-0 start-0 p-4">
                        <Button
                            as={Link}
                            to="/artists"
                            variant="outline-light"
                            className="rounded-circle"
                            style={{ width: '50px', height: '50px' }}
                        >
                            <FontAwesomeIcon icon={faArrowLeft} />
                        </Button>
                    </div>
                </div>

                <Container className="position-relative" style={{ marginTop: '-100px', zIndex: 10 }}>
                    <Row>
                        <Col lg={10} className="mx-auto">
                            <Card className="border-0 shadow-lg" style={{ borderRadius: '20px' }}>
                                <Card.Body className="p-4">
                                    <Row className="align-items-center">
                                        <Col md={3} className="text-center text-md-start mb-3 mb-md-0">
                                            <div className="position-relative d-inline-block">
                                                <img
                                                    src={artist.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.name)}&color=7F9CF5&background=EBF4FF&size=150`}
                                                    alt={artist.name}
                                                    className="rounded-circle border border-white border-5"
                                                    style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                                                />
                                                {artist.verified && (
                                                    <div
                                                        className="position-absolute bottom-0 end-0 bg-success rounded-circle d-flex align-items-center justify-content-center border border-white border-3"
                                                        style={{ width: '40px', height: '40px' }}
                                                    >
                                                        <FontAwesomeIcon icon={faCheckCircle} className="text-white" style={{ fontSize: '20px' }} />
                                                    </div>
                                                )}
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <h1 className="fw-bold mb-2">{artist.name}</h1>
                                            <div className="d-flex flex-wrap gap-2 mb-3">
                                                <Badge bg="primary" className="rounded-pill px-3 py-2">
                                                    {getRoleDisplayName(artist.role)}
                                                </Badge>
                                                {artist.genre && (
                                                    <Badge bg="light" text="dark" className="rounded-pill px-3 py-2">
                                                        {artist.genre}
                                                    </Badge>
                                                )}
                                                {artist.verified && (
                                                    <Badge bg="success" className="rounded-pill px-3 py-2">
                                                        <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                                                        Vérifié
                                                    </Badge>
                                                )}
                                            </div>
                                            {artist.city && (
                                                <p className="text-muted mb-2">
                                                    <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" />
                                                    {artist.city}
                                                </p>
                                            )}
                                            {artist.bio && (
                                                <p className="text-muted mb-3">{artist.bio}</p>
                                            )}
                                            <p className="text-muted small mb-0">
                                                Membre depuis {new Date(artist.created_at).toLocaleDateString('fr-FR', {
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </Col>
                                        <Col md={3} className="text-center">
                                            <Button
                                                variant={isFollowing ? "outline-primary" : "primary"}
                                                onClick={handleFollow}
                                                className="w-100 mb-3 fw-medium"
                                                style={{ borderRadius: '15px' }}
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
                                            <Button
                                                variant="outline-dark"
                                                size="sm"
                                                className="w-100"
                                                style={{ borderRadius: '15px' }}
                                                onClick={handleShare}
                                            >
                                                <FontAwesomeIcon icon={faShare} className="me-2" />
                                                Partager
                                            </Button>
                                        </Col>
                                    </Row>

                                    {/* Stats */}
                                    <Row className="mt-4 text-center">
                                        <Col xs={6} md={3}>
                                            <div className="stat-item p-3 rounded-3 bg-light">
                                                <div className="fw-bold text-primary h4 mb-1">
                                                    <FontAwesomeIcon icon={faMusic} className="me-2" />
                                                {artist.sounds_count || 0}
                                                </div>
                                                <small className="text-muted fw-medium">Sons</small>
                                            </div>
                                        </Col>
                                        <Col xs={6} md={3}>
                                            <div className="stat-item p-3 rounded-3 bg-light">
                                                <div className="fw-bold text-success h4 mb-1">
                                                    <FontAwesomeIcon icon={faUsers} className="me-2" />
                                                {formatNumber(artist.followers_count || 0)}
                                                </div>
                                                <small className="text-muted fw-medium">Followers</small>
                                            </div>
                                        </Col>
                                        <Col xs={6} md={3} className="mt-3 mt-md-0">
                                            <div className="stat-item p-3 rounded-3 bg-light">
                                                <div className="fw-bold text-warning h4 mb-1">
                                                    <FontAwesomeIcon icon={faHeadphones} className="me-2" />
                                                {formatNumber(stats.total_plays || 0)}
                                                </div>
                                                <small className="text-muted fw-medium">Écoutes</small>
                                            </div>
                                        </Col>
                                        <Col xs={6} md={3} className="mt-3 mt-md-0">
                                            <div className="stat-item p-3 rounded-3 bg-light">
                                                <div className="fw-bold text-info h4 mb-1">
                                                    <FontAwesomeIcon icon={faCalendar} className="me-2" />
                                                {artist.events_count || 0}
                                                </div>
                                                <small className="text-muted fw-medium">Événements</small>
                                            </div>
                                        </Col>
                                    </Row>

                                    {/* Statistiques détaillées */}
                                    <Row className="mt-4">
                                        <Col>
                                            <Card className="border-0 bg-gradient text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                                <Card.Body className="py-3">
                                                    <Row className="text-center">
                                                        <Col xs={6} md={4}>
                                                            <div className="mb-1">
                                                                <FontAwesomeIcon icon={faDownload} className="h5 mb-2" />
                                                                <div className="fw-bold h6 mb-0">{formatNumber(stats.total_downloads || 0)}</div>
                                                                <small className="opacity-75">Téléchargements</small>
                                                            </div>
                                                        </Col>
                                                        <Col xs={6} md={4}>
                                                            <div className="mb-1">
                                                                <FontAwesomeIcon icon={faHeart} className="h5 mb-2" />
                                                                <div className="fw-bold h6 mb-0">{formatNumber(stats.total_likes || 0)}</div>
                                                                <small className="opacity-75">J'aime</small>
                                                            </div>
                                                        </Col>
                                                        <Col xs={12} md={4}>
                                                            <div className="mb-1">
                                                                <FontAwesomeIcon icon={faEuroSign} className="h5 mb-2" />
                                                                <div className="fw-bold h6 mb-0">{formatCurrency(stats.total_revenue || 0)}</div>
                                                                <small className="opacity-75">Revenus</small>
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Content Tabs */}
            <section className="py-5">
                <Container>
                    <Row>
                        <Col lg={10} className="mx-auto">
                            <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
                                <Nav variant="pills" className="justify-content-center mb-4">
                                    <Nav.Item>
                                        <Nav.Link eventKey="sounds" className="rounded-pill px-4 mx-2">
                                            <FontAwesomeIcon icon={faMusic} className="me-2" />
                                            Sons ({artist.sounds_count || 0})
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="clips" className="rounded-pill px-4 mx-2">
                                            <FontAwesomeIcon icon={faVideo} className="me-2" />
                                            Clips ({artistClips.length})
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="competitions" className="rounded-pill px-4 mx-2">
                                            <FontAwesomeIcon icon={faTrophy} className="me-2" />
                                            Compétitions ({artistCompetitions.length})
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="events" className="rounded-pill px-4 mx-2">
                                            <FontAwesomeIcon icon={faCalendar} className="me-2" />
                                            Événements ({upcomingEvents.length})
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="about" className="rounded-pill px-4 mx-2">
                                            <FontAwesomeIcon icon={faUser} className="me-2" />
                                            À propos
                                        </Nav.Link>
                                    </Nav.Item>
                                </Nav>

                                <Tab.Content>
                                    {/* Sons Tab */}
                                    <Tab.Pane eventKey="sounds">
                                        {popularSounds.length === 0 ? (
                                            <div className="text-center py-5">
                                                <FontAwesomeIcon icon={faMusic} size="3x" className="text-muted mb-3" />
                                                <h5 className="text-muted">Aucun son disponible</h5>
                                                <p className="text-muted">Cet artiste n'a pas encore publié de sons</p>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Popular Sounds */}
                                                <div className="mb-5">
                                                    <h4 className="fw-bold mb-3">Sons populaires</h4>
                                                    <Row className="g-4">
                                                        {popularSounds.map((sound) => (
                                                            <Col lg={3} md={4} sm={6} key={sound.id}>
                                                                <Card className="sound-card border-0 shadow-sm h-100 overflow-hidden">
                                                                    <div className="position-relative">
                                                                        <div className="music-icon-cover" style={{ height: '200px' }}>
                                                                            <FontAwesomeIcon
                                                                                icon={faMusic}
                                                                                className="music-icon-large"
                                                                                style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.4)' }}
                                                                            />
                                                                        </div>
                                                                        <div className="position-absolute top-0 end-0 p-2">
                                                                            {sound.is_featured && (
                                                                                <Badge bg="warning" className="rounded-pill">
                                                                                    <FontAwesomeIcon icon={faStar} className="me-1" />
                                                                                    Vedette
                                                                                </Badge>
                                                                            )}
                                                                            {!sound.is_free && (
                                                                                <Badge bg="success" className="rounded-pill ms-1">
                                                                                    Premium
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        <div className="position-absolute top-0 start-0 p-2">
                                                                            <Badge bg="dark" className="rounded-pill opacity-75">
                                                                                {sound.formatted_duration || '0:00'}
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
                                                                                {sound.is_free ? 'Gratuit' : sound.formatted_price || formatCurrency(sound.price || 0)}
                                                                            </div>
                                                                            <Button
                                                                                variant="outline-primary"
                                                                                size="sm"
                                                                                as={Link}
                                                                                to={`/sounds/${sound.id}`}
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

                                                {/* Recent Sounds */}
                                                {recentSounds.length > 0 && (
                                                    <div>
                                                        <h4 className="fw-bold mb-3">Sons récents</h4>
                                                        <Row className="g-4">
                                                            {recentSounds.map((sound) => (
                                                                <Col lg={3} md={4} sm={6} key={sound.id}>
                                                                    <Card className="sound-card border-0 shadow-sm h-100 overflow-hidden">
                                                                        <div className="position-relative">
                                                                            <div className="music-icon-cover" style={{ height: '200px' }}>
                                                                                <FontAwesomeIcon
                                                                                    icon={faMusic}
                                                                                    className="music-icon-large"
                                                                                    style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.4)' }}
                                                                                />
                                                                            </div>
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
                                                                                    {sound.is_free ? 'Gratuit' : sound.formatted_price || formatCurrency(sound.price || 0)}
                                                                                </div>
                                                                                <Button
                                                                                    variant="outline-primary"
                                                                                    size="sm"
                                                                                    as={Link}
                                                                                    to={`/sounds/${sound.id}`}
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

                                    {/* Clips Tab */}
                                    <Tab.Pane eventKey="clips">
                                        {artistClips.length === 0 ? (
                                            <div className="text-center py-5">
                                                <FontAwesomeIcon icon={faVideo} size="3x" className="text-muted mb-3" />
                                                <h5 className="text-muted">Aucun clip disponible</h5>
                                                <p className="text-muted">Cet artiste n'a pas encore publié de clips</p>
                                            </div>
                                        ) : (
                                            <Row className="g-4">
                                                {artistClips.map((clip) => (
                                                    <Col lg={4} md={6} key={clip.id}>
                                                        <Card className="clip-card border-0 shadow-sm h-100">
                                                            <div className="position-relative">
                                                                <img
                                                                    src={clip.thumbnail_url || `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=225&fit=crop`}
                                                                    alt={clip.title}
                                                                    className="card-img-top"
                                                                    style={{ height: '200px', objectFit: 'cover' }}
                                                                />
                                                                <div className="position-absolute top-50 start-50 translate-middle">
                                                                    <Button variant="light" className="rounded-circle" style={{ width: '60px', height: '60px' }}>
                                                                        <FontAwesomeIcon icon={faPlay} className="text-primary" />
                                                                    </Button>
                                                                </div>
                                                                <div className="position-absolute bottom-0 end-0 p-2">
                                                                    <Badge bg="dark" className="rounded-pill opacity-75">
                                                                        {clip.duration || '0:00'}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                            <Card.Body className="p-3">
                                                                <h6 className="fw-bold mb-2">{clip.title}</h6>
                                                                <p className="text-muted small mb-2">
                                                                    {clip.description?.substring(0, 100)}...
                                                                </p>
                                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                                    <div className="d-flex gap-3">
                                                                        <small className="text-primary">
                                                                            <FontAwesomeIcon icon={faEye} className="me-1" />
                                                                            {formatNumber(clip.views || 0)}
                                                                        </small>
                                                                        <small className="text-danger">
                                                                            <FontAwesomeIcon icon={faHeart} className="me-1" />
                                                                            {formatNumber(clip.likes || 0)}
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    as={Link}
                                                                    to={`/clips/${clip.id}`}
                                                                    variant="primary"
                                                                    size="sm"
                                                                    className="w-100"
                                                                >
                                                                    <FontAwesomeIcon icon={faEye} className="me-2" />
                                                                    Voir le clip
                                                                </Button>
                                                            </Card.Body>
                                                        </Card>
                                                    </Col>
                                                ))}
                                            </Row>
                                        )}
                                    </Tab.Pane>

                                    {/* Competitions Tab */}
                                    <Tab.Pane eventKey="competitions">
                                        {artistCompetitions.length === 0 ? (
                                            <div className="text-center py-5">
                                                <FontAwesomeIcon icon={faTrophy} size="3x" className="text-muted mb-3" />
                                                <h5 className="text-muted">Aucune compétition créée</h5>
                                                <p className="text-muted">Cet artiste n'a pas encore créé de compétitions</p>
                                            </div>
                                        ) : (
                                            <Row className="g-4">
                                                {artistCompetitions.map((competition) => (
                                                    <Col lg={6} key={competition.id}>
                                                        <Card className="competition-card border-0 shadow-sm h-100">
                                                            <div className="position-relative">
                                                                <img
                                                                    src={competition.image_url || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop`}
                                                                    alt={competition.title}
                                                                    className="card-img-top"
                                                                    style={{ height: '200px', objectFit: 'cover' }}
                                                                />
                                                                <div className="position-absolute top-0 end-0 p-3">
                                                                    <Badge bg="warning" className="rounded-pill">
                                                                        <FontAwesomeIcon icon={faTrophy} className="me-1" />
                                                                        {competition.formatted_total_prize_pool || 'Prix à gagner'}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                            <Card.Body className="p-3">
                                                                <h6 className="fw-bold mb-2">{competition.title}</h6>
                                                                <p className="text-muted small mb-2">
                                                                    {competition.description?.substring(0, 150)}...
                                                                </p>
                                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                                    <div className="d-flex gap-3">
                                                                        <small className="text-primary">
                                                                            <FontAwesomeIcon icon={faUsers} className="me-1" />
                                                                            {competition.current_participants || 0} participants
                                                                        </small>
                                                                        <small className="text-warning">
                                                                            <FontAwesomeIcon icon={faClock} className="me-1" />
                                                                            {competition.days_left || 'Terminé'}
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    as={Link}
                                                                    to={`/competitions/${competition.id}`}
                                                                    variant="primary"
                                                                    size="sm"
                                                                    className="w-100"
                                                                >
                                                                    <FontAwesomeIcon icon={faEye} className="me-2" />
                                                                    Voir la compétition
                                                                </Button>
                                                            </Card.Body>
                                                        </Card>
                                                    </Col>
                                                ))}
                                            </Row>
                                        )}
                                    </Tab.Pane>

                                    {/* Events Tab */}
                                    <Tab.Pane eventKey="events">
                                        {upcomingEvents.length === 0 ? (
                                            <div className="text-center py-5">
                                                <FontAwesomeIcon icon={faCalendar} size="3x" className="text-muted mb-3" />
                                                <h5 className="text-muted">Aucun événement à venir</h5>
                                                <p className="text-muted">Cet artiste n'a pas d'événements prévus</p>
                                            </div>
                                        ) : (
                                            <Row className="g-4">
                                                {upcomingEvents.map((event) => (
                                                    <Col lg={6} key={event.id}>
                                                        <Card className="event-card border-0 shadow-sm h-100">
                                                            <Row className="g-0 h-100">
                                                                <Col md={4}>
                                                                    <img
                                                                        src={event.poster_image || `https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=300&h=200&fit=crop`}
                                                                        alt={event.title}
                                                                        className="img-fluid h-100"
                                                                        style={{ objectFit: 'cover', borderRadius: '8px 0 0 8px' }}
                                                                    />
                                                                </Col>
                                                                <Col md={8}>
                                                                    <Card.Body className="h-100 d-flex flex-column">
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
                                                                            <div className="d-flex align-items-center gap-3 mb-2">
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
                                                                                to={`/events/${event.id}`}
                                                                                variant="primary"
                                                                                size="sm"
                                                                                className="w-100"
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
                                        )}
                                    </Tab.Pane>

                                    {/* About Tab */}
                                    <Tab.Pane eventKey="about">
                                        <Row className="g-4">
                                            <Col md={8}>
                                                <Card className="border-0 shadow-sm">
                                                    <Card.Body>
                                                        <h5 className="fw-bold mb-3">À propos de {artist.name}</h5>
                                                        <p className="text-muted">
                                                            {artist.bio || 'Aucune biographie disponible.'}
                                                        </p>

                                                        <hr />

                                                        <Row className="g-3">
                                                            <Col sm={6}>
                                                                <div className="d-flex justify-content-between">
                                                                    <span className="text-muted">Localisation :</span>
                                                                    <span className="fw-medium">{artist.city || 'Non renseignée'}</span>
                                                                </div>
                                                            </Col>
                                                            <Col sm={6}>
                                                                <div className="d-flex justify-content-between">
                                                                    <span className="text-muted">Genre principal :</span>
                                                                    <span className="fw-medium">{artist.genre || 'Non défini'}</span>
                                                                </div>
                                                            </Col>
                                                            <Col sm={6}>
                                                                <div className="d-flex justify-content-between">
                                                                    <span className="text-muted">Sons publiés :</span>
                                                                    <span className="fw-medium">{artist.sounds_count || 0}</span>
                                                                </div>
                                                            </Col>
                                                            <Col sm={6}>
                                                                <div className="d-flex justify-content-between">
                                                                    <span className="text-muted">Événements :</span>
                                                                    <span className="fw-medium">{artist.events_count || 0}</span>
                                                                </div>
                                                            </Col>
                                                            <Col sm={12}>
                                                                <div className="d-flex justify-content-between">
                                                                    <span className="text-muted">Statut :</span>
                                                                    <span className="fw-medium">
                                                                        {artist.verified ? (
                                                                            <Badge bg="success" className="rounded-pill">
                                                                                <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                                                                                Vérifié
                                                                            </Badge>
                                                                        ) : (
                                                                            <Badge bg="secondary" className="rounded-pill">
                                                                                Non vérifié
                                                                            </Badge>
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </Col>
                                                            {artist.website && (
                                                                <Col sm={12}>
                                                                    <div className="d-flex justify-content-between">
                                                                        <span className="text-muted">Site web :</span>
                                                                        <a href={artist.website} target="_blank" rel="noopener noreferrer" className="fw-medium text-primary">
                                                                            {artist.website}
                                                                        </a>
                                                                    </div>
                                                                </Col>
                                                            )}
                                                        </Row>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col md={4}>
                                                <Card className="border-0 shadow-sm mb-4">
                                                    <Card.Body>
                                                        <h6 className="fw-bold mb-3">Statistiques</h6>
                                                        <div className="mb-3">
                                                            <div className="d-flex justify-content-between mb-1">
                                                                <span className="text-muted small">Écoutes totales</span>
                                                                <span className="fw-bold text-primary">{formatNumber(stats.total_plays || 0)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="mb-3">
                                                            <div className="d-flex justify-content-between mb-1">
                                                                <span className="text-muted small">Téléchargements</span>
                                                                <span className="fw-bold text-success">{formatNumber(stats.total_downloads || 0)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="mb-3">
                                                            <div className="d-flex justify-content-between mb-1">
                                                                <span className="text-muted small">Likes reçus</span>
                                                                <span className="fw-bold text-danger">{formatNumber(stats.total_likes || 0)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="mb-3">
                                                            <div className="d-flex justify-content-between mb-1">
                                                                <span className="text-muted small">Événements actifs</span>
                                                                <span className="fw-bold text-info">{stats.active_events || 0}</span>
                                                            </div>
                                                        </div>
                                                    </Card.Body>
                                                </Card>

                                                <Card className="border-0 shadow-sm">
                                                    <Card.Body>
                                                        <h6 className="fw-bold mb-3">Contact</h6>
                                                        <div className="d-grid gap-2">
                                                            {artist.email && (
                                                                <Button variant="outline-primary" size="sm">
                                                                    Envoyer un message
                                                                </Button>
                                                            )}
                                                            <Button variant="outline-secondary" size="sm">
                                                                Signaler le profil
                                                            </Button>
                                                        </div>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        </Row>
                                    </Tab.Pane>
                                </Tab.Content>
                            </Tab.Container>
                        </Col>
                    </Row>
                </Container>
            </section>

            <style jsx>{`
                .music-icon-cover {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                }

                .music-icon-large {
                    transition: all 0.3s ease;
                }

                .sound-card:hover .music-icon-large {
                    transform: scale(1.1);
                }

                .sound-card {
                    transition: all 0.3s ease;
                    border-radius: 15px !important;
                }

                .sound-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2) !important;
                }

                .sound-card .play-btn {
                    opacity: 0;
                    transition: all 0.3s ease;
                    backdrop-filter: blur(10px);
                }

                .sound-card:hover .play-btn {
                    opacity: 1 !important;
                    transform: translate(-50%, -50%) scale(1.1);
                }

                .clip-card, .competition-card {
                    transition: all 0.3s ease;
                    border-radius: 15px !important;
                }

                .clip-card:hover, .competition-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.15) !important;
                }

                .event-card {
                    transition: all 0.3s ease;
                    border-radius: 15px !important;
                }

                .event-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.15) !important;
                }

                .stat-item {
                    transition: all 0.3s ease;
                    border: 1px solid rgba(102, 126, 234, 0.1);
                }

                .stat-item:hover {
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1)) !important;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
                }

                .nav-pills .nav-link {
                    color: #6c757d;
                    background-color: transparent;
                    border: 1px solid #dee2e6;
                    transition: all 0.3s ease;
                }

                .nav-pills .nav-link:hover {
                    color: #667eea;
                    background-color: rgba(102, 126, 234, 0.1);
                    transform: translateY(-2px);
                }

                .nav-pills .nav-link.active {
                    color: white;
                    background-color: #667eea;
                    border-color: #667eea;
                    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
                }

                .bg-gradient {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                }
            `}</style>
        </div>
    );
};

export default ArtistProfile;
