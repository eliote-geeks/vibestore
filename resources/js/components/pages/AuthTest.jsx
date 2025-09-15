import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Form, Badge } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';

const AuthTest = () => {
    const [testResults, setTestResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user, token, loading: authLoading, isAuthenticated } = useAuth();

    const addResult = (test, success, message, data = null) => {
        setTestResults(prev => [...prev, {
            test,
            success,
            message,
            data,
            timestamp: new Date().toLocaleTimeString()
        }]);
    };

    const runTest = async (testName, testFunction) => {
        try {
            setLoading(true);
            const result = await testFunction();
            addResult(testName, true, result.message, result.data);
        } catch (error) {
            addResult(testName, false, error.message, error);
        } finally {
            setLoading(false);
        }
    };

    const testAuthContext = async () => {
        return {
            message: `Context Auth: ${isAuthenticated ? 'Authentifié' : 'Non authentifié'}`,
            data: {
                user: user ? { id: user.id, name: user.name, email: user.email } : null,
                token: token ? 'TOKEN_PRÉSENT' : 'PAS_DE_TOKEN',
                authLoading,
                isAuthenticated,
                localStorage_token: localStorage.getItem('auth_token') ? 'PRÉSENT' : 'ABSENT'
            }
        };
    };

    const testApiUser = async () => {
        const response = await fetch('/api/user', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            message: 'API /api/user accessible',
            data
        };
    };

    const testApiProfileComplete = async () => {
        const response = await fetch('/api/user/profile-complete', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return {
            message: 'API /api/user/profile-complete accessible',
            data
        };
    };

    const testLocalStorage = async () => {
        const stored_token = localStorage.getItem('auth_token');
        const stored_user = localStorage.getItem('user');

        return {
            message: 'État du localStorage',
            data: {
                auth_token: stored_token ? `${stored_token.substring(0, 20)}...` : 'ABSENT',
                user: stored_user ? JSON.parse(stored_user) : 'ABSENT',
                matches_context: stored_token === token
            }
        };
    };

    const runAllTests = () => {
        setTestResults([]);
        runTest('Context Auth', testAuthContext);

        if (token) {
            runTest('API /api/user', testApiUser);
            runTest('API Profile Complete', testApiProfileComplete);
        }

        runTest('LocalStorage', testLocalStorage);
    };

    return (
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col lg={10}>
                    <Card>
                        <Card.Header>
                            <h3>🔐 Test d'Authentification</h3>
                            <p className="mb-0 text-muted">Diagnostic des problèmes d'authentification</p>
                        </Card.Header>
                        <Card.Body>
                            {/* État actuel */}
                            <Alert variant={isAuthenticated ? 'success' : 'warning'}>
                                <h5>État actuel</h5>
                                <p><strong>Authentifié:</strong> <Badge bg={isAuthenticated ? 'success' : 'danger'}>{isAuthenticated ? 'OUI' : 'NON'}</Badge></p>
                                <p><strong>Utilisateur:</strong> {user ? `${user.name} (${user.email})` : 'Non connecté'}</p>
                                <p><strong>Token:</strong> {token ? `${token.substring(0, 20)}...` : 'Aucun'}</p>
                                <p><strong>Loading:</strong> <Badge bg={authLoading ? 'warning' : 'success'}>{authLoading ? 'OUI' : 'NON'}</Badge></p>
                            </Alert>

                            {/* Bouton de test */}
                            <div className="text-center mb-4">
                                <Button
                                    variant="primary"
                                    onClick={runAllTests}
                                    disabled={loading}
                                >
                                    {loading ? 'Tests en cours...' : 'Lancer tous les tests'}
                                </Button>
                            </div>

                            {/* Résultats des tests */}
                            {testResults.length > 0 && (
                                <div>
                                    <h5>Résultats des tests</h5>
                                    {testResults.map((result, index) => (
                                        <Alert
                                            key={index}
                                            variant={result.success ? 'success' : 'danger'}
                                            className="mb-2"
                                        >
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <strong>{result.test}</strong>
                                                    <p className="mb-1">{result.message}</p>
                                                    {result.data && (
                                                        <details>
                                                            <summary>Voir les détails</summary>
                                                            <pre className="mt-2 small">
                                                                {JSON.stringify(result.data, null, 2)}
                                                            </pre>
                                                        </details>
                                                    )}
                                                </div>
                                                <Badge variant="light">{result.timestamp}</Badge>
                                            </div>
                                        </Alert>
                                    ))}
                                </div>
                            )}

                            {/* Instructions */}
                            <Alert variant="info" className="mt-4">
                                <h6>💡 Instructions de débogage</h6>
                                <ol>
                                    <li>Vérifiez que vous êtes bien connecté sur une autre page</li>
                                    <li>Regardez les logs de la console (F12)</li>
                                    <li>Vérifiez le localStorage dans les DevTools</li>
                                    <li>Testez la connexion avec un token valide</li>
                                </ol>
                            </Alert>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default AuthTest;
