import React, { useState, useEffect } from 'react';
import {
    Container,
    Row,
    Col,
    Card,
    Table,
    Button,
    Modal,
    Form,
    Badge,
    Spinner,
    Alert,
    InputGroup,
    Tooltip,
    OverlayTrigger
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus,
    faEdit,
    faTrash,
    faEye,
    faEyeSlash,
    faSearch,
    faMusic,
    faSave,
    faTimes,
    faHeart,
    faMicrophone,
    faDrum,
    faHeartbeat,
    faHandsPraying,
    faBolt,
    faUsers,
    faSmile,
    faFire,
    faCloud,
    faLeaf,
    faImage,
    faPalette
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const CategoryManagement = () => {
    const { user, isAdmin } = useAuth();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#8b5cf6',
        icon: 'faMusic',
        image: null,
        is_active: true,
        sort_order: 0
    });

    const [formErrors, setFormErrors] = useState({});

    // Icônes disponibles
    const availableIcons = [
        { value: 'faMusic', label: 'Musique', icon: faMusic },
        { value: 'faHeart', label: 'Cœur', icon: faHeart },
        { value: 'faMicrophone', label: 'Microphone', icon: faMicrophone },
        { value: 'faDrum', label: 'Batterie', icon: faDrum },
        { value: 'faHeartbeat', label: 'Rythme cardiaque', icon: faHeartbeat },
        { value: 'faHandsPraying', label: 'Prière', icon: faHandsPraying },
        { value: 'faBolt', label: 'Éclair', icon: faBolt },
        { value: 'faUsers', label: 'Danse', icon: faUsers },
        { value: 'faSmile', label: 'Baiser', icon: faSmile },
        { value: 'faFire', label: 'Feu', icon: faFire },
        { value: 'faCloud', label: 'Nuage', icon: faCloud },
        { value: 'faLeaf', label: 'Feuille', icon: faLeaf }
    ];

    useEffect(() => {
        if (!isAdmin()) {
            setError('Accès refusé. Privilèges administrateur requis.');
            return;
        }
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/categories');

            if (response.data.success) {
                setCategories(response.data.categories);
            } else {
                setError('Erreur lors du chargement des catégories');
            }
        } catch (err) {
            console.error('Erreur lors du chargement des catégories:', err);
            setError('Impossible de charger les catégories');
        } finally {
            setLoading(false);
        }
    };

    const handleShowModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description || '',
                color: category.color,
                icon: category.icon,
                image: null,
                is_active: category.is_active,
                sort_order: category.sort_order
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                description: '',
                color: '#8b5cf6',
                icon: 'faMusic',
                image: null,
                is_active: true,
                sort_order: categories.length
            });
        }
        setFormErrors({});
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCategory(null);
        setFormData({
            name: '',
            description: '',
            color: '#8b5cf6',
            icon: 'faMusic',
            image: null,
            is_active: true,
            sort_order: 0
        });
        setFormErrors({});
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked, files } = e.target;

        if (type === 'file') {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        } else if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Clear error when user starts typing
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        setFormErrors({});

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('color', formData.color);
            formDataToSend.append('icon', formData.icon);
            formDataToSend.append('is_active', formData.is_active ? '1' : '0');
            formDataToSend.append('sort_order', formData.sort_order);

            if (formData.image) {
                formDataToSend.append('image', formData.image);
            }

            let response;
            if (editingCategory) {
                response = await axios.post(`/api/categories/${editingCategory.id}`, formDataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    params: { '_method': 'PUT' }
                });
            } else {
                response = await axios.post('/api/categories', formDataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            if (response.data.success) {
                setSuccess(response.data.message);
                handleCloseModal();
                fetchCategories();

                // Clear success message after 3 seconds
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            if (err.response?.data?.errors) {
                setFormErrors(err.response.data.errors);
            } else {
                setFormErrors({
                    general: err.response?.data?.message || 'Une erreur est survenue'
                });
            }
        } finally {
            setModalLoading(false);
        }
    };

    const handleToggleStatus = async (category) => {
        try {
            const response = await axios.post(`/api/categories/${category.id}/toggle-status`);

            if (response.data.success) {
                setSuccess(response.data.message);
                fetchCategories();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la mise à jour du statut');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleDelete = async (category) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?`)) {
            return;
        }

        try {
            const response = await axios.delete(`/api/categories/${category.id}`);

            if (response.data.success) {
                setSuccess(response.data.message);
                fetchCategories();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la suppression');
            setTimeout(() => setError(''), 3000);
        }
    };

    // Filter categories based on search term
    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isAdmin()) {
        return (
            <Container className="py-4">
                <Alert variant="danger">
                    <FontAwesomeIcon icon={faTimes} className="me-2" />
                    Accès refusé. Privilèges administrateur requis.
                </Alert>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4">
            <Row>
                <Col>
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h2 className="fw-bold mb-1">Gestion des Catégories</h2>
                            <p className="text-muted mb-0">Gérez les catégories musicales de votre plateforme</p>
                        </div>
                        <Button
                            variant="primary"
                            onClick={() => handleShowModal()}
                            className="d-flex align-items-center"
                        >
                            <FontAwesomeIcon icon={faPlus} className="me-2" />
                            Nouvelle Catégorie
                        </Button>
                    </div>

                    {/* Messages */}
                    {success && (
                        <Alert variant="success" dismissible onClose={() => setSuccess('')}>
                            {success}
                        </Alert>
                    )}

                    {error && (
                        <Alert variant="danger" dismissible onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    {/* Search */}
                    <Card className="mb-4">
                        <Card.Body>
                            <Row>
                                <Col md={6}>
                                    <InputGroup>
                                        <InputGroup.Text>
                                            <FontAwesomeIcon icon={faSearch} />
                                        </InputGroup.Text>
                                        <Form.Control
                                            type="text"
                                            placeholder="Rechercher une catégorie..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </InputGroup>
                                </Col>
                                <Col md={6} className="text-md-end">
                                    <Badge bg="primary" className="fs-6">
                                        {filteredCategories.length} catégorie(s)
                                    </Badge>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Categories Table */}
                    <Card>
                        <Card.Body>
                            {loading ? (
                                <div className="text-center py-4">
                                    <Spinner animation="border" variant="primary" />
                                    <p className="mt-2 text-muted">Chargement des catégories...</p>
                                </div>
                            ) : (
                                <Table responsive hover>
                                    <thead className="table-light">
                                        <tr>
                                            <th>Nom</th>
                                            <th>Description</th>
                                            <th>Couleur</th>
                                            <th>Icône</th>
                                            <th>Statut</th>
                                            <th>Ordre</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCategories.map(category => (
                                            <tr key={category.id}>
                                                <td>
                                                    <div className="fw-medium">{category.name}</div>
                                                    <small className="text-muted">ID: {category.id}</small>
                                                </td>
                                                <td>
                                                    <div className="text-truncate" style={{ maxWidth: '200px' }}>
                                                        {category.description || '-'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div
                                                            className="rounded me-2"
                                                            style={{
                                                                width: '20px',
                                                                height: '20px',
                                                                backgroundColor: category.color
                                                            }}
                                                        ></div>
                                                        <small>{category.color}</small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <FontAwesomeIcon
                                                        icon={availableIcons.find(i => i.value === category.icon)?.icon || faMusic}
                                                        style={{ color: category.color }}
                                                    />
                                                </td>
                                                <td>
                                                    <Badge bg={category.is_active ? 'success' : 'secondary'}>
                                                        {category.is_active ? 'Actif' : 'Inactif'}
                                                    </Badge>
                                                </td>
                                                <td>{category.sort_order}</td>
                                                <td>
                                                    <div className="d-flex gap-1">
                                                        <OverlayTrigger
                                                            overlay={<Tooltip>Modifier</Tooltip>}
                                                        >
                                                            <Button
                                                                variant="outline-primary"
                                                                size="sm"
                                                                onClick={() => handleShowModal(category)}
                                                            >
                                                                <FontAwesomeIcon icon={faEdit} />
                                                            </Button>
                                                        </OverlayTrigger>

                                                        <OverlayTrigger
                                                            overlay={<Tooltip>{category.is_active ? 'Désactiver' : 'Activer'}</Tooltip>}
                                                        >
                                                            <Button
                                                                variant={category.is_active ? 'outline-warning' : 'outline-success'}
                                                                size="sm"
                                                                onClick={() => handleToggleStatus(category)}
                                                            >
                                                                <FontAwesomeIcon icon={category.is_active ? faEyeSlash : faEye} />
                                                            </Button>
                                                        </OverlayTrigger>

                                                        <OverlayTrigger
                                                            overlay={<Tooltip>Supprimer</Tooltip>}
                                                        >
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                onClick={() => handleDelete(category)}
                                                            >
                                                                <FontAwesomeIcon icon={faTrash} />
                                                            </Button>
                                                        </OverlayTrigger>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}

                            {!loading && filteredCategories.length === 0 && (
                                <div className="text-center py-4">
                                    <FontAwesomeIcon icon={faMusic} size="3x" className="text-muted mb-3" />
                                    <h5 className="text-muted">Aucune catégorie trouvée</h5>
                                    <p className="text-muted">
                                        {searchTerm ? 'Essayez de modifier votre recherche' : 'Commencez par créer votre première catégorie'}
                                    </p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Modal pour créer/modifier une catégorie */}
            <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>
                            {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                        </Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        {formErrors.general && (
                            <Alert variant="danger">{formErrors.general}</Alert>
                        )}

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Nom *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        isInvalid={!!formErrors.name}
                                        placeholder="Nom de la catégorie"
                                        required
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {formErrors.name?.[0]}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Ordre d'affichage</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="sort_order"
                                        value={formData.sort_order}
                                        onChange={handleInputChange}
                                        min="0"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                isInvalid={!!formErrors.description}
                                placeholder="Description de la catégorie"
                            />
                            <Form.Control.Feedback type="invalid">
                                {formErrors.description?.[0]}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <FontAwesomeIcon icon={faPalette} className="me-2" />
                                        Couleur
                                    </Form.Label>
                                    <div className="d-flex align-items-center">
                                        <Form.Control
                                            type="color"
                                            name="color"
                                            value={formData.color}
                                            onChange={handleInputChange}
                                            style={{ width: '60px', height: '40px' }}
                                            className="me-2"
                                        />
                                        <Form.Control
                                            type="text"
                                            name="color"
                                            value={formData.color}
                                            onChange={handleInputChange}
                                            placeholder="#8b5cf6"
                                        />
                                    </div>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Icône</Form.Label>
                                    <Form.Select
                                        name="icon"
                                        value={formData.icon}
                                        onChange={handleInputChange}
                                    >
                                        {availableIcons.map(iconOption => (
                                            <option key={iconOption.value} value={iconOption.value}>
                                                {iconOption.label}
                                            </option>
                                        ))}
                                    </Form.Select>
                                    <div className="mt-2">
                                        <FontAwesomeIcon
                                            icon={availableIcons.find(i => i.value === formData.icon)?.icon || faMusic}
                                            style={{ color: formData.color, fontSize: '24px' }}
                                        />
                                    </div>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>
                                <FontAwesomeIcon icon={faImage} className="me-2" />
                                Image (optionnel)
                            </Form.Label>
                            <Form.Control
                                type="file"
                                name="image"
                                onChange={handleInputChange}
                                accept="image/*"
                                isInvalid={!!formErrors.image}
                            />
                            <Form.Text className="text-muted">
                                Formats acceptés: JPG, PNG, SVG (max 2MB)
                            </Form.Text>
                            <Form.Control.Feedback type="invalid">
                                {formErrors.image?.[0]}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleInputChange}
                                label="Catégorie active"
                            />
                        </Form.Group>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={modalLoading}
                        >
                            {modalLoading ? (
                                <>
                                    <Spinner size="sm" className="me-2" />
                                    {editingCategory ? 'Modification...' : 'Création...'}
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faSave} className="me-2" />
                                    {editingCategory ? 'Modifier' : 'Créer'}
                                </>
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default CategoryManagement;
