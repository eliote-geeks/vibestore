import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Form, Alert, ProgressBar, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faVideo, faEye, faHeart, faComment, faShare, faPlay, faPause, faVolumeUp,
    faCheck, faTimes, faStar, faTrash, faEdit, faSearch, faFilter, faSync,
    faDownload, faChartLine, faClock, faUser, faCalendarAlt, faFileVideo,
    faThumbsUp, faThumbsDown, faExclamationTriangle, faSpinner
} from '@fortawesome/free-solid-svg-icons';
import DataTable from 'react-data-table-component';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const ClipManagement = () => {
    const { user, getAuthHeaders } = useAuth();

    // États pour les données
    const [clips, setClips] = useState([]);
    const [clipStats, setClipStats] = useState({});
    const [pendingClips, setPendingClips] = useState([]);

    // États pour l'interface
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    // États pour les filtres et recherche
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [featuredFilter, setFeaturedFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState({
        from: '',
        to: ''
    });

    // États pour les modals
    const [showActionModal, setShowActionModal] = useState(false);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [selectedClip, setSelectedClip] = useState(null);
    const [actionType, setActionType] = useState(''); // approve, reject, delete, toggle_featured
    const [actionReason, setActionReason] = useState('');
    const [processingAction, setProcessingAction] = useState(false);

    // États pour les actions en lot
    const [selectedClips, setSelectedClips] = useState([]);
    const [batchAction, setBatchAction] = useState('');
    const [batchReason, setBatchReason] = useState('');
    const [processingBatch, setProcessingBatch] = useState(false);

    // États pour le lecteur vidéo
    const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Fonctions de chargement des données
    const loadClipStats = async () => {
        try {
            console.log('Chargement des stats clips...');
            const response = await fetch('/api/admin/clips/stats', {
                headers: getAuthHeaders()
            });
            console.log('Response stats:', response.status, response.statusText);
            if (response.ok) {
                const data = await response.json();
                console.log('Data stats:', data);
                setClipStats(data.stats || {});
            } else {
                console.error('Erreur response stats:', response.status);
                const errorData = await response.text();
                console.error('Error data:', errorData);
            }
        } catch (error) {
            console.error('Erreur chargement stats clips:', error);
        }
    };

    const loadClips = async (params = {}) => {
        try {
            setLoading(true);
            console.log('Chargement des clips...');

            // Construire les paramètres de requête en excluant les valeurs vides
            const queryParams = new URLSearchParams();

            if (searchTerm.trim()) {
                queryParams.append('search', searchTerm);
            }

            if (statusFilter !== 'all') {
                queryParams.append('status', statusFilter);
            }

            if (featuredFilter !== 'all') {
                queryParams.append('is_featured', featuredFilter);
            }

            if (dateFilter.from) {
                queryParams.append('date_from', dateFilter.from);
            }

            if (dateFilter.to) {
                queryParams.append('date_to', dateFilter.to);
            }

            queryParams.append('per_page', '20');

            // Ajouter les paramètres supplémentaires
            Object.entries(params).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                    queryParams.append(key, value);
                }
            });

            const url = `/api/admin/clips${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            console.log('URL de requête:', url);

            const response = await fetch(url, {
                headers: getAuthHeaders()
            });

            console.log('Response clips:', response.status, response.statusText);

            if (response.ok) {
                const data = await response.json();
                console.log('Data clips:', data);
                if (data.success) {
                    const clipsData = data.clips?.data || data.clips || [];
                    console.log('Clips trouvés:', clipsData.length);
                    setClips(clipsData);
                } else {
                    console.error('API returned success=false:', data.error);
                    toast.error(data.error || 'Erreur lors du chargement des clips');
                }
            } else {
                console.error('HTTP Error:', response.status);
                const errorText = await response.text();
                console.error('Error response:', errorText);
                toast.error('Erreur lors du chargement des clips');
            }
        } catch (error) {
            console.error('Erreur chargement clips:', error);
            toast.error('Erreur lors du chargement des clips');
        } finally {
            setLoading(false);
        }
    };

    const loadPendingClips = async () => {
        try {
            console.log('Chargement des clips en attente...');
            const response = await fetch('/api/admin/clips/pending', {
                headers: getAuthHeaders()
            });
            console.log('Response pending:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('Data pending:', data);
                setPendingClips(data.pending_clips || []);
            }
        } catch (error) {
            console.error('Erreur chargement clips en attente:', error);
        }
    };

    const loadAllData = async () => {
        await Promise.all([
            loadClipStats(),
            loadClips(),
            loadPendingClips()
        ]);
    };

    // Fonctions d'actions sur les clips
    const executeClipAction = async () => {
        if (!selectedClip) return;

        setProcessingAction(true);
        try {
            let url = '';
            let method = 'POST';
            let body = {};

            switch (actionType) {
                case 'approve':
                    url = `/api/admin/clips/${selectedClip.id}/approve`;
                    break;
                case 'reject':
                    url = `/api/admin/clips/${selectedClip.id}/reject`;
                    body = { reason: actionReason };
                    break;
                case 'delete':
                    url = `/api/admin/clips/${selectedClip.id}`;
                    method = 'DELETE';
                    break;
                case 'toggle_featured':
                    url = `/api/admin/clips/${selectedClip.id}/toggle-featured`;
                    break;
            }

            const response = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: Object.keys(body).length ? JSON.stringify(body) : undefined
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                closeActionModal();
                loadAllData();
            } else {
                toast.error(data.error || 'Erreur lors de l\'action');
            }
        } catch (error) {
            console.error('Erreur action clip:', error);
            toast.error('Erreur lors de l\'action');
        } finally {
            setProcessingAction(false);
        }
    };

    const executeBatchAction = async () => {
        if (selectedClips.length === 0) return;

        setProcessingBatch(true);
        try {
            const response = await fetch('/api/admin/clips/batch-action', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    action: batchAction,
                    clip_ids: selectedClips,
                    reason: batchReason
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                closeBatchModal();
                setSelectedClips([]);
                loadAllData();
            } else {
                toast.error(data.error || 'Erreur lors de l\'action en lot');
            }
        } catch (error) {
            console.error('Erreur action en lot:', error);
            toast.error('Erreur lors de l\'action en lot');
        } finally {
            setProcessingBatch(false);
        }
    };

    // Fonctions d'interface
    const openActionModal = (clip, action) => {
        setSelectedClip(clip);
        setActionType(action);
        setActionReason('');
        setShowActionModal(true);
    };

    const closeActionModal = () => {
        setShowActionModal(false);
        setSelectedClip(null);
        setActionType('');
        setActionReason('');
    };

    const openBatchModal = (action) => {
        setBatchAction(action);
        setBatchReason('');
        setShowBatchModal(true);
    };

    const closeBatchModal = () => {
        setShowBatchModal(false);
        setBatchAction('');
        setBatchReason('');
    };

    const openVideoModal = (clip) => {
        setSelectedClip(clip);
        setShowVideoModal(true);
    };

    const closeVideoModal = () => {
        setShowVideoModal(false);
        setSelectedClip(null);
        setCurrentlyPlaying(null);
        setIsPlaying(false);
    };

    // Fonctions utilitaires
    const formatDuration = (seconds) => {
        if (!seconds) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            published: { variant: 'success', text: 'Publié' },
            pending: { variant: 'warning', text: 'En attente' },
            draft: { variant: 'secondary', text: 'Brouillon' },
            rejected: { variant: 'danger', text: 'Rejeté' }
        };
        const config = statusConfig[status] || { variant: 'secondary', text: status };
        return <Badge bg={config.variant}>{config.text}</Badge>;
    };

    // Colonnes pour DataTable
    const clipColumns = [
        {
            name: 'Sélection',
            cell: (row) => (
                <Form.Check
                    type="checkbox"
                    checked={selectedClips.includes(row.id)}
                    onChange={(e) => {
                        if (e.target.checked) {
                            setSelectedClips([...selectedClips, row.id]);
                        } else {
                            setSelectedClips(selectedClips.filter(id => id !== row.id));
                        }
                    }}
                />
            ),
            width: '60px',
            ignoreRowClick: true
        },
        {
            name: 'Aperçu',
            cell: (row) => (
                <div className="clip-thumbnail">
                    {row.thumbnail_url ? (
                        <img
                            src={row.thumbnail_url}
                            alt={row.title}
                            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }}
                            onClick={() => openVideoModal(row)}
                            className="cursor-pointer"
                        />
                    ) : (
                        <div
                            className="bg-light d-flex align-items-center justify-content-center"
                            style={{ width: 60, height: 60, borderRadius: 8 }}
                            onClick={() => openVideoModal(row)}
                        >
                            <FontAwesomeIcon icon={faVideo} size="2x" className="text-muted" />
                        </div>
                    )}
                </div>
            ),
            width: '80px',
            ignoreRowClick: true
        },
        {
            name: 'Clip',
            cell: (row) => (
                <div>
                    <div className="fw-bold text-truncate" style={{ maxWidth: 200 }}>
                        {row.title}
                    </div>
                    <div className="text-muted small">
                        {row.user?.name || 'Utilisateur inconnu'}
                    </div>
                    <div className="text-muted small">
                        Durée: {formatDuration(row.duration)}
                    </div>
                </div>
            ),
            sortable: true,
            sortField: 'title'
        },
        {
            name: 'Statut',
            cell: (row) => (
                <div className="text-center">
                    {getStatusBadge(row.status)}
                    {row.is_featured && (
                        <div className="mt-1">
                            <Badge bg="info" className="small">
                                <FontAwesomeIcon icon={faStar} className="me-1" />
                                Vedette
                            </Badge>
                        </div>
                    )}
                </div>
            ),
            width: '120px'
        },
        {
            name: 'Engagement',
            cell: (row) => (
                <div className="small">
                    <div><FontAwesomeIcon icon={faEye} className="me-1" />{row.views_count || 0}</div>
                    <div><FontAwesomeIcon icon={faHeart} className="me-1" />{row.likes_count || 0}</div>
                    <div><FontAwesomeIcon icon={faComment} className="me-1" />{row.comments_count || 0}</div>
                </div>
            ),
            width: '100px'
        },
        {
            name: 'Date',
            cell: (row) => (
                <div className="small text-muted">
                    {row.formatted_created_at}
                </div>
            ),
            sortable: true,
            sortField: 'created_at',
            width: '120px'
        },
        {
            name: 'Actions',
            cell: (row) => (
                <div className="d-flex gap-1">
                    <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => openVideoModal(row)}
                        title="Voir"
                    >
                        <FontAwesomeIcon icon={faEye} />
                    </Button>

                    {row.status === 'pending' && (
                        <>
                            <Button
                                size="sm"
                                variant="outline-success"
                                onClick={() => openActionModal(row, 'approve')}
                                title="Approuver"
                            >
                                <FontAwesomeIcon icon={faCheck} />
                            </Button>
                            <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => openActionModal(row, 'reject')}
                                title="Rejeter"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </Button>
                        </>
                    )}

                    <Button
                        size="sm"
                        variant={row.is_featured ? "warning" : "outline-warning"}
                        onClick={() => openActionModal(row, 'toggle_featured')}
                        title={row.is_featured ? "Retirer de la vedette" : "Mettre en vedette"}
                    >
                        <FontAwesomeIcon icon={faStar} />
                    </Button>

                    <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => openActionModal(row, 'delete')}
                        title="Supprimer"
                    >
                        <FontAwesomeIcon icon={faTrash} />
                    </Button>
                </div>
            ),
            width: '200px',
            ignoreRowClick: true
        }
    ];

    // Chargement initial
    useEffect(() => {
        loadAllData();
    }, []);

    // Recharger les clips quand les filtres changent
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (activeTab === 'clips') {
                loadClips();
            }
        }, 500);

        return () => clearTimeout(timeout);
    }, [searchTerm, statusFilter, featuredFilter, dateFilter]);

    // Navigation tabs
    const navigationTabs = [
        { id: 'overview', label: 'Vue d\'ensemble', icon: faChartLine },
        { id: 'clips', label: 'Tous les clips', icon: faVideo },
        { id: 'pending', label: 'En attente', icon: faClock, count: pendingClips.length }
    ];

    return (
        <Container fluid>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-1">Gestion des Clips</h2>
                    <p className="text-muted mb-0">Administration des clips vidéo</p>
                </div>
                <Button variant="outline-primary" onClick={loadAllData} disabled={loading}>
                    <FontAwesomeIcon icon={faSync} className="me-2" />
                    Actualiser
                </Button>
            </div>

            {/* Navigation */}
            <Row className="mb-4">
                <Col>
                    <div className="d-flex gap-2">
                        {navigationTabs.map(tab => (
                            <Button
                                key={tab.id}
                                variant={activeTab === tab.id ? 'primary' : 'outline-primary'}
                                onClick={() => setActiveTab(tab.id)}
                                className="d-flex align-items-center gap-2"
                            >
                                <FontAwesomeIcon icon={tab.icon} />
                                {tab.label}
                                {tab.count !== undefined && (
                                    <Badge bg="light" text="dark">{tab.count}</Badge>
                                )}
                            </Button>
                        ))}
                    </div>
                </Col>
            </Row>

            {/* Contenu selon l'onglet actif */}
            {activeTab === 'overview' && (
                <Row className="g-4">
                    {/* Statistiques */}
                    <Col xl={3} lg={6}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <p className="text-muted mb-1 small">Total Clips</p>
                                        <h3 className="fw-bold mb-0">{clipStats.total_clips || 0}</h3>
                                    </div>
                                    <FontAwesomeIcon icon={faVideo} size="2x" className="text-primary" />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col xl={3} lg={6}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <p className="text-muted mb-1 small">Vues Totales</p>
                                        <h3 className="fw-bold mb-0">{(clipStats.total_views || 0).toLocaleString()}</h3>
                                    </div>
                                    <FontAwesomeIcon icon={faEye} size="2x" className="text-info" />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col xl={3} lg={6}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <p className="text-muted mb-1 small">En Attente</p>
                                        <h3 className="fw-bold mb-0">{clipStats.pending_clips || 0}</h3>
                                    </div>
                                    <FontAwesomeIcon icon={faClock} size="2x" className="text-warning" />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col xl={3} lg={6}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <p className="text-muted mb-1 small">En Vedette</p>
                                        <h3 className="fw-bold mb-0">{clipStats.featured_clips || 0}</h3>
                                    </div>
                                    <FontAwesomeIcon icon={faStar} size="2x" className="text-success" />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {activeTab === 'clips' && (
                <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-white">
                        <Row className="align-items-center">
                            <Col md={6}>
                                <div className="d-flex gap-2">
                                    <Form.Control
                                        type="text"
                                        placeholder="Rechercher clips..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ maxWidth: 250 }}
                                    />
                                    <Form.Select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        style={{ maxWidth: 150 }}
                                    >
                                        <option value="all">Tous statuts</option>
                                        <option value="published">Publié</option>
                                        <option value="pending">En attente</option>
                                        <option value="draft">Brouillon</option>
                                        <option value="rejected">Rejeté</option>
                                    </Form.Select>
                                </div>
                            </Col>
                            <Col md={6} className="text-end">
                                {selectedClips.length > 0 && (
                                    <div className="d-flex gap-2 justify-content-end">
                                        <span className="text-muted align-self-center">
                                            {selectedClips.length} sélectionné(s)
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="success"
                                            onClick={() => openBatchModal('approve')}
                                        >
                                            Approuver
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="danger"
                                            onClick={() => openBatchModal('reject')}
                                        >
                                            Rejeter
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline-danger"
                                            onClick={() => openBatchModal('delete')}
                                        >
                                            Supprimer
                                        </Button>
                                    </div>
                                )}
                            </Col>
                        </Row>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <DataTable
                            columns={clipColumns}
                            data={clips}
                            progressPending={loading}
                            progressComponent={<Spinner animation="border" />}
                            noDataComponent="Aucun clip trouvé"
                            pagination
                            paginationPerPage={15}
                            paginationRowsPerPageOptions={[10, 15, 25, 50]}
                            highlightOnHover
                            responsive
                            striped
                        />
                    </Card.Body>
                </Card>
            )}

            {activeTab === 'pending' && (
                <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-white">
                        <h5 className="mb-0">Clips en attente de modération</h5>
                    </Card.Header>
                    <Card.Body>
                        {pendingClips.length === 0 ? (
                            <div className="text-center py-5">
                                <FontAwesomeIcon icon={faCheck} size="3x" className="text-success mb-3" />
                                <h5>Aucun clip en attente</h5>
                                <p className="text-muted">Tous les clips ont été traités</p>
                            </div>
                        ) : (
                            <Row className="g-3">
                                {pendingClips.map(clip => (
                                    <Col md={6} lg={4} key={clip.id}>
                                        <Card className="h-100">
                                            <div className="position-relative">
                                                {clip.thumbnail_url ? (
                                                    <Card.Img
                                                        variant="top"
                                                        src={clip.thumbnail_url}
                                                        style={{ height: 200, objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <div
                                                        className="bg-light d-flex align-items-center justify-content-center"
                                                        style={{ height: 200 }}
                                                    >
                                                        <FontAwesomeIcon icon={faVideo} size="3x" className="text-muted" />
                                                    </div>
                                                )}
                                                <Badge bg="warning" className="position-absolute top-0 start-0 m-2">
                                                    {clip.days_pending} jour(s)
                                                </Badge>
                                            </div>
                                            <Card.Body>
                                                <Card.Title className="h6">{clip.title}</Card.Title>
                                                <Card.Text className="small text-muted">
                                                    Par: {clip.user?.name}<br/>
                                                    {clip.formatted_created_at}
                                                </Card.Text>
                                                <div className="d-flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="success"
                                                        onClick={() => openActionModal(clip, 'approve')}
                                                    >
                                                        <FontAwesomeIcon icon={faCheck} />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="danger"
                                                        onClick={() => openActionModal(clip, 'reject')}
                                                    >
                                                        <FontAwesomeIcon icon={faTimes} />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="info"
                                                        onClick={() => openVideoModal(clip)}
                                                    >
                                                        <FontAwesomeIcon icon={faEye} />
                                                    </Button>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        )}
                    </Card.Body>
                </Card>
            )}

            {/* Modal Action Unique */}
            <Modal show={showActionModal} onHide={closeActionModal}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {actionType === 'approve' && 'Approuver le clip'}
                        {actionType === 'reject' && 'Rejeter le clip'}
                        {actionType === 'delete' && 'Supprimer le clip'}
                        {actionType === 'toggle_featured' && 'Modifier la vedette'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedClip && (
                        <div>
                            <p><strong>Clip:</strong> {selectedClip.title}</p>
                            <p><strong>Artiste:</strong> {selectedClip.user?.name}</p>

                            {actionType === 'reject' && (
                                <Form.Group className="mt-3">
                                    <Form.Label>Raison du rejet *</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={actionReason}
                                        onChange={(e) => setActionReason(e.target.value)}
                                        placeholder="Expliquez pourquoi ce clip est rejeté..."
                                        required
                                    />
                                </Form.Group>
                            )}

                            {actionType === 'delete' && (
                                <Alert variant="danger">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                                    Cette action est irréversible. Le clip et ses fichiers seront définitivement supprimés.
                                </Alert>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeActionModal}>
                        Annuler
                    </Button>
                    <Button
                        variant={actionType === 'delete' ? 'danger' : 'primary'}
                        onClick={executeClipAction}
                        disabled={processingAction || (actionType === 'reject' && !actionReason.trim())}
                    >
                        {processingAction && <FontAwesomeIcon icon={faSpinner} spin className="me-2" />}
                        Confirmer
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal Action en Lot */}
            <Modal show={showBatchModal} onHide={closeBatchModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Action en lot sur {selectedClips.length} clip(s)</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {batchAction === 'reject' && (
                        <Form.Group>
                            <Form.Label>Raison du rejet *</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={batchReason}
                                onChange={(e) => setBatchReason(e.target.value)}
                                placeholder="Expliquez pourquoi ces clips sont rejetés..."
                                required
                            />
                        </Form.Group>
                    )}

                    {batchAction === 'delete' && (
                        <Alert variant="danger">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                            Cette action supprimera définitivement {selectedClips.length} clip(s) et leurs fichiers.
                        </Alert>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeBatchModal}>
                        Annuler
                    </Button>
                    <Button
                        variant={batchAction === 'delete' ? 'danger' : 'primary'}
                        onClick={executeBatchAction}
                        disabled={processingBatch || (batchAction === 'reject' && !batchReason.trim())}
                    >
                        {processingBatch && <FontAwesomeIcon icon={faSpinner} spin className="me-2" />}
                        Confirmer
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal Vidéo */}
            <Modal show={showVideoModal} onHide={closeVideoModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{selectedClip?.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedClip && selectedClip.video_url && (
                        <div className="text-center">
                            <video
                                controls
                                style={{ width: '100%', maxHeight: '400px' }}
                                poster={selectedClip.thumbnail_url}
                            >
                                <source src={selectedClip.video_url} type="video/mp4" />
                                Votre navigateur ne supporte pas la lecture vidéo.
                            </video>

                            <div className="mt-3 text-start">
                                <p><strong>Description:</strong> {selectedClip.description || 'Aucune description'}</p>
                                <p><strong>Durée:</strong> {formatDuration(selectedClip.duration)}</p>
                                <p><strong>Vues:</strong> {selectedClip.views_count || 0}</p>
                                <p><strong>Likes:</strong> {selectedClip.likes_count || 0}</p>
                                <p><strong>Commentaires:</strong> {selectedClip.comments_count || 0}</p>
                            </div>
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default ClipManagement;
