import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEuroSign, faCreditCard, faChartLine, faUsers, faDownload, faArrowUp,
    faArrowDown, faCheck, faTimes, faSpinner, faSearch, faFilter, faSync,
    faExclamationTriangle, faInfoCircle, faFileDownload, faPrint, faTrophy
} from '@fortawesome/free-solid-svg-icons';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import ChartJS, {
    defaultChartOptions,
    lineChartOptions,
    doughnutChartOptions,
    generateColors
} from '../../utils/chartConfig';
import DataTable from 'react-data-table-component';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const PaymentManagement = () => {
    const { user, getAuthHeaders } = useAuth();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [paymentStats, setPaymentStats] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [artistRevenues, setArtistRevenues] = useState([]);
    const [selectedTransactions, setSelectedTransactions] = useState([]);
    const [filters, setFilters] = useState({
        status: 'all',
        search: '',
        date_from: '',
        date_to: '',
        payment_method: 'all'
    });

    // Modals
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [batchAction, setBatchAction] = useState('');
    const [actionReason, setActionReason] = useState('');
    const [refundAmount, setRefundAmount] = useState('');

    useEffect(() => {
        loadPaymentData();
    }, []);

    const loadPaymentData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadPaymentStats(),
                loadTransactions(),
                loadArtistRevenues()
            ]);
        } catch (error) {
            console.error('Erreur chargement paiements:', error);
            toast.error('Erreur lors du chargement des données de paiement');
        } finally {
            setLoading(false);
        }
    };

    const loadPaymentStats = async () => {
        try {
            const response = await fetch('/api/admin/payments/stats', {
                headers: getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                setPaymentStats(data);
            }
        } catch (error) {
            console.error('Erreur stats paiements:', error);
        }
    };

    const loadTransactions = async () => {
        try {
            const params = new URLSearchParams(filters);
            const response = await fetch(`/api/admin/payments/transactions?${params}`, {
                headers: getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                setTransactions(data.transactions.data || data.transactions);
            }
        } catch (error) {
            console.error('Erreur transactions:', error);
        }
    };

    const loadArtistRevenues = async () => {
        try {
            const response = await fetch('/api/admin/payments/artist-revenues', {
                headers: getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                setArtistRevenues(data.artist_revenues);
            }
        } catch (error) {
            console.error('Erreur revenus artistes:', error);
        }
    };

    const handleTransactionAction = async (action, transactionId, additionalData = {}) => {
        try {
            const response = await fetch(`/api/admin/payments/transactions/${transactionId}/${action}`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(additionalData)
            });

            const data = await response.json();
            if (data.success) {
                toast.success(data.message);
                loadTransactions();
                closeModals();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            console.error(`Erreur ${action}:`, error);
            toast.error(`Erreur lors de l'action ${action}`);
        }
    };

    const handleBatchAction = async () => {
        if (selectedTransactions.length === 0) {
            toast.error('Veuillez sélectionner au moins une transaction');
            return;
        }

        try {
            const response = await fetch('/api/admin/payments/batch-action', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    action: batchAction,
                    transaction_ids: selectedTransactions,
                    reason: actionReason
                })
            });

            const data = await response.json();
            if (data.success) {
                toast.success(data.message);
                setSelectedTransactions([]);
                loadTransactions();
                closeModals();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            console.error('Erreur action en lot:', error);
            toast.error('Erreur lors de l\'action en lot');
        }
    };

    const closeModals = () => {
        setShowApprovalModal(false);
        setShowRejectionModal(false);
        setShowRefundModal(false);
        setSelectedTransaction(null);
        setActionReason('');
        setRefundAmount('');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'success';
            case 'pending': return 'warning';
            case 'failed': return 'danger';
            default: return 'secondary';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'completed': return 'Terminé';
            case 'pending': return 'En attente';
            case 'failed': return 'Échoué';
            default: return status;
        }
    };

    // Configuration des colonnes DataTable
    const transactionColumns = [
        {
            name: '',
            selector: row => row.id,
            cell: row => (
                <Form.Check
                    type="checkbox"
                    checked={selectedTransactions.includes(row.id)}
                    onChange={(e) => {
                        if (e.target.checked) {
                            setSelectedTransactions([...selectedTransactions, row.id]);
                        } else {
                            setSelectedTransactions(selectedTransactions.filter(id => id !== row.id));
                        }
                    }}
                />
            ),
            width: '50px'
        },
        {
            name: 'ID Transaction',
            selector: row => row.id,
            sortable: true,
            width: '150px'
        },
        {
            name: 'Son',
            selector: row => row.sound_title,
            sortable: true,
        },
        {
            name: 'Artiste',
            selector: row => row.artist,
            sortable: true,
        },
        {
            name: 'Montant',
            selector: row => row.amount,
            format: row => `${row.amount} FCFA`,
            sortable: true,
            width: '100px'
        },
        {
            name: 'Statut',
            selector: row => row.status,
            format: row => (
                <Badge bg={getStatusColor(row.status)}>
                    {getStatusLabel(row.status)}
                </Badge>
            ),
            sortable: true,
            width: '120px'
        },
        {
            name: 'Date',
            selector: row => row.formatted_date,
            sortable: true,
            width: '120px'
        },
        {
            name: 'Actions',
            cell: row => (
                <div className="d-flex gap-1">
                    {row.status === 'pending' && (
                        <>
                            <Button
                                size="sm"
                                variant="success"
                                onClick={() => {
                                    setSelectedTransaction(row);
                                    setShowApprovalModal(true);
                                }}
                            >
                                <FontAwesomeIcon icon={faCheck} />
                            </Button>
                            <Button
                                size="sm"
                                variant="danger"
                                onClick={() => {
                                    setSelectedTransaction(row);
                                    setShowRejectionModal(true);
                                }}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </Button>
                        </>
                    )}
                    {row.status === 'completed' && (
                        <Button
                            size="sm"
                            variant="warning"
                            onClick={() => {
                                setSelectedTransaction(row);
                                setRefundAmount(row.amount.toString());
                                setShowRefundModal(true);
                            }}
                        >
                            Rembourser
                        </Button>
                    )}
                </div>
            ),
            width: '150px'
        }
    ];

    const artistRevenueColumns = [
        {
            name: 'Artiste',
            selector: row => row.name,
            sortable: true,
        },
        {
            name: 'Sons payants',
            selector: row => row.paid_sounds,
            sortable: true,
            width: '120px'
        },
        {
            name: 'Ventes totales',
            selector: row => row.total_sales,
            sortable: true,
            width: '130px'
        },
        {
            name: 'Revenus totaux',
            selector: row => row.total_revenue,
            format: row => `${row.total_revenue} FCFA`,
            sortable: true,
            width: '140px'
        },
        {
            name: 'Moy. par son',
            selector: row => row.avg_revenue_per_sound,
            format: row => `${row.avg_revenue_per_sound} FCFA`,
            sortable: true,
            width: '120px'
        },
        {
            name: 'Membre depuis',
            selector: row => row.member_since,
            sortable: true,
            width: '130px'
        }
    ];

    if (loading) {
        return (
            <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <div className="text-center">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Chargement des paiements...</p>
                </div>
            </Container>
        );
    }

    return (
        <Container fluid>
            <Row className="mb-4">
                <Col>
                    <h2><FontAwesomeIcon icon={faEuroSign} className="me-2" />Gestion des Paiements</h2>
                    <p className="text-muted">Suivi des transactions et revenus</p>
                </Col>
            </Row>

            {/* Onglets */}
            <Row className="mb-4">
                <Col>
                    <div className="nav nav-tabs">
                        <button
                            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            <FontAwesomeIcon icon={faChartLine} className="me-1" />
                            Vue d'ensemble
                        </button>
                        <button
                            className={`nav-link ${activeTab === 'transactions' ? 'active' : ''}`}
                            onClick={() => setActiveTab('transactions')}
                        >
                            <FontAwesomeIcon icon={faCreditCard} className="me-1" />
                            Transactions
                        </button>
                        <button
                            className={`nav-link ${activeTab === 'artists' ? 'active' : ''}`}
                            onClick={() => setActiveTab('artists')}
                        >
                            <FontAwesomeIcon icon={faUsers} className="me-1" />
                            Revenus Artistes
                        </button>
                    </div>
                </Col>
            </Row>

            {/* Vue d'ensemble */}
            {activeTab === 'overview' && paymentStats && (
                <>
                    {/* Métriques principales */}
                    <Row className="mb-4">
                        <Col lg={3} md={6} className="mb-3">
                            <Card className="h-100 border-0 shadow-sm">
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <h6 className="text-muted mb-1">Revenus totaux</h6>
                                            <h3 className="mb-0">{paymentStats.stats.total_revenue.toLocaleString()} FCFA</h3>
                                            <small className="text-success">
                                                <FontAwesomeIcon icon={faArrowUp} className="me-1" />
                                                Transactions: {paymentStats.stats.total_transactions}
                                            </small>
                                        </div>
                                        <div className="text-success">
                                            <FontAwesomeIcon icon={faEuroSign} size="2x" />
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={3} md={6} className="mb-3">
                            <Card className="h-100 border-0 shadow-sm">
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <h6 className="text-muted mb-1">Paiements terminés</h6>
                                            <h3 className="mb-0">{paymentStats.stats.completed_payments.toLocaleString()}</h3>
                                            <small className="text-muted">
                                                Taux de succès: {paymentStats.stats.conversion_rate}%
                                            </small>
                                        </div>
                                        <div className="text-success">
                                            <FontAwesomeIcon icon={faCheck} size="2x" />
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={3} md={6} className="mb-3">
                            <Card className="h-100 border-0 shadow-sm">
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <h6 className="text-muted mb-1">En attente</h6>
                                            <h3 className="mb-0">{paymentStats.stats.pending_payments.toLocaleString()} FCFA</h3>
                                            <small className="text-warning">
                                                <FontAwesomeIcon icon={faSpinner} className="me-1" />
                                                Nécessite action
                                            </small>
                                        </div>
                                        <div className="text-warning">
                                            <FontAwesomeIcon icon={faSpinner} size="2x" />
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={3} md={6} className="mb-3">
                            <Card className="h-100 border-0 shadow-sm">
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <h6 className="text-muted mb-1">Moy. transaction</h6>
                                            <h3 className="mb-0">{paymentStats.stats.avg_transaction_value} FCFA</h3>
                                            <small className="text-muted">
                                                Par transaction
                                            </small>
                                        </div>
                                        <div className="text-info">
                                            <FontAwesomeIcon icon={faChartLine} size="2x" />
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Graphiques */}
                    <Row className="mb-4">
                        <Col lg={8}>
                            <Card className="border-0 shadow-sm">
                                <Card.Header>
                                    <h5 className="mb-0">Évolution des revenus (7 derniers jours)</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Line
                                        data={{
                                            labels: paymentStats.daily_revenue.map(day => day.label),
                                            datasets: [
                                                {
                                                    label: 'Revenus (FCFA)',
                                                    data: paymentStats.daily_revenue.map(day => day.revenue),
                                                    borderColor: '#28a745',
                                                    backgroundColor: '#28a74520',
                                                    tension: 0.4,
                                                },
                                                {
                                                    label: 'Transactions',
                                                    data: paymentStats.daily_revenue.map(day => day.transactions),
                                                    borderColor: '#007bff',
                                                    backgroundColor: '#007bff20',
                                                    tension: 0.4,
                                                    yAxisID: 'y1',
                                                }
                                            ],
                                        }}
                                        options={{
                                            responsive: true,
                                            scales: {
                                                y: {
                                                    type: 'linear',
                                                    display: true,
                                                    position: 'left',
                                                },
                                                y1: {
                                                    type: 'linear',
                                                    display: true,
                                                    position: 'right',
                                                    grid: {
                                                        drawOnChartArea: false,
                                                    },
                                                },
                                            },
                                        }}
                                    />
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={4}>
                            <Card className="border-0 shadow-sm">
                                <Card.Header>
                                    <h5 className="mb-0">Méthodes de paiement</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Doughnut
                                        data={{
                                            labels: Object.values(paymentStats.payment_methods).map(method => method.label),
                                            datasets: [
                                                {
                                                    data: Object.values(paymentStats.payment_methods).map(method => method.count),
                                                    backgroundColor: ['#007bff', '#28a745', '#ffc107'],
                                                },
                                            ],
                                        }}
                                    />
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Top sons générateurs de revenus */}
                    <Row>
                        <Col>
                            <Card className="border-0 shadow-sm">
                                <Card.Header>
                                    <h5 className="mb-0">
                                        <FontAwesomeIcon icon={faTrophy} className="me-2 text-warning" />
                                        Top Sons Générateurs de Revenus
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="row">
                                        {paymentStats.top_revenue_sounds.slice(0, 6).map((sound, index) => (
                                            <div key={sound.id} className="col-lg-4 col-md-6 mb-3">
                                                <div className="d-flex align-items-center p-3 bg-light rounded">
                                                    <Badge bg="primary" className="me-3">#{index + 1}</Badge>
                                                    <div className="flex-grow-1">
                                                        <h6 className="mb-1">{sound.title}</h6>
                                                        <small className="text-muted">par {sound.artist}</small>
                                                        <div className="mt-1">
                                                            <Badge bg="success" className="me-2">{sound.estimated_revenue} FCFA</Badge>
                                                            <Badge bg="info">{sound.estimated_sales} ventes</Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </>
            )}

            {/* Onglet Transactions */}
            {activeTab === 'transactions' && (
                <Row>
                    <Col>
                        <Card className="border-0 shadow-sm">
                            <Card.Header>
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">Transactions</h5>
                                    <div className="d-flex gap-2">
                                        {selectedTransactions.length > 0 && (
                                            <div className="d-flex gap-2">
                                                <Button
                                                    variant="success"
                                                    size="sm"
                                                    onClick={() => {
                                                        setBatchAction('approve');
                                                        setShowApprovalModal(true);
                                                    }}
                                                >
                                                    Approuver ({selectedTransactions.length})
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => {
                                                        setBatchAction('reject');
                                                        setShowRejectionModal(true);
                                                    }}
                                                >
                                                    Rejeter ({selectedTransactions.length})
                                                </Button>
                                            </div>
                                        )}
                                        <Button variant="outline-primary" size="sm" onClick={loadTransactions}>
                                            <FontAwesomeIcon icon={faSync} />
                                        </Button>
                                    </div>
                                </div>
                            </Card.Header>
                            <Card.Body>
                                {/* Filtres */}
                                <Row className="mb-3">
                                    <Col md={3}>
                                        <Form.Select
                                            size="sm"
                                            value={filters.status}
                                            onChange={(e) => setFilters({...filters, status: e.target.value})}
                                        >
                                            <option value="all">Tous les statuts</option>
                                            <option value="completed">Terminés</option>
                                            <option value="pending">En attente</option>
                                            <option value="failed">Échoués</option>
                                        </Form.Select>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Control
                                            type="text"
                                            size="sm"
                                            placeholder="Rechercher..."
                                            value={filters.search}
                                            onChange={(e) => setFilters({...filters, search: e.target.value})}
                                        />
                                    </Col>
                                    <Col md={2}>
                                        <Form.Control
                                            type="date"
                                            size="sm"
                                            value={filters.date_from}
                                            onChange={(e) => setFilters({...filters, date_from: e.target.value})}
                                        />
                                    </Col>
                                    <Col md={2}>
                                        <Form.Control
                                            type="date"
                                            size="sm"
                                            value={filters.date_to}
                                            onChange={(e) => setFilters({...filters, date_to: e.target.value})}
                                        />
                                    </Col>
                                    <Col md={2}>
                                        <Button size="sm" onClick={loadTransactions}>
                                            <FontAwesomeIcon icon={faSearch} className="me-1" />
                                            Filtrer
                                        </Button>
                                    </Col>
                                </Row>

                                <DataTable
                                    columns={transactionColumns}
                                    data={transactions}
                                    pagination
                                    paginationPerPage={15}
                                    selectableRows={false}
                                    noDataComponent="Aucune transaction trouvée"
                                    highlightOnHover
                                    responsive
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Onglet Revenus Artistes */}
            {activeTab === 'artists' && (
                <Row>
                    <Col>
                        <Card className="border-0 shadow-sm">
                            <Card.Header>
                                <h5 className="mb-0">Revenus par Artiste</h5>
                            </Card.Header>
                            <Card.Body>
                                <DataTable
                                    columns={artistRevenueColumns}
                                    data={artistRevenues}
                                    pagination
                                    paginationPerPage={15}
                                    noDataComponent="Aucun revenu d'artiste trouvé"
                                    highlightOnHover
                                    responsive
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Modals pour les actions */}
            <Modal show={showApprovalModal} onHide={closeModals}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirmer l'approbation</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="info">
                        <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                        Êtes-vous sûr de vouloir approuver {selectedTransaction ? 'cette transaction' : `${selectedTransactions.length} transaction(s)`} ?
                    </Alert>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeModals}>Annuler</Button>
                    <Button
                        variant="success"
                        onClick={() => selectedTransaction ?
                            handleTransactionAction('approve', selectedTransaction.id) :
                            handleBatchAction()
                        }
                    >
                        Approuver
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showRejectionModal} onHide={closeModals}>
                <Modal.Header closeButton>
                    <Modal.Title>Rejeter la transaction</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Raison du rejet *</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={actionReason}
                            onChange={(e) => setActionReason(e.target.value)}
                            placeholder="Expliquez la raison du rejet..."
                            required
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeModals}>Annuler</Button>
                    <Button
                        variant="danger"
                        onClick={() => selectedTransaction ?
                            handleTransactionAction('reject', selectedTransaction.id, { reason: actionReason }) :
                            handleBatchAction()
                        }
                        disabled={!actionReason.trim()}
                    >
                        Rejeter
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showRefundModal} onHide={closeModals}>
                <Modal.Header closeButton>
                    <Modal.Title>Rembourser la transaction</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Montant du remboursement *</Form.Label>
                        <Form.Control
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={refundAmount}
                            onChange={(e) => setRefundAmount(e.target.value)}
                            placeholder="0.00"
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Raison du remboursement *</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={actionReason}
                            onChange={(e) => setActionReason(e.target.value)}
                            placeholder="Expliquez la raison du remboursement..."
                            required
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeModals}>Annuler</Button>
                    <Button
                        variant="warning"
                        onClick={() => handleTransactionAction('refund', selectedTransaction.id, {
                            amount: parseFloat(refundAmount),
                            reason: actionReason
                        })}
                        disabled={!actionReason.trim() || !refundAmount || parseFloat(refundAmount) <= 0}
                    >
                        Rembourser
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default PaymentManagement;
