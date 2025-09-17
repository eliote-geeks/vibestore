import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Form, Alert, ProgressBar, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faAward, faMedal, faTrophy, faGem, faStar, faDownload, faMusic,
    faEye, faHeart, faPlay, faUser, faCalendarAlt, faSearch, faFilter,
    faSync, faFileDownload, faPrint, faChartLine, faCrown, faPercent,
    faArrowUp, faSpinner, faCheck, faCertificate, faGlobe
} from '@fortawesome/free-solid-svg-icons';
import DataTable from 'react-data-table-component';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const CertificationManagement = () => {
    const { token } = useAuth();

    // États pour les données
    const [certificationData, setCertificationData] = useState([]);
    const [certificationStats, setCertificationStats] = useState({});
    const [topSounds, setTopSounds] = useState([]);
    const [certificationThresholds, setCertificationThresholds] = useState({});

    // États pour l'interface
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    // États pour les filtres
    const [searchTerm, setSearchTerm] = useState('');
    const [certificationFilter, setCertificationFilter] = useState('all');
    const [artistFilter, setArtistFilter] = useState('');

    // États pour les modals
    const [showCertificateModal, setShowCertificateModal] = useState(false);
    const [showArtistModal, setShowArtistModal] = useState(false);
    const [selectedSound, setSelectedSound] = useState(null);
    const [selectedArtist, setSelectedArtist] = useState(null);
    const [artistCertifications, setArtistCertifications] = useState([]);
    const [generatingCertificate, setGeneratingCertificate] = useState(false);

    // Fonctions de chargement des données
    const loadCertificationStats = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/certifications/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setCertificationData(data.sounds || []);
                setCertificationStats(data.stats || {});
                setTopSounds(data.top_sounds || []);
                setCertificationThresholds(data.thresholds || {});
            } else {
                toast.error('Erreur lors du chargement des certifications');
            }
        } catch (error) {
            console.error('Erreur chargement certifications:', error);
            toast.error('Erreur lors du chargement des certifications');
        } finally {
            setLoading(false);
        }
    };

    const loadArtistCertifications = async (userId) => {
        try {
            const response = await fetch(`/api/admin/certifications/artist/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setArtistCertifications(data.sounds || []);
                setSelectedArtist(data.artist);
            } else {
                toast.error('Erreur lors du chargement des certifications de l\'artiste');
            }
        } catch (error) {
            console.error('Erreur chargement certifications artiste:', error);
            toast.error('Erreur lors du chargement des certifications de l\'artiste');
        }
    };

    // Fonctions pour les certificats
    const generateCertificate = async (soundId, format = 'web') => {
        try {
            setGeneratingCertificate(true);
            const response = await fetch(`/api/admin/certifications/${soundId}/certificate?format=${format}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                if (format === 'pdf') {
                    // Télécharger le PDF
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `certificat-${soundId}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    toast.success('Certificat téléchargé avec succès');
                } else {
                    const data = await response.json();
                    // Afficher les données du certificat dans un modal
                    setSelectedSound({...selectedSound, certificate_data: data.certificate_data});
                }
            } else {
                const error = await response.json();
                toast.error(error.error || 'Erreur lors de la génération du certificat');
            }
        } catch (error) {
            console.error('Erreur génération certificat:', error);
            toast.error('Erreur lors de la génération du certificat');
        } finally {
            setGeneratingCertificate(false);
        }
    };

    // Fonctions d'interface
    const openCertificateModal = (sound) => {
        setSelectedSound(sound);
        setShowCertificateModal(true);
    };

    const closeCertificateModal = () => {
        setShowCertificateModal(false);
        setSelectedSound(null);
    };

    const openArtistModal = (userId) => {
        loadArtistCertifications(userId);
        setShowArtistModal(true);
    };

    const closeArtistModal = () => {
        setShowArtistModal(false);
        setSelectedArtist(null);
        setArtistCertifications([]);
    };

    // Fonctions utilitaires
    const getCertificationIcon = (certification) => {
        const icons = {
            bronze: '🥉',
            silver: '🥈',
            gold: '🥇',
            platinum: '🏆',
            diamond: '💎'
        };
        return icons[certification] || '';
    };

    const getCertificationColor = (certification) => {
        const colors = {
            bronze: '#CD7F32',
            silver: '#C0C0C0',
            gold: '#FFD700',
            platinum: '#E5E4E2',
            diamond: '#B9F2FF'
        };
        return colors[certification] || '#6c757d';
    };

    const getCertificationLabel = (certification) => {
        const labels = {
            bronze: 'Disque de Bronze',
            silver: 'Disque d\'Argent',
            gold: 'Disque d\'Or',
            platinum: 'Disque de Platine',
            diamond: 'Disque de Diamant'
        };
        return labels[certification] || 'Aucune certification';
    };

    const formatNumber = (number) => {
        return new Intl.NumberFormat('fr-FR').format(number);
    };

    // Filtrer les données
    const getFilteredData = () => {
        return certificationData.filter(sound => {
            const matchesSearch = sound.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  sound.artist.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCertification = certificationFilter === 'all' ||
                                        sound.certification === certificationFilter ||
                                        (certificationFilter === 'certified' && sound.has_certification) ||
                                        (certificationFilter === 'uncertified' && !sound.has_certification);
            const matchesArtist = !artistFilter || sound.artist.toLowerCase().includes(artistFilter.toLowerCase());

            return matchesSearch && matchesCertification && matchesArtist;
        });
    };

    // Colonnes pour DataTable
    const certificationColumns = [
        {
            name: 'Son',
            cell: (row) => (
                <div>
                    <div className="fw-bold text-truncate" style={{ maxWidth: 200 }}>
                        {row.title}
                    </div>
                    <div className="text-muted small">
                        <FontAwesomeIcon icon={faUser} className="me-1" />
                        {row.artist}
                    </div>
                    <div className="text-muted small">
                        {row.is_free ? 'Gratuit' : `${formatNumber(row.price || 0)} XAF`}
                    </div>
                </div>
            ),
            sortable: true,
            sortField: 'title',
            minWidth: '250px'
        },
        {
            name: 'Certification',
            cell: (row) => (
                <div className="text-center">
                    {row.has_certification ? (
                        <div>
                            <Badge
                                bg="warning"
                                style={{
                                    backgroundColor: getCertificationColor(row.certification),
                                    border: 'none',
                                    fontSize: '12px'
                                }}
                            >
                                {getCertificationIcon(row.certification)} {getCertificationLabel(row.certification)}
                            </Badge>
                            <div className="small text-muted mt-1">
                                Seuil: {formatNumber(row.threshold_current)}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <Badge bg="secondary">Aucune</Badge>
                            <div className="small text-muted mt-1">
                                Prochain: {row.next_level_label}
                            </div>
                            <ProgressBar
                                now={row.progress_to_next}
                                size="sm"
                                className="mt-1"
                                style={{ height: '4px' }}
                            />
                            <div className="small text-muted">
                                {row.progress_to_next.toFixed(1)}%
                            </div>
                        </div>
                    )}
                </div>
            ),
            width: '200px'
        },
        {
            name: 'Métriques',
            cell: (row) => (
                <div className="small">
                    <div>
                        <FontAwesomeIcon icon={row.is_free ? faDownload : faMusic} className="me-1" />
                        <strong>{formatNumber(row.metric_value)}</strong> {row.is_free ? 'téléchargements' : 'ventes'}
                    </div>
                    <div className="text-muted">
                        <FontAwesomeIcon icon={faEye} className="me-1" />
                        {formatNumber(row.plays_count)} écoutes
                    </div>
                    <div className="text-muted">
                        <FontAwesomeIcon icon={faHeart} className="me-1" />
                        {formatNumber(row.likes_count)} likes
                    </div>
                </div>
            ),
            width: '150px'
        },
        {
            name: 'Progrès',
            cell: (row) => (
                <div>
                    {row.next_level ? (
                        <div>
                            <div className="small text-muted mb-1">
                                Vers: {row.next_level_label}
                            </div>
                            <ProgressBar
                                now={row.progress_to_next}
                                variant="info"
                                style={{ height: '8px' }}
                            />
                            <div className="small text-muted mt-1">
                                {formatNumber(row.metric_value)} / {formatNumber(row.threshold_next)}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <Badge bg="success">
                                <FontAwesomeIcon icon={faCrown} className="me-1" />
                                Niveau Maximum
                            </Badge>
                        </div>
                    )}
                </div>
            ),
            width: '180px'
        },
        {
            name: 'Actions',
            cell: (row) => (
                <div className="d-flex gap-1">
                    <Button
                        size="sm"
                        variant="outline-info"
                        onClick={() => openArtistModal(row.user_id)}
                        title="Voir toutes les certifications de l'artiste"
                    >
                        <FontAwesomeIcon icon={faUser} />
                    </Button>

                    {row.can_generate_certificate && (
                        <Button
                            size="sm"
                            variant="outline-success"
                            onClick={() => openCertificateModal(row)}
                            title="Générer certificat"
                        >
                            <FontAwesomeIcon icon={faCertificate} />
                        </Button>
                    )}
                </div>
            ),
            width: '100px',
            ignoreRowClick: true
        }
    ];

    // Chargement initial
    useEffect(() => {
        loadCertificationStats();
    }, []);

    // Recharger quand les filtres changent
    useEffect(() => {
        const timeout = setTimeout(() => {
            // Les données sont déjà chargées, on filtre côté client
        }, 300);

        return () => clearTimeout(timeout);
    }, [searchTerm, certificationFilter, artistFilter]);

    // Navigation tabs
    const navigationTabs = [
        { id: 'overview', label: 'Vue d\'ensemble', icon: faChartLine },
        { id: 'certifications', label: 'Certifications', icon: faAward },
        { id: 'top-sounds', label: 'Top Sons', icon: faTrophy }
    ];

    return (
        <Container fluid>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-1">Gestion des Certifications</h2>
                    <p className="text-muted mb-0">Disques d'or, argent, platine et diamant</p>
                </div>
                <Button variant="outline-primary" onClick={loadCertificationStats} disabled={loading}>
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
                            </Button>
                        ))}
                    </div>
                </Col>
            </Row>

            {/* Vue d'ensemble */}
            {activeTab === 'overview' && (
                <div>
                    <Row className="g-4 mb-4">
                        <Col xl={2} lg={4} md={6}>
                            <Card className="border-0 shadow-sm h-100">
                                <Card.Body className="text-center">
                                    <div className="mb-2">🥉</div>
                                    <h4 className="fw-bold" style={{ color: '#CD7F32' }}>
                                        {certificationStats.certification_counts?.bronze || 0}
                                    </h4>
                                    <p className="text-muted mb-0 small">Disques de Bronze</p>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col xl={2} lg={4} md={6}>
                            <Card className="border-0 shadow-sm h-100">
                                <Card.Body className="text-center">
                                    <div className="mb-2">🥈</div>
                                    <h4 className="fw-bold" style={{ color: '#C0C0C0' }}>
                                        {certificationStats.certification_counts?.silver || 0}
                                    </h4>
                                    <p className="text-muted mb-0 small">Disques d'Argent</p>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col xl={2} lg={4} md={6}>
                            <Card className="border-0 shadow-sm h-100">
                                <Card.Body className="text-center">
                                    <div className="mb-2">🥇</div>
                                    <h4 className="fw-bold" style={{ color: '#FFD700' }}>
                                        {certificationStats.certification_counts?.gold || 0}
                                    </h4>
                                    <p className="text-muted mb-0 small">Disques d'Or</p>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col xl={2} lg={4} md={6}>
                            <Card className="border-0 shadow-sm h-100">
                                <Card.Body className="text-center">
                                    <div className="mb-2">🏆</div>
                                    <h4 className="fw-bold" style={{ color: '#E5E4E2' }}>
                                        {certificationStats.certification_counts?.platinum || 0}
                                    </h4>
                                    <p className="text-muted mb-0 small">Disques de Platine</p>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col xl={2} lg={4} md={6}>
                            <Card className="border-0 shadow-sm h-100">
                                <Card.Body className="text-center">
                                    <div className="mb-2">💎</div>
                                    <h4 className="fw-bold" style={{ color: '#B9F2FF' }}>
                                        {certificationStats.certification_counts?.diamond || 0}
                                    </h4>
                                    <p className="text-muted mb-0 small">Disques de Diamant</p>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col xl={2} lg={4} md={6}>
                            <Card className="border-0 shadow-sm h-100">
                                <Card.Body className="text-center">
                                    <FontAwesomeIcon icon={faPercent} size="2x" className="text-info mb-2" />
                                    <h4 className="fw-bold text-info">
                                        {certificationStats.certification_rate || 0}%
                                    </h4>
                                    <p className="text-muted mb-0 small">Taux de Certification</p>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Seuils de certification */}
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Header className="bg-white">
                            <h5 className="mb-0">Seuils de Certification</h5>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                {Object.entries(certificationThresholds).map(([level, threshold]) => (
                                    <Col md={2} key={level} className="text-center mb-3">
                                        <div className="p-3 border rounded">
                                            <div className="mb-2">{getCertificationIcon(level)}</div>
                                            <div className="fw-bold">{getCertificationLabel(level)}</div>
                                            <div className="text-muted small">
                                                {formatNumber(threshold)} ventes/téléchargements
                                            </div>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        </Card.Body>
                    </Card>
                </div>
            )}

            {/* Liste des certifications */}
            {activeTab === 'certifications' && (
                <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-white">
                        <Row className="align-items-center">
                            <Col md={8}>
                                <div className="d-flex gap-2">
                                    <Form.Control
                                        type="text"
                                        placeholder="Rechercher sons ou artistes..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ maxWidth: 250 }}
                                    />
                                    <Form.Select
                                        value={certificationFilter}
                                        onChange={(e) => setCertificationFilter(e.target.value)}
                                        style={{ maxWidth: 200 }}
                                    >
                                        <option value="all">Toutes certifications</option>
                                        <option value="certified">Certifiés</option>
                                        <option value="uncertified">Non certifiés</option>
                                        <option value="bronze">Bronze</option>
                                        <option value="silver">Argent</option>
                                        <option value="gold">Or</option>
                                        <option value="platinum">Platine</option>
                                        <option value="diamond">Diamant</option>
                                    </Form.Select>
                                </div>
                            </Col>
                            <Col md={4} className="text-end">
                                <span className="text-muted">
                                    {getFilteredData().length} son(s) affiché(s)
                                </span>
                            </Col>
                        </Row>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <DataTable
                            columns={certificationColumns}
                            data={getFilteredData()}
                            progressPending={loading}
                            progressComponent={<Spinner animation="border" />}
                            noDataComponent="Aucun son trouvé"
                            pagination
                            paginationPerPage={20}
                            paginationRowsPerPageOptions={[10, 20, 50, 100]}
                            highlightOnHover
                            responsive
                            striped
                            defaultSortFieldId={1}
                        />
                    </Card.Body>
                </Card>
            )}

            {/* Top Sons */}
            {activeTab === 'top-sounds' && (
                <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-white">
                        <h5 className="mb-0">Top 10 des Sons Certifiés</h5>
                    </Card.Header>
                    <Card.Body>
                        {topSounds.length === 0 ? (
                            <div className="text-center py-5">
                                <FontAwesomeIcon icon={faTrophy} size="3x" className="text-muted mb-3" />
                                <h5>Aucun son certifié</h5>
                                <p className="text-muted">Les sons certifiés apparaîtront ici</p>
                            </div>
                        ) : (
                            <Row className="g-3">
                                {topSounds.map((sound, index) => (
                                    <Col md={6} lg={4} key={sound.id}>
                                        <Card className="h-100">
                                            <Card.Body>
                                                <div className="d-flex align-items-start mb-3">
                                                    <Badge bg="primary" className="me-2">#{index + 1}</Badge>
                                                    <Badge
                                                        style={{
                                                            backgroundColor: getCertificationColor(sound.certification),
                                                            border: 'none'
                                                        }}
                                                    >
                                                        {getCertificationIcon(sound.certification)} {sound.certification_label}
                                                    </Badge>
                                                </div>
                                                <h6 className="fw-bold">{sound.title}</h6>
                                                <p className="text-muted small mb-2">
                                                    <FontAwesomeIcon icon={faUser} className="me-1" />
                                                    {sound.artist}
                                                </p>
                                                <div className="small text-muted">
                                                    <div>
                                                        <FontAwesomeIcon icon={sound.is_free ? faDownload : faMusic} className="me-1" />
                                                        {formatNumber(sound.metric_value)} {sound.is_free ? 'téléchargements' : 'ventes'}
                                                    </div>
                                                    <div>
                                                        <FontAwesomeIcon icon={faEye} className="me-1" />
                                                        {formatNumber(sound.plays_count)} écoutes
                                                    </div>
                                                    <div>
                                                        <FontAwesomeIcon icon={faHeart} className="me-1" />
                                                        {formatNumber(sound.likes_count)} likes
                                                    </div>
                                                </div>
                                                <div className="mt-3">
                                                    <Button
                                                        size="sm"
                                                        variant="outline-success"
                                                        onClick={() => openCertificateModal(sound)}
                                                        className="w-100"
                                                    >
                                                        <FontAwesomeIcon icon={faCertificate} className="me-1" />
                                                        Certificat
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

            {/* Modal Certificat */}
            <Modal show={showCertificateModal} onHide={closeCertificateModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FontAwesomeIcon icon={faCertificate} className="me-2" />
                        Certificat - {selectedSound?.title}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedSound && (
                        <div>
                            <div className="text-center mb-4">
                                <div className="mb-3">
                                    <span style={{ fontSize: '4rem' }}>
                                        {getCertificationIcon(selectedSound.certification)}
                                    </span>
                                </div>
                                <h4 style={{ color: getCertificationColor(selectedSound.certification) }}>
                                    {getCertificationLabel(selectedSound.certification)}
                                </h4>
                                <h5>"{selectedSound.title}"</h5>
                                <p className="text-muted">par {selectedSound.artist}</p>
                            </div>

                            <Row className="text-center">
                                <Col md={4}>
                                    <div className="border rounded p-3">
                                        <div className="fw-bold text-primary h4">
                                            {formatNumber(selectedSound.metric_value)}
                                        </div>
                                        <div className="small text-muted">
                                            {selectedSound.is_free ? 'Téléchargements' : 'Ventes'}
                                        </div>
                                    </div>
                                </Col>
                                <Col md={4}>
                                    <div className="border rounded p-3">
                                        <div className="fw-bold text-info h4">
                                            {formatNumber(selectedSound.plays_count)}
                                        </div>
                                        <div className="small text-muted">Écoutes</div>
                                    </div>
                                </Col>
                                <Col md={4}>
                                    <div className="border rounded p-3">
                                        <div className="fw-bold text-danger h4">
                                            {formatNumber(selectedSound.likes_count)}
                                        </div>
                                        <div className="small text-muted">Likes</div>
                                    </div>
                                </Col>
                            </Row>

                            <Alert variant="success" className="mt-4">
                                <FontAwesomeIcon icon={faCheck} className="me-2" />
                                Ce son a dépassé le seuil de <strong>{formatNumber(selectedSound.threshold_current)}</strong> {selectedSound.is_free ? 'téléchargements' : 'ventes'}
                                requis pour obtenir le {getCertificationLabel(selectedSound.certification)}.
                            </Alert>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeCertificateModal}>
                        Fermer
                    </Button>
                    <Button
                        variant="info"
                        onClick={() => generateCertificate(selectedSound?.id, 'web')}
                        disabled={generatingCertificate}
                    >
                        <FontAwesomeIcon icon={faEye} className="me-2" />
                        Aperçu
                    </Button>
                    <Button
                        variant="success"
                        onClick={() => generateCertificate(selectedSound?.id, 'pdf')}
                        disabled={generatingCertificate}
                    >
                        {generatingCertificate && <FontAwesomeIcon icon={faSpinner} spin className="me-2" />}
                        <FontAwesomeIcon icon={faFileDownload} className="me-2" />
                        Télécharger PDF
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal Artiste */}
            <Modal show={showArtistModal} onHide={closeArtistModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FontAwesomeIcon icon={faUser} className="me-2" />
                        Certifications - {selectedArtist?.name}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {artistCertifications.length === 0 ? (
                        <div className="text-center py-4">
                            <FontAwesomeIcon icon={faAward} size="3x" className="text-muted mb-3" />
                            <h5>Aucune certification</h5>
                            <p className="text-muted">Cet artiste n'a pas encore de sons certifiés</p>
                        </div>
                    ) : (
                        <div>
                            <Row className="g-3">
                                {artistCertifications.map(sound => (
                                    <Col md={6} key={sound.id}>
                                        <Card className="h-100">
                                            <Card.Body>
                                                <div className="d-flex align-items-center mb-2">
                                                    <Badge
                                                        style={{
                                                            backgroundColor: sound.certification_color,
                                                            border: 'none'
                                                        }}
                                                        className="me-2"
                                                    >
                                                        {getCertificationIcon(sound.certification)} {sound.certification_label}
                                                    </Badge>
                                                </div>
                                                <h6 className="fw-bold">{sound.title}</h6>
                                                <div className="small text-muted">
                                                    <FontAwesomeIcon icon={faDownload} className="me-1" />
                                                    {formatNumber(sound.metric_value)} ventes/téléchargements
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeArtistModal}>
                        Fermer
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default CertificationManagement;
