import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faTwitter, faInstagram, faYoutube } from '@fortawesome/free-brands-svg-icons';
import { faMusic, faHeadphones, faUsers } from '@fortawesome/free-solid-svg-icons';

const Footer = () => {
    return (
        <footer className="footer-dark mt-5">
            <Container>
                <Row className="justify-content-between">
                    {/* Logo et description */}
                    <Col lg={4} md={6} className="mb-4">
                        <div className="d-flex align-items-center mb-3">
                            <img
                                src="/images/reveilart-logo.svg"
                                alt="reveilart"
                                style={{ height: '32px', width: 'auto' }}
                                className="me-2"
                            />
                            <span className="fw-bold fs-4 text-white">Reveilart4artist</span>
                        </div>
                        <p className="mb-3">
                            Découvrez les sons les plus authentiques du Cameroun.
                            Une plateforme dédiée à la promotion de la musique locale.
                        </p>
                        <div className="footer-social d-flex">
                            <button className="btn me-2">
                                <FontAwesomeIcon icon={faFacebook} />
                            </button>
                            <button className="btn me-2">
                                <FontAwesomeIcon icon={faTwitter} />
                            </button>
                            <button className="btn me-2">
                                <FontAwesomeIcon icon={faInstagram} />
                            </button>
                            <button className="btn">
                                <FontAwesomeIcon icon={faYoutube} />
                            </button>
                        </div>
                    </Col>

                    {/* Navigation */}
                    <Col lg={2} md={3} sm={6} className="mb-4">
                        <h5>Navigation</h5>
                        <ul className="list-unstyled">
                            <li className="mb-2"><a href="/">Accueil</a></li>
                            <li className="mb-2"><a href="/dashboard">Dashboard</a></li>
                            <li className="mb-2"><a href="/contact">Contact</a></li>
                        </ul>
                    </Col>

                    {/* Découvrir */}
                    <Col lg={2} md={3} sm={6} className="mb-4">
                        <h5>Découvrir</h5>
                        <ul className="list-unstyled">
                            <li className="mb-2">
                                <a href="#" className="d-flex align-items-center">
                                    <FontAwesomeIcon icon={faMusic} className="me-2" />
                                    Sons populaires
                                </a>
                            </li>
                            <li className="mb-2">
                                <a href="#" className="d-flex align-items-center">
                                    <FontAwesomeIcon icon={faUsers} className="me-2" />
                                    Artistes
                                </a>
                            </li>
                            <li className="mb-2">
                                <a href="#" className="d-flex align-items-center">
                                    <FontAwesomeIcon icon={faHeadphones} className="me-2" />
                                    Nouveautés
                                </a>
                            </li>
                        </ul>
                    </Col>

                    {/* Contact */}
                    <Col lg={3} md={6} className="mb-4">
                        <h5>Contact</h5>
                        <ul className="list-unstyled">
                            <li className="mb-2">Email: contact@reveilart.cm</li>
                            <li className="mb-2">Téléphone: +237 6XX XXX XXX</li>
                            <li className="mb-2">Douala, Cameroun</li>
                        </ul>
                    </Col>
                </Row>

                <hr style={{ borderColor: '#374151', margin: '2rem 0 1rem' }} />

                <Row className="align-items-center">
                    <Col md={6}>
                        <p className="mb-0 small">
                            © 2024 Reveilart4artist. Tous droits réservés.
                        </p>
                    </Col>
                    <Col md={6} className="text-md-end">
                        <small>
                            <a href="#" className="me-3">Politique de confidentialité</a>
                            <a href="#" className="me-3">Conditions d'utilisation</a>
                            <a href="#">Mentions légales</a>
                        </small>
                    </Col>
                </Row>
            </Container>
        </footer>
    );
};

export default Footer;
