import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSave,
    faArrowLeft,
    faSpinner,
    faCalendarAlt,
    faMapMarkerAlt,
    faImage,
    faUsers,
    faEuroSign,
    faClock
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const EditEvent = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const toast = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [event, setEvent] = useState(null);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        event_date: '',
        start_time: '',
        end_time: '',
        venue: '',
        address: '',
        city: '',
        country: '',
        category: '',
        status: 'pending',
        is_featured: false,
        is_free: false,
        ticket_price: '',
        max_attendees: '',
        artists: '',
        sponsors: '',
        requirements: '',
        contact_email: '',
        contact_phone: '',
        website_url: '',
        social_links: ''
    });

    useEffect(() => {
        loadEvent();
    }, [id]);

    const loadEvent = async () => {
        try {
            const response = await fetch(`/api/events/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                const eventData = data.event;
                setEvent(eventData);

                // Vérifier les permissions
                if (!canEditEvent(eventData, user)) {
                    toast.error('Erreur', 'Vous n\'avez pas les permissions pour modifier cet événement');
                    navigate('/dashboard');
                    return;
                }

                // Remplir le formulaire
                setFormData({
                    title: eventData.title || '',
                    description: eventData.description || '',
                    event_date: eventData.event_date || '',
                    start_time: eventData.start_time || '',
                    end_time: eventData.end_time || '',
                    venue: eventData.venue || '',
                    address: eventData.address || '',
                    city: eventData.city || '',
                    country: eventData.country || '',
                    category: eventData.category || '',
                    status: eventData.status || 'pending',
                    is_featured: eventData.is_featured || false,
                    is_free: eventData.is_free || false,
                    ticket_price: eventData.ticket_price || '',
                    max_attendees: eventData.max_attendees || '',
                    artists: Array.isArray(eventData.artists) ? eventData.artists.join(', ') :
                            (typeof eventData.artists === 'string' ? eventData.artists : ''),
                    sponsors: Array.isArray(eventData.sponsors) ? eventData.sponsors.join(', ') :
                             (typeof eventData.sponsors === 'string' ? eventData.sponsors : ''),
                    requirements: eventData.requirements || '',
                    contact_email: eventData.contact_email || '',
                    contact_phone: eventData.contact_phone || '',
                    website_url: eventData.website_url || '',
                    social_links: eventData.social_links || ''
                });
            } else {
                toast.error('Erreur', 'Impossible de charger l\'événement');
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
            toast.error('Erreur', 'Erreur de connexion au serveur');
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const canEditEvent = (event, user) => {
        if (!user) return false;
        return user.role === 'admin' || user.id === event.user_id;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Le titre est requis';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'La description est requise';
        }

        if (!formData.event_date) {
            newErrors.event_date = 'La date est requise';
        }

        if (!formData.start_time) {
            newErrors.start_time = 'L\'heure de début est requise';
        }

        if (!formData.venue.trim()) {
            newErrors.venue = 'Le lieu est requis';
        }

        if (!formData.city.trim()) {
            newErrors.city = 'La ville est requise';
        }

        if (!formData.category) {
            newErrors.category = 'La catégorie est requise';
        }

        if (!formData.contact_email.trim()) {
            newErrors.contact_email = 'L\'email de contact est requis';
        } else if (!/\S+@\S+\.\S+/.test(formData.contact_email)) {
            newErrors.contact_email = 'Format d\'email invalide';
        }

        if (!formData.contact_phone.trim()) {
            newErrors.contact_phone = 'Le téléphone de contact est requis';
        }

        if (!formData.is_free && (!formData.ticket_price || formData.ticket_price <= 0)) {
            newErrors.ticket_price = 'Le prix du billet est requis pour un événement payant';
        }

        if (formData.max_attendees && formData.max_attendees <= 0) {
            newErrors.max_attendees = 'Le nombre maximum de participants doit être positif';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSaving(true);

        try {
            const submitData = {
                ...formData,
                artists: formData.artists ? formData.artists.split(',').map(a => a.trim()).filter(a => a) : [],
                sponsors: formData.sponsors ? formData.sponsors.split(',').map(s => s.trim()).filter(s => s) : []
            };

            const response = await fetch(`/api/events/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(submitData)
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Succès', 'Événement mis à jour avec succès');
                navigate('/dashboard?tab=events');
            } else {
                if (data.errors) {
                    setErrors(data.errors);
                }
                toast.error('Erreur', data.message || 'Impossible de mettre à jour l\'événement');
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            toast.error('Erreur', 'Erreur de connexion au serveur');
        } finally {
            setSaving(false);
        }
    };

    const categories = [
        { value: 'festival', label: 'Festival' },
        { value: 'concert', label: 'Concert' },
        { value: 'showcase', label: 'Showcase' },
        { value: 'workshop', label: 'Workshop' },
        { value: 'conference', label: 'Conférence' },
        { value: 'party', label: 'Soirée' }
    ];

    const statuses = [
        { value: 'draft', label: 'Brouillon' },
        { value: 'pending', label: 'En attente' },
        { value: 'published', label: 'Publié' }
    ];

    if (loading) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ paddingTop: '80px' }}>
                <div className="text-center">
                    <Spinner animation="border" variant="primary" size="lg" className="mb-3" />
                    <h5 className="text-muted">Chargement de l'événement...</h5>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100 bg-light" style={{ paddingTop: '80px' }}>
            <Container className="py-4">
                {/* Header */}
                <div className="d-flex align-items-center justify-content-between mb-4">
                    <div>
                        <h2 className="fw-bold mb-1">
                            <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                            Modifier l'événement
                        </h2>
                        <p className="text-muted mb-0">Modifiez les informations de votre événement</p>
                    </div>
                    <Button
                        variant="outline-secondary"
                        onClick={() => navigate('/dashboard?tab=events')}
                    >
                        <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                        Retour
                    </Button>
                </div>

                <Form onSubmit={handleSubmit}>
                    <Row className="g-4">
                        {/* Informations principales */}
                        <Col lg={8}>
                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Header className="bg-white border-bottom">
                                    <h5 className="fw-bold mb-0">Informations principales</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row className="g-3">
                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label>Titre de l'événement *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="title"
                                                    value={formData.title}
                                                    onChange={handleChange}
                                                    isInvalid={!!errors.title}
                                                    placeholder="Nom de votre événement"
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.title}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>

                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label>Description *</Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={4}
                                                    name="description"
                                                    value={formData.description}
                                                    onChange={handleChange}
                                                    isInvalid={!!errors.description}
                                                    placeholder="Décrivez votre événement..."
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.description}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>

                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Catégorie *</Form.Label>
                                                <Form.Select
                                                    name="category"
                                                    value={formData.category}
                                                    onChange={handleChange}
                                                    isInvalid={!!errors.category}
                                                >
                                                    <option value="">Sélectionner une catégorie</option>
                                                    {categories.map(cat => (
                                                        <option key={cat.value} value={cat.value}>
                                                            {cat.label}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.category}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>

                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Statut</Form.Label>
                                                <Form.Select
                                                    name="status"
                                                    value={formData.status}
                                                    onChange={handleChange}
                                                    disabled={user?.role !== 'admin'}
                                                >
                                                    {statuses.map(status => (
                                                        <option key={status.value} value={status.value}>
                                                            {status.label}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                                {user?.role !== 'admin' && (
                                                    <Form.Text className="text-muted">
                                                        Seuls les admins peuvent modifier le statut
                                                    </Form.Text>
                                                )}
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Date et lieu */}
                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Header className="bg-white border-bottom">
                                    <h5 className="fw-bold mb-0">
                                        <FontAwesomeIcon icon={faClock} className="me-2 text-primary" />
                                        Date et lieu
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row className="g-3">
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>Date de l'événement *</Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    name="event_date"
                                                    value={formData.event_date}
                                                    onChange={handleChange}
                                                    isInvalid={!!errors.event_date}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.event_date}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>

                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>Heure de début *</Form.Label>
                                                <Form.Control
                                                    type="time"
                                                    name="start_time"
                                                    value={formData.start_time}
                                                    onChange={handleChange}
                                                    isInvalid={!!errors.start_time}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.start_time}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>

                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>Heure de fin</Form.Label>
                                                <Form.Control
                                                    type="time"
                                                    name="end_time"
                                                    value={formData.end_time}
                                                    onChange={handleChange}
                                                />
                                            </Form.Group>
                                        </Col>

                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Lieu *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="venue"
                                                    value={formData.venue}
                                                    onChange={handleChange}
                                                    isInvalid={!!errors.venue}
                                                    placeholder="Nom du lieu"
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.venue}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>

                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Ville *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleChange}
                                                    isInvalid={!!errors.city}
                                                    placeholder="Ville de l'événement"
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.city}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>

                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label>Adresse</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleChange}
                                                    placeholder="Adresse complète"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Participants et tarification */}
                            <Card className="border-0 shadow-sm">
                                <Card.Header className="bg-white border-bottom">
                                    <h5 className="fw-bold mb-0">
                                        <FontAwesomeIcon icon={faUsers} className="me-2 text-primary" />
                                        Participants et tarification
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row className="g-3">
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Nombre maximum de participants</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="max_attendees"
                                                    value={formData.max_attendees}
                                                    onChange={handleChange}
                                                    isInvalid={!!errors.max_attendees}
                                                    placeholder="Capacité maximale"
                                                    min="1"
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.max_attendees}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>

                                        <Col md={6}>
                                            <Form.Group>
                                                <div className="d-flex align-items-center mb-2">
                                                    <Form.Check
                                                        type="checkbox"
                                                        name="is_free"
                                                        checked={formData.is_free}
                                                        onChange={handleChange}
                                                        label="Événement gratuit"
                                                        className="me-3"
                                                    />
                                                    <Form.Check
                                                        type="checkbox"
                                                        name="is_featured"
                                                        checked={formData.is_featured}
                                                        onChange={handleChange}
                                                        label="Événement mis en avant"
                                                        disabled={user?.role !== 'admin'}
                                                    />
                                                </div>
                                                {!formData.is_free && (
                                                    <>
                                                        <Form.Label>Prix du billet (XAF) *</Form.Label>
                                                        <Form.Control
                                                            type="number"
                                                            name="ticket_price"
                                                            value={formData.ticket_price}
                                                            onChange={handleChange}
                                                            isInvalid={!!errors.ticket_price}
                                                            placeholder="Prix en Francs CFA"
                                                            min="0"
                                                        />
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.ticket_price}
                                                        </Form.Control.Feedback>
                                                    </>
                                                )}
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Sidebar */}
                        <Col lg={4}>
                            {/* Artistes et sponsors */}
                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Header className="bg-white border-bottom">
                                    <h5 className="fw-bold mb-0">Artistes et sponsors</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Artistes</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="artists"
                                            value={formData.artists}
                                            onChange={handleChange}
                                            placeholder="Séparez par des virgules"
                                        />
                                        <Form.Text className="text-muted">
                                            Ex: Artiste 1, Artiste 2, Artiste 3
                                        </Form.Text>
                                    </Form.Group>

                                    <Form.Group>
                                        <Form.Label>Sponsors</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="sponsors"
                                            value={formData.sponsors}
                                            onChange={handleChange}
                                            placeholder="Séparez par des virgules"
                                        />
                                        <Form.Text className="text-muted">
                                            Ex: Sponsor 1, Sponsor 2
                                        </Form.Text>
                                    </Form.Group>
                                </Card.Body>
                            </Card>

                            {/* Contact */}
                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Header className="bg-white border-bottom">
                                    <h5 className="fw-bold mb-0">Informations de contact</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Email de contact *</Form.Label>
                                        <Form.Control
                                            type="email"
                                            name="contact_email"
                                            value={formData.contact_email}
                                            onChange={handleChange}
                                            isInvalid={!!errors.contact_email}
                                            placeholder="contact@example.com"
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.contact_email}
                                        </Form.Control.Feedback>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Téléphone de contact *</Form.Label>
                                        <Form.Control
                                            type="tel"
                                            name="contact_phone"
                                            value={formData.contact_phone}
                                            onChange={handleChange}
                                            isInvalid={!!errors.contact_phone}
                                            placeholder="+237 6XX XXX XXX"
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.contact_phone}
                                        </Form.Control.Feedback>
                                    </Form.Group>

                                    <Form.Group>
                                        <Form.Label>Site web</Form.Label>
                                        <Form.Control
                                            type="url"
                                            name="website_url"
                                            value={formData.website_url}
                                            onChange={handleChange}
                                            placeholder="https://example.com"
                                        />
                                    </Form.Group>
                                </Card.Body>
                            </Card>

                            {/* Informations supplémentaires */}
                            <Card className="border-0 shadow-sm">
                                <Card.Header className="bg-white border-bottom">
                                    <h5 className="fw-bold mb-0">Informations supplémentaires</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Form.Group>
                                        <Form.Label>Exigences particulières</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            name="requirements"
                                            value={formData.requirements}
                                            onChange={handleChange}
                                            placeholder="Age minimum, dress code, etc."
                                        />
                                    </Form.Group>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Actions */}
                    <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                        <Button
                            variant="outline-secondary"
                            onClick={() => navigate('/dashboard?tab=events')}
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                            Annuler
                        </Button>

                        <Button
                            type="submit"
                            variant="primary"
                            disabled={saving}
                            size="lg"
                        >
                            {saving ? (
                                <>
                                    <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                                    Enregistrement...
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faSave} className="me-2" />
                                    Enregistrer les modifications
                                </>
                            )}
                        </Button>
                    </div>
                </Form>
            </Container>
        </div>
    );
};

export default EditEvent;
