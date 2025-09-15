import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEye,
    faEyeSlash,
    faUser,
    faEnvelope,
    faLock,
    faMusic,
    faPhone,
    faMapMarkerAlt,
    faUserCircle
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'user',
        phone: '',
        location: '',
        bio: ''
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const roles = [
        { value: 'user', label: 'Utilisateur', description: 'Écouter et découvrir de la musique' },
        { value: 'artist', label: 'Artiste', description: 'Publier et vendre vos créations musicales' },
        { value: 'producer', label: 'Producteur', description: 'Produire et gérer des artistes' }
    ];

    const cameroonCities = [
        'Yaoundé', 'Douala', 'Garoua', 'Bamenda', 'Maroua', 'Bafoussam',
        'Kumba', 'Nkongsamba', 'Loum', 'Foumban', 'Edéa', 'Tiko',
        'Kribi', 'Limbe', 'Sangmelima', 'Ebolowa', 'Bertoua'
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            await register(formData);
            navigate('/profile');
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({
                    general: error.response?.data?.message || 'Une erreur est survenue lors de l\'inscription.'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center bg-light" style={{ paddingTop: '80px' }}>
            <Container>
                <Row className="justify-content-center">
                    <Col lg={8} md={10}>
                        <Card className="border-0 shadow-lg">
                            <Card.Body className="p-5">
                                {/* Header */}
                                <div className="text-center mb-4">
                                    <div className="mb-3">
                                        <img
                                            src="/images/vibestore237-logo.svg"
                                            alt="VibeStore237"
                                            height="48"
                                            className="mb-2"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'block';
                                            }}
                                        />
                                        <FontAwesomeIcon
                                            icon={faMusic}
                                            size="3x"
                                            className="text-primary"
                                            style={{ display: 'none' }}
                                        />
                                    </div>
                                    <h3 className="fw-bold text-dark mb-2">Créer un compte</h3>
                                    <p className="text-muted">Rejoignez la communauté VibeStore237</p>
                                </div>

                                {/* Alert d'erreur générale */}
                                {errors.general && (
                                    <Alert variant="danger" className="mb-4">
                                        <FontAwesomeIcon icon={faUser} className="me-2" />
                                        {errors.general}
                                    </Alert>
                                )}

                                {/* Formulaire */}
                                <Form onSubmit={handleSubmit}>
                                    {/* Informations de base */}
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
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    placeholder="Votre nom complet"
                                                    isInvalid={!!errors.name}
                                                    required
                                                    className="py-2"
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.name?.[0]}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-medium">
                                                    <FontAwesomeIcon icon={faEnvelope} className="me-2 text-muted" />
                                                    Adresse email *
                                                </Form.Label>
                                                <Form.Control
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    placeholder="votre@email.com"
                                                    isInvalid={!!errors.email}
                                                    required
                                                    className="py-2"
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.email?.[0]}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    {/* Mots de passe */}
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-medium">
                                                    <FontAwesomeIcon icon={faLock} className="me-2 text-muted" />
                                                    Mot de passe *
                                                </Form.Label>
                                                <div className="position-relative">
                                                    <Form.Control
                                                        type={showPassword ? 'text' : 'password'}
                                                        name="password"
                                                        value={formData.password}
                                                        onChange={handleChange}
                                                        placeholder="Minimum 8 caractères"
                                                        isInvalid={!!errors.password}
                                                        required
                                                        className="py-2 pe-5"
                                                    />
                                                    <Button
                                                        variant="link"
                                                        className="position-absolute end-0 top-50 translate-middle-y border-0 text-muted"
                                                        style={{ zIndex: 5 }}
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        type="button"
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={showPassword ? faEyeSlash : faEye}
                                                        />
                                                    </Button>
                                                </div>
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.password?.[0]}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-medium">
                                                    <FontAwesomeIcon icon={faLock} className="me-2 text-muted" />
                                                    Confirmer le mot de passe *
                                                </Form.Label>
                                                <div className="position-relative">
                                                    <Form.Control
                                                        type={showConfirmPassword ? 'text' : 'password'}
                                                        name="password_confirmation"
                                                        value={formData.password_confirmation}
                                                        onChange={handleChange}
                                                        placeholder="Confirmer votre mot de passe"
                                                        isInvalid={!!errors.password_confirmation}
                                                        required
                                                        className="py-2 pe-5"
                                                    />
                                                    <Button
                                                        variant="link"
                                                        className="position-absolute end-0 top-50 translate-middle-y border-0 text-muted"
                                                        style={{ zIndex: 5 }}
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        type="button"
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={showConfirmPassword ? faEyeSlash : faEye}
                                                        />
                                                    </Button>
                                                </div>
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.password_confirmation?.[0]}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    {/* Type de compte */}
                                    <Row>
                                        <Col>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-medium">
                                                    <FontAwesomeIcon icon={faUserCircle} className="me-2 text-muted" />
                                                    Type de compte *
                                                </Form.Label>
                                                <div className="row g-3">
                                                    {roles.map(role => (
                                                        <div key={role.value} className="col-md-4">
                                                            <Form.Check
                                                                type="radio"
                                                                name="role"
                                                                value={role.value}
                                                                checked={formData.role === role.value}
                                                                onChange={handleChange}
                                                                id={`role-${role.value}`}
                                                                className="d-none"
                                                            />
                                                            <label
                                                                htmlFor={`role-${role.value}`}
                                                                className={`card h-100 cursor-pointer border-2 ${
                                                                    formData.role === role.value
                                                                        ? 'border-primary bg-primary bg-opacity-10'
                                                                        : 'border-light'
                                                                }`}
                                                                style={{ cursor: 'pointer' }}
                                                            >
                                                                <div className="card-body text-center p-3">
                                                                    <h6 className="fw-bold mb-1">{role.label}</h6>
                                                                    <small className="text-muted">{role.description}</small>
                                                                </div>
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                                {errors.role && (
                                                    <div className="invalid-feedback d-block">
                                                        {errors.role[0]}
                                                    </div>
                                                )}
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    {/* Informations optionnelles */}
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
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    placeholder="+237 6XX XXX XXX"
                                                    isInvalid={!!errors.phone}
                                                    className="py-2"
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.phone?.[0]}
                                                </Form.Control.Feedback>
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
                                                    value={formData.location}
                                                    onChange={handleChange}
                                                    isInvalid={!!errors.location}
                                                    className="py-2"
                                                >
                                                    <option value="">Sélectionner une ville</option>
                                                    {cameroonCities.map(city => (
                                                        <option key={city} value={city}>{city}</option>
                                                    ))}
                                                </Form.Select>
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.location?.[0]}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    {/* Bio */}
                                    <Row>
                                        <Col>
                                            <Form.Group className="mb-4">
                                                <Form.Label className="fw-medium">
                                                    Biographie
                                                </Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={3}
                                                    name="bio"
                                                    value={formData.bio}
                                                    onChange={handleChange}
                                                    placeholder="Présentez-vous brièvement..."
                                                    isInvalid={!!errors.bio}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.bio?.[0]}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    {/* Bouton d'inscription */}
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        className="w-100 py-2 fw-medium"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Spinner size="sm" className="me-2" />
                                                Création du compte...
                                            </>
                                        ) : (
                                            'Créer mon compte'
                                        )}
                                    </Button>
                                </Form>

                                {/* Lien vers la connexion */}
                                <hr className="my-4" />
                                <div className="text-center">
                                    <span className="text-muted">Vous avez déjà un compte ?</span>{' '}
                                    <Link
                                        to="/login"
                                        className="text-primary fw-medium text-decoration-none"
                                    >
                                        Se connecter
                                    </Link>
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Lien retour */}
                        <div className="text-center mt-4">
                            <Link
                                to="/"
                                className="text-muted text-decoration-none"
                            >
                                ← Retour à l'accueil
                            </Link>
                        </div>
                    </Col>
                </Row>
            </Container>

            <style jsx>{`
                .position-relative .btn-link:focus {
                    box-shadow: none;
                }

                .form-control:focus, .form-select:focus {
                    border-color: #8b5cf6;
                    box-shadow: 0 0 0 0.2rem rgba(139, 92, 246, 0.25);
                }

                .btn-primary {
                    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                    border: none;
                    transition: all 0.3s ease;
                }

                .btn-primary:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
                }

                .card.border-primary {
                    transition: all 0.2s ease;
                }

                .card.border-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
                }
            `}</style>
        </div>
    );
};

export default Register;
