import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChartLine, faUsers, faMusic, faVideo, faCalendarAlt, faEye, faHeart,
    faDownload, faArrowUp, faArrowDown, faTrophy, faSpinner, faStar,
    faUserPlus, faChartBar, faPercent, faCrown, faGlobe
} from '@fortawesome/free-solid-svg-icons';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import ChartJS, {
    defaultChartOptions,
    lineChartOptions,
    doughnutChartOptions,
    generateColors
} from '../../utils/chartConfig';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import DataTable from 'react-data-table-component';

const Analytics = () => {
    const { user, getAuthHeaders } = useAuth();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('global');
    const [globalData, setGlobalData] = useState(null);
    const [userAnalytics, setUserAnalytics] = useState(null);
    const [contentAnalytics, setContentAnalytics] = useState(null);
    const [trendsData, setTrendsData] = useState(null);
    const [trendsConfig, setTrendsConfig] = useState({ period: 30, type: 'users' });

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadGlobalAnalytics(),
                loadUserAnalytics(),
                loadContentAnalytics(),
                loadTrends()
            ]);
        } catch (error) {
            console.error('Erreur chargement analytics:', error);
            toast.error('Erreur lors du chargement des analytics');
        } finally {
            setLoading(false);
        }
    };

    const loadGlobalAnalytics = async () => {
        try {
            const response = await fetch('/api/admin/analytics/global', {
                headers: getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                setGlobalData(data);
            }
        } catch (error) {
            console.error('Erreur analytics globales:', error);
        }
    };

    const loadUserAnalytics = async () => {
        try {
            const response = await fetch('/api/admin/analytics/users', {
                headers: getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                setUserAnalytics(data);
            }
        } catch (error) {
            console.error('Erreur analytics utilisateurs:', error);
        }
    };

    const loadContentAnalytics = async () => {
        try {
            const response = await fetch('/api/admin/analytics/content', {
                headers: getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                setContentAnalytics(data);
            }
        } catch (error) {
            console.error('Erreur analytics contenus:', error);
        }
    };

    const loadTrends = async (config = trendsConfig) => {
        try {
            const params = new URLSearchParams(config);
            const response = await fetch(`/api/admin/analytics/trends?${params}`, {
                headers: getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                setTrendsData(data);
            }
        } catch (error) {
            console.error('Erreur trends:', error);
        }
    };

    const handleTrendsConfigChange = (field, value) => {
        const newConfig = { ...trendsConfig, [field]: value };
        setTrendsConfig(newConfig);
        loadTrends(newConfig);
    };

    const getLineChartData = (data, label, color = '#3b82f6') => {
        if (!data) return { labels: [], datasets: [] };

        return {
            labels: data.map(item => item.label),
            datasets: [
                {
                    label,
                    data: data.map(item => item.count || item.new_users || item.revenue),
                    borderColor: color,
                    backgroundColor: color + '20',
                    tension: 0.4,
                    fill: true,
                },
            ],
        };
    };

    const getDoughnutData = (data) => {
        if (!data) return { labels: [], datasets: [] };

        const keys = Object.keys(data);
        const colors = generateColors(keys.length);

        return {
            labels: keys.map(key =>
                key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')
            ),
            datasets: [
                {
                    data: Object.values(data),
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff',
                },
            ],
        };
    };

    // Colonnes pour les tables
    const topArtistsColumns = [
        {
            name: 'Artiste',
            selector: row => row.name,
            sortable: true,
        },
        {
            name: 'Sons',
            selector: row => row.sounds_count,
            sortable: true,
        },
        {
            name: 'Clips',
            selector: row => row.clips_count,
            sortable: true,
        },
        {
            name: 'Total',
            selector: row => row.total_content,
            sortable: true,
        },
        {
            name: 'Membre depuis',
            selector: row => row.created_at,
            format: row => new Date(row.created_at).toLocaleDateString('fr-FR'),
            sortable: true,
        },
    ];

    const activeUsersColumns = [
        {
            name: 'Utilisateur',
            selector: row => row.name,
        },
        {
            name: 'Email',
            selector: row => row.email,
        },
        {
            name: 'Rôle',
            selector: row => row.role,
            format: row => (
                <Badge bg={row.role === 'admin' ? 'danger' : row.role === 'artist' ? 'primary' : 'secondary'}>
                    {row.role}
                </Badge>
            ),
        },
        {
            name: 'Dernière connexion',
            selector: row => row.last_login,
        },
    ];

    if (loading) {
        return (
            <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <div className="text-center">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Chargement des analytics...</p>
                </div>
            </Container>
        );
    }

    return (
        <Container fluid>
            <Row className="mb-4">
                <Col>
                    <h2><FontAwesomeIcon icon={faChartLine} className="me-2" />Analytics</h2>
                    <p className="text-muted">Tableaux de bord et métriques détaillées</p>
                </Col>
            </Row>

            {/* Onglets */}
            <Row className="mb-4">
                <Col>
                    <div className="nav nav-tabs">
                        <button
                            className={`nav-link ${activeTab === 'global' ? 'active' : ''}`}
                            onClick={() => setActiveTab('global')}
                        >
                            <FontAwesomeIcon icon={faGlobe} className="me-1" />
                            Vue d'ensemble
                        </button>
                        <button
                            className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            <FontAwesomeIcon icon={faUsers} className="me-1" />
                            Utilisateurs
                        </button>
                        <button
                            className={`nav-link ${activeTab === 'content' ? 'active' : ''}`}
                            onClick={() => setActiveTab('content')}
                        >
                            <FontAwesomeIcon icon={faMusic} className="me-1" />
                            Contenus
                        </button>
                        <button
                            className={`nav-link ${activeTab === 'trends' ? 'active' : ''}`}
                            onClick={() => setActiveTab('trends')}
                        >
                            <FontAwesomeIcon icon={faChartBar} className="me-1" />
                            Tendances
                        </button>
                    </div>
                </Col>
            </Row>

            {/* Vue d'ensemble */}
            {activeTab === 'global' && globalData && (
                <>
                    {/* Métriques globales */}
                    <Row className="mb-4">
                        <Col lg={3} md={6} className="mb-3">
                            <Card className="h-100 border-0 shadow-sm">
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <h6 className="text-muted mb-1">Utilisateurs</h6>
                                            <h3 className="mb-0">{globalData.global_metrics.total_users.toLocaleString()}</h3>
                                            <small className="text-success">
                                                <FontAwesomeIcon icon={faArrowUp} className="me-1" />
                                                +{globalData.growth_metrics.new_users_this_week} cette semaine
                                            </small>
                                        </div>
                                        <div className="text-primary">
                                            <FontAwesomeIcon icon={faUsers} size="2x" />
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
                                            <h6 className="text-muted mb-1">Sons</h6>
                                            <h3 className="mb-0">{globalData.global_metrics.total_sounds.toLocaleString()}</h3>
                                            <small className="text-success">
                                                <FontAwesomeIcon icon={faArrowUp} className="me-1" />
                                                +{globalData.growth_metrics.content_this_week.sounds} cette semaine
                                            </small>
                                        </div>
                                        <div className="text-success">
                                            <FontAwesomeIcon icon={faMusic} size="2x" />
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
                                            <h6 className="text-muted mb-1">Clips</h6>
                                            <h3 className="mb-0">{globalData.global_metrics.total_clips.toLocaleString()}</h3>
                                            <small className="text-success">
                                                <FontAwesomeIcon icon={faArrowUp} className="me-1" />
                                                +{globalData.growth_metrics.content_this_week.clips} cette semaine
                                            </small>
                                        </div>
                                        <div className="text-info">
                                            <FontAwesomeIcon icon={faVideo} size="2x" />
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
                                            <h6 className="text-muted mb-1">Vues totales</h6>
                                            <h3 className="mb-0">{globalData.global_metrics.total_views.toLocaleString()}</h3>
                                            <small className="text-muted">
                                                <FontAwesomeIcon icon={faEye} className="me-1" />
                                                Tous contenus
                                            </small>
                                        </div>
                                        <div className="text-warning">
                                            <FontAwesomeIcon icon={faEye} size="2x" />
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
                                    <h5 className="mb-0">Activité des 7 derniers jours</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Line
                                        data={{
                                            labels: globalData.daily_stats.map(day => day.label),
                                            datasets: [
                                                {
                                                    label: 'Nouveaux utilisateurs',
                                                    data: globalData.daily_stats.map(day => day.new_users),
                                                    borderColor: '#007bff',
                                                    backgroundColor: '#007bff20',
                                                },
                                                {
                                                    label: 'Nouveaux sons',
                                                    data: globalData.daily_stats.map(day => day.new_sounds),
                                                    borderColor: '#28a745',
                                                    backgroundColor: '#28a74520',
                                                },
                                                {
                                                    label: 'Nouveaux clips',
                                                    data: globalData.daily_stats.map(day => day.new_clips),
                                                    borderColor: '#ffc107',
                                                    backgroundColor: '#ffc10720',
                                                },
                                            ],
                                        }}
                                        options={defaultChartOptions}
                                    />
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={4}>
                            <Card className="border-0 shadow-sm">
                                <Card.Header>
                                    <h5 className="mb-0">Répartition utilisateurs</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Doughnut data={getDoughnutData(globalData.user_distribution)} />
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Top performers */}
                    <Row>
                        <Col lg={6}>
                            <Card className="border-0 shadow-sm">
                                <Card.Header>
                                    <h5 className="mb-0">
                                        <FontAwesomeIcon icon={faTrophy} className="me-2 text-warning" />
                                        Top Sons (cette semaine)
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    {globalData.top_performers.sounds.map((sound, index) => (
                                        <div key={sound.id} className="d-flex align-items-center mb-3">
                                            <Badge bg="primary" className="me-3">#{index + 1}</Badge>
                                            <div className="flex-grow-1">
                                                <h6 className="mb-1">{sound.title}</h6>
                                                <small className="text-muted">par {sound.artist}</small>
                                            </div>
                                            <div className="text-end">
                                                <div><FontAwesomeIcon icon={faPlay} className="me-1" />{sound.plays}</div>
                                                <div><FontAwesomeIcon icon={faHeart} className="me-1" />{sound.likes}</div>
                                            </div>
                                        </div>
                                    ))}
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={6}>
                            <Card className="border-0 shadow-sm">
                                <Card.Header>
                                    <h5 className="mb-0">
                                        <FontAwesomeIcon icon={faTrophy} className="me-2 text-warning" />
                                        Top Clips (cette semaine)
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    {globalData.top_performers.clips.map((clip, index) => (
                                        <div key={clip.id} className="d-flex align-items-center mb-3">
                                            <Badge bg="info" className="me-3">#{index + 1}</Badge>
                                            <div className="flex-grow-1">
                                                <h6 className="mb-1">{clip.title}</h6>
                                                <small className="text-muted">par {clip.artist}</small>
                                            </div>
                                            <div className="text-end">
                                                <div><FontAwesomeIcon icon={faEye} className="me-1" />{clip.views}</div>
                                                <div><FontAwesomeIcon icon={faHeart} className="me-1" />{clip.likes}</div>
                                            </div>
                                        </div>
                                    ))}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </>
            )}

            {/* Onglet Utilisateurs */}
            {activeTab === 'users' && userAnalytics && (
                <Row>
                    <Col lg={6} className="mb-4">
                        <Card className="border-0 shadow-sm">
                            <Card.Header>
                                <h5 className="mb-0">Top Artistes par activité</h5>
                            </Card.Header>
                            <Card.Body>
                                <DataTable
                                    columns={topArtistsColumns}
                                    data={userAnalytics.top_artists}
                                    pagination
                                    paginationPerPage={10}
                                    noDataComponent="Aucun artiste trouvé"
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={6} className="mb-4">
                        <Card className="border-0 shadow-sm">
                            <Card.Header>
                                <h5 className="mb-0">Utilisateurs actifs</h5>
                            </Card.Header>
                            <Card.Body>
                                <DataTable
                                    columns={activeUsersColumns}
                                    data={userAnalytics.active_users}
                                    pagination
                                    paginationPerPage={10}
                                    noDataComponent="Aucun utilisateur trouvé"
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Onglet Contenus */}
            {activeTab === 'content' && contentAnalytics && (
                <Row>
                    <Col lg={6} className="mb-4">
                        <Card className="border-0 shadow-sm">
                            <Card.Header>
                                <h5 className="mb-0">Sons les plus performants</h5>
                            </Card.Header>
                            <Card.Body>
                                {contentAnalytics.top_sounds.map((sound, index) => (
                                    <div key={sound.id} className="d-flex align-items-center mb-3 p-3 bg-light rounded">
                                        <Badge bg="primary" className="me-3">#{index + 1}</Badge>
                                        <div className="flex-grow-1">
                                            <h6 className="mb-1">{sound.title}</h6>
                                            <small className="text-muted">par {sound.artist}</small>
                                            <div className="mt-1">
                                                <Badge bg="success" className="me-2">{sound.plays_count} écoutes</Badge>
                                                <Badge bg="danger" className="me-2">{sound.likes_count} likes</Badge>
                                                <Badge bg="info">{sound.engagement_rate}% engagement</Badge>
                                            </div>
                                        </div>
                                        <div className="text-end">
                                            <h6 className="mb-0">{sound.price}€</h6>
                                            <small className="text-muted">{sound.is_free ? 'Gratuit' : 'Payant'}</small>
                                        </div>
                                    </div>
                                ))}
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={6} className="mb-4">
                        <Card className="border-0 shadow-sm">
                            <Card.Header>
                                <h5 className="mb-0">Clips les plus vus</h5>
                            </Card.Header>
                            <Card.Body>
                                {contentAnalytics.top_clips.map((clip, index) => (
                                    <div key={clip.id} className="d-flex align-items-center mb-3 p-3 bg-light rounded">
                                        <Badge bg="info" className="me-3">#{index + 1}</Badge>
                                        <div className="flex-grow-1">
                                            <h6 className="mb-1">{clip.title}</h6>
                                            <small className="text-muted">par {clip.artist}</small>
                                            <div className="mt-1">
                                                <Badge bg="warning" className="me-2">{clip.views} vues</Badge>
                                                <Badge bg="danger" className="me-2">{clip.likes} likes</Badge>
                                                <Badge bg="secondary">{clip.engagement_rate}% engagement</Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Onglet Tendances */}
            {activeTab === 'trends' && (
                <Row>
                    <Col>
                        <Card className="border-0 shadow-sm">
                            <Card.Header>
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">Tendances</h5>
                                    <div className="d-flex gap-3">
                                        <Form.Select
                                            size="sm"
                                            value={trendsConfig.type}
                                            onChange={(e) => handleTrendsConfigChange('type', e.target.value)}
                                        >
                                            <option value="users">Utilisateurs</option>
                                            <option value="sounds">Sons</option>
                                            <option value="clips">Clips</option>
                                            <option value="events">Événements</option>
                                        </Form.Select>
                                        <Form.Select
                                            size="sm"
                                            value={trendsConfig.period}
                                            onChange={(e) => handleTrendsConfigChange('period', parseInt(e.target.value))}
                                        >
                                            <option value={7}>7 jours</option>
                                            <option value={30}>30 jours</option>
                                            <option value={90}>90 jours</option>
                                        </Form.Select>
                                    </div>
                                </div>
                            </Card.Header>
                            <Card.Body>
                                {trendsData && (
                                    <Line
                                        data={getLineChartData(
                                            trendsData.trends,
                                            `Nouveaux ${trendsConfig.type}`,
                                            '#007bff'
                                        )}
                                        options={defaultChartOptions}
                                    />
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}
        </Container>
    );
};

export default Analytics;
