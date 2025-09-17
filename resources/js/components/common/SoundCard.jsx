import React, { useState } from 'react';
import { Card, Button, Badge, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHeart,
    faShoppingCart,
    faEye,
    faPlay,
    faPause,
    faHeadphones,
    faDownload
} from '@fortawesome/free-solid-svg-icons';
import AudioPlayer from './AudioPlayer';
import SoundDetailsModal from './SoundDetailsModal';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const SoundCard = ({
    sound,
    onLike,
    onAddToCart,
    isCompact = false,
    showPreview = true
}) => {
    const [showModal, setShowModal] = useState(false);
    const [isLiked, setIsLiked] = useState(sound.isLiked || false);
    const { addToCart, isInCart } = useCart();
    const toast = useToast();
    const { token } = useAuth();

    const handleLike = () => {
        if (!token) {
            toast.warning(
                'Connexion requise',
                'Vous devez être connecté pour aimer un son'
            );
            return;
        }

        const newLikedState = !isLiked;
        setIsLiked(newLikedState);
        if (onLike) {
            onLike(sound.id, newLikedState);
        }
    };

    const handleViewMore = () => {
        setShowModal(true);
    };

    const handleAddToCart = () => {
        if (!token) {
            toast.warning(
                'Connexion requise',
                'Vous devez être connecté pour ajouter des articles au panier'
            );
            return;
        }

        if (sound.is_free || sound.price === 0) {
            toast.info('Son gratuit', 'Ce son est gratuit, vous pouvez le télécharger directement');
            return;
        }

        if (isInCart(sound.id, 'sound')) {
            toast.info('Déjà dans le panier', 'Ce son est déjà présent dans votre panier');
            return;
        }

        const cartItem = {
            id: sound.id,
            type: 'sound',
            title: sound.title,
            artist: sound.artist,
            artistId: sound.artistId,
            price: sound.price,
            is_free: sound.is_free,
            cover: sound.cover,
            duration: sound.duration,
            category: sound.category
        };

        addToCart(cartItem);
        toast.cart(
            'Ajouté au panier',
            `"${sound.title}" a été ajouté à votre panier`
        );

        if (onAddToCart) {
            onAddToCart(sound);
        }
    };

    // Version compacte pour les listes
    if (isCompact) {
        return (
            <>
                <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                    <Row className="g-0 h-100">
                        <Col md={4}>
                            <div className="position-relative">
                                <Card.Img
                                    src={sound.cover}
                                    style={{
                                        height: '120px',
                                        objectFit: 'cover',
                                        borderRadius: '12px 0 0 12px'
                                    }}
                                />
                                <div className="position-absolute top-0 start-0 m-2">
                                    <Badge bg="dark" style={{ fontSize: '10px' }}>
                                        {sound.category}
                                    </Badge>
                                </div>
                                {(sound.is_free || sound.price === 0) && (
                                    <div className="position-absolute top-0 end-0 m-2">
                                        <Badge bg="success" style={{ fontSize: '10px' }}>
                                            Gratuit
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </Col>
                        <Col md={8}>
                            <Card.Body className="p-3 d-flex flex-column h-100">
                                <div className="flex-grow-1">
                                    <Card.Title className="mb-1 fw-bold" style={{ fontSize: '16px' }}>
                                        <Link
                                            to={`/sounds/${sound.id}`}
                                            className="text-decoration-none text-dark"
                                        >
                                            {sound.title}
                                        </Link>
                                    </Card.Title>
                                    <Card.Text className="text-muted small mb-2">
                                        par <Link
                                            to={`/artists/${sound.artistId || 1}`}
                                            className="text-decoration-none"
                                        >
                                            {sound.artist}
                                        </Link>
                                    </Card.Text>

                                    {/* Stats horizontales */}
                                    <div className="d-flex justify-content-between align-items-center mb-2 small text-muted">
                                        <div className="d-flex gap-3">
                                            <span>
                                                <FontAwesomeIcon icon={faHeart} className="text-danger me-1" />
                                                {sound.likes?.toLocaleString() || 0}
                                            </span>
                                            <span>
                                                <FontAwesomeIcon icon={faHeadphones} className="me-1" />
                                                {sound.plays?.toLocaleString() || 0}
                                            </span>
                                            <span>
                                                <FontAwesomeIcon icon={faDownload} className="text-success me-1" />
                                                {sound.downloads?.toLocaleString() || 0}
                                            </span>
                                        </div>
                                        <span className="fw-medium">
                                            {sound.duration || '0:00'}
                                        </span>
                                    </div>

                                    {/* Preview audio */}
                                    {showPreview && (
                                        <div className="mb-2">
                                            <AudioPlayer
                                                sound={sound}
                                                isCompact={true}
                                                showDetails={false}
                                                onLike={handleLike}
                                                onViewMore={handleViewMore}
                                                previewDuration={20}
                                                showPreviewBadge={false}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Prix et actions */}
                                <div className="d-flex justify-content-between align-items-center">
                                    <div className="fw-bold text-warning">
                                        {sound.is_free || sound.price === 0
                                            ? 'Gratuit'
                                            : `${sound.price?.toLocaleString()} FCFA`
                                        }
                                    </div>
                                    <div className="d-flex gap-1">
                                        <Button
                                            variant={isLiked ? "danger" : "outline-danger"}
                                            size="sm"
                                            onClick={handleLike}
                                            disabled={!token}
                                            style={{ borderRadius: '8px' }}
                                        >
                                            <FontAwesomeIcon
                                                icon={faHeart}
                                                style={{ color: isLiked ? '#fff' : '#dc3545' }}
                                            />
                                        </Button>
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={handleViewMore}
                                            style={{ borderRadius: '8px' }}
                                        >
                                            <FontAwesomeIcon icon={faEye} />
                                        </Button>
                                        {!sound.is_free && sound.price > 0 && (
                                            <Button
                                                variant={isInCart(sound.id, 'sound') ? "success" : "outline-primary"}
                                                size="sm"
                                                onClick={handleAddToCart}
                                                disabled={!token || isInCart(sound.id, 'sound')}
                                                style={{ borderRadius: '8px' }}
                                            >
                                                <FontAwesomeIcon icon={faShoppingCart} />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card.Body>
                        </Col>
                    </Row>
                </Card>

                <SoundDetailsModal
                    show={showModal}
                    onHide={() => setShowModal(false)}
                    sound={sound}
                    onLike={handleLike}
                    onAddToCart={handleAddToCart}
                />
            </>
        );
    }

    // Version normale (grille)
    return (
        <>
            <Card className="border-0 shadow-sm h-100 sound-card" style={{ borderRadius: '16px' }}>
                <div className="position-relative">
                    <Card.Img
                        variant="top"
                        src={sound.cover}
                        style={{
                            height: '220px',
                            objectFit: 'cover',
                            borderRadius: '16px 16px 0 0'
                        }}
                    />

                    {/* Badges */}
                    <div className="position-absolute top-0 start-0 m-3">
                        <Badge bg="dark" className="px-2 py-1" style={{ fontSize: '11px', borderRadius: '8px' }}>
                            {sound.category}
                        </Badge>
                    </div>

                    {(sound.is_free || sound.price === 0) && (
                        <div className="position-absolute top-0 end-0 m-3">
                            <Badge bg="success" className="px-2 py-1" style={{ fontSize: '11px', borderRadius: '8px' }}>
                                <FontAwesomeIcon icon={faDownload} className="me-1" />
                                Gratuit
                            </Badge>
                        </div>
                    )}

                    {/* Play overlay */}
                    <div className="position-absolute top-50 start-50 translate-middle">
                        <Button
                            variant="light"
                            className="rounded-circle shadow"
                            style={{ width: '60px', height: '60px' }}
                            onClick={handleViewMore}
                        >
                            <FontAwesomeIcon icon={faPlay} className="text-primary fs-4" />
                        </Button>
                    </div>
                </div>

                <Card.Body className="p-3">
                    {/* Titre et artiste */}
                    <div className="mb-3">
                        <Card.Title className="mb-1 fw-bold" style={{ fontSize: '16px' }}>
                            <Link
                                to={`/sounds/${sound.id}`}
                                className="text-decoration-none text-dark"
                            >
                                {sound.title}
                            </Link>
                        </Card.Title>
                        <Card.Text className="text-muted small mb-0">
                            par <Link
                                to={`/artists/${sound.artistId || 1}`}
                                className="text-decoration-none"
                            >
                                {sound.artist}
                            </Link>
                        </Card.Text>
                    </div>

                    {/* Preview audio */}
                    {showPreview && (
                        <div className="mb-3">
                            <AudioPlayer
                                sound={sound}
                                isCompact={true}
                                showDetails={false}
                                onLike={handleLike}
                                onViewMore={handleViewMore}
                                previewDuration={20}
                                showPreviewBadge={false}
                            />
                        </div>
                    )}

                    {/* Stats améliorées */}
                    <div className="row g-2 mb-3">
                        <div className="col-4 text-center">
                            <div className="small">
                                <FontAwesomeIcon icon={faHeart} className="text-danger me-1" />
                                <div className="fw-bold">{sound.likes?.toLocaleString() || 0}</div>
                                <div className="text-muted small">Likes</div>
                            </div>
                        </div>
                        <div className="col-4 text-center">
                            <div className="small">
                                <FontAwesomeIcon icon={faHeadphones} className="text-primary me-1" />
                                <div className="fw-bold">{sound.plays?.toLocaleString() || 0}</div>
                                <div className="text-muted small">Écoutes</div>
                            </div>
                        </div>
                        <div className="col-4 text-center">
                            <div className="small">
                                <FontAwesomeIcon icon={faDownload} className="text-success me-1" />
                                <div className="fw-bold">{sound.downloads?.toLocaleString() || 0}</div>
                                <div className="text-muted small">Téléch.</div>
                            </div>
                        </div>
                    </div>

                    {/* Prix et actions */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="fw-bold text-warning fs-6">
                            {sound.is_free || sound.price === 0
                                ? 'Gratuit'
                                : `${sound.price?.toLocaleString()} FCFA`
                            }
                        </div>
                        <div className="text-muted small">
                            {sound.duration || '0:00'}
                        </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="d-flex gap-2">
                        <Button
                            variant={isLiked ? "danger" : "outline-danger"}
                            size="sm"
                            onClick={handleLike}
                            disabled={!token}
                            className="flex-fill"
                            style={{ borderRadius: '8px' }}
                        >
                            <FontAwesomeIcon
                                icon={faHeart}
                                style={{ color: isLiked ? '#fff' : '#dc3545' }}
                            />
                        </Button>

                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={handleViewMore}
                            className="flex-fill"
                            style={{ borderRadius: '8px' }}
                        >
                            <FontAwesomeIcon icon={faEye} />
                        </Button>

                        {!sound.is_free && sound.price > 0 ? (
                            <Button
                                variant={isInCart(sound.id, 'sound') ? "success" : "primary"}
                                size="sm"
                                onClick={handleAddToCart}
                                disabled={!token || isInCart(sound.id, 'sound')}
                                className="flex-fill"
                                style={{ borderRadius: '8px' }}
                            >
                                <FontAwesomeIcon
                                    icon={faShoppingCart}
                                    className="me-1"
                                />
                                {isInCart(sound.id, 'sound') ? 'Ajouté' : 'Panier'}
                            </Button>
                        ) : (
                            <Button
                                as={Link}
                                to={`/sounds/${sound.id}`}
                                variant="success"
                                size="sm"
                                className="flex-fill"
                                style={{ borderRadius: '8px' }}
                            >
                                <FontAwesomeIcon icon={faDownload} className="me-1" />
                                Télécharger
                            </Button>
                        )}
                    </div>
                </Card.Body>
            </Card>

            <SoundDetailsModal
                show={showModal}
                onHide={() => setShowModal(false)}
                sound={sound}
                onLike={handleLike}
                onAddToCart={handleAddToCart}
            />
        </>
    );
};

export default SoundCard;
