import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, ListGroup, Modal, Form, Alert, Tab, Nav, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faMusic,
    faCheckCircle,
    faTimesCircle,
    faClock,
    faEye,
    faPlay,
    faDownload,
    faEdit,
    faTrash,
    faSearch,
    faFilter,
    faUserShield,
    faExclamationTriangle,
    faBell,
    faRefresh,
    faSort
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const SoundManagement = () => {
    const [activeTab, setActiveTab] = useState('pending');
    const [sounds, setSounds] = useState([]);
    const [allSounds, setAllSounds] = useState([]);
    const [selectedSound, setSelectedSound] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({
        pending: 0,
        approved: 0,
        rejected: 0,
        published: 0
    });

    const { user, token } = useAuth();
    const toast = useToast();

    useEffect(() => {
        loadAllSounds();
    }, []);

    useEffect(() => {
        filterSoundsByStatus();
    }, [activeTab, allSounds]);

    const loadAllSounds = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/sounds', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const soundsArray = Array.isArray(data) ? data : data.data || [];
                setAllSounds(soundsArray);

                // Calculer les statistiques
                const newStats = {
                    pending: soundsArray.filter(s => s.status === 'pending').length,
                    approved: soundsArray.filter(s => s.status === 'approved').length,
                    rejected: soundsArray.filter(s => s.status === 'rejected').length,
                    published: soundsArray.filter(s => s.status === 'published').length
                };
                setStats(newStats);

                console.log('Sons chargés:', soundsArray.length, 'Stats:', newStats);
            } else {
                console.error('Erreur de chargement:', response.status);
                // Utiliser des données de démonstration si l'API n'est pas disponible
                loadFallbackData();
            }
        } catch (error) {
            console.error('Erreur de connexion:', error);
            loadFallbackData();
        } finally {
            setLoading(false);
        }
    };

    const loadFallbackData = () => {
        const demoSounds = [
            {
                id: 1,
                title: "Afro Fusion Beat",
                description: "Un beat afro moderne avec des sonorités traditionnelles camerounaises",
                status: "pending",
                created_at: "2024-03-15T10:30:00Z",
                updated_at: "2024-03-15T10:30:00Z",
                price: null,
                category: "Afrobeat",
                genre: "Afrobeat",
                bpm: "120",
                key: "C minor",
                plays_count: 0,
                likes_count: 0,
                downloads_count: 0,
                tags: ["afro", "modern", "beat"],
                license_type: "royalty_free",
                copyright_owner: "DJ Cameroun",
                composer: "DJ Cameroun",
                artist: {
                    id: 1,
                    name: "DJ Cameroun",
                    email: "dj@example.com"
                },
                cover_image_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop",
                audio_file_url: "/sounds/demo.mp3"
            },
            {
                id: 2,
                title: "Makossa Electric",
                description: "Fusion électronique du makossa traditionnel avec des éléments modernes",
                status: "pending",
                created_at: "2024-03-14T15:20:00Z",
                updated_at: "2024-03-14T15:20:00Z",
                price: null,
                category: "Traditional",
                genre: "Makossa",
                bpm: "110",
                key: "A major",
                plays_count: 0,
                likes_count: 0,
                downloads_count: 0,
                tags: ["makossa", "electric", "traditional"],
                license_type: "creative_commons",
                copyright_owner: "Beat Producer",
                composer: "Beat Producer",
                artist: {
                    id: 2,
                    name: "Beat Producer",
                    email: "producer@example.com"
                },
                cover_image_url: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=100&h=100&fit=crop",
                audio_file_url: "/sounds/demo2.mp3"
            },
            {
                id: 3,
                title: "Urban Cameroun Vibes",
                description: "Son urbain avec influences camerounaises contemporaines",
                status: "approved",
                created_at: "2024-03-12T09:15:00Z",
                updated_at: "2024-03-13T14:30:00Z",
                price: 2500,
                category: "Hip-Hop",
                genre: "Urban",
                bpm: "95",
                key: "F# minor",
                plays_count: 12,
                likes_count: 3,
                downloads_count: 1,
                tags: ["urban", "cameroun", "modern"],
                license_type: "royalty_free",
                copyright_owner: "Urban Artist",
                composer: "Urban Artist",
                artist: {
                    id: 3,
                    name: "Urban Artist",
                    email: "urban@example.com"
                },
                cover_image_url: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=100&h=100&fit=crop",
                audio_file_url: "/sounds/demo3.mp3"
            }
        ];

        setAllSounds(demoSounds);

        const newStats = {
            pending: demoSounds.filter(s => s.status === 'pending').length,
            approved: demoSounds.filter(s => s.status === 'approved').length,
            rejected: demoSounds.filter(s => s.status === 'rejected').length,
            published: demoSounds.filter(s => s.status === 'published').length
        };
        setStats(newStats);

        toast.info('Mode démo', 'Données de démonstration chargées');
    };

    const filterSoundsByStatus = () => {
        const filtered = allSounds.filter(sound => sound.status === activeTab);
        setSounds(filtered);
    };

    const approveSound = async (soundId) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/sounds/${soundId}/approve`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                toast.success('Son approuvé', 'Le son a été approuvé avec succès');

                // Envoyer notification à l'utilisateur
                await sendNotificationToUser(soundId, 'approved');

                // Recharger toutes les données
                await loadAllSounds();
            } else {
                const errorData = await response.json();
                toast.error('Erreur', errorData.message || 'Impossible d\'approuver le son');
            }
        } catch (error) {
            console.error('Erreur lors de l\'approbation:', error);
            toast.error('Erreur', 'Erreur de connexion lors de l\'approbation');
        } finally {
            setLoading(false);
        }
    };

    const rejectSound = async (soundId, reason) => {
        if (!reason || !reason.trim()) {
            toast.error('Erreur', 'La raison du rejet est obligatoire');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/admin/sounds/${soundId}/reject`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ reason: reason.trim() })
            });

            if (response.ok) {
                toast.success('Son rejeté', 'Le son a été rejeté');

                // Envoyer notification à l'utilisateur
                await sendNotificationToUser(soundId, 'rejected', reason);

                // Recharger toutes les données
                await loadAllSounds();

                // Fermer les modals
                setShowRejectModal(false);
                setRejectReason('');
                setSelectedSound(null);
            } else {
                const errorData = await response.json();
                toast.error('Erreur', errorData.message || 'Impossible de rejeter le son');
            }
        } catch (error) {
            console.error('Erreur lors du rejet:', error);
            toast.error('Erreur', 'Erreur de connexion lors du rejet');
        } finally {
            setLoading(false);
        }
    };

    const sendNotificationToUser = async (soundId, action, reason = null) => {
        try {
            const sound = allSounds.find(s => s.id === soundId);
            if (!sound) return;

            const notificationData = {
                user_id: sound.artist.id,
                type: action === 'approved' ? 'success' : 'warning',
                title: action === 'approved' ? 'Son approuvé !' : 'Son rejeté',
                message: action === 'approved'
                    ? `Votre son "${sound.title}" a été approuvé et est maintenant disponible. Vous pouvez définir son prix dans votre profil.`
                    : `Votre son "${sound.title}" a été rejeté. Raison: ${reason || 'Non spécifiée'}`,
                metadata: {
                    sound_id: soundId,
                    action: action,
                    reason: reason
                }
            };

            const response = await fetch('/api/admin/send-notification', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(notificationData)
            });

            if (response.ok) {
                console.log('Notification envoyée avec succès');
            } else {
                console.warn('Erreur lors de l\'envoi de la notification');
            }
        } catch (error) {
            console.warn('Erreur lors de l\'envoi de la notification:', error);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { variant: 'warning', text: 'En attente', icon: faClock },
            approved: { variant: 'success', text: 'Approuvé', icon: faCheckCircle },
            rejected: { variant: 'danger', text: 'Rejeté', icon: faTimesCircle },
            published: { variant: 'info', text: 'Publié', icon: faMusic }
        };
        const config = statusConfig[status] || { variant: 'secondary', text: status, icon: faMusic };
        return (
            <Badge bg={config.variant}>
                <FontAwesomeIcon icon={config.icon} className="me-1" />
                {config.text}
            </Badge>
        );
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-CM', {
            style: 'currency',
            currency: 'XAF',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredSounds = sounds.filter(sound =>
        sound.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sound.artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sound.genre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSearchTerm(''); // Reset search when changing tabs
    };

    return (
        <div className="min-vh-100 bg-light" style={{ paddingTop: '80px' }}>
            <Container>
                <div className="d-flex justify-content-between align-items-center py-4">
                    <div>
                        <h2 className="fw-bold mb-1">
                            <FontAwesomeIcon icon={faUserShield} className="me-2 text-primary" />
                            Gestion des Sons
                        </h2>
                        <p className="text-muted mb-0">Administration et validation des contenus musicaux</p>
                    </div>
                    <Button
                        variant="outline-primary"
                        onClick={loadAllSounds}
                        disabled={loading}
                    >
                        <FontAwesomeIcon icon={faRefresh} className={`me-1 ${loading ? 'fa-spin' : ''}`} />
                        Actualiser
                    </Button>
                </div>

                {/* Statistiques */}
                <Row className="g-4 mb-4">
                    <Col lg={3} md={6}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body className="text-center">
                                <FontAwesomeIcon icon={faClock} className="text-warning mb-2" size="2x" />
                                <h4 className="fw-bold text-warning">{stats.pending}</h4>
                                <small className="text-muted">En attente de validation</small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={3} md={6}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body className="text-center">
                                <FontAwesomeIcon icon={faCheckCircle} className="text-success mb-2" size="2x" />
                                <h4 className="fw-bold text-success">{stats.approved}</h4>
                                <small className="text-muted">Approuvés</small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={3} md={6}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body className="text-center">
                                <FontAwesomeIcon icon={faTimesCircle} className="text-danger mb-2" size="2x" />
                                <h4 className="fw-bold text-danger">{stats.rejected}</h4>
                                <small className="text-muted">Rejetés</small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={3} md={6}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body className="text-center">
                                <FontAwesomeIcon icon={faMusic} className="text-info mb-2" size="2x" />
                                <h4 className="fw-bold text-info">{stats.published}</h4>
                                <small className="text-muted">Publiés</small>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Navigation et recherche */}
                <Card className="border-0 shadow-sm mb-4">
                    <Card.Header className="bg-white border-0">
                        <Row className="align-items-center">
                            <Col md={8}>
                                <Nav variant="pills">
                                    <Nav.Item>
                                        <Nav.Link
                                            active={activeTab === 'pending'}
                                            onClick={() => handleTabChange('pending')}
                                        >
                                            <FontAwesomeIcon icon={faClock} className="me-1" />
                                            En attente ({stats.pending})
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link
                                            active={activeTab === 'approved'}
                                            onClick={() => handleTabChange('approved')}
                                        >
                                            <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                                            Approuvés ({stats.approved})
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link
                                            active={activeTab === 'rejected'}
                                            onClick={() => handleTabChange('rejected')}
                                        >
                                            <FontAwesomeIcon icon={faTimesCircle} className="me-1" />
                                            Rejetés ({stats.rejected})
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link
                                            active={activeTab === 'published'}
                                            onClick={() => handleTabChange('published')}
                                        >
                                            <FontAwesomeIcon icon={faMusic} className="me-1" />
                                            Publiés ({stats.published})
                                        </Nav.Link>
                                    </Nav.Item>
                                </Nav>
                            </Col>
                            <Col md={4}>
                                <Form.Control
                                    type="text"
                                    placeholder="Rechercher par titre, artiste ou genre..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </Col>
                        </Row>
                    </Card.Header>

                    <Card.Body className="p-0">
                        {loading ? (
                            <div className="text-center py-5">
                                <Spinner animation="border" variant="primary" />
                                <div className="mt-2">Chargement des sons...</div>
                            </div>
                        ) : filteredSounds.length > 0 ? (
                            <ListGroup variant="flush">
                                {filteredSounds.map((sound) => (
                                    <ListGroup.Item key={sound.id} className="p-4">
                                        <Row className="align-items-center">
                                            <Col md={4}>
                                                <div className="d-flex align-items-center">
                                                    <img
                                                        src={sound.cover_image_url}
                                                        alt={sound.title}
                                                        className="rounded me-3"
                                                        style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                                    />
                                                    <div>
                                                        <h6 className="fw-bold mb-1">{sound.title}</h6>
                                                        <p className="text-muted mb-1 small">par {sound.artist.name}</p>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <Badge bg="light" text="dark">{sound.category}</Badge>
                                                            {getStatusBadge(sound.status)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col md={2} className="text-center">
                                                <small className="text-muted">Soumis le</small>
                                                <div className="fw-bold small">
                                                    {formatDate(sound.created_at)}
                                                </div>
                                            </Col>
                                            <Col md={3} className="text-center">
                                                <div className="small mb-1">
                                                    {sound.bpm && <div>♪ {sound.bpm} BPM</div>}
                                                    {sound.key && <div>🎵 {sound.key}</div>}
                                                    {sound.genre && <div>🎧 {sound.genre}</div>}
                                                </div>
                                                {sound.price && (
                                                    <div className="text-success fw-bold small">
                                                        {formatCurrency(sound.price)}
                                                    </div>
                                                )}
                                            </Col>
                                            <Col md={3} className="text-end">
                                                <Button
                                                    variant="outline-info"
                                                    size="sm"
                                                    className="me-1"
                                                    onClick={() => {
                                                        setSelectedSound(sound);
                                                        setShowDetailModal(true);
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
                                                </Button>

                                                {activeTab === 'pending' && (
                                                    <>
                                                        <Button
                                                            variant="success"
                                                            size="sm"
                                                            className="me-1"
                                                            onClick={() => approveSound(sound.id)}
                                                            disabled={loading}
                                                        >
                                                            <FontAwesomeIcon icon={faCheckCircle} />
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedSound(sound);
                                                                setShowRejectModal(true);
                                                            }}
                                                            disabled={loading}
                                                        >
                                                            <FontAwesomeIcon icon={faTimesCircle} />
                                                        </Button>
                                                    </>
                                                )}
                                            </Col>
                                        </Row>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        ) : (
                            <div className="text-center py-5">
                                <FontAwesomeIcon icon={faMusic} size="3x" className="text-muted mb-3" />
                                <h5 className="text-muted">
                                    {searchTerm
                                        ? 'Aucun son trouvé pour cette recherche'
                                        : `Aucun son ${activeTab === 'pending' ? 'en attente' : activeTab === 'approved' ? 'approuvé' : activeTab === 'rejected' ? 'rejeté' : 'publié'}`
                                    }
                                </h5>
                                <p className="text-muted">
                                    {searchTerm
                                        ? 'Essayez avec d\'autres mots-clés'
                                        : 'La liste est vide pour le moment'
                                    }
                                </p>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </Container>

            {/* Modal de détails */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FontAwesomeIcon icon={faEye} className="me-2" />
                        Détails du son
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedSound && (
                        <Row>
                            <Col md={4}>
                                <img
                                    src={selectedSound.cover_image_url}
                                    alt={selectedSound.title}
                                    className="rounded w-100 mb-3"
                                />
                            </Col>
                            <Col md={8}>
                                <h5 className="fw-bold">{selectedSound.title}</h5>
                                <p className="text-muted">{selectedSound.description}</p>

                                <Row className="g-3">
                                    <Col sm={6}>
                                        <strong>Artiste:</strong> {selectedSound.artist.name}
                                    </Col>
                                    <Col sm={6}>
                                        <strong>Email:</strong> {selectedSound.artist.email}
                                    </Col>
                                    <Col sm={6}>
                                        <strong>Catégorie:</strong> {selectedSound.category}
                                    </Col>
                                    <Col sm={6}>
                                        <strong>Genre:</strong> {selectedSound.genre}
                                    </Col>
                                    <Col sm={6}>
                                        <strong>Statut:</strong> {getStatusBadge(selectedSound.status)}
                                    </Col>
                                    <Col sm={6}>
                                        <strong>Type de licence:</strong> {selectedSound.license_type}
                                    </Col>
                                    {selectedSound.bpm && (
                                        <Col sm={6}>
                                            <strong>BPM:</strong> {selectedSound.bpm}
                                        </Col>
                                    )}
                                    {selectedSound.key && (
                                        <Col sm={6}>
                                            <strong>Tonalité:</strong> {selectedSound.key}
                                        </Col>
                                    )}
                                    <Col sm={6}>
                                        <strong>Créé le:</strong> {formatDate(selectedSound.created_at)}
                                    </Col>
                                    <Col sm={6}>
                                        <strong>Modifié le:</strong> {formatDate(selectedSound.updated_at)}
                                    </Col>
                                    {selectedSound.price && (
                                        <Col sm={6}>
                                            <strong>Prix:</strong> {formatCurrency(selectedSound.price)}
                                        </Col>
                                    )}
                                    <Col sm={6}>
                                        <strong>Propriétaire des droits:</strong> {selectedSound.copyright_owner}
                                    </Col>
                                    <Col sm={6}>
                                        <strong>Compositeur:</strong> {selectedSound.composer}
                                    </Col>
                                    {selectedSound.tags && selectedSound.tags.length > 0 && (
                                        <Col sm={12}>
                                            <strong>Tags:</strong>
                                            <div className="mt-1">
                                                {selectedSound.tags.map((tag, index) => (
                                                    <Badge key={index} bg="secondary" className="me-1">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </Col>
                                    )}
                                </Row>
                            </Col>
                        </Row>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                        Fermer
                    </Button>
                    {selectedSound && selectedSound.status === 'pending' && (
                        <>
                            <Button
                                variant="success"
                                onClick={() => {
                                    approveSound(selectedSound.id);
                                    setShowDetailModal(false);
                                }}
                                disabled={loading}
                            >
                                <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                                Approuver
                            </Button>
                            <Button
                                variant="danger"
                                onClick={() => {
                                    setShowDetailModal(false);
                                    setShowRejectModal(true);
                                }}
                                disabled={loading}
                            >
                                <FontAwesomeIcon icon={faTimesCircle} className="me-1" />
                                Rejeter
                            </Button>
                        </>
                    )}
                </Modal.Footer>
            </Modal>

            {/* Modal de rejet */}
            <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FontAwesomeIcon icon={faExclamationTriangle} className="me-2 text-warning" />
                        Rejeter le son
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="warning">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                        <strong>Attention !</strong> Vous êtes sur le point de rejeter ce son. L'artiste sera automatiquement notifié par email et dans son profil.
                    </Alert>

                    {selectedSound && (
                        <div className="mb-3 p-3 bg-light rounded">
                            <h6 className="fw-bold">{selectedSound.title}</h6>
                            <small className="text-muted">par {selectedSound.artist.name}</small>
                        </div>
                    )}

                    <Form.Group>
                        <Form.Label className="fw-bold">
                            Raison du rejet <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Expliquez clairement pourquoi ce son est rejeté (qualité audio, droits d'auteur, contenu inapproprié, etc.)..."
                            required
                        />
                        <Form.Text className="text-muted">
                            Cette raison sera envoyée à l'artiste. Soyez constructif et précis.
                        </Form.Text>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setShowRejectModal(false);
                            setRejectReason('');
                        }}
                    >
                        Annuler
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => rejectSound(selectedSound?.id, rejectReason)}
                        disabled={!rejectReason.trim() || loading}
                    >
                        {loading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-1" />
                                Rejet en cours...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faTimesCircle} className="me-1" />
                                Confirmer le rejet
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default SoundManagement;
