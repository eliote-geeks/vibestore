import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Table, Form, Modal, Alert, ProgressBar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTachometerAlt,
    faMusic,
    faCalendarAlt,
    faUsers,
    faChartLine,
    faDownload,
    faEuroSign,
    faTicketAlt,
    faHeart,
    faPlay,
    faShoppingCart,
    faEye,
    faEdit,
    faTrash,
    faPlus,
    faCog,
    faSignOutAlt,
    faSearch,
    faArrowUp,
    faArrowDown,
    faBell,
    faGlobe,
    faCrown,
    faStar,
    faHome,
    faMapMarkerAlt,
    faUpload,
    faClock,
    faTags,
    faSpinner,
    faCheckCircle,
    faTimesCircle,
    faExclamationTriangle,
    faPause,
    faStop,
    faStepForward,
    faStepBackward,
    faVolumeUp,
    faVolumeDown,
    faVolumeMute,
    faPercentage,
    faCreditCard,
    faSync,
    faUndo,
    faUser,
    faCheck,
    faTimes,
    faVideo,
    faAward,
    faCertificate
} from '@fortawesome/free-solid-svg-icons';
import CategoryManagement from './CategoryManagement';
import ClipManagement from './ClipManagement';
import CertificationManagement from './CertificationManagement';
import Analytics from './Analytics';
import PaymentManagement from './PaymentManagement';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DataTable from 'react-data-table-component';
import styled from 'styled-components';
import '../../../css/dashboard.css'; // Import du CSS dashboard

// Styles additionnels pour les cartes de statistiques
const styles = `
    .stat-card {
        transition: all 0.3s ease !important;
        border: 1px solid rgba(226, 232, 240, 0.8) !important;
    }
    .stat-card:hover {
        transform: translateY(-4px) !important;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1) !important;
    }
    .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
    }
`;

// Injecter les styles
if (!document.getElementById('dashboard-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'dashboard-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState('7d');
    const [loading, setLoading] = useState(false);

    // États pour les modals et confirmations
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [eventFilter, setEventFilter] = useState('all');

    // États pour l'approbation/rejet des sons
    const [showSoundApproveModal, setShowSoundApproveModal] = useState(false);
    const [showSoundRejectModal, setShowSoundRejectModal] = useState(false);
    const [selectedSound, setSelectedSound] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [soundFilter, setSoundFilter] = useState('all');

    // États pour le lecteur audio
    const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioRef, setAudioRef] = useState(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [showAudioPlayer, setShowAudioPlayer] = useState(false);

    // États pour la recherche dans les DataTables
    const [soundsSearchTerm, setSoundsSearchTerm] = useState('');
    const [eventsSearchTerm, setEventsSearchTerm] = useState('');
    const [usersSearchTerm, setUsersSearchTerm] = useState('');

    // États pour les données API
    const [sounds, setSounds] = useState([]);
    const [events, setEvents] = useState([]);
    const [users, setUsers] = useState([]);
    const [usersRevenue, setUsersRevenue] = useState([]);
    const [revenueStats, setRevenueStats] = useState({});

    // États pour la gestion des commissions
    const [tempCommissionSettings, setTempCommissionSettings] = useState({
        sound_commission: 15,
        event_commission: 10
    });
    const [savingCommissions, setSavingCommissions] = useState(false);

    // États pour la gestion des paiements dans la section revenus
    const [selectedUser, setSelectedUser] = useState(null);
    const [userPayments, setUserPayments] = useState([]);
    const [showPaymentsModal, setShowPaymentsModal] = useState(false);
    const [showPaymentActionModal, setShowPaymentActionModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [paymentAction, setPaymentAction] = useState(''); // approve, cancel, refund
    const [paymentActionReason, setPaymentActionReason] = useState('');
    const [loadingPayments, setLoadingPayments] = useState(false);
    const [processingPaymentAction, setProcessingPaymentAction] = useState(false);
    const [paymentsFilter, setPaymentsFilter] = useState('all'); // all, pending, completed, cancelled, refunded
    const [paymentsSearchTerm, setPaymentsSearchTerm] = useState('');

    // États pour le traitement par lot des paiements
    const [selectedPayments, setSelectedPayments] = useState([]);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [batchAction, setBatchAction] = useState('');
    const [batchReason, setBatchReason] = useState('');
    const [processingBatch, setProcessingBatch] = useState(false);

    // États pour l'analyse des achats
    const [usersPurchases, setUsersPurchases] = useState([]);
    const [purchasesStats, setPurchasesStats] = useState({});
    const [searchResults, setSearchResults] = useState([]);
    const [productPayments, setProductPayments] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [showProductPaymentsModal, setShowProductPaymentsModal] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [receiptData, setReceiptData] = useState(null);
    const [searchCriteria, setSearchCriteria] = useState({
        search: '',
        status: 'all',
        type: 'all',
        min_amount: '',
        max_amount: '',
        start_date: '',
        end_date: '',
        user_id: '',
        seller_id: ''
    });
    const [purchasesSearchTerm, setPurchasesSearchTerm] = useState('');
    const [purchasesFilter, setPurchasesFilter] = useState('all');
    const [loadingSearchResults, setLoadingSearchResults] = useState(false);
    const [loadingProductPayments, setLoadingProductPayments] = useState(false);
    const [loadingReceipt, setLoadingReceipt] = useState(false);

    const [stats, setStats] = useState({
        // Statistiques principales
        totalSounds: 0,
        totalEvents: 0,
        totalUsers: 0,
        totalRevenue: 0,

        // Statistiques détaillées
        totalPlays: 0,
        totalDownloads: 0,
        totalLikes: 0,
        activeEvents: 0,
        totalTicketsSold: 0,
        totalEventRevenue: 0,

        // Utilisateurs
        artistsCount: 0,
        producersCount: 0,

        // Croissance et tendances
        newUsers: { count: 0, change: 0 },
        monthlyGrowth: 0,
        pendingOrders: 0,
        topArtist: "Aucun"
    });

    // États pour stocker les données supplémentaires
    const [dailyStats, setDailyStats] = useState([]);
    const [topSellers, setTopSellers] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);

    const { token, user } = useAuth();
    const toast = useToast();

    useEffect(() => {
        loadDashboardData();
        loadCommissionSettings(); // Charger les paramètres de commission au démarrage
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadSounds(),
                loadEvents(),
                loadUsers(),
                loadStats(),
                loadUsersRevenue(),
                loadUsersPurchases()
            ]);
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            toast.error('Erreur', 'Impossible de charger les données du dashboard');
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour charger les paramètres de commission (simplifiée)
    const loadCommissionSettings = async () => {
        try {
            // S'assurer que tempCommissionSettings a une valeur par défaut
            if (!tempCommissionSettings) {
                setTempCommissionSettings({
                    sound_commission: 15,
                    event_commission: 10
                });
            }

            const response = await fetch('/api/dashboard/commission', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.rates) {
                    setTempCommissionSettings({
                        sound_commission: data.rates.sound_commission || 15,
                        event_commission: data.rates.event_commission || 10
                    });
                }
            }
        } catch (error) {
            console.error('Erreur chargement commission:', error);
            // Utiliser les valeurs par défaut en cas d'erreur
            setTempCommissionSettings({
                sound_commission: 15,
                event_commission: 10
            });
        }
    };

    const loadSounds = async () => {
        try {
            const response = await fetch('/api/dashboard/sounds', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSounds(Array.isArray(data) ? data : []);
            } else {
                // Fallback
                setSounds([]);
            }
        } catch (error) {
            console.error('Erreur chargement sons:', error);
            setSounds([]);
        }
    };

    const loadEvents = async () => {
        try {
            const response = await fetch('/api/dashboard/events', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setEvents(Array.isArray(data) ? data : []);
            } else {
                setEvents([]);
            }
        } catch (error) {
            console.error('Erreur chargement événements:', error);
            setEvents([]);
        }
    };

    const loadUsers = async () => {
        try {
            const response = await fetch('/api/dashboard/users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(Array.isArray(data) ? data : []);
            } else {
                setUsers([]);
            }
        } catch (error) {
            console.error('Erreur chargement utilisateurs:', error);
            setUsers([]);
        }
    };

    const loadUsersRevenue = async () => {
        try {
            const response = await fetch('/api/dashboard/users-revenue', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUsersRevenue(Array.isArray(data.users_revenue) ? data.users_revenue : []);
                setRevenueStats(data.summary || {});
            } else {
                setUsersRevenue([]);
                setRevenueStats({});
            }
        } catch (error) {
            console.error('Erreur chargement revenus utilisateurs:', error);
            setUsersRevenue([]);
            setRevenueStats({});
        }
    };

    // Charger les achats/dépenses des utilisateurs
    const loadUsersPurchases = async () => {
        try {
            const response = await fetch('/api/dashboard/users-purchases', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUsersPurchases(Array.isArray(data.users_purchases) ? data.users_purchases : []);
                setPurchasesStats(data.summary || {});
            } else {
                setUsersPurchases([]);
                setPurchasesStats({});
            }
        } catch (error) {
            console.error('Erreur chargement achats utilisateurs:', error);
            setUsersPurchases([]);
            setPurchasesStats({});
        }
    };

    // Rechercher des paiements avec critères avancés
    const searchPayments = async (criteria = {}) => {
        setLoadingSearchResults(true);
        try {
            const params = new URLSearchParams({
                per_page: 20,
                ...criteria
            });

            const response = await fetch(`/api/dashboard/payments/search?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setSearchResults(data.payments.data || []);
                } else {
                    toast.error('Erreur', data.message || 'Impossible de rechercher les paiements');
                    setSearchResults([]);
                }
            } else {
                toast.error('Erreur', 'Erreur de connexion au serveur');
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Erreur recherche paiements:', error);
            toast.error('Erreur', 'Erreur de connexion au serveur');
            setSearchResults([]);
        } finally {
            setLoadingSearchResults(false);
        }
    };

    // Charger les paiements d'un produit spécifique
    const loadProductPayments = async (type, productId, filters = {}) => {
        setLoadingProductPayments(true);
        try {
            const params = new URLSearchParams({
                per_page: 20,
                ...filters
            });

            const response = await fetch(`/api/dashboard/products/${type}/${productId}/payments?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setProductPayments(data.payments.data || []);
                    setSelectedProduct({
                        ...data.product,
                        type,
                        stats: data.stats
                    });
                } else {
                    toast.error('Erreur', data.message || 'Impossible de charger les paiements du produit');
                    setProductPayments([]);
                }
            } else {
                toast.error('Erreur', 'Erreur de connexion au serveur');
                setProductPayments([]);
            }
        } catch (error) {
            console.error('Erreur chargement paiements produit:', error);
            toast.error('Erreur', 'Erreur de connexion au serveur');
            setProductPayments([]);
        } finally {
            setLoadingProductPayments(false);
        }
    };

    // Générer un reçu pour un paiement
    const generateReceipt = async (paymentId) => {
        setLoadingReceipt(true);
        try {
            const response = await fetch(`/api/dashboard/payments/${paymentId}/receipt`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setReceiptData(data.receipt);
                    setShowReceiptModal(true);
                } else {
                    toast.error('Erreur', data.message || 'Impossible de générer le reçu');
                }
            } else {
                toast.error('Erreur', 'Erreur de connexion au serveur');
            }
        } catch (error) {
            console.error('Erreur génération reçu:', error);
            toast.error('Erreur', 'Erreur de connexion au serveur');
        } finally {
            setLoadingReceipt(false);
        }
    };

    // Ouvrir le modal de recherche avancée
    const openSearchModal = () => {
        setSearchCriteria({
            search: '',
            status: 'all',
            type: 'all',
            min_amount: '',
            max_amount: '',
            start_date: '',
            end_date: '',
            user_id: '',
            seller_id: ''
        });
        setSearchResults([]);
        setShowSearchModal(true);
    };

    // Ouvrir le modal des paiements d'un produit
    const openProductPaymentsModal = (type, productId, productName) => {
        setSelectedProduct({ type, id: productId, name: productName });
        setProductPayments([]);
        setShowProductPaymentsModal(true);
        loadProductPayments(type, productId);
    };

    const loadStats = async () => {
        try {
            // Récupérer les vraies statistiques depuis l'API
            const response = await fetch('/api/dashboard/stats', {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });

            if (!response.ok) {
                console.warn(`API stats error: ${response.status}`);
                // Utiliser des stats par défaut si l'API échoue
                setStats(prevStats => ({
                    ...prevStats,
                    totalUsers: users.length || 0,
                    totalSounds: sounds.length || 0,
                    totalEvents: events.length || 0,
                    totalRevenue: 0,
                    totalCommission: 0,
                    totalPayments: 0
                }));
                return;
            }

            const data = await response.json();
            console.log('Stats API response:', data);

            // Mettre à jour les stats avec les vraies données
            if (data.payment_stats && data.general_stats) {
                const paymentStats = data.payment_stats;
                const generalStats = data.general_stats;

                setStats(prevStats => ({
                    ...prevStats,
                    // Statistiques principales des paiements
                    totalRevenue: paymentStats.total_amount || 0,
                    totalPayments: paymentStats.total_payments || 0,
                    totalCommission: paymentStats.total_commission || 0,
                    averagePayment: paymentStats.average_amount || 0,

                    // Statistiques par statut
                    completedPayments: paymentStats.completed_payments || 0,
                    pendingPayments: paymentStats.pending_payments || 0,
                    failedPayments: paymentStats.failed_payments || 0,
                    refundedPayments: paymentStats.refunded_payments || 0,

                    // Statistiques par type
                    soundPayments: paymentStats.sound_payments || 0,
                    eventPayments: paymentStats.event_payments || 0,

                    // Statistiques générales de la plateforme
                    totalUsers: generalStats.total_users || 0,
                    totalSounds: generalStats.total_sounds || 0,
                    totalEvents: generalStats.total_events || 0,
                    activeUsers: generalStats.active_users || 0,
                    publishedSounds: generalStats.published_sounds || 0,
                    publishedEvents: generalStats.published_events || 0,
                    activeEvents: generalStats.published_events || 0,

                    // Calculer la croissance basée sur les données réelles
                    monthlyGrowth: paymentStats.total_payments > 0 ?
                        Math.round(((paymentStats.completed_payments / paymentStats.total_payments) * 100) * 100) / 100 : 0,

                    // Top vendeur basé sur les vraies données
                    topArtist: data.top_sellers && data.top_sellers.length > 0 ?
                        data.top_sellers[0].seller_name : 'Aucun'
                }));

                // Stocker les données supplémentaires pour d'autres usages
                if (data.daily_stats) {
                    setDailyStats(data.daily_stats);
                }
                if (data.top_sellers) {
                    setTopSellers(data.top_sellers);
                }
                if (data.payment_methods) {
                    setPaymentMethods(data.payment_methods);
                }
            }

        } catch (error) {
            console.error('Erreur lors du chargement des statistiques:', error);
            // Utiliser des données de fallback en cas d'erreur
            setStats(prevStats => ({
                ...prevStats,
                totalUsers: users.length || 0,
                totalSounds: sounds.length || 0,
                totalEvents: events.length || 0,
                totalRevenue: 0,
                totalCommission: 0,
                totalPayments: 0,
                completedPayments: 0,
                pendingPayments: 0,
                failedPayments: 0,
                refundedPayments: 0,
                soundPayments: 0,
                eventPayments: 0,
                activeUsers: users.length || 0,
                publishedSounds: sounds.filter(s => s.status === 'published').length || 0,
                publishedEvents: events.filter(e => e.status === 'published').length || 0,
                activeEvents: events.filter(e => e.status === 'published').length || 0,
                monthlyGrowth: 0,
                topArtist: 'Aucun'
            }));
        }
    };

    // Mettre à jour les stats quand les données changent
    useEffect(() => {
        if (sounds.length > 0 || events.length > 0) {
            loadStats();
        }
    }, [sounds, events, users]);

    const handleDeleteSound = async (soundId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce son ?')) {
            return;
        }

        try {
            const response = await fetch(`/api/sounds/${soundId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Succès', 'Son supprimé avec succès');
                loadSounds(); // Recharger la liste
            } else {
                toast.error('Erreur', data.message || 'Impossible de supprimer le son');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            toast.error('Erreur', 'Erreur de connexion au serveur');
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
            return;
        }

        try {
            const response = await fetch(`/api/events/${eventId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Succès', 'Événement supprimé avec succès');
                loadEvents(); // Recharger la liste
            } else {
                toast.error('Erreur', data.message || 'Impossible de supprimer l\'événement');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            toast.error('Erreur', 'Erreur de connexion au serveur');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                toast.success('Succès', 'Utilisateur supprimé');
                loadUsers();
            } else {
                toast.error('Erreur', 'Impossible de supprimer l\'utilisateur');
            }
        } catch (error) {
            console.error('Erreur suppression utilisateur:', error);
            toast.error('Erreur', 'Erreur de connexion');
        }
    };

    // Nouvelles fonctions pour la gestion des événements
    const canManageEvent = (event, user) => {
        if (!user) return false;
        return user.role === 'admin' || user.id === event.user_id;
    };

    const openDeleteModal = (event) => {
        setSelectedEvent(event);
        setShowDeleteModal(true);
    };

    const openApproveModal = (event) => {
        setSelectedEvent(event);
        setShowApproveModal(true);
    };

    const closeModals = () => {
        setShowDeleteModal(false);
        setShowApproveModal(false);
        setSelectedEvent(null);
        setActionLoading(false);
    };

    const handleConfirmDelete = async () => {
        if (!selectedEvent) return;

        try {
            setActionLoading(true);
            const response = await fetch(`/api/events/${selectedEvent.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Succès', 'Événement supprimé avec succès');
                loadEvents(); // Recharger la liste
                closeModals();
            } else {
                toast.error('Erreur', data.message || 'Impossible de supprimer l\'événement');
                setActionLoading(false);
            }
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            toast.error('Erreur', 'Erreur de connexion au serveur');
            setActionLoading(false);
        }
    };

    const handleApproveEvent = async (eventId) => {
        try {
            setActionLoading(true);
            const response = await fetch(`/api/events/${eventId}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success || response.ok) {
                toast.success('Succès', 'Événement approuvé avec succès');
                loadEvents(); // Recharger la liste
            } else {
                toast.error('Erreur', data.message || 'Impossible d\'approuver l\'événement');
            }
        } catch (error) {
            console.error('Erreur lors de l\'approbation:', error);
            toast.error('Erreur', 'Erreur de connexion au serveur');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateEvent = async (eventData) => {
        if (!selectedEvent) return;

        try {
            setActionLoading(true);
            const response = await fetch(`/api/events/${selectedEvent.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Succès', 'Événement mis à jour avec succès');
                loadEvents(); // Recharger la liste
                closeModals();
            } else {
                toast.error('Erreur', data.message || 'Impossible de mettre à jour l\'événement');
                setActionLoading(false);
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);
            toast.error('Erreur', 'Erreur de connexion au serveur');
            setActionLoading(false);
        }
    };

    const recentActivities = [
        {
            id: 1,
            type: 'sound',
            title: 'Nouveau son ajouté',
            description: sounds.length > 0 ? `"${sounds[0].title}" par ${typeof sounds[0].artist === 'object' ? sounds[0].artist?.name || sounds[0].user?.name || 'Artiste' : sounds[0].artist || 'Artiste'}` : 'Aucun son récent',
            time: 'Il y a 2 heures',
            icon: faMusic,
            color: 'primary'
        },
        {
            id: 2,
            type: 'event',
            title: 'Événement créé',
            description: events.length > 0 ? events[0].title : 'Aucun événement récent',
            time: 'Il y a 5 heures',
            icon: faCalendarAlt,
            color: 'success'
        },
        {
            id: 3,
            type: 'user',
            title: 'Nouvel utilisateur',
            description: 'Jean Kamga a rejoint la plateforme',
            time: 'Il y a 1 jour',
            icon: faUsers,
            color: 'info'
        }
    ];

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-CM', {
            style: 'currency',
            currency: 'XAF',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            active: { variant: 'success', text: 'Actif' },
            pending: { variant: 'warning', text: 'En attente' },
            published: { variant: 'success', text: 'Publié' },
            draft: { variant: 'secondary', text: 'Brouillon' },
            suspended: { variant: 'danger', text: 'Suspendu' }
        };
        const config = statusConfig[status] || { variant: 'secondary', text: status };
        return <Badge bg={config.variant}>{config.text}</Badge>;
    };

    // Données pour la gestion des sons
    const allSounds = [
        {
            id: 1,
            title: "Afro Fusion Beat",
            artist: "DJ Cameroun",
            uploadDate: "2024-03-15",
            plays: 542,
            downloads: 32,
            revenue: 24000,
            status: "published",
            category: "Afrobeat",
            duration: "3:45",
            cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop"
        },
        {
            id: 2,
            title: "Makossa Electric",
            artist: "BeatMaster237",
            uploadDate: "2024-03-10",
            plays: 387,
            downloads: 28,
            revenue: 21000,
            status: "published",
            category: "Traditional",
            duration: "4:12",
            cover: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=100&h=100&fit=crop"
        },
        {
            id: 3,
            title: "Urban Vibes",
            artist: "SoundCraft",
            uploadDate: "2024-03-05",
            plays: 689,
            downloads: 45,
            revenue: 33750,
            status: "pending",
            category: "Hip-Hop",
            duration: "3:28",
            cover: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=100&h=100&fit=crop"
        },
        {
            id: 4,
            title: "Bikutsi Modern",
            artist: "DJ Yaoundé",
            uploadDate: "2024-02-28",
            plays: 234,
            downloads: 18,
            revenue: 13500,
            status: "draft",
            category: "Traditional",
            duration: "3:56",
            cover: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=100&h=100&fit=crop"
        }
    ];

    // Données pour la gestion des événements
    const allEvents = [
        {
            id: 1,
            title: "RéveilArt4artist Festival 2024",
            venue: "Stade Ahmadou Ahidjo",
            city: "Yaoundé",
            date: "2024-06-15",
            ticketsSold: 1250,
            totalTickets: 2000,
            revenue: 15000000,
            status: "active",
            category: "Festival",
            organizer: "Events CM"
        },
        {
            id: 2,
            title: "Nuit Afrobeat Douala",
            venue: "Palais des Sports",
            city: "Douala",
            date: "2024-05-20",
            ticketsSold: 680,
            totalTickets: 800,
            revenue: 6800000,
            status: "active",
            category: "Concert",
            organizer: "Music Pro"
        },
        {
            id: 3,
            title: "Makossa Revival",
            venue: "Centre Culturel",
            city: "Bafoussam",
            date: "2024-07-10",
            ticketsSold: 156,
            totalTickets: 300,
            revenue: 1560000,
            status: "pending",
            category: "Concert",
            organizer: "Cultural Events"
        }
    ];

    // Navigation items
    const navigationItems = [
        { id: 'overview', label: 'Vue d\'ensemble', icon: faTachometerAlt, color: 'primary' },
        { id: 'sounds', label: 'Sons', icon: faMusic, color: 'info', count: stats.total_sounds },
        { id: 'events', label: 'Événements', icon: faCalendarAlt, color: 'success', count: stats.total_events },
        { id: 'clips', label: 'Clips', icon: faVideo, color: 'warning', count: 0 },
        { id: 'users', label: 'Utilisateurs', icon: faUsers, color: 'warning', count: stats.total_users },
        { id: 'revenue', label: 'Revenus', icon: faEuroSign, color: 'success', count: revenueStats.active_sellers || 0 },
        { id: 'purchases', label: 'Achats', icon: faShoppingCart, color: 'info', count: purchasesStats.total_buyers || 0 },
        { id: 'payments', label: 'Paiements', icon: faCreditCard, color: 'warning', count: stats.total_payments || 0 },
        { id: 'certifications', label: 'Certifications', icon: faAward, color: 'success' },
        { id: 'analytics', label: 'Analytics', icon: faChartLine, color: 'danger' },
        { id: 'categories', label: 'Catégories', icon: faTags, color: 'secondary' },
        { id: 'settings', label: 'Paramètres', icon: faCog, color: 'secondary' }
    ];

    // Fonctions de filtrage pour les DataTables
    const getFilteredSounds = () => {
        return sounds
            .filter(sound => soundFilter === 'all' || sound.status === soundFilter)
            .filter(sound => {
                if (!soundsSearchTerm) return true;
                const searchLower = soundsSearchTerm.toLowerCase();
                const artistName = typeof sound.artist === 'object' ?
                    sound.artist?.name || sound.user?.name || '' :
                    sound.artist || sound.user?.name || '';

                return sound.title?.toLowerCase().includes(searchLower) ||
                       artistName.toLowerCase().includes(searchLower) ||
                       (sound.category || '').toLowerCase().includes(searchLower);
            });
    };

    const getFilteredEvents = () => {
        return events
            .filter(event => eventFilter === 'all' || event.status === eventFilter)
            .filter(event => {
                if (!eventsSearchTerm) return true;
                const searchLower = eventsSearchTerm.toLowerCase();

                return event.title?.toLowerCase().includes(searchLower) ||
                       (event.venue || '').toLowerCase().includes(searchLower) ||
                       (event.city || '').toLowerCase().includes(searchLower) ||
                       (event.location || '').toLowerCase().includes(searchLower);
            });
    };

    const getFilteredUsers = () => {
        return users.filter(user => {
            if (!usersSearchTerm) return true;
            const searchLower = usersSearchTerm.toLowerCase();

            return user.name?.toLowerCase().includes(searchLower) ||
                   user.email?.toLowerCase().includes(searchLower) ||
                   user.role?.toLowerCase().includes(searchLower);
        });
    };

    // Configuration des DataTables
    const dataTableConfig = {
        pagination: true,
        paginationPerPage: 10,
        paginationRowsPerPageOptions: [10, 20, 30, 50],
        responsive: true,
        highlightOnHover: true,
        striped: true,
        dense: true
    };

    // Fonction pour formater le temps (définie plus tôt)
    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Fonction pour jouer/arrêter un son améliorée
    const togglePlaySound = (sound) => {
        console.log('Playing sound:', sound); // Debug

        if (currentlyPlaying && currentlyPlaying.id === sound.id) {
            // Arrêter le son en cours
            if (audioRef) {
                audioRef.pause();
                setIsPlaying(false);
                setCurrentlyPlaying(null);
                setShowAudioPlayer(false);
            }
        } else {
            // Jouer un nouveau son
            if (audioRef) {
                audioRef.pause();
            }

            // Construire l'URL du fichier audio avec fallback
            let audioUrl = null;

            if (sound.file_url) {
                audioUrl = sound.file_url;
            } else if (sound.file_path) {
                // Vérifier si le chemin commence déjà par /storage
                if (sound.file_path.startsWith('/storage')) {
                    audioUrl = sound.file_path;
                } else if (sound.file_path.startsWith('storage/')) {
                    audioUrl = '/' + sound.file_path;
                } else {
                    audioUrl = `/storage/${sound.file_path}`;
                }
            } else {
                // Fichier de démonstration
                audioUrl = '/storage/sounds/demo.mp3';
            }

            console.log('Audio URL:', audioUrl); // Debug

            const audio = new Audio(audioUrl);
            audio.volume = volume;
            setAudioRef(audio);
            setCurrentlyPlaying(sound);
            setShowAudioPlayer(true);

            // Gestion des événements audio
            audio.addEventListener('loadedmetadata', () => {
                setDuration(audio.duration);
                console.log('Audio duration loaded:', audio.duration); // Debug
            });

            audio.addEventListener('timeupdate', () => {
                setCurrentTime(audio.currentTime);
            });

            audio.addEventListener('ended', () => {
                setIsPlaying(false);
                setCurrentlyPlaying(null);
                setShowAudioPlayer(false);
                setCurrentTime(0);
            });

            audio.addEventListener('error', (e) => {
                console.error('Erreur audio:', e);
                console.error('URL problématique:', audioUrl);
                toast.error('Erreur', `Impossible de charger le fichier audio: ${sound.title}`);
                setCurrentlyPlaying(null);
                setShowAudioPlayer(false);
                setIsPlaying(false);
            });

            audio.addEventListener('loadstart', () => {
                console.log('Début chargement audio:', audioUrl);
            });

            audio.addEventListener('canplay', () => {
                console.log('Audio prêt à jouer');
            });

            // Tenter de lire le son
            audio.play().then(() => {
                setIsPlaying(true);
                console.log('Audio lecture démarrée avec succès'); // Debug
            }).catch(error => {
                console.error('Erreur lecture audio:', error);
                toast.error('Erreur', `Impossible de lire le son: ${sound.title}. Vérifiez que le fichier existe.`);
                setCurrentlyPlaying(null);
                setShowAudioPlayer(false);
                setIsPlaying(false);
            });
        }
    };

    // Colonnes pour la table des sons avec lecteur audio amélioré
    const soundsColumns = [
        {
            name: 'Son',
            selector: row => row.title,
            sortable: true,
            cell: row => (
                <div className="d-flex align-items-center">
                    {/* Icône de musique uniquement */}
                    <div className="me-3 p-3 rounded-3 text-center" style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        color: 'white',
                        minWidth: '60px',
                        minHeight: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <FontAwesomeIcon icon={faMusic} size="lg" />
                    </div>

                    <div className="flex-grow-1">
                        <div className="fw-medium text-dark">{row.title}</div>
                        <small className="text-muted d-block">
                            <FontAwesomeIcon icon={faUser} className="me-1" />
                            {row.artist_name || row.artist || (row.user ? row.user.name : 'Artiste inconnu')}
                        </small>
                        <div className="small text-info">
                            <FontAwesomeIcon icon={faClock} className="me-1" />
                            {row.formatted_duration || formatTime(row.duration) || '0:00'}
                        </div>
                        {row.genre && (
                            <div className="small text-secondary">
                                <FontAwesomeIcon icon={faTags} className="me-1" />
                                {row.genre}
                            </div>
                        )}
                        {row.bpm && (
                            <div className="small text-primary">
                                <FontAwesomeIcon icon={faMusic} className="me-1" />
                                {row.bpm} BPM
                            </div>
                        )}
                    </div>
                </div>
            ),
            width: '350px'
        },
        {
            name: 'Statut',
            selector: row => row.status,
            sortable: true,
            cell: row => getStatusBadge(row.status),
            width: '120px'
        },
        {
            name: 'Prix',
            selector: row => row.price,
            sortable: true,
            cell: row => (
                <div className="text-center">
                    {row.is_free ? (
                        <Badge bg="success" className="px-2 py-1">
                            <FontAwesomeIcon icon={faHeart} className="me-1" />
                            Gratuit
                        </Badge>
                    ) : (
                        <span className="fw-bold text-primary">
                            <FontAwesomeIcon icon={faEuroSign} className="me-1" />
                            {row.formatted_price || formatCurrency(row.price || 0)}
                        </span>
                    )}
                </div>
            ),
            width: '120px'
        },
        {
            name: 'Statistiques',
            selector: row => row.plays_count || 0,
            sortable: true,
            cell: row => (
                <div className="text-center">
                    <div className="fw-bold small">
                        <FontAwesomeIcon icon={faPlay} className="me-1 text-success" />
                        {(row.plays_count || 0).toLocaleString()}
                    </div>
                    <div className="small text-muted">
                        <FontAwesomeIcon icon={faDownload} className="me-1 text-info" />
                        {(row.downloads_count || 0).toLocaleString()}
                    </div>
                    <div className="small text-danger">
                        <FontAwesomeIcon icon={faHeart} className="me-1" />
                        {(row.likes_count || 0).toLocaleString()}
                    </div>
                </div>
            ),
            width: '120px'
        },
        {
            name: 'Date',
            selector: row => row.created_at,
            sortable: true,
            cell: row => (
                <div className="text-center">
                    <div className="small fw-medium">
                        {new Date(row.created_at).toLocaleDateString('fr-FR')}
                    </div>
                    <small className="text-muted">
                        {new Date(row.created_at).toLocaleDateString('fr-FR', { weekday: 'short' })}
                    </small>
                </div>
            ),
            width: '120px'
        },
        {
            name: 'Actions',
            cell: row => (
                <div className="d-flex gap-1">
                    {/* Bouton Play/Stop - maintenant dans les actions */}
                    <Button
                        variant={currentlyPlaying && currentlyPlaying.id === row.id ? "danger" : "success"}
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            togglePlaySound(row);
                        }}
                        title={currentlyPlaying && currentlyPlaying.id === row.id ? "Arrêter" : "Écouter"}
                        className="d-flex align-items-center justify-content-center"
                        style={{ width: '36px', height: '36px' }}
                    >
                        <FontAwesomeIcon
                            icon={currentlyPlaying && currentlyPlaying.id === row.id ? faStop : faPlay}
                        />
                    </Button>

                    <Button
                        as={Link}
                        to={`/sound-details/${row.id}`}
                        variant="outline-primary"
                        size="sm"
                        title="Voir"
                    >
                        <FontAwesomeIcon icon={faEye} />
                    </Button>
                    <Button
                        as={Link}
                        to={`/edit-sound/${row.id}`}
                        variant="outline-secondary"
                        size="sm"
                        title="Éditer"
                    >
                        <FontAwesomeIcon icon={faEdit} />
                    </Button>
                    {row.status === 'pending' && user?.role === 'admin' && (
                        <>
                            <Button
                                variant="outline-success"
                                size="sm"
                                title="Approuver"
                                onClick={() => {
                                    setSelectedSound(row);
                                    setShowSoundApproveModal(true);
                                }}
                                disabled={actionLoading}
                            >
                                <FontAwesomeIcon icon={faCheck} />
                            </Button>
                            <Button
                                variant="outline-warning"
                                size="sm"
                                title="Rejeter"
                                onClick={() => {
                                    setSelectedSound(row);
                                    setShowSoundRejectModal(true);
                                }}
                                disabled={actionLoading}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </Button>
                        </>
                    )}
                    <Button
                        variant="outline-danger"
                        size="sm"
                        title="Supprimer"
                        onClick={() => handleDeleteSound(row.id)}
                    >
                        <FontAwesomeIcon icon={faTrash} />
                    </Button>
                </div>
            ),
            ignoreRowClick: true,
            allowOverflow: true,
            button: true,
            width: '250px'
        }
    ];

    // Colonnes pour la table des événements avec icônes appropriées
    const eventsColumns = [
        {
            name: 'Événement',
            selector: row => row.title,
            sortable: true,
            cell: row => (
                <div className="d-flex align-items-center">
                    <div className="me-3 p-3 rounded-3 text-center" style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        minWidth: '60px',
                        minHeight: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <FontAwesomeIcon icon={faCalendarAlt} size="lg" />
                    </div>
                    <div>
                        <div className="fw-medium text-dark">{row.title}</div>
                        <small className="text-muted">
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="me-1" />
                            {row.venue || row.location || 'Lieu non défini'}
                        </small>
                        <div className="small text-info">
                            <FontAwesomeIcon icon={faClock} className="me-1" />
                            {new Date(row.event_date || row.date).toLocaleDateString('fr-FR')}
                        </div>
                    </div>
                </div>
            ),
            width: '320px'
        },
        {
            name: 'Date',
            selector: row => row.event_date || row.date,
            sortable: true,
            cell: row => (
                <div className="text-center">
                    <div className="fw-bold">
                        {new Date(row.event_date || row.date).toLocaleDateString('fr-FR')}
                    </div>
                    <small className="text-muted">
                        {new Date(row.event_date || row.date).toLocaleDateString('fr-FR', { weekday: 'long' })}
                    </small>
                </div>
            ),
            width: '140px'
        },
        {
            name: 'Statut',
            selector: row => row.status,
            sortable: true,
            cell: row => getStatusBadge(row.status),
            width: '120px'
        },
        {
            name: 'Participants',
            selector: row => row.current_attendees || 0,
            sortable: true,
            cell: row => (
                <div className="text-center">
                    <div className="fw-bold">
                        <FontAwesomeIcon icon={faUsers} className="me-1 text-primary" />
                        {row.current_attendees || 0}/{row.capacity || row.max_attendees || 0}
                    </div>
                    <small className="text-muted">participants</small>
                </div>
            ),
            width: '140px'
        },
        {
            name: 'Actions',
            cell: row => (
                <div className="d-flex gap-1">
                    <Button
                        as={Link}
                        to={`/event-details/${row.id}`}
                        variant="outline-primary"
                        size="sm"
                        title="Voir"
                    >
                        <FontAwesomeIcon icon={faEye} />
                    </Button>
                    <Button
                        as={Link}
                        to={`/edit-event/${row.id}`}
                        variant="outline-secondary"
                        size="sm"
                        title="Éditer"
                    >
                        <FontAwesomeIcon icon={faEdit} />
                    </Button>
                    {row.status === 'pending' && user?.role === 'admin' && (
                        <Button
                            variant="outline-success"
                            size="sm"
                            title="Approuver"
                            onClick={() => handleApproveEvent(row.id)}
                            disabled={actionLoading}
                        >
                            <FontAwesomeIcon icon={faCheck} />
                        </Button>
                    )}
                    <Button
                        variant="outline-danger"
                        size="sm"
                        title="Supprimer"
                        onClick={() => handleDeleteEvent(row.id)}
                    >
                        <FontAwesomeIcon icon={faTrash} />
                    </Button>
                </div>
            ),
            ignoreRowClick: true,
            allowOverflow: true,
            button: true,
            width: '180px'
        }
    ];

    // Colonnes pour la table des utilisateurs avec route corrigée
    const usersColumns = [
        {
            name: 'Utilisateur',
            selector: row => row.name,
            sortable: true,
            cell: row => (
                <div className="d-flex align-items-center">
                    <div className="me-3 p-3 rounded-circle text-center" style={{
                        background: `linear-gradient(135deg, ${
                            row.role === 'artist' ? '#3b82f6, #1d4ed8' :
                            row.role === 'producer' ? '#10b981, #059669' :
                            row.role === 'admin' ? '#dc2626, #b91c1c' :
                            '#6b7280, #4b5563'
                        })`,
                        color: 'white',
                        minWidth: '50px',
                        minHeight: '50px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: 'bold'
                    }}>
                        {row.role === 'artist' ? (
                            <FontAwesomeIcon icon={faStar} />
                        ) : row.role === 'producer' ? (
                            <FontAwesomeIcon icon={faCog} />
                        ) : row.role === 'admin' ? (
                            <FontAwesomeIcon icon={faCrown} />
                        ) : (
                            <FontAwesomeIcon icon={faUser} />
                        )}
                    </div>
                    <div>
                        <div className="fw-medium">{row.name}</div>
                        <small className="text-muted">{row.email}</small>
                        <div className="small text-info">
                            <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                            Membre depuis {new Date(row.join_date || row.created_at).toLocaleDateString('fr-FR')}
                        </div>
                    </div>
                </div>
            ),
            width: '300px'
        },
        {
            name: 'Rôle',
            selector: row => row.role,
            sortable: true,
            cell: row => (
                <Badge bg={row.role === 'artist' ? 'primary' : row.role === 'producer' ? 'success' : row.role === 'admin' ? 'danger' : 'secondary'}>
                    <FontAwesomeIcon
                        icon={row.role === 'artist' ? faStar : row.role === 'producer' ? faCog : row.role === 'admin' ? faCrown : faUser}
                        className="me-1"
                    />
                    {row.role === 'artist' ? 'Artiste' : row.role === 'producer' ? 'Producteur' : row.role === 'admin' ? 'Admin' : 'Utilisateur'}
                </Badge>
            ),
            width: '140px'
        },
        {
            name: 'Activité',
            selector: row => row.sounds_count || 0,
            sortable: true,
            cell: row => (
                <div className="text-center">
                    <div className="fw-bold">
                        <FontAwesomeIcon icon={faMusic} className="me-1 text-primary" />
                        {row.sounds_count || 0}
                    </div>
                    <small className="text-muted">sons</small>
                    {row.total_plays && (
                        <div className="small text-info">
                            <FontAwesomeIcon icon={faPlay} className="me-1" />
                            {row.total_plays.toLocaleString()} écoutes
                        </div>
                    )}
                </div>
            ),
            width: '120px'
        },
        {
            name: 'Revenus',
            selector: row => row.revenue || 0,
            sortable: true,
            cell: row => (
                <div className="text-center">
                    <span className="fw-bold text-success">
                        <FontAwesomeIcon icon={faEuroSign} className="me-1" />
                        {formatCurrency(row.revenue || 0)}
                    </span>
                </div>
            ),
            width: '120px'
        },
        {
            name: 'Statut',
            selector: row => row.status,
            sortable: true,
            cell: row => (
                <Badge bg={row.status === 'active' ? 'success' : row.status === 'suspended' ? 'danger' : 'secondary'}>
                    <FontAwesomeIcon
                        icon={row.status === 'active' ? faCheckCircle : row.status === 'suspended' ? faTimesCircle : faClock}
                        className="me-1"
                    />
                    {row.status === 'active' ? 'Actif' : row.status === 'suspended' ? 'Suspendu' : 'Inactif'}
                </Badge>
            ),
            width: '120px'
        },
        {
            name: 'Actions',
            cell: row => (
                <div className="d-flex gap-1">
                    <Button
                        as={Link}
                        to={`/artist/${row.id}`}
                        variant="outline-primary"
                        size="sm"
                        title="Voir le profil"
                    >
                        <FontAwesomeIcon icon={faEye} />
                    </Button>
                    <Button
                        as={Link}
                        to={`/profile-edit/${row.id}`}
                        variant="outline-secondary"
                        size="sm"
                        title="Éditer"
                    >
                        <FontAwesomeIcon icon={faEdit} />
                    </Button>
                    {user?.role === 'admin' && row.id !== user.id && (
                        <Button
                            variant="outline-danger"
                            size="sm"
                            title="Supprimer"
                            onClick={() => handleDeleteUser(row.id)}
                        >
                            <FontAwesomeIcon icon={faTrash} />
                        </Button>
                    )}
                </div>
            ),
            ignoreRowClick: true,
            allowOverflow: true,
            button: true,
            width: '150px'
        }
    ];

    // Colonnes pour la table des revenus utilisateurs
    const revenueColumns = [
        {
            name: 'Vendeur',
            selector: row => row.name,
            sortable: true,
            cell: row => (
                <div className="d-flex align-items-center">
                    <div className="me-3 p-3 rounded-circle text-center position-relative" style={{
                        background: `linear-gradient(135deg, ${
                            row.seller_category === 'platinum' ? '#e5e7eb, #9ca3af' :
                            row.seller_category === 'gold' ? '#fbbf24, #f59e0b' :
                            row.seller_category === 'silver' ? '#6b7280, #4b5563' :
                            row.seller_category === 'bronze' ? '#92400e, #78350f' :
                            row.seller_category === 'rookie' ? '#059669, #047857' :
                            '#6b7280, #4b5563'
                        })`,
                        color: 'white',
                        minWidth: '60px',
                        minHeight: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <FontAwesomeIcon icon={
                            row.seller_category === 'platinum' ? faCrown :
                            row.seller_category === 'gold' ? faStar :
                            row.seller_category === 'silver' ? faStar :
                            row.seller_category === 'bronze' ? faStar :
                            faUser
                        } className="text-white" />

                        {/* Badge catégorie */}
                        {row.seller_category !== 'none' && (
                            <div className="position-absolute" style={{
                                bottom: '-5px',
                                right: '-5px',
                                background: row.seller_category === 'platinum' ? '#8b5cf6' :
                                           row.seller_category === 'gold' ? '#f59e0b' :
                                           row.seller_category === 'silver' ? '#6b7280' :
                                           row.seller_category === 'bronze' ? '#92400e' : '#059669',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '8px',
                                fontWeight: 'bold',
                                color: 'white',
                                border: '2px solid white'
                            }}>
                                {row.seller_category === 'platinum' ? 'P' :
                                 row.seller_category === 'gold' ? 'G' :
                                 row.seller_category === 'silver' ? 'S' :
                                 row.seller_category === 'bronze' ? 'B' : 'R'}
                            </div>
                        )}
                    </div>

                    <div className="flex-grow-1">
                        <div className="fw-bold text-dark mb-1">{row.name}</div>
                        <small className="text-muted d-block">{row.email}</small>
                        <div className="small d-flex align-items-center gap-2 mt-1">
                            <Badge bg={row.role === 'artist' ? 'primary' : row.role === 'producer' ? 'success' : 'secondary'}>
                                <FontAwesomeIcon
                                    icon={row.role === 'artist' ? faStar : row.role === 'producer' ? faCog : faUser}
                                    className="me-1"
                                />
                                {row.role === 'artist' ? 'Artiste' : row.role === 'producer' ? 'Producteur' : 'Utilisateur'}
                            </Badge>
                            {row.seller_category !== 'none' && (
                                <Badge bg={
                                    row.seller_category === 'platinum' ? 'secondary' :
                                    row.seller_category === 'gold' ? 'warning' :
                                    row.seller_category === 'silver' ? 'light' :
                                    row.seller_category === 'bronze' ? 'dark' : 'success'
                                } className="text-uppercase">
                                    {row.seller_category}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            ),
            width: '280px'
        },
        {
            name: 'Revenus Totaux',
            selector: row => row.total_earnings,
            sortable: true,
            cell: row => (
                <div className="text-center">
                    <div className="fw-bold h6 mb-1 text-success">
                        <FontAwesomeIcon icon={faEuroSign} className="me-1" />
                        {row.formatted_total_earnings}
                    </div>
                    <small className="text-muted">
                        Ventes: {row.formatted_total_sales}
                    </small>
                    <div className="small text-info">
                        Commission: {row.formatted_total_commission_paid}
                    </div>
                </div>
            ),
            width: '150px'
        },
        {
            name: 'Répartition',
            selector: row => row.sound_earnings + row.event_earnings,
            sortable: true,
            cell: row => (
                <div className="text-center">
                    <div className="mb-2">
                        <div className="small text-primary">
                            <FontAwesomeIcon icon={faMusic} className="me-1" />
                            Sons: {row.formatted_sound_earnings}
                        </div>
                        <div className="small text-success">
                            <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                            Events: {row.formatted_event_earnings}
                        </div>
                    </div>
                    {row.total_earnings > 0 && (
                        <div className="progress" style={{ height: '4px' }}>
                            <div
                                className="progress-bar bg-primary"
                                style={{
                                    width: `${(row.sound_earnings / row.total_earnings) * 100}%`
                                }}
                                title={`Sons: ${Math.round((row.sound_earnings / row.total_earnings) * 100)}%`}
                            />
                            <div
                                className="progress-bar bg-success"
                                style={{
                                    width: `${(row.event_earnings / row.total_earnings) * 100}%`
                                }}
                                title={`Événements: ${Math.round((row.event_earnings / row.total_earnings) * 100)}%`}
                            />
                        </div>
                    )}
                </div>
            ),
            width: '160px'
        },
        {
            name: 'Ventes',
            selector: row => row.total_sales_count,
            sortable: true,
            cell: row => (
                <div className="text-center">
                    <div className="fw-bold text-primary mb-1">
                        <FontAwesomeIcon icon={faShoppingCart} className="me-1" />
                        {row.total_sales_count}
                    </div>
                    <div className="small text-muted mb-1">
                        <FontAwesomeIcon icon={faMusic} className="me-1 text-primary" />
                        {row.sound_sales_count} sons
                    </div>
                    <div className="small text-muted">
                        <FontAwesomeIcon icon={faCalendarAlt} className="me-1 text-success" />
                        {row.event_sales_count} events
                    </div>
                    {row.pending_sales_count > 0 && (
                        <div className="small text-warning mt-1">
                            <FontAwesomeIcon icon={faClock} className="me-1" />
                            {row.pending_sales_count} en attente
                        </div>
                    )}
                </div>
            ),
            width: '120px'
        },
        {
            name: 'Performance',
            selector: row => row.average_sale_amount,
            sortable: true,
            cell: row => (
                <div className="text-center">
                    <div className="small text-muted mb-1">Vente moyenne</div>
                    <div className="fw-medium text-info mb-2">
                        {row.formatted_average_sale_amount}
                    </div>
                    {row.commission_rate > 0 && (
                        <div className="small text-secondary">
                            <FontAwesomeIcon icon={faPercentage} className="me-1" />
                            {row.commission_rate}% commission
                        </div>
                    )}
                    {row.pending_earnings > 0 && (
                        <div className="small text-warning">
                            <FontAwesomeIcon icon={faClock} className="me-1" />
                            {row.formatted_pending_earnings} en attente
                        </div>
                    )}
                </div>
            ),
            width: '140px'
        },
        {
            name: 'Activité',
            selector: row => row.days_since_last_sale,
            sortable: true,
            cell: row => (
                <div className="text-center">
                    <div className="small text-muted mb-1">Dernière vente</div>
                    <div className="fw-medium mb-1">
                        {row.formatted_last_sale_date}
                    </div>
                    {row.days_since_last_sale !== null && (
                        <div className={`small ${
                            row.days_since_last_sale <= 7 ? 'text-success' :
                            row.days_since_last_sale <= 30 ? 'text-warning' : 'text-danger'
                        }`}>
                            {row.days_since_last_sale === 0 ? 'Aujourd\'hui' :
                             row.days_since_last_sale === 1 ? 'Hier' :
                             `Il y a ${row.days_since_last_sale} jours`}
                        </div>
                    )}
                    <div className="small text-muted">
                        Membre depuis {row.formatted_join_date}
                    </div>
                </div>
            ),
            width: '140px'
        },
        {
            name: 'Actions',
            cell: row => (
                <div className="d-flex gap-1">
                    <Button
                        as={Link}
                        to={`/artist/${row.id}`}
                        variant="outline-primary"
                        size="sm"
                        title="Voir le profil"
                    >
                        <FontAwesomeIcon icon={faEye} />
                    </Button>
                    <Button
                        variant="outline-success"
                        size="sm"
                        title="Détails des revenus et paiements"
                        onClick={() => openPaymentsModal(row)}
                    >
                        <FontAwesomeIcon icon={faChartLine} />
                    </Button>
                    {row.pending_earnings > 0 && (
                        <Button
                            variant="outline-warning"
                            size="sm"
                            title="Paiements en attente"
                            onClick={() => {
                                setPaymentsFilter('pending');
                                openPaymentsModal(row);
                            }}
                        >
                            <FontAwesomeIcon icon={faClock} />
                        </Button>
                    )}
                    {(row.total_sales_count > 0 && user?.role === 'admin') && (
                        <Button
                            variant="outline-info"
                            size="sm"
                            title="Gérer les paiements"
                            onClick={() => openPaymentsModal(row)}
                        >
                            <FontAwesomeIcon icon={faCreditCard} />
                        </Button>
                    )}
                </div>
            ),
            ignoreRowClick: true,
            allowOverflow: true,
            button: true,
            width: '180px'
        }
    ];

    // Composant DataTable personnalisé
    const CustomDataTable = styled(DataTable)`
        .rdt_TableHeadRow {
            background-color: #f8f9fa !important;
        }
        .rdt_TableHead {
            color: #495057 !important;
            font-weight: 600 !important;
        }
        .rdt_TableRow {
            transition: all 0.2s ease;
        }
        .rdt_TableRow:hover {
            background-color: rgba(59, 130, 246, 0.04) !important;
        }
    `;

    // Fonctions d'export
    const exportSounds = () => {
        const csvContent = [
            ['ID', 'Titre', 'Artiste', 'Date de téléchargement', 'Écoutes', 'Téléchargements', 'Revenu', 'Statut', 'Catégorie', 'Durée', 'Cover'],
            ...sounds.map(sound => [
                sound.id,
                sound.title,
                sound.artist_name || sound.artist || (sound.user ? sound.user.name : 'Artiste inconnu'),
                new Date(sound.created_at).toLocaleDateString('fr-FR'),
                sound.plays_count || 0,
                sound.downloads_count || 0,
                formatCurrency(sound.revenue || 0),
                getStatusBadge(sound.status),
                sound.category || 'Inconnue',
                sound.formatted_duration || formatTime(sound.duration) || '0:00',
                sound.cover || 'Inconnue'
            ])
        ];

        const csvString = csvContent.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'sons.csv';
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const exportEvents = () => {
        const csvContent = [
            ['ID', 'Titre', 'Lieu', 'Date', 'Tickets vendus', 'Total de tickets', 'Revenu', 'Statut', 'Catégorie', 'Organisateur'],
            ...events.map(event => [
                event.id,
                event.title,
                event.venue || event.location || 'Lieu non défini',
                new Date(event.event_date || event.date).toLocaleDateString('fr-FR'),
                event.ticketsSold || 0,
                event.totalTickets || 0,
                formatCurrency(event.revenue || 0),
                getStatusBadge(event.status),
                event.category || 'Inconnue',
                event.organizer || 'Inconnu'
            ])
        ];

        const csvString = csvContent.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'événements.csv';
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const exportUsers = () => {
        const csvContent = [
            ['ID', 'Nom', 'Email', 'Rôle', 'Date de création', 'Date de dernière connexion'],
            ...users.map(user => [
                user.id,
                user.name,
                user.email,
                user.role,
                new Date(user.created_at).toLocaleDateString('fr-FR'),
                new Date(user.last_login).toLocaleDateString('fr-FR')
            ])
        ];

        const csvString = csvContent.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'utilisateurs.csv';
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const exportRevenue = () => {
        const csvContent = [
            ['ID', 'Nom', 'Email', 'Rôle', 'Revenu', 'Statut'],
            ...usersRevenue.map(revenue => [
                revenue.id,
                revenue.name,
                revenue.email,
                revenue.role,
                formatCurrency(revenue.total_earnings || 0),
                getStatusBadge(revenue.status)
            ])
        ];

        const csvString = csvContent.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'revenus.csv';
        link.click();
        URL.revokeObjectURL(link.href);
    };

    // Fonction pour approuver un son
    const handleApproveSound = async (soundId) => {
        try {
            setActionLoading(true);
            const response = await fetch(`/api/sounds/${soundId}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success || response.ok) {
                toast.success('Succès', 'Son approuvé avec succès');
                loadSounds(); // Recharger la liste
            } else {
                toast.error('Erreur', data.message || 'Impossible d\'approuver le son');
            }
        } catch (error) {
            console.error('Erreur lors de l\'approbation:', error);
            toast.error('Erreur', 'Erreur de connexion au serveur');
        } finally {
            setActionLoading(false);
        }
    };

    // Fonction pour rejeter un son
    const handleRejectSound = async () => {
        if (!selectedSound || !rejectReason.trim()) {
            toast.error('Erreur', 'Veuillez saisir une raison pour le rejet');
            return;
        }

        try {
            setActionLoading(true);
            const response = await fetch(`/api/sounds/${selectedSound.id}/reject`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reason: rejectReason.trim()
                })
            });

            const data = await response.json();

            if (data.success || response.ok) {
                toast.success('Succès', 'Son rejeté avec succès');
                loadSounds(); // Recharger la liste
                setShowSoundRejectModal(false);
                setSelectedSound(null);
                setRejectReason('');
            } else {
                toast.error('Erreur', data.message || 'Impossible de rejeter le son');
            }
        } catch (error) {
            console.error('Erreur lors du rejet:', error);
            toast.error('Erreur', 'Erreur de connexion au serveur');
        } finally {
            setActionLoading(false);
        }
    };

    // Fonction de filtrage pour les revenus
    const getFilteredRevenue = () => {
        return usersRevenue.filter(user => {
            // Filtrer seulement les utilisateurs qui ont des revenus ou sont des vendeurs actifs
            return user.total_earnings > 0 || user.total_sales_count > 0;
        });
    };

    // Charger les paiements d'un utilisateur spécifique
    const loadUserPayments = async (userId, filters = {}) => {
        setLoadingPayments(true);
        try {
            const params = new URLSearchParams({
                per_page: 20,
                ...filters
            });

            console.log('Chargement des paiements pour l\'utilisateur:', userId, 'avec filtres:', filters);

            const response = await fetch(`/api/dashboard/users/${userId}/payments?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Réponse API getUserPayments:', data);

                if (data.success && data.payments) {
                    // Vérifier si les données sont paginées ou directement un array
                    const paymentsData = data.payments.data || data.payments;
                    setUserPayments(Array.isArray(paymentsData) ? paymentsData : []);
                    setSelectedUser(data.user);
                    console.log('Paiements chargés:', paymentsData.length);
                } else {
                    console.warn('Réponse API sans succès:', data);
                    toast.error('Erreur', data.message || 'Impossible de charger les paiements');
                    setUserPayments([]);
                }
            } else {
                console.error('Erreur HTTP:', response.status, response.statusText);
                toast.error('Erreur', `Erreur de connexion au serveur (${response.status})`);
                setUserPayments([]);
            }
        } catch (error) {
            console.error('Erreur chargement paiements:', error);
            toast.error('Erreur', 'Erreur de connexion au serveur');
            setUserPayments([]);
        } finally {
            setLoadingPayments(false);
        }
    };

    // Ouvrir le modal des paiements d'un utilisateur
    const openPaymentsModal = (user) => {
        console.log('Ouverture modal paiements pour:', user);
        setSelectedUser(user);
        setShowPaymentsModal(true);
        setUserPayments([]); // Réinitialiser d'abord
        setPaymentsFilter('all'); // Réinitialiser le filtre
        setPaymentsSearchTerm(''); // Réinitialiser la recherche

        // Charger les paiements
        loadUserPayments(user.id, {
            status: 'all' // Commencer par tous les statuts
        });
    };

    // Fermer le modal des paiements
    const closePaymentsModal = () => {
        setShowPaymentsModal(false);
        setSelectedUser(null);
        setUserPayments([]);
        setPaymentsFilter('all');
        setPaymentsSearchTerm('');
    };

    // Ouvrir le modal d'action sur un paiement
    const openPaymentActionModal = (payment, action) => {
        setSelectedPayment(payment);
        setPaymentAction(action);
        setPaymentActionReason('');
        setShowPaymentActionModal(true);
    };

    // Fermer le modal d'action sur un paiement
    const closePaymentActionModal = () => {
        setShowPaymentActionModal(false);
        setSelectedPayment(null);
        setPaymentAction('');
        setPaymentActionReason('');
    };

    // Exécuter une action sur un paiement
    const executePaymentAction = async () => {
        if (!selectedPayment || !paymentAction) return;

        // Validation pour les actions qui nécessitent une raison
        if ((paymentAction === 'cancel' || paymentAction === 'refund') && !paymentActionReason.trim()) {
            toast.error('Erreur', 'Veuillez saisir une raison pour cette action');
            return;
        }

        setProcessingPaymentAction(true);
        try {
            const endpoint = `/api/dashboard/payments/${selectedPayment.id}/${paymentAction}`;
            const method = 'POST';
            const body = (paymentAction === 'cancel' || paymentAction === 'refund') ?
                JSON.stringify({ reason: paymentActionReason.trim() }) : null;

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                ...(body && { body })
            });

            const data = await response.json();

            if (data.success) {
                const actionMessages = {
                    approve: 'Paiement approuvé avec succès',
                    cancel: 'Paiement annulé avec succès',
                    refund: 'Paiement remboursé avec succès'
                };

                toast.success('Succès', actionMessages[paymentAction]);

                // Recharger les paiements et les données du dashboard
                if (selectedUser) {
                    loadUserPayments(selectedUser.id, {
                        status: paymentsFilter !== 'all' ? paymentsFilter : undefined,
                        search: paymentsSearchTerm || undefined
                    });
                }
                loadUsersRevenue();
                loadStats();

                closePaymentActionModal();
            } else {
                toast.error('Erreur', data.message || `Impossible d'effectuer l'action`);
            }
        } catch (error) {
            console.error('Erreur action paiement:', error);
            toast.error('Erreur', 'Erreur de connexion au serveur');
        } finally {
            setProcessingPaymentAction(false);
        }
    };

    // Traitement par lot des paiements
    const executeBatchAction = async () => {
        if (!selectedPayments.length || !batchAction) return;

        if ((batchAction === 'cancel' || batchAction === 'refund') && !batchReason.trim()) {
            toast.error('Erreur', 'Veuillez saisir une raison pour cette action');
            return;
        }

        setProcessingBatch(true);
        try {
            const response = await fetch('/api/dashboard/payments/batch-action', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    payment_ids: selectedPayments,
                    action: batchAction,
                    ...(batchReason.trim() && { reason: batchReason.trim() })
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Succès', data.message);

                // Recharger les données
                if (selectedUser) {
                    loadUserPayments(selectedUser.id);
                }
                loadUsersRevenue();
                loadStats();

                // Réinitialiser
                setSelectedPayments([]);
                setShowBatchModal(false);
                setBatchAction('');
                setBatchReason('');
            } else {
                toast.error('Erreur', data.message || 'Erreur lors du traitement par lot');
            }
        } catch (error) {
            console.error('Erreur traitement par lot:', error);
            toast.error('Erreur', 'Erreur de connexion au serveur');
        } finally {
            setProcessingBatch(false);
        }
    };

    // Filtrer les paiements affichés
    const getFilteredUserPayments = () => {
        if (!Array.isArray(userPayments)) {
            console.warn('userPayments n\'est pas un array:', userPayments);
            return [];
        }

        return userPayments.filter(payment => {
            if (!payment) return false;

            // Filtre par statut
            if (paymentsFilter !== 'all' && payment.status !== paymentsFilter) {
                return false;
            }

            // Filtre par recherche
            if (paymentsSearchTerm) {
                const searchLower = paymentsSearchTerm.toLowerCase();
                const searchableFields = [
                    payment.transaction_id || '',
                    payment.product_name || '',
                    payment.buyer_name || '',
                    payment.buyer_email || '',
                    payment.payment_method || ''
                ];

                return searchableFields.some(field =>
                    field.toLowerCase().includes(searchLower)
                );
            }

            return true;
        });
    };

    const renderOverview = () => (
        <div>
            {/* Cartes de statistiques principales */}
            <Row className="g-4 mb-4">
                <Col xl={3} lg={6} md={6}>
                    <Card className="stat-card border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="text-muted mb-1 small fw-medium">Revenus Totaux</p>
                                    <h2 className="fw-bold mb-0 text-primary">{formatCurrency(stats.totalRevenue || 0)}</h2>
                                    <div className="d-flex align-items-center mt-2">
                                        <span className="text-success small">
                                            <FontAwesomeIcon icon={faArrowUp} className="me-1" />
                                            {stats.completedPayments || 0} paiements
                                        </span>
                                        <span className="text-muted small ms-2">validés</span>
                                    </div>
                                </div>
                                <div className="stat-icon bg-primary bg-opacity-10">
                                    <FontAwesomeIcon icon={faEuroSign} className="text-primary" />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col xl={3} lg={6} md={6}>
                    <Card className="stat-card border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="text-muted mb-1 small fw-medium">Commissions</p>
                                    <h2 className="fw-bold mb-0 text-success">{formatCurrency(stats.totalCommission || 0)}</h2>
                                    <div className="d-flex align-items-center mt-2">
                                        <span className="text-info small">
                                            <FontAwesomeIcon icon={faPercentage} className="me-1" />
                                            {stats.totalRevenue > 0 ?
                                                Math.round((stats.totalCommission / stats.totalRevenue) * 100) : 0}%
                                        </span>
                                        <span className="text-muted small ms-2">du total</span>
                                    </div>
                                </div>
                                <div className="stat-icon bg-success bg-opacity-10">
                                    <FontAwesomeIcon icon={faPercentage} className="text-success" />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col xl={3} lg={6} md={6}>
                    <Card className="stat-card border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="text-muted mb-1 small fw-medium">Utilisateurs</p>
                                    <h2 className="fw-bold mb-0 text-info">{(stats.totalUsers || 0).toLocaleString()}</h2>
                                    <div className="d-flex align-items-center mt-2">
                                        <span className="text-success small">
                                            <FontAwesomeIcon icon={faUsers} className="me-1" />
                                            {stats.activeUsers || 0}
                                        </span>
                                        <span className="text-muted small ms-2">actifs</span>
                                    </div>
                                </div>
                                <div className="stat-icon bg-info bg-opacity-10">
                                    <FontAwesomeIcon icon={faUsers} className="text-info" />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col xl={3} lg={6} md={6}>
                    <Card className="stat-card border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="text-muted mb-1 small fw-medium">Contenu</p>
                                    <h2 className="fw-bold mb-0 text-warning">{((stats.totalSounds || 0) + (stats.totalEvents || 0)).toLocaleString()}</h2>
                                    <div className="d-flex align-items-center mt-2">
                                        <span className="text-primary small">
                                            <FontAwesomeIcon icon={faMusic} className="me-1" />
                                            {stats.totalSounds || 0} sons
                                        </span>
                                        <span className="text-success small ms-2">
                                            <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                                            {stats.totalEvents || 0} events
                                        </span>
                                    </div>
                                </div>
                                <div className="stat-icon bg-warning bg-opacity-10">
                                    <FontAwesomeIcon icon={faChartLine} className="text-warning" />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Statistiques détaillées */}
            <Row className="g-4">
                <Col lg={8}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-bottom">
                            <h6 className="fw-bold mb-0">Aperçu des Performances</h6>
                        </Card.Header>
                        <Card.Body>
                            <Row className="g-3">
                                <Col sm={6}>
                                    <div className="text-center p-3 bg-light rounded">
                                        <FontAwesomeIcon icon={faMusic} className="text-primary mb-2" size="lg" />
                                        <div className="fw-bold h5 mb-1">{stats.totalSounds || 0}</div>
                                        <small className="text-muted">Sons totaux</small>
                                    </div>
                                </Col>
                                <Col sm={6}>
                                    <div className="text-center p-3 bg-light rounded">
                                        <FontAwesomeIcon icon={faCalendarAlt} className="text-success mb-2" size="lg" />
                                        <div className="fw-bold h5 mb-1">{stats.totalEvents || 0}</div>
                                        <small className="text-muted">Événements</small>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-bottom">
                            <h6 className="fw-bold mb-0">Activité Récente</h6>
                        </Card.Header>
                        <Card.Body>
                            <div className="text-center py-3">
                                <FontAwesomeIcon icon={faChartLine} size="2x" className="text-muted mb-2" />
                                <p className="text-muted small mb-0">Plateforme active</p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );

    const renderSoundsManagement = () => (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="fw-bold mb-1">Gestion des Sons</h5>
                    <p className="text-muted mb-0 small">Gérez tous les sons de la plateforme</p>
                </div>
                <Button as={Link} to="/add-sound" variant="primary">
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Ajouter un son
                </Button>
            </div>

            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white">
                    <h6 className="fw-bold mb-0">Tous les sons</h6>
                </Card.Header>
                <Card.Body>
                    {(sounds?.length || 0) === 0 ? (
                        <div className="text-center py-5">
                            <FontAwesomeIcon icon={faMusic} size="3x" className="text-muted mb-3" />
                            <h6 className="text-muted">Aucun son trouvé</h6>
                        </div>
                    ) : (
                        <CustomDataTable
                            columns={soundsColumns}
                            data={getFilteredSounds()}
                            {...dataTableConfig}
                        />
                    )}
                </Card.Body>
            </Card>
        </div>
    );

    const renderEventsManagement = () => (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="fw-bold mb-1">Gestion des Événements</h5>
                    <p className="text-muted mb-0 small">Gérez tous les événements de la plateforme</p>
                </div>
                <Button as={Link} to="/add-event" variant="primary">
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Créer un événement
                </Button>
            </div>

            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white">
                    <h6 className="fw-bold mb-0">Tous les événements</h6>
                </Card.Header>
                <Card.Body>
                    {(events?.length || 0) === 0 ? (
                        <div className="text-center py-5">
                            <FontAwesomeIcon icon={faCalendarAlt} size="3x" className="text-muted mb-3" />
                            <h6 className="text-muted">Aucun événement trouvé</h6>
                        </div>
                    ) : (
                        <CustomDataTable
                            columns={eventsColumns}
                            data={getFilteredEvents()}
                            {...dataTableConfig}
                        />
                    )}
                </Card.Body>
            </Card>
        </div>
    );

    const renderUsersManagement = () => (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="fw-bold mb-1">Gestion des Utilisateurs</h5>
                    <p className="text-muted mb-0 small">Gérez tous les utilisateurs de la plateforme</p>
                </div>
            </div>

            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white">
                    <h6 className="fw-bold mb-0">Tous les utilisateurs</h6>
                </Card.Header>
                <Card.Body>
                    {(users?.length || 0) === 0 ? (
                        <div className="text-center py-5">
                            <FontAwesomeIcon icon={faUsers} size="3x" className="text-muted mb-3" />
                            <h6 className="text-muted">Aucun utilisateur trouvé</h6>
                        </div>
                    ) : (
                        <CustomDataTable
                            columns={usersColumns}
                            data={getFilteredUsers()}
                            {...dataTableConfig}
                        />
                    )}
                </Card.Body>
            </Card>
        </div>
    );

    const renderAnalytics = () => (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="fw-bold mb-1">Analytics & Rapports Détaillés</h5>
                    <p className="text-muted mb-0 small">Analysez les performances financières et exportez les données</p>
                </div>
                <div className="d-flex gap-2">
                    <Button
                        variant="outline-primary"
                        onClick={loadStats}
                        disabled={loading}
                    >
                        <FontAwesomeIcon icon={faSync} className="me-2" />
                        Actualiser
                    </Button>
                    <Button
                        variant="success"
                        onClick={() => {
                            // Export global des statistiques
                            window.open('/api/dashboard/export-stats', '_blank');
                        }}
                    >
                        <FontAwesomeIcon icon={faDownload} className="me-2" />
                        Exporter Tout
                    </Button>
                </div>
            </div>

            {/* Statistiques principales */}
            <Row className="g-4 mb-4">
                <Col xl={3} lg={6} md={6}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="text-center">
                            <div className="stat-icon bg-primary bg-opacity-10 mx-auto mb-3">
                                <FontAwesomeIcon icon={faEuroSign} className="text-primary" />
                            </div>
                            <h3 className="fw-bold text-primary mb-1">{formatCurrency(stats.totalRevenue || 0)}</h3>
                            <p className="text-muted mb-2">Revenus Totaux</p>
                            <small className="text-success">
                                <FontAwesomeIcon icon={faArrowUp} className="me-1" />
                                {stats.completedPayments || 0} paiements validés
                            </small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xl={3} lg={6} md={6}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="text-center">
                            <div className="stat-icon bg-success bg-opacity-10 mx-auto mb-3">
                                <FontAwesomeIcon icon={faPercentage} className="text-success" />
                            </div>
                            <h3 className="fw-bold text-success mb-1">{formatCurrency(stats.totalCommission || 0)}</h3>
                            <p className="text-muted mb-2">Commissions Perçues</p>
                            <small className="text-info">
                                {stats.totalRevenue > 0 ?
                                    Math.round((stats.totalCommission / stats.totalRevenue) * 100) : 0}% du total
                            </small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xl={3} lg={6} md={6}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="text-center">
                            <div className="stat-icon bg-info bg-opacity-10 mx-auto mb-3">
                                <FontAwesomeIcon icon={faShoppingCart} className="text-info" />
                            </div>
                            <h3 className="fw-bold text-info mb-1">{(stats.totalPayments || 0).toLocaleString()}</h3>
                            <p className="text-muted mb-2">Total Transactions</p>
                            <small className="text-primary">
                                Moyenne: {formatCurrency(stats.averagePayment || 0)}
                            </small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xl={3} lg={6} md={6}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="text-center">
                            <div className="stat-icon bg-warning bg-opacity-10 mx-auto mb-3">
                                <FontAwesomeIcon icon={faClock} className="text-warning" />
                            </div>
                            <h3 className="fw-bold text-warning mb-1">{stats.pendingPayments || 0}</h3>
                            <p className="text-muted mb-2">En Attente</p>
                            <small className="text-danger">
                                {stats.failedPayments || 0} échecs
                            </small>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Détail par type de contenu */}
            <Row className="g-4 mb-4">
                <Col lg={6}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center">
                            <h6 className="fw-bold mb-0">
                                <FontAwesomeIcon icon={faMusic} className="text-primary me-2" />
                                Revenus des Sons
                            </h6>
                            <Button variant="outline-primary" size="sm" onClick={exportSounds}>
                                <FontAwesomeIcon icon={faDownload} />
                            </Button>
                        </Card.Header>
                        <Card.Body>
                            <div className="text-center mb-3">
                                <h4 className="fw-bold text-primary">{(stats.soundPayments || 0).toLocaleString()}</h4>
                                <p className="text-muted mb-0">Paiements pour les sons</p>
                            </div>
                            <div className="d-flex justify-content-between">
                                <div className="text-center">
                                    <div className="small text-muted">Total Sons</div>
                                    <div className="fw-bold">{stats.totalSounds || 0}</div>
                                </div>
                                <div className="text-center">
                                    <div className="small text-muted">Publiés</div>
                                    <div className="fw-bold text-success">{stats.publishedSounds || 0}</div>
                                </div>
                                <div className="text-center">
                                    <div className="small text-muted">En attente</div>
                                    <div className="fw-bold text-warning">{stats.pendingSounds || 0}</div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={6}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center">
                            <h6 className="fw-bold mb-0">
                                <FontAwesomeIcon icon={faCalendarAlt} className="text-success me-2" />
                                Revenus des Événements
                            </h6>
                            <Button variant="outline-success" size="sm" onClick={exportEvents}>
                                <FontAwesomeIcon icon={faDownload} />
                            </Button>
                        </Card.Header>
                        <Card.Body>
                            <div className="text-center mb-3">
                                <h4 className="fw-bold text-success">{(stats.eventPayments || 0).toLocaleString()}</h4>
                                <p className="text-muted mb-0">Paiements pour les événements</p>
                            </div>
                            <div className="d-flex justify-content-between">
                                <div className="text-center">
                                    <div className="small text-muted">Total Events</div>
                                    <div className="fw-bold">{stats.totalEvents || 0}</div>
                                </div>
                                <div className="text-center">
                                    <div className="small text-muted">Actifs</div>
                                    <div className="fw-bold text-success">{stats.activeEvents || 0}</div>
                                </div>
                                <div className="text-center">
                                    <div className="small text-muted">Complétés</div>
                                    <div className="fw-bold text-info">{stats.completedEvents || 0}</div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Statuts des paiements */}
            <Row className="g-4 mb-4">
                <Col lg={8}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-bottom">
                            <h6 className="fw-bold mb-0">Répartition des Paiements par Statut</h6>
                        </Card.Header>
                        <Card.Body>
                            <Row className="g-3">
                                <Col md={3} className="text-center">
                                    <div className="p-3 bg-success bg-opacity-10 rounded mb-2">
                                        <FontAwesomeIcon icon={faCheckCircle} className="text-success mb-2" size="lg" />
                                        <div className="fw-bold h5 text-success">{stats.completedPayments || 0}</div>
                                        <small className="text-muted">Complétés</small>
                                    </div>
                                </Col>
                                <Col md={3} className="text-center">
                                    <div className="p-3 bg-warning bg-opacity-10 rounded mb-2">
                                        <FontAwesomeIcon icon={faClock} className="text-warning mb-2" size="lg" />
                                        <div className="fw-bold h5 text-warning">{stats.pendingPayments || 0}</div>
                                        <small className="text-muted">En attente</small>
                                    </div>
                                </Col>
                                <Col md={3} className="text-center">
                                    <div className="p-3 bg-danger bg-opacity-10 rounded mb-2">
                                        <FontAwesomeIcon icon={faTimesCircle} className="text-danger mb-2" size="lg" />
                                        <div className="fw-bold h5 text-danger">{stats.failedPayments || 0}</div>
                                        <small className="text-muted">Échecs</small>
                                    </div>
                                </Col>
                                <Col md={3} className="text-center">
                                    <div className="p-3 bg-secondary bg-opacity-10 rounded mb-2">
                                        <FontAwesomeIcon icon={faUndo} className="text-secondary mb-2" size="lg" />
                                        <div className="fw-bold h5 text-secondary">{stats.refundedPayments || 0}</div>
                                        <small className="text-muted">Remboursés</small>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-bottom">
                            <h6 className="fw-bold mb-0">Actions Rapides</h6>
                        </Card.Header>
                        <Card.Body>
                            <div className="d-grid gap-2">
                                <Button variant="outline-primary" onClick={exportSounds}>
                                    <FontAwesomeIcon icon={faMusic} className="me-2" />
                                    Exporter Sons (CSV)
                                </Button>
                                <Button variant="outline-success" onClick={exportEvents}>
                                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                                    Exporter Événements (CSV)
                                </Button>
                                <Button variant="outline-info" onClick={exportUsers}>
                                    <FontAwesomeIcon icon={faUsers} className="me-2" />
                                    Exporter Utilisateurs (CSV)
                                </Button>
                                <Button variant="outline-warning" onClick={exportRevenue}>
                                    <FontAwesomeIcon icon={faEuroSign} className="me-2" />
                                    Exporter Revenus (CSV)
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Statistiques utilisateurs */}
            <Row className="g-4">
                <Col lg={6}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-bottom">
                            <h6 className="fw-bold mb-0">Statistiques Utilisateurs</h6>
                        </Card.Header>
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <div className="h4 fw-bold text-primary">{stats.totalUsers || 0}</div>
                                    <small className="text-muted">Total utilisateurs</small>
                                </div>
                                <FontAwesomeIcon icon={faUsers} size="2x" className="text-primary opacity-25" />
                            </div>
                            <div className="row g-3">
                                <div className="col-6">
                                    <div className="text-center p-2 bg-light rounded">
                                        <div className="fw-bold text-success">{stats.activeUsers || 0}</div>
                                        <small className="text-muted">Actifs</small>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="text-center p-2 bg-light rounded">
                                        <div className="fw-bold text-info">{stats.artistsCount || 0}</div>
                                        <small className="text-muted">Artistes</small>
                                    </div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={6}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-bottom">
                            <h6 className="fw-bold mb-0">Performance Globale</h6>
                        </Card.Header>
                        <Card.Body>
                            <div className="text-center">
                                <div className="h1 fw-bold text-success mb-2">
                                    {stats.totalRevenue > 0 && stats.totalPayments > 0 ?
                                        Math.round((stats.completedPayments / stats.totalPayments) * 100) : 0}%
                                </div>
                                <p className="text-muted mb-3">Taux de réussite des paiements</p>
                                <div className="progress mb-3" style={{ height: '8px' }}>
                                    <div
                                        className="progress-bar bg-success"
                                        style={{
                                            width: `${stats.totalPayments > 0 ?
                                                (stats.completedPayments / stats.totalPayments) * 100 : 0}%`
                                        }}
                                    />
                                </div>
                                <small className="text-muted">
                                    {stats.completedPayments || 0} succès sur {stats.totalPayments || 0} tentatives
                                </small>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );

    const renderSettings = () => {
        // Vérification de sécurité pour éviter l'erreur d'initialisation
        if (!tempCommissionSettings) {
            return (
                <div className="text-center py-5">
                    <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary mb-3" />
                    <p className="text-muted">Chargement des paramètres...</p>
                </div>
            );
        }

        const handleUpdateCommissions = async () => {
            setSavingCommissions(true);
            try {
                const response = await fetch('/api/dashboard/commission', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        rates: tempCommissionSettings
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    setTempCommissionSettings(data.rates);
                    toast.success('Succès', 'Taux de commission mis à jour avec succès');
                } else {
                    toast.error('Erreur', data.message || 'Impossible de mettre à jour les commissions');
                }
            } catch (error) {
                console.error('Erreur update commissions:', error);
                toast.error('Erreur', 'Erreur de connexion au serveur');
            } finally {
                setSavingCommissions(false);
            }
        };

        return (
            <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h5 className="fw-bold mb-1">Paramètres de la Plateforme</h5>
                        <p className="text-muted mb-0 small">Configurez les taux de commission et autres paramètres</p>
                    </div>
                </div>

                {/* Configuration des Commissions */}
                <Row className="g-4 mb-4">
                    <Col lg={8}>
                        <Card className="border-0 shadow-sm">
                            <Card.Header className="bg-white border-bottom">
                                <h6 className="fw-bold mb-0">
                                    <FontAwesomeIcon icon={faPercentage} className="text-primary me-2" />
                                    Taux de Commission
                                </h6>
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-4">
                                    <Col md={6}>
                                        <div className="p-4 border rounded-3">
                                            <div className="d-flex align-items-center mb-3">
                                                <div className="me-3 p-2 bg-primary bg-opacity-10 rounded">
                                                    <FontAwesomeIcon icon={faMusic} className="text-primary" />
                                                </div>
                                                <div>
                                                    <h6 className="fw-bold mb-0">Commission Sons</h6>
                                                    <small className="text-muted">Pourcentage prélevé sur les ventes de sons</small>
                                                </div>
                                            </div>
                                            <Form.Group>
                                                <Form.Label className="fw-medium">Taux de commission (%)</Form.Label>
                                                <div className="input-group">
                                                    <Form.Control
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.1"
                                                        value={tempCommissionSettings?.sound_commission || 15}
                                                        onChange={(e) => setTempCommissionSettings({
                                                            ...tempCommissionSettings,
                                                            sound_commission: parseFloat(e.target.value) || 0
                                                        })}
                                                    />
                                                    <span className="input-group-text">%</span>
                                                </div>
                                                <Form.Text className="text-muted">
                                                    Actuellement: {tempCommissionSettings?.sound_commission || 15}%
                                                </Form.Text>
                                            </Form.Group>
                                            <div className="mt-3 p-3 bg-light rounded">
                                                <small className="text-muted">
                                                    <strong>Exemple:</strong> Pour une vente de 10 000 XAF<br/>
                                                    Commission: {(((tempCommissionSettings?.sound_commission || 15) / 100) * 10000).toLocaleString()} XAF<br/>
                                                    Artiste reçoit: {(10000 - ((tempCommissionSettings?.sound_commission || 15) / 100) * 10000).toLocaleString()} XAF
                                                </small>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="p-4 border rounded-3">
                                            <div className="d-flex align-items-center mb-3">
                                                <div className="me-3 p-2 bg-success bg-opacity-10 rounded">
                                                    <FontAwesomeIcon icon={faCalendarAlt} className="text-success" />
                                                </div>
                                                <div>
                                                    <h6 className="fw-bold mb-0">Commission Événements</h6>
                                                    <small className="text-muted">Pourcentage prélevé sur les ventes de tickets</small>
                                                </div>
                                            </div>
                                            <Form.Group>
                                                <Form.Label className="fw-medium">Taux de commission (%)</Form.Label>
                                                <div className="input-group">
                                                    <Form.Control
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.1"
                                                        value={tempCommissionSettings?.event_commission || 10}
                                                        onChange={(e) => setTempCommissionSettings({
                                                            ...tempCommissionSettings,
                                                            event_commission: parseFloat(e.target.value) || 0
                                                        })}
                                                    />
                                                    <span className="input-group-text">%</span>
                                                </div>
                                                <Form.Text className="text-muted">
                                                    Actuellement: {tempCommissionSettings?.event_commission || 10}%
                                                </Form.Text>
                                            </Form.Group>
                                            <div className="mt-3 p-3 bg-light rounded">
                                                <small className="text-muted">
                                                    <strong>Exemple:</strong> Pour une vente de 5 000 XAF<br/>
                                                    Commission: {(((tempCommissionSettings?.event_commission || 10) / 100) * 5000).toLocaleString()} XAF<br/>
                                                    Organisateur reçoit: {(5000 - ((tempCommissionSettings?.event_commission || 10) / 100) * 5000).toLocaleString()} XAF
                                                </small>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                                <div className="d-flex justify-content-end gap-2 mt-4">
                                    <Button
                                        variant="outline-secondary"
                                        onClick={() => loadCommissionSettings()}
                                        disabled={savingCommissions}
                                    >
                                        <FontAwesomeIcon icon={faUndo} className="me-2" />
                                        Annuler
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={handleUpdateCommissions}
                                        disabled={savingCommissions}
                                    >
                                        {savingCommissions ? (
                                            <>
                                                <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                                                Sauvegarde...
                                            </>
                                        ) : (
                                            <>
                                                <FontAwesomeIcon icon={faCheck} className="me-2" />
                                                Sauvegarder
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={4}>
                        <Card className="border-0 shadow-sm">
                            <Card.Header className="bg-white border-bottom">
                                <h6 className="fw-bold mb-0">Statistiques des Commissions</h6>
                            </Card.Header>
                            <Card.Body>
                                <div className="text-center mb-4">
                                    <div className="h4 fw-bold text-success">{formatCurrency(stats.totalCommission || 0)}</div>
                                    <small className="text-muted">Total commissions perçues</small>
                                </div>

                                <div className="mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="small text-muted">
                                            <FontAwesomeIcon icon={faMusic} className="me-1 text-primary" />
                                            Sons
                                        </span>
                                        <span className="fw-medium">{tempCommissionSettings?.sound_commission || 15}%</span>
                                    </div>
                                    <div className="progress" style={{ height: '4px' }}>
                                        <div
                                            className="progress-bar bg-primary"
                                            style={{ width: `${((tempCommissionSettings?.sound_commission || 15) / 30) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="small text-muted">
                                            <FontAwesomeIcon icon={faCalendarAlt} className="me-1 text-success" />
                                            Événements
                                        </span>
                                        <span className="fw-medium">{tempCommissionSettings?.event_commission || 10}%</span>
                                    </div>
                                    <div className="progress" style={{ height: '4px' }}>
                                        <div
                                            className="progress-bar bg-success"
                                            style={{ width: `${((tempCommissionSettings?.event_commission || 10) / 30) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 p-3 bg-light rounded">
                                    <small className="text-muted">
                                        <strong>Note:</strong> Les modifications s'appliquent uniquement aux nouvelles transactions.
                                    </small>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Autres paramètres */}
                <Row className="g-4">
                    <Col lg={6}>
                        <Card className="border-0 shadow-sm">
                            <Card.Header className="bg-white border-bottom">
                                <h6 className="fw-bold mb-0">
                                    <FontAwesomeIcon icon={faCog} className="text-secondary me-2" />
                                    Paramètres Généraux
                                </h6>
                            </Card.Header>
                            <Card.Body>
                                <div className="text-center py-4">
                                    <FontAwesomeIcon icon={faCog} size="2x" className="text-muted mb-3" />
                                    <p className="text-muted mb-0">Configuration générale de la plateforme</p>
                                    <small className="text-muted">Fonctionnalité à venir</small>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={6}>
                        <Card className="border-0 shadow-sm">
                            <Card.Header className="bg-white border-bottom">
                                <h6 className="fw-bold mb-0">
                                    <FontAwesomeIcon icon={faBell} className="text-warning me-2" />
                                    Notifications
                                </h6>
                            </Card.Header>
                            <Card.Body>
                                <div className="text-center py-4">
                                    <FontAwesomeIcon icon={faBell} size="2x" className="text-muted mb-3" />
                                    <p className="text-muted mb-0">Paramètres de notification</p>
                                    <small className="text-muted">Fonctionnalité à venir</small>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    };

    const renderRevenueManagement = () => (
        <div>
            {/* Header avec actions */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="fw-bold mb-1">Revenus par Utilisateur</h5>
                    <p className="text-muted mb-0 small">Analysez les revenus générés par chaque vendeur de la plateforme</p>
                </div>
                <div className="d-flex gap-2">
                    <Button
                        variant="outline-primary"
                        onClick={loadUsersRevenue}
                        disabled={loading}
                    >
                        <FontAwesomeIcon icon={faSync} className="me-2" />
                        Actualiser
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => {
                            // Export des revenus
                            const csvContent = [
                                ['Nom', 'Email', 'Rôle', 'Catégorie', 'Revenus Totaux', 'Revenus Sons', 'Revenus Événements', 'Commission Payée', 'Nombre de Ventes', 'Vente Moyenne', 'Dernière Vente'],
                                ...getFilteredRevenue().map(user => [
                                    user.name,
                                    user.email,
                                    user.role,
                                    user.seller_category,
                                    user.total_earnings,
                                    user.sound_earnings,
                                    user.event_earnings,
                                    user.total_commission_paid,
                                    user.total_sales_count,
                                    user.average_sale_amount,
                                    user.formatted_last_sale_date
                                ])
                            ].map(row => row.join(',')).join('\n');

                            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                            const link = document.createElement('a');
                            link.href = URL.createObjectURL(blob);
                            link.download = `revenus_utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
                            link.click();
                        }}
                    >
                        <FontAwesomeIcon icon={faDownload} className="me-2" />
                        Exporter CSV
                    </Button>
                </div>
            </div>

            {/* Statistiques rapides des revenus */}
            <Row className="g-3 mb-4">
                <Col lg={3} md={6}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="text-center">
                            <FontAwesomeIcon icon={faUsers} className="text-primary mb-2" size="lg" />
                            <h4 className="fw-bold text-primary">{revenueStats.active_sellers || 0}</h4>
                            <small className="text-muted">Vendeurs actifs</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={3} md={6}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="text-center">
                            <FontAwesomeIcon icon={faEuroSign} className="text-success mb-2" size="lg" />
                            <h4 className="fw-bold text-success">{revenueStats.formatted_total_earnings_all || '0 XAF'}</h4>
                            <small className="text-muted">Revenus totaux distribués</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={3} md={6}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="text-center">
                            <FontAwesomeIcon icon={faPercentage} className="text-warning mb-2" size="lg" />
                            <h4 className="fw-bold text-warning">{revenueStats.formatted_total_commission_paid_all || '0 XAF'}</h4>
                            <small className="text-muted">Commission totale perçue</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={3} md={6}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="text-center">
                            <FontAwesomeIcon icon={faChartLine} className="text-info mb-2" size="lg" />
                            <h4 className="fw-bold text-info">{revenueStats.formatted_average_earnings_per_seller || '0 XAF'}</h4>
                            <small className="text-muted">Revenus moyens par vendeur</small>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Répartition par catégorie de vendeurs */}
            <Row className="g-4 mb-4">
                <Col lg={8}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-bottom">
                            <h6 className="fw-bold mb-0">Top Vendeurs</h6>
                        </Card.Header>
                        <Card.Body>
                            {revenueStats.top_earner ? (
                                <div className="d-flex align-items-center mb-3 p-3 bg-light rounded">
                                    <div className="me-3 p-3 rounded-circle text-center" style={{
                                        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                                        color: 'white',
                                        minWidth: '60px',
                                        minHeight: '60px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <FontAwesomeIcon icon={faCrown} size="lg" />
                                    </div>
                                    <div className="flex-grow-1">
                                        <h6 className="fw-bold mb-1">🏆 Meilleur Vendeur</h6>
                                        <div className="fw-medium text-primary">{revenueStats.top_earner.name}</div>
                                        <div className="text-success fw-bold">{revenueStats.top_earner.formatted_total_earnings}</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-3">
                                    <FontAwesomeIcon icon={faUsers} size="2x" className="text-muted mb-2" />
                                    <p className="text-muted">Aucun vendeur actif pour le moment</p>
                                </div>
                            )}

                            {/* Statistiques par catégorie */}
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="text-muted d-flex align-items-center">
                                            <FontAwesomeIcon icon={faCrown} className="text-secondary me-2" />
                                            Platinum
                                        </span>
                                        <span className="fw-bold">{revenueStats.seller_categories?.platinum || 0}</span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="text-muted d-flex align-items-center">
                                            <FontAwesomeIcon icon={faStar} className="text-warning me-2" />
                                            Gold
                                        </span>
                                        <span className="fw-bold">{revenueStats.seller_categories?.gold || 0}</span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="text-muted d-flex align-items-center">
                                            <FontAwesomeIcon icon={faStar} className="text-light me-2" />
                                            Silver
                                        </span>
                                        <span className="fw-bold">{revenueStats.seller_categories?.silver || 0}</span>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="text-muted d-flex align-items-center">
                                            <FontAwesomeIcon icon={faStar} className="text-dark me-2" />
                                            Bronze
                                        </span>
                                        <span className="fw-bold">{revenueStats.seller_categories?.bronze || 0}</span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="text-muted d-flex align-items-center">
                                            <FontAwesomeIcon icon={faUser} className="text-success me-2" />
                                            Rookie
                                        </span>
                                        <span className="fw-bold">{revenueStats.seller_categories?.rookie || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-bottom">
                            <h6 className="fw-bold mb-0">Légende des Catégories</h6>
                        </Card.Header>
                        <Card.Body>
                            <div className="mb-3">
                                <div className="d-flex align-items-center mb-2">
                                    <div className="me-2 p-2 rounded-circle" style={{ background: '#8b5cf6', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FontAwesomeIcon icon={faCrown} className="text-white" style={{ fontSize: '12px' }} />
                                    </div>
                                    <div>
                                        <div className="fw-bold small">Platinum</div>
                                        <small className="text-muted">500 000 XAF+</small>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center mb-2">
                                    <div className="me-2 p-2 rounded-circle" style={{ background: '#f59e0b', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FontAwesomeIcon icon={faStar} className="text-white" style={{ fontSize: '12px' }} />
                                    </div>
                                    <div>
                                        <div className="fw-bold small">Gold</div>
                                        <small className="text-muted">250 000 XAF+</small>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center mb-2">
                                    <div className="me-2 p-2 rounded-circle" style={{ background: '#6b7280', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FontAwesomeIcon icon={faStar} className="text-white" style={{ fontSize: '12px' }} />
                                    </div>
                                    <div>
                                        <div className="fw-bold small">Silver</div>
                                        <small className="text-muted">100 000 XAF+</small>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center mb-2">
                                    <div className="me-2 p-2 rounded-circle" style={{ background: '#92400e', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FontAwesomeIcon icon={faStar} className="text-white" style={{ fontSize: '12px' }} />
                                    </div>
                                    <div>
                                        <div className="fw-bold small">Bronze</div>
                                        <small className="text-muted">25 000 XAF+</small>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center">
                                    <div className="me-2 p-2 rounded-circle" style={{ background: '#059669', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FontAwesomeIcon icon={faUser} className="text-white" style={{ fontSize: '12px' }} />
                                    </div>
                                    <div>
                                        <div className="fw-bold small">Rookie</div>
                                        <small className="text-muted">Premières ventes</small>
                                    </div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Table des revenus */}
            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white">
                    <div className="d-flex justify-content-between align-items-center">
                        <h6 className="fw-bold mb-0">Revenus détaillés par vendeur</h6>
                        <div className="d-flex gap-2">
                            <Form.Select size="sm" style={{ width: 'auto' }}>
                                <option>Toutes les catégories</option>
                                <option value="platinum">Platinum</option>
                                <option value="gold">Gold</option>
                                <option value="silver">Silver</option>
                                <option value="bronze">Bronze</option>
                                <option value="rookie">Rookie</option>
                            </Form.Select>
                        </div>
                    </div>
                </Card.Header>
                <Card.Body className="p-0">
                    {getFilteredRevenue().length === 0 ? (
                        <div className="text-center py-5">
                            <FontAwesomeIcon icon={faEuroSign} size="3x" className="text-muted mb-3" />
                            <h6 className="text-muted">Aucun revenu trouvé</h6>
                            <p className="text-muted small">Les revenus apparaîtront ici une fois les premières ventes effectuées</p>
                        </div>
                    ) : (
                        <CustomDataTable
                            columns={revenueColumns}
                            data={getFilteredRevenue()}
                            {...dataTableConfig}
                            subHeader
                            subHeaderComponent={
                                <div className="d-flex justify-content-between align-items-center w-100 p-3">
                                    <div>
                                        <strong>{getFilteredRevenue().length}</strong> vendeur(s) actif(s) •
                                        <span className="text-success ms-1">
                                            {revenueStats.formatted_total_earnings_all || '0 XAF'} distribués
                                        </span>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <Form.Control
                                            type="text"
                                            placeholder="Rechercher un vendeur..."
                                            size="sm"
                                            style={{ width: '250px' }}
                                        />
                                        <Button variant="outline-secondary" size="sm" onClick={() => {
                                            // La recherche se fait déjà automatiquement via getFilteredUserPayments()
                                            console.log('Recherche manuelle déclenchée');
                                        }}>
                                            <FontAwesomeIcon icon={faSearch} />
                                        </Button>
                                    </div>
                                </div>
                            }
                        />
                    )}
                </Card.Body>
            </Card>
        </div>
    );

    // Colonnes pour la table des achats/dépenses des utilisateurs
    const purchasesColumns = [
        {
            name: 'Acheteur',
            selector: row => row.name,
            sortable: true,
            cell: row => (
                <div className="d-flex align-items-center">
                    <div className="me-3 p-3 rounded-circle text-center position-relative" style={{
                        background: `linear-gradient(135deg, ${
                            row.buyer_category === 'vip' ? '#8b5cf6, #7c3aed' :
                            row.buyer_category === 'premium' ? '#f59e0b, #d97706' :
                            row.buyer_category === 'regular' ? '#3b82f6, #1d4ed8' :
                            row.buyer_category === 'occasional' ? '#10b981, #059669' :
                            row.buyer_category === 'new' ? '#6b7280, #4b5563' :
                            '#9ca3af, #6b7280'
                        })`,
                        color: 'white',
                        minWidth: '60px',
                        minHeight: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <FontAwesomeIcon icon={
                            row.buyer_category === 'vip' ? faCrown :
                            row.buyer_category === 'premium' ? faStar :
                            faUser
                        } className="text-white" />

                        {/* Badge catégorie */}
                        {row.buyer_category !== 'none' && (
                            <div className="position-absolute" style={{
                                bottom: '-5px',
                                right: '-5px',
                                background: row.buyer_category === 'vip' ? '#8b5cf6' :
                                           row.buyer_category === 'premium' ? '#f59e0b' :
                                           row.buyer_category === 'regular' ? '#3b82f6' :
                                           row.buyer_category === 'occasional' ? '#10b981' : '#6b7280',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '8px',
                                fontWeight: 'bold',
                                color: 'white',
                                border: '2px solid white'
                            }}>
                                {row.buyer_category === 'vip' ? 'V' :
                                 row.buyer_category === 'premium' ? 'P' :
                                 row.buyer_category === 'regular' ? 'R' :
                                 row.buyer_category === 'occasional' ? 'O' : 'N'}
                            </div>
                        )}
                    </div>

                    <div className="flex-grow-1">
                        <div className="fw-bold text-dark mb-1">{row.name}</div>
                        <small className="text-muted d-block">{row.email}</small>
                        <div className="small d-flex align-items-center gap-2 mt-1">
                            <Badge bg={row.role === 'artist' ? 'primary' : row.role === 'producer' ? 'success' : 'secondary'}>
                                <FontAwesomeIcon
                                    icon={row.role === 'artist' ? faStar : row.role === 'producer' ? faCog : faUser}
                                    className="me-1"
                                />
                                {row.role === 'artist' ? 'Artiste' : row.role === 'producer' ? 'Producteur' : 'Utilisateur'}
                            </Badge>
                            {row.buyer_category !== 'none' && (
                                <Badge bg={
                                    row.buyer_category === 'vip' ? 'purple' :
                                    row.buyer_category === 'premium' ? 'warning' :
                                    row.buyer_category === 'regular' ? 'primary' :
                                    row.buyer_category === 'occasional' ? 'success' : 'secondary'
                                } className="text-uppercase">
                                    {row.buyer_category === 'vip' ? 'VIP' :
                                     row.buyer_category === 'premium' ? 'Premium' :
                                     row.buyer_category === 'regular' ? 'Régulier' :
                                     row.buyer_category === 'occasional' ? 'Occasionnel' : 'Nouveau'}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            ),
            width: '280px'
        },
        {
            name: 'Dépenses Totales',
            selector: row => row.total_spent,
            sortable: true,
            cell: row => (
                <div className="text-center">
                    <div className="fw-bold h6 mb-1 text-primary">
                        <FontAwesomeIcon icon={faEuroSign} className="me-1" />
                        {row.formatted_total_spent}
                    </div>
                    <small className="text-muted">
                        {row.total_purchases} achat(s)
                    </small>
                    <div className="small text-info">
                        Moy: {row.formatted_average_purchase_amount}
                    </div>
                </div>
            ),
            width: '150px'
        },
        {
            name: 'Répartition',
            selector: row => row.sound_purchases + row.event_purchases,
            sortable: true,
            cell: row => (
                <div className="text-center">
                    <div className="mb-2">
                        <div className="small text-primary">
                            <FontAwesomeIcon icon={faMusic} className="me-1" />
                            Sons: {row.formatted_sound_purchases}
                        </div>
                        <div className="small text-success">
                            <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                            Events: {row.formatted_event_purchases}
                        </div>
                    </div>
                    {row.total_spent > 0 && (
                        <div className="progress" style={{ height: '4px' }}>
                            <div
                                className="progress-bar bg-primary"
                                style={{
                                    width: `${(row.sound_purchases / row.total_spent) * 100}%`
                                }}
                                title={`Sons: ${Math.round((row.sound_purchases / row.total_spent) * 100)}%`}
                            />
                            <div
                                className="progress-bar bg-success"
                                style={{
                                    width: `${(row.event_purchases / row.total_spent) * 100}%`
                                }}
                                title={`Événements: ${Math.round((row.event_purchases / row.total_spent) * 100)}%`}
                            />
                        </div>
                    )}
                </div>
            ),
            width: '160px'
        },
        {
            name: 'Achats',
            selector: row => row.total_purchases,
            sortable: true,
            cell: row => (
                <div className="text-center">
                    <div className="fw-bold text-success mb-1">
                        <FontAwesomeIcon icon={faShoppingCart} className="me-1" />
                        {row.total_purchases}
                    </div>
                    <div className="small text-muted mb-1">
                        <FontAwesomeIcon icon={faMusic} className="me-1 text-primary" />
                        {row.sound_purchases_count} sons
                    </div>
                    <div className="small text-muted">
                        <FontAwesomeIcon icon={faCalendarAlt} className="me-1 text-success" />
                        {row.event_purchases_count} events
                    </div>
                    {row.pending_purchases_count > 0 && (
                        <div className="small text-warning mt-1">
                            <FontAwesomeIcon icon={faClock} className="me-1" />
                            {row.pending_purchases_count} en attente
                        </div>
                    )}
                </div>
            ),
            width: '120px'
        },
        {
            name: 'Activité',
            selector: row => row.days_since_last_purchase,
            sortable: true,
            cell: row => (
                <div className="text-center">
                    <div className="small text-muted mb-1">Dernier achat</div>
                    <div className="fw-medium mb-1">
                        {row.formatted_last_purchase_date || 'Jamais'}
                    </div>
                    {row.days_since_last_purchase !== null && (
                        <div className={`small ${
                            row.days_since_last_purchase <= 7 ? 'text-success' :
                            row.days_since_last_purchase <= 30 ? 'text-warning' : 'text-danger'
                        }`}>
                            {row.days_since_last_purchase === 0 ? 'Aujourd\'hui' :
                             row.days_since_last_purchase === 1 ? 'Hier' :
                             `Il y a ${row.days_since_last_purchase} jours`}
                        </div>
                    )}
                    <div className="small text-muted">
                        Membre depuis {row.formatted_join_date}
                    </div>
                    {row.is_active_buyer && (
                        <Badge bg="success" className="mt-1">Actif</Badge>
                    )}
                </div>
            ),
            width: '140px'
        },
        {
            name: 'Actions',
            cell: row => (
                <div className="d-flex gap-1">
                    <Button
                        as={Link}
                        to={`/artist/${row.id}`}
                        variant="outline-primary"
                        size="sm"
                        title="Voir le profil"
                    >
                        <FontAwesomeIcon icon={faEye} />
                    </Button>
                    <Button
                        variant="outline-success"
                        size="sm"
                        title="Voir les achats détaillés"
                        onClick={() => {
                            setSearchCriteria({
                                ...searchCriteria,
                                user_id: row.id,
                                search: row.name
                            });
                            searchPayments({ user_id: row.id });
                            setShowSearchModal(true);
                        }}
                    >
                        <FontAwesomeIcon icon={faShoppingCart} />
                    </Button>
                    {row.pending_amount > 0 && (
                        <Button
                            variant="outline-warning"
                            size="sm"
                            title="Achats en attente"
                            onClick={() => {
                                setSearchCriteria({
                                    ...searchCriteria,
                                    user_id: row.id,
                                    status: 'pending'
                                });
                                searchPayments({ user_id: row.id, status: 'pending' });
                                setShowSearchModal(true);
                            }}
                        >
                            <FontAwesomeIcon icon={faClock} />
                        </Button>
                    )}
                    <Button
                        variant="outline-info"
                        size="sm"
                        title="Rechercher ses paiements"
                        onClick={() => {
                            setSearchCriteria({
                                ...searchCriteria,
                                user_id: row.id
                            });
                            openSearchModal();
                        }}
                    >
                        <FontAwesomeIcon icon={faSearch} />
                    </Button>
                </div>
            ),
            ignoreRowClick: true,
            allowOverflow: true,
            button: true,
            width: '180px'
        }
    ];

    const renderPurchasesAnalysis = () => (
        <div>
            {/* Header avec actions */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="fw-bold mb-1">Analyse des Achats</h5>
                    <p className="text-muted mb-0 small">Analysez les dépenses des utilisateurs et recherchez des paiements spécifiques</p>
                </div>
                <div className="d-flex gap-2">
                    <Button
                        variant="outline-info"
                        onClick={openSearchModal}
                    >
                        <FontAwesomeIcon icon={faSearch} className="me-2" />
                        Recherche Avancée
                    </Button>
                    <Button
                        variant="outline-primary"
                        onClick={loadUsersPurchases}
                        disabled={loading}
                    >
                        <FontAwesomeIcon icon={faSync} className="me-2" />
                        Actualiser
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => {
                            // Export des achats
                            const csvContent = [
                                ['Nom', 'Email', 'Rôle', 'Catégorie', 'Dépenses Totales', 'Achats Sons', 'Achats Événements', 'Nombre Total Achats', 'Achat Moyen', 'Dernier Achat'],
                                ...usersPurchases.filter(user => user.total_purchases > 0).map(user => [
                                    user.name,
                                    user.email,
                                    user.role,
                                    user.buyer_category,
                                    user.total_spent,
                                    user.sound_purchases,
                                    user.event_purchases,
                                    user.total_purchases,
                                    user.average_purchase_amount,
                                    user.formatted_last_purchase_date
                                ])
                            ].map(row => row.join(',')).join('\n');

                            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                            const link = document.createElement('a');
                            link.href = URL.createObjectURL(blob);
                            link.download = `achats_utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
                            link.click();
                        }}
                    >
                        <FontAwesomeIcon icon={faDownload} className="me-2" />
                        Exporter CSV
                    </Button>
                </div>
            </div>

            {/* Statistiques rapides des achats */}
            <Row className="g-3 mb-4">
                <Col lg={3} md={6}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="text-center">
                            <FontAwesomeIcon icon={faUsers} className="text-primary mb-2" size="lg" />
                            <h4 className="fw-bold text-primary">{purchasesStats.total_buyers || 0}</h4>
                            <small className="text-muted">Acheteurs actifs</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={3} md={6}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="text-center">
                            <FontAwesomeIcon icon={faEuroSign} className="text-success mb-2" size="lg" />
                            <h4 className="fw-bold text-success">{purchasesStats.formatted_total_spent_all || '0 XAF'}</h4>
                            <small className="text-muted">Total dépenses</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={3} md={6}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="text-center">
                            <FontAwesomeIcon icon={faShoppingCart} className="text-info mb-2" size="lg" />
                            <h4 className="fw-bold text-info">{purchasesStats.total_purchases_all || 0}</h4>
                            <small className="text-muted">Total achats</small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={3} md={6}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="text-center">
                            <FontAwesomeIcon icon={faChartLine} className="text-warning mb-2" size="lg" />
                            <h4 className="fw-bold text-warning">{purchasesStats.formatted_average_spent_per_buyer || '0 XAF'}</h4>
                            <small className="text-muted">Dépense moyenne</small>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Répartition par catégorie d'acheteurs */}
            <Row className="g-4 mb-4">
                <Col lg={8}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-bottom">
                            <h6 className="fw-bold mb-0">Top Acheteurs</h6>
                        </Card.Header>
                        <Card.Body>
                            {purchasesStats.top_buyer ? (
                                <div className="d-flex align-items-center mb-3 p-3 bg-light rounded">
                                    <div className="me-3 p-3 rounded-circle text-center" style={{
                                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                                        color: 'white',
                                        minWidth: '60px',
                                        minHeight: '60px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <FontAwesomeIcon icon={faCrown} size="lg" />
                                    </div>
                                    <div className="flex-grow-1">
                                        <h6 className="fw-bold mb-1">🛒 Meilleur Acheteur</h6>
                                        <div className="fw-medium text-primary">{purchasesStats.top_buyer.name}</div>
                                        <div className="text-success fw-bold">{purchasesStats.top_buyer.formatted_total_spent}</div>
                                        <div className="small text-muted">{purchasesStats.top_buyer.total_purchases} achats</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-3">
                                    <FontAwesomeIcon icon={faShoppingCart} size="2x" className="text-muted mb-2" />
                                    <p className="text-muted">Aucun acheteur actif pour le moment</p>
                                </div>
                            )}

                            {/* Statistiques par catégorie */}
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="text-muted d-flex align-items-center">
                                            <FontAwesomeIcon icon={faCrown} className="text-purple me-2" />
                                            VIP
                                        </span>
                                        <span className="fw-bold">{purchasesStats.buyer_categories?.vip || 0}</span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="text-muted d-flex align-items-center">
                                            <FontAwesomeIcon icon={faStar} className="text-warning me-2" />
                                            Premium
                                        </span>
                                        <span className="fw-bold">{purchasesStats.buyer_categories?.premium || 0}</span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="text-muted d-flex align-items-center">
                                            <FontAwesomeIcon icon={faUser} className="text-primary me-2" />
                                            Réguliers
                                        </span>
                                        <span className="fw-bold">{purchasesStats.buyer_categories?.regular || 0}</span>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="text-muted d-flex align-items-center">
                                            <FontAwesomeIcon icon={faUser} className="text-success me-2" />
                                            Occasionnels
                                        </span>
                                        <span className="fw-bold">{purchasesStats.buyer_categories?.occasional || 0}</span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="text-muted d-flex align-items-center">
                                            <FontAwesomeIcon icon={faUser} className="text-secondary me-2" />
                                            Nouveaux
                                        </span>
                                        <span className="fw-bold">{purchasesStats.buyer_categories?.new || 0}</span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="text-muted d-flex align-items-center">
                                            <FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />
                                            Actifs (30j)
                                        </span>
                                        <span className="fw-bold">{purchasesStats.active_buyers || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-bottom">
                            <h6 className="fw-bold mb-0">Légende des Catégories</h6>
                        </Card.Header>
                        <Card.Body>
                            <div className="mb-3">
                                <div className="d-flex align-items-center mb-2">
                                    <div className="me-2 p-2 rounded-circle" style={{ background: '#8b5cf6', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FontAwesomeIcon icon={faCrown} className="text-white" style={{ fontSize: '12px' }} />
                                    </div>
                                    <div>
                                        <div className="fw-bold small">VIP</div>
                                        <small className="text-muted">100 000 XAF+</small>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center mb-2">
                                    <div className="me-2 p-2 rounded-circle" style={{ background: '#f59e0b', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FontAwesomeIcon icon={faStar} className="text-white" style={{ fontSize: '12px' }} />
                                    </div>
                                    <div>
                                        <div className="fw-bold small">Premium</div>
                                        <small className="text-muted">50 000 XAF+</small>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center mb-2">
                                    <div className="me-2 p-2 rounded-circle" style={{ background: '#3b82f6', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FontAwesomeIcon icon={faUser} className="text-white" style={{ fontSize: '12px' }} />
                                    </div>
                                    <div>
                                        <div className="fw-bold small">Régulier</div>
                                        <small className="text-muted">20 000 XAF+</small>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center mb-2">
                                    <div className="me-2 p-2 rounded-circle" style={{ background: '#10b981', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FontAwesomeIcon icon={faUser} className="text-white" style={{ fontSize: '12px' }} />
                                    </div>
                                    <div>
                                        <div className="fw-bold small">Occasionnel</div>
                                        <small className="text-muted">5 000 XAF+</small>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center">
                                    <div className="me-2 p-2 rounded-circle" style={{ background: '#6b7280', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FontAwesomeIcon icon={faUser} className="text-white" style={{ fontSize: '12px' }} />
                                    </div>
                                    <div>
                                        <div className="fw-bold small">Nouveau</div>
                                        <small className="text-muted">Premiers achats</small>
                                    </div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Table des achats */}
            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white">
                    <div className="d-flex justify-content-between align-items-center">
                        <h6 className="fw-bold mb-0">Achats détaillés par utilisateur</h6>
                        <div className="d-flex gap-2">
                            <Form.Select size="sm" style={{ width: 'auto' }}>
                                <option>Toutes les catégories</option>
                                <option value="vip">VIP</option>
                                <option value="premium">Premium</option>
                                <option value="regular">Régulier</option>
                                <option value="occasional">Occasionnel</option>
                                <option value="new">Nouveau</option>
                            </Form.Select>
                            <Button variant="outline-primary" size="sm" onClick={openSearchModal}>
                                <FontAwesomeIcon icon={faSearch} className="me-1" />
                                Recherche
                            </Button>
                        </div>
                    </div>
                </Card.Header>
                <Card.Body className="p-0">
                    {usersPurchases.filter(user => user.total_purchases > 0).length === 0 ? (
                        <div className="text-center py-5">
                            <FontAwesomeIcon icon={faShoppingCart} size="3x" className="text-muted mb-3" />
                            <h6 className="text-muted">Aucun achat trouvé</h6>
                            <p className="text-muted small">Les achats apparaîtront ici une fois les premières transactions effectuées</p>
                        </div>
                    ) : (
                        <CustomDataTable
                            columns={purchasesColumns}
                            data={usersPurchases.filter(user => user.total_purchases > 0)}
                            {...dataTableConfig}
                            subHeader
                            subHeaderComponent={
                                <div className="d-flex justify-content-between align-items-center w-100 p-3">
                                    <div>
                                        <strong>{usersPurchases.filter(user => user.total_purchases > 0).length}</strong> acheteur(s) •
                                        <span className="text-success ms-1">
                                            {purchasesStats.formatted_total_spent_all || '0 XAF'} dépensés
                                        </span>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <Form.Control
                                            type="text"
                                            placeholder="Rechercher un acheteur..."
                                            size="sm"
                                            style={{ width: '250px' }}
                                            value={purchasesSearchTerm}
                                            onChange={(e) => setPurchasesSearchTerm(e.target.value)}
                                        />
                                        <Button variant="outline-secondary" size="sm" onClick={openSearchModal}>
                                            <FontAwesomeIcon icon={faSearch} />
                                        </Button>
                                    </div>
                                </div>
                            }
                        />
                    )}
                </Card.Body>
            </Card>
        </div>
    );

    return (
        <div className="dashboard-container" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
            <div className="d-flex">
                {/* Sidebar */}
                <div className="sidebar shadow-lg" style={{
                    width: '280px',
                    minHeight: '100vh',
                    height: 'auto',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    zIndex: 1000,
                    background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 50%, #1d4ed8 100%)',
                    borderRight: '1px solid #e5e7eb',
                    overflowY: 'auto',
                    maxHeight: '100vh'
                }}>
                    {/* Header de la sidebar */}
                    <div className="sidebar-header p-4 border-bottom border-white border-opacity-20">
                        <div className="d-flex align-items-center">
                            <div className="me-3 p-2 bg-white bg-opacity-20 rounded-3">
                                <FontAwesomeIcon icon={faTachometerAlt} className="text-white" size="2x" />
                            </div>
                            <div>
                                <h5 className="fw-bold mb-0 text-white">Dashboard Admin</h5>
                                <small className="text-white text-opacity-75">Réveil Artist</small>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="sidebar-nav p-3" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                        <div className="mb-4">
                            <small className="text-white text-opacity-60 text-uppercase fw-bold px-3 d-block mb-3"
                                   style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                                NAVIGATION PRINCIPALE
                            </small>
                            <div className="nav flex-column">
                                {navigationItems.map((item) => (
                                    <button
                                        key={item.id}
                                        className={`nav-link btn border-0 text-start p-3 rounded-3 mb-2 d-flex align-items-center position-relative ${
                                            activeTab === item.id
                                                ? 'bg-white text-primary shadow-sm'
                                                : 'text-white text-opacity-90'
                                        }`}
                                        onClick={() => setActiveTab(item.id)}
                                        style={{
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            textDecoration: 'none',
                                            transform: activeTab === item.id ? 'translateX(8px)' : 'translateX(0)',
                                            backdropFilter: activeTab === item.id ? 'none' : 'blur(10px)',
                                            background: activeTab === item.id
                                                ? '#ffffff'
                                                : 'rgba(255, 255, 255, 0.1)',
                                            border: activeTab === item.id
                                                ? '1px solid rgba(59, 130, 246, 0.2)'
                                                : '1px solid rgba(255, 255, 255, 0.1)',
                                            boxShadow: activeTab === item.id
                                                ? '0 4px 15px rgba(0, 0, 0, 0.1)'
                                                : 'none'
                                        }}
                                    >
                                        {/* Indicateur actif */}
                                        {activeTab === item.id && (
                                            <div
                                                className="position-absolute start-0 top-50 translate-middle-y bg-primary rounded-end"
                                                style={{ width: '4px', height: '60%', left: '-1px' }}
                                            />
                                        )}

                                        <div className={`me-3 p-2 rounded-2 ${
                                            activeTab === item.id
                                                ? `bg-${item.color} bg-opacity-10`
                                                : 'bg-white bg-opacity-20'
                                        }`} style={{ minWidth: '40px', textAlign: 'center' }}>
                                            <FontAwesomeIcon
                                                icon={item.icon}
                                                className={`fa-icon ${activeTab === item.id ? `text-${item.color}` : 'text-white'}`}
                                                style={{ fontSize: '16px' }}
                                            />
                                        </div>

                                        <div className="flex-grow-1">
                                            <div className={`fw-semibold mb-1 ${
                                                activeTab === item.id ? 'text-dark' : 'text-white'
                                            }`} style={{ fontSize: '14px' }}>
                                                {item.label}
                                            </div>
                                            <small className={`d-block ${
                                                activeTab === item.id ? 'text-muted' : 'text-white text-opacity-70'
                                            }`} style={{ fontSize: '12px', lineHeight: '1.2' }}>
                                                {item.description}
                                            </small>
                                        </div>

                                        {item.count !== undefined && (
                                            <div className={`px-2 py-1 rounded-pill small fw-bold ${
                                                activeTab === item.id
                                                    ? `bg-${item.color} text-white`
                                                    : 'bg-white bg-opacity-20 text-white'
                                            }`} style={{ fontSize: '11px', minWidth: '24px', textAlign: 'center' }}>
                                                {item.count}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </nav>
                </div>

                {/* Contenu principal */}
                <div className="main-content flex-grow-1" style={{ marginLeft: '280px', minHeight: '100vh' }}>
                    {/* Header du contenu */}
                    <div className="content-header shadow-sm p-4 mb-4" style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        borderBottom: '1px solid #e2e8f0'
                    }}>
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <div className="d-flex align-items-center mb-2">
                                    <div className="me-3 p-2 rounded-3" style={{
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                        color: 'white'
                                    }}>
                                        <FontAwesomeIcon
                                            icon={navigationItems.find(item => item.id === activeTab)?.icon || faTachometerAlt}
                                            style={{ fontSize: '18px' }}
                                        />
                                    </div>
                                    <div>
                                        <h4 className="fw-bold mb-0 text-dark">
                                            {navigationItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
                                        </h4>
                                        <div className="small text-muted d-flex align-items-center mt-1">
                                            <FontAwesomeIcon icon={faHome} className="me-1" style={{ fontSize: '12px' }} />
                                            Dashboard
                                            <span className="mx-1">→</span>
                                            {navigationItems.find(item => item.id === activeTab)?.label}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-muted mb-0" style={{ fontSize: '14px' }}>
                                    {navigationItems.find(item => item.id === activeTab)?.description || 'Bienvenue sur votre dashboard administrateur'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contenu des sections */}
                    <div className="content-body p-4" style={{ minHeight: 'calc(100vh - 120px)' }}>
                        {loading ? (
                            <div className="text-center py-5">
                                <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-primary mb-3" />
                                <h5 className="text-muted">Chargement des données...</h5>
                            </div>
                        ) : (
                            <>
                                {/* Render components based on activeTab */}
                                {activeTab === 'overview' && renderOverview()}
                                {activeTab === 'sounds' && renderSoundsManagement()}
                                {activeTab === 'events' && renderEventsManagement()}
                                {activeTab === 'clips' && <ClipManagement />}
                                {activeTab === 'users' && renderUsersManagement()}
                                {activeTab === 'revenue' && renderRevenueManagement()}
                                {activeTab === 'purchases' && renderPurchasesAnalysis()}
                                {activeTab === 'payments' && <PaymentManagement />}
                                {activeTab === 'certifications' && <CertificationManagement />}
                                {activeTab === 'analytics' && <Analytics />}
                                {activeTab === 'categories' && <CategoryManagement />}
                                {activeTab === 'settings' && renderSettings()}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals pour la gestion des sons */}

            {/* Modal de rejet de son */}
            <Modal show={showSoundRejectModal} onHide={() => setShowSoundRejectModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FontAwesomeIcon icon={faTimes} className="text-warning me-2" />
                        Rejeter le son
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedSound && (
                        <div>
                            <div className="mb-3">
                                <h6 className="fw-bold">{selectedSound.title}</h6>
                                <p className="text-muted small mb-0">
                                    par {selectedSound.artist_name || selectedSound.artist || (selectedSound.user ? selectedSound.user.name : 'Artiste inconnu')}
                                </p>
                            </div>
                            <Form.Group>
                                <Form.Label className="fw-medium">Raison du rejet *</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={4}
                                    placeholder="Expliquez pourquoi ce son est rejeté..."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                />
                                <Form.Text className="text-muted">
                                    Cette raison sera envoyée à l'artiste par email.
                                </Form.Text>
                            </Form.Group>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowSoundRejectModal(false)}
                        disabled={actionLoading}
                    >
                        Annuler
                    </Button>
                    <Button
                        variant="warning"
                        onClick={handleRejectSound}
                        disabled={actionLoading || !rejectReason.trim()}
                    >
                        {actionLoading ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                                Rejet en cours...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faTimes} className="me-2" />
                                Rejeter le son
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal d'approbation de son */}
            <Modal show={showSoundApproveModal} onHide={() => setShowSoundApproveModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FontAwesomeIcon icon={faCheck} className="text-success me-2" />
                        Approuver le son
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedSound && (
                        <div>
                            <div className="text-center mb-4">
                                <FontAwesomeIcon icon={faMusic} size="3x" className="text-primary mb-3" />
                                <h5 className="fw-bold">{selectedSound.title}</h5>
                                <p className="text-muted">
                                    par {selectedSound.artist_name || selectedSound.artist || (selectedSound.user ? selectedSound.user.name : 'Artiste inconnu')}
                                </p>
                            </div>
                            <Alert variant="info">
                                <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                                En approuvant ce son, il sera publié et visible par tous les utilisateurs de la plateforme.
                            </Alert>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowSoundApproveModal(false)}
                        disabled={actionLoading}
                    >
                        Annuler
                    </Button>
                    <Button
                        variant="success"
                        onClick={() => {
                            if (selectedSound) {
                                handleApproveSound(selectedSound.id);
                                setShowSoundApproveModal(false);
                            }
                        }}
                        disabled={actionLoading}
                    >
                        {actionLoading ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                                Approbation...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faCheck} className="me-2" />
                                Approuver le son
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* === MODALS POUR LA GESTION DES PAIEMENTS === */}

            {/* Modal des paiements d'un utilisateur */}
            <Modal
                show={showPaymentsModal}
                onHide={closePaymentsModal}
                size="xl"
                centered
                backdrop="static"
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FontAwesomeIcon icon={faCreditCard} className="text-primary me-2" />
                        Paiements de {selectedUser?.name}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedUser && (
                        <div>
                            {/* En-tête avec infos utilisateur */}
                            <div className="row mb-4">
                                <div className="col-md-8">
                                    <div className="d-flex align-items-center">
                                        <div className="me-3 p-3 rounded-circle text-center" style={{
                                            background: `linear-gradient(135deg, ${
                                                selectedUser.seller_category === 'platinum' ? '#8b5cf6, #7c3aed' :
                                                selectedUser.seller_category === 'gold' ? '#f59e0b, #d97706' :
                                                selectedUser.seller_category === 'silver' ? '#6b7280, #4b5563' :
                                                selectedUser.seller_category === 'bronze' ? '#92400e, #78350f' :
                                                '#059669, #047857'
                                            })`,
                                            color: 'white',
                                            minWidth: '60px',
                                            minHeight: '60px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <FontAwesomeIcon icon={faUser} size="lg" />
                                        </div>
                                        <div>
                                            <h5 className="fw-bold mb-1">{selectedUser.name}</h5>
                                            <p className="text-muted mb-1">{selectedUser.email}</p>
                                            <div className="d-flex gap-2">
                                                <Badge bg="primary">{selectedUser.role}</Badge>
                                                {selectedUser.seller_category !== 'none' && (
                                                    <Badge bg="warning">{selectedUser.seller_category}</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="text-center p-3 bg-light rounded">
                                        <div className="h4 fw-bold text-success mb-1">
                                            {selectedUser.formatted_total_earnings}
                                        </div>
                                        <small className="text-muted">Revenus totaux</small>
                                        <div className="small text-info mt-1">
                                            {selectedUser.total_sales_count} vente(s)
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Filtres et recherche */}
                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <Form.Group>
                                        <Form.Label className="small fw-medium">Filtrer par statut</Form.Label>
                                        <Form.Select
                                            size="sm"
                                            value={paymentsFilter}
                                            onChange={(e) => {
                                                const newFilter = e.target.value;
                                                setPaymentsFilter(newFilter);
                                                // Pas besoin de recharger depuis l'API si on a déjà tous les paiements
                                                // Le filtrage se fait côté client avec getFilteredUserPayments()
                                                console.log('Filtre changé vers:', newFilter);
                                            }}
                                        >
                                            <option value="all">Tous les statuts</option>
                                            <option value="pending">En attente</option>
                                            <option value="completed">Complétés</option>
                                            <option value="cancelled">Annulés</option>
                                            <option value="refunded">Remboursés</option>
                                            <option value="failed">Échecs</option>
                                        </Form.Select>
                                    </Form.Group>
                                </div>
                                <div className="col-md-6">
                                    <Form.Group>
                                        <Form.Label className="small fw-medium">Rechercher</Form.Label>
                                        <div className="input-group input-group-sm">
                                            <Form.Control
                                                type="text"
                                                placeholder="Transaction ID, produit, acheteur..."
                                                value={paymentsSearchTerm}
                                                onChange={(e) => setPaymentsSearchTerm(e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        // La recherche se fait automatiquement côté client
                                                        console.log('Recherche pour:', e.target.value);
                                                    }
                                                }}
                                            />
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                onClick={() => loadUserPayments(selectedUser.id, {
                                                    status: paymentsFilter !== 'all' ? paymentsFilter : undefined,
                                                    search: paymentsSearchTerm || undefined
                                                })}
                                            >
                                                <FontAwesomeIcon icon={faSearch} />
                                            </Button>
                                        </div>
                                    </Form.Group>
                                </div>
                            </div>

                            {/* Actions de lot */}
                            {selectedPayments.length > 0 && (
                                <div className="alert alert-info d-flex justify-content-between align-items-center">
                                    <span>
                                        <FontAwesomeIcon icon={faCheck} className="me-2" />
                                        {selectedPayments.length} paiement(s) sélectionné(s)
                                    </span>
                                    <div className="d-flex gap-1">
                                        <Button size="sm" variant="success" onClick={() => {
                                            setBatchAction('approve');
                                            setShowBatchModal(true);
                                        }}>
                                            <FontAwesomeIcon icon={faCheck} className="me-1" />
                                            Approuver
                                        </Button>
                                        <Button size="sm" variant="warning" onClick={() => {
                                            setBatchAction('cancel');
                                            setShowBatchModal(true);
                                        }}>
                                            <FontAwesomeIcon icon={faTimes} className="me-1" />
                                            Annuler
                                        </Button>
                                        <Button size="sm" variant="secondary" onClick={() => setSelectedPayments([])}>
                                            Désélectionner
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Liste des paiements */}
                            {loadingPayments ? (
                                <div className="text-center py-4">
                                    <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary mb-2" />
                                    <p className="text-muted">Chargement des paiements...</p>
                                </div>
                            ) : userPayments.length === 0 ? (
                                <div className="text-center py-4">
                                    <FontAwesomeIcon icon={faCreditCard} size="3x" className="text-muted mb-3" />
                                    <h6 className="text-muted">Aucun paiement trouvé</h6>
                                    <p className="text-muted small">
                                        {paymentsFilter !== 'all' ?
                                            `Aucun paiement avec le statut "${paymentsFilter}" pour cet utilisateur.` :
                                            'Cet utilisateur n\'a pas encore effectué de ventes sur la plateforme.'}
                                    </p>
                                    {/* Bouton pour réessayer */}
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => loadUserPayments(selectedUser?.id, {
                                            status: paymentsFilter !== 'all' ? paymentsFilter : undefined,
                                            search: paymentsSearchTerm || undefined
                                        })}
                                    >
                                        <FontAwesomeIcon icon={faSync} className="me-2" />
                                        Réessayer
                                    </Button>
                                </div>
                            ) : getFilteredUserPayments().length === 0 ? (
                                <div className="text-center py-4">
                                    <FontAwesomeIcon icon={faSearch} size="3x" className="text-muted mb-3" />
                                    <h6 className="text-muted">Aucun résultat pour cette recherche</h6>
                                    <p className="text-muted small">
                                        Modifiez vos critères de filtrage ou de recherche.
                                    </p>
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={() => {
                                            setPaymentsFilter('all');
                                            setPaymentsSearchTerm('');
                                            loadUserPayments(selectedUser?.id);
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faUndo} className="me-2" />
                                        Réinitialiser les filtres
                                    </Button>
                                </div>
                            ) : (
                                <div>
                                    {/* Statistiques rapides des paiements */}
                                    <div className="alert alert-info mb-3">
                                        <div className="row text-center">
                                            <div className="col-md-3">
                                                <strong>{userPayments.length}</strong>
                                                <div className="small text-muted">Total paiements</div>
                                            </div>
                                            <div className="col-md-3">
                                                <strong>{userPayments.filter(p => p.status === 'completed').length}</strong>
                                                <div className="small text-success">Complétés</div>
                                            </div>
                                            <div className="col-md-3">
                                                <strong>{userPayments.filter(p => p.status === 'pending').length}</strong>
                                                <div className="small text-warning">En attente</div>
                                            </div>
                                            <div className="col-md-3">
                                                <strong>{userPayments.filter(p => p.status === 'cancelled').length}</strong>
                                                <div className="small text-danger">Annulés</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="table-responsive">
                                        <Table striped hover size="sm">
                                            <thead className="table-light">
                                                <tr>
                                                    <th width="30">
                                                        <Form.Check
                                                            type="checkbox"
                                                            checked={selectedPayments.length === getFilteredUserPayments().length && getFilteredUserPayments().length > 0}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedPayments(getFilteredUserPayments().map(p => p.id));
                                                                } else {
                                                                    setSelectedPayments([]);
                                                                }
                                                            }}
                                                        />
                                                    </th>
                                                    <th>Transaction</th>
                                                    <th>Produit</th>
                                                    <th>Acheteur</th>
                                                    <th>Montant</th>
                                                    <th>Statut</th>
                                                    <th>Date</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {getFilteredUserPayments().map(payment => (
                                                    <tr key={payment.id}>
                                                        <td>
                                                            <Form.Check
                                                                type="checkbox"
                                                                checked={selectedPayments.includes(payment.id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedPayments([...selectedPayments, payment.id]);
                                                                    } else {
                                                                        setSelectedPayments(selectedPayments.filter(id => id !== payment.id));
                                                                    }
                                                                }}
                                                            />
                                                        </td>
                                                        <td>
                                                            <div className="small fw-medium">{payment.transaction_id}</div>
                                                            <div className="small text-muted">{payment.payment_method}</div>
                                                        </td>
                                                        <td>
                                                            <div className="small fw-medium">{payment.product_name}</div>
                                                            <div className="small text-muted">
                                                                <FontAwesomeIcon icon={payment.type === 'sound' ? faMusic : faCalendarAlt} className="me-1" />
                                                                {payment.type === 'sound' ? 'Son' : 'Événement'}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="small fw-medium">{payment.buyer_name}</div>
                                                            <div className="small text-muted">{payment.buyer_email}</div>
                                                        </td>
                                                        <td>
                                                            <div className="small fw-bold text-success">{payment.formatted_amount}</div>
                                                            <div className="small text-muted">Commission: {payment.formatted_commission_amount}</div>
                                                        </td>
                                                        <td>
                                                            <Badge bg={
                                                                payment.status === 'completed' ? 'success' :
                                                                payment.status === 'pending' ? 'warning' :
                                                                payment.status === 'cancelled' ? 'secondary' :
                                                                payment.status === 'refunded' ? 'info' : 'danger'
                                                            }>
                                                                {payment.status === 'completed' ? 'Complété' :
                                                                 payment.status === 'pending' ? 'En attente' :
                                                                 payment.status === 'cancelled' ? 'Annulé' :
                                                                 payment.status === 'refunded' ? 'Remboursé' : 'Échec'}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            <div className="small">{payment.formatted_created_at}</div>
                                                            {payment.paid_at && (
                                                                <div className="small text-success">Payé: {payment.formatted_paid_at}</div>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div className="d-flex gap-1">
                                                                {payment.status === 'pending' && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline-success"
                                                                        title="Approuver"
                                                                        onClick={() => openPaymentActionModal(payment, 'approve')}
                                                                    >
                                                                        <FontAwesomeIcon icon={faCheck} />
                                                                    </Button>
                                                                )}
                                                                {(payment.status === 'pending' || payment.status === 'completed') && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline-warning"
                                                                        title="Annuler"
                                                                        onClick={() => openPaymentActionModal(payment, 'cancel')}
                                                                    >
                                                                        <FontAwesomeIcon icon={faTimes} />
                                                                    </Button>
                                                                )}
                                                                {payment.status === 'completed' && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline-info"
                                                                        title="Rembourser"
                                                                        onClick={() => openPaymentActionModal(payment, 'refund')}
                                                                    >
                                                                        <FontAwesomeIcon icon={faUndo} />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closePaymentsModal}>
                        Fermer
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => {
                            // Recharger tous les paiements pour cet utilisateur
                            if (selectedUser) {
                                loadUserPayments(selectedUser.id, { status: 'all' });
                            }
                        }}
                        disabled={loadingPayments}
                    >
                        <FontAwesomeIcon icon={faSync} className="me-2" />
                        Actualiser
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal d'action sur un paiement */}
            <Modal show={showPaymentActionModal} onHide={closePaymentActionModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FontAwesomeIcon
                            icon={paymentAction === 'approve' ? faCheck : paymentAction === 'cancel' ? faTimes : faUndo}
                            className={`me-2 ${paymentAction === 'approve' ? 'text-success' : paymentAction === 'cancel' ? 'text-warning' : 'text-info'}`}
                        />
                        {paymentAction === 'approve' ? 'Approuver le paiement' :
                         paymentAction === 'cancel' ? 'Annuler le paiement' : 'Rembourser le paiement'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedPayment && (
                        <div>
                            {/* Informations du paiement */}
                            <div className="mb-4 p-3 bg-light rounded">
                                <h6 className="fw-bold mb-2">Détails du paiement</h6>
                                <div className="row">
                                    <div className="col-6">
                                        <strong>Transaction ID:</strong><br />
                                        <span className="small">{selectedPayment.transaction_id}</span>
                                    </div>
                                    <div className="col-6">
                                        <strong>Montant:</strong><br />
                                        <span className="text-success fw-bold">{selectedPayment.formatted_amount}</span>
                                    </div>
                                    <div className="col-6 mt-2">
                                        <strong>Produit:</strong><br />
                                        <span className="small">{selectedPayment.product_name}</span>
                                    </div>
                                    <div className="col-6 mt-2">
                                        <strong>Acheteur:</strong><br />
                                        <span className="small">{selectedPayment.buyer_name}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Message d'action */}
                            <Alert variant={paymentAction === 'approve' ? 'success' : paymentAction === 'cancel' ? 'warning' : 'info'}>
                                <FontAwesomeIcon
                                    icon={paymentAction === 'approve' ? faCheckCircle : paymentAction === 'cancel' ? faExclamationTriangle : faUndo}
                                    className="me-2"
                                />
                                {paymentAction === 'approve' ?
                                    'En approuvant ce paiement, le vendeur recevra ses revenus et le statut passera à "Complété".' :
                                 paymentAction === 'cancel' ?
                                    'En annulant ce paiement, la transaction sera marquée comme annulée et aucun revenu ne sera versé.' :
                                    'En remboursant ce paiement, l\'acheteur sera remboursé et les revenus du vendeur seront déduits.'
                                }
                            </Alert>

                            {/* Raison (pour annulation et remboursement) */}
                            {(paymentAction === 'cancel' || paymentAction === 'refund') && (
                                <Form.Group>
                                    <Form.Label className="fw-medium">
                                        Raison {paymentAction === 'cancel' ? 'de l\'annulation' : 'du remboursement'} *
                                    </Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        placeholder={`Expliquez la raison ${paymentAction === 'cancel' ? 'de l\'annulation' : 'du remboursement'}...`}
                                        value={paymentActionReason}
                                        onChange={(e) => setPaymentActionReason(e.target.value)}
                                    />
                                    <Form.Text className="text-muted">
                                        Cette information sera enregistrée dans l'historique du paiement.
                                    </Form.Text>
                                </Form.Group>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={closePaymentActionModal}
                        disabled={processingPaymentAction}
                    >
                        Annuler
                    </Button>
                    <Button
                        variant={paymentAction === 'approve' ? 'success' : paymentAction === 'cancel' ? 'warning' : 'info'}
                        onClick={executePaymentAction}
                        disabled={processingPaymentAction || ((paymentAction === 'cancel' || paymentAction === 'refund') && !paymentActionReason.trim())}
                    >
                        {processingPaymentAction ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                                Traitement...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon
                                    icon={paymentAction === 'approve' ? faCheck : paymentAction === 'cancel' ? faTimes : faUndo}
                                    className="me-2"
                                />
                                {paymentAction === 'approve' ? 'Approuver' :
                                 paymentAction === 'cancel' ? 'Annuler' : 'Rembourser'}
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de traitement par lot */}
            <Modal show={showBatchModal} onHide={() => setShowBatchModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FontAwesomeIcon
                            icon={batchAction === 'approve' ? faCheck : faTimes}
                            className={`me-2 ${batchAction === 'approve' ? 'text-success' : 'text-warning'}`}
                        />
                        {batchAction === 'approve' ? 'Approuver' : 'Annuler'} les paiements sélectionnés
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant={batchAction === 'approve' ? 'success' : 'warning'}>
                        <FontAwesomeIcon
                            icon={batchAction === 'approve' ? faCheckCircle : faExclamationTriangle}
                            className="me-2"
                        />
                        Vous allez {batchAction === 'approve' ? 'approuver' : 'annuler'} <strong>{selectedPayments.length}</strong> paiement(s).
                    </Alert>

                    {batchAction === 'cancel' && (
                        <Form.Group>
                            <Form.Label className="fw-medium">Raison de l'annulation *</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="Expliquez la raison de l'annulation en lot..."
                                value={batchReason}
                                onChange={(e) => setBatchReason(e.target.value)}
                            />
                        </Form.Group>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowBatchModal(false)}
                        disabled={processingBatch}
                    >
                        Annuler
                    </Button>
                    <Button
                        variant={batchAction === 'approve' ? 'success' : 'warning'}
                        onClick={executeBatchAction}
                        disabled={processingBatch || (batchAction === 'cancel' && !batchReason.trim())}
                    >
                        {processingBatch ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                                Traitement...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon
                                    icon={batchAction === 'approve' ? faCheck : faTimes}
                                    className="me-2"
                                />
                                Confirmer ({selectedPayments.length} paiements)
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* === MODALS POUR L'ANALYSE DES ACHATS === */}

            {/* Modal de recherche avancée de paiements */}
            <Modal
                show={showSearchModal}
                onHide={() => setShowSearchModal(false)}
                size="xl"
                centered
                backdrop="static"
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FontAwesomeIcon icon={faSearch} className="text-primary me-2" />
                        Recherche Avancée de Paiements
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {/* Critères de recherche */}
                    <Card className="mb-4">
                        <Card.Header className="bg-light">
                            <h6 className="fw-bold mb-0">Critères de recherche</h6>
                        </Card.Header>
                        <Card.Body>
                            <Row className="g-3">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Recherche textuelle</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Transaction ID, nom, email, produit..."
                                            value={searchCriteria.search}
                                            onChange={(e) => setSearchCriteria({...searchCriteria, search: e.target.value})}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Statut</Form.Label>
                                        <Form.Select
                                            value={searchCriteria.status}
                                            onChange={(e) => setSearchCriteria({...searchCriteria, status: e.target.value})}
                                        >
                                            <option value="all">Tous les statuts</option>
                                            <option value="pending">En attente</option>
                                            <option value="completed">Complétés</option>
                                            <option value="cancelled">Annulés</option>
                                            <option value="refunded">Remboursés</option>
                                            <option value="failed">Échecs</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Type</Form.Label>
                                        <Form.Select
                                            value={searchCriteria.type}
                                            onChange={(e) => setSearchCriteria({...searchCriteria, type: e.target.value})}
                                        >
                                            <option value="all">Tous les types</option>
                                            <option value="sound">Sons</option>
                                            <option value="event">Événements</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Montant minimum</Form.Label>
                                        <Form.Control
                                            type="number"
                                            placeholder="0"
                                            value={searchCriteria.min_amount}
                                            onChange={(e) => setSearchCriteria({...searchCriteria, min_amount: e.target.value})}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Montant maximum</Form.Label>
                                        <Form.Control
                                            type="number"
                                            placeholder="999999"
                                            value={searchCriteria.max_amount}
                                            onChange={(e) => setSearchCriteria({...searchCriteria, max_amount: e.target.value})}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Date début</Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={searchCriteria.start_date}
                                            onChange={(e) => setSearchCriteria({...searchCriteria, start_date: e.target.value})}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Date fin</Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={searchCriteria.end_date}
                                            onChange={(e) => setSearchCriteria({...searchCriteria, end_date: e.target.value})}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <div className="d-flex gap-2 mt-3">
                                <Button
                                    variant="primary"
                                    onClick={() => searchPayments(searchCriteria)}
                                    disabled={loadingSearchResults}
                                >
                                    {loadingSearchResults ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                                            Recherche...
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faSearch} className="me-2" />
                                            Rechercher
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline-secondary"
                                    onClick={() => {
                                        setSearchCriteria({
                                            search: '',
                                            status: 'all',
                                            type: 'all',
                                            min_amount: '',
                                            max_amount: '',
                                            start_date: '',
                                            end_date: '',
                                            user_id: '',
                                            seller_id: ''
                                        });
                                        setSearchResults([]);
                                    }}
                                >
                                    <FontAwesomeIcon icon={faUndo} className="me-2" />
                                    Réinitialiser
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Résultats de recherche */}
                    <Card>
                        <Card.Header className="bg-white">
                            <h6 className="fw-bold mb-0">
                                Résultats de recherche
                                {searchResults.length > 0 && (
                                    <Badge bg="primary" className="ms-2">{searchResults.length}</Badge>
                                )}
                            </h6>
                        </Card.Header>
                        <Card.Body>
                            {loadingSearchResults ? (
                                <div className="text-center py-4">
                                    <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary mb-2" />
                                    <p className="text-muted">Recherche en cours...</p>
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className="text-center py-4">
                                    <FontAwesomeIcon icon={faSearch} size="3x" className="text-muted mb-3" />
                                    <h6 className="text-muted">Aucun résultat</h6>
                                    <p className="text-muted small">Modifiez vos critères de recherche et réessayez</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <Table striped hover size="sm">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Transaction</th>
                                                <th>Type</th>
                                                <th>Produit</th>
                                                <th>Acheteur</th>
                                                <th>Vendeur</th>
                                                <th>Montant</th>
                                                <th>Statut</th>
                                                <th>Date</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {searchResults.map(payment => (
                                                <tr key={payment.id}>
                                                    <td>
                                                        <div className="small fw-medium">{payment.transaction_id}</div>
                                                        <div className="small text-muted">{payment.payment_method}</div>
                                                    </td>
                                                    <td>
                                                        <Badge bg={payment.type === 'sound' ? 'primary' : 'success'}>
                                                            <FontAwesomeIcon icon={payment.type === 'sound' ? faMusic : faCalendarAlt} className="me-1" />
                                                            {payment.type_label}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <div className="small fw-medium">{payment.product_name}</div>
                                                        {payment.sound && (
                                                            <Button
                                                                variant="link"
                                                                size="sm"
                                                                className="p-0 small"
                                                                onClick={() => openProductPaymentsModal('sound', payment.sound.id, payment.sound.title)}
                                                            >
                                                                Voir tous les paiements de ce son
                                                            </Button>
                                                        )}
                                                        {payment.event && (
                                                            <Button
                                                                variant="link"
                                                                size="sm"
                                                                className="p-0 small"
                                                                onClick={() => openProductPaymentsModal('event', payment.event.id, payment.event.title)}
                                                            >
                                                                Voir tous les paiements de cet événement
                                                            </Button>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="small fw-medium">{payment.buyer_name}</div>
                                                        <div className="small text-muted">{payment.buyer_email}</div>
                                                    </td>
                                                    <td>
                                                        <div className="small fw-medium">{payment.seller_name}</div>
                                                        <div className="small text-muted">{payment.seller_email}</div>
                                                    </td>
                                                    <td>
                                                        <div className="small fw-bold text-success">{payment.formatted_amount}</div>
                                                        <div className="small text-muted">Commission: {payment.formatted_commission_amount}</div>
                                                    </td>
                                                    <td>
                                                        <Badge bg={
                                                            payment.status === 'completed' ? 'success' :
                                                            payment.status === 'pending' ? 'warning' :
                                                            payment.status === 'cancelled' ? 'secondary' :
                                                            payment.status === 'refunded' ? 'info' : 'danger'
                                                        }>
                                                            {payment.status_label}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <div className="small">{payment.formatted_created_at}</div>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex gap-1">
                                                            {payment.can_generate_receipt && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline-success"
                                                                    title="Générer le reçu"
                                                                    onClick={() => generateReceipt(payment.id)}
                                                                    disabled={loadingReceipt}
                                                                >
                                                                    <FontAwesomeIcon icon={faDownload} />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowSearchModal(false)}>
                        Fermer
                    </Button>
                    {searchResults.length > 0 && (
                        <Button
                            variant="primary"
                            onClick={() => {
                                // Export des résultats de recherche
                                const csvContent = [
                                    ['Transaction ID', 'Type', 'Produit', 'Acheteur', 'Vendeur', 'Montant', 'Statut', 'Date'],
                                    ...searchResults.map(payment => [
                                        payment.transaction_id,
                                        payment.type_label,
                                        payment.product_name,
                                        payment.buyer_name,
                                        payment.seller_name,
                                        payment.amount,
                                        payment.status_label,
                                        payment.formatted_created_at
                                    ])
                                ].map(row => row.join(',')).join('\n');

                                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                const link = document.createElement('a');
                                link.href = URL.createObjectURL(blob);
                                link.download = `recherche_paiements_${new Date().toISOString().split('T')[0]}.csv`;
                                link.click();
                            }}
                        >
                            <FontAwesomeIcon icon={faDownload} className="me-2" />
                            Exporter Résultats (CSV)
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>

            {/* Modal des paiements d'un produit */}
            <Modal
                show={showProductPaymentsModal}
                onHide={() => setShowProductPaymentsModal(false)}
                size="xl"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FontAwesomeIcon icon={selectedProduct?.type === 'sound' ? faMusic : faCalendarAlt} className="text-primary me-2" />
                        Paiements de {selectedProduct?.title || selectedProduct?.name}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedProduct && (
                        <div>
                            {/* Statistiques du produit */}
                            {selectedProduct.stats && (
                                <Card className="mb-4">
                                    <Card.Header className="bg-light">
                                        <h6 className="fw-bold mb-0">Statistiques du produit</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row className="text-center">
                                            <Col md={3}>
                                                <div className="fw-bold h5 text-primary">{selectedProduct.stats.total_payments}</div>
                                                <small className="text-muted">Total paiements</small>
                                            </Col>
                                            <Col md={3}>
                                                <div className="fw-bold h5 text-success">{selectedProduct.stats.completed_payments}</div>
                                                <small className="text-muted">Complétés</small>
                                            </Col>
                                            <Col md={3}>
                                                <div className="fw-bold h5 text-info">{selectedProduct.stats.formatted_total_revenue}</div>
                                                <small className="text-muted">Revenus totaux</small>
                                            </Col>
                                            <Col md={3}>
                                                <div className="fw-bold h5 text-warning">{selectedProduct.stats.formatted_total_commission}</div>
                                                <small className="text-muted">Commission</small>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Liste des paiements */}
                            {loadingProductPayments ? (
                                <div className="text-center py-4">
                                    <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary mb-2" />
                                    <p className="text-muted">Chargement des paiements...</p>
                                </div>
                            ) : productPayments.length === 0 ? (
                                <div className="text-center py-4">
                                    <FontAwesomeIcon icon={faCreditCard} size="3x" className="text-muted mb-3" />
                                    <h6 className="text-muted">Aucun paiement trouvé</h6>
                                    <p className="text-muted small">Ce produit n'a encore généré aucun paiement</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <Table striped hover size="sm">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Transaction</th>
                                                <th>Acheteur</th>
                                                <th>Montant</th>
                                                <th>Statut</th>
                                                <th>Date</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {productPayments.map(payment => (
                                                <tr key={payment.id}>
                                                    <td>
                                                        <div className="small fw-medium">{payment.transaction_id}</div>
                                                        <div className="small text-muted">{payment.payment_method}</div>
                                                    </td>
                                                    <td>
                                                        <div className="small fw-medium">{payment.buyer_name}</div>
                                                        <div className="small text-muted">{payment.buyer_email}</div>
                                                    </td>
                                                    <td>
                                                        <div className="small fw-bold text-success">{payment.formatted_amount}</div>
                                                        <div className="small text-muted">Commission: {payment.formatted_commission_amount}</div>
                                                    </td>
                                                    <td>
                                                        <Badge bg={
                                                            payment.status === 'completed' ? 'success' :
                                                            payment.status === 'pending' ? 'warning' :
                                                            payment.status === 'cancelled' ? 'secondary' :
                                                            payment.status === 'refunded' ? 'info' : 'danger'
                                                        }>
                                                            {payment.status_label}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <div className="small">{payment.formatted_created_at}</div>
                                                    </td>
                                                    <td>
                                                        {payment.can_generate_receipt && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline-success"
                                                                title="Générer le reçu"
                                                                onClick={() => generateReceipt(payment.id)}
                                                                disabled={loadingReceipt}
                                                            >
                                                                <FontAwesomeIcon icon={faDownload} />
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowProductPaymentsModal(false)}>
                        Fermer
                    </Button>
                    {productPayments.length > 0 && (
                        <Button
                            variant="primary"
                            onClick={() => {
                                // Export des paiements du produit
                                const csvContent = [
                                    ['Transaction ID', 'Acheteur', 'Email', 'Montant', 'Commission', 'Statut', 'Date'],
                                    ...productPayments.map(payment => [
                                        payment.transaction_id,
                                        payment.buyer_name,
                                        payment.buyer_email,
                                        payment.amount,
                                        payment.commission_amount,
                                        payment.status_label,
                                        payment.formatted_created_at
                                    ])
                                ].map(row => row.join(',')).join('\n');

                                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                const link = document.createElement('a');
                                link.href = URL.createObjectURL(blob);
                                link.download = `paiements_${selectedProduct?.type}_${selectedProduct?.id}_${new Date().toISOString().split('T')[0]}.csv`;
                                link.click();
                            }}
                        >
                            <FontAwesomeIcon icon={faDownload} className="me-2" />
                            Exporter (CSV)
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>

            {/* Modal de reçu */}
            <Modal
                show={showReceiptModal}
                onHide={() => setShowReceiptModal(false)}
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FontAwesomeIcon icon={faDownload} className="text-success me-2" />
                        Reçu de Paiement
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {receiptData && (
                        <div className="receipt-container p-4" style={{ backgroundColor: '#f8f9fa' }}>
                            {/* En-tête du reçu */}
                            <div className="text-center mb-4">
                                <h3 className="fw-bold text-primary">{receiptData.company.name}</h3>
                                <p className="text-muted mb-1">{receiptData.company.address}</p>
                                <p className="text-muted mb-1">{receiptData.company.phone} • {receiptData.company.email}</p>
                                <p className="text-muted">{receiptData.company.website}</p>
                                <hr />
                                <h4 className="fw-bold">REÇU DE PAIEMENT</h4>
                                <p className="text-muted">N° {receiptData.receipt_number}</p>
                            </div>

                            {/* Informations du paiement */}
                            <Row className="mb-4">
                                <Col md={6}>
                                    <h6 className="fw-bold">Informations de paiement</h6>
                                    <table className="table table-borderless table-sm">
                                        <tbody>
                                            <tr>
                                                <td><strong>Transaction ID:</strong></td>
                                                <td>{receiptData.payment.transaction_id}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Date de paiement:</strong></td>
                                                <td>{receiptData.payment.formatted_paid_at}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Méthode:</strong></td>
                                                <td>{receiptData.payment.payment_method}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Statut:</strong></td>
                                                <td>
                                                    <Badge bg="success">{receiptData.payment.status_label}</Badge>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </Col>
                                <Col md={6}>
                                    <h6 className="fw-bold">Acheteur</h6>
                                    <p className="mb-1"><strong>{receiptData.payment.buyer_name}</strong></p>
                                    <p className="text-muted">{receiptData.payment.buyer_email}</p>

                                    <h6 className="fw-bold mt-3">Vendeur</h6>
                                    <p className="mb-1"><strong>{receiptData.payment.seller_name}</strong></p>
                                    <p className="text-muted">{receiptData.payment.seller_email}</p>
                                </Col>
                            </Row>

                            {/* Détails du produit */}
                            <div className="mb-4">
                                <h6 className="fw-bold">Produit acheté</h6>
                                <div className="p-3 bg-white rounded border">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="mb-1">
                                                <Badge bg={receiptData.payment.type === 'sound' ? 'primary' : 'success'} className="me-2">
                                                    <FontAwesomeIcon icon={receiptData.payment.type === 'sound' ? faMusic : faCalendarAlt} className="me-1" />
                                                    {receiptData.payment.type_label}
                                                </Badge>
                                                {receiptData.payment.product_name}
                                            </h6>
                                        </div>
                                        <div className="text-end">
                                            <div className="fw-bold h5 text-success">{receiptData.payment.formatted_amount}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Récapitulatif financier */}
                            <div className="mb-4">
                                <h6 className="fw-bold">Récapitulatif</h6>
                                <div className="p-3 bg-white rounded border">
                                    <table className="table table-borderless mb-0">
                                        <tbody>
                                            <tr>
                                                <td>Montant total:</td>
                                                <td className="text-end fw-bold">{receiptData.payment.formatted_amount}</td>
                                            </tr>
                                            <tr>
                                                <td>Commission plateforme ({receiptData.payment.commission_rate}%):</td>
                                                <td className="text-end">{receiptData.payment.formatted_commission_amount}</td>
                                            </tr>
                                            <tr className="border-top">
                                                <td><strong>Montant versé au vendeur:</strong></td>
                                                <td className="text-end"><strong>{receiptData.payment.formatted_seller_amount}</strong></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="text-center mt-4">
                                <hr />
                                <small className="text-muted">
                                    Reçu généré le {receiptData.issue_date}<br />
                                    Ce reçu confirme le paiement effectué sur la plateforme {receiptData.company.name}
                                </small>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowReceiptModal(false)}>
                        Fermer
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => {
                            // Imprimer le reçu
                            const printContent = document.querySelector('.receipt-container').innerHTML;
                            const printWindow = window.open('', '_blank');
                            printWindow.document.write(`
                                <html>
                                    <head>
                                        <title>Reçu de Paiement - ${receiptData.receipt_number}</title>
                                        <style>
                                            body { font-family: Arial, sans-serif; margin: 20px; }
                                            .fw-bold { font-weight: bold; }
                                            .text-center { text-align: center; }
                                            .text-end { text-align: right; }
                                            .text-primary { color: #0d6efd; }
                                            .text-success { color: #198754; }
                                            .text-muted { color: #6c757d; }
                                            .mb-1 { margin-bottom: 0.25rem; }
                                            .mb-4 { margin-bottom: 1.5rem; }
                                            .p-3 { padding: 1rem; }
                                            .bg-white { background-color: white; }
                                            .border { border: 1px solid #dee2e6; }
                                            .rounded { border-radius: 0.375rem; }
                                            table { width: 100%; }
                                            .table-borderless td { border: none; padding: 0.25rem 0; }
                                            .border-top { border-top: 1px solid #dee2e6; }
                                            hr { margin: 1rem 0; }
                                        </style>
                                    </head>
                                    <body>${printContent}</body>
                                </html>
                            `);
                            printWindow.document.close();
                            printWindow.print();
                        }}
                    >
                        <FontAwesomeIcon icon={faDownload} className="me-2" />
                        Imprimer / Télécharger
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Dashboard;
