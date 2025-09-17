import React, { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, ProgressBar, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faMusic,
    faUpload,
    faPlay,
    faPause,
    faImage,
    faTag,
    faEuroSign,
    faArrowLeft,
    faArrowRight,
    faSave,
    faEye,
    faTimes,
    faSpinner,
    faInfoCircle,
    faShieldAlt,
    faCopyright,
    faQuestionCircle,
    faClock,
    faMapMarkerAlt,
    faFileAlt,
    faCheck,
    faCloudUpload
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import '../../../css/admin.css';

const AddSound = () => {
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const audioRef = useRef(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState('');
    const [categories, setCategories] = useState([]);
    const [stepValidation, setStepValidation] = useState({
        1: false, // Upload
        2: false, // Infos de base
        3: false, // Droits d'auteur
        4: false, // Licence et prix
        5: false  // Image et finalisation
    });

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category_id: '',
        genre: '',
        price: '',
        is_free: false,
        tags: [],
        bpm: '',
        key: '',
        credits: '',
        audio_file: null,
        cover_image: null,
        license_type: 'royalty_free',
        copyright_owner: '',
        composer: '',
        performer: '',
        producer: '',
        release_date: '',
        isrc_code: '',
        publishing_rights: '',
        usage_rights: [],
        commercial_use: true,
        attribution_required: false,
        modifications_allowed: true,
        distribution_allowed: true,
        license_duration: 'perpetual',
        territory: 'worldwide',
        rights_statement: ''
    });

    const [previews, setPreviews] = useState({
        audio: null,
        cover: null,
        audioDuration: 0
    });

    const [tagsInput, setTagsInput] = useState('');

    const steps = [
        {
            id: 1,
            title: 'Upload Audio',
            icon: faCloudUpload,
            description: 'Téléchargez votre fichier audio'
        },
        {
            id: 2,
            title: 'Informations',
            icon: faMusic,
            description: 'Titre, description et catégorie'
        },
        {
            id: 3,
            title: 'Droits d\'auteur',
            icon: faCopyright,
            description: 'Propriété intellectuelle'
        },
        {
            id: 4,
            title: 'Licence & Prix',
            icon: faShieldAlt,
            description: 'Type de licence et tarification'
        },
        {
            id: 5,
            title: 'Finalisation',
            icon: faImage,
            description: 'Image et publication'
        }
    ];

    const licenseTypes = {
        'royalty_free': {
            name: 'Libre de droits (Royalty-Free)',
            description: 'Utilisation illimitée après achat unique, idéal pour la plupart des projets',
            icon: faShieldAlt,
            color: 'success'
        },
        'creative_commons': {
            name: 'Creative Commons',
            description: 'Licence ouverte avec conditions spécifiques (attribution, partage, etc.)',
            icon: faCopyright,
            color: 'info'
        },
        'exclusive': {
            name: 'Licence exclusive',
            description: 'Droits exclusifs transférés à l\'acheteur, une seule vente possible',
            icon: faShieldAlt,
            color: 'warning'
        },
        'custom': {
            name: 'Licence personnalisée',
            description: 'Termes de licence spécifiques définis par l\'auteur',
            icon: faQuestionCircle,
            color: 'secondary'
        }
    };

    const usageRightsOptions = [
        { value: 'broadcast', label: 'Diffusion radio/TV', description: 'Utilisation en radio et télévision' },
        { value: 'streaming', label: 'Plateformes de streaming', description: 'Spotify, Apple Music, etc.' },
        { value: 'sync', label: 'Synchronisation', description: 'Films, publicités, jeux vidéo' },
        { value: 'live', label: 'Performances live', description: 'Concerts, événements en direct' },
        { value: 'remix', label: 'Remix/Sampling', description: 'Modification et échantillonnage autorisés' },
        { value: 'youtube', label: 'Monétisation YouTube', description: 'Utilisation dans du contenu monétisé' }
    ];

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        validateCurrentStep();
    }, [formData, currentStep]);

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/sounds/categories/list', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();
                setCategories(data.categories);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des catégories:', error);
        } finally {
            setCategoriesLoading(false);
        }
    };

    const validateCurrentStep = () => {
        let isValid = false;

        switch (currentStep) {
            case 1: // Upload audio
                isValid = !!formData.audio_file;
                break;
            case 2: // Informations de base
                isValid = !!(formData.title.trim() && formData.category_id);
                break;
            case 3: // Droits d'auteur
                isValid = !!(formData.copyright_owner.trim() && formData.composer.trim());
                break;
            case 4: // Licence et prix
                isValid = !!(formData.license_type && (formData.is_free || (formData.price && formData.price > 0)));
                break;
            case 5: // Finalisation
                isValid = true; // Image optionnelle
                break;
        }

        setStepValidation(prev => ({
            ...prev,
            [currentStep]: isValid
        }));
    };

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

        if (name === 'tags') {
            setTagsInput(value);
            const tagsArray = value.split(',').map(tag => tag.trim()).filter(tag => tag);
            setFormData(prev => ({
                ...prev,
                tags: tagsArray
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

    const handleUsageRightsChange = (rightValue, checked) => {
        setFormData(prev => ({
            ...prev,
            usage_rights: checked
                ? [...prev.usage_rights, rightValue]
                : prev.usage_rights.filter(r => r !== rightValue)
        }));
    };

    const handleFileUpload = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        if (type === 'audio') {
            const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/aac'];
            if (!validTypes.includes(file.type)) {
                setErrors(prev => ({ ...prev, audio_file: 'Format audio non supporté. Utilisez MP3, WAV, M4A ou AAC.' }));
                return;
            }

            if (file.size > 20 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, audio_file: 'Le fichier audio ne doit pas dépasser 20MB.' }));
                return;
            }

            setFormData(prev => ({ ...prev, audio_file: file }));

            const audioUrl = URL.createObjectURL(file);
            setPreviews(prev => ({ ...prev, audio: audioUrl }));

            const audio = new Audio(audioUrl);
            audio.addEventListener('loadedmetadata', () => {
                setPreviews(prev => ({ ...prev, audioDuration: audio.duration }));
            });

            setErrors(prev => ({ ...prev, audio_file: '' }));

        } else if (type === 'cover') {
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!validTypes.includes(file.type)) {
                setErrors(prev => ({ ...prev, cover_image: 'Format d\'image non supporté. Utilisez JPG ou PNG.' }));
                return;
            }

            if (file.size > 2 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, cover_image: 'L\'image ne doit pas dépasser 2MB.' }));
                return;
            }

            setFormData(prev => ({ ...prev, cover_image: file }));

            const imageUrl = URL.createObjectURL(file);
            setPreviews(prev => ({ ...prev, cover: imageUrl }));

            setErrors(prev => ({ ...prev, cover_image: '' }));
        }
    };

    const toggleAudioPreview = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const removeFile = (type) => {
        if (type === 'audio') {
            setFormData(prev => ({ ...prev, audio_file: null }));
            setPreviews(prev => ({ ...prev, audio: null, audioDuration: 0 }));
            setIsPlaying(false);
        } else if (type === 'cover') {
            setFormData(prev => ({ ...prev, cover_image: null }));
            setPreviews(prev => ({ ...prev, cover: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) newErrors.title = 'Le titre est requis';
        if (!formData.category_id) newErrors.category_id = 'La catégorie est requise';
        if (!formData.is_free && (!formData.price || formData.price <= 0)) {
            newErrors.price = 'Le prix doit être supérieur à 0 pour un son payant';
        }
        if (!formData.audio_file) newErrors.audio_file = 'Le fichier audio est requis';
        if (!formData.copyright_owner || !formData.copyright_owner.trim()) {
            newErrors.copyright_owner = 'Le propriétaire des droits est requis';
        }
        if (!formData.composer || !formData.composer.trim()) {
            newErrors.composer = 'Le compositeur est requis';
        }

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
            if (formData.description) submitData.append('description', formData.description);
            submitData.append('category_id', formData.category_id);
            if (formData.genre) submitData.append('genre', formData.genre);
            submitData.append('is_free', formData.is_free ? '1' : '0');
            if (!formData.is_free && formData.price) {
                submitData.append('price', formData.price);
            }

            // Informations techniques
            if (formData.bpm && formData.bpm.trim()) submitData.append('bpm', formData.bpm.trim());
            if (formData.key && formData.key.trim()) {
                const cleanKey = formData.key.trim();
                if (cleanKey.length <= 20) {
                    submitData.append('key', cleanKey);
                }
            }
            if (formData.credits && formData.credits.trim()) submitData.append('credits', formData.credits.trim());

            // Informations de licence et droits d'auteur
            submitData.append('license_type', formData.license_type);
            submitData.append('copyright_owner', formData.copyright_owner.trim());
            submitData.append('composer', formData.composer.trim());
            if (formData.performer && formData.performer.trim()) submitData.append('performer', formData.performer.trim());
            if (formData.producer && formData.producer.trim()) submitData.append('producer', formData.producer.trim());
            if (formData.release_date) submitData.append('release_date', formData.release_date);
            if (formData.isrc_code && formData.isrc_code.trim()) {
                const cleanIsrc = formData.isrc_code.trim();
                if (cleanIsrc.length <= 20) {
                    submitData.append('isrc_code', cleanIsrc);
                }
            }

            // Droits d'utilisation
            submitData.append('commercial_use', formData.commercial_use ? '1' : '0');
            submitData.append('attribution_required', formData.attribution_required ? '1' : '0');
            submitData.append('modifications_allowed', formData.modifications_allowed ? '1' : '0');
            submitData.append('distribution_allowed', formData.distribution_allowed ? '1' : '0');
            submitData.append('license_duration', formData.license_duration);
            submitData.append('territory', formData.territory);
            if (formData.rights_statement) submitData.append('rights_statement', formData.rights_statement);

            // Tags
            if (formData.tags && formData.tags.length > 0) {
                formData.tags.forEach((tag, index) => {
                    submitData.append(`tags[${index}]`, tag);
                });
            }

            // Droits d'usage
            if (formData.usage_rights && formData.usage_rights.length > 0) {
                formData.usage_rights.forEach((right, index) => {
                    submitData.append(`usage_rights[${index}]`, right);
                });
            }

            // Fichiers
            if (formData.audio_file) {
                submitData.append('audio_file', formData.audio_file);
            }
            if (formData.cover_image) {
                submitData.append('cover_image', formData.cover_image);
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

            const response = await fetch('/api/sounds', {
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
                setSuccess('Son ajouté avec succès ! Il sera disponible après validation.');

                setTimeout(() => {
                    navigate('/profile');
                }, 2000);
            } else {
                if (data.errors) {
                    setErrors(data.errors);
                } else {
                    setErrors({ general: data.message || 'Erreur lors de l\'ajout du son' });
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
                return renderUploadStep();
            case 2:
                return renderBasicInfoStep();
            case 3:
                return renderCopyrightStep();
            case 4:
                return renderLicenseStep();
            case 5:
                return renderFinalizationStep();
            default:
                return null;
        }
    };

    const renderUploadStep = () => (
        <Card className="border-0 shadow-sm">
            <Card.Body className="p-5 text-center">
                <FontAwesomeIcon icon={faCloudUpload} size="4x" className="text-primary mb-4" />
                <h3 className="fw-bold mb-3">Téléchargez votre fichier audio</h3>
                <p className="text-muted mb-4">
                    Commencez par uploader votre création. Formats supportés : MP3, WAV, M4A, AAC (max 20MB)
                </p>

                {!formData.audio_file ? (
                    <div
                        className="upload-zone border-2 border-dashed rounded p-5"
                        style={{ borderColor: '#007bff', cursor: 'pointer', backgroundColor: '#f8f9fa' }}
                        onClick={() => document.getElementById('audioFile').click()}
                    >
                        <FontAwesomeIcon icon={faMusic} size="3x" className="text-primary mb-3" />
                        <h5 className="mb-2">Cliquez ici ou glissez votre fichier audio</h5>
                        <p className="text-muted mb-0">
                            Qualité recommandée : 320kbps ou plus<br/>
                            Durée recommandée : 30 secondes à 10 minutes
                        </p>
                        <Form.Control
                            id="audioFile"
                            type="file"
                            accept="audio/*"
                            onChange={(e) => handleFileUpload(e, 'audio')}
                            style={{ display: 'none' }}
                        />
                    </div>
                ) : (
                    <div className="bg-light rounded p-4">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <div className="d-flex align-items-center">
                                <FontAwesomeIcon icon={faMusic} className="text-success me-3" size="2x" />
                                <div className="text-start">
                                    <h5 className="mb-1">{formData.audio_file.name}</h5>
                                    <small className="text-muted">
                                        {(formData.audio_file.size / 1024 / 1024).toFixed(2)} MB
                                        {previews.audioDuration > 0 && ` • ${formatDuration(previews.audioDuration)}`}
                                    </small>
                                </div>
                            </div>
                        <Button
                                variant="outline-danger"
                                onClick={() => removeFile('audio')}
                                title="Supprimer le fichier"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                        </Button>
                        </div>
                        {previews.audio && (
                            <div className="d-flex gap-2">
                                <audio ref={audioRef} src={previews.audio} className="d-none" />
                                <Button
                                    variant="outline-primary"
                                    onClick={toggleAudioPreview}
                                    className="flex-grow-1"
                                >
                                    <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="me-2" />
                                    {isPlaying ? 'Pause' : 'Écouter l\'aperçu'}
                                </Button>
                    </div>
                        )}
            </div>
                )}

                {errors.audio_file && (
                    <Alert variant="danger" className="mt-3">
                        <FontAwesomeIcon icon={faTimes} className="me-2" />
                        {errors.audio_file}
                    </Alert>
                )}
            </Card.Body>
        </Card>
    );

    const renderBasicInfoStep = () => (
        <Card className="border-0 shadow-sm">
                                <Card.Header className="bg-white border-bottom-0">
                <h4 className="fw-bold mb-0">
                                        <FontAwesomeIcon icon={faMusic} className="me-2 text-primary" />
                    Informations de base
                </h4>
                <p className="text-muted mb-0">Décrivez votre son pour attirer vos auditeurs</p>
                                </Card.Header>
                                <Card.Body>
                <Row className="g-4">
                    <Col md={8}>
                                            <Form.Group>
                                                <Form.Label className="fw-medium">Titre du son *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="title"
                                                    value={formData.title}
                                                    onChange={handleInputChange}
                                                    placeholder="Ex: Rythme Afro Moderne 2024"
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
                                                {categoriesLoading ? (
                                                    <Form.Control as="div" className="d-flex align-items-center">
                                                        <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                                                        Chargement...
                                                    </Form.Control>
                                                ) : (
                                                    <Form.Select
                                                        name="category_id"
                                                        value={formData.category_id}
                                                        onChange={handleInputChange}
                                                        isInvalid={!!errors.category_id}
                                    size="lg"
                                                    >
                                    <option value="">Sélectionner</option>
                                                        {categories.map(cat => (
                                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                        ))}
                                                    </Form.Select>
                                                )}
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.category_id}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>
                                        <Col>
                                            <Form.Group>
                                                    <Form.Label className="fw-medium">Description</Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                rows={4}
                                                    name="description"
                                                    value={formData.description}
                                                    onChange={handleInputChange}
                                                    placeholder="Décrivez l'ambiance, le style et l'utilisation recommandée de votre son..."
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                    <Form.Label className="fw-medium">Genre musical</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="genre"
                                                    value={formData.genre}
                                                    onChange={handleInputChange}
                                                    placeholder="Ex: Afrobeat moderne"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                    <Form.Label className="fw-medium">BPM (Tempo)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="bpm"
                                                    value={formData.bpm}
                                                    onChange={handleInputChange}
                                                    placeholder="120"
                                                    min="60"
                                                    max="200"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                    <Form.Label className="fw-medium">Tonalité</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="key"
                                                    value={formData.key}
                                                    onChange={handleInputChange}
                                                    placeholder="Ex: Am, C#, F"
                                                />
                                            </Form.Group>
                                        </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label className="fw-medium">Tags (mots-clés)</Form.Label>
                            <Form.Control
                                type="text"
                                value={tagsInput}
                                onChange={(e) => handleInputChange({ target: { name: 'tags', value: e.target.value } })}
                                placeholder="afro, beat, danse, chill, commercial (séparés par des virgules)"
                            />
                            {formData.tags.length > 0 && (
                                <div className="mt-2">
                                    {formData.tags.map((tag, index) => (
                                        <Badge key={index} bg="secondary" className="me-1 mb-1">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
    );

    const renderCopyrightStep = () => (
        <Card className="border-0 shadow-sm">
                                <Card.Header className="bg-white border-bottom-0">
                <h4 className="fw-bold mb-0">
                                        <FontAwesomeIcon icon={faCopyright} className="me-2 text-warning" />
                    Droits d'auteur et crédits
                </h4>
                <p className="text-muted mb-0">Informations légales importantes sur la propriété du son</p>
                                </Card.Header>
                                <Card.Body>
                <Alert variant="info" className="mb-4">
                    <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                    Ces informations sont essentielles pour protéger vos droits et ceux des autres créateurs.
                </Alert>
                <Row className="g-4">
                                        <Col md={6}>
                                            <Form.Group>
                                                    <Form.Label className="fw-medium">Propriétaire des droits d'auteur *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="copyright_owner"
                                                    value={formData.copyright_owner}
                                                    onChange={handleInputChange}
                                                    placeholder="Ex: Jean Dupont ou Studio XYZ"
                                                    isInvalid={!!errors.copyright_owner}
                                size="lg"
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.copyright_owner}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                    <Form.Label className="fw-medium">Compositeur *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="composer"
                                                    value={formData.composer}
                                                    onChange={handleInputChange}
                                                    placeholder="Nom du compositeur"
                                                    isInvalid={!!errors.composer}
                                size="lg"
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.composer}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                    <Form.Label className="fw-medium">Interprète</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="performer"
                                                    value={formData.performer}
                                                    onChange={handleInputChange}
                                                    placeholder="Nom de l'artiste/groupe"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                    <Form.Label className="fw-medium">Producteur</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="producer"
                                                    value={formData.producer}
                                                    onChange={handleInputChange}
                                                    placeholder="Nom du producteur"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                    <Form.Label className="fw-medium">Date de sortie</Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    name="release_date"
                                                    value={formData.release_date}
                                                    onChange={handleInputChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                    <Form.Label className="fw-medium">Code ISRC</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="isrc_code"
                                                    value={formData.isrc_code}
                                                    onChange={handleInputChange}
                                                    placeholder="Ex: USUM71703692"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col>
                                            <Form.Group>
                                                    <Form.Label className="fw-medium">Crédits supplémentaires</Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                rows={3}
                                                    name="credits"
                                                    value={formData.credits}
                                                    onChange={handleInputChange}
                                                    placeholder="Ex: Mixage par John Smith, Mastering par XYZ Studio, Guitare par..."
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
    );

    const renderLicenseStep = () => (
        <div className="space-y-4">
                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Header className="bg-white border-bottom-0">
                    <h4 className="fw-bold mb-0">
                                        <FontAwesomeIcon icon={faShieldAlt} className="me-2 text-success" />
                        Type de licence
                    </h4>
                    <p className="text-muted mb-0">Définissez comment votre son peut être utilisé</p>
                                </Card.Header>
                                <Card.Body>
                                                {Object.entries(licenseTypes).map(([key, license]) => (
                                                    <div key={key} className="mb-3">
                                                        <Form.Check
                                                            type="radio"
                                                            name="license_type"
                                                            id={`license_${key}`}
                                                            value={key}
                                                            checked={formData.license_type === key}
                                                            onChange={handleInputChange}
                                                            label={
                                                                <div className="d-flex align-items-center">
                                                                    <FontAwesomeIcon
                                                                        icon={license.icon}
                                            className={`me-3 text-${license.color}`}
                                            size="lg"
                                                                    />
                                                                    <div>
                                                                        <div className="fw-medium">{license.name}</div>
                                                                        <small className="text-muted">{license.description}</small>
                                                                    </div>
                                                                </div>
                                                            }
                                                            className="border rounded p-3"
                                                        />
                                                    </div>
                                                ))}
                                </Card.Body>
                            </Card>

                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Header className="bg-white border-bottom-0">
                    <h4 className="fw-bold mb-0">
                        <FontAwesomeIcon icon={faEuroSign} className="me-2 text-success" />
                        Prix et disponibilité
                    </h4>
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
                                    label="💝 Son gratuit (recommandé pour débuter)"
                                    className="mb-3"
                                />
                            </Form.Group>
                        </Col>
                        {!formData.is_free && (
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-medium">Prix de vente (FCFA) *</Form.Label>
                                    <div className="input-group input-group-lg">
                                        <Form.Control
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            placeholder="Ex: 2500"
                                            min="0"
                                            step="500"
                                            isInvalid={!!errors.price}
                                        />
                                        <span className="input-group-text">FCFA</span>
                                        <Form.Control.Feedback type="invalid">
                                            {errors.price}
                                        </Form.Control.Feedback>
                                                </div>
                                    <Form.Text className="text-muted">
                                        Prix suggérés : Instrumentaux 1500-5000 FCFA, Complets 3000-10000 FCFA
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        )}
                    </Row>

                    <hr className="my-4" />

                    <h5 className="fw-bold mb-3">Droits d'utilisation</h5>
                    <Row className="g-3">
                                                    {usageRightsOptions.map((option) => (
                            <Col md={6} lg={4} key={option.value}>
                                                            <div className="border rounded p-3 h-100">
                                                                <Form.Check
                                                                    type="checkbox"
                                                                    id={`usage_${option.value}`}
                                                                    checked={formData.usage_rights.includes(option.value)}
                                                                    onChange={(e) => handleUsageRightsChange(option.value, e.target.checked)}
                                                                    label={
                                                                        <div>
                                                                            <div className="fw-medium text-primary">{option.label}</div>
                                                                            <small className="text-muted">{option.description}</small>
                                                                        </div>
                                                                    }
                                                                />
                                                            </div>
                                                        </Col>
                                                    ))}
                                    </Row>

                    <div className="bg-light rounded p-3 mt-4">
                        <h6 className="fw-bold mb-3">Conditions spécifiques</h6>
                                        <Row className="g-3">
                                            <Col md={6}>
                                                    <Form.Check
                                                        type="checkbox"
                                                        name="commercial_use"
                                                        checked={formData.commercial_use}
                                                        onChange={handleInputChange}
                                    label="💼 Utilisation commerciale autorisée"
                                />
                            </Col>
                            <Col md={6}>
                                                    <Form.Check
                                                        type="checkbox"
                                                        name="attribution_required"
                                                        checked={formData.attribution_required}
                                                        onChange={handleInputChange}
                                    label="📝 Attribution requise"
                                />
                                            </Col>
                                            <Col md={6}>
                                                    <Form.Check
                                                        type="checkbox"
                                                        name="modifications_allowed"
                                                        checked={formData.modifications_allowed}
                                                        onChange={handleInputChange}
                                    label="✂️ Modifications autorisées"
                                />
                            </Col>
                            <Col md={6}>
                                                    <Form.Check
                                                        type="checkbox"
                                                        name="distribution_allowed"
                                                        checked={formData.distribution_allowed}
                                                        onChange={handleInputChange}
                                    label="🔄 Redistribution autorisée"
                                />
                                            </Col>
                                        </Row>
                                    </div>
                                </Card.Body>
                            </Card>
                                                </div>
    );

    const renderFinalizationStep = () => (
        <div className="space-y-4">
                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Header className="bg-white border-bottom-0">
                    <h4 className="fw-bold mb-0">
                        <FontAwesomeIcon icon={faImage} className="me-2 text-primary" />
                        Image de couverture (optionnel)
                    </h4>
                    <p className="text-muted mb-0">Une belle image peut augmenter vos ventes de 70% !</p>
                                </Card.Header>
                                <Card.Body>
                                                {!formData.cover_image ? (
                                                    <div
                            className="upload-zone border-2 border-dashed rounded p-5 text-center"
                            style={{ borderColor: '#007bff', cursor: 'pointer', backgroundColor: '#f8f9fa' }}
                                                        onClick={() => document.getElementById('coverImage').click()}
                                                    >
                            <FontAwesomeIcon icon={faImage} size="3x" className="text-primary mb-3" />
                            <h5 className="mb-2">Ajoutez une image de couverture</h5>
                            <p className="text-muted mb-0">
                                Formats : JPG, PNG (max 2MB)<br/>
                                                            Dimensions recommandées : 1400x1400px
                            </p>
                                                        <Form.Control
                                                            id="coverImage"
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleFileUpload(e, 'cover')}
                                                            style={{ display: 'none' }}
                                                        />
                                                    </div>
                                                ) : (
                        <div className="position-relative text-center">
                                                        <img
                                                            src={previews.cover}
                                                            alt="Aperçu de la couverture"
                                                            className="img-fluid rounded"
                                style={{ maxWidth: '400px', maxHeight: '400px', objectFit: 'cover' }}
                                                        />
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            className="position-absolute top-0 end-0 m-2"
                                                            onClick={() => removeFile('cover')}
                                                            title="Supprimer l'image"
                                                        >
                                                            <FontAwesomeIcon icon={faTimes} />
                                                        </Button>
                            <div className="mt-3">
                                <Badge bg="success">✅ Image prête</Badge>
                                                        </div>
                                                    </div>
                                                )}
                                                {errors.cover_image && (
                                                    <div className="text-danger small mt-2">
                                                        <FontAwesomeIcon icon={faTimes} className="me-1" />
                                                        {errors.cover_image}
                                                    </div>
                                                )}
                </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-bottom-0">
                    <h4 className="fw-bold mb-0">
                        <FontAwesomeIcon icon={faEye} className="me-2 text-info" />
                        Récapitulatif
                    </h4>
                </Card.Header>
                <Card.Body>
                    <Row className="g-3">
                        <Col md={6}>
                            <div className="border rounded p-3">
                                <h6 className="fw-bold text-primary mb-2">Fichier audio</h6>
                                <p className="mb-1">{formData.audio_file?.name || 'Aucun fichier'}</p>
                                {previews.audioDuration > 0 && (
                                    <small className="text-muted">Durée: {formatDuration(previews.audioDuration)}</small>
                                )}
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="border rounded p-3">
                                <h6 className="fw-bold text-primary mb-2">Informations</h6>
                                <p className="mb-1">{formData.title || 'Sans titre'}</p>
                                <small className="text-muted">
                                    {categories.find(c => c.id == formData.category_id)?.name || 'Aucune catégorie'}
                                </small>
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="border rounded p-3">
                                <h6 className="fw-bold text-primary mb-2">Droits d'auteur</h6>
                                <p className="mb-1">{formData.copyright_owner || 'Non défini'}</p>
                                <small className="text-muted">Compositeur: {formData.composer || 'Non défini'}</small>
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="border rounded p-3">
                                <h6 className="fw-bold text-primary mb-2">Prix</h6>
                                <p className="mb-1">
                                    {formData.is_free ? '💝 Gratuit' : `${formData.price || 0} FCFA`}
                                </p>
                                <small className="text-muted">Licence: {licenseTypes[formData.license_type]?.name}</small>
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
                    Vous devez être connecté pour ajouter un son.
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
                            <h3 className="mb-0 fw-bold">Ajouter un nouveau son</h3>
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
                {success && (
                    <Alert variant="success" className="mb-4">
                        <FontAwesomeIcon icon={faCheck} className="me-2" />
                        {success}
                    </Alert>
                )}

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
                                            {loading ? 'Publication...' : 'Publier le son'}
                                        </Button>
                            )}
                                    </div>
                        </Col>
                    </Row>
            </Container>

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

export default AddSound;
