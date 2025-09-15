import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faEnvelope, faLock, faMusic } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
            await login(formData.email, formData.password);
            navigate('/profile');
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({
                    general: error.response?.data?.message || 'Une erreur est survenue lors de la connexion.'
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
                    <Col lg={5} md={7} sm={9}>
                        <Card className="border-0 shadow-lg">
                            <Card.Body className="p-5">
                                {/* Header */}
                                <div className="text-center mb-4">
                                    <div className="mb-3">
                                        <img
                                            src="/images/reveilart-logo.svg"
                                            alt="Reveil4artist"
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
                                    <h3 className="fw-bold text-dark mb-2">Connexion</h3>
                                    <p className="text-muted">Connectez-vous à votre compte Reveil4artist</p>
                                </div>

                                {/* Alert d'erreur générale */}
                                {errors.general && (
                                    <Alert variant="danger" className="mb-4">
                                        <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                                        {errors.general}
                                    </Alert>
                                )}

                                {/* Formulaire */}
                                <Form onSubmit={handleSubmit}>
                                    <Row>
                                        <Col>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-medium">
                                                    <FontAwesomeIcon icon={faEnvelope} className="me-2 text-muted" />
                                                    Adresse email
                                                </Form.Label>
                                                <Form.Control
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    placeholder="Votre adresse email"
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

                                    <Row>
                                        <Col>
                                            <Form.Group className="mb-4">
                                                <Form.Label className="fw-medium">
                                                    <FontAwesomeIcon icon={faLock} className="me-2 text-muted" />
                                                    Mot de passe
                                                </Form.Label>
                                                <div className="position-relative">
                                                    <Form.Control
                                                        type={showPassword ? 'text' : 'password'}
                                                        name="password"
                                                        value={formData.password}
                                                        onChange={handleChange}
                                                        placeholder="Votre mot de passe"
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
                                    </Row>

                                    {/* Actions */}
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <Form.Check
                                            type="checkbox"
                                            id="remember-me"
                                            label="Se souvenir de moi"
                                            className="text-muted"
                                        />
                                        <Link
                                            to="/forgot-password"
                                            className="text-primary text-decoration-none small"
                                        >
                                            Mot de passe oublié ?
                                        </Link>
                                    </div>

                                    {/* Bouton de connexion */}
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
                                                Connexion en cours...
                                            </>
                                        ) : (
                                            'Se connecter'
                                        )}
                                    </Button>
                                </Form>

                                {/* Lien vers l'inscription */}
                                <hr className="my-4" />
                                <div className="text-center">
                                    <span className="text-muted">Pas encore de compte ?</span>{' '}
                                    <Link
                                        to="/register"
                                        className="text-primary fw-medium text-decoration-none"
                                    >
                                        Créer un compte
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

                .form-control:focus {
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
            `}</style>
        </div>
    );
};

export default Login;
