import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faVolumeUp,
    faEnvelope,
    faLock,
    faEye,
    faEyeSlash,
    faSignInAlt
} from '@fortawesome/free-solid-svg-icons';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Simulation d'API call
        setTimeout(() => {
            if (formData.email === 'test@reveilart4artist.com' && formData.password === 'password') {
                // Redirection après connexion réussie
                window.location.href = '/';
            } else {
                setError('Email ou mot de passe incorrect');
            }
            setLoading(false);
        }, 1000);
    };

    return (
        <div
            className="min-vh-100 d-flex align-items-center py-5"
            style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
        >
            <Container>
                <Row className="justify-content-center">
                    <Col sm={10} md={8} lg={6} xl={5}>
                        <Card className="border-0 shadow-lg" style={{ borderRadius: '16px' }}>
                            <Card.Body className="p-5">
                                {/* Logo */}
                                <div className="text-center mb-4">
                                    <div
                                        className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                                        style={{
                                            width: '60px',
                                            height: '60px',
                                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                            color: 'white'
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faVolumeUp} style={{ fontSize: '24px' }} />
                                    </div>
                                    <h2 className="fw-bold mb-1">Connexion</h2>
                                    <p className="text-muted mb-0">Connectez-vous à votre compte RéveilArt</p>
                                </div>

                                {/* Erreur */}
                                {error && (
                                    <Alert variant="danger" className="text-center" style={{ borderRadius: '12px' }}>
                                        {error}
                                    </Alert>
                                )}

                                {/* Formulaire */}
                                <Form onSubmit={handleSubmit}>
                                    {/* Email */}
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-medium">Email</Form.Label>
                                        <div className="position-relative">
                                            <Form.Control
                                                type="email"
                                                name="email"
                                                placeholder="votre@email.com"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                required
                                                style={{
                                                    borderRadius: '12px',
                                                    paddingLeft: '45px',
                                                    height: '48px',
                                                    border: '1px solid #e9ecef'
                                                }}
                                            />
                                            <FontAwesomeIcon
                                                icon={faEnvelope}
                                                className="position-absolute text-muted"
                                                style={{
                                                    left: '15px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)'
                                                }}
                                            />
                                        </div>
                                    </Form.Group>

                                    {/* Mot de passe */}
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-medium">Mot de passe</Form.Label>
                                        <div className="position-relative">
                                            <Form.Control
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                placeholder="Votre mot de passe"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                required
                                                style={{
                                                    borderRadius: '12px',
                                                    paddingLeft: '45px',
                                                    paddingRight: '45px',
                                                    height: '48px',
                                                    border: '1px solid #e9ecef'
                                                }}
                                            />
                                            <FontAwesomeIcon
                                                icon={faLock}
                                                className="position-absolute text-muted"
                                                style={{
                                                    left: '15px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)'
                                                }}
                                            />
                                            <Button
                                                variant="link"
                                                className="position-absolute p-0 text-muted"
                                                style={{
                                                    right: '15px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    border: 'none',
                                                    background: 'none'
                                                }}
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                                            </Button>
                                        </div>
                                    </Form.Group>

                                    {/* Bouton de connexion */}
                                    <Button
                                        type="submit"
                                        className="w-100 fw-medium mb-3"
                                        style={{
                                            borderRadius: '12px',
                                            height: '48px',
                                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                            border: 'none'
                                        }}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <div className="spinner-border spinner-border-sm me-2" role="status">
                                                <span className="visually-hidden">Chargement...</span>
                                            </div>
                                        ) : (
                                            <FontAwesomeIcon icon={faSignInAlt} className="me-2" />
                                        )}
                                        {loading ? 'Connexion...' : 'Se connecter'}
                                    </Button>

                                    {/* Mot de passe oublié */}
                                    <div className="text-center mb-3">
                                        <Link
                                            to="/forgot-password"
                                            className="text-decoration-none"
                                            style={{ color: '#667eea' }}
                                        >
                                            Mot de passe oublié ?
                                        </Link>
                                    </div>

                                    {/* Ligne de séparation */}
                                    <div className="text-center mb-3">
                                        <div className="d-flex align-items-center">
                                            <hr className="flex-grow-1" />
                                            <span className="px-3 text-muted small">ou</span>
                                            <hr className="flex-grow-1" />
                                        </div>
                                    </div>

                                    {/* Lien vers inscription */}
                                    <div className="text-center">
                                        <span className="text-muted">Pas encore de compte ? </span>
                                        <Link
                                            to="/register"
                                            className="fw-medium text-decoration-none"
                                            style={{ color: '#667eea' }}
                                        >
                                            S'inscrire
                                        </Link>
                                    </div>
                                </Form>

                                {/* Compte de test */}
                                <div className="mt-4 p-3 bg-light rounded text-center">
                                    <small className="text-muted">
                                        <strong>Compte de test :</strong><br />
                                        Email: test@reveilart4artist.com<br />
                                        Mot de passe: password
                                    </small>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default Login;
