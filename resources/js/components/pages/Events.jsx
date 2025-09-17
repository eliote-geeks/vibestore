import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Modal, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendarAlt, faMapMarkerAlt, faTicketAlt, faUsers, faSearch,
    faClock, faShoppingCart, faEye, faHeart, faShare
} from '@fortawesome/free-solid-svg-icons';
import LoadingScreen from '../common/LoadingScreen';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const Events = () => {
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedCity, setSelectedCity] = useState('all');
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [categories, setCategories] = useState(['Tous']);
    const [cities, setCities] = useState(['Toutes']);

    const cameroonCities = [
        'Toutes', 'Yaoundé', 'Douala', 'Bamenda', 'Bafoussam', 'Garoua',
        'Maroua', 'Ngaoundéré', 'Bertoua', 'Kribi', 'Limbe', 'Buea'
    ];

    const { addToCart } = useCart();
    const toast = useToast();
    const { token } = useAuth();

    useEffect(() => {
        loadEvents();
    }, []);

    useEffect(() => {
        filterEvents();
    }, [events, searchQuery, selectedCategory, selectedCity]);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/events');
            const data = await response.json();

            const eventsData = Array.isArray(data) ? data : (data?.events || []);
            const adaptedEvents = eventsData.map(event => ({
                    ...event,
                    poster_image_url: event.poster_image ? `/storage/${event.poster_image}` : null,
                    artists_array: event.artists ? (
                        typeof event.artists === 'string' ? JSON.parse(event.artists) : event.artists
                    ) : [],
                    remaining_spots: (event.max_attendees || 0) - (event.current_attendees || 0)
                }));

                setEvents(adaptedEvents);

            const uniqueCategories = ['Tous', ...new Set(eventsData.map(event => event.category).filter(Boolean))];
            const existingCities = new Set(eventsData.map(event => event.city).filter(Boolean));
            const allCities = [...new Set([...cameroonCities, ...existingCities])];

            setCategories(uniqueCategories);
            setCities(allCities);

        } catch (error) {
            console.error('Erreur lors du chargement des événements:', error);
            toast.error('Erreur', 'Erreur de connexion au serveur');
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const filterEvents = () => {
        let filtered = events;

        if (searchQuery) {
            filtered = filtered.filter(event =>
                event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (event.artists_array && event.artists_array.some(artist =>
                    artist.toLowerCase().includes(searchQuery.toLowerCase())
                )) ||
                event.venue?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.city?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (selectedCategory !== 'all' && selectedCategory !== 'Tous') {
            filtered = filtered.filter(event => event.category === selectedCategory);
        }

        if (selectedCity !== 'all' && selectedCity !== 'Toutes') {
            filtered = filtered.filter(event => event.city === selectedCity);
        }

        filtered = filtered.filter(event =>
            event.status === 'published' &&
            new Date(event.event_date) >= new Date().setHours(0, 0, 0, 0)
        );

        setFilteredEvents(filtered);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            weekday: 'short'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-CM', {
            style: 'currency',
            currency: 'XAF',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getLowestPrice = (event) => {
        if (event.is_free) return 0;
        if (event.ticket_price) return event.ticket_price;
        if (event.price_min) return event.price_min;
        return 0;
    };

    const openTicketModal = (event) => {
        setSelectedEvent(event);
        setShowTicketModal(true);
    };

    const closeTicketModal = () => {
        setShowTicketModal(false);
        setSelectedEvent(null);
    };

    const handleAddToCart = () => {
        if (!token) {
            toast.warning('Connexion requise', 'Vous devez être connecté pour acheter des billets');
            return;
        }

        if (!selectedEvent || selectedEvent.is_free) return;

            const cartItem = {
                id: selectedEvent.id,
                type: 'event',
                title: selectedEvent.title,
                artist: selectedEvent.artists_array?.[0] || 'Event',
                event_date: selectedEvent.event_date,
                venue: selectedEvent.venue,
                city: selectedEvent.city,
                ticket_type: 'Standard',
                ticket_price: selectedEvent.ticket_price,
                price: selectedEvent.ticket_price,
                quantity: 1,
                poster: selectedEvent.poster_image_url,
                max_attendees: selectedEvent.max_attendees
            };

            addToCart(cartItem);
        toast.success('Billet ajouté au panier', `Billet pour "${selectedEvent.title}" ajouté au panier`);
        closeTicketModal();
    };

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="events-social-feed">
            {/* Header de recherche */}
            <div className="events-header">
                <Container>
                    <Row className="py-4">
                        <Col md={8} className="mx-auto text-center">
                            <h2 className="fw-bold mb-3">
                                Événements <span className="text-warning">musicaux</span>
                            </h2>
                            <p className="text-muted mb-4">
                                Découvrez les meilleurs événements musicaux du Cameroun
                            </p>
                            <InputGroup size="lg" className="mb-4">
                                        <Form.Control
                                            type="text"
                                            placeholder="Rechercher des événements..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                    className="border-0 shadow-sm"
                                    style={{ borderRadius: '25px 0 0 25px' }}
                                />
                                <Button
                                    variant="warning"
                                    style={{ borderRadius: '0 25px 25px 0' }}
                                >
                                    <FontAwesomeIcon icon={faSearch} />
                                </Button>
                                    </InputGroup>

                            {/* Filtres simples */}
                            <Row className="g-2 justify-content-center">
                                <Col md={4}>
                                    <Form.Select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="border-0 shadow-sm"
                                    >
                                        {categories.map(category => (
                                            <option
                                                key={category}
                                                value={category === 'Tous' ? 'all' : category}
                                            >
                                                {category}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col md={4}>
                                    <Form.Select
                                        value={selectedCity}
                                        onChange={(e) => setSelectedCity(e.target.value)}
                                        className="border-0 shadow-sm"
                                    >
                                        {cities.map(city => (
                                            <option
                                                key={city}
                                                value={city === 'Toutes' ? 'all' : city}
                                            >
                                                {city}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Feed des événements */}
            <Container className="py-4" style={{ maxWidth: '800px' }}>
                {filteredEvents.length === 0 ? (
                    <div className="text-center py-5">
                        <FontAwesomeIcon icon={faCalendarAlt} size="3x" className="text-muted mb-3" />
                        <h4 className="text-muted">Aucun événement trouvé</h4>
                        <p className="text-secondary">Essayez de modifier vos critères de recherche</p>
                    </div>
                ) : (
                    <div className="events-feed">
                                {filteredEvents.map((event, index) => (
                            <Card key={event.id} className="event-post border-0 shadow-sm mb-4">
                                <Card.Body className="p-4">
                                    <Row className="align-items-center">
                                        {/* Date */}
                                        <Col xs={3} md={2}>
                                            <div className="event-date-badge">
                                                <div className="date-day">{new Date(event.event_date).getDate()}</div>
                                                <div className="date-month">{formatTime(event.event_date)}</div>
                                                <div className="date-month">{new Date(event.event_date).toLocaleDateString('fr-FR', { month: 'short' })}</div>
                                            </div>
                                        </Col>

                                        {/* Informations principales */}
                                        <Col xs={6} md={7}>
                                            <div className="event-info">
                                                <h5 className="fw-bold mb-2">{event.title}</h5>

                                                {event.artists_array && event.artists_array.length > 0 && (
                                                    <p className="text-muted mb-2">
                                                        <FontAwesomeIcon icon={faUsers} className="me-2" />
                                                        {event.artists_array.slice(0, 2).join(', ')}
                                                        {event.artists_array.length > 2 ? '...' : ''}
                                                    </p>
                                                )}

                                                <div className="event-details">
                                                    <div className="detail-item">
                                                        <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2 text-warning" />
                                                        <span>{event.venue}, {event.city}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <FontAwesomeIcon icon={faClock} className="me-2 text-warning" />
                                                        <span>{event.start_time || 'Heure à confirmer'}</span>
                                                    </div>
                                                </div>

                                                {event.description && (
                                                    <p className="text-muted small mt-2">
                                                        {event.description.substring(0, 100)}...
                                                    </p>
                                                )}
                                            </div>
                                        </Col>

                                        {/* Prix et actions */}
                                        <Col xs={3} md={3} className="text-end">
                                            <div className="event-price mb-3">
                                                {event.is_free ? (
                                                    <div className="price-free">
                                                        <span className="fw-bold text-success">Gratuit</span>
                                                    </div>
                                                ) : (
                                                    <div className="price-paid">
                                                        <div className="price-amount fw-bold text-warning">
                                                            {formatCurrency(getLowestPrice(event))}
                                                        </div>
                                                        <small className="text-muted">À partir de</small>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="event-actions d-flex flex-column gap-2">
                                                <Button
                                                    as={Link}
                                                    to={`/events/${event.id}`}
                                                    variant="outline-warning"
                                                    size="sm"
                                                    className="rounded-pill"
                                                >
                                                    <FontAwesomeIcon icon={faEye} className="me-1" />
                                                    Détails
                                                </Button>

                                                {!event.is_free && (
                                                    <Button
                                                        variant="warning"
                                                        size="sm"
                                                        onClick={() => openTicketModal(event)}
                                                        className="rounded-pill"
                                                    >
                                                        <FontAwesomeIcon icon={faTicketAlt} className="me-1" />
                                                        Billets
                                                    </Button>
                                                )}
                                            </div>
                                        </Col>
                                    </Row>

                                    {/* Actions sociales */}
                                    <Row className="mt-3 pt-3 border-top">
                                        <Col>
                                            <div className="social-actions d-flex justify-content-around">
                                                <Button variant="link" className="text-muted social-btn">
                                                    <FontAwesomeIcon icon={faHeart} className="me-1" />
                                                    J'aime
                                                </Button>
                                                <Button variant="link" className="text-muted social-btn">
                                                    <FontAwesomeIcon icon={faShare} className="me-1" />
                                                    Partager
                                                </Button>
                                                <Button variant="link" className="text-muted social-btn">
                                                    <FontAwesomeIcon icon={faUsers} className="me-1" />
                                                    {event.current_attendees || 0} intéressé(s)
                                                </Button>
                                            </div>
                                    </Col>
                            </Row>
                                </Card.Body>
                            </Card>
                                ))}
                            </div>
                )}
            </Container>

            {/* Modal de billets */}
            <Modal show={showTicketModal} onHide={closeTicketModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Billets - {selectedEvent?.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedEvent && (
                        <div>
                            <div className="mb-4">
                                <h6 className="fw-bold mb-2">Détails de l'événement</h6>
                                <div className="d-flex gap-3 small text-muted">
                                    <span>
                                        <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                                        {formatDate(selectedEvent.event_date)}
                                    </span>
                                    <span>
                                        <FontAwesomeIcon icon={faClock} className="me-1" />
                                        {selectedEvent.start_time || 'Heure à confirmer'}
                                    </span>
                                    <span>
                                        <FontAwesomeIcon icon={faMapMarkerAlt} className="me-1" />
                                        {selectedEvent.venue}
                                    </span>
                                </div>
                            </div>

                            {!selectedEvent.is_free && selectedEvent.ticket_price ? (
                                <div className="border rounded p-3 mb-3">
                                    <Row className="align-items-center">
                                        <Col md={8}>
                                            <h6 className="fw-bold mb-1">Billet Standard</h6>
                                            <div className="text-warning fw-bold fs-5">
                                                {formatCurrency(selectedEvent.ticket_price)}
                                            </div>
                                            <small className="text-muted d-block">
                                                {selectedEvent.remaining_spots > 0 ?
                                                    `${selectedEvent.remaining_spots} places disponibles` :
                                                    'Places limitées'
                                                }
                                            </small>
                                        </Col>
                                        <Col md={4} className="text-end">
                                            <Button
                                                variant="warning"
                                                onClick={handleAddToCart}
                                                disabled={selectedEvent.remaining_spots <= 0}
                                                className="rounded-pill"
                                            >
                                                <FontAwesomeIcon icon={faShoppingCart} className="me-2" />
                                                Ajouter
                                            </Button>
                                        </Col>
                                    </Row>
                                </div>
                            ) : (
                                <div className="text-center py-3">
                                    <p className="text-muted">
                                        {selectedEvent.is_free ?
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

            <style jsx>{`
                .events-social-feed {
                    min-height: 100vh;
                    background: #f8f9fa;
                    padding-top: 80px;
                }

                .events-header {
                    background: white;
                    border-bottom: 1px solid #e9ecef;
                    margin-bottom: 0;
                }

                .event-post {
                    transition: all 0.3s ease;
                    border-radius: 15px !important;
                }

                .event-post:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important;
                }

                .event-date-badge {
                    background: linear-gradient(135deg, #ffc107, #ff8f00);
                    color: white;
                    padding: 15px;
                    border-radius: 15px;
                    text-align: center;
                    box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3);
                }

                .date-day {
                    font-size: 1.8rem;
                    font-weight: bold;
                    line-height: 1;
                }

                .date-month {
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    margin-top: 2px;
                }

                .event-info {
                    flex-grow: 1;
                }

                .event-details {
                    margin: 10px 0;
                }

                .detail-item {
                    display: flex;
                    align-items: center;
                    margin-bottom: 5px;
                    font-size: 0.9rem;
                    color: #666;
                }

                .event-price {
                    text-align: center;
                }

                .price-amount {
                    font-size: 1.2rem;
                }

                .event-actions {
                    min-width: 120px;
                }

                .social-actions {
                    margin-top: 15px;
                }

                .social-btn {
                    border: none;
                    padding: 8px 15px;
                    border-radius: 20px;
                    font-size: 0.9rem;
                    transition: all 0.3s ease;
                    text-decoration: none;
                }

                .social-btn:hover {
                    background: #f8f9fa;
                    color: #ffc107 !important;
                    transform: scale(1.05);
                }

                @media (max-width: 768px) {
                    .event-post .row {
                        text-align: center;
                    }

                    .event-date-badge {
                        margin-bottom: 15px;
                    }

                    .event-actions {
                        margin-top: 15px;
                    }

                    .social-actions {
                        flex-wrap: wrap;
                        gap: 10px;
                    }

                    .social-btn {
                        font-size: 0.8rem;
                        padding: 6px 12px;
                    }
                }
            `}</style>
        </div>
    );
};

export default Events;
