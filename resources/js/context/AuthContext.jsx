import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth doit être utilisé dans un AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('auth_token'));
    const [loading, setLoading] = useState(true);

    // Configuration d'Axios avec le token
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            localStorage.setItem('auth_token', token);
        } else {
            delete axios.defaults.headers.common['Authorization'];
            localStorage.removeItem('auth_token');
        }
    }, [token]);

    // Vérifier l'authentification au démarrage
    useEffect(() => {
        const checkAuth = async () => {
            if (token) {
                try {
                    const response = await axios.get('/api/user');
                    setUser(response.data.user);
                } catch (error) {
                    console.error('Erreur lors de la vérification de l\'authentification:', error);
                    // Token invalide, nettoyer
                    setToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, [token]);

    // Fonction de connexion
    const login = async (email, password) => {
        try {
            const response = await axios.post('/api/login', {
                email,
                password
            });

            const { user, token } = response.data;
            setUser(user);
            setToken(token);

            return response.data;
        } catch (error) {
            throw error;
        }
    };

    // Fonction d'inscription
    const register = async (userData) => {
        try {
            const response = await axios.post('/api/register', userData);

            const { user, token } = response.data;
            setUser(user);
            setToken(token);

            return response.data;
        } catch (error) {
            throw error;
        }
    };

    // Fonction de déconnexion
    const logout = async () => {
        try {
            if (token) {
                await axios.post('/api/logout');
            }
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        } finally {
            setUser(null);
            setToken(null);
        }
    };

    // Fonction de déconnexion de tous les appareils
    const logoutAll = async () => {
        try {
            if (token) {
                await axios.post('/api/logout-all');
            }
        } catch (error) {
            console.error('Erreur lors de la déconnexion de tous les appareils:', error);
        } finally {
            setUser(null);
            setToken(null);
        }
    };

    // Fonction de mise à jour du profil
    const updateProfile = async (profileData) => {
        try {
            const response = await axios.put('/api/profile', profileData);
            setUser(response.data.user);
            return response.data;
        } catch (error) {
            throw error;
        }
    };

    // Fonction de changement de mot de passe
    const changePassword = async (passwordData) => {
        try {
            const response = await axios.put('/api/change-password', passwordData);
            return response.data;
        } catch (error) {
            throw error;
        }
    };

    // Fonction pour rafraîchir les données utilisateur
    const refreshUser = async () => {
        try {
            const response = await axios.get('/api/user');
            setUser(response.data.user);
            return response.data.user;
        } catch (error) {
            console.error('Erreur lors du rafraîchissement des données utilisateur:', error);
            throw error;
        }
    };

    // Fonction pour mettre à jour l'utilisateur directement
    const updateUser = (userData) => {
        setUser(userData);

        // Déclencher un événement personnalisé pour notifier les autres composants
        if (userData.photo_timestamp) {
            window.dispatchEvent(new CustomEvent('photoUpdated', {
                detail: {
                    timestamp: userData.photo_timestamp,
                    photoUrl: userData.profile_photo_url
                }
            }));
        }
    };

    // Vérifier si l'utilisateur a un rôle spécifique
    const hasRole = (role) => {
        return user && user.role === role;
    };

    // Vérifier si l'utilisateur est artiste
    const isArtist = () => {
        return hasRole('artist');
    };

    // Vérifier si l'utilisateur est producteur
    const isProducer = () => {
        return hasRole('producer');
    };

    // Vérifier si l'utilisateur est admin
    const isAdmin = () => {
        return hasRole('admin');
    };

    // Vérifier si l'utilisateur est actif
    const isActive = () => {
        return user && user.status === 'active';
    };

    // Obtenir les headers d'authentification pour les requêtes fetch
    const getAuthHeaders = () => {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    };

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        logoutAll,
        updateProfile,
        changePassword,
        refreshUser,
        updateUser,
        hasRole,
        isArtist,
        isProducer,
        isAdmin,
        isActive,
        getAuthHeaders
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
