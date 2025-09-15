import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Form, Tab, Tabs, Table, Alert } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendarAlt,
    faMapMarkerAlt,
    faTicketAlt,
    faUsers,
    faStar,
    faMusic,
    faClock,
    faArrowLeft,
    faShoppingCart,
    faShare,
    faHeart,
    faInfoCircle,
    faCheckCircle,
    faCrown,
    faCouch,
    faEye,
    faDownload,
    faChartLine,
    faEdit,
    faTrash,
    faCopy,
    faQrcode,
    faEnvelope,
    faPhone,
    faPlus,
    faMinus
} from '@fortawesome/free-solid-svg-icons';
import LoadingScreen from '../common/LoadingScreen';
import { AnimatedElement } from '../common/PageTransition';
import FloatingActionButton from '../common/FloatingActionButton';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const EventDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState(null);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [ticketQuantities, setTicketQuantities] = useState({});
    const [isFavorite, setIsFavorite] = useState(false);

    const { addToCart } = useCart();
    const toast = useToast();
    const { token, user } = useAuth();

    useEffect(() => {
        loadEvent();
    }, [id]);

    const loadEvent = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/events/${id}`);
            const data = await response.json();

            if (data.success) {
                const eventData = data.event;

                const adaptedEvent = {
                    ...eventData,
                    // S'assurer que les URLs d'images sont correctes
                    poster_image_url: eventData.poster_image ? `/storage/${eventData.poster_image}` : null,
                    // Décoder les artistes et sponsors depuis JSON si ils existent
                    artists_array: eventData.artists ? (
                        typeof eventData.artists === 'string' ? JSON.parse(eventData.artists) : eventData.artists
                    ) : [],
                    sponsors_array: eventData.sponsors ? (
                        typeof eventData.sponsors === 'string' ? JSON.parse(eventData.sponsors) : eventData.sponsors
                    ) : [],
                    // Décoder les images de galerie si elles existent
                    gallery_images_array: eventData.gallery_images ? (
                        typeof eventData.gallery_images === 'string' ? JSON.parse(eventData.gallery_images) : eventData.gallery_images
                    ) : [],
                    // Calculer le nombre de places restantes
                    remaining_spots: (eventData.max_attendees || 0) - (eventData.current_attendees || 0)
                };

                setEvent(adaptedEvent);

                // Vérifier si l'événement est en favoris
                if (token) {
                    checkFavoriteStatus(id);
                }
            } else {
                toast.error('Erreur', data.message || 'Événement non trouvé');
                navigate('/events');
            }
        } catch (error) {
            console.error('Erreur lors du chargement de l\'événement:', error);
            toast.error('Erreur', 'Erreur de connexion au serveur');
            navigate('/events');
        } finally {
            setLoading(false);
        }
    };

    const checkFavoriteStatus = async (eventId) => {
        try {
            const response = await fetch(`/api/events/${eventId}/favorite`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setIsFavorite(data.is_favorite);
            }
        } catch (error) {
            console.error('Erreur lors de la vérification des favoris:', error);
        }
    };

    const handleToggleFavorite = async () => {
        if (!token) {
            toast.warning('Connexion requise', 'Vous devez être connecté pour ajouter aux favoris');
            return;
        }

        try {
            const response = await fetch(`/api/events/${event.id}/favorite`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setIsFavorite(data.is_favorite);
                toast.success(
                    'Favoris',
                    data.is_favorite ? 'Événement ajouté aux favoris' : 'Événement retiré des favoris'
                );
            } else {
                toast.error('Erreur', 'Impossible de modifier les favoris');
            }
        } catch (error) {
            console.error('Erreur lors de la modification des favoris:', error);
            toast.error('Erreur', 'Erreur de connexion');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-CM', {
            style: 'currency',
            currency: 'XAF',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const handleTicketQuantityChange = (ticketType, change) => {
        const currentQuantity = ticketQuantities[ticketType] || 0;
        const newQuantity = Math.max(0, currentQuantity + change);

        setTicketQuantities(prev => ({
            ...prev,
            [ticketType]: newQuantity
        }));
    };

    const openTicketModal = () => {
        setShowTicketModal(true);
    };

    const closeTicketModal = () => {
        setShowTicketModal(false);
        setTicketQuantities({});
    };

    const handleAddToCart = () => {
        if (!token) {
            toast.warning('Connexion requise', 'Vous devez être connecté pour acheter des billets');
            return;
        }

        if (!event) return;

        // Pour les événements payants, ajouter un billet standard
        if (!event.is_free && event.ticket_price) {
            const cartItem = {
                id: event.id,
                type: 'event',
                title: event.title,
                artist: event.artists_array?.[0] || 'Event',
                event_date: event.event_date,
                venue: event.venue,
                city: event.city,
                ticket_type: 'Standard',
                ticket_price: event.ticket_price,
                price: event.ticket_price,
                quantity: 1,
                poster: event.poster_image_url,
                max_attendees: event.max_attendees
            };

            addToCart(cartItem);

            toast.cart(
                'Billet ajouté au panier',
                `Billet pour "${event.title}" ajouté au panier`
            );
        }

        closeTicketModal();
    };

    if (loading) {
        return <LoadingScreen />;
    }

    if (!event) {
        return (
            <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center avoid-header-overlap">
                <div className="text-center">
                    <h3>Événement non trouvé</h3>
                    <Button as={Link} to="/events" variant="primary">
                        Retour aux événements
                    </Button>
                </div>
            </div>
        );
    }

    const renderOverview = () => (
        <Row className="g-4">
            <Col lg={8}>
                {/* Informations principales */}
                <Card className="border-0 shadow-sm mb-4">
                    <Card.Body>
                        <Row>
                            <Col md={4}>
                                <img
                                    src={event.poster_image_url || event.featured_image || `https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&h=300&fit=crop`}
                                    alt={event.title}
                                    className="img-fluid rounded"
                                    style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                                />
                            </Col>
                            <Col md={8}>
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <Badge bg={event.status === 'active' ? 'success' : 'secondary'} className="mb-2">
                                            {event.status === 'active' ? 'Actif' :
                                             event.status === 'published' ? 'Publié' :
                                             event.status === 'pending' ? 'En attente' : 'Brouillon'}
                                        </Badge>
                                        <h4 className="fw-bold">{event.title}</h4>
                                        <p className="text-muted">{event.description}</p>
                                    </div>
                                    {user && user.id === event.user_id && (
                                    <div className="d-flex gap-2">
                                        <Button variant="outline-primary" size="sm">
                                            <FontAwesomeIcon icon={faEdit} />
                                        </Button>
                                        <Button variant="outline-secondary" size="sm">
                                            <FontAwesomeIcon icon={faCopy} />
                                        </Button>
                                    </div>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <div className="d-flex align-items-center mb-2">
                                        <FontAwesomeIcon icon={faCalendarAlt} className="text-primary me-2" />
                                        <span>{formatDate(event.event_date)} à {event.start_time}</span>
                                    </div>
                                    {event.end_time && (
                                        <div className="d-flex align-items-center mb-2">
                                            <FontAwesomeIcon icon={faClock} className="text-primary me-2" />
                                            <span>Fin prévue : {event.end_time}</span>
                                        </div>
                                    )}
                                    <div className="d-flex align-items-center mb-2">
                                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-primary me-2" />
                                        <span>{event.venue || event.location}</span>
                                    </div>
                                    {event.address && (
                                        <div className="d-flex align-items-center">
                                            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-muted me-2" />
                                            <span className="text-muted small">{event.address}, {event.city}</span>
                                        </div>
                                    )}
                                </div>

                                {event.artist && (
                                    <div className="mb-3">
                                        <h6 className="fw-bold mb-2">Artiste principal</h6>
                                        <Badge bg="primary">{event.artist}</Badge>
                                    </div>
                                )}

                                {event.artists_array && event.artists_array.length > 0 && (
                                    <div className="mb-3">
                                        <h6 className="fw-bold mb-2">Artistes participants</h6>
                                        <div className="d-flex flex-wrap gap-2">
                                            {event.artists_array.map((artist, index) => (
                                                <Badge key={index} bg="primary" text="white">{artist}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {event.sponsors_array && event.sponsors_array.length > 0 && (
                                    <div className="mb-3">
                                        <h6 className="fw-bold mb-2">Sponsors</h6>
                                        <div className="d-flex flex-wrap gap-2">
                                            {event.sponsors_array.map((sponsor, index) => (
                                                <Badge key={index} bg="warning" text="dark">{sponsor}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Description complète */}
                {event.description && (
                <Card className="border-0 shadow-sm mb-4">
                    <Card.Body>
                            <h5 className="fw-bold mb-3">
                                <FontAwesomeIcon icon={faInfoCircle} className="me-2 text-primary" />
                                À propos de l'événement
                            </h5>
                            <p className="text-muted" style={{ lineHeight: '1.6' }}>
                                {event.description}
                            </p>
                    </Card.Body>
                </Card>
                )}

                {/* Galerie d'images */}
                {event.gallery_images_array && event.gallery_images_array.length > 0 && (
                    <Card className="border-0 shadow-sm mb-4">
                    <Card.Body>
                            <h5 className="fw-bold mb-3">
                                <FontAwesomeIcon icon={faEye} className="me-2 text-primary" />
                                Galerie
                            </h5>
                            <Row className="g-3">
                                {event.gallery_images_array.map((image, index) => (
                                    <Col md={4} key={index}>
                                        <img
                                            src={`/storage/${image}`}
                                            alt={`${event.title} - Image ${index + 1}`}
                                            className="img-fluid rounded"
                                            style={{ height: '150px', width: '100%', objectFit: 'cover' }}
                                        />
                                    </Col>
                                ))}
                            </Row>
                    </Card.Body>
                </Card>
                )}
            </Col>

            <Col lg={4}>
                {/* Actions rapides */}
                <Card className="border-0 shadow-sm mb-4">
                    <Card.Body>
                        <h5 className="fw-bold mb-3">Actions</h5>
                        <div className="d-grid gap-2">
                            {!event.is_free && event.ticket_price && (
                                <Button variant="primary" onClick={openTicketModal}>
                                    <FontAwesomeIcon icon={faTicketAlt} className="me-2" />
                                    Acheter des billets
                                </Button>
                            )}
                            <Button variant="outline-danger" onClick={handleToggleFavorite}>
                                <FontAwesomeIcon icon={faHeart} className="me-2" />
                                {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                            </Button>
                            <Button variant="outline-secondary">
                                <FontAwesomeIcon icon={faShare} className="me-2" />
                                Partager
                            </Button>
                        </div>
                    </Card.Body>
                </Card>

                {/* Informations de prix */}
                <Card className="border-0 shadow-sm mb-4">
                    <Card.Body>
                        <h5 className="fw-bold mb-3">Tarification</h5>
                        {event.is_free ? (
                            <div className="text-center py-3">
                                <h3 className="text-success fw-bold">Gratuit</h3>
                                <p className="text-muted mb-0">Entrée libre</p>
                            </div>
                        ) : (
                        <div className="text-center">
                                <div className="fw-bold text-primary fs-4 mb-2">
                                    {formatCurrency(event.ticket_price)}
                                </div>
                                <small className="text-muted">
                                    Billet Standard
                                </small>
                            </div>
                        )}
                    </Card.Body>
                </Card>

                {/* Informations de contact */}
                {(event.contact_email || event.contact_phone) && (
                <Card className="border-0 shadow-sm mb-4">
                    <Card.Body>
                            <h5 className="fw-bold mb-3">Contact</h5>
                            {event.contact_email && (
                                <div className="d-flex align-items-center mb-2">
                                    <FontAwesomeIcon icon={faEnvelope} className="text-primary me-2" />
                                    <a href={`mailto:${event.contact_email}`} className="text-decoration-none">
                                        {event.contact_email}
                                    </a>
                                        </div>
                            )}
                            {event.contact_phone && (
                                <div className="d-flex align-items-center">
                                    <FontAwesomeIcon icon={faPhone} className="text-primary me-2" />
                                    <a href={`tel:${event.contact_phone}`} className="text-decoration-none">
                                        {event.contact_phone}
                                    </a>
                                        </div>
                            )}
                    </Card.Body>
                </Card>
                )}

                {/* Statistiques */}
                <Card className="border-0 shadow-sm">
                    <Card.Body>
                        <h5 className="fw-bold mb-3">Statistiques</h5>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-muted">Vues</span>
                            <span className="fw-bold">{event.views_count || 0}</span>
                        </div>
                        {(event.max_attendees || event.capacity) && (
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="text-muted">Capacité</span>
                                <span className="fw-bold">{event.max_attendees || event.capacity}</span>
                            </div>
                        )}
                        {event.current_attendees !== undefined && (
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="text-muted">Participants</span>
                                <span className="fw-bold">{event.current_attendees}</span>
                            </div>
                        )}
                        {event.remaining_spots !== undefined && (
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="text-muted">Places restantes</span>
                                <span className="fw-bold text-success">{Math.max(0, event.remaining_spots)}</span>
                            </div>
                        )}
                        <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted">Catégorie</span>
                            <Badge bg="secondary">{event.category}</Badge>
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );

    return (
        <div className="min-vh-100 bg-light avoid-header-overlap">
            <Container className="py-4">
                <AnimatedElement animation="slideInLeft" delay={100}>
                    <div className="bg-white border-bottom">
                        <Container>
                            <div className="py-3">
                                <div className="d-flex align-items-center">
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={() => navigate('/events')}
                                        className="me-3"
                                    >
                                        <FontAwesomeIcon icon={faArrowLeft} />
                                    </Button>
                                    <div>
                                        <h1 className="h4 fw-bold mb-1">{event.title}</h1>
                                        <p className="text-muted mb-0">
                                            {formatDate(event.event_date)} • {event.venue || event.location}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Container>
                    </div>
                </AnimatedElement>

                <Tabs
                    activeKey={activeTab}
                    onSelect={(k) => setActiveTab(k)}
                    className="mb-4"
                >
                    <Tab eventKey="overview" title="Vue d'ensemble">
                        <AnimatedElement animation="fadeIn" delay={100}>
                            {renderOverview()}
                        </AnimatedElement>
                    </Tab>
                </Tabs>
            </Container>

            {/* Modal de billets */}
            <Modal show={showTicketModal} onHide={closeTicketModal} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Acheter des billets - {event?.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {event && (
                        <div>
                            <div className="mb-4">
                                <h6 className="fw-bold mb-2">Détails de l'événement</h6>
                                <div className="d-flex gap-3 small text-muted">
                                    <span>
                                        <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                                        {formatDate(event.event_date)}
                                    </span>
                                    <span>
                                        <FontAwesomeIcon icon={faClock} className="me-1" />
                                        {event.start_time}
                                    </span>
                                    <span>
                                        <FontAwesomeIcon icon={faMapMarkerAlt} className="me-1" />
                                        {event.venue || event.location}
                                    </span>
                                </div>
                            </div>

                            <h6 className="fw-bold mb-3">Billet disponible</h6>
                            {!event.is_free && event.ticket_price ? (
                                <div className="border rounded p-3 mb-3">
                                    <Row className="align-items-center">
                                        <Col md={6}>
                                            <h6 className="fw-bold mb-1">Billet Standard</h6>
                                            <div className="text-primary fw-bold fs-5">
                                                {formatCurrency(event.ticket_price)}
                                            </div>
                                            <small className="text-muted">
                                                {event.remaining_spots > 0 ?
                                                    `${event.remaining_spots} places disponibles` :
                                                    'Places limitées'
                                                }
                                            </small>
                                        </Col>
                                        <Col md={6} className="text-end">
                                            <Button
                                                variant="primary"
                                                onClick={handleAddToCart}
                                                disabled={event.remaining_spots <= 0}
                                            >
                                                <FontAwesomeIcon icon={faShoppingCart} className="me-2" />
                                                Ajouter au panier
                                            </Button>
                                        </Col>
                                    </Row>
                                </div>
                            ) : (
                                <div className="text-center py-3">
                                    <p className="text-muted">
                                        {event.is_free ?
                                            "Cet événement est gratuit" :
                                            "Billets non disponibles pour le moment"
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeTicketModal}>
                        Fermer
                    </Button>
                </Modal.Footer>
            </Modal>

            <FloatingActionButton />
        </div>
    );
};

export default EventDetails;
