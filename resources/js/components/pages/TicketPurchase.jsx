import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Modal, ProgressBar } from 'react-bootstrap';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faTicketAlt,
    faCreditCard,
    faShieldAlt,
    faCheckCircle,
    faSpinner,
    faCalendarAlt,
    faMapMarkerAlt,
    faUser,
    faEnvelope,
    faPhone,
    faMobileAlt,
    faLock,
    faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import {
    faCcVisa,
    faCcMastercard,
    faCcPaypal
} from '@fortawesome/free-brands-svg-icons';
import LoadingScreen from '../common/LoadingScreen';
import { AnimatedElement } from '../common/PageTransition';

const TicketPurchase = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [orderNumber, setOrderNumber] = useState('');

    // Récupération des données depuis EventDetails
    const { event, tickets, totalPrice } = location.state || {};

    // Formulaire utilisateur
    const [userForm, setUserForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: ''
    });

    // Formulaire de paiement
    const [paymentForm, setPaymentForm] = useState({
        method: 'card',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardName: '',
        mobileNumber: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!event || !tickets || totalPrice === 0) {
            navigate('/events');
        }
    }, [event, tickets, totalPrice, navigate]);

    const steps = [
        { number: 1, title: 'Informations', icon: faUser },
        { number: 2, title: 'Paiement', icon: faCreditCard },
        { number: 3, title: 'Confirmation', icon: faCheckCircle }
    ];

    const paymentMethods = [
        {
            id: 'card',
            name: 'Carte bancaire',
            icon: faCreditCard,
            description: 'Visa, Mastercard, American Express'
        },
        {
            id: 'mobile',
            name: 'Mobile Money',
            icon: faMobileAlt,
            description: 'Orange Money, MTN Money'
        },
        {
            id: 'paypal',
            name: 'PayPal',
            icon: faCcPaypal,
            description: 'Paiement sécurisé via PayPal'
        }
    ];

    const handleInputChange = (formType, field, value) => {
        if (formType === 'user') {
            setUserForm(prev => ({ ...prev, [field]: value }));
        } else {
            setPaymentForm(prev => ({ ...prev, [field]: value }));
        }

        // Supprimer l'erreur si le champ est rempli
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const validateStep = (step) => {
        const newErrors = {};

        if (step === 1) {
            if (!userForm.firstName.trim()) newErrors.firstName = 'Prénom requis';
            if (!userForm.lastName.trim()) newErrors.lastName = 'Nom requis';
            if (!userForm.email.trim()) newErrors.email = 'Email requis';
            if (!userForm.phone.trim()) newErrors.phone = 'Téléphone requis';
        }

        if (step === 2) {
            if (paymentForm.method === 'card') {
                if (!paymentForm.cardNumber.trim()) newErrors.cardNumber = 'Numéro de carte requis';
                if (!paymentForm.expiryDate.trim()) newErrors.expiryDate = 'Date d\'expiration requise';
                if (!paymentForm.cvv.trim()) newErrors.cvv = 'CVV requis';
                if (!paymentForm.cardName.trim()) newErrors.cardName = 'Nom sur la carte requis';
            }
            if (paymentForm.method === 'mobile') {
                if (!paymentForm.mobileNumber.trim()) newErrors.mobileNumber = 'Numéro mobile requis';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 3));
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const generateOrderNumber = () => {
        return 'RA' + Date.now().toString().slice(-6) + Math.random().toString(36).substr(2, 3).toUpperCase();
    };

    const handlePurchase = async () => {
        if (!validateStep(2)) return;

        setProcessing(true);

        // Simulation du processus de paiement
        setTimeout(() => {
            const orderNum = generateOrderNumber();
            setOrderNumber(orderNum);
            setProcessing(false);
            setShowSuccessModal(true);
        }, 3000);
    };

    const getTotalTickets = () => {
        if (!tickets) return 0;
        return tickets.economique + tickets.standard + tickets.vip;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (!event) {
        return (
            <LoadingScreen
                show={true}
                message="Redirection..."
                style="modern"
            />
        );
    }

    return (
        <div className="bg-light min-vh-100">
            {/* Header */}
            <section className="bg-white shadow-sm py-3">
                <Container>
                    <div className="d-flex justify-content-between align-items-center">
                        <Button
                            as={Link}
                            to={`/event/${event.id}`}
                            variant="outline-primary"
                            size="sm"
                            style={{ borderRadius: '20px' }}
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                            Retour
                        </Button>

                        <h5 className="fw-bold mb-0">Achat de billets</h5>

                        <div className="d-flex align-items-center">
                            <FontAwesomeIcon icon={faShieldAlt} className="text-success me-2" />
                            <small className="text-muted">Paiement sécurisé</small>
                        </div>
                    </div>
                </Container>
            </section>

            {/* Stepper */}
            <section className="py-4 bg-white border-bottom">
                <Container>
                    <div className="d-flex justify-content-center">
                        <div className="stepper d-flex align-items-center gap-4">
                            {steps.map((step, index) => (
                                <div key={step.number} className="d-flex align-items-center">
                                    <div
                                        className={`step-circle d-flex align-items-center justify-content-center rounded-circle ${
                                            currentStep >= step.number ? 'active' : ''
                                        }`}
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            backgroundColor: currentStep >= step.number ? 'var(--primary-purple)' : '#e9ecef',
                                            color: currentStep >= step.number ? 'white' : '#6c757d',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <FontAwesomeIcon icon={step.icon} />
                                    </div>
                                    <div className="ms-2 d-none d-md-block">
                                        <div className="fw-bold small">{step.title}</div>
                                        <div className="text-muted" style={{ fontSize: '12px' }}>Étape {step.number}</div>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div
                                            className="step-line mx-4"
                                            style={{
                                                width: '60px',
                                                height: '2px',
                                                backgroundColor: currentStep > step.number ? 'var(--primary-purple)' : '#e9ecef',
                                                transition: 'all 0.3s ease'
                                            }}
                                        ></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </Container>
            </section>

            {/* Contenu principal */}
            <section className="py-5">
                <Container>
                    <Row className="g-4">
                        {/* Formulaires */}
                        <Col lg={8}>
                            {/* Étape 1: Informations personnelles */}
                            {currentStep === 1 && (
                                <AnimatedElement animation="slideInUp" delay={200}>
                                    <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                                        <Card.Body className="p-4">
                                            <h5 className="fw-bold mb-4">Informations personnelles</h5>

                                            <Row className="g-3">
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label className="fw-medium">Prénom *</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            value={userForm.firstName}
                                                            onChange={(e) => handleInputChange('user', 'firstName', e.target.value)}
                                                            isInvalid={!!errors.firstName}
                                                            style={{ borderRadius: '12px' }}
                                                        />
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.firstName}
                                                        </Form.Control.Feedback>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label className="fw-medium">Nom *</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            value={userForm.lastName}
                                                            onChange={(e) => handleInputChange('user', 'lastName', e.target.value)}
                                                            isInvalid={!!errors.lastName}
                                                            style={{ borderRadius: '12px' }}
                                                        />
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.lastName}
                                                        </Form.Control.Feedback>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label className="fw-medium">Email *</Form.Label>
                                                        <Form.Control
                                                            type="email"
                                                            value={userForm.email}
                                                            onChange={(e) => handleInputChange('user', 'email', e.target.value)}
                                                            isInvalid={!!errors.email}
                                                            style={{ borderRadius: '12px' }}
                                                        />
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.email}
                                                        </Form.Control.Feedback>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label className="fw-medium">Téléphone *</Form.Label>
                                                        <Form.Control
                                                            type="tel"
                                                            value={userForm.phone}
                                                            onChange={(e) => handleInputChange('user', 'phone', e.target.value)}
                                                            isInvalid={!!errors.phone}
                                                            placeholder="+237 6XX XXX XXX"
                                                            style={{ borderRadius: '12px' }}
                                                        />
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.phone}
                                                        </Form.Control.Feedback>
                                                    </Form.Group>
                                                </Col>
                                                <Col xs={12}>
                                                    <Form.Group>
                                                        <Form.Label className="fw-medium">Date de naissance</Form.Label>
                                                        <Form.Control
                                                            type="date"
                                                            value={userForm.dateOfBirth}
                                                            onChange={(e) => handleInputChange('user', 'dateOfBirth', e.target.value)}
                                                            style={{ borderRadius: '12px' }}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>

                                            <div className="d-flex justify-content-end mt-4">
                                                <Button
                                                    variant="primary"
                                                    onClick={nextStep}
                                                    style={{ borderRadius: '12px', minWidth: '120px' }}
                                                >
                                                    Continuer
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </AnimatedElement>
                            )}

                            {/* Étape 2: Paiement */}
                            {currentStep === 2 && (
                                <AnimatedElement animation="slideInUp" delay={200}>
                                    <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                                        <Card.Body className="p-4">
                                            <h5 className="fw-bold mb-4">Méthode de paiement</h5>

                                            {/* Sélection de la méthode */}
                                            <Row className="g-3 mb-4">
                                                {paymentMethods.map((method) => (
                                                    <Col key={method.id} md={4}>
                                                        <Card
                                                            className={`payment-method-card cursor-pointer border-2 ${
                                                                paymentForm.method === method.id ? 'border-primary' : 'border-light'
                                                            }`}
                                                            onClick={() => handleInputChange('payment', 'method', method.id)}
                                                            style={{ borderRadius: '12px', transition: 'all 0.3s ease' }}
                                                        >
                                                            <Card.Body className="text-center p-3">
                                                                <FontAwesomeIcon
                                                                    icon={method.icon}
                                                                    className={`mb-2 ${paymentForm.method === method.id ? 'text-primary' : 'text-muted'}`}
                                                                    style={{ fontSize: '1.5rem' }}
                                                                />
                                                                <h6 className="fw-bold mb-1">{method.name}</h6>
                                                                <small className="text-muted">{method.description}</small>
                                                            </Card.Body>
                                                        </Card>
                                                    </Col>
                                                ))}
                                            </Row>

                                            {/* Formulaire carte bancaire */}
                                            {paymentForm.method === 'card' && (
                                                <div>
                                                    <h6 className="fw-bold mb-3">Informations de la carte</h6>
                                                    <Row className="g-3">
                                                        <Col xs={12}>
                                                            <Form.Group>
                                                                <Form.Label className="fw-medium">Numéro de carte *</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    value={paymentForm.cardNumber}
                                                                    onChange={(e) => handleInputChange('payment', 'cardNumber', e.target.value)}
                                                                    isInvalid={!!errors.cardNumber}
                                                                    placeholder="1234 5678 9012 3456"
                                                                    style={{ borderRadius: '12px' }}
                                                                />
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.cardNumber}
                                                                </Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={6}>
                                                            <Form.Group>
                                                                <Form.Label className="fw-medium">Date d'expiration *</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    value={paymentForm.expiryDate}
                                                                    onChange={(e) => handleInputChange('payment', 'expiryDate', e.target.value)}
                                                                    isInvalid={!!errors.expiryDate}
                                                                    placeholder="MM/AA"
                                                                    style={{ borderRadius: '12px' }}
                                                                />
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.expiryDate}
                                                                </Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={6}>
                                                            <Form.Group>
                                                                <Form.Label className="fw-medium">CVV *</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    value={paymentForm.cvv}
                                                                    onChange={(e) => handleInputChange('payment', 'cvv', e.target.value)}
                                                                    isInvalid={!!errors.cvv}
                                                                    placeholder="123"
                                                                    maxLength={3}
                                                                    style={{ borderRadius: '12px' }}
                                                                />
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.cvv}
                                                                </Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col xs={12}>
                                                            <Form.Group>
                                                                <Form.Label className="fw-medium">Nom sur la carte *</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    value={paymentForm.cardName}
                                                                    onChange={(e) => handleInputChange('payment', 'cardName', e.target.value)}
                                                                    isInvalid={!!errors.cardName}
                                                                    placeholder="JOHN DOE"
                                                                    style={{ borderRadius: '12px' }}
                                                                />
                                                                <Form.Control.Feedback type="invalid">
                                                                    {errors.cardName}
                                                                </Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                </div>
                                            )}

                                            {/* Formulaire Mobile Money */}
                                            {paymentForm.method === 'mobile' && (
                                                <div>
                                                    <h6 className="fw-bold mb-3">Paiement Mobile Money</h6>
                                                    <Form.Group>
                                                        <Form.Label className="fw-medium">Numéro de téléphone *</Form.Label>
                                                        <Form.Control
                                                            type="tel"
                                                            value={paymentForm.mobileNumber}
                                                            onChange={(e) => handleInputChange('payment', 'mobileNumber', e.target.value)}
                                                            isInvalid={!!errors.mobileNumber}
                                                            placeholder="+237 6XX XXX XXX"
                                                            style={{ borderRadius: '12px' }}
                                                        />
                                                        <Form.Control.Feedback type="invalid">
                                                            {errors.mobileNumber}
                                                        </Form.Control.Feedback>
                                                        <Form.Text className="text-muted">
                                                            Vous recevrez un SMS pour confirmer le paiement
                                                        </Form.Text>
                                                    </Form.Group>
                                                </div>
                                            )}

                                            {/* PayPal */}
                                            {paymentForm.method === 'paypal' && (
                                                <div className="text-center p-4 bg-light rounded">
                                                    <FontAwesomeIcon icon={faCcPaypal} className="text-primary mb-3" style={{ fontSize: '3rem' }} />
                                                    <p className="mb-0">Vous serez redirigé vers PayPal pour finaliser le paiement</p>
                                                </div>
                                            )}

                                            <div className="d-flex justify-content-between mt-4">
                                                <Button
                                                    variant="outline-secondary"
                                                    onClick={prevStep}
                                                    style={{ borderRadius: '12px', minWidth: '120px' }}
                                                >
                                                    Retour
                                                </Button>
                                                <Button
                                                    variant="primary"
                                                    onClick={nextStep}
                                                    style={{ borderRadius: '12px', minWidth: '120px' }}
                                                >
                                                    Continuer
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </AnimatedElement>
                            )}

                            {/* Étape 3: Confirmation */}
                            {currentStep === 3 && (
                                <AnimatedElement animation="slideInUp" delay={200}>
                                    <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                                        <Card.Body className="p-4">
                                            <h5 className="fw-bold mb-4">Confirmation de commande</h5>

                                            <Alert variant="info" className="mb-4">
                                                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                                                Vérifiez vos informations avant de finaliser l'achat
                                            </Alert>

                                            <Row className="g-3 mb-4">
                                                <Col md={6}>
                                                    <h6 className="fw-bold">Informations personnelles</h6>
                                                    <p className="mb-1">{userForm.firstName} {userForm.lastName}</p>
                                                    <p className="mb-1 text-muted">{userForm.email}</p>
                                                    <p className="mb-0 text-muted">{userForm.phone}</p>
                                                </Col>
                                                <Col md={6}>
                                                    <h6 className="fw-bold">Méthode de paiement</h6>
                                                    <p className="mb-0">
                                                        {paymentMethods.find(m => m.id === paymentForm.method)?.name}
                                                    </p>
                                                    {paymentForm.method === 'card' && paymentForm.cardNumber && (
                                                        <p className="mb-0 text-muted">**** **** **** {paymentForm.cardNumber.slice(-4)}</p>
                                                    )}
                                                </Col>
                                            </Row>

                                            <div className="d-flex justify-content-between mt-4">
                                                <Button
                                                    variant="outline-secondary"
                                                    onClick={prevStep}
                                                    style={{ borderRadius: '12px', minWidth: '120px' }}
                                                >
                                                    Retour
                                                </Button>
                                                <Button
                                                    variant="success"
                                                    onClick={handlePurchase}
                                                    disabled={processing}
                                                    style={{ borderRadius: '12px', minWidth: '120px' }}
                                                >
                                                    {processing ? (
                                                        <>
                                                            <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                                                            Traitement...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FontAwesomeIcon icon={faLock} className="me-2" />
                                                            Payer {totalPrice?.toLocaleString()} FCFA
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </AnimatedElement>
                            )}
                        </Col>

                        {/* Résumé de commande */}
                        <Col lg={4}>
                            <AnimatedElement animation="slideInUp" delay={400}>
                                <Card className="border-0 shadow-sm sticky-top" style={{ borderRadius: '16px', top: '100px' }}>
                                    <Card.Body className="p-4">
                                        <h5 className="fw-bold mb-3">Résumé de commande</h5>

                                        <div className="mb-3">
                                            <img
                                                src={event.image}
                                                alt={event.title}
                                                className="img-fluid rounded mb-3"
                                                style={{ height: '120px', width: '100%', objectFit: 'cover' }}
                                            />
                                            <h6 className="fw-bold">{event.title}</h6>
                                            <div className="d-flex align-items-center text-muted small mb-1">
                                                <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                                                {formatDate(event.date)} à {event.time}
                                            </div>
                                            <div className="d-flex align-items-center text-muted small">
                                                <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" />
                                                {event.location}
                                            </div>
                                        </div>

                                        <hr />

                                        <div className="mb-3">
                                            <h6 className="fw-bold">Billets sélectionnés</h6>
                                            {tickets && Object.entries(tickets).map(([type, quantity]) => {
                                                if (quantity === 0) return null;
                                                return (
                                                    <div key={type} className="d-flex justify-content-between mb-2">
                                                        <div>
                                                            <div className="fw-medium">{event.ticketTypes[type].name}</div>
                                                            <small className="text-muted">Quantité: {quantity}</small>
                                                        </div>
                                                        <div className="text-end">
                                                            <div className="fw-bold">
                                                                {(event.price[type] * quantity).toLocaleString()} FCFA
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <hr />

                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Sous-total:</span>
                                            <span className="fw-bold">{totalPrice?.toLocaleString()} FCFA</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Frais de service:</span>
                                            <span>0 FCFA</span>
                                        </div>
                                        <hr />
                                        <div className="d-flex justify-content-between">
                                            <span className="fw-bold fs-5">Total:</span>
                                            <span className="fw-bold fs-5 text-warning">
                                                {totalPrice?.toLocaleString()} FCFA
                                            </span>
                                        </div>

                                        <div className="mt-3 p-3 bg-light rounded">
                                            <div className="d-flex align-items-start">
                                                <FontAwesomeIcon icon={faShieldAlt} className="text-success me-2 mt-1" />
                                                <div>
                                                    <small className="fw-bold">Paiement sécurisé</small>
                                                    <br />
                                                    <small className="text-muted">
                                                        Vos informations sont protégées
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </AnimatedElement>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Modal de succès */}
            <Modal
                show={showSuccessModal}
                onHide={() => setShowSuccessModal(false)}
                centered
                size="lg"
            >
                <Modal.Body className="text-center p-5">
                    <div className="mb-4">
                        <div
                            className="success-icon mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
                            style={{
                                width: '80px',
                                height: '80px',
                                backgroundColor: 'var(--bs-success)',
                                color: 'white'
                            }}
                        >
                            <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: '2.5rem' }} />
                        </div>
                        <h4 className="fw-bold text-success mb-2">Achat réussi !</h4>
                        <p className="text-muted">
                            Votre commande a été traitée avec succès.
                        </p>
                    </div>

                    <div className="bg-light p-4 rounded mb-4">
                        <h6 className="fw-bold mb-2">Numéro de commande</h6>
                        <h4 className="text-primary">{orderNumber}</h4>
                        <p className="small text-muted mb-0">
                            Vous recevrez un email de confirmation avec vos billets électroniques.
                        </p>
                    </div>

                    <div className="d-flex gap-2 justify-content-center">
                        <Button
                            as={Link}
                            to="/profile"
                            variant="primary"
                            style={{ borderRadius: '12px' }}
                        >
                            Voir mes billets
                        </Button>
                        <Button
                            as={Link}
                            to="/events"
                            variant="outline-primary"
                            style={{ borderRadius: '12px' }}
                        >
                            Autres événements
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>

            {/* Loading overlay pour le traitement */}
            {processing && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        zIndex: 9999
                    }}
                >
                    <div className="text-center text-white">
                        <div className="spinner-border text-light mb-3" role="status">
                            <span className="visually-hidden">Chargement...</span>
                        </div>
                        <h5>Traitement du paiement...</h5>
                        <p>Veuillez patienter, ne fermez pas cette page.</p>
                        <ProgressBar
                            animated
                            now={100}
                            className="mt-3"
                            style={{ width: '300px' }}
                        />
                    </div>
                </div>
            )}

            <style jsx>{`
                .payment-method-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                }

                .cursor-pointer {
                    cursor: pointer;
                }

                .success-icon {
                    animation: bounceIn 0.6s ease-out;
                }

                @keyframes bounceIn {
                    0% {
                        transform: scale(0.3);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.05);
                    }
                    70% {
                        transform: scale(0.9);
                    }
                    100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }

                @media (max-width: 768px) {
                    .sticky-top {
                        position: static !important;
                    }

                    .stepper .step-line {
                        width: 30px !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default TicketPurchase;
