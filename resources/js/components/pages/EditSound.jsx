import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSave,
    faArrowLeft,
    faSpinner,
    faMusic,
    faImage,
    faEuroSign,
    faClock,
    faTag,
    faUser,
    faPlay
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const EditSound = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const toast = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sound, setSound] = useState(null);
    const [errors, setErrors] = useState({});
    const [categories, setCategories] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category_id: '',
        genre: '',
        price: '',
        is_free: false,
        is_featured: false,
        status: 'pending',
        tags: '',
        bpm: '',
        key: '',
        credits: '',
        license_type: 'standard',
        copyright_owner: '',
        composer: '',
        performer: '',
        producer: '',
        release_date: '',
        rights_statement: ''
    });

    useEffect(() => {
        if (id && token) {
            Promise.all([
                loadSound(),
                loadCategories()
            ]);
        }
    }, [id, token]);

    const loadSound = async () => {
        try {
            const response = await fetch(`/api/sounds/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.sound) {
                const soundData = data.sound;
                setSound(soundData);

                // Vérifier les permissions
                if (!canEditSound(soundData, user)) {
                    toast.error('Erreur', 'Vous n\'avez pas les permissions pour modifier ce son');
                    navigate('/dashboard');
                    return;
                }

                // Remplir le formulaire avec les données existantes
                setFormData({
                    title: soundData.title || '',
                    description: soundData.description || '',
                    category_id: soundData.category_id?.toString() || '',
                    genre: soundData.genre || '',
                    price: soundData.price?.toString() || '',
                    is_free: Boolean(soundData.is_free),
                    is_featured: Boolean(soundData.is_featured),
                    status: soundData.status || 'pending',
                    tags: Array.isArray(soundData.tags)
                        ? soundData.tags.join(', ')
                        : (typeof soundData.tags === 'string' ? soundData.tags : ''),
                    bpm: soundData.bpm?.toString() || '',
                    key: soundData.key || '',
                    credits: soundData.credits || '',
                    license_type: soundData.license_type || 'standard',
                    copyright_owner: soundData.copyright_owner || '',
                    composer: soundData.composer || '',
                    performer: soundData.performer || '',
                    producer: soundData.producer || '',
                    release_date: soundData.release_date ? soundData.release_date.split('T')[0] : '',
                    rights_statement: soundData.rights_statement || ''
                });
            } else {
                throw new Error(data.message || 'Son non trouvé');
            }
        } catch (error) {
            console.error('Erreur lors du chargement du son:', error);
            toast.error('Erreur', error.message || 'Impossible de charger le son');
            navigate('/dashboard');
        }
    };

    const loadCategories = async () => {
        try {
            const response = await fetch('/api/categories', {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && Array.isArray(data.categories)) {
                setCategories(data.categories.filter(cat => cat.is_active));
            } else {
                console.warn('Format de réponse inattendu pour les catégories:', data);
                setCategories([]);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des catégories:', error);
            toast.error('Attention', 'Impossible de charger les catégories');
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    const canEditSound = (sound, user) => {
        if (!user || !sound) return false;
        return user.role === 'admin' || user.id === sound.user_id;
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

        if (!formData.category_id) {
            newErrors.category_id = 'La catégorie est requise';
        }

        if (!formData.genre.trim()) {
            newErrors.genre = 'Le genre est requis';
        }

        if (!formData.is_free && (!formData.price || parseFloat(formData.price) <= 0)) {
            newErrors.price = 'Le prix est requis pour un son payant';
        }

        if (formData.bpm && (parseInt(formData.bpm) < 60 || parseInt(formData.bpm) > 200)) {
            newErrors.bpm = 'Le BPM doit être entre 60 et 200';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Erreur', 'Veuillez corriger les erreurs du formulaire');
            return;
        }

        setSaving(true);

        try {
            const submitData = {
                ...formData,
                tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : [],
                price: formData.is_free ? 0 : parseFloat(formData.price) || 0,
                bpm: formData.bpm ? parseInt(formData.bpm) : null,
                category_id: parseInt(formData.category_id)
            };

            const response = await fetch(`/api/sounds/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(submitData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success('Succès', 'Son mis à jour avec succès');
                navigate('/dashboard?tab=sounds');
            } else {
                if (data.errors) {
                    setErrors(data.errors);
                }
                throw new Error(data.message || 'Impossible de mettre à jour le son');
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            toast.error('Erreur', error.message || 'Erreur de connexion au serveur');
        } finally {
            setSaving(false);
        }
    };

    const licenseTypes = [
        { value: 'standard', label: 'License Standard' },
        { value: 'premium', label: 'License Premium' },
        { value: 'exclusive', label: 'License Exclusive' },
        { value: 'royalty_free', label: 'Libre de droits' },
        { value: 'creative_commons', label: 'Creative Commons' }
    ];

    const statuses = [
        { value: 'draft', label: 'Brouillon' },
        { value: 'pending', label: 'En attente' },
        { value: 'published', label: 'Publié' }
    ];

    const musicalKeys = [
        'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'
    ];

    if (loading) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ paddingTop: '80px' }}>
                <div className="text-center">
                    <Spinner animation="border" variant="primary" size="lg" className="mb-3" />
                    <h5 className="text-muted">Chargement du son...</h5>
                </div>
            </div>
        );
    }

    if (!sound) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ paddingTop: '80px' }}>
                <div className="text-center">
                    <h5 className="text-danger">Son introuvable</h5>
                    <p className="text-muted">Le son demandé n'existe pas ou a été supprimé.</p>
                    <Button
                        variant="primary"
                        onClick={() => navigate('/dashboard')}
                    >
                        Retour au tableau de bord
                    </Button>
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
                            <FontAwesomeIcon icon={faMusic} className="me-2 text-primary" />
                            Modifier le son
                        </h2>
                        <p className="text-muted mb-0">Modifiez les informations de votre son</p>
                    </div>
                    <Button
                        variant="outline-secondary"
                        onClick={() => navigate('/dashboard?tab=sounds')}
                    >
                        <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                        Retour
                    </Button>
                </div>

                {/* Info du son actuel */}
                <Card className="border-0 shadow-sm mb-4">
                    <Card.Body>
                        <Row className="align-items-center">
                            <Col md={2}>
                                <img
                                    src={sound.cover_image_url || sound.cover || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop`}
                                    alt={sound.title}
                                    className="rounded"
                                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                />
                            </Col>
                            <Col md={6}>
                                <h5 className="fw-bold mb-1">{sound.title}</h5>
                                <p className="text-muted mb-1">{sound.genre}</p>
                                <div className="d-flex align-items-center gap-2">
                                    <Badge bg="light" text="dark">
                                        <FontAwesomeIcon icon={faPlay} className="me-1" />
                                        {sound.plays_count || 0} écoutes
                                    </Badge>
                                    <Badge bg="light" text="dark">
                                        <FontAwesomeIcon icon={faClock} className="me-1" />
                                        {sound.duration || sound.formatted_duration || 'N/A'}
                                    </Badge>
                                </div>
                            </Col>
                            <Col md={4} className="text-end">
                                <div className="fw-bold text-success mb-1">
                                    {sound.is_free ? 'Gratuit' : `${sound.price || 0} XAF`}
                                </div>
                                <Badge bg={sound.status === 'published' ? 'success' : 'warning'}>
                                    {sound.status === 'published' ? 'Publié' :
                                     sound.status === 'pending' ? 'En attente' : 'Brouillon'}
                                </Badge>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

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
                                                <Form.Label>Titre du son *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="title"
                                                    value={formData.title}
                                                    onChange={handleChange}
                                                    isInvalid={!!errors.title}
                                                    placeholder="Titre de votre son"
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
                                                    rows={3}
                                                    name="description"
                                                    value={formData.description}
                                                    onChange={handleChange}
                                                    isInvalid={!!errors.description}
                                                    placeholder="Décrivez votre son..."
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
                                                    name="category_id"
                                                    value={formData.category_id}
                                                    onChange={handleChange}
                                                    isInvalid={!!errors.category_id}
                                                >
                                                    <option value="">Sélectionner une catégorie</option>
                                                    {categories.map(cat => (
                                                        <option key={cat.id} value={cat.id}>
                                                            {cat.name}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.category_id}
                                                </Form.Control.Feedback>
                                                {categories.length === 0 && (
                                                    <Form.Text className="text-warning">
                                                        Aucune catégorie disponible. Contactez l'administrateur.
                                                    </Form.Text>
                                                )}
                                            </Form.Group>
                                        </Col>

                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Genre *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="genre"
                                                    value={formData.genre}
                                                    onChange={handleChange}
                                                    isInvalid={!!errors.genre}
                                                    placeholder="Ex: Afrobeat, Hip-Hop, etc."
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.genre}
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

                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Tags</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="tags"
                                                    value={formData.tags}
                                                    onChange={handleChange}
                                                    placeholder="Séparez par des virgules"
                                                />
                                                <Form.Text className="text-muted">
                                                    Ex: beat, instrumental, sample
                                                </Form.Text>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Informations techniques */}
                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Header className="bg-white border-bottom">
                                    <h5 className="fw-bold mb-0">
                                        <FontAwesomeIcon icon={faClock} className="me-2 text-primary" />
                                        Informations techniques
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row className="g-3">
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>BPM (Battements par minute)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="bpm"
                                                    value={formData.bpm}
                                                    onChange={handleChange}
                                                    isInvalid={!!errors.bpm}
                                                    placeholder="Ex: 120"
                                                    min="60"
                                                    max="200"
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.bpm}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>

                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Tonalité</Form.Label>
                                                <Form.Select
                                                    name="key"
                                                    value={formData.key}
                                                    onChange={handleChange}
                                                >
                                                    <option value="">Sélectionner une tonalité</option>
                                                    {musicalKeys.map(key => (
                                                        <option key={key} value={key}>
                                                            {key}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>

                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label>Crédits</Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={2}
                                                    name="credits"
                                                    value={formData.credits}
                                                    onChange={handleChange}
                                                    placeholder="Crédits et collaborateurs..."
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Tarification */}
                            <Card className="border-0 shadow-sm">
                                <Card.Header className="bg-white border-bottom">
                                    <h5 className="fw-bold mb-0">
                                        <FontAwesomeIcon icon={faEuroSign} className="me-2 text-primary" />
                                        Tarification et options
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row className="g-3">
                                        <Col md={6}>
                                            <Form.Group>
                                                <div className="d-flex align-items-center mb-2">
                                                    <Form.Check
                                                        type="checkbox"
                                                        name="is_free"
                                                        checked={formData.is_free}
                                                        onChange={handleChange}
                                                        label="Son gratuit"
                                                        className="me-3"
                                                    />
                                                    <Form.Check
                                                        type="checkbox"
                                                        name="is_featured"
                                                        checked={formData.is_featured}
                                                        onChange={handleChange}
                                                        label="Son mis en avant"
                                                        disabled={user?.role !== 'admin'}
                                                    />
                                                </div>
                                                {!formData.is_free && (
                                                    <>
                                                        <Form.Label>Prix (XAF) *</Form.Label>
                                                        <Form.Control
                                                            type="number"
                                                            name="price"
                                                            value={formData.price}
                                                            onChange={handleChange}
                                                            isInvalid={!!errors.price}
                                                            placeholder="Prix en Francs CFA"
                                                            min="0"
                                                        />
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.price}
                                                        </Form.Control.Feedback>
                                                    </>
                                                )}
                                            </Form.Group>
                                        </Col>

                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Type de license</Form.Label>
                                                <Form.Select
                                                    name="license_type"
                                                    value={formData.license_type}
                                                    onChange={handleChange}
                                                >
                                                    {licenseTypes.map(license => (
                                                        <option key={license.value} value={license.value}>
                                                            {license.label}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Sidebar */}
                        <Col lg={4}>
                            {/* Informations d'auteur */}
                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Header className="bg-white border-bottom">
                                    <h5 className="fw-bold mb-0">
                                        <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                                        Informations d'auteur
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Compositeur</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="composer"
                                            value={formData.composer}
                                            onChange={handleChange}
                                            placeholder="Nom du compositeur"
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Interprète</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="performer"
                                            value={formData.performer}
                                            onChange={handleChange}
                                            placeholder="Nom de l'interprète"
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Producteur</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="producer"
                                            value={formData.producer}
                                            onChange={handleChange}
                                            placeholder="Nom du producteur"
                                        />
                                    </Form.Group>

                                    <Form.Group>
                                        <Form.Label>Date de sortie</Form.Label>
                                        <Form.Control
                                            type="date"
                                            name="release_date"
                                            value={formData.release_date}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>
                                </Card.Body>
                            </Card>

                            {/* Droits d'auteur */}
                            <Card className="border-0 shadow-sm">
                                <Card.Header className="bg-white border-bottom">
                                    <h5 className="fw-bold mb-0">Droits d'auteur</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Propriétaire des droits</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="copyright_owner"
                                            value={formData.copyright_owner}
                                            onChange={handleChange}
                                            placeholder="Nom du propriétaire"
                                        />
                                    </Form.Group>

                                    <Form.Group>
                                        <Form.Label>Déclaration de droits</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            name="rights_statement"
                                            value={formData.rights_statement}
                                            onChange={handleChange}
                                            placeholder="Informations sur les droits d'utilisation..."
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
                            onClick={() => navigate('/dashboard?tab=sounds')}
                            disabled={saving}
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

export default EditSound;
