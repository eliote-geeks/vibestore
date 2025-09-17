import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faVolumeUp,
    faUser,
    faEnvelope,
    faLock,
    faEye,
    faEyeSlash,
    faUserPlus
} from '@fortawesome/free-solid-svg-icons';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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
        setSuccess('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            setLoading(false);
            return;
        }

        // Simulation d'API call
        setTimeout(() => {
            setSuccess('Inscription réussie ! Vous pouvez maintenant vous connecter.');
            setFormData({
                name: '',
                email: '',
                password: '',
                confirmPassword: ''
            });
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
                                    <h2 className="fw-bold mb-1">Inscription</h2>
                                    <p className="text-muted mb-0">Créez votre compte RéveilArt</p>
                                </div>

                                {/* Messages */}
                                {error && (
                                    <Alert variant="danger" className="text-center" style={{ borderRadius: '12px' }}>
                                        {error}
                                    </Alert>
                                )}
                                {success && (
                                    <Alert variant="success" className="text-center" style={{ borderRadius: '12px' }}>
                                        {success}
                                    </Alert>
                                )}

                                {/* Formulaire */}
                                <Form onSubmit={handleSubmit}>
                                    {/* Nom */}
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-medium">Nom complet</Form.Label>
                                        <div className="position-relative">
                                            <Form.Control
                                                type="text"
                                                name="name"
                                                placeholder="Votre nom complet"
                                                value={formData.name}
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
                                                icon={faUser}
                                                className="position-absolute text-muted"
                                                style={{
                                                    left: '15px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)'
                                                }}
                                            />
                                        </div>
                                    </Form.Group>

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
                                                placeholder="Choisissez un mot de passe"
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

                                    {/* Confirmation mot de passe */}
                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-medium">Confirmer le mot de passe</Form.Label>
                                        <div className="position-relative">
                                            <Form.Control
                                                type={showConfirmPassword ? "text" : "password"}
                                                name="confirmPassword"
                                                placeholder="Confirmez votre mot de passe"
                                                value={formData.confirmPassword}
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
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                                            </Button>
                                        </div>
                                    </Form.Group>

                                    {/* Bouton d'inscription */}
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
                                            <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                                        )}
                                        {loading ? 'Inscription...' : 'S\'inscrire'}
                                    </Button>

                                    {/* Ligne de séparation */}
                                    <div className="text-center mb-3">
                                        <div className="d-flex align-items-center">
                                            <hr className="flex-grow-1" />
                                            <span className="px-3 text-muted small">ou</span>
                                            <hr className="flex-grow-1" />
                                        </div>
                                    </div>

                                    {/* Lien vers connexion */}
                                    <div className="text-center">
                                        <span className="text-muted">Déjà un compte ? </span>
                                        <Link
                                            to="/login"
                                            className="fw-medium text-decoration-none"
                                            style={{ color: '#667eea' }}
                                        >
                                            Se connecter
                                        </Link>
                                    </div>
                                </Form>

                                {/* Conditions d'utilisation */}
                                <div className="mt-4 text-center">
                                    <small className="text-muted">
                                        En vous inscrivant, vous acceptez nos{' '}
                                        <Link
                                            to="/terms"
                                            className="text-decoration-none"
                                            style={{ color: '#667eea' }}
                                        >
                                            conditions d'utilisation
                                        </Link>
                                        {' '}et notre{' '}
                                        <Link
                                            to="/privacy"
                                            className="text-decoration-none"
                                            style={{ color: '#667eea' }}
                                        >
                                            politique de confidentialité
                                        </Link>
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

export default Register;
