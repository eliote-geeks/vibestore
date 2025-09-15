import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

const Contact = () => {
    return (
        <div className="min-vh-100 bg-light" style={{ paddingTop: '80px' }}>
                <Container>
                    <Row className="justify-content-center">
                    <Col md={8}>
                            <Card className="border-0 shadow-sm">
                            <Card.Body className="p-5 text-center">
                                <h1 className="fw-bold mb-4">Contactez-nous</h1>
                                <p className="text-muted">
                                    Cette page sera bientôt disponible.
                                    </p>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
        </div>
    );
};

export default Contact;
