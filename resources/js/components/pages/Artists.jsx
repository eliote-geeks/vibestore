import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form, InputGroup, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUser, faMusic, faHeart, faSearch, faUsers, faPlay,
    faMapMarkerAlt, faCheckCircle, faStar, faPlus,
    faUserPlus, faUserCheck, faHeadphones, faEye, faFilter,
    faFire, faArrowUp, faGem, faGlobe
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const Artists = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterCity, setFilterCity] = useState('');
    const [filterGenre, setFilterGenre] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [artists, setArtists] = useState([]);
    const [filters, setFilters] = useState({ cities: [], genres: [], roles: ['artist', 'producer'] });
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [followingArtists, setFollowingArtists] = useState(new Set());
    const [actionLoading, setActionLoading] = useState(new Set());

    const { token, user } = useAuth();
    const toast = useToast();

    useEffect(() => {
        loadArtists();
    }, [currentPage, filterRole, filterCity, filterGenre, searchTerm, activeFilter]);

    const loadArtists = async () => {
        try {
            setLoading(true);
            const url = new URL('/api/artists', window.location.origin);

            // Ajouter les paramètres de recherche et filtres
            if (searchTerm) url.searchParams.append('search', searchTerm);
            if (filterRole && filterRole !== 'all') url.searchParams.append('role', filterRole);
            if (filterCity) url.searchParams.append('city', filterCity);
            if (filterGenre) url.searchParams.append('genre', filterGenre);
            if (currentPage > 1) url.searchParams.append('page', currentPage);
            url.searchParams.append('per_page', '16');

            const response = await fetch(url, {
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();

            if (data.success) {
                // Correction : utiliser directement data.artists au lieu de data.artists.data
                const artistsData = data.artists || [];
                setArtists(artistsData);

                // Correction : créer la pagination à partir des données retournées
                setPagination(data.pagination || {
                    current_page: 1,
                    last_page: 1,
                    total: artistsData.length,
                    has_more: false
                });

                // Correction : initialiser les filtres avec des valeurs par défaut
                setFilters({
                    cities: [], // Sera rempli dynamiquement depuis les artistes
                    genres: [], // Sera rempli dynamiquement depuis les artistes
                    roles: ['artist', 'producer']
                });

                // Extraire les villes et genres uniques des artistes
                const uniqueCities = [...new Set(artistsData.map(artist => artist.city).filter(Boolean))];
                const uniqueGenres = [...new Set(artistsData.map(artist => artist.genre).filter(Boolean))];

                setFilters(prev => ({
                    ...prev,
                    cities: uniqueCities,
                    genres: uniqueGenres
                }));

                if (user && token && artistsData.length > 0) {
                    const followedIds = new Set();
                    artistsData.forEach(artist => {
                        if (artist.is_following) {
                            followedIds.add(artist.id);
                        }
                    });
                    setFollowingArtists(followedIds);
                }
            } else {
                console.error('Erreur API:', data.message);
                toast.error('Erreur', data.message || 'Impossible de charger les artistes');
            }
        } catch (error) {
            console.error('Erreur chargement artistes:', error);
            toast.error('Erreur', 'Impossible de charger les artistes');

            // Initialiser avec des valeurs par défaut en cas d'erreur
            setFilters({
                cities: [],
                genres: [],
                roles: ['artist', 'producer']
            });
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async (artistId) => {
        if (!user || !token) {
            toast.warning('Connexion requise', 'Connectez-vous pour suivre un artiste');
            return;
        }

        try {
            setActionLoading(prev => new Set([...prev, artistId]));

            const response = await fetch(`/api/artists/${artistId}/follow`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                setArtists(prev => prev.map(artist =>
                    artist.id === artistId
                        ? {
                            ...artist,
                            followers_count: data.followers_count,
                            is_following: data.is_following
                        }
                        : artist
                ));

                setFollowingArtists(prev => {
                    const newSet = new Set(prev);
                    if (data.is_following) {
                        newSet.add(artistId);
                    } else {
                        newSet.delete(artistId);
                    }
                    return newSet;
                });

                toast.success('Succès', data.message);
            }
        } catch (error) {
            console.error('Erreur follow:', error);
            toast.error('Erreur', 'Erreur de connexion');
        } finally {
            setActionLoading(prev => {
                const newSet = new Set(prev);
                newSet.delete(artistId);
                return newSet;
            });
        }
    };

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num?.toString() || '0';
    };

    const getRoleDisplayName = (role) => {
        const roles = {
            'artist': 'Artiste',
            'producer': 'Producteur'
        };
        return roles[role] || role;
    };

    const getPopularityLevel = (plays) => {
        if (plays > 100000) return { level: 'Légende', color: '#FFD700', icon: faStar };
        if (plays > 50000) return { level: 'Star', color: '#FF6B6B', icon: faFire };
        if (plays > 10000) return { level: 'Populaire', color: '#4ECDC4', icon: faArrowUp };
        if (plays > 5000) return { level: 'Montant', color: '#45B7D1', icon: faGem };
        return { level: 'Émergent', color: '#96CEB4', icon: faUser };
    };

    const FilterButton = ({ filter, icon, label, count, isActive, onClick }) => (
        <Button
            variant={isActive ? "primary" : "light"}
            size="sm"
            className={`filter-btn ${isActive ? 'active' : ''}`}
            onClick={onClick}
        >
            <FontAwesomeIcon icon={icon} className="me-2" />
            {label}
            {count && <Badge bg="secondary" className="ms-2">{count}</Badge>}
        </Button>
    );

    if (loading && artists.length === 0) {
        return (
            <div className="artists-feed-loading">
                <Container>
                    <Row className="justify-content-center">
                        <Col md={6} className="text-center py-5">
                            <div className="loading-animation">
                                <Spinner animation="border" variant="primary" size="lg" />
                                <h5 className="mt-3 text-muted">Chargement des artistes...</h5>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
        );
    }

    return (
        <div className="artists-social-feed">
            {/* Header moderne */}
            <div className="feed-header">
                <Container>
                    <Row className="align-items-center py-4">
                        <Col lg={8}>
                            <div className="page-title">
                                <h1 className="fw-bold mb-2">
                                    <FontAwesomeIcon icon={faUsers} className="me-3 text-primary" />
                                    Découvrez les artistes
                                </h1>
                                <p className="text-muted mb-0">
                                    Connectez-vous avec les talents camerounais
                                </p>
                            </div>
                        </Col>
                        <Col lg={4} className="text-end">
                            <div className="stats-preview">
                                <Badge bg="light" text="dark" className="me-2">
                                    {pagination?.total || 0} artistes
                                </Badge>
                                <Badge bg="primary">
                                    Page {pagination?.current_page || 1}
                                </Badge>
                            </div>
                        </Col>
                    </Row>

                    {/* Barre de recherche et filtres */}
                    <Row className="mb-4">
                        <Col lg={6}>
                            <div className="search-container">
                                <InputGroup size="lg">
                                    <Form.Control
                                        type="text"
                                        placeholder="Rechercher un artiste..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="search-input"
                                    />
                                    <Button variant="primary" className="search-btn">
                                        <FontAwesomeIcon icon={faSearch} />
                                    </Button>
                                </InputGroup>
                            </div>
                        </Col>
                        <Col lg={6}>
                            <div className="filter-tabs">
                                <FilterButton
                                    filter="all"
                                    icon={faGlobe}
                                    label="Tous"
                                    isActive={activeFilter === 'all'}
                                    onClick={() => setActiveFilter('all')}
                                />
                                <FilterButton
                                    filter="verified"
                                    icon={faCheckCircle}
                                    label="Vérifiés"
                                    isActive={activeFilter === 'verified'}
                                    onClick={() => setActiveFilter('verified')}
                                />
                                <FilterButton
                                    filter="popular"
                                    icon={faFire}
                                    label="Populaires"
                                    isActive={activeFilter === 'popular'}
                                    onClick={() => setActiveFilter('popular')}
                                />
                                <FilterButton
                                    filter="new"
                                    icon={faGem}
                                    label="Nouveaux"
                                    isActive={activeFilter === 'new'}
                                    onClick={() => setActiveFilter('new')}
                                />
                            </div>
                        </Col>
                    </Row>

                    {/* Filtres secondaires */}
                    <Row className="g-2">
                        <Col md={3}>
                            <Form.Select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                                size="sm"
                                className="filter-select"
                            >
                                <option value="all">Tous les rôles</option>
                                <option value="artist">Artistes</option>
                                <option value="producer">Producteurs</option>
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Select
                                value={filterCity}
                                onChange={(e) => setFilterCity(e.target.value)}
                                size="sm"
                                className="filter-select"
                            >
                                <option value="">Toutes les villes</option>
                                {(filters?.cities || []).map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Select
                                value={filterGenre}
                                onChange={(e) => setFilterGenre(e.target.value)}
                                size="sm"
                                className="filter-select"
                            >
                                <option value="">Tous les genres</option>
                                {(filters?.genres || []).map(genre => (
                                    <option key={genre} value={genre}>{genre}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                className="w-100"
                                onClick={() => {
                                    setFilterRole('all');
                                    setFilterCity('');
                                    setFilterGenre('');
                                    setSearchTerm('');
                                    setActiveFilter('all');
                                }}
                            >
                                <FontAwesomeIcon icon={faFilter} className="me-2" />
                                Reset
                            </Button>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Grille des artistes */}
            <Container className="py-4">
                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" className="mb-3" />
                        <h6 className="text-muted">Mise à jour...</h6>
                    </div>
                ) : artists.length === 0 ? (
                    <div className="empty-state">
                        <Row className="justify-content-center">
                            <Col md={6} className="text-center py-5">
                                <FontAwesomeIcon icon={faUsers} size="3x" className="text-muted mb-3" />
                                <h5 className="text-muted">Aucun artiste trouvé</h5>
                                <p className="text-muted">Essayez de modifier vos critères de recherche</p>
                                <Button variant="primary" onClick={() => window.location.reload()}>
                                    Actualiser
                                </Button>
                            </Col>
                        </Row>
                    </div>
                ) : (
                    <>
                        <Row className="g-4">
                            {artists.map((artist, index) => {
                                const popularityData = getPopularityLevel(artist.total_plays || 0);

                                return (
                                    <Col lg={3} md={4} sm={6} key={artist.id}>
                                        <Card className="artist-card" style={{ animationDelay: `${index * 0.1}s` }}>
                                            {/* Header avec cover */}
                                            <div className="artist-cover">
                                                <div className="cover-gradient">
                                                    <div className="position-absolute top-0 end-0 p-3">
                                                        {artist.verified && (
                                                            <Badge bg="success" className="verified-badge">
                                                                <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                                                                Vérifié
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="position-absolute bottom-0 start-0 p-3">
                                                        <Badge
                                                            className="popularity-badge"
                                                            style={{ backgroundColor: popularityData.color }}
                                                        >
                                                            <FontAwesomeIcon icon={popularityData.icon} className="me-1" />
                                                            {popularityData.level}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Avatar centré */}
                                            <div className="artist-avatar-container">
                                                <img
                                                    src={artist.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.name)}&size=100`}
                                                    alt={artist.name}
                                                    className="artist-avatar"
                                                />
                                            </div>

                                            <Card.Body className="text-center pt-0">
                                                {/* Nom et rôle */}
                                                <h5 className="artist-name">{artist.name}</h5>
                                                <div className="artist-badges mb-3">
                                                    <Badge bg="primary" className="role-badge">
                                                        {getRoleDisplayName(artist.role)}
                                                    </Badge>
                                                    {artist.genre && (
                                                        <Badge bg="light" text="dark" className="genre-badge">
                                                            {artist.genre}
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Localisation */}
                                                {artist.city && (
                                                    <p className="artist-location">
                                                        <FontAwesomeIcon icon={faMapMarkerAlt} className="me-1" />
                                                        {artist.city}
                                                    </p>
                                                )}

                                                {/* Bio courte */}
                                                {artist.bio && (
                                                    <p className="artist-bio">
                                                        {artist.bio.length > 80 ?
                                                            artist.bio.substring(0, 80) + '...' :
                                                            artist.bio
                                                        }
                                                    </p>
                                                )}

                                                {/* Statistiques */}
                                                <Row className="artist-stats">
                                                    <Col xs={4}>
                                                        <div className="stat-item">
                                                            <FontAwesomeIcon icon={faMusic} className="stat-icon" />
                                                            <div className="stat-number">{artist.sounds_count || 0}</div>
                                                            <div className="stat-label">Sons</div>
                                                        </div>
                                                    </Col>
                                                    <Col xs={4}>
                                                        <div className="stat-item">
                                                            <FontAwesomeIcon icon={faUsers} className="stat-icon" />
                                                            <div className="stat-number">{formatNumber(artist.followers_count || 0)}</div>
                                                            <div className="stat-label">Followers</div>
                                                        </div>
                                                    </Col>
                                                    <Col xs={4}>
                                                        <div className="stat-item">
                                                            <FontAwesomeIcon icon={faHeadphones} className="stat-icon" />
                                                            <div className="stat-number">{formatNumber(artist.total_plays || 0)}</div>
                                                            <div className="stat-label">Plays</div>
                                                        </div>
                                                    </Col>
                                                </Row>

                                                {/* Top sons preview */}
                                                {artist.sounds && artist.sounds.length > 0 && (
                                                    <div className="top-sounds">
                                                        <h6 className="top-sounds-title">
                                                            <FontAwesomeIcon icon={faMusic} className="me-1" />
                                                            Top sons
                                                        </h6>
                                                        <div className="sounds-preview">
                                                            {artist.sounds.slice(0, 2).map((sound, soundIndex) => (
                                                                <div key={sound.id} className="sound-preview-item">
                                                                    <img
                                                                        src={sound.cover_image_url || '/images/default-cover.jpg'}
                                                                        alt={sound.title}
                                                                        className="sound-mini-cover"
                                                                    />
                                                                    <div className="sound-mini-info">
                                                                        <div className="sound-mini-title">{sound.title}</div>
                                                                        <div className="sound-mini-stats">
                                                                            <FontAwesomeIcon icon={faPlay} />
                                                                            {formatNumber(sound.plays_count || 0)}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                <div className="artist-actions">
                                                    <Row className="g-2">
                                                        <Col xs={8}>
                                                            <Button
                                                                variant={artist.is_following ? "outline-primary" : "primary"}
                                                                size="sm"
                                                                className="w-100 follow-btn"
                                                                onClick={() => handleFollow(artist.id)}
                                                                disabled={actionLoading.has(artist.id) || !user}
                                                            >
                                                                {actionLoading.has(artist.id) ? (
                                                                    <Spinner animation="border" size="sm" />
                                                                ) : artist.is_following ? (
                                                                    <>
                                                                        <FontAwesomeIcon icon={faUserCheck} className="me-1" />
                                                                        Suivi
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <FontAwesomeIcon icon={faUserPlus} className="me-1" />
                                                                        Suivre
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </Col>
                                                        <Col xs={4}>
                                                            <Button
                                                                as={Link}
                                                                to={`/artists/${artist.id}`}
                                                                variant="outline-secondary"
                                                                size="sm"
                                                                className="w-100 view-btn"
                                                            >
                                                                <FontAwesomeIcon icon={faEye} />
                                                            </Button>
                                                        </Col>
                                                    </Row>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                );
                            })}
                        </Row>

                        {/* Pagination moderne */}
                        {pagination && pagination.last_page > 1 && (
                            <div className="pagination-container">
                                <nav className="d-flex justify-content-center mt-5">
                                    <div className="pagination-modern">
                                        <Button
                                            variant="outline-primary"
                                            disabled={pagination.current_page === 1}
                                            onClick={() => setCurrentPage(pagination.current_page - 1)}
                                            className="pagination-btn"
                                        >
                                            Précédent
                                        </Button>

                                        <div className="pagination-info">
                                            <span className="current-page">{pagination.current_page}</span>
                                            <span className="separator">sur</span>
                                            <span className="total-pages">{pagination.last_page}</span>
                                        </div>

                                        <Button
                                            variant="outline-primary"
                                            disabled={pagination.current_page === pagination.last_page}
                                            onClick={() => setCurrentPage(pagination.current_page + 1)}
                                            className="pagination-btn"
                                        >
                                            Suivant
                                        </Button>
                                    </div>
                                </nav>
                            </div>
                        )}
                    </>
                )}
            </Container>

            <style jsx>{`
                .artists-social-feed {
                    min-height: 100vh;
                    background: #f8f9fa;
                    padding-top: 80px;
                }

                .feed-header {
                    background: white;
                    border-bottom: 1px solid #e9ecef;
                    position: sticky;
                    top: 70px;
                    z-index: 10;
                }

                .page-title h1 {
                    color: #333;
                    animation: slideInLeft 0.8s ease-out;
                }

                .page-title p {
                    animation: slideInLeft 0.8s ease-out 0.2s both;
                }

                .stats-preview {
                    animation: slideInRight 0.8s ease-out;
                }

                .search-input {
                    border: none;
                    border-radius: 25px 0 0 25px;
                    padding: 12px 20px;
                    font-size: 16px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }

                .search-btn {
                    border-radius: 0 25px 25px 0;
                    border: none;
                    padding: 12px 20px;
                }

                .filter-tabs {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .filter-btn {
                    border-radius: 20px;
                    padding: 6px 15px;
                    border: none;
                    transition: all 0.3s ease;
                    animation: slideInRight 0.5s ease-out;
                }

                .filter-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }

                .filter-btn.active {
                    transform: scale(1.05);
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
                }

                .filter-select {
                    border-radius: 10px;
                    border: 1px solid #e9ecef;
                    transition: all 0.3s ease;
                }

                .filter-select:focus {
                    border-color: #667eea;
                    box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
                }

                .artist-card {
                    border: none;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 2px 15px rgba(0,0,0,0.08);
                    transition: all 0.4s ease;
                    animation: slideInUp 0.6s ease-out both;
                    background: white;
                }

                .artist-card:hover {
                    transform: translateY(-10px);
                    box-shadow: 0 20px 50px rgba(0,0,0,0.15);
                }

                .artist-cover {
                    height: 120px;
                    position: relative;
                }

                .cover-gradient {
                    height: 100%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    position: relative;
                }

                .verified-badge {
                    animation: pulse 2s infinite;
                }

                .popularity-badge {
                    color: white;
                    border: none;
                    font-weight: 500;
                    animation: slideInLeft 0.5s ease-out 0.3s both;
                }

                .artist-avatar-container {
                    display: flex;
                    justify-content: center;
                    margin-top: -50px;
                    margin-bottom: 15px;
                }

                .artist-avatar {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    border: 4px solid white;
                    object-fit: cover;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }

                .artist-card:hover .artist-avatar {
                    transform: scale(1.05);
                    box-shadow: 0 8px 30px rgba(0,0,0,0.2);
                }

                .artist-name {
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 10px;
                    font-size: 18px;
                }

                .artist-badges {
                    display: flex;
                    justify-content: center;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .role-badge {
                    border-radius: 15px;
                    font-size: 12px;
                    padding: 4px 12px;
                }

                .genre-badge {
                    border-radius: 15px;
                    font-size: 12px;
                    padding: 4px 12px;
                    border: 1px solid #e9ecef !important;
                }

                .artist-location {
                    color: #666;
                    font-size: 14px;
                    margin-bottom: 15px;
                }

                .artist-bio {
                    color: #666;
                    font-size: 13px;
                    line-height: 1.4;
                    margin-bottom: 20px;
                    font-style: italic;
                }

                .artist-stats {
                    margin-bottom: 20px;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 10px;
                }

                .stat-item {
                    text-align: center;
                    transition: all 0.3s ease;
                }

                .stat-item:hover {
                    transform: translateY(-2px);
                }

                .stat-icon {
                    color: #667eea;
                    margin-bottom: 5px;
                }

                .stat-number {
                    font-weight: 600;
                    color: #333;
                    font-size: 16px;
                    line-height: 1;
                }

                .stat-label {
                    font-size: 11px;
                    color: #666;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .top-sounds {
                    margin-bottom: 20px;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 10px;
                }

                .top-sounds-title {
                    font-size: 14px;
                    color: #667eea;
                    margin-bottom: 10px;
                    font-weight: 600;
                }

                .sounds-preview {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .sound-preview-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px;
                    background: white;
                    border-radius: 8px;
                    transition: all 0.3s ease;
                }

                .sound-preview-item:hover {
                    transform: translateX(5px);
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }

                .sound-mini-cover {
                    width: 30px;
                    height: 30px;
                    border-radius: 5px;
                    object-fit: cover;
                }

                .sound-mini-info {
                    flex: 1;
                    min-width: 0;
                }

                .sound-mini-title {
                    font-size: 12px;
                    font-weight: 500;
                    color: #333;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .sound-mini-stats {
                    font-size: 11px;
                    color: #666;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .artist-actions {
                    margin-top: 20px;
                }

                .follow-btn {
                    border-radius: 20px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }

                .follow-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                }

                .view-btn {
                    border-radius: 50%;
                    width: 100%;
                    aspect-ratio: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                }

                .view-btn:hover {
                    transform: scale(1.1);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                }

                .pagination-container {
                    animation: slideInUp 0.6s ease-out;
                }

                .pagination-modern {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    padding: 20px;
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 2px 15px rgba(0,0,0,0.08);
                }

                .pagination-btn {
                    border-radius: 10px;
                    padding: 8px 20px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }

                .pagination-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                }

                .pagination-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 500;
                    color: #333;
                }

                .current-page {
                    background: #667eea;
                    color: white;
                    padding: 5px 10px;
                    border-radius: 8px;
                    font-size: 14px;
                }

                .separator {
                    color: #666;
                    font-size: 14px;
                }

                .total-pages {
                    color: #666;
                    font-size: 14px;
                }

                .empty-state {
                    animation: fadeInUp 0.8s ease-out;
                }

                .loading-animation {
                    animation: pulse 1.5s ease-in-out infinite;
                }

                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes slideInLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(40px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.05);
                    }
                }

                @media (max-width: 1200px) {
                    .filter-tabs {
                        gap: 5px;
                    }

                    .filter-btn {
                        font-size: 12px;
                        padding: 4px 10px;
                    }
                }

                @media (max-width: 768px) {
                    .page-title h1 {
                        font-size: 24px;
                    }

                    .artist-card {
                        margin-bottom: 20px;
                    }

                    .pagination-modern {
                        flex-direction: column;
                        gap: 15px;
                    }

                    .filter-tabs {
                        justify-content: center;
                    }
                }

                @media (max-width: 576px) {
                    .artist-badges {
                        flex-direction: column;
                        align-items: center;
                    }

                    .search-input {
                        font-size: 14px;
                    }
                }
            `}</style>
        </div>
    );
};

export default Artists;
