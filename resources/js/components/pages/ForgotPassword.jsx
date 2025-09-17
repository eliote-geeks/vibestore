import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faVolumeUp,
    faEnvelope,
    faArrowLeft,
    faPaperPlane
} from '@fortawesome/free-solid-svg-icons';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Simulation d'API call
        setTimeout(() => {
            setSuccess(true);
            setLoading(false);
        }, 1000);
    };

    if (success) {
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
                            <Card className="border-0 shadow-lg text-center" style={{ borderRadius: '16px' }}>
                                <Card.Body className="p-5">
                                    <div
                                        className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                                        style={{
                                            width: '60px',
                                            height: '60px',
                                            background: 'linear-gradient(135deg, #10B981, #059669)',
                                            color: 'white'
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faPaperPlane} style={{ fontSize: '24px' }} />
                                    </div>

                                    <h2 className="fw-bold mb-3">Email envoyé !</h2>
                                    <p className="text-muted mb-4">
                                        Nous avons envoyé un lien de réinitialisation à <strong>{email}</strong>.
                                        Vérifiez votre boîte mail et suivez les instructions.
                                    </p>

                                    <div className="d-grid gap-2">
                                        <Button
                                            as={Link}
                                            to="/login"
                                            variant="primary"
                                            style={{ borderRadius: '12px', height: '48px' }}
                                        >
                                            Retour à la connexion
                                        </Button>
                                        <Button
                                            variant="outline-secondary"
                                            onClick={() => setSuccess(false)}
                                            style={{ borderRadius: '12px', height: '40px' }}
                                        >
                                            Renvoyer l'email
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        );
    }

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
                                {/* Header */}
                                <div className="d-flex align-items-center mb-4">
                                    <Button
                                        as={Link}
                                        to="/login"
                                        variant="outline-secondary"
                                        className="me-3 rounded-circle"
                                        style={{ width: '40px', height: '40px' }}
                                    >
                                        <FontAwesomeIcon icon={faArrowLeft} />
                                    </Button>
                                    <div>
                                        <h2 className="fw-bold mb-0">Mot de passe oublié</h2>
                                    </div>
                                </div>

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
                                    <p className="text-muted mb-0">
                                        Entrez votre email pour recevoir un lien de réinitialisation
                                    </p>
                                </div>

                                {/* Erreur */}
                                {error && (
                                    <Alert variant="danger" className="text-center" style={{ borderRadius: '12px' }}>
                                        {error}
                                    </Alert>
                                )}

                                {/* Formulaire */}
                                <Form onSubmit={handleSubmit}>
                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-medium">Adresse email</Form.Label>
                                        <div className="position-relative">
                                            <Form.Control
                                                type="email"
                                                placeholder="votre@email.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
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
                                            <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
                                        )}
                                        {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
                                    </Button>

                                    <div className="text-center">
                                        <span className="text-muted">Vous vous souvenez de votre mot de passe ? </span>
                                        <Link
                                            to="/login"
                                            className="fw-medium text-decoration-none"
                                            style={{ color: '#667eea' }}
                                        >
                                            Se connecter
                                        </Link>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default ForgotPassword;
