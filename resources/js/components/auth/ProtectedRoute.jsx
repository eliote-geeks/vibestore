import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spinner, Container, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null, requiredRoles = [] }) => {
    const { user, loading, isAuthenticated } = useAuth();
    const location = useLocation();

    // Affichage du spinner pendant le chargement
    if (loading) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
                <div className="text-center">
                    <Spinner animation="border" variant="primary" className="mb-3" />
                    <p className="text-muted">Chargement...</p>
                </div>
            </div>
        );
    }

    // Redirection vers la page de connexion si non authentifié
    if (!isAuthenticated) {
        return <Navigate
            to="/login"
            state={{ from: location }}
            replace
        />;
    }

    // Vérification du rôle si spécifié
    if (requiredRole && user.role !== requiredRole) {
        return (
            <Container className="py-5" style={{ paddingTop: '100px' }}>
                <Alert variant="danger" className="text-center">
                    <Alert.Heading>Accès refusé</Alert.Heading>
                    <p className="mb-0">
                        Vous n'avez pas les permissions nécessaires pour accéder à cette page.
                        <br />
                        Rôle requis : <strong>{requiredRole}</strong>
                        <br />
                        Votre rôle : <strong>{user.role}</strong>
                    </p>
                </Alert>
            </Container>
        );
    }

    // Vérification des rôles multiples si spécifiés
    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        return (
            <Container className="py-5" style={{ paddingTop: '100px' }}>
                <Alert variant="danger" className="text-center">
                    <Alert.Heading>Accès refusé</Alert.Heading>
                    <p className="mb-0">
                        Vous n'avez pas les permissions nécessaires pour accéder à cette page.
                        <br />
                        Rôles autorisés : <strong>{requiredRoles.join(', ')}</strong>
                        <br />
                        Votre rôle : <strong>{user.role}</strong>
                    </p>
                </Alert>
            </Container>
        );
    }

    // Vérification si le compte est actif
    if (user.status !== 'active') {
        return (
            <Container className="py-5" style={{ paddingTop: '100px' }}>
                <Alert variant="warning" className="text-center">
                    <Alert.Heading>Compte suspendu</Alert.Heading>
                    <p className="mb-0">
                        Votre compte a été suspendu. Veuillez contacter l'administration.
                        <br />
                        Statut actuel : <strong>{user.status}</strong>
                    </p>
                </Alert>
            </Container>
        );
    }

    // Affichage du composant enfant si toutes les conditions sont remplies
    return children;
};

export default ProtectedRoute;
