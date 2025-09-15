import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form, InputGroup, Modal, Tab, Tabs, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlay,
    faVideo,
    faEye,
    faHeart,
    faShare,
    faPlus,
    faSearch,
    faFilter,
    faTrophy,
    faAward,
    faStar,
    faCrown,
    faMusic,
    faUser,
    faCalendarAlt,
    faClock,
    faFire,
    faThumbsUp,
    faComment,
    faDownload,
    faListUl,
    faTh
} from '@fortawesome/free-solid-svg-icons';
import { AnimatedElement } from '../common/PageTransition';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import CategoryBadge from '../common/CategoryBadge';

const ClipsVideos = () => {
    const [loading, setLoading] = useState(true);
    const [clips, setClips] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('recent');
    const [viewMode, setViewMode] = useState('grid'); // grid ou list
    const [activeTab, setActiveTab] = useState('all');
    const [categories, setCategories] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [selectedClip, setSelectedClip] = useState(null);
    const [showVideoModal, setShowVideoModal] = useState(false);

    const toast = useToast();
    const { user, token, isArtist, isProducer, isAdmin } = useAuth();

    useEffect(() => {
        fetchCategories();
        loadClips();
    }, []);

    useEffect(() => {
        loadClips();
    }, [searchQuery, selectedCategory, sortBy, activeTab]);

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/clips/categories');
            const result = await response.json();
            setCategories(result.categories || []);
        } catch (error) {
            console.error('Erreur lors du chargement des catégories:', error);
        }
    };

    const loadClips = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (selectedCategory !== 'all') params.append('category', selectedCategory);
            if (sortBy) params.append('sort_by', sortBy);
            if (activeTab !== 'all') params.append('tab', activeTab);

            const response = await fetch(`/api/clips?${params}`);
            const result = await response.json();

            if (response.ok) {
                setClips(result.clips.data || result.clips || []);
                setPagination(result.clips.pagination || null);
            } else {
                throw new Error(result.message || 'Erreur lors du chargement');
            }
        } catch (error) {
            console.error('Erreur lors du chargement des clips:', error);
            toast?.error('Erreur', 'Impossible de charger les clips');
        } finally {
            setLoading(false);
        }
    };

    const handleLikeClip = async (clipId) => {
        if (!token) {
            toast?.warning('Connexion requise', 'Vous devez être connecté pour aimer un clip');
            return;
        }

        try {
            const response = await fetch(`/api/clips/${clipId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok) {
                // Mettre à jour le clip dans la liste
                setClips(prevClips =>
                    prevClips.map(clip =>
                        clip.id === clipId
                            ? { ...clip, likes: result.likes_count, is_liked: result.is_liked }
                            : clip
                    )
                );

                toast?.success('Succès', result.message);
            } else {
                throw new Error(result.message || 'Erreur lors du like');
            }
        } catch (error) {
            console.error('Erreur lors du like:', error);
            toast?.error('Erreur', error.message || 'Erreur lors du like');
        }
    };

    const handleShareClip = async (clipId) => {
        try {
            const response = await fetch(`/api/clips/${clipId}/share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok) {
                // Copier le lien dans le presse-papiers
                const shareUrl = `${window.location.origin}/clips/${clipId}`;
                await navigator.clipboard.writeText(shareUrl);

                toast?.success('Lien copié', 'Le lien du clip a été copié dans le presse-papiers');
            } else {
                throw new Error(result.message || 'Erreur lors du partage');
            }
        } catch (error) {
            console.error('Erreur lors du partage:', error);
            toast?.error('Erreur', error.message || 'Erreur lors du partage');
        }
    };

    const getRewardBadge = (views) => {
        if (views >= 1000000) {
            return <Badge bg="info" className="reward-badge"><FontAwesomeIcon icon={faCrown} className="me-1" />Diamant</Badge>;
        } else if (views >= 500000) {
            return <Badge bg="light" text="dark" className="reward-badge"><FontAwesomeIcon icon={faTrophy} className="me-1" />Platine</Badge>;
        } else if (views >= 100000) {
            return <Badge bg="warning" className="reward-badge"><FontAwesomeIcon icon={faAward} className="me-1" />Or</Badge>;
        } else if (views >= 50000) {
            return <Badge bg="secondary" className="reward-badge"><FontAwesomeIcon icon={faStar} className="me-1" />Argent</Badge>;
        } else if (views >= 10000) {
            return <Badge bg="dark" className="reward-badge"><FontAwesomeIcon icon={faTrophy} className="me-1" />Bronze</Badge>;
        }
        return null;
    };

    const formatViews = (views) => {
        if (views >= 1000000) {
            return `${(views / 1000000).toFixed(1)}M`;
        } else if (views >= 1000) {
            return `${(views / 1000).toFixed(1)}K`;
        }
        return views.toString();
    };

    const formatDuration = (duration) => {
        return duration || '0:00';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return 'Hier';
        } else if (diffDays < 7) {
            return `Il y a ${diffDays} jours`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
        } else {
            return date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
    };

    const handlePlayVideo = (clip) => {
        setSelectedClip(clip);
        setShowVideoModal(true);
    };

    const ClipCard = ({ clip, index, isListView = false }) => {
        const cardClass = isListView ? 'clip-card-list' : 'clip-card-grid';

        return (
            <AnimatedElement animation="slideInUp" delay={100 + index * 50}>
                <Card className={`border-0 shadow-sm h-100 ${cardClass}`}>
                    <div className="position-relative">
                        <Card.Img
                            variant="top"
                            src={clip.thumbnail_url || `/storage/clips/thumbnails/${clip.thumbnail_path?.split('/').pop()}` || 'https://via.placeholder.com/400x225?text=Clip+Video'}
                            style={{ height: isListView ? '120px' : '200px', objectFit: 'cover' }}
                            className="clip-thumbnail"
                        />
                        <div className="video-overlay">
                            <Button
                                variant="light"
                                className="play-button"
                                onClick={() => handlePlayVideo(clip)}
                            >
                                <FontAwesomeIcon icon={faPlay} />
                            </Button>
                        </div>
                        <div className="video-duration">
                            {formatDuration(clip.duration)}
                        </div>
                        {getRewardBadge(clip.views) && (
                            <div className="reward-position">
                                {getRewardBadge(clip.views)}
                            </div>
                        )}
                    </div>

                    <Card.Body className={isListView ? 'p-3' : 'p-3'}>
                        <div className="d-flex align-items-start mb-2">
                            <img
                                src={clip.user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(clip.user.name)}&background=667eea&color=fff`}
                                alt={clip.user.name}
                                className="rounded-circle me-2"
                                style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                            />
                            <div className="flex-grow-1">
                                <h6 className="clip-title mb-1">
                                    <Link to={`/clips/${clip.id}`} className="text-decoration-none text-dark">
                                        {clip.title}
                                    </Link>
                                </h6>
                                <small className="text-muted">
                                    <Link to={`/artists/${clip.user.id}`} className="text-decoration-none text-muted">
                                        {clip.user.name}
                                    </Link>
                                </small>
                            </div>
                        </div>

                        <div className="mb-2">
                            <CategoryBadge category={clip.category} size="small" />
                        </div>

                        <p className="clip-description text-muted small mb-2">
                            {clip.description && clip.description.length > 100
                                ? `${clip.description.substring(0, 100)}...`
                                : clip.description || 'Aucune description disponible'
                            }
                        </p>

                        <div className="clip-stats d-flex align-items-center justify-content-between text-muted small">
                            <div className="d-flex align-items-center gap-3">
                                <span>
                                    <FontAwesomeIcon icon={faEye} className="me-1" />
                                    {clip.formatted_views || formatViews(clip.views)}
                                </span>
                                <span>
                                    <FontAwesomeIcon icon={faHeart} className="me-1" />
                                    {formatViews(clip.likes)}
                                </span>
                                <span>
                                    <FontAwesomeIcon icon={faComment} className="me-1" />
                                    {formatViews(clip.comments_count || 0)}
                                </span>
                            </div>
                            <span>{formatDate(clip.created_at)}</span>
                        </div>

                        <div className="clip-actions mt-3 d-flex gap-2">
                            <Button
                                variant={clip.is_liked ? "danger" : "outline-danger"}
                                size="sm"
                                onClick={() => handleLikeClip(clip.id)}
                                className="action-button-enhanced"
                            >
                                <FontAwesomeIcon icon={faHeart} className="me-1" size="sm" />
                                <span className="action-text">{clip.is_liked ? 'Aimé' : 'Aimer'}</span>
                            </Button>
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleShareClip(clip.id)}
                                className="action-button-enhanced"
                            >
                                <FontAwesomeIcon icon={faShare} className="me-1" size="sm" />
                                <span className="action-text">Partager</span>
                            </Button>
                            <Button
                                variant="outline-success"
                                size="sm"
                                as={Link}
                                to={`/clips/${clip.id}`}
                                className="action-button-enhanced"
                            >
                                <FontAwesomeIcon icon={faEye} className="me-1" size="sm" />
                                <span className="action-text">Voir</span>
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            </AnimatedElement>
        );
    };

    return (
        <div className="social-clips">
            {/* Header Social */}
            <div className="clips-header">
                <Container>
                    <Row className="align-items-center py-4">
                        <Col lg={8}>
                            <AnimatedElement animation="slideInLeft" delay={100}>
                                <div className="header-content">
                                    <h1 className="display-6 fw-bold mb-2">
                                        <FontAwesomeIcon icon={faVideo} className="me-3 text-primary" />
                                        Clips Vidéos
                                    </h1>
                                    <p className="text-muted mb-0">
                                        Découvrez les meilleurs clips de la scène musicale camerounaise
                                    </p>
                                </div>
                            </AnimatedElement>
                        </Col>
                        <Col lg={4} className="text-end">
                            <AnimatedElement animation="slideInRight" delay={200}>
                                {(isArtist() || isProducer() || isAdmin()) && (
                                    <Button
                                        as={Link}
                                        to="/add-clip"
                                        variant="primary"
                                        size="lg"
                                        className="create-btn"
                                    >
                                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                                        Ajouter un clip
                                    </Button>
                                )}
                            </AnimatedElement>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Filtres sociaux */}
            <div className="clips-filters">
                <Container>
                    <Row className="g-3">
                        <Col lg={4}>
                            <InputGroup className="search-social">
                                <InputGroup.Text>
                                    <FontAwesomeIcon icon={faSearch} />
                                </InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Rechercher un clip..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="search-input"
                                />
                            </InputGroup>
                        </Col>
                        <Col lg={2}>
                            <Form.Select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="filter-select"
                            >
                                <option value="all">Tous genres</option>
                                {categories.map(cat => (
                                    <option key={cat.name || cat} value={cat.name || cat}>
                                        {cat.name || cat}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col lg={2}>
                            <Form.Select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="filter-select"
                            >
                                <option value="recent">Plus récents</option>
                                <option value="views">Plus vus</option>
                                <option value="likes">Plus aimés</option>
                                <option value="title">Titre A-Z</option>
                            </Form.Select>
                        </Col>
                        <Col lg={4}>
                            <div className="view-controls">
                                <div className="filter-tabs">
                                    <Button
                                        variant={activeTab === 'all' ? 'primary' : 'outline-primary'}
                                        size="sm"
                                        onClick={() => setActiveTab('all')}
                                        className="filter-btn"
                                    >
                                        <FontAwesomeIcon icon={faVideo} className="me-2" />
                                        Tous
                                    </Button>
                                    <Button
                                        variant={activeTab === 'trending' ? 'primary' : 'outline-primary'}
                                        size="sm"
                                        onClick={() => setActiveTab('trending')}
                                        className="filter-btn"
                                    >
                                        <FontAwesomeIcon icon={faFire} className="me-2" />
                                        Tendances
                                    </Button>
                                    <Button
                                        variant={activeTab === 'featured' ? 'primary' : 'outline-primary'}
                                        size="sm"
                                        onClick={() => setActiveTab('featured')}
                                        className="filter-btn"
                                    >
                                        <FontAwesomeIcon icon={faStar} className="me-2" />
                                        Vedettes
                                    </Button>
                                </div>
                                <div className="ms-3">
                                    <Button
                                        variant={viewMode === 'grid' ? 'primary' : 'outline-secondary'}
                                        size="sm"
                                        onClick={() => setViewMode('grid')}
                                        className="view-btn"
                                    >
                                        <FontAwesomeIcon icon={faTh} />
                                    </Button>
                                    <Button
                                        variant={viewMode === 'list' ? 'primary' : 'outline-secondary'}
                                        size="sm"
                                        onClick={() => setViewMode('list')}
                                        className="view-btn ms-1"
                                    >
                                        <FontAwesomeIcon icon={faListUl} />
                                    </Button>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Contenu principal */}
            <Container>
                <div className="clips-content">
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
                            <h5 className="mt-3 text-muted">Chargement des clips...</h5>
                        </div>
                    ) : clips.length === 0 ? (
                        <Alert variant="info" className="text-center py-5 empty-state">
                            <FontAwesomeIcon icon={faVideo} size="3x" className="text-muted mb-3" />
                            <h5>Aucun clip trouvé</h5>
                            <p className="text-muted mb-0">
                                Modifiez vos critères de recherche ou ajoutez le premier clip
                            </p>
                        </Alert>
                    ) : (
                        <Row className={viewMode === 'grid' ? 'g-4' : 'g-3'}>
                            {clips.map((clip, index) => (
                                <Col
                                    key={clip.id}
                                    lg={viewMode === 'grid' ? 4 : 12}
                                    md={viewMode === 'grid' ? 6 : 12}
                                >
                                    <ClipCard clip={clip} index={index} isListView={viewMode === 'list'} />
                                </Col>
                            ))}
                        </Row>
                    )}
                </div>
            </Container>

            {/* Modal de lecture vidéo */}
            <Modal show={showVideoModal} onHide={() => setShowVideoModal(false)} size="lg" centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title>
                        <FontAwesomeIcon icon={faPlay} className="me-2 text-primary" />
                        {selectedClip?.title}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0">
                    {selectedClip && (
                        <div className="ratio ratio-16x9">
                            <video
                                src={selectedClip.video_url || `/storage/clips/videos/${selectedClip.video_path?.split('/').pop()}`}
                                controls
                                autoPlay
                                className="w-100"
                                poster={selectedClip.thumbnail_url || `/storage/clips/thumbnails/${selectedClip.thumbnail_path?.split('/').pop()}`}
                            >
                                Votre navigateur ne supporte pas la lecture vidéo.
                            </video>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <div className="d-flex justify-content-between align-items-center w-100">
                        <div className="d-flex align-items-center gap-3">
                            <Button
                                variant={selectedClip?.is_liked ? "danger" : "outline-danger"}
                                size="sm"
                                onClick={() => selectedClip && handleLikeClip(selectedClip.id)}
                                className="social-action-btn"
                            >
                                <FontAwesomeIcon icon={faHeart} className="me-1" />
                                {selectedClip?.is_liked ? 'Aimé' : 'Aimer'}
                            </Button>
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => selectedClip && handleShareClip(selectedClip.id)}
                                className="social-action-btn"
                            >
                                <FontAwesomeIcon icon={faShare} className="me-1" />
                                Partager
                            </Button>
                        </div>
                        <Button variant="outline-secondary" onClick={() => setShowVideoModal(false)}>
                            Fermer
                        </Button>
                    </div>
                </Modal.Footer>
            </Modal>

            <style jsx>{`
                .social-clips {
                    min-height: 100vh;
                    background: #f8f9fa;
                    padding-top: 80px;
                }

                .clips-header {
                    background: white;
                    border-bottom: 1px solid #e9ecef;
                    margin-bottom: 20px;
                }

                .header-content h1 {
                    color: #333;
                    font-weight: 700;
                }

                .create-btn {
                    border-radius: 25px;
                    padding: 12px 24px;
                    font-weight: 600;
                    border: none;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    transition: all 0.3s ease;
                }

                .create-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
                }

                .clips-filters {
                    background: white;
                    padding: 20px 0;
                    border-bottom: 1px solid #e9ecef;
                    margin-bottom: 30px;
                }

                .search-social .search-input {
                    border: none;
                    padding: 12px 16px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.08);
                }

                .filter-select {
                    border: none;
                    padding: 12px 16px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.08);
                    border-radius: 8px;
                }

                .view-controls {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                }

                .filter-tabs {
                    display: flex;
                    gap: 8px;
                }

                .filter-btn {
                    border-radius: 20px;
                    padding: 8px 16px;
                    border: 2px solid;
                    transition: all 0.3s ease;
                    font-weight: 600;
                    font-size: 13px;
                }

                .filter-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }

                .view-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                }

                .clips-content {
                    padding: 20px 0;
                }

                .empty-state {
                    border: none;
                    border-radius: 20px;
                    background: white;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                }

                .clip-card-grid, .clip-card-list {
                    border: none;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                    transition: all 0.4s ease;
                    cursor: pointer;
                    background: white;
                }

                .clip-card-grid:hover, .clip-card-list:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.15);
                }

                .clip-thumbnail {
                    transition: all 0.3s ease;
                    border-radius: 15px 15px 0 0;
                }

                .video-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: all 0.3s ease;
                    border-radius: 15px 15px 0 0;
                }

                .clip-card-grid:hover .video-overlay,
                .clip-card-list:hover .video-overlay {
                    opacity: 1;
                }

                .play-button {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    transform: scale(0.8);
                    transition: all 0.3s ease;
                    background: rgba(255,255,255,0.95);
                    border: none;
                    color: #667eea;
                }

                .video-overlay:hover .play-button {
                    transform: scale(1);
                    background: white;
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

                .reward-position {
                    position: absolute;
                    top: 12px;
                    left: 12px;
                }

                .reward-badge {
                    font-size: 0.7rem;
                    font-weight: 600;
                    padding: 4px 8px;
                    border-radius: 12px;
                }

                .clip-title {
                    font-weight: 700;
                    line-height: 1.3;
                    margin-bottom: 8px;
                    color: #333;
                }

                .clip-title:hover {
                    color: #667eea !important;
                }

                .clip-description {
                    line-height: 1.5;
                    color: #666;
                    margin-bottom: 15px;
                }

                .clip-stats {
                    font-size: 0.85rem;
                    margin-bottom: 15px;
                }

                .clip-actions .btn {
                    font-size: 0.85rem;
                    padding: 8px 12px;
                    border-radius: 8px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                }

                .action-button-enhanced {
                    border-width: 2px !important;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    min-width: 80px;
                }

                .action-button-enhanced:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 15px rgba(0,0,0,0.15);
                }

                .social-action-btn {
                    border-radius: 20px;
                    padding: 8px 16px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                }

                .social-action-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }

                /* Mode liste */
                .clip-card-list .card-body {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 1rem;
                    padding: 20px;
                }

                .clip-card-list .clip-thumbnail {
                    width: 160px;
                    height: 90px;
                    object-fit: cover;
                    border-radius: 12px;
                    flex-shrink: 0;
                }

                @media (max-width: 768px) {
                    .view-controls {
                        justify-content: center;
                        margin-top: 15px;
                    }

                    .filter-tabs {
                        flex-wrap: wrap;
                        gap: 6px;
                    }

                    .filter-btn {
                        font-size: 11px;
                        padding: 6px 12px;
                    }

                    .clip-card-list .card-body {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .clip-card-list .clip-thumbnail {
                        width: 100%;
                        height: 200px;
                    }
                }
            `}</style>
        </div>
    );
};

export default ClipsVideos;
