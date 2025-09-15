import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, ProgressBar, Badge, Modal, Spinner } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faVideo,
    faUpload,
    faArrowLeft,
    faPlay,
    faImage,
    faMusic,
    faTag,
    faUser,
    faCalendarAlt,
    faCheck,
    faTimes,
    faInfoCircle,
    faTrophy,
    faAward,
    faStar,
    faCrown,
    faEye,
    faEdit,
    faHeart,
    faMicrophone,
    faDrum,
    faHeartbeat,
    faHandsPraying,
    faBolt,
    faUsers,
    faSmile,
    faFire,
    faCloud,
    faLeaf,
    faRocket
} from '@fortawesome/free-solid-svg-icons';
import { AnimatedElement } from '../common/PageTransition';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import CategoryBadge from '../common/CategoryBadge';

const AddClip = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const { user, token } = useAuth();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        tags: '',
        video_file: null,
        thumbnail_file: null,
        credits: {
            director: '',
            producer: '',
            cinematographer: '',
            editor: ''
        }
    });

    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [errors, setErrors] = useState({});
    const [videoPreview, setVideoPreview] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    // États pour l'approbation et prévisualisation
    const [showPreview, setShowPreview] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [approvalStep, setApprovalStep] = useState(1);
    const [previewData, setPreviewData] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoadingCategories(true);
            const response = await fetch('/api/clips/categories');
            const result = await response.json();

            if (response.ok) {
                setCategories(result.categories || []);
            } else {
                throw new Error('Erreur lors du chargement des catégories');
            }
        } catch (error) {
            console.error('Erreur catégories:', error);
            toast?.error('Erreur', 'Impossible de charger les catégories');
            // Fallback
            setCategories([
                { name: 'Afrobeat', color: '#FF6B35', icon: 'faHeart' },
                { name: 'Rap', color: '#4ECDC4', icon: 'faMicrophone' },
                { name: 'Makossa', color: '#45B7D1', icon: 'faMusic' },
                { name: 'Gospel', color: '#DDA0DD', icon: 'faHandsPraying' }
            ]);
        } finally {
            setLoadingCategories(false);
        }
    };

    const getCategoryIcon = (iconName) => {
        const iconMap = {
            faHeart, faMicrophone, faMusic, faDrum, faHeartbeat,
            faHandsPraying, faBolt, faUsers, faSmile, faFire,
            faCloud, faLeaf, faStar
        };
        return iconMap[iconName] || faMusic;
    };

    const getCategoryStyle = (categoryName) => {
        const category = categories.find(cat => cat.name === categoryName);
        return category ? {
            backgroundColor: category.color + '20',
            borderColor: category.color,
            color: category.color
        } : {};
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('credits.')) {
            const creditField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                credits: {
                    ...prev.credits,
                    [creditField]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }

        // Effacer l'erreur pour ce champ
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        const file = files[0];

        if (file) {
            setFormData(prev => ({
                ...prev,
                [name]: file
            }));

            // Créer un aperçu
            const reader = new FileReader();
            reader.onload = (event) => {
                if (name === 'video_file') {
                    setVideoPreview(event.target.result);
                } else if (name === 'thumbnail_file') {
                    setThumbnailPreview(event.target.result);
                }
            };
            reader.readAsDataURL(file);
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

        if (!formData.category) {
            newErrors.category = 'La catégorie est requise';
        }

        if (!formData.video_file) {
            newErrors.video_file = 'Le fichier vidéo est requis';
        }

        if (!formData.thumbnail_file) {
            newErrors.thumbnail_file = 'La miniature est requise';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePreview = () => {
        if (!validateForm()) {
            toast?.error('Erreur', 'Veuillez corriger les erreurs dans le formulaire');
            return;
        }

        // Trouver l'objet catégorie complet à partir du nom sélectionné
        const selectedCategory = categories.find(cat => cat.name === formData.category);

        setPreviewData({
            ...formData,
            videoPreview,
            thumbnailPreview,
            selectedCategory // Utiliser selectedCategory au lieu de category
        });
        setShowPreview(true);
    };

    const handleApproval = () => {
        setShowPreview(false);
        setShowApprovalModal(true);
        setApprovalStep(1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast?.error('Erreur', 'Veuillez corriger les erreurs dans le formulaire');
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            // Créer un FormData pour l'upload
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('category', formData.category);
            formDataToSend.append('tags', formData.tags);
            formDataToSend.append('video_file', formData.video_file);
            formDataToSend.append('thumbnail_file', formData.thumbnail_file);

            // Ajouter les crédits s'ils existent
            if (formData.credits.director) formDataToSend.append('credits[director]', formData.credits.director);
            if (formData.credits.producer) formDataToSend.append('credits[producer]', formData.credits.producer);
            if (formData.credits.cinematographer) formDataToSend.append('credits[cinematographer]', formData.credits.cinematographer);
            if (formData.credits.editor) formDataToSend.append('credits[editor]', formData.credits.editor);

            // Simulation de progression pour l'UX
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) return prev;
                    return prev + Math.random() * 10;
                });
            }, 200);

            // Appel API
            const response = await fetch('/api/clips', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: formDataToSend
            });

            clearInterval(progressInterval);
            setUploadProgress(100);

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Erreur lors de la création du clip');
            }

            setShowApprovalModal(false);
            toast?.success('Succès', result.message || 'Votre clip a été ajouté avec succès !');
            navigate('/clips');

        } catch (error) {
            console.error('Erreur lors de l\'upload:', error);
            toast?.error('Erreur', error.message || 'Une erreur est survenue lors de l\'upload');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const getRewardInfo = () => {
        return [
            { type: 'Bronze', icon: faTrophy, threshold: '10K+', color: '#cd7f32' },
            { type: 'Argent', icon: faStar, threshold: '50K+', color: '#c0c0c0' },
            { type: 'Or', icon: faAward, threshold: '100K+', color: '#ffd700' },
            { type: 'Platine', icon: faTrophy, threshold: '500K+', color: '#e5e4e2' },
            { type: 'Diamant', icon: faCrown, threshold: '1M+', color: '#00d4ff' }
        ];
    };

    return (
        <div className="min-vh-100 bg-light avoid-header-overlap">
            <Container className="py-4">
                {/* Navigation */}
                <AnimatedElement animation="slideInLeft" delay={100}>
                    <Button
                        as={Link}
                        to="/clips"
                        variant="outline-primary"
                        className="mb-4"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                        Retour aux clips
                    </Button>
                </AnimatedElement>

                <Row className="justify-content-center">
                    <Col lg={8}>
                        {/* En-tête */}
                        <AnimatedElement animation="slideInUp" delay={200}>
                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Body className="text-center py-5">
                                    <FontAwesomeIcon icon={faVideo} size="3x" className="text-primary mb-3" />
                                    <h1 className="h3 fw-bold mb-2">Ajouter un clip vidéo</h1>
                                    <p className="text-muted mb-0">
                                        Partagez votre créativité avec la communauté et gagnez des récompenses !
                                    </p>
                                </Card.Body>
                            </Card>
                        </AnimatedElement>

                        {/* Système de récompenses */}
                        <AnimatedElement animation="slideInUp" delay={300}>
                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Body>
                                    <h5 className="fw-bold mb-3">
                                        <FontAwesomeIcon icon={faTrophy} className="me-2 text-warning" />
                                        Système de récompenses
                                    </h5>
                                    <p className="text-muted mb-3">
                                        Votre clip peut gagner des récompenses basées sur le nombre de vues :
                                    </p>
                                    <Row className="g-2">
                                        {getRewardInfo().map((reward, index) => (
                                            <Col key={index} xs={6} md={2}>
                                                <div className="text-center p-2">
                                                    <FontAwesomeIcon
                                                        icon={reward.icon}
                                                        style={{ color: reward.color }}
                                                        className="mb-1"
                                                    />
                                                    <div className="small fw-bold">{reward.type}</div>
                                                    <div className="small text-muted">{reward.threshold}</div>
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                </Card.Body>
                            </Card>
                        </AnimatedElement>

                        {/* Formulaire */}
                        <AnimatedElement animation="slideInUp" delay={400}>
                            <Card className="border-0 shadow-sm">
                                <Card.Body className="p-4">
                                    <Form onSubmit={handleSubmit}>
                                        {/* Informations de base */}
                                        <div className="mb-4">
                                            <h6 className="fw-bold mb-3">
                                                <FontAwesomeIcon icon={faInfoCircle} className="me-2 text-primary" />
                                                Informations de base
                                            </h6>

                                            <Row className="g-3">
                                                <Col md={12}>
                                                    <Form.Group>
                                                        <Form.Label className="fw-bold">Titre du clip *</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            name="title"
                                                            value={formData.title}
                                                            onChange={handleInputChange}
                                                            placeholder="Ex: Mon nouveau clip..."
                                                            isInvalid={!!errors.title}
                                                        />
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.title}
                                                        </Form.Control.Feedback>
                                                    </Form.Group>
                                                </Col>

                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label className="fw-bold">Catégorie *</Form.Label>
                                                        <Form.Select
                                                            name="category"
                                                            value={formData.category}
                                                            onChange={handleInputChange}
                                                            isInvalid={!!errors.category}
                                                            style={getCategoryStyle(formData.category)}
                                                        >
                                                            <option value="">Choisir une catégorie</option>
                                                            {loadingCategories ? (
                                                                <option disabled>Chargement...</option>
                                                            ) : (
                                                                categories.map(cat => (
                                                                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                                                                ))
                                                            )}
                                                        </Form.Select>
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.category}
                                                        </Form.Control.Feedback>
                                                    </Form.Group>
                                                </Col>

                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label className="fw-bold">Tags</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            name="tags"
                                                            value={formData.tags}
                                                            onChange={handleInputChange}
                                                            placeholder="Ex: cameroun, musique, culture..."
                                                        />
                                                        <Form.Text className="text-muted">
                                                            Séparez les tags par des virgules
                                                        </Form.Text>
                                                    </Form.Group>
                                                </Col>

                                                <Col md={12}>
                                                    <Form.Group>
                                                        <Form.Label className="fw-bold">Description *</Form.Label>
                                                        <Form.Control
                                                            as="textarea"
                                                            rows={4}
                                                            name="description"
                                                            value={formData.description}
                                                            onChange={handleInputChange}
                                                            placeholder="Décrivez votre clip..."
                                                            isInvalid={!!errors.description}
                                                        />
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.description}
                                                        </Form.Control.Feedback>
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                        </div>

                                        {/* Fichiers */}
                                        <div className="mb-4">
                                            <h6 className="fw-bold mb-3">
                                                <FontAwesomeIcon icon={faUpload} className="me-2 text-primary" />
                                                Fichiers
                                            </h6>

                                            <Row className="g-3">
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label className="fw-bold">Fichier vidéo *</Form.Label>
                                                        <Form.Control
                                                            type="file"
                                                            name="video_file"
                                                            accept="video/*"
                                                            onChange={handleFileChange}
                                                            isInvalid={!!errors.video_file}
                                                        />
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.video_file}
                                                        </Form.Control.Feedback>
                                                        <Form.Text className="text-muted">
                                                            Formats acceptés: MP4, AVI, MOV (max 500MB)
                                                        </Form.Text>

                                                        {videoPreview && (
                                                            <div className="mt-2">
                                                                <video
                                                                    src={videoPreview}
                                                                    controls
                                                                    className="img-fluid rounded"
                                                                    style={{ maxHeight: '200px' }}
                                                                />
                                                            </div>
                                                        )}
                                                    </Form.Group>
                                                </Col>

                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label className="fw-bold">Miniature *</Form.Label>
                                                        <Form.Control
                                                            type="file"
                                                            name="thumbnail_file"
                                                            accept="image/*"
                                                            onChange={handleFileChange}
                                                            isInvalid={!!errors.thumbnail_file}
                                                        />
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.thumbnail_file}
                                                        </Form.Control.Feedback>
                                                        <Form.Text className="text-muted">
                                                            Formats acceptés: JPG, PNG (max 5MB)
                                                        </Form.Text>

                                                        {thumbnailPreview && (
                                                            <div className="mt-2">
                                                                <img
                                                                    src={thumbnailPreview}
                                                                    alt="Aperçu miniature"
                                                                    className="img-fluid rounded"
                                                                    style={{ maxHeight: '150px' }}
                                                                />
                                                            </div>
                                                        )}
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                        </div>

                                        {/* Crédits */}
                                        <div className="mb-4">
                                            <h6 className="fw-bold mb-3">
                                                <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                                                Crédits (optionnel)
                                            </h6>

                                            <Row className="g-3">
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Réalisateur</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            name="credits.director"
                                                            value={formData.credits.director}
                                                            onChange={handleInputChange}
                                                            placeholder="Nom du réalisateur"
                                                        />
                                                    </Form.Group>
                                                </Col>

                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Producteur</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            name="credits.producer"
                                                            value={formData.credits.producer}
                                                            onChange={handleInputChange}
                                                            placeholder="Nom du producteur"
                                                        />
                                                    </Form.Group>
                                                </Col>

                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Directeur photo</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            name="credits.cinematographer"
                                                            value={formData.credits.cinematographer}
                                                            onChange={handleInputChange}
                                                            placeholder="Nom du directeur photo"
                                                        />
                                                    </Form.Group>
                                                </Col>

                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Monteur</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            name="credits.editor"
                                                            value={formData.credits.editor}
                                                            onChange={handleInputChange}
                                                            placeholder="Nom du monteur"
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                        </div>

                                        {/* Progress bar pendant l'upload */}
                                        {uploading && (
                                            <div className="mb-4">
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <span className="fw-bold">Upload en cours...</span>
                                                    <span>{Math.round(uploadProgress)}%</span>
                                                </div>
                                                <ProgressBar
                                                    now={uploadProgress}
                                                    variant="primary"
                                                    animated
                                                />
                                            </div>
                                        )}

                                        {/* Boutons */}
                                        <div className="d-flex gap-3 justify-content-end">
                                            <Button
                                                variant="outline-secondary"
                                                onClick={() => navigate('/clips')}
                                                disabled={uploading}
                                            >
                                                <FontAwesomeIcon icon={faTimes} className="me-2" />
                                                Annuler
                                            </Button>
                                            <Button
                                                variant="info"
                                                onClick={handlePreview}
                                                disabled={uploading || !formData.title || !formData.video_file}
                                            >
                                                <FontAwesomeIcon icon={faEye} className="me-2" />
                                                Prévisualiser
                                            </Button>
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                disabled={uploading}
                                            >
                                                <FontAwesomeIcon icon={uploading ? faUpload : faCheck} className="me-2" />
                                                {uploading ? 'Upload en cours...' : 'Publier le clip'}
                                            </Button>
                                        </div>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </AnimatedElement>
                    </Col>

                    {/* Sidebar avec conseils */}
                    <Col lg={4}>
                        <AnimatedElement animation="slideInRight" delay={500}>
                            <Card className="border-0 shadow-sm">
                                <Card.Header className="bg-primary text-white">
                                    <h6 className="fw-bold mb-0">
                                        <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                                        Conseils pour un bon clip
                                    </h6>
                                </Card.Header>
                                <Card.Body>
                                    <div className="mb-3">
                                        <h6 className="fw-bold">
                                            <FontAwesomeIcon icon={faVideo} className="me-2 text-primary" />
                                            Qualité vidéo
                                        </h6>
                                        <ul className="small text-muted mb-0">
                                            <li>Résolution minimum: 720p</li>
                                            <li>Format recommandé: MP4</li>
                                            <li>Durée: 30 secondes à 10 minutes</li>
                                        </ul>
                                    </div>

                                    <div className="mb-3">
                                        <h6 className="fw-bold">
                                            <FontAwesomeIcon icon={faImage} className="me-2 text-success" />
                                            Miniature
                                        </h6>
                                        <ul className="small text-muted mb-0">
                                            <li>Ratio 16:9 recommandé</li>
                                            <li>Image claire et attrayante</li>
                                            <li>Évitez le texte trop petit</li>
                                        </ul>
                                    </div>

                                    <div className="mb-3">
                                        <h6 className="fw-bold">
                                            <FontAwesomeIcon icon={faTag} className="me-2 text-warning" />
                                            Tags et description
                                        </h6>
                                        <ul className="small text-muted mb-0">
                                            <li>Utilisez des mots-clés pertinents</li>
                                            <li>Décrivez le contenu clairement</li>
                                            <li>Mentionnez le genre musical</li>
                                        </ul>
                                    </div>

                                    <Alert variant="info" className="small">
                                        <FontAwesomeIcon icon={faTrophy} className="me-2" />
                                        Plus votre clip est de qualité, plus il a de chances d'obtenir des vues et des récompenses !
                                    </Alert>
                                </Card.Body>
                            </Card>
                        </AnimatedElement>
                    </Col>
                </Row>
            </Container>

            {/* Modal de prévisualisation */}
            <Modal show={showPreview} onHide={() => setShowPreview(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FontAwesomeIcon icon={faEye} className="me-2" />
                        Prévisualisation du clip
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {previewData && (
                        <div>
                            <Row className="g-3">
                                <Col md={6}>
                                    {previewData.videoPreview && (
                                        <div>
                                            <h6 className="fw-bold mb-2">Vidéo</h6>
                                            <video
                                                src={previewData.videoPreview}
                                                controls
                                                className="w-100 rounded"
                                                style={{ maxHeight: '250px' }}
                                            />
                                        </div>
                                    )}
                                </Col>
                                <Col md={6}>
                                    {previewData.thumbnailPreview && (
                                        <div>
                                            <h6 className="fw-bold mb-2">Miniature</h6>
                                            <img
                                                src={previewData.thumbnailPreview}
                                                alt="Miniature"
                                                className="w-100 rounded"
                                                style={{ maxHeight: '250px', objectFit: 'cover' }}
                                            />
                                        </div>
                                    )}
                                </Col>
                            </Row>

                            <hr />

                            <div className="mb-3">
                                <h5 className="fw-bold">{previewData.title}</h5>
                                {previewData.selectedCategory && (
                                    <CategoryBadge
                                        category={previewData.selectedCategory}
                                    />
                                )}
                                <p className="text-muted">{previewData.description}</p>
                                {previewData.tags && (
                                    <div>
                                        <small className="text-muted">Tags: {previewData.tags}</small>
                                    </div>
                                )}
                            </div>

                            {(previewData.credits.director || previewData.credits.producer ||
                              previewData.credits.cinematographer || previewData.credits.editor) && (
                                <div>
                                    <h6 className="fw-bold">Crédits</h6>
                                    <ul className="list-unstyled small text-muted">
                                        {previewData.credits.director &&
                                            <li><strong>Réalisateur:</strong> {previewData.credits.director}</li>}
                                        {previewData.credits.producer &&
                                            <li><strong>Producteur:</strong> {previewData.credits.producer}</li>}
                                        {previewData.credits.cinematographer &&
                                            <li><strong>Directeur photo:</strong> {previewData.credits.cinematographer}</li>}
                                        {previewData.credits.editor &&
                                            <li><strong>Monteur:</strong> {previewData.credits.editor}</li>}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={() => setShowPreview(false)}>
                        <FontAwesomeIcon icon={faEdit} className="me-2" />
                        Modifier
                    </Button>
                    <Button variant="success" onClick={handleApproval}>
                        <FontAwesomeIcon icon={faCheck} className="me-2" />
                        Approuver et publier
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal d'approbation finale */}
            <Modal show={showApprovalModal} onHide={() => setShowApprovalModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FontAwesomeIcon icon={faCheck} className="me-2" />
                        Confirmation de publication
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {approvalStep === 1 && (
                        <div className="text-center">
                            <FontAwesomeIcon icon={faCheck} size="3x" className="text-success mb-3" />
                            <h5>Êtes-vous sûr de vouloir publier ce clip ?</h5>
                            <p className="text-muted">
                                Une fois publié, votre clip sera visible par tous les utilisateurs de la plateforme.
                            </p>
                            <Alert variant="info" className="text-start">
                                <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                                <strong>Rappel :</strong> Assurez-vous que votre contenu respecte nos
                                conditions d'utilisation et ne contient aucun élément inapproprié.
                            </Alert>
                        </div>
                    )}

                    {uploading && (
                        <div className="text-center">
                            <Spinner animation="border" variant="primary" className="mb-3" />
                            <h5>Publication en cours...</h5>
                            <ProgressBar now={uploadProgress} className="mb-3" />
                            <p className="text-muted">Veuillez patienter pendant l'upload de votre clip</p>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    {!uploading && (
                        <>
                            <Button variant="outline-secondary" onClick={() => setShowApprovalModal(false)}>
                                Annuler
                            </Button>
                            <Button variant="success" onClick={handleSubmit}>
                                <FontAwesomeIcon icon={faRocket} className="me-2" />
                                Confirmer la publication
                            </Button>
                        </>
                    )}
                </Modal.Footer>
            </Modal>

            <style jsx>{`
                .upload-area {
                    border: 2px dashed #dee2e6;
                    border-radius: 10px;
                    padding: 40px 20px;
                    text-align: center;
                    transition: all 0.3s ease;
                    cursor: pointer;
                }

                .upload-area:hover {
                    border-color: #667eea;
                    background: rgba(102, 126, 234, 0.05);
                }

                .upload-area.dragover {
                    border-color: #667eea;
                    background: rgba(102, 126, 234, 0.1);
                }

                .form-control:focus {
                    border-color: #667eea;
                    box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
                }

                .form-select:focus {
                    border-color: #667eea;
                    box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
                }

                .btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                }

                .btn-primary:hover {
                    background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
                    transform: translateY(-1px);
                }

                .progress {
                    height: 8px;
                    border-radius: 4px;
                }

                .progress-bar {
                    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                }

                .category-badge {
                    font-weight: 600;
                    padding: 8px 12px;
                    border-radius: 8px;
                    border: 2px solid currentColor;
                }

                .modal-preview .video-container {
                    position: relative;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }

                .modal-preview .thumbnail-container {
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }

                .category-select {
                    border-radius: 8px;
                    transition: all 0.3s ease;
                }

                .category-select:focus {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
                }

                .credit-section {
                    background: linear-gradient(145deg, #f8f9ff 0%, #ffffff 100%);
                    border-radius: 12px;
                    padding: 20px;
                    border: 1px solid #e9ecef;
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .upload-area {
                        padding: 30px 15px;
                    }

                    .modal-preview .video-container,
                    .modal-preview .thumbnail-container {
                        margin-bottom: 20px;
                    }
                }
            `}</style>
        </div>
    );
};

export default AddClip;
