import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Badge, Spinner, ProgressBar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch, faFilter, faMusic, faHeart, faShoppingCart, faPlay, faDownload, faEye,
    faUser, faArrowUp, faGem, faFire, faGlobe, faTag, faClock
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCart } from '../../context/CartContext';
import SoundDetailsModal from '../common/SoundDetailsModal';
import { usePurchasedSounds } from '../../hooks/usePurchasedSounds';

const Catalog = () => {
    const { token } = useAuth();
    const toast = useToast();
    const { addToCart } = useCart();
    const { purchasedSounds, checkIfPurchased } = usePurchasedSounds();

    const [sounds, setSounds] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedPrice, setSelectedPrice] = useState('all');
    const [activeFilter, setActiveFilter] = useState('trending');
    const [loading, setLoading] = useState(true);
    const [likedSounds, setLikedSounds] = useState(new Set());
    const [downloadingTracks, setDownloadingTracks] = useState(new Map());
    const [showModal, setShowModal] = useState(false);
    const [selectedSound, setSelectedSound] = useState(null);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 16,
        total: 0,
        has_more: false
    });

    const priceRanges = [
        { value: 'all', label: 'Tous les prix' },
        { value: 'free', label: 'Gratuit' },
        { value: '0-2000', label: '0 - 2 000 FCFA' },
        { value: '2000-3000', label: '2 000 - 3 000 FCFA' },
        { value: '3000+', label: '3 000+ FCFA' }
    ];

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        loadSounds();
    }, [selectedCategory, selectedPrice, activeFilter, searchTerm]);

    useEffect(() => {
        if (token && sounds.length > 0) {
            loadLikesStatus();
        }
    }, [token, sounds]);

    const loadCategories = async () => {
        try {
            const response = await fetch('/api/categories');
            const data = await response.json();

            if (data.success) {
                const categoriesWithAll = [
                    { value: 'all', label: 'Toutes les catégories', name: 'Toutes les catégories' },
                    ...data.categories.map(cat => ({
                        value: cat.name,
                        label: cat.name,
                        name: cat.name,
                        id: cat.id
                    }))
                ];
                setCategories(categoriesWithAll);
            }
        } catch (error) {
            console.error('Erreur chargement catégories:', error);
        }
    };

    const loadSounds = async (page = 1) => {
        try {
            setLoading(true);

            const params = new URLSearchParams({
                page: page.toString(),
                per_page: pagination.per_page.toString(),
                sort: activeFilter
            });

            if (selectedCategory !== 'all') {
                params.append('category', selectedCategory);
            }
            if (selectedPrice !== 'all') {
                params.append('price', selectedPrice);
            }
            if (searchTerm.trim()) {
                params.append('search', searchTerm.trim());
            }

            const response = await fetch(`/api/sounds?${params}`);
            const data = await response.json();

            if (data.success) {
                setSounds(data.sounds);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error('Erreur chargement sons:', error);
            toast.error('Erreur', 'Erreur lors du chargement des sons');
        } finally {
            setLoading(false);
        }
    };

    const loadLikesStatus = async () => {
        if (!token) return;

        try {
            const soundIds = sounds.map(sound => sound.id);

            const response = await fetch('/api/sounds/likes/status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ sound_ids: soundIds })
            });

            const data = await response.json();

            if (data.success) {
                setLikedSounds(new Set(data.likes));
            }
        } catch (error) {
            console.error('Erreur chargement likes:', error);
        }
    };

    const handleLike = async (soundId) => {
        if (!token) {
            toast.warning('Connexion requise', 'Connectez-vous pour liker ce son');
            return;
        }

        try {
            const response = await fetch(`/api/sounds/${soundId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                const newLikedSounds = new Set(likedSounds);
                if (data.is_liked) {
                    newLikedSounds.add(soundId);
                } else {
                    newLikedSounds.delete(soundId);
                }
                setLikedSounds(newLikedSounds);

                setSounds(prevSounds =>
                    prevSounds.map(sound =>
                        sound.id === soundId
                            ? { ...sound, likes: data.likes_count }
                            : sound
                    )
                );

                toast.success('Succès', data.is_liked ? 'Son ajouté aux favoris' : 'Son retiré des favoris');
            }
        } catch (error) {
            console.error('Erreur like:', error);
            toast.error('Erreur', 'Erreur lors du like');
        }
    };

    const handleAddToCart = (sound) => {
        if (sound.is_free || sound.price === 0) {
            handleDownload(sound);
            return;
        }

        const success = addToCart({
            id: sound.id,
            type: 'sound',
            title: sound.title,
            artist: sound.artist || sound.user?.name,
            price: sound.price,
            cover: sound.cover,
            duration: sound.duration,
            category: sound.category
        });

        if (success) {
            toast.success('Ajouté au panier', `"${sound.title}" a été ajouté à votre panier`);
        }
    };

    const handleDownload = async (sound) => {
        if (!token) {
            toast.error('Connexion requise', 'Connectez-vous pour télécharger');
            return;
        }

        try {
            setDownloadingTracks(prev => new Map(prev.set(sound.id, { progress: 0, status: 'starting' })));

            const response = await fetch(`/api/sounds/${sound.id}/download`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors du téléchargement');
            }

            const contentLength = response.headers.get('content-length');
            const reader = response.body.getReader();
            const chunks = [];
            let receivedLength = 0;

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                chunks.push(value);
                receivedLength += value.length;

                if (contentLength) {
                    const progress = (receivedLength / contentLength) * 100;
                    setDownloadingTracks(prev => new Map(prev.set(sound.id, {
                        progress: Math.round(progress),
                        status: 'downloading'
                    })));
                }
            }

            const blob = new Blob(chunks);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${sound.title}.mp3`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            setDownloadingTracks(prev => new Map(prev.set(sound.id, {
                progress: 100,
                status: 'completed'
            })));

            toast.success('Téléchargement terminé', `"${sound.title}" a été téléchargé avec succès`);

            setTimeout(() => {
                setDownloadingTracks(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(sound.id);
                    return newMap;
                });
            }, 3000);

        } catch (error) {
            console.error('Erreur téléchargement:', error);
            toast.error('Erreur', 'Erreur lors du téléchargement');
            setDownloadingTracks(prev => {
                const newMap = new Map(prev);
                newMap.delete(sound.id);
                return newMap;
            });
        }
    };

    const handleViewDetails = (sound) => {
        setSelectedSound(sound);
        setShowModal(true);
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

    const loadMoreSounds = () => {
        if (pagination.has_more) {
            loadSounds(pagination.current_page + 1);
        }
    };

    if (loading && sounds.length === 0) {
        return (
            <div className="catalog-loading">
                <Container>
                    <Row className="justify-content-center">
                        <Col md={6} className="text-center py-5">
                            <div className="loading-animation">
                                <Spinner animation="border" variant="primary" size="lg" />
                                <h5 className="mt-3 text-muted">Chargement du catalogue...</h5>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
        );
    }

    return (
        <div className="catalog-social-feed">
            {/* Header moderne */}
            <div className="feed-header">
                <Container>
                    <Row className="align-items-center py-4">
                        <Col lg={8}>
                            <div className="page-title">
                                <h1 className="fw-bold mb-2">
                                    <FontAwesomeIcon icon={faMusic} className="me-3 text-primary" />
                                    Catalogue Musical
                                </h1>
                                <p className="text-muted mb-0">
                                    Découvrez des sons uniques créés par des artistes camerounais
                                </p>
                            </div>
                        </Col>
                        <Col lg={4} className="text-end">
                            <div className="stats-preview">
                                <Badge bg="light" text="dark" className="me-2">
                                    {pagination?.total || 0} sons
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
                                        placeholder="Titre, artiste, genre..."
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
                                    filter="trending"
                                    icon={faArrowUp}
                                    label="Tendances"
                                    isActive={activeFilter === 'trending'}
                                    onClick={() => setActiveFilter('trending')}
                                />
                                <FilterButton
                                    filter="new"
                                    icon={faGem}
                                    label="Nouveautés"
                                    isActive={activeFilter === 'new'}
                                    onClick={() => setActiveFilter('new')}
                                />
                                <FilterButton
                                    filter="popular"
                                    icon={faFire}
                                    label="Populaires"
                                    isActive={activeFilter === 'popular'}
                                    onClick={() => setActiveFilter('popular')}
                                />
                                <FilterButton
                                    filter="free"
                                    icon={faHeart}
                                    label="Gratuits"
                                    isActive={activeFilter === 'free'}
                                    onClick={() => setActiveFilter('free')}
                                />
                            </div>
                        </Col>
                    </Row>

                    {/* Filtres secondaires */}
                    <Row className="g-2">
                        <Col md={4}>
                            <Form.Select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                size="sm"
                                className="filter-select"
                            >
                                {categories.map(category => (
                                    <option key={category.value} value={category.value}>
                                        {category.label}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={4}>
                            <Form.Select
                                value={selectedPrice}
                                onChange={(e) => setSelectedPrice(e.target.value)}
                                size="sm"
                                className="filter-select"
                            >
                                {priceRanges.map(range => (
                                    <option key={range.value} value={range.value}>
                                        {range.label}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={4}>
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                className="w-100"
                                onClick={() => {
                                    setSelectedCategory('all');
                                    setSelectedPrice('all');
                                    setSearchTerm('');
                                    setActiveFilter('trending');
                                }}
                            >
                                <FontAwesomeIcon icon={faFilter} className="me-2" />
                                Reset
                            </Button>
                        </Col>
                    </Row>

                    {/* Filtres actifs */}
                    {(selectedCategory !== 'all' || selectedPrice !== 'all' || searchTerm) && (
                        <Row className="mt-3">
                            <Col>
                                <div className="active-filters">
                                    <span className="me-2 text-muted small">Filtres actifs:</span>
                                    {selectedCategory !== 'all' && (
                                        <Badge bg="primary" className="me-2 filter-tag">
                                            {categories.find(c => c.value === selectedCategory)?.label}
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="p-0 ms-1 text-white"
                                                onClick={() => setSelectedCategory('all')}
                                            >×</Button>
                                        </Badge>
                                    )}
                                    {selectedPrice !== 'all' && (
                                        <Badge bg="info" className="me-2 filter-tag">
                                            {priceRanges.find(p => p.value === selectedPrice)?.label}
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="p-0 ms-1 text-white"
                                                onClick={() => setSelectedPrice('all')}
                                            >×</Button>
                                        </Badge>
                                    )}
                                    {searchTerm && (
                                        <Badge bg="warning" className="me-2 filter-tag">
                                            "{searchTerm}"
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="p-0 ms-1 text-dark"
                                                onClick={() => setSearchTerm('')}
                                            >×</Button>
                                        </Badge>
                                    )}
                                </div>
                            </Col>
                        </Row>
                    )}
                </Container>
            </div>

            {/* Grille des sons */}
            <Container className="py-4">
                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" className="mb-3" />
                        <h6 className="text-muted">Mise à jour...</h6>
                    </div>
                ) : sounds.length === 0 ? (
                    <div className="empty-state">
                        <Row className="justify-content-center">
                            <Col md={6} className="text-center py-5">
                                <FontAwesomeIcon icon={faMusic} size="3x" className="text-muted mb-3" />
                                <h5 className="text-muted">Aucun son trouvé</h5>
                                <p className="text-muted">Essayez de modifier vos critères de recherche</p>
                                <Button variant="primary" onClick={() => loadSounds(1)}>
                                    Recharger le catalogue
                                </Button>
                            </Col>
                        </Row>
                    </div>
                ) : (
                    <>
                        <Row className="g-4">
                            {sounds.map((sound, index) => (
                                <Col lg={3} md={4} sm={6} key={sound.id}>
                                    <Card className="sound-card" style={{ animationDelay: `${index * 0.1}s` }}>
                                        {/* Cover avec overlay */}
                                        <div className="sound-cover">
                                            <img
                                                src={sound.cover || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=200&fit=crop`}
                                                alt={sound.title}
                                                className="cover-image"
                                            />

                                            {/* Prix badge */}
                                            <div className="position-absolute top-0 start-0 m-3">
                                                {sound.is_free || sound.price === 0 ? (
                                                    <Badge bg="success" className="price-badge">
                                                        Gratuit
                                                    </Badge>
                                                ) : (
                                                    <Badge bg="primary" className="price-badge">
                                                        {new Intl.NumberFormat('fr-FR').format(sound.price)} XAF
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Featured badge */}
                                            {sound.is_featured && (
                                                <div className="position-absolute top-0 end-0 m-3">
                                                    <Badge bg="warning" className="featured-badge">
                                                        <FontAwesomeIcon icon={faArrowUp} className="me-1" />
                                                        Vedette
                                                    </Badge>
                                                </div>
                                            )}

                                            {/* Play overlay */}
                                            <div className="play-overlay">
                                                <Button
                                                    variant="light"
                                                    size="lg"
                                                    className="play-btn"
                                                    onClick={() => handleViewDetails(sound)}
                                                >
                                                    <FontAwesomeIcon icon={faPlay} />
                                                </Button>
                                            </div>
                                        </div>

                                        <Card.Body className="p-3">
                                            {/* Titre et artiste */}
                                            <div className="sound-info">
                                                <h6 className="sound-title">
                                                    <Link
                                                        to={`/sounds/${sound.id}`}
                                                        className="text-decoration-none"
                                                    >
                                                        {sound.title}
                                                    </Link>
                                                </h6>
                                                <p className="sound-artist">
                                                    par <Link
                                                        to={`/artists/${sound.artistId || sound.user_id}`}
                                                        className="text-decoration-none artist-link"
                                                    >
                                                        {sound.artist}
                                                    </Link>
                                                </p>

                                                {/* Tags */}
                                                <div className="sound-tags mb-3">
                                                    {sound.category && (
                                                        <Badge bg="light" text="dark" className="tag-badge">
                                                            <FontAwesomeIcon icon={faTag} className="me-1" />
                                                            {sound.category}
                                                        </Badge>
                                                    )}
                                                    {sound.genre && (
                                                        <Badge bg="outline-secondary" className="tag-badge">
                                                            {sound.genre}
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Stats */}
                                                <div className="sound-stats">
                                                    <span className="stat-item">
                                                        <FontAwesomeIcon icon={faHeart} className="text-danger" />
                                                        {sound.likes || 0}
                                                    </span>
                                                    <span className="stat-item">
                                                        <FontAwesomeIcon icon={faPlay} className="text-primary" />
                                                        {sound.plays || 0}
                                                    </span>
                                                    <span className="stat-item">
                                                        <FontAwesomeIcon icon={faDownload} className="text-success" />
                                                        {sound.downloads || 0}
                                                    </span>
                                                    {sound.duration && (
                                                        <span className="stat-item">
                                                            <FontAwesomeIcon icon={faClock} className="text-muted" />
                                                            {sound.duration}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="sound-actions">
                                                {/* Like button */}
                                                <Button
                                                    variant={likedSounds.has(sound.id) ? "danger" : "outline-secondary"}
                                                    size="sm"
                                                    className="action-btn"
                                                    onClick={() => handleLike(sound.id)}
                                                    disabled={!token}
                                                >
                                                    <FontAwesomeIcon icon={faHeart} />
                                                </Button>

                                                {/* View details */}
                                                <Button
                                                    variant="outline-info"
                                                    size="sm"
                                                    className="action-btn"
                                                    onClick={() => handleViewDetails(sound)}
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
                                                </Button>

                                                {/* Main action button */}
                                                {sound.is_free || sound.price === 0 ? (
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        className="main-action-btn"
                                                        onClick={() => handleDownload(sound)}
                                                        disabled={downloadingTracks.has(sound.id)}
                                                    >
                                                        {downloadingTracks.has(sound.id) ? (
                                                            <div className="download-progress">
                                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                                    <span className="small">Téléchargement...</span>
                                                                    <span className="small">{downloadingTracks.get(sound.id)?.progress || 0}%</span>
                                                                </div>
                                                                <ProgressBar
                                                                    now={downloadingTracks.get(sound.id)?.progress || 0}
                                                                    size="sm"
                                                                    style={{ height: '3px' }}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <FontAwesomeIcon icon={faDownload} className="me-1" />
                                                                Télécharger
                                                            </>
                                                        )}
                                                    </Button>
                                                ) : checkIfPurchased(sound.id) ? (
                                                    <Button
                                                        variant="outline-success"
                                                        size="sm"
                                                        className="main-action-btn"
                                                        onClick={() => handleDownload(sound)}
                                                        disabled={downloadingTracks.has(sound.id)}
                                                    >
                                                        {downloadingTracks.has(sound.id) ? (
                                                            <div className="download-progress">
                                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                                    <span className="small">Téléchargement...</span>
                                                                    <span className="small">{downloadingTracks.get(sound.id)?.progress || 0}%</span>
                                                                </div>
                                                                <ProgressBar
                                                                    now={downloadingTracks.get(sound.id)?.progress || 0}
                                                                    size="sm"
                                                                    style={{ height: '3px' }}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <FontAwesomeIcon icon={faDownload} className="me-1" />
                                                                Télécharger
                                                            </>
                                                        )}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        className="main-action-btn"
                                                        onClick={() => handleAddToCart(sound)}
                                                    >
                                                        <FontAwesomeIcon icon={faShoppingCart} className="me-1" />
                                                        Ajouter au panier
                                                    </Button>
                                                )}
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>

                        {/* Load more */}
                        {pagination.has_more && (
                            <div className="text-center mt-5">
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={loadMoreSounds}
                                    disabled={loading}
                                    className="load-more-btn"
                                >
                                    {loading ? (
                                        <>
                                            <Spinner animation="border" size="sm" className="me-2" />
                                            Chargement...
                                        </>
                                    ) : (
                                        <>
                                            Charger plus de sons
                                            <Badge bg="light" text="dark" className="ms-2">
                                                {pagination.current_page} / {pagination.last_page}
                                            </Badge>
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </Container>

            {/* Modal détails */}
            {selectedSound && (
                <SoundDetailsModal
                    show={showModal}
                    onHide={() => setShowModal(false)}
                    sound={selectedSound}
                    onLike={handleLike}
                    onAddToCart={handleAddToCart}
                    likedSounds={likedSounds}
                    hasPurchased={checkIfPurchased(selectedSound.id)}
                />
            )}

            <style jsx>{`
                .catalog-social-feed {
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

                .active-filters {
                    animation: slideInUp 0.5s ease-out;
                }

                .filter-tag {
                    animation: bounceIn 0.5s ease-out;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .filter-tag:hover {
                    transform: scale(1.05);
                }

                .sound-card {
                    border: none;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 2px 15px rgba(0,0,0,0.08);
                    transition: all 0.4s ease;
                    animation: slideInUp 0.6s ease-out both;
                    background: white;
                }

                .sound-card:hover {
                    transform: translateY(-10px);
                    box-shadow: 0 20px 50px rgba(0,0,0,0.15);
                }

                .sound-cover {
                    position: relative;
                    height: 200px;
                    overflow: hidden;
                }

                .cover-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.4s ease;
                }

                .sound-card:hover .cover-image {
                    transform: scale(1.1);
                }

                .price-badge {
                    animation: pulse 2s infinite;
                    font-weight: 500;
                }

                .featured-badge {
                    animation: bounce 2s infinite;
                    font-weight: 500;
                }

                .play-overlay {
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

                .sound-card:hover .play-overlay {
                    opacity: 1;
                }

                .play-btn {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transform: scale(0.8);
                    transition: all 0.3s ease;
                }

                .play-overlay:hover .play-btn {
                    transform: scale(1);
                }

                .sound-title {
                    font-weight: 600;
                    margin-bottom: 5px;
                    color: #333;
                    font-size: 16px;
                }

                .sound-title a {
                    color: inherit;
                    transition: color 0.3s ease;
                }

                .sound-title a:hover {
                    color: #667eea;
                }

                .sound-artist {
                    color: #666;
                    font-size: 14px;
                    margin-bottom: 10px;
                }

                .artist-link {
                    color: #667eea;
                    font-weight: 500;
                    transition: color 0.3s ease;
                }

                .artist-link:hover {
                    color: #5a67d8;
                }

                .sound-tags {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                }

                .tag-badge {
                    font-size: 11px;
                    padding: 3px 8px;
                    border-radius: 10px;
                    border: 1px solid #e9ecef !important;
                }

                .sound-stats {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 15px;
                    padding: 10px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }

                .stat-item {
                    font-size: 12px;
                    color: #666;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-weight: 500;
                }

                .sound-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .action-btn {
                    width: 35px;
                    height: 35px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                }

                .action-btn:hover {
                    transform: scale(1.1);
                }

                .main-action-btn {
                    flex: 1;
                    border-radius: 20px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }

                .main-action-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                }

                .download-progress {
                    width: 100%;
                }

                .load-more-btn {
                    border-radius: 25px;
                    padding: 12px 30px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                    animation: pulse 2s infinite;
                }

                .load-more-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
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

                @keyframes bounceIn {
                    0% {
                        opacity: 0;
                        transform: scale(0.3);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1.05);
                    }
                    70% {
                        transform: scale(0.9);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1);
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

                @keyframes bounce {
                    0%, 20%, 53%, 80%, 100% {
                        transform: translateY(0);
                    }
                    40%, 43% {
                        transform: translateY(-3px);
                    }
                    70% {
                        transform: translateY(-2px);
                    }
                    90% {
                        transform: translateY(-1px);
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

                    .sound-card {
                        margin-bottom: 20px;
                    }

                    .filter-tabs {
                        justify-content: center;
                    }

                    .sound-stats {
                        flex-direction: column;
                        gap: 8px;
                    }

                    .stat-item {
                        justify-content: center;
                    }
                }

                @media (max-width: 576px) {
                    .search-input {
                        font-size: 14px;
                    }

                    .sound-actions {
                        flex-direction: column;
                        gap: 10px;
                    }

                    .action-btn {
                        width: 100%;
                        border-radius: 10px;
                    }
                }
            `}</style>
        </div>
    );
};

export default Catalog;
