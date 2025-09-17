import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Badge, ProgressBar } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendarAlt,
    faMapMarkerAlt,
    faTicketAlt,
    faImage,
    faUsers,
    faEuroSign,
    faArrowLeft,
    faArrowRight,
    faSave,
    faEye,
    faTimes,
    faClock,
    faMusic,
    faSpinner,
    faInfoCircle,
    faCheck,
    faCloudUpload,
    faFileAlt
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import ToastNotification from '../common/ToastNotification';
import '../../../css/admin.css';

const AddEvent = () => {
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [errors, setErrors] = useState({});
    const [stepValidation, setStepValidation] = useState({
        1: false, // Informations de base
        2: false, // Lieu et date
        3: false, // Billetterie
        4: false, // Artistes et sponsors
        5: false  // Images et finalisation
    });

    // Toast states
    const [showToast, setShowToast] = useState(false);
    const [toastConfig, setToastConfig] = useState({
        title: '',
        message: '',
        variant: 'success'
    });

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        venue: '',
        address: '',
        city: 'Yaoundé',
        country: 'Cameroun',
        event_date: '',
        start_time: '',
        end_time: '',
        poster_image: null,
        gallery_images: [],
        is_free: false,
        ticket_price: '',
        max_attendees: '',
        artists: [],
        sponsors: [],
        requirements: '',
        contact_phone: '',
        contact_email: '',
        website_url: '',
        social_links: {}
    });

    const [imagePreview, setImagePreview] = useState(null);
    const [galleryPreviews, setGalleryPreviews] = useState([]);
    const [artistsInput, setArtistsInput] = useState('');
    const [sponsorsInput, setSponsorsInput] = useState('');

    const steps = [
        {
            id: 1,
            title: 'Informations',
            icon: faFileAlt,
            description: 'Titre, description et catégorie'
        },
        {
            id: 2,
            title: 'Lieu & Date',
            icon: faMapMarkerAlt,
            description: 'Localisation et programmation'
        },
        {
            id: 3,
            title: 'Billetterie',
            icon: faTicketAlt,
            description: 'Prix et capacité'
        },
        {
            id: 4,
            title: 'Artistes',
            icon: faUsers,
            description: 'Programmation artistique'
        },
        {
            id: 5,
            title: 'Finalisation',
            icon: faImage,
            description: 'Images et publication'
        }
    ];

    const categories = [
        'concert', 'festival', 'showcase', 'workshop', 'conference', 'party'
    ];

    const categoryLabels = {
        'concert': 'Concert',
        'festival': 'Festival',
        'showcase': 'Showcase',
        'workshop': 'Atelier',
        'conference': 'Conférence',
        'party': 'Soirée'
    };

    const cities = [
        'Yaoundé', 'Douala', 'Garoua', 'Bamenda', 'Bafoussam',
        'Ngaoundéré', 'Bertoua', 'Ebolowa', 'Kribi', 'Limbe'
    ];

    const showToastNotification = (title, message, variant = 'success') => {
        setToastConfig({ title, message, variant });
        setShowToast(true);
    };

    const validateCurrentStep = () => {
        let isValid = false;

        switch (currentStep) {
            case 1: // Informations de base
                isValid = !!(formData.title.trim() && formData.description.trim() && formData.category);
                break;
            case 2: // Lieu et date
                isValid = !!(formData.venue.trim() && formData.address.trim() && formData.event_date && formData.start_time);
                break;
            case 3: // Billetterie
                isValid = formData.is_free || (formData.ticket_price && formData.ticket_price > 0);
                break;
            case 4: // Artistes
                isValid = formData.artists.length > 0;
                break;
            case 5: // Finalisation
                isValid = true; // Images optionnelles
                break;
        }

        setStepValidation(prev => ({
            ...prev,
            [currentStep]: isValid
        }));
    };

    React.useEffect(() => {
        validateCurrentStep();
    }, [formData, currentStep]);

    const canProceedToNextStep = () => {
        return stepValidation[currentStep];
    };

    const nextStep = () => {
        if (currentStep < 5 && canProceedToNextStep()) {
            setCurrentStep(currentStep + 1);
            setErrors({});
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setErrors({});
        }
    };

    const goToStep = (step) => {
        if (step <= currentStep || stepValidation[step - 1]) {
            setCurrentStep(step);
            setErrors({});
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'artists') {
            setArtistsInput(value);
            const artistsArray = value.split(',').map(artist => artist.trim()).filter(artist => artist);
            setFormData(prev => ({
                ...prev,
                artists: artistsArray
            }));
        } else if (name === 'sponsors') {
            setSponsorsInput(value);
            const sponsorsArray = value.split(',').map(sponsor => sponsor.trim()).filter(sponsor => sponsor);
            setFormData(prev => ({
                ...prev,
                sponsors: sponsorsArray
            }));
        } else {
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        }

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleImageUpload = (e, type) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        if (type === 'poster') {
            const file = files[0];

            const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file.type)) {
                setErrors(prev => ({ ...prev, poster_image: 'Format d\'image non supporté. Utilisez JPG ou PNG.' }));
            return;
        }

            if (file.size > 2 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, poster_image: 'L\'image ne doit pas dépasser 2MB.' }));
            return;
        }

            setFormData(prev => ({ ...prev, poster_image: file }));

        const imageUrl = URL.createObjectURL(file);
        setImagePreview(imageUrl);

            setErrors(prev => ({ ...prev, poster_image: '' }));

        } else if (type === 'gallery') {
            const validFiles = [];
            const errorMessages = [];

            files.forEach((file, index) => {
                const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                if (!validTypes.includes(file.type)) {
                    errorMessages.push(`Image ${index + 1}: Format non supporté`);
                    return;
                }

                if (file.size > 2 * 1024 * 1024) {
                    errorMessages.push(`Image ${index + 1}: Taille trop importante (max 2MB)`);
                    return;
                }

                validFiles.push(file);
            });

            if (errorMessages.length > 0) {
                setErrors(prev => ({ ...prev, gallery_images: errorMessages.join(', ') }));
                return;
            }

            setFormData(prev => ({ ...prev, gallery_images: validFiles }));

            const previews = validFiles.map(file => URL.createObjectURL(file));
            setGalleryPreviews(previews);

            setErrors(prev => ({ ...prev, gallery_images: '' }));
        }
    };

    const removeImage = (type, index = null) => {
        if (type === 'poster') {
            setFormData(prev => ({ ...prev, poster_image: null }));
        setImagePreview(null);
        } else if (type === 'gallery' && index !== null) {
            setFormData(prev => ({
                ...prev,
                gallery_images: prev.gallery_images.filter((_, i) => i !== index)
            }));
            setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) newErrors.title = 'Le titre est requis';
        if (!formData.description.trim()) newErrors.description = 'La description est requise';
        if (!formData.category) newErrors.category = 'La catégorie est requise';
        if (!formData.venue.trim()) newErrors.venue = 'Le lieu est requis';
        if (!formData.address.trim()) newErrors.address = 'L\'adresse est requise';
        if (!formData.event_date) newErrors.event_date = 'La date est requise';
        if (!formData.start_time) newErrors.start_time = 'L\'heure de début est requise';
        if (!formData.is_free && (!formData.ticket_price || formData.ticket_price <= 0)) {
            newErrors.ticket_price = 'Le prix du billet est requis pour un événement payant';
        }
        if (formData.artists.length === 0) newErrors.artists = 'Au moins un artiste est requis';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setUploadProgress(0);

        try {
            const submitData = new FormData();

            // Données de base
            submitData.append('title', formData.title);
            submitData.append('description', formData.description);
            submitData.append('category', formData.category);
            submitData.append('venue', formData.venue);
            submitData.append('address', formData.address);
            submitData.append('city', formData.city);
            submitData.append('country', formData.country);
            submitData.append('event_date', formData.event_date);
            submitData.append('start_time', formData.start_time);
            if (formData.end_time) submitData.append('end_time', formData.end_time);

            // Billetterie
            submitData.append('is_free', formData.is_free ? '1' : '0');
            if (!formData.is_free && formData.ticket_price) {
                submitData.append('ticket_price', formData.ticket_price);
            }
            if (formData.max_attendees) submitData.append('max_attendees', formData.max_attendees);

            // Artistes et sponsors
            if (formData.artists.length > 0) {
                formData.artists.forEach((artist, index) => {
                    submitData.append(`artists[${index}]`, artist);
                });
            }
            if (formData.sponsors.length > 0) {
                formData.sponsors.forEach((sponsor, index) => {
                    submitData.append(`sponsors[${index}]`, sponsor);
                });
            }

            // Informations supplémentaires
            if (formData.requirements) submitData.append('requirements', formData.requirements);
            if (formData.contact_phone) submitData.append('contact_phone', formData.contact_phone);
            if (formData.contact_email) submitData.append('contact_email', formData.contact_email);
            if (formData.website_url) submitData.append('website_url', formData.website_url);

            // Images
            if (formData.poster_image) {
                submitData.append('poster_image', formData.poster_image);
            }
            if (formData.gallery_images.length > 0) {
                formData.gallery_images.forEach((image, index) => {
                    submitData.append(`gallery_images[${index}]`, image);
                });
            }

            // Simulation du progrès
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            const response = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: submitData
            });

            clearInterval(progressInterval);
            setUploadProgress(100);

            const data = await response.json();

            if (response.ok) {
                showToastNotification(
                    'Succès !',
                    'Événement créé avec succès ! Il sera disponible après validation.',
                    'success'
                );

                setTimeout(() => {
                    navigate('/profile');
                }, 2000);
            } else {
                if (data.errors) {
                    setErrors(data.errors);
                } else {
                    setErrors({ general: data.message || 'Erreur lors de la création de l\'événement' });
                }
            }

        } catch (error) {
            console.error('Erreur réseau:', error);
            setErrors({ general: 'Erreur de connexion. Veuillez réessayer.' });
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };

    // Rendu des étapes individuelles
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return renderBasicInfoStep();
            case 2:
                return renderLocationDateStep();
            case 3:
                return renderTicketingStep();
            case 4:
                return renderArtistsStep();
            case 5:
                return renderFinalizationStep();
            default:
                return null;
        }
    };

    const renderBasicInfoStep = () => (
        <Card className="border-0 shadow-sm">
                                <Card.Header className="bg-white border-bottom-0">
                <h4 className="fw-bold mb-0">
                    <FontAwesomeIcon icon={faFileAlt} className="me-2 text-primary" />
                    Informations de base
                </h4>
                <p className="text-muted mb-0">Décrivez votre événement pour attirer votre public</p>
                                </Card.Header>
                                <Card.Body>
                <Row className="g-4">
                    <Col>
                                            <Form.Group>
                                                <Form.Label className="fw-medium">Titre de l'événement *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="title"
                                                    value={formData.title}
                                                    onChange={handleInputChange}
                                placeholder="Ex: Concert Afrobeat Live 2024"
                                                    isInvalid={!!errors.title}
                                size="lg"
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.title}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label className="fw-medium">Catégorie *</Form.Label>
                                                <Form.Select
                                                    name="category"
                                                    value={formData.category}
                                                    onChange={handleInputChange}
                                                    isInvalid={!!errors.category}
                                size="lg"
                                                >
                                                    <option value="">Sélectionner</option>
                                                    {categories.map(cat => (
                                                        <option key={cat} value={cat}>{categoryLabels[cat]}</option>
                                                    ))}
                                                </Form.Select>
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.category}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>
                                        <Col>
                                            <Form.Group>
                                                <Form.Label className="fw-medium">Description *</Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                rows={4}
                                                    name="description"
                                                    value={formData.description}
                                                    onChange={handleInputChange}
                                placeholder="Décrivez l'ambiance, le style et ce qui rend votre événement unique..."
                                                    isInvalid={!!errors.description}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.description}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
    );

    const renderLocationDateStep = () => (
        <Card className="border-0 shadow-sm">
                                <Card.Header className="bg-white border-bottom-0">
                <h4 className="fw-bold mb-0">
                                        <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2 text-success" />
                    Lieu et programmation
                </h4>
                <p className="text-muted mb-0">Où et quand aura lieu votre événement</p>
                                </Card.Header>
                                <Card.Body>
                <Row className="g-4">
                    <Col md={8}>
                                            <Form.Group>
                                                <Form.Label className="fw-medium">Nom du lieu *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="venue"
                                                    value={formData.venue}
                                                    onChange={handleInputChange}
                                placeholder="Ex: Palais des Sports de Yaoundé"
                                                    isInvalid={!!errors.venue}
                                size="lg"
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.venue}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>
                    <Col md={4}>
                                            <Form.Group>
                                                <Form.Label className="fw-medium">Ville</Form.Label>
                                                <Form.Select
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleInputChange}
                                size="lg"
                                                >
                                                    {cities.map(city => (
                                                        <option key={city} value={city}>{city}</option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col>
                                            <Form.Group>
                                                <Form.Label className="fw-medium">Adresse complète *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleInputChange}
                                placeholder="Ex: Avenue Kennedy, Quartier Melen, Yaoundé"
                                                    isInvalid={!!errors.address}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.address}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>
                    <Col md={4}>
                        <Form.Group>
                            <Form.Label className="fw-medium">Date de l'événement *</Form.Label>
                            <Form.Control
                                type="date"
                                name="event_date"
                                value={formData.event_date}
                                onChange={handleInputChange}
                                isInvalid={!!errors.event_date}
                                size="lg"
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.event_date}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group>
                            <Form.Label className="fw-medium">Heure de début *</Form.Label>
                            <Form.Control
                                type="time"
                                name="start_time"
                                value={formData.start_time}
                                onChange={handleInputChange}
                                isInvalid={!!errors.start_time}
                                size="lg"
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.start_time}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group>
                            <Form.Label className="fw-medium">Heure de fin</Form.Label>
                            <Form.Control
                                type="time"
                                name="end_time"
                                value={formData.end_time}
                                onChange={handleInputChange}
                                size="lg"
                            />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
    );

    const renderTicketingStep = () => (
        <Card className="border-0 shadow-sm">
                                <Card.Header className="bg-white border-bottom-0">
                <h4 className="fw-bold mb-0">
                                            <FontAwesomeIcon icon={faTicketAlt} className="me-2 text-warning" />
                    Billetterie et capacité
                </h4>
                <p className="text-muted mb-0">Définissez les modalités d'accès à votre événement</p>
                                </Card.Header>
                                <Card.Body>
                <Row className="g-4">
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Check
                                                    type="checkbox"
                                                    name="is_free"
                                                    checked={formData.is_free}
                                                    onChange={handleInputChange}
                                label="🎫 Événement gratuit"
                                                    className="mb-3"
                                size="lg"
                                                />
                                            </Form.Group>
                                        </Col>
                                        {!formData.is_free && (
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label className="fw-medium">Prix du billet (FCFA) *</Form.Label>
                                <div className="input-group input-group-lg">
                                                            <Form.Control
                                                                type="number"
                                                            name="ticket_price"
                                                            value={formData.ticket_price}
                                                            onChange={handleInputChange}
                                        placeholder="Ex: 5000"
                                                                min="0"
                                                                step="500"
                                                            isInvalid={!!errors.ticket_price}
                                                        />
                                                        <span className="input-group-text">FCFA</span>
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.ticket_price}
                                                        </Form.Control.Feedback>
                                    </div>
                                                </Form.Group>
                                            </Col>
                                        )}
                                        <Col md={6}>
                                            <Form.Group>
                            <Form.Label className="fw-medium">Capacité maximale</Form.Label>
                            <Form.Control
                                type="number"
                                name="max_attendees"
                                value={formData.max_attendees}
                                onChange={handleInputChange}
                                placeholder="Ex: 500"
                                min="1"
                                size="lg"
                            />
                            <Form.Text className="text-muted">
                                Laissez vide pour une capacité illimitée
                            </Form.Text>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label className="fw-medium">Téléphone de contact</Form.Label>
                                                <Form.Control
                                                    type="tel"
                                                    name="contact_phone"
                                                    value={formData.contact_phone}
                                                    onChange={handleInputChange}
                                                    placeholder="Ex: +237 6XX XXX XXX"
                                size="lg"
                                                />
                                            </Form.Group>
                                        </Col>
                    <Col>
                                            <Form.Group>
                            <Form.Label className="fw-medium">Email de contact</Form.Label>
                                                <Form.Control
                                                    type="email"
                                                    name="contact_email"
                                                    value={formData.contact_email}
                                                    onChange={handleInputChange}
                                placeholder="contact@monevenement.com"
                                                />
                                            </Form.Group>
                                        </Col>
                </Row>
            </Card.Body>
        </Card>
    );

    const renderArtistsStep = () => (
        <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom-0">
                <h4 className="fw-bold mb-0">
                    <FontAwesomeIcon icon={faUsers} className="me-2 text-info" />
                    Programmation artistique
                </h4>
                <p className="text-muted mb-0">Qui va performer lors de votre événement</p>
            </Card.Header>
            <Card.Body>
                <Row className="g-4">
                    <Col>
                                            <Form.Group>
                            <Form.Label className="fw-medium">Artistes participants *</Form.Label>
                                                <Form.Control
                                type="text"
                                value={artistsInput}
                                onChange={(e) => handleInputChange({ target: { name: 'artists', value: e.target.value } })}
                                placeholder="Ex: Daphné, Locko, Tenor (séparés par des virgules)"
                                isInvalid={!!errors.artists}
                                size="lg"
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.artists}
                            </Form.Control.Feedback>
                            <Form.Text className="text-muted">
                                Listez tous les artistes qui vont performer
                            </Form.Text>
                            {formData.artists.length > 0 && (
                                <div className="mt-3">
                                    <h6 className="fw-medium mb-2">Artistes confirmés :</h6>
                                    {formData.artists.map((artist, index) => (
                                        <Badge key={index} bg="primary" className="me-2 mb-2 p-2">
                                            <FontAwesomeIcon icon={faMusic} className="me-1" />
                                            {artist}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                                            </Form.Group>
                                        </Col>
                    <Col>
                                            <Form.Group>
                            <Form.Label className="fw-medium">Sponsors et partenaires</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={sponsorsInput}
                                                    onChange={(e) => handleInputChange({ target: { name: 'sponsors', value: e.target.value } })}
                                placeholder="Ex: MTN Cameroun, Orange, Canal+ (séparés par des virgules)"
                            />
                            <Form.Text className="text-muted">
                                Mentionnez vos sponsors et partenaires officiels
                            </Form.Text>
                            {formData.sponsors.length > 0 && (
                                <div className="mt-3">
                                    <h6 className="fw-medium mb-2">Sponsors :</h6>
                                    {formData.sponsors.map((sponsor, index) => (
                                        <Badge key={index} bg="secondary" className="me-2 mb-2 p-2">
                                            {sponsor}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                                            </Form.Group>
                                        </Col>
                                        <Col>
                                            <Form.Group>
                                                <Form.Label className="fw-medium">Exigences particulières</Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                rows={3}
                                                    name="requirements"
                                                    value={formData.requirements}
                                                    onChange={handleInputChange}
                                placeholder="Ex: Tenue correcte exigée, Interdiction de fumer, Contrôle d'identité..."
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
    );

    const renderFinalizationStep = () => (
        <div className="space-y-4">
                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Header className="bg-white border-bottom-0">
                    <h4 className="fw-bold mb-0">
                                        <FontAwesomeIcon icon={faImage} className="me-2 text-primary" />
                        Images de l'événement
                    </h4>
                    <p className="text-muted mb-0">Ajoutez des visuels attractifs pour promouvoir votre événement</p>
                                </Card.Header>
                                <Card.Body>
                    <Row className="g-4">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-medium">Affiche principale</Form.Label>
                                    {!formData.poster_image ? (
                                        <div
                                            className="upload-zone border-2 border-dashed rounded p-4 text-center"
                                        style={{ borderColor: '#007bff', cursor: 'pointer', backgroundColor: '#f8f9fa', minHeight: '200px' }}
                                            onClick={() => document.getElementById('posterImage').click()}
                                        >
                                        <FontAwesomeIcon icon={faImage} size="3x" className="text-primary mb-3" />
                                        <h6 className="mb-2">Cliquez pour ajouter une affiche</h6>
                                        <small className="text-muted">
                                            JPG, PNG (max 2MB)<br/>
                                            Dimensions recommandées : 1080x1350px
                                        </small>
                                            <Form.Control
                                                id="posterImage"
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(e, 'poster')}
                                                style={{ display: 'none' }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="position-relative">
                                            <img
                                                src={imagePreview}
                                            alt="Affiche de l'événement"
                                                className="img-fluid rounded"
                                                style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                                            />
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                className="position-absolute top-0 end-0 m-2"
                                                onClick={() => removeImage('poster')}
                                            >
                                                <FontAwesomeIcon icon={faTimes} />
                                            </Button>
                                        </div>
                                    )}
                                    {errors.poster_image && (
                                    <div className="text-danger small mt-2">
                                        {errors.poster_image}
                                    </div>
                                )}
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-medium">Galerie d'images</Form.Label>
                                <div
                                    className="upload-zone border-2 border-dashed rounded p-4 text-center"
                                    style={{ borderColor: '#28a745', cursor: 'pointer', backgroundColor: '#f8f9fa', minHeight: '200px' }}
                                        onClick={() => document.getElementById('galleryImages').click()}
                                    >
                                    <FontAwesomeIcon icon={faCloudUpload} size="2x" className="text-success mb-2" />
                                    <h6 className="mb-2">Images supplémentaires</h6>
                                    <small className="text-muted">
                                        Plusieurs fichiers acceptés<br/>
                                        JPG, PNG (max 2MB chacune)
                                    </small>
                                        <Form.Control
                                            id="galleryImages"
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(e) => handleImageUpload(e, 'gallery')}
                                            style={{ display: 'none' }}
                                        />
                                    </div>
                                    {galleryPreviews.length > 0 && (
                                    <div className="mt-3">
                                        <div className="row g-2">
                                            {galleryPreviews.map((preview, index) => (
                                                <div key={index} className="col-4">
                                                    <div className="position-relative">
                                                        <img
                                                            src={preview}
                                                            alt={`Galerie ${index + 1}`}
                                                            className="img-fluid rounded"
                                                            style={{ width: '100%', height: '80px', objectFit: 'cover' }}
                                                        />
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            className="position-absolute top-0 end-0"
                                                            onClick={() => removeImage('gallery', index)}
                                                            style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                                                        >
                                                            <FontAwesomeIcon icon={faTimes} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    )}
                                    {errors.gallery_images && (
                                    <div className="text-danger small mt-2">
                                        {errors.gallery_images}
                                    </div>
                                    )}
                            </Form.Group>
                        </Col>
                    </Row>
                                </Card.Body>
                            </Card>

            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-bottom-0">
                    <h4 className="fw-bold mb-0">
                        <FontAwesomeIcon icon={faEye} className="me-2 text-info" />
                        Récapitulatif de l'événement
                    </h4>
                </Card.Header>
                                <Card.Body>
                    <Row className="g-3">
                        <Col md={6}>
                            <div className="border rounded p-3">
                                <h6 className="fw-bold text-primary mb-2">Informations générales</h6>
                                <p className="mb-1">{formData.title || 'Sans titre'}</p>
                                <small className="text-muted">
                                    {categoryLabels[formData.category] || 'Aucune catégorie'}
                                </small>
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="border rounded p-3">
                                <h6 className="fw-bold text-primary mb-2">Lieu et date</h6>
                                <p className="mb-1">{formData.venue || 'Lieu non défini'}</p>
                                <small className="text-muted">
                                    {formData.event_date ? new Date(formData.event_date).toLocaleDateString('fr-FR') : 'Date non définie'}
                                    {formData.start_time && ` à ${formData.start_time}`}
                                </small>
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="border rounded p-3">
                                <h6 className="fw-bold text-primary mb-2">Billetterie</h6>
                                <p className="mb-1">
                                    {formData.is_free ? '🎫 Gratuit' : `${formData.ticket_price || 0} FCFA`}
                                </p>
                                <small className="text-muted">
                                    Capacité: {formData.max_attendees || 'Illimitée'}
                                </small>
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="border rounded p-3">
                                <h6 className="fw-bold text-primary mb-2">Artistes</h6>
                                <p className="mb-1">
                                    {formData.artists.length > 0 ? `${formData.artists.length} artiste(s)` : 'Aucun artiste'}
                                </p>
                                <small className="text-muted">
                                    {formData.artists.slice(0, 2).join(', ')}
                                    {formData.artists.length > 2 && '...'}
                                </small>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {loading && (
                <div className="text-center">
                    <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <small className="text-muted">Publication en cours...</small>
                            <small className="text-muted">{uploadProgress}%</small>
                        </div>
                        <ProgressBar now={uploadProgress} animated />
                    </div>
                </div>
            )}
        </div>
    );

    if (!user) {
        return (
            <Container className="py-5">
                <Alert variant="warning">
                    Vous devez être connecté pour créer un événement.
                </Alert>
            </Container>
        );
    }

    return (
        <div className="min-vh-100 bg-light" style={{ paddingTop: '80px' }}>
            {/* Header avec navigation par étapes */}
            <div className="bg-white shadow-sm border-bottom">
                <Container>
                    <div className="d-flex align-items-center py-3">
                                        <Button
                            as={Link}
                            to="/dashboard"
                            variant="outline-secondary"
                            className="me-3"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                            Retour
                        </Button>
                        <div className="flex-grow-1">
                            <h3 className="mb-0 fw-bold">Créer un nouvel événement</h3>
                            <small className="text-muted">
                                Étape {currentStep} sur {steps.length} : {steps.find(s => s.id === currentStep)?.description}
                            </small>
                        </div>
                    </div>

                    {/* Indicateur de progression */}
                    <div className="pb-3">
                        <div className="row g-0">
                            {steps.map((step, index) => (
                                <div key={step.id} className="col d-flex align-items-center">
                                    <div
                                        className={`step-indicator d-flex align-items-center justify-content-center rounded-circle me-2 ${
                                            currentStep === step.id ? 'bg-primary text-white' :
                                            stepValidation[step.id] ? 'bg-success text-white' :
                                            currentStep > step.id ? 'bg-success text-white' : 'bg-light text-muted'
                                        }`}
                                        style={{ width: '40px', height: '40px', cursor: 'pointer' }}
                                        onClick={() => goToStep(step.id)}
                                    >
                                        {stepValidation[step.id] && currentStep > step.id ? (
                                            <FontAwesomeIcon icon={faCheck} />
                                        ) : (
                                            <FontAwesomeIcon icon={step.icon} />
                                        )}
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="small fw-medium">{step.title}</div>
                                        {index < steps.length - 1 && (
                                            <div
                                                className={`progress-line ${
                                                    currentStep > step.id ? 'bg-success' : 'bg-light'
                                                }`}
                                                style={{ height: '2px', width: '100%' }}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Container>
            </div>

            <Container className="py-4">
                {errors.general && (
                    <Alert variant="danger" className="mb-4">
                        {errors.general}
                    </Alert>
                )}

                <Row>
                    <Col lg={8} className="mx-auto">
                        {renderStepContent()}

                        {/* Navigation entre les étapes */}
                        <div className="d-flex justify-content-between mt-4">
                            <Button
                                variant="outline-secondary"
                                onClick={prevStep}
                                disabled={currentStep === 1}
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                                Précédent
                            </Button>

                            {currentStep < 5 ? (
                                <Button
                                            variant="primary"
                                    onClick={nextStep}
                                    disabled={!canProceedToNextStep()}
                                >
                                    Suivant
                                    <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
                                </Button>
                            ) : (
                                <Button
                                    variant="success"
                                    onClick={handleSubmit}
                                    disabled={loading || !canProceedToNextStep()}
                                            size="lg"
                                        >
                                            <FontAwesomeIcon icon={loading ? faSpinner : faSave} className="me-2" spin={loading} />
                                    {loading ? 'Publication...' : 'Publier l\'événement'}
                                        </Button>
                            )}
                                    </div>
                        </Col>
                    </Row>
            </Container>

            <ToastNotification
                show={showToast}
                onClose={() => setShowToast(false)}
                title={toastConfig.title}
                message={toastConfig.message}
                variant={toastConfig.variant}
            />

            <style jsx>{`
                .step-indicator {
                    transition: all 0.3s ease;
                }
                .step-indicator:hover {
                    transform: scale(1.1);
                }
                .progress-line {
                    transition: all 0.3s ease;
                }
                .upload-zone {
                    transition: all 0.3s ease;
                }
                .upload-zone:hover {
                    border-color: #0056b3 !important;
                    background-color: #e3f2fd !important;
                }
            `}</style>
        </div>
    );
};

export default AddEvent;
