import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Form, InputGroup, ProgressBar } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faMusic,
    faPlay,
    faPause,
    faHeart,
    faDownload,
    faShoppingCart,
    faArrowLeft,
    faSearch,
    faTh,
    faList,
    faFilter,
    faEye,
    faHeadphones,
    faClock,
    faFire,
    faStopwatch,
    faStar
} from '@fortawesome/free-solid-svg-icons';
import { AnimatedElement } from '../common/PageTransition';
import LoadingScreen from '../common/LoadingScreen';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import SoundDetailsModal from '../common/SoundDetailsModal';
import { usePurchasedSounds } from '../../hooks/usePurchasedSounds';

const CategoryDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState(null);
    const [sounds, setSounds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('recent');
    const [viewMode, setViewMode] = useState('grid');
    const [likedSounds, setLikedSounds] = useState(new Set());
    const [downloadingTracks, setDownloadingTracks] = useState(new Map());
    const [showModal, setShowModal] = useState(false);
    const [selectedSound, setSelectedSound] = useState(null);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
        has_more: false
    });

    const { addToCart } = useCart();
    const toast = useToast();
    const { token, user } = useAuth();
    const { purchasedSounds, checkIfPurchased } = usePurchasedSounds();

    const sortOptions = [
        { value: 'recent', label: 'Plus récents', icon: faStopwatch },
        { value: 'popular', label: 'Plus populaires', icon: faFire },
        { value: 'downloads', label: 'Plus téléchargés', icon: faDownload },
        { value: 'name', label: 'Alphabétique', icon: faMusic },
        { value: 'price_asc', label: 'Prix croissant', icon: faStar },
        { value: 'price_desc', label: 'Prix décroissant', icon: faStar }
    ];

    useEffect(() => {
        loadCategoryData();
    }, [id]);

    useEffect(() => {
        if (token && sounds.length > 0) {
            loadLikesStatus();
        }
    }, [sounds, token]);

    useEffect(() => {
        if (category) {
            loadCategorySounds();
        }
    }, [searchTerm, sortBy]);

    // Nouveau useEffect pour recharger quand la catégorie change
    useEffect(() => {
        if (category) {
            loadCategorySounds();
        }
    }, [category]);

    const loadCategoryData = async () => {
        try {
            setLoading(true);

            // Charger les informations de la catégorie
            const categoryResponse = await fetch(`/api/categories/${id}`);
            const categoryData = await categoryResponse.json();

            if (!categoryData.success) {
                toast.error('Erreur', 'Catégorie non trouvée');
                navigate('/categories');
                return;
            }

            setCategory(categoryData.category);

            // Charger les sons de cette catégorie avec les vraies données
            // Passer directement les données de la catégorie pour éviter le problème d'état asynchrone
            await loadCategorySounds(1, categoryData.category);

        } catch (error) {
            console.error('Erreur lors du chargement:', error);
            toast.error('Erreur', 'Impossible de charger les données');
        } finally {
            setLoading(false);
        }
    };

    const loadCategorySounds = async (page = 1, categoryData = null) => {
        try {
            // Utiliser categoryData passé en paramètre ou la variable d'état category
            const currentCategory = categoryData || category;

            const params = new URLSearchParams({
                page: page.toString(),
                per_page: pagination.per_page.toString(),
                sort: sortBy
            });

            // Utiliser le nom ou l'ID de la catégorie pour filtrer
            if (currentCategory?.name) {
                params.append('category', currentCategory.name);
            } else if (currentCategory?.id) {
                params.append('category_id', currentCategory.id);
            } else if (id) {
                // Fallback: utiliser l'ID de l'URL directement
                params.append('category_id', id);
            }

            if (searchTerm.trim()) {
                params.append('search', searchTerm.trim());
            }

            console.log('Loading sounds for category:', currentCategory, 'with params:', params.toString());

            const response = await fetch(`/api/sounds?${params}`, {
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                setSounds(data.sounds || []);
                setPagination(data.pagination || pagination);
            } else {
                throw new Error(data.message || 'Erreur lors du chargement des sons');
            }

        } catch (error) {
            console.error('Erreur lors du chargement des sons:', error);
            toast.error('Erreur', 'Erreur lors du chargement des sons');
        }
    };

    const loadLikesStatus = async () => {
        if (!sounds.length || !token) return;

        try {
            const response = await fetch('/api/sounds/likes/status', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sound_ids: sounds.map(s => s.id) })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                setLikedSounds(new Set(data.likes || []));
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement des likes:', error);
        }
    };

    const handleLike = async (soundId) => {
        if (!token) {
            toast.warning('Connexion requise', 'Vous devez être connecté pour aimer un son');
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

            if (response.ok) {
                const data = await response.json();
                setLikedSounds(prev => {
                    const newSet = new Set(prev);
                    if (data.is_liked) {
                        newSet.add(soundId);
                    } else {
                        newSet.delete(soundId);
                    }
                    return newSet;
                });

                setSounds(prev => prev.map(sound =>
                    sound.id === soundId
                        ? { ...sound, likes: data.likes_count }
                        : sound
                ));

                toast.success('Succès', data.is_liked ? 'Son ajouté aux favoris' : 'Son retiré des favoris');
            }
        } catch (error) {
            console.error('Erreur lors du like:', error);
            toast.error('Erreur', 'Erreur de connexion');
        }
    };

    const handleAddToCart = (sound) => {
        // Si le son est gratuit, proposer le téléchargement direct
        if (sound.is_free || sound.price === 0) {
            handleDownload(sound);
            return;
        }

        // Pour les sons payants, ajouter au panier
        const success = addToCart({
            id: sound.id,
            type: 'sound',
            title: sound.title,
            artist: sound.artist,
            price: sound.price || 0,
            cover: sound.cover || sound.cover_image,
            duration: sound.duration,
            category: sound.category
        });

        if (success) {
        toast.success('Ajouté au panier', `"${sound.title}" a été ajouté au panier`);
        }
    };

    const handleDownload = async (sound) => {
        if (!token) {
            toast.error('Connexion requise', 'Veuillez vous connecter pour télécharger');
            return;
        }

        try {
            setDownloadingTracks(prev => new Map(prev.set(sound.id, { progress: 0, status: 'starting' })));

            // Utiliser l'endpoint correct qui incrémente automatiquement
            const response = await fetch(`/api/sounds/${sound.id}/download`, {
                method: 'POST', // POST pour incrémenter
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

            // Créer le blob et télécharger
            const blob = new Blob(chunks);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${sound.title}.mp3`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            // Marquer comme téléchargé
            setDownloadingTracks(prev => new Map(prev.set(sound.id, {
                progress: 100,
                status: 'completed'
            })));

            toast.success('Téléchargement terminé', `"${sound.title}" a été téléchargé avec succès`);

            // Nettoyer après 3 secondes
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

    const loadMoreSounds = async () => {
        if (pagination.has_more) {
            await loadCategorySounds(pagination.current_page + 1);
        }
    };

    if (loading) {
        return <LoadingScreen />;
    }

    if (!category) {
        return (
            <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center avoid-header-overlap">
                <div className="text-center">
                    <h3>Catégorie non trouvée</h3>
                    <Button as={Link} to="/categories" variant="primary">
                        Retour aux catégories
                    </Button>
                </div>
            </div>
        );
    }

    const SoundCard = ({ sound, index }) => (
        <AnimatedElement animation={index % 2 === 0 ? "slideInLeft" : "slideInRight"} delay={100 + (index * 50)}>
            <Card className="sound-card-modern h-100 border-0 shadow-sm">
                <div className="position-relative">
                    <Card.Img
                        variant="top"
                        src={sound.cover || sound.cover_image || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=200&fit=crop`}
                        className="sound-image"
                        style={{ height: '180px', objectFit: 'cover' }}
                    />

                    {/* Badges */}
                    <div className="position-absolute top-0 start-0 m-2">
                        {sound.is_free || sound.price === 0 ? (
                            <Badge bg="success" className="badge-modern shadow-sm">
                                Gratuit
                            </Badge>
                        ) : (
                            <Badge bg="primary" className="badge-modern shadow-sm">
                                {formatCurrency(sound.price)}
                            </Badge>
                        )}
                    </div>

                    {sound.is_featured && (
                        <Badge bg="warning" className="position-absolute top-0 end-0 m-2 badge-modern shadow-sm">
                            <FontAwesomeIcon icon={faFire} className="me-1" />
                            Vedette
                        </Badge>
                    )}

                    {/* Play Overlay */}
                    <div className="sound-play-overlay">
                        <Button
                            className="play-button-modern"
                            onClick={() => handleViewDetails(sound)}
                        >
                            <FontAwesomeIcon icon={faPlay} />
                        </Button>
                    </div>
                </div>

                <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="flex-grow-1">
                            <Card.Title className="h6 mb-1 text-truncate">
                                <Link
                                    to={`/sounds/${sound.id}`}
                                    className="text-decoration-none text-dark"
                                >
                                    {sound.title}
                                </Link>
                            </Card.Title>
                            <Card.Text className="small text-muted mb-2">
                                par <Link
                                    to={`/artists/${sound.artistId || sound.user_id}`}
                                    className="text-decoration-none text-primary fw-medium"
                                >
                                    {sound.artist}
                                </Link>
                            </Card.Text>
                        </div>
                        <Button
                            variant={likedSounds.has(sound.id) ? "danger" : "outline-danger"}
                            size="sm"
                            className="btn-heart"
                            onClick={() => handleLike(sound.id)}
                        >
                            <FontAwesomeIcon icon={faHeart} />
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center gap-3">
                            <small className="text-muted d-flex align-items-center">
                                <FontAwesomeIcon icon={faPlay} className="me-1 text-primary" />
                                {formatNumber(sound.plays || 0)}
                            </small>
                            <small className="text-muted d-flex align-items-center">
                                <FontAwesomeIcon icon={faDownload} className="me-1 text-success" />
                                {formatNumber(sound.downloads || 0)}
                            </small>
                        </div>
                        <small className="text-muted d-flex align-items-center">
                            <FontAwesomeIcon icon={faClock} className="me-1" />
                            {sound.duration || '0:00'}
                        </small>
                    </div>

                    {/* Actions */}
                    <div className="d-flex gap-2 align-items-center">
                        <Button
                            variant="outline-info"
                            size="sm"
                            className="btn-action"
                            onClick={() => handleViewDetails(sound)}
                            title="Voir les détails"
                        >
                            <FontAwesomeIcon icon={faEye} />
                        </Button>

                        {sound.is_free || sound.price === 0 ? (
                            // Son gratuit : bouton télécharger
                            <Button
                                variant="success"
                                size="sm"
                                className="flex-grow-1"
                                onClick={() => handleDownload(sound)}
                                disabled={downloadingTracks.has(sound.id)}
                                style={{ borderRadius: '20px' }}
                            >
                                {downloadingTracks.has(sound.id) ? (
                                    <div className="w-100">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <span className="small">Téléchargement...</span>
                                            <span className="small">{downloadingTracks.get(sound.id)?.progress || 0}%</span>
                                        </div>
                                        <ProgressBar
                                            now={downloadingTracks.get(sound.id)?.progress || 0}
                                            size="sm"
                                            style={{ height: '4px' }}
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
                            // Son acheté : bouton télécharger
                            <Button
                                variant="outline-success"
                                size="sm"
                                className="flex-grow-1"
                                onClick={() => handleDownload(sound)}
                                disabled={downloadingTracks.has(sound.id)}
                                style={{ borderRadius: '20px' }}
                            >
                                {downloadingTracks.has(sound.id) ? (
                                    <div className="w-100">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <span className="small">Téléchargement...</span>
                                            <span className="small">{downloadingTracks.get(sound.id)?.progress || 0}%</span>
                                        </div>
                                        <ProgressBar
                                            now={downloadingTracks.get(sound.id)?.progress || 0}
                                            size="sm"
                                            style={{ height: '4px' }}
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
                            // Son payant : bouton ajouter au panier
                            <Button
                                variant="primary"
                                size="sm"
                                className="flex-grow-1"
                                onClick={() => handleAddToCart(sound)}
                                style={{ borderRadius: '20px' }}
                            >
                                <FontAwesomeIcon icon={faShoppingCart} className="me-1" />
                                Ajouter au panier
                            </Button>
                        )}
                    </div>
                </Card.Body>
            </Card>
        </AnimatedElement>
    );

    return (
        <div className="min-vh-100 bg-light avoid-header-overlap">
            {/* Hero Section */}
            <section className="category-hero" style={{
                background: `linear-gradient(135deg, ${category.color || '#8b5cf6'}15, ${category.color || '#8b5cf6'}25)`,
                borderBottom: `3px solid ${category.color || '#8b5cf6'}30`
            }}>
                <Container>
                    <div className="py-5">
                        <Row className="align-items-center">
                            <Col lg={8}>
                                <AnimatedElement animation="slideInLeft" delay={100}>
                                    <div className="d-flex align-items-center mb-3">
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() => navigate('/categories')}
                                            className="me-3"
                                        >
                                            <FontAwesomeIcon icon={faArrowLeft} />
                                        </Button>
                                        <Badge
                                            style={{ backgroundColor: category.color || '#8b5cf6' }}
                                            className="badge-modern"
                                        >
                                            Catégorie
                                        </Badge>
                                    </div>
                                    <h1 className="display-5 fw-bold mb-3" style={{ color: category.color || '#8b5cf6' }}>
                                        {category.name}
                                    </h1>
                                    <p className="lead text-muted mb-4">
                                        {category.description || 'Découvrez les sons de cette catégorie'}
                                    </p>
                                    <div className="d-flex gap-4 flex-wrap">
                                        <div className="d-flex align-items-center">
                                            <FontAwesomeIcon icon={faMusic} className="me-2 text-primary" />
                                            <span className="fw-medium">{sounds.length} sons</span>
                                        </div>
                                        <div className="d-flex align-items-center">
                                            <FontAwesomeIcon icon={faHeadphones} className="me-2 text-success" />
                                            <span className="fw-medium">
                                                {formatNumber(sounds.reduce((total, sound) => total + (sound.plays || 0), 0))} écoutes
                                            </span>
                                        </div>
                                        <div className="d-flex align-items-center">
                                            <FontAwesomeIcon icon={faDownload} className="me-2 text-warning" />
                                            <span className="fw-medium">
                                                {formatNumber(sounds.reduce((total, sound) => total + (sound.downloads || 0), 0))} téléchargements
                                            </span>
                                        </div>
                                    </div>
                                </AnimatedElement>
                            </Col>
                            <Col lg={4}>
                                <AnimatedElement animation="slideInRight" delay={200}>
                                    <div className="text-end">
                                        <div className="category-icon-large mb-3">
                                            <FontAwesomeIcon
                                                icon={faMusic}
                                                style={{
                                                    fontSize: '4rem',
                                                    color: category.color || '#8b5cf6',
                                                    opacity: 0.3
                                                }}
                                            />
                                        </div>
                                    </div>
                                </AnimatedElement>
                            </Col>
                        </Row>
                    </div>
                </Container>
            </section>

            {/* Filters Section */}
            <section className="py-4 bg-white shadow-sm">
                <Container>
                    <Row className="g-3 align-items-center">
                        <Col lg={4} md={6}>
                            <InputGroup>
                                <InputGroup.Text>
                                    <FontAwesomeIcon icon={faSearch} />
                                </InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Rechercher dans cette catégorie..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col lg={3} md={4}>
                            <Form.Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                {sortOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col lg={3} md={6}>
                            <div className="d-flex gap-2">
                                <Button
                                    variant={viewMode === 'grid' ? 'primary' : 'outline-primary'}
                                    size="sm"
                                    onClick={() => setViewMode('grid')}
                                >
                                    <FontAwesomeIcon icon={faTh} />
                                </Button>
                                <Button
                                    variant={viewMode === 'list' ? 'primary' : 'outline-primary'}
                                    size="sm"
                                    onClick={() => setViewMode('list')}
                                >
                                    <FontAwesomeIcon icon={faList} />
                                </Button>
                            </div>
                        </Col>
                        <Col lg={2} md={6}>
                            <small className="text-muted">
                                {sounds.length} résultat{sounds.length > 1 ? 's' : ''}
                            </small>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Sounds Section */}
            <section className="py-4">
                <Container>
                    {sounds.length === 0 ? (
                        <div className="text-center py-5">
                            <FontAwesomeIcon icon={faMusic} size="3x" className="text-muted mb-3" />
                            <h4 className="text-muted">Aucun son trouvé</h4>
                            <p className="text-secondary">
                                {searchTerm
                                    ? 'Essayez avec des mots-clés différents'
                                    : 'Cette catégorie ne contient pas encore de sons'
                                }
                            </p>
                            {searchTerm && (
                                <Button variant="outline-primary" onClick={() => setSearchTerm('')}>
                                    Effacer la recherche
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                        <Row className="g-4">
                                {sounds.map((sound, index) => (
                                <Col
                                    key={sound.id}
                                    lg={viewMode === 'grid' ? 3 : 12}
                                    md={viewMode === 'grid' ? 4 : 12}
                                    sm={viewMode === 'grid' ? 6 : 12}
                                >
                                    <SoundCard sound={sound} index={index} />
                                </Col>
                            ))}
                        </Row>

                            {/* Pagination */}
                            {pagination.has_more && (
                                <div className="text-center mt-5">
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        onClick={loadMoreSounds}
                                        disabled={loading}
                                        style={{ borderRadius: '12px', padding: '12px 30px' }}
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
            </section>

            {/* Modal de détails du son */}
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
                .category-hero {
                    position: relative;
                    overflow: hidden;
                }

                .sound-card-modern {
                    transition: all 0.3s ease;
                    border-radius: 15px;
                    overflow: hidden;
                }

                .sound-card-modern:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1) !important;
                }

                .sound-image {
                    transition: transform 0.3s ease;
                }

                .sound-card-modern:hover .sound-image {
                    transform: scale(1.05);
                }

                .sound-play-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .sound-card-modern:hover .sound-play-overlay {
                    opacity: 1;
                }

                .play-button-modern {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: rgba(139, 92, 246, 0.9);
                    border: none;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    transition: all 0.3s ease;
                    backdrop-filter: blur(10px);
                }

                .play-button-modern:hover {
                    background: rgba(139, 92, 246, 1);
                    transform: scale(1.1);
                    box-shadow: 0 0 25px rgba(139, 92, 246, 0.5);
                }

                .badge-modern {
                    font-weight: 500;
                    font-size: 0.75rem;
                    padding: 0.5rem 0.75rem;
                    border-radius: 8px;
                }

                .btn-heart {
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0;
                    transition: all 0.3s ease;
                }

                .btn-heart:hover {
                    transform: scale(1.1);
                }

                .btn-action {
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0;
                    transition: all 0.3s ease;
                }

                .btn-action:hover {
                    transform: scale(1.1);
                }

                .avoid-header-overlap {
                    padding-top: 80px;
                }

                @media (max-width: 768px) {
                    .category-hero {
                        padding: 2rem 0 !important;
                    }

                    .display-5 {
                        font-size: 2rem !important;
                    }

                    .sound-card-modern:hover {
                        transform: translateY(-2px);
                    }
                }
            `}</style>
        </div>
    );
};

export default CategoryDetail;
