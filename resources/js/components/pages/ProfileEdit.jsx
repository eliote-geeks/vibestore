import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tab, Tabs, Spinner, OverlayTrigger, Popover } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUser,
    faEnvelope,
    faPhone,
    faMapMarkerAlt,
    faLock,
    faEye,
    faEyeSlash,
    faSave,
    faArrowLeft,
    faCamera,
    faUserCircle,
    faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const ProfileEdit = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();

    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phone: '',
        location: '',
        bio: '',
        role: ''
    });

    const [passwordData, setPasswordData] = useState({
        current_password: '',
        password: '',
        password_confirmation: ''
    });

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const [loading, setLoading] = useState(false);
    const [photoLoading, setPhotoLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [errors, setErrors] = useState({});
    const [photoTimestamp, setPhotoTimestamp] = useState(Date.now());
    const [showSuccessPopover, setShowSuccessPopover] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const cameroonCities = [
        'Yaoundé', 'Douala', 'Garoua', 'Bamenda', 'Maroua', 'Bafoussam',
        'Kumba', 'Nkongsamba', 'Loum', 'Foumban', 'Edéa', 'Tiko',
        'Kribi', 'Limbe', 'Sangmelima', 'Ebolowa', 'Bertoua'
    ];

    const roles = [
        { value: 'user', label: 'Utilisateur' },
        { value: 'artist', label: 'Artiste' },
        { value: 'producer', label: 'Producteur' },
        { value: 'admin', label: 'Administrateur' }
    ];

    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                location: user.location || '',
                bio: user.bio || '',
                role: user.role || 'user'
            });
        }
    }, [user]);

    // Écouter les événements de mise à jour de photo
    useEffect(() => {
        const handlePhotoUpdate = (event) => {
            setPhotoTimestamp(event.detail.timestamp);
        };

        window.addEventListener('photoUpdated', handlePhotoUpdate);

        return () => {
            window.removeEventListener('photoUpdated', handlePhotoUpdate);
        };
    }, []);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Vérifier le type et la taille du fichier
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            setErrors({ photo: ['Le fichier doit être une image (JPG, PNG)'] });
            return;
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB
            setErrors({ photo: ['La taille du fichier ne doit pas dépasser 2MB'] });
            return;
        }

        setPhotoLoading(true);
        setErrors({});

        const formData = new FormData();
        formData.append('profile_photo', file);

        try {
            const response = await axios.post('/api/profile/photo', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.user) {
                // Utiliser le timestamp du serveur pour une synchronisation parfaite
                const serverTimestamp = response.data.user.photo_timestamp || Date.now();
                setPhotoTimestamp(serverTimestamp);

                await updateUser(response.data.user);
                showSuccessMessage('Photo de profil mise à jour avec succès !');
            }
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({
                    photo: [error.response?.data?.message || 'Erreur lors du téléchargement de la photo']
                });
            }
        } finally {
            setPhotoLoading(false);
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setSuccess('');

        try {
            const response = await axios.put('/api/profile', profileData);

            if (response.data.user) {
                await updateUser(response.data.user);
                showSuccessMessage('Profil mis à jour avec succès !');
            }
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({
                    general: error.response?.data?.message || 'Une erreur est survenue lors de la mise à jour du profil.'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setSuccess('');

        if (passwordData.password !== passwordData.password_confirmation) {
            setErrors({ password_confirmation: ['Les nouveaux mots de passe ne correspondent pas'] });
            setLoading(false);
            return;
        }

        try {
            await axios.put('/api/change-password', passwordData);

            showSuccessMessage('Mot de passe modifié avec succès !');
            setPasswordData({
                current_password: '',
                password: '',
                password_confirmation: ''
            });
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({
                    general: error.response?.data?.message || 'Une erreur est survenue lors de la modification du mot de passe.'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour afficher un message de succès via popover
    const showSuccessMessage = (message) => {
        setSuccessMessage(message);
        setShowSuccessPopover(true);
        setTimeout(() => {
            setShowSuccessPopover(false);
            setSuccessMessage('');
        }, 3000);
    };

    // Fonction pour créer un popover de succès
    const createSuccessPopover = (message) => (
        <Popover id="success-popover">
            <Popover.Header className="text-success">
                <FontAwesomeIcon icon={faSave} className="me-2" />
                Opération réussie
            </Popover.Header>
            <Popover.Body>
                <p className="mb-0 small text-success">{message}</p>
            </Popover.Body>
        </Popover>
    );

    // Fonction pour créer un popover d'erreur
    const createErrorPopover = (errors) => (
        <Popover id="error-popover">
            <Popover.Header className="text-danger">
                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                Erreur de validation
            </Popover.Header>
            <Popover.Body>
                <ul className="mb-0 ps-3">
                    {errors.map((error, index) => (
                        <li key={index} className="small">{error}</li>
                    ))}
                </ul>
            </Popover.Body>
        </Popover>
    );

    // Fonction pour wrapper un champ avec un popover d'erreur
    const wrapWithErrorPopover = (field, children) => {
        if (errors[field]) {
            return (
                <OverlayTrigger
                    trigger={['hover', 'focus']}
                    placement="right"
                    overlay={createErrorPopover(errors[field])}
                >
                    {children}
                </OverlayTrigger>
            );
        }
        return children;
    };

    if (!user) {
        return (
            <div className="bg-light min-vh-100 d-flex align-items-center justify-content-center">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div className="bg-light min-vh-100 py-4" style={{ paddingTop: '80px' }}>
            <Container>
                <Row className="justify-content-center">
                    <Col lg={8}>
                        {/* Header */}
                        <div className="d-flex align-items-center mb-4">
                            <Button
                                as={Link}
                                to="/profile"
                                variant="outline-secondary"
                                className="me-3"
                                style={{ borderRadius: '8px' }}
                            >
                                <FontAwesomeIcon icon={faArrowLeft} />
                            </Button>
                            <div>
                                <h2 className="fw-bold mb-1">Modifier mon profil</h2>
                                <p className="text-muted mb-0">Gérez vos informations personnelles et sécurité</p>
                            </div>
                        </div>

                        {/* Messages de succès avec popover */}
                        {showSuccessPopover && (
                            <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1060 }}>
                                <OverlayTrigger
                                    show={true}
                                    placement="left"
                                    overlay={createSuccessPopover(successMessage)}
                                >
                                    <Button
                                        variant="success"
                                        className="rounded-circle p-2"
                                        style={{ opacity: 0 }}
                                    >
                                        <FontAwesomeIcon icon={faSave} />
                                    </Button>
                                </OverlayTrigger>
                            </div>
                        )}

                        {/* Messages d'erreur */}
                        {errors.general && (
                            <Alert variant="danger" className="mb-4" style={{ borderRadius: '12px' }}>
                                {errors.general}
                            </Alert>
                        )}

                        {/* Tabs */}
                        <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                            <Card.Body className="p-0">
                                <Tabs
                                    defaultActiveKey="profile"
                                    className="px-4 pt-4"
                                    style={{ borderBottom: '1px solid #e9ecef' }}
                                >
                                    {/* Onglet Profil */}
                                    <Tab
                                        eventKey="profile"
                                        title={
                                            <span>
                                                <FontAwesomeIcon icon={faUser} className="me-2" />
                                                Informations personnelles
                                            </span>
                                        }
                                    >
                                        <div className="p-4">
                                            {/* Photo de profil */}
                                            <div className="text-center mb-4">
                                                <div className="position-relative d-inline-block">
                                                    <img
                                                        src={`${user.profile_photo_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"}?t=${photoTimestamp}`}
                                                        alt="Photo de profil"
                                                        className="rounded-circle"
                                                        style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                                        key={photoTimestamp}
                                                    />
                                                    {/* Input file caché */}
                                                    <input
                                                        type="file"
                                                        id="profile-photo-input"
                                                        accept="image/*"
                                                        onChange={handlePhotoChange}
                                                        style={{ display: 'none' }}
                                                    />
                                                    {/* Bouton de changement de photo */}
                                                    {wrapWithErrorPopover('photo',
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            className="position-absolute bottom-0 end-0 rounded-circle"
                                                            style={{ width: '30px', height: '30px' }}
                                                            onClick={() => document.getElementById('profile-photo-input').click()}
                                                            disabled={photoLoading}
                                                        >
                                                            {photoLoading ? (
                                                                <Spinner size="sm" style={{ fontSize: '8px' }} />
                                                            ) : (
                                                                <FontAwesomeIcon icon={faCamera} style={{ fontSize: '12px' }} />
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                                <p className="text-muted small mt-2">
                                                    {photoLoading ? 'Téléchargement en cours...' : 'Cliquez pour changer votre photo'}
                                                </p>
                                                <p className="text-muted small">
                                                    Formats acceptés: JPG, PNG (max 2MB)
                                                </p>
                                            </div>

                                            <Form onSubmit={handleProfileSubmit}>
                                                <Row>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label className="fw-medium">
                                                                <FontAwesomeIcon icon={faUser} className="me-2 text-muted" />
                                                                Nom complet *
                                                            </Form.Label>
                                                            <Form.Control
                                                                type="text"
                                                                name="name"
                                                                value={profileData.name}
                                                                onChange={handleProfileChange}
                                                                placeholder="Votre nom complet"
                                                                isInvalid={!!errors.name}
                                                                required
                                                                style={{ borderRadius: '8px' }}
                                                            />
                                                            {wrapWithErrorPopover('name', (
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.name?.[0]}
                                                                </Form.Control.Feedback>
                                                            ))}
                                                        </Form.Group>
                                                    </Col>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label className="fw-medium">
                                                                <FontAwesomeIcon icon={faEnvelope} className="me-2 text-muted" />
                                                                Email *
                                                            </Form.Label>
                                                            <Form.Control
                                                                type="email"
                                                                name="email"
                                                                value={profileData.email}
                                                                onChange={handleProfileChange}
                                                                placeholder="votre@email.com"
                                                                isInvalid={!!errors.email}
                                                                required
                                                                style={{ borderRadius: '8px' }}
                                                            />
                                                            {wrapWithErrorPopover('email', (
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.email?.[0]}
                                                                </Form.Control.Feedback>
                                                            ))}
                                                        </Form.Group>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label className="fw-medium">
                                                                <FontAwesomeIcon icon={faPhone} className="me-2 text-muted" />
                                                                Téléphone
                                                            </Form.Label>
                                                            <Form.Control
                                                                type="tel"
                                                                name="phone"
                                                                value={profileData.phone}
                                                                onChange={handleProfileChange}
                                                                placeholder="+237 6XX XXX XXX"
                                                                isInvalid={!!errors.phone}
                                                                style={{ borderRadius: '8px' }}
                                                            />
                                                            {wrapWithErrorPopover('phone', (
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.phone?.[0]}
                                                                </Form.Control.Feedback>
                                                            ))}
                                                        </Form.Group>
                                                    </Col>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label className="fw-medium">
                                                                <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2 text-muted" />
                                                                Ville
                                                            </Form.Label>
                                                            <Form.Select
                                                                name="location"
                                                                value={profileData.location}
                                                                onChange={handleProfileChange}
                                                                isInvalid={!!errors.location}
                                                                style={{ borderRadius: '8px' }}
                                                            >
                                                                <option value="">Sélectionner une ville</option>
                                                                {cameroonCities.map(city => (
                                                                    <option key={city} value={city}>{city}</option>
                                                                ))}
                                                            </Form.Select>
                                                            {wrapWithErrorPopover('location', (
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.location?.[0]}
                                                                </Form.Control.Feedback>
                                                            ))}
                                                        </Form.Group>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label className="fw-medium">
                                                                <FontAwesomeIcon icon={faUserCircle} className="me-2 text-muted" />
                                                                Type de compte
                                                            </Form.Label>
                                                            <Form.Select
                                                                name="role"
                                                                value={profileData.role}
                                                                onChange={handleProfileChange}
                                                                isInvalid={!!errors.role}
                                                                style={{ borderRadius: '8px' }}
                                                                disabled={user.role === 'admin'} // Les admins ne peuvent pas changer leur rôle
                                                            >
                                                                {roles.map(role => (
                                                                    <option key={role.value} value={role.value}>{role.label}</option>
                                                                ))}
                                                            </Form.Select>
                                                            {wrapWithErrorPopover('role', (
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.role?.[0]}
                                                                </Form.Control.Feedback>
                                                            ))}
                                                            {user.role === 'admin' && (
                                                                <Form.Text className="text-muted">
                                                                    Les administrateurs ne peuvent pas modifier leur rôle
                                                                </Form.Text>
                                                            )}
                                                        </Form.Group>
                                                    </Col>
                                                </Row>

                                                <Form.Group className="mb-4">
                                                    <Form.Label className="fw-medium">Biographie</Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={4}
                                                        name="bio"
                                                        value={profileData.bio}
                                                        onChange={handleProfileChange}
                                                        placeholder="Présentez-vous brièvement..."
                                                        isInvalid={!!errors.bio}
                                                        style={{ borderRadius: '8px' }}
                                                    />
                                                    {wrapWithErrorPopover('bio', (
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.bio?.[0]}
                                                        </Form.Control.Feedback>
                                                    ))}
                                                </Form.Group>

                                                <Button
                                                    type="submit"
                                                    variant="primary"
                                                    disabled={loading}
                                                    style={{ borderRadius: '8px' }}
                                                    className="px-4"
                                                >
                                                    {loading ? (
                                                        <>
                                                            <Spinner size="sm" className="me-2" />
                                                            Mise à jour...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FontAwesomeIcon icon={faSave} className="me-2" />
                                                            Sauvegarder les modifications
                                                        </>
                                                    )}
                                                </Button>
                                            </Form>
                                        </div>
                                    </Tab>

                                    {/* Onglet Mot de passe */}
                                    <Tab
                                        eventKey="password"
                                        title={
                                            <span>
                                                <FontAwesomeIcon icon={faLock} className="me-2" />
                                                Sécurité
                                            </span>
                                        }
                                    >
                                        <div className="p-4">
                                            <Form onSubmit={handlePasswordSubmit}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="fw-medium">
                                                        <FontAwesomeIcon icon={faLock} className="me-2 text-muted" />
                                                        Mot de passe actuel *
                                                    </Form.Label>
                                                    <div className="position-relative">
                                                        <Form.Control
                                                            type={showPasswords.current ? 'text' : 'password'}
                                                            name="current_password"
                                                            value={passwordData.current_password}
                                                            onChange={handlePasswordChange}
                                                            placeholder="Entrez votre mot de passe actuel"
                                                            isInvalid={!!errors.current_password}
                                                            required
                                                            style={{ borderRadius: '8px' }}
                                                        />
                                                        <Button
                                                            variant="link"
                                                            className="position-absolute end-0 top-50 translate-middle-y border-0 text-muted"
                                                            style={{ zIndex: 5 }}
                                                            onClick={() => togglePasswordVisibility('current')}
                                                            type="button"
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={showPasswords.current ? faEyeSlash : faEye}
                                                            />
                                                        </Button>
                                                    </div>
                                                    {wrapWithErrorPopover('current_password', (
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.current_password?.[0]}
                                                        </Form.Control.Feedback>
                                                    ))}
                                                </Form.Group>

                                                <Row>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label className="fw-medium">
                                                                Nouveau mot de passe *
                                                            </Form.Label>
                                                            <div className="position-relative">
                                                                <Form.Control
                                                                    type={showPasswords.new ? 'text' : 'password'}
                                                                    name="password"
                                                                    value={passwordData.password}
                                                                    onChange={handlePasswordChange}
                                                                    placeholder="Nouveau mot de passe"
                                                                    isInvalid={!!errors.password}
                                                                    required
                                                                    style={{ borderRadius: '8px' }}
                                                                />
                                                                <Button
                                                                    variant="link"
                                                                    className="position-absolute end-0 top-50 translate-middle-y border-0 text-muted"
                                                                    style={{ zIndex: 5 }}
                                                                    onClick={() => togglePasswordVisibility('new')}
                                                                    type="button"
                                                                >
                                                                    <FontAwesomeIcon
                                                                        icon={showPasswords.new ? faEyeSlash : faEye}
                                                                    />
                                                                </Button>
                                                            </div>
                                                            {wrapWithErrorPopover('password', (
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.password?.[0]}
                                                                </Form.Control.Feedback>
                                                            ))}
                                                        </Form.Group>
                                                    </Col>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label className="fw-medium">
                                                                Confirmer le nouveau mot de passe *
                                                            </Form.Label>
                                                            <div className="position-relative">
                                                                <Form.Control
                                                                    type={showPasswords.confirm ? 'text' : 'password'}
                                                                    name="password_confirmation"
                                                                    value={passwordData.password_confirmation}
                                                                    onChange={handlePasswordChange}
                                                                    placeholder="Confirmer le nouveau mot de passe"
                                                                    isInvalid={!!errors.password_confirmation}
                                                                    required
                                                                    style={{ borderRadius: '8px' }}
                                                                />
                                                                <Button
                                                                    variant="link"
                                                                    className="position-absolute end-0 top-50 translate-middle-y border-0 text-muted"
                                                                    style={{ zIndex: 5 }}
                                                                    onClick={() => togglePasswordVisibility('confirm')}
                                                                    type="button"
                                                                >
                                                                    <FontAwesomeIcon
                                                                        icon={showPasswords.confirm ? faEyeSlash : faEye}
                                                                    />
                                                                </Button>
                                                            </div>
                                                            {wrapWithErrorPopover('password_confirmation', (
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.password_confirmation?.[0]}
                                                                </Form.Control.Feedback>
                                                            ))}
                                                        </Form.Group>
                                                    </Col>
                                                </Row>

                                                <div className="bg-light p-3 rounded mb-4">
                                                    <h6 className="fw-bold mb-2">Critères du mot de passe :</h6>
                                                    <ul className="small text-muted mb-0">
                                                        <li>Au moins 8 caractères</li>
                                                        <li>Contenir au moins une lettre majuscule</li>
                                                        <li>Contenir au moins une lettre minuscule</li>
                                                        <li>Contenir au moins un chiffre</li>
                                                    </ul>
                                                </div>

                                                <Button
                                                    type="submit"
                                                    variant="primary"
                                                    disabled={loading}
                                                    style={{ borderRadius: '8px' }}
                                                    className="px-4"
                                                >
                                                    {loading ? (
                                                        <>
                                                            <Spinner size="sm" className="me-2" />
                                                            Modification...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FontAwesomeIcon icon={faLock} className="me-2" />
                                                            Modifier le mot de passe
                                                        </>
                                                    )}
                                                </Button>
                                            </Form>
                                        </div>
                                    </Tab>
                                </Tabs>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default ProfileEdit;
