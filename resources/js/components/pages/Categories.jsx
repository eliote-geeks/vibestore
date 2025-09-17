import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Alert, Button, Form, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHeadphones, faPlay, faMusic, faHeart, faMicrophone, faDrum, faHeartbeat,
    faHandsPraying, faBolt, faUsers, faSmile, faFire, faCloud, faLeaf, faSearch,
    faFilter, faArrowUp, faGem, faEye, faShare, faPlus
} from '@fortawesome/free-solid-svg-icons';
import { AnimatedElement } from '../common/PageTransition';
import axios from 'axios';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('popular');
    const [viewMode, setViewMode] = useState('grid');

    // Map des icônes FontAwesome
    const iconMap = {
        'faHeart': faHeart,
        'faMicrophone': faMicrophone,
        'faMusic': faMusic,
        'faDrum': faDrum,
        'faHeartbeat': faHeartbeat,
        'faHandsPraying': faHandsPraying,
        'faBolt': faBolt,
        'faUsers': faUsers,
        'faSmile': faSmile,
        'faFire': faFire,
        'faCloud': faCloud,
        'faLeaf': faLeaf,
    };

    // Images par défaut pour les catégories
    const defaultImages = [
        "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=250&fit=crop&crop=center",
        "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=250&fit=crop&crop=center",
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop&crop=center",
        "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=250&fit=crop&crop=center",
        "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=250&fit=crop&crop=center",
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop&crop=center"
    ];

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/categories?active=1');

            if (response.data.success) {
                // Ajouter des données d'affichage aux catégories
                const categoriesWithDisplay = response.data.categories.map((category, index) => ({
                    ...category,
                    image: category.image_url || defaultImages[index % defaultImages.length],
                    soundCount: category.sounds_count || 0,
                    trending: category.sounds_count > 50
                }));

                setCategories(categoriesWithDisplay);
            } else {
                setError('Erreur lors du chargement des catégories');
            }
        } catch (err) {
            console.error('Erreur lors du chargement des catégories:', err);
            setError('Impossible de charger les catégories');
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num?.toString() || '0';
    };

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="social-categories">
                <Container>
                    <Row className="justify-content-center">
                        <Col md={6} className="text-center py-5">
                            <div className="loading-animation">
                                <Spinner animation="border" variant="primary" size="lg" />
                                <h5 className="mt-3 text-muted">Chargement des catégories...</h5>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
        );
    }

    if (error) {
        return (
            <div className="social-categories">
                <Container>
                    <Row className="justify-content-center">
                        <Col md={6}>
                            <Alert variant="danger" className="text-center">
                                <FontAwesomeIcon icon={faMusic} className="mb-2" size="2x" />
                                <h5>Oops !</h5>
                                <p>{error}</p>
                            </Alert>
                        </Col>
                    </Row>
                </Container>
            </div>
        );
    }

    return (
        <div className="social-categories">
            {/* Header social */}
            <div className="categories-header">
                <Container>
                    <Row className="align-items-center py-4">
                        <Col lg={6}>
                            <AnimatedElement animation="slideInLeft">
                                <div className="header-content">
                                    <h1 className="display-6 fw-bold mb-2">
                                        <FontAwesomeIcon icon={faMusic} className="me-3 text-primary" />
                                        Genres Musicaux
                                    </h1>
                                    <p className="text-muted mb-0">
                                        Découvrez {categories.length} genres avec {categories.reduce((total, cat) => total + cat.soundCount, 0)} sons
                                    </p>
                                </div>
                            </AnimatedElement>
                        </Col>
                        <Col lg={6}>
                            <AnimatedElement animation="slideInRight">
                                <div className="header-actions">
                                    <InputGroup className="search-container">
                                        <Form.Control
                                            type="text"
                                            placeholder="Rechercher un genre..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="search-input"
                                        />
                                        <Button variant="primary" className="search-btn">
                                            <FontAwesomeIcon icon={faSearch} />
                                        </Button>
                                    </InputGroup>
                                </div>
                            </AnimatedElement>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Filtres */}
            <div className="categories-filters">
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <div className="filter-tabs">
                                <Button
                                    variant={sortBy === 'popular' ? 'primary' : 'outline-primary'}
                                    size="sm"
                                    onClick={() => setSortBy('popular')}
                                    className="filter-btn"
                                >
                                    <FontAwesomeIcon icon={faFire} className="me-2" />
                                    Populaires
                                </Button>
                                <Button
                                    variant={sortBy === 'trending' ? 'primary' : 'outline-primary'}
                                    size="sm"
                                    onClick={() => setSortBy('trending')}
                                    className="filter-btn"
                                >
                                    <FontAwesomeIcon icon={faArrowUp} className="me-2" />
                                    Tendances
                                </Button>
                                <Button
                                    variant={sortBy === 'newest' ? 'primary' : 'outline-primary'}
                                    size="sm"
                                    onClick={() => setSortBy('newest')}
                                    className="filter-btn"
                                >
                                    <FontAwesomeIcon icon={faGem} className="me-2" />
                                    Nouveaux
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Grid des catégories */}
            <Container>
                <div className="categories-content">
                    <Row className="g-4">
                        {filteredCategories.map((category, index) => (
                            <Col key={category.id} lg={4} md={6} className="mb-4">
                                <AnimatedElement animation="slideInUp" delay={index * 100}>
                                    <Card className="category-card social-card">
                                        <div className="category-cover">
                                            <img
                                                src={category.image}
                                                alt={category.name}
                                                className="cover-image"
                                                onError={(e) => {
                                                    e.target.src = defaultImages[0];
                                                }}
                                            />

                                            {/* Overlay avec gradient */}
                                            <div className="category-overlay">
                                                <div className="overlay-content">
                                                    <div className="category-icon">
                                                        <FontAwesomeIcon
                                                            icon={iconMap[category.icon] || faMusic}
                                                            size="2x"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Badges */}
                                            <div className="category-badges">
                                                {category.trending && (
                                                    <Badge bg="warning" className="trending-badge">
                                                        <FontAwesomeIcon icon={faFire} className="me-1" />
                                                        Tendance
                                                    </Badge>
                                                )}
                                                <Badge bg="dark" className="count-badge">
                                                    {formatNumber(category.soundCount)} sons
                                                </Badge>
                                            </div>
                                        </div>

                                        <Card.Body className="category-body">
                                            <div className="category-info">
                                                <h5 className="category-title">{category.name}</h5>
                                                <p className="category-description">
                                                    {category.description || 'Découvrez ce genre musical unique'}
                                                </p>
                                            </div>

                                            <div className="category-stats">
                                                <div className="stat-item">
                                                    <FontAwesomeIcon icon={faMusic} className="stat-icon" />
                                                    <span className="stat-number">{formatNumber(category.soundCount)}</span>
                                                    <span className="stat-label">Sons</span>
                                                </div>
                                                <div className="stat-item">
                                                    <FontAwesomeIcon icon={faHeadphones} className="stat-icon" />
                                                    <span className="stat-number">{formatNumber(category.plays_count || category.soundCount * 150)}</span>
                                                    <span className="stat-label">Écoutes</span>
                                                </div>
                                            </div>

                                            <div className="category-actions">
                                                <Button
                                                    as={Link}
                                                    to={`/category/${category.id}`}
                                                    variant="primary"
                                                    className="explore-btn"
                                                >
                                                    <FontAwesomeIcon icon={faEye} className="me-2" />
                                                    Explorer
                                                </Button>
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    className="action-btn"
                                                >
                                                    <FontAwesomeIcon icon={faShare} />
                                                </Button>
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    className="action-btn"
                                                >
                                                    <FontAwesomeIcon icon={faHeart} />
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </AnimatedElement>
                            </Col>
                        ))}
                    </Row>

                    {filteredCategories.length === 0 && (
                        <div className="text-center py-5">
                            <FontAwesomeIcon icon={faMusic} size="3x" className="text-muted mb-3" />
                            <h5 className="text-muted">Aucun genre trouvé</h5>
                            <p className="text-muted">Modifiez votre recherche pour voir plus de résultats</p>
                        </div>
                    )}
                </div>
            </Container>

            <style jsx>{`
                .social-categories {
                    min-height: 100vh;
                    background: #f8f9fa;
                    padding-top: 80px;
                }

                .categories-header {
                    background: white;
                    border-bottom: 1px solid #e9ecef;
                    margin-bottom: 20px;
                }

                .header-content h1 {
                    color: #333;
                    font-weight: 700;
                }

                .search-container {
                    max-width: 400px;
                    margin-left: auto;
                }

                .search-input {
                    border: none;
                    border-radius: 25px 0 0 25px;
                    padding: 12px 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }

                .search-btn {
                    border-radius: 0 25px 25px 0;
                    border: none;
                    padding: 12px 20px;
                }

                .categories-filters {
                    background: white;
                    padding: 15px 0;
                    border-bottom: 1px solid #e9ecef;
                    margin-bottom: 30px;
                }

                .filter-tabs {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                }

                .filter-btn {
                    border-radius: 20px;
                    padding: 8px 16px;
                    border: 2px solid;
                    transition: all 0.3s ease;
                    font-weight: 600;
                }

                .filter-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }

                .categories-content {
                    padding: 20px 0;
                }

                .category-card {
                    border: none;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                    transition: all 0.4s ease;
                    height: 100%;
                    background: white;
                }

                .category-card:hover {
                    transform: translateY(-10px);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.15);
                }

                .category-cover {
                    position: relative;
                    height: 220px;
                    overflow: hidden;
                }

                .cover-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.4s ease;
                }

                .category-card:hover .cover-image {
                    transform: scale(1.1);
                }

                .category-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(45deg, rgba(102, 126, 234, 0.8), rgba(118, 75, 162, 0.6));
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: all 0.3s ease;
                }

                .category-card:hover .category-overlay {
                    opacity: 1;
                }

                .overlay-content {
                    text-align: center;
                    color: white;
                }

                .category-icon {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto;
                    transform: scale(0.8);
                    transition: all 0.3s ease;
                }

                .category-overlay:hover .category-icon {
                    transform: scale(1);
                }

                .category-badges {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .trending-badge, .count-badge {
                    font-size: 11px;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-weight: 600;
                }

                .category-body {
                    padding: 25px;
                }

                .category-title {
                    font-size: 1.3rem;
                    font-weight: 700;
                    margin-bottom: 10px;
                    color: #333;
                }

                .category-description {
                    color: #666;
                    font-size: 14px;
                    margin-bottom: 20px;
                    line-height: 1.5;
                }

                .category-stats {
                    display: flex;
                    justify-content: space-around;
                    margin-bottom: 20px;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 12px;
                }

                .stat-item {
                    text-align: center;
                }

                .stat-icon {
                    color: #667eea;
                    margin-bottom: 5px;
                    display: block;
                }

                .stat-number {
                    display: block;
                    font-size: 16px;
                    font-weight: 700;
                    color: #333;
                }

                .stat-label {
                    font-size: 12px;
                    color: #666;
                }

                .category-actions {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }

                .explore-btn {
                    flex-grow: 1;
                    border-radius: 25px;
                    font-weight: 600;
                    padding: 10px 20px;
                    border: none;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    transition: all 0.3s ease;
                }

                .explore-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
                }

                .action-btn {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid #e9ecef;
                    transition: all 0.3s ease;
                }

                .action-btn:hover {
                    transform: translateY(-2px);
                    border-color: #667eea;
                    color: #667eea;
                }

                .loading-animation {
                    animation: pulse 1.5s ease-in-out infinite;
                }

                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }

                @media (max-width: 768px) {
                    .header-actions {
                        margin-top: 20px;
                    }

                    .filter-tabs {
                        flex-wrap: wrap;
                        gap: 8px;
                    }

                    .filter-btn {
                        font-size: 12px;
                        padding: 6px 12px;
                    }

                    .category-stats {
                        flex-direction: column;
                        gap: 10px;
                    }
                }
            `}</style>
        </div>
    );
};

export default Categories;
