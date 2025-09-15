import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form, InputGroup, Alert, Tab, Tabs, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
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
    faFire,
    faStar,
    faPlus,
    faSearch,
    faFilter,
    faCalendarAlt,
    faMapMarkerAlt,
    faEuroSign,
    faMicrophone,
    faHeadphones,
    faVolumeUp,
    faRocket,
    faCrown,
    faLightbulb,
    faEye,
    faCheck,
    faChartBar,
    faShare,
    faHeart
} from '@fortawesome/free-solid-svg-icons';
import { AnimatedElement } from '../common/PageTransition';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import CategoryBadge from '../common/CategoryBadge';

const Competitions = () => {
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [sortBy, setSortBy] = useState('created_at');
    const [activeTab, setActiveTab] = useState('all');
    const [categories, setCategories] = useState([]);
    const [pagination, setPagination] = useState(null);

    const { user, isArtist, isProducer, isAdmin, token } = useAuth();
    const toast = useToast();

    useEffect(() => {
        fetchCategories();
        fetchCompetitions();
    }, [activeTab, searchTerm, selectedCategory, selectedStatus, sortBy]);

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/competitions/categories');
            const result = await response.json();
            setCategories(result.categories || []);
        } catch (error) {
            console.error('Erreur lors du chargement des catégories:', error);
        }
    };

    const fetchCompetitions = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (selectedCategory !== 'all') params.append('category', selectedCategory);
            if (selectedStatus !== 'all') params.append('status', selectedStatus);
            if (sortBy) params.append('sort_by', sortBy);

            const endpoint = activeTab === 'upcoming' ? '/api/competitions/upcoming' :
                           activeTab === 'popular' ? '/api/competitions/popular' :
                           '/api/competitions';

            const response = await fetch(`${endpoint}?${params}`);
            const result = await response.json();

            if (response.ok) {
                setCompetitions(result.competitions.data || result.competitions || []);
                setPagination(result.competitions.pagination || null);
            } else {
                throw new Error(result.message || 'Erreur lors du chargement');
            }
        } catch (error) {
            console.error('Erreur:', error);
            toast?.error('Erreur', 'Impossible de charger les compétitions');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (competition) => {
        if (competition.status === 'active') {
            return (
                <Badge className="status-badge status-active">
                    <div className="status-dot"></div>
                    EN DIRECT
                </Badge>
            );
        } else if (competition.status === 'completed') {
            return (
                <Badge className="status-badge status-completed">
                    Terminée
                </Badge>
            );
        } else if (competition.can_register) {
            const spotsLeft = competition.max_participants - competition.current_participants;
            if (spotsLeft <= 5) {
                return (
                    <Badge className="status-badge status-urgent">
                        🔥 {spotsLeft} places restantes
                    </Badge>
                );
            }
            return (
                <Badge className="status-badge status-open">
                    Inscriptions ouvertes
                </Badge>
            );
        } else if (competition.is_full) {
            return (
                <Badge className="status-badge status-full">
                    Complet
                </Badge>
            );
        } else {
            return (
                <Badge className="status-badge status-soon">
                    Bientôt
                </Badge>
            );
        }
    };

    const getUrgencyIndicator = (competition) => {
        if (competition.status === 'active') {
            return (
                <div className="urgency-indicator live">
                    <div className="live-dot"></div>
                    LIVE
                </div>
            );
        }

        const spotsLeft = competition.max_participants - competition.current_participants;
        if (spotsLeft <= 10 && competition.can_register) {
            return (
                <div className="urgency-indicator urgent">
                    {spotsLeft} places restantes
                </div>
            );
        }

        return null;
    };

    const getPrizeAttractiveness = (prizePool) => {
        const amount = parseFloat(prizePool.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        if (amount >= 1000) {
            return 'mega-prize';
        } else if (amount >= 500) {
            return 'big-prize';
        } else if (amount >= 100) {
            return 'good-prize';
        }
        return 'standard-prize';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatTime = (timeString) => {
        return timeString ? timeString.substring(0, 5) : '';
    };

    return (
        <div className="social-competitions">
            {/* Header social */}
            <div className="competitions-header">
                <Container>
                    <Row className="align-items-center py-4">
                        <Col lg={8}>
                            <AnimatedElement animation="slideInLeft" delay={100}>
                                <div className="header-content">
                                    <h1 className="display-6 fw-bold mb-2">
                                        <FontAwesomeIcon icon={faTrophy} className="me-3 text-warning" />
                                        Compétitions Musicales
                                    </h1>
                                    <p className="text-muted mb-0">
                                        Participez, gagnez et devenez la prochaine sensation musicale
                                    </p>
                                    <div className="hero-stats mt-3">
                                        <div className="stat-item">
                                            <span className="stat-number">250K€</span>
                                            <span className="stat-label">distribués</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-number">15K+</span>
                                            <span className="stat-label">participants</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-number">98%</span>
                                            <span className="stat-label">satisfaction</span>
                                        </div>
                                    </div>
                                </div>
                            </AnimatedElement>
                        </Col>
                        <Col lg={4} className="text-end">
                            <AnimatedElement animation="slideInRight" delay={200}>
                                {(isArtist() || isProducer() || isAdmin()) && (
                                    <Button
                                        as={Link}
                                        to="/create-competition"
                                        variant="primary"
                                        size="lg"
                                        className="create-btn"
                                    >
                                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                                        Créer une compétition
                                    </Button>
                                )}
                            </AnimatedElement>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Filtres sociaux */}
            <div className="competitions-filters">
                <Container>
                    <Row className="g-3">
                        <Col lg={4}>
                            <InputGroup className="search-social">
                                <InputGroup.Text>
                                    <FontAwesomeIcon icon={faSearch} />
                                </InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Rechercher une compétition..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="search-input"
                                />
                            </InputGroup>
                        </Col>
                        <Col lg={3}>
                            <Form.Select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="filter-select"
                            >
                                <option value="all">Toutes les catégories</option>
                                {categories.map(cat => (
                                    <option key={cat.name || cat} value={cat.name || cat}>
                                        {cat.name || cat}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col lg={3}>
                            <Form.Select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="filter-select"
                            >
                                <option value="created_at">Plus récentes</option>
                                <option value="start_date">Date de début</option>
                                <option value="prize_pool">Cagnotte</option>
                                <option value="participants">Participants</option>
                            </Form.Select>
                        </Col>
                        <Col lg={2}>
                            <Form.Select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="filter-select"
                            >
                                <option value="all">Tous statuts</option>
                                <option value="published">Ouvertes</option>
                                <option value="active">En cours</option>
                                <option value="completed">Terminées</option>
                            </Form.Select>
                        </Col>
                    </Row>

                    {/* Onglets sociaux */}
                    <Row className="mt-3">
                        <Col>
                            <div className="filter-tabs">
                                <Button
                                    variant={activeTab === 'all' ? 'primary' : 'outline-primary'}
                                    size="sm"
                                    onClick={() => setActiveTab('all')}
                                    className="filter-btn"
                                >
                                    <FontAwesomeIcon icon={faChartBar} className="me-2" />
                                    Toutes
                                </Button>
                                <Button
                                    variant={activeTab === 'upcoming' ? 'primary' : 'outline-primary'}
                                    size="sm"
                                    onClick={() => setActiveTab('upcoming')}
                                    className="filter-btn"
                                >
                                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                                    À venir
                                </Button>
                                <Button
                                    variant={activeTab === 'popular' ? 'primary' : 'outline-primary'}
                                    size="sm"
                                    onClick={() => setActiveTab('popular')}
                                    className="filter-btn"
                                >
                                    <FontAwesomeIcon icon={faFire} className="me-2" />
                                    Populaires
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Contenu principal */}
            <Container>
                <div className="competitions-content">
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3 text-muted">Chargement des compétitions...</p>
                        </div>
                    ) : competitions.length === 0 ? (
                        <Alert variant="info" className="text-center py-5 empty-state">
                            <FontAwesomeIcon icon={faTrophy} size="3x" className="text-muted mb-3" />
                            <h5>Aucune compétition trouvée</h5>
                            <p className="text-muted mb-0">
                                Modifiez vos critères de recherche ou créez une nouvelle compétition
                            </p>
                        </Alert>
                    ) : (
                        <Row className="g-4">
                            {competitions.map((competition, index) => (
                                <Col lg={6} xl={4} key={competition.id}>
                                    <AnimatedElement animation="slideInUp" delay={100 + index * 50}>
                                        <Card className="competition-card social-card">

                                            {getUrgencyIndicator(competition)}

                                            {competition.image_url && (
                                                <div className="card-image-container">
                                                    <Card.Img
                                                        variant="top"
                                                        src={competition.image_url}
                                                        className="card-image"
                                                        onError={(e) => {
                                                            e.target.src = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop';
                                                        }}
                                                    />
                                                    <div className="image-overlay">
                                                        <FontAwesomeIcon icon={faPlay} className="play-icon" />
                                                    </div>
                                                </div>
                                            )}

                                            <Card.Body className="card-body">
                                                <div className="card-header">
                                                    <CategoryBadge category={competition.category} />
                                                    {getStatusBadge(competition)}
                                                </div>

                                                <h5 className="competition-title">{competition.title}</h5>
                                                <p className="competition-description">
                                                    {competition.description.substring(0, 100)}...
                                                </p>

                                                <div className="prize-section">
                                                    <div className="prize-amount">{competition.formatted_total_prize_pool}</div>
                                                    <div className="prize-label">À gagner</div>
                                                </div>

                                                <div className="competition-details">
                                                    <div className="detail-item">
                                                        <FontAwesomeIcon icon={faCalendarAlt} className="detail-icon" size="xs" />
                                                        <span>{formatDate(competition.start_date)}</span>
                                                    </div>

                                                    <div className="detail-item">
                                                        <FontAwesomeIcon icon={faUsers} className="detail-icon" size="xs" />
                                                        <span>{competition.current_participants}/{competition.max_participants} participants</span>
                                                    </div>

                                                    <div className="participants-bar">
                                                        <div
                                                            className="participants-fill"
                                                            style={{
                                                                width: `${(competition.current_participants / competition.max_participants) * 100}%`
                                                            }}
                                                        ></div>
                                                    </div>

                                                    <div className="detail-item">
                                                        <FontAwesomeIcon icon={faCoins} className="detail-icon" size="xs" />
                                                        <span>Inscription: {competition.formatted_entry_fee}</span>
                                                    </div>
                                                </div>

                                                <div className="competition-actions">
                                                    <Button
                                                        as={Link}
                                                        to={`/competitions/${competition.id}`}
                                                        className="join-button"
                                                        size="lg"
                                                    >
                                                        <FontAwesomeIcon icon={faTrophy} className="me-2" />
                                                        Participer
                                                    </Button>
                                                    
                                                    {/* Bouton Démonstration Live */}
                                                    <Button
                                                        as={Link}
                                                        to={`/competitions/${competition.id}/live?demo=true`}
                                                        variant="outline-warning"
                                                        size="sm"
                                                        className="demo-live-btn"
                                                        title="Aperçu Live (Démonstration)"
                                                    >
                                                        <FontAwesomeIcon icon={faEye} className="me-1" />
                                                        Demo Live
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
                    )}
                </div>
            </Container>

            <style jsx>{`
                .social-competitions {
                    min-height: 100vh;
                    background: #f8f9fa;
                    padding-top: 80px;
                }

                .competitions-header {
                    background: white;
                    border-bottom: 1px solid #e9ecef;
                    margin-bottom: 20px;
                }

                .header-content h1 {
                    color: #333;
                    font-weight: 700;
                }

                .hero-stats {
                    display: flex;
                    gap: 2rem;
                }

                .hero-stats .stat-item {
                    text-align: left;
                }

                .hero-stats .stat-number {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #ffc107;
                    display: block;
                }

                .hero-stats .stat-label {
                    font-size: 0.9rem;
                    color: #6c757d;
                    font-weight: 500;
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

                .competitions-filters {
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

                .competitions-content {
                    padding: 20px 0;
                }

                .empty-state {
                    border: none;
                    border-radius: 20px;
                    background: white;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                }

                .competition-card {
                    border: none;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                    transition: all 0.4s ease;
                    background: white;
                    height: 100%;
                    position: relative;
                }

                .competition-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.15);
                }

                .urgency-indicator {
                    position: absolute;
                    top: 15px;
                    left: 15px;
                    z-index: 10;
                    padding: 6px 12px;
                    border-radius: 15px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: white;
                    animation: subtle-pulse 3s ease-in-out infinite;
                }

                .urgency-indicator.live {
                    background: #ef4444;
                }

                .urgency-indicator.urgent {
                    background: #f59e0b;
                }

                @keyframes subtle-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.8; }
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

                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }

                .card-image-container {
                    position: relative;
                    overflow: hidden;
                }

                .card-image {
                    height: 220px;
                    object-fit: cover;
                    width: 100%;
                    transition: transform 0.3s ease;
                }

                .image-overlay {
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
                    transition: opacity 0.3s ease;
                }

                .competition-card:hover .card-image {
                    transform: scale(1.05);
                }

                .competition-card:hover .image-overlay {
                    opacity: 1;
                }

                .play-icon {
                    font-size: 2.5rem;
                    color: white;
                }

                .card-body {
                    padding: 25px;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }

                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .competition-title {
                    font-size: 1.3rem;
                    font-weight: 700;
                    margin-bottom: 12px;
                    color: #333;
                    line-height: 1.3;
                }

                .competition-description {
                    color: #666;
                    font-size: 0.9rem;
                    margin-bottom: 20px;
                    line-height: 1.5;
                }

                .prize-section {
                    background: linear-gradient(135deg, #fff3cd, #ffeaa7);
                    padding: 20px;
                    border-radius: 15px;
                    text-align: center;
                    margin-bottom: 20px;
                    border: 1px solid #ffeb9c;
                }

                .prize-amount {
                    font-size: 1.8rem;
                    font-weight: 800;
                    color: #d4a574;
                    margin-bottom: 4px;
                }

                .prize-label {
                    font-size: 0.8rem;
                    color: #856404;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .competition-details {
                    margin-bottom: 25px;
                    flex-grow: 1;
                }

                .detail-item {
                    display: flex;
                    align-items: center;
                    margin-bottom: 10px;
                    font-size: 0.9rem;
                    color: #666;
                }

                .detail-icon {
                    width: 18px;
                    margin-right: 10px;
                    color: #667eea;
                }

                .participants-bar {
                    width: 100%;
                    height: 6px;
                    background: #e9ecef;
                    border-radius: 3px;
                    overflow: hidden;
                    margin-bottom: 15px;
                }

                .participants-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #667eea, #764ba2);
                    border-radius: 3px;
                    transition: width 0.5s ease;
                }

                .competition-actions {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    margin-top: auto;
                }

                .join-button {
                    flex-grow: 1;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    border: none;
                    color: white;
                    font-weight: 600;
                    padding: 12px 20px;
                    border-radius: 25px;
                    transition: all 0.3s ease;
                }

                .join-button:hover {
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

                .demo-live-btn {
                    background: transparent;
                    border: 2px solid #ffc107;
                    color: #ffc107;
                    font-weight: 600;
                    border-radius: 20px;
                    transition: all 0.3s ease;
                    padding: 8px 16px;
                    font-size: 0.8rem;
                    flex-shrink: 0;
                }

                .demo-live-btn:hover {
                    background: #ffc107;
                    color: white;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3);
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

                .status-soon {
                    background: #3b82f6;
                    color: white;
                }

                .status-completed {
                    background: #6b7280;
                    color: white;
                }

                @keyframes urgent-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }

                .status-dot {
                    width: 6px;
                    height: 6px;
                    background: white;
                    border-radius: 50%;
                    animation: blink 1s ease-in-out infinite;
                }

                @media (max-width: 768px) {
                    .hero-stats {
                        flex-direction: column;
                        gap: 1rem;
                    }

                    .filter-tabs {
                        flex-wrap: wrap;
                        gap: 8px;
                    }

                    .filter-btn {
                        font-size: 12px;
                        padding: 6px 12px;
                    }

                    .prize-amount {
                        font-size: 1.5rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default Competitions;
