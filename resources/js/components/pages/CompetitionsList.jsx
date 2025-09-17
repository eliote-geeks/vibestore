import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form, InputGroup, Alert, Tab, Tabs, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTrophy,
    faUsers,
    faCoins,
    faCalendarAlt,
    faClock,
    faPlus,
    faSearch,
    faFilter,
    faFire,
    faStar,
    faTicketAlt,
    faMapMarkerAlt,
    faChartBar
} from '@fortawesome/free-solid-svg-icons';
import { AnimatedElement } from '../common/PageTransition';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import CategoryBadge from '../common/CategoryBadge';

const CompetitionsList = () => {
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [sortBy, setSortBy] = useState('created_at');
    const [activeTab, setActiveTab] = useState('all');
    const [categories, setCategories] = useState([]);

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
            return <Badge bg="success">En cours</Badge>;
        } else if (competition.status === 'completed') {
            return <Badge bg="secondary">Terminée</Badge>;
        } else if (competition.can_register) {
            return <Badge bg="primary">Inscriptions ouvertes</Badge>;
        } else if (competition.is_full) {
            return <Badge bg="warning">Complet</Badge>;
        } else {
            return <Badge bg="info">Prochainement</Badge>;
        }
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
        <div className="min-vh-100 bg-light avoid-header-overlap">
            {/* Header */}
            <div className="bg-gradient-primary text-white py-5">
                <Container>
                    <Row className="align-items-center">
                        <Col lg={8}>
                            <AnimatedElement animation="slideInLeft" delay={100}>
                                <h1 className="display-5 fw-bold mb-3">
                                    <FontAwesomeIcon icon={faTrophy} className="me-3" />
                                    Compétitions Musicales
                                </h1>
                                <p className="lead mb-0">
                                    Participez aux compétitions les plus excitantes et montrez votre talent !
                                </p>
                            </AnimatedElement>
                        </Col>
                        <Col lg={4} className="text-end">
                            <AnimatedElement animation="slideInRight" delay={200}>
                                {(isArtist() || isProducer() || isAdmin()) && (
                                    <Button
                                        as={Link}
                                        to="/create-competition"
                                        variant="light"
                                        size="lg"
                                        className="fw-bold"
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

            <Container className="py-4">
                {/* Filtres et recherche */}
                <AnimatedElement animation="slideInUp" delay={300}>
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Body>
                            <Row className="g-3">
                                <Col lg={4}>
                                    <InputGroup>
                                        <InputGroup.Text>
                                            <FontAwesomeIcon icon={faSearch} />
                                        </InputGroup.Text>
                                        <Form.Control
                                            type="text"
                                            placeholder="Rechercher une compétition..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </InputGroup>
                                </Col>
                                <Col lg={3}>
                                    <Form.Select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
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
                                    >
                                        <option value="all">Tous statuts</option>
                                        <option value="published">Ouvertes</option>
                                        <option value="active">En cours</option>
                                        <option value="completed">Terminées</option>
                                    </Form.Select>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </AnimatedElement>

                {/* Onglets */}
                <AnimatedElement animation="slideInUp" delay={400}>
                    <Tabs
                        activeKey={activeTab}
                        onSelect={(k) => setActiveTab(k)}
                        className="mb-4"
                    >
                        <Tab eventKey="all" title="Toutes" />
                        <Tab eventKey="upcoming" title="À venir" />
                        <Tab eventKey="popular" title="Populaires" />
                    </Tabs>
                </AnimatedElement>

                {/* Liste des compétitions */}
                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-3 text-muted">Chargement des compétitions...</p>
                    </div>
                ) : competitions.length === 0 ? (
                    <Alert variant="info" className="text-center py-5">
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
                                <AnimatedElement animation="slideInUp" delay={500 + index * 50}>
                                    <Card className="h-100 border-0 shadow-sm competition-card">
                                        {competition.image_url && (
                                            <Card.Img
                                                variant="top"
                                                src={competition.image_url}
                                                style={{ height: '200px', objectFit: 'cover' }}
                                            />
                                        )}
                                        <Card.Body className="d-flex flex-column">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <CategoryBadge category={competition.category} />
                                                {getStatusBadge(competition)}
                                            </div>

                                            <h5 className="fw-bold mb-2">{competition.title}</h5>
                                            <p className="text-muted small mb-3 flex-grow-1">
                                                {competition.description.substring(0, 100)}...
                                            </p>

                                            <div className="competition-details mb-3">
                                                <div className="d-flex align-items-center mb-2">
                                                    <FontAwesomeIcon icon={faCalendarAlt} className="text-primary me-2" />
                                                    <small>
                                                        {formatDate(competition.start_date)} à {formatTime(competition.start_time)}
                                                    </small>
                                                </div>
                                                <div className="d-flex align-items-center mb-2">
                                                    <FontAwesomeIcon icon={faUsers} className="text-success me-2" />
                                                    <small>
                                                        {competition.current_participants}/{competition.max_participants} participants
                                                    </small>
                                                </div>
                                                <div className="d-flex align-items-center mb-2">
                                                    <FontAwesomeIcon icon={faCoins} className="text-warning me-2" />
                                                    <small>
                                                        Inscription: {competition.formatted_entry_fee}
                                                    </small>
                                                </div>
                                                <div className="d-flex align-items-center">
                                                    <FontAwesomeIcon icon={faTrophy} className="text-info me-2" />
                                                    <small>
                                                        Cagnotte: {competition.formatted_total_prize_pool}
                                                    </small>
                                                </div>
                                            </div>

                                            <div className="mt-auto">
                                                <Button
                                                    as={Link}
                                                    to={`/competitions/${competition.id}`}
                                                    variant="primary"
                                                    size="sm"
                                                    className="w-100"
                                                >
                                                    Voir les détails
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </AnimatedElement>
                            </Col>
                        ))}
                    </Row>
                )}
            </Container>

            <style jsx>{`
                .bg-gradient-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }

                .competition-card {
                    transition: all 0.3s ease;
                    cursor: pointer;
                }

                .competition-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                }

                .competition-details small {
                    font-size: 0.85rem;
                }

                .tab-content {
                    border: none;
                }

                .nav-tabs .nav-link {
                    border: none;
                    color: #6c757d;
                    font-weight: 500;
                }

                .nav-tabs .nav-link.active {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 8px;
                }

                @media (max-width: 768px) {
                    .display-5 {
                        font-size: 2rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default CompetitionsList;
