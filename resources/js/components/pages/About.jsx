import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

const About = () => {
    return (
        <div className="min-vh-100 bg-light" style={{ paddingTop: '80px' }}>
            <Container>
                <Row className="justify-content-center">
                    <Col md={8}>
                        <Card className="border-0 shadow-sm">
                            <Card.Body className="p-5 text-center">
                                <h1 className="fw-bold mb-4">À propos de VibeStore237</h1>
                                <p className="text-muted">
                                    Plateforme musicale camerounaise dédiée aux artistes locaux.
                                    Cette page sera bientôt complétée avec plus d'informations.
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default About;
