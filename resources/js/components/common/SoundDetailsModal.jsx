import React, { useState, useEffect, useRef } from 'react';
import { Modal, Row, Col, Card, Button, Badge, ProgressBar, Image, Table, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlay, faPause, faVolumeUp, faVolumeDown, faVolumeMute, faHeart, faShoppingCart,
    faDownload, faShare, faMusic, faUser, faMapMarkerAlt, faClock, faEye, faThumbsUp,
    faSignal, faHeadphones, faTimes, faExpand, faCompress, faRandom, faRepeat
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const SoundDetailsModal = ({ show, onHide, sound, onLike, onAddToCart, likedSounds = new Set(), hasPurchased = false }) => {
    const { user, token } = useAuth();
    const toast = useToast();
    const audioRef = useRef(null);
    const navigate = useNavigate();

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.8);
    const [isFullPlayer, setIsFullPlayer] = useState(false);
    const [artistInfo, setArtistInfo] = useState(null);
    const [loadingArtist, setLoadingArtist] = useState(false);
    const [showWaveform, setShowWaveform] = useState(false);

    // Charger les informations de l'artiste
    useEffect(() => {
        if (sound?.artistId && show) {
            loadArtistInfo();
        }
    }, [sound?.artistId, show]);

    // Initialiser l'audio
    useEffect(() => {
        if (show && sound && audioRef.current) {
            const audio = audioRef.current;
            audio.volume = volume;

            const audioUrl = hasPurchased ? sound.file_url : sound.preview_url;
            if (audioUrl) {
                audio.src = audioUrl;
            }

            // Gestion de la limitation preview
            const handleTimeUpdate = () => {
                setCurrentTime(audio.currentTime);

                if (!hasPurchased && !sound.is_free && audio.currentTime >= 20) {
                    audio.pause();
                    setIsPlaying(false);
                    toast.info('Preview terminée', 'Achetez ce son pour l\'écouter en entier');
                }
            };

            const handleLoadedMetadata = () => {
                setDuration(audio.duration);
            };

            const handleEnded = () => {
                setIsPlaying(false);
                setCurrentTime(0);
            };

            audio.addEventListener('timeupdate', handleTimeUpdate);
            audio.addEventListener('loadedmetadata', handleLoadedMetadata);
            audio.addEventListener('ended', handleEnded);

            return () => {
                audio.removeEventListener('timeupdate', handleTimeUpdate);
                audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
                audio.removeEventListener('ended', handleEnded);
            };
        }
    }, [show, sound, volume, hasPurchased]);

    const loadArtistInfo = async () => {
        try {
            setLoadingArtist(true);
            const response = await fetch(`/api/artists/${sound.artistId}`);
            const data = await response.json();

            if (data.success) {
                setArtistInfo(data.artist);
            }
        } catch (error) {
            console.error('Erreur lors du chargement de l\'artiste:', error);
        } finally {
            setLoadingArtist(false);
        }
    };

    const handlePlayPause = async () => {
        const audio = audioRef.current;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            try {
                await audio.play();
                setIsPlaying(true);
            } catch (error) {
                console.error('Erreur lecture:', error);
                toast.error('Erreur', 'Impossible de lire ce son');
            }
        }
    };

    const handleSeek = (e) => {
        const audio = audioRef.current;
        const rect = e.currentTarget.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const newTime = pos * duration;

        // Limite à 20s pour preview
        if (!hasPurchased && !sound.is_free && newTime > 20) {
            return;
        }

        audio.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
    };

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleDownload = () => {
        if (hasPurchased || sound.is_free) {
            window.open(`/api/sounds/${sound.id}/download`, '_blank');
            toast.success('Téléchargement', 'Le téléchargement va commencer...');
        } else {
            toast.info('Achat requis', 'Vous devez acheter ce son pour le télécharger');
        }
    };

    const handleAddToCart = () => {
        // Si le son est gratuit, télécharger directement
        if (sound.is_free || sound.price === 0) {
            handleDownload();
            return;
        }

        // Sinon ajouter au panier
            onAddToCart(sound);
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.origin + `/sounds/${sound.id}`);
        toast.success('Partagé', 'Lien copié dans le presse-papiers !');
    };

    if (!sound) return null;

    const isLiked = likedSounds.has(sound.id);
    const maxDuration = hasPurchased || sound.is_free ? duration : Math.min(duration, 20);

    return (
        <>
            <audio ref={audioRef} preload="metadata" />

            <Modal
                show={show}
                onHide={onHide}
                size={isFullPlayer ? "xl" : "lg"}
                centered
                className="sound-details-modal"
            >
            <Modal.Header closeButton className="border-0 pb-0">
                    <div className="d-flex align-items-center gap-3">
                        <div className="sound-cover-mini">
                            <Image
                                src={sound.cover || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=60&h=60&fit=crop`}
                                alt={sound.title}
                                width={60}
                                height={60}
                                style={{ objectFit: 'cover', borderRadius: '12px' }}
                            />
                        </div>
                        <div>
                            <h4 className="mb-1 fw-bold">{sound.title}</h4>
                            <p className="text-muted mb-0">Par {sound.artist}</p>
                        </div>
                        </div>
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => setIsFullPlayer(!isFullPlayer)}
                        className="ms-auto me-2"
                    >
                        <FontAwesomeIcon icon={isFullPlayer ? faCompress : faExpand} />
                    </Button>
                </Modal.Header>

                <Modal.Body className="px-4 py-3">
                    <Row>
                        {/* Colonne principale - Lecteur */}
                        <Col lg={isFullPlayer ? 12 : 8}>
                            {/* Lecteur audio moderne */}
                            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                <Card.Body className="text-white p-4">
                                    <Row className="align-items-center">
                                        <Col md={3} className="text-center">
                                            <Image
                                                src={sound.cover || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop`}
                                                alt={sound.title}
                                                width={120}
                                                height={120}
                                                style={{ objectFit: 'cover', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
                                            />
                                        </Col>
                                        <Col md={9}>
                                            <Row className="align-items-center">
                                                <Col>
                                                    <h5 className="fw-bold mb-1">{sound.title}</h5>
                                                    <p className="opacity-75 mb-3">{sound.artist}</p>

                                                    {/* Contrôles */}
                                                    <div className="d-flex align-items-center gap-3 mb-3">
                                                        <Button
                                                            variant="light"
                                                            size="lg"
                                                            className="rounded-circle"
                                                            style={{ width: '50px', height: '50px' }}
                                                            onClick={handlePlayPause}
                                                        >
                                                            <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
                                                        </Button>

                                                        <Button
                                                            variant="outline-light"
                                                            size="sm"
                                                            onClick={() => onLike(sound.id)}
                                                            className={isLiked ? 'text-danger border-danger' : ''}
                                                        >
                                                            <FontAwesomeIcon icon={faHeart} />
                                                            <span className="ms-1">{sound.likes || 0}</span>
                                                        </Button>

                                                        {hasPurchased || sound.is_free ? (
                                                            <Button
                                                                variant="success"
                                                                size="sm"
                                                                onClick={handleDownload}
                                                            >
                                                                <FontAwesomeIcon icon={faDownload} className="me-1" />
                                                                {sound.is_free ? 'Télécharger gratuitement' : 'Télécharger'}
                                                            </Button>
                                                        ) : (
                            <Button
                                                                variant="warning"
                                size="sm"
                                                                onClick={handleAddToCart}
                            >
                                                                <FontAwesomeIcon icon={faShoppingCart} className="me-1" />
                                                                {`Acheter ${sound.price} XAF`}
                            </Button>
                                                        )}

                            <Button
                                                            variant="outline-light"
                                size="sm"
                                onClick={handleShare}
                            >
                                                            <FontAwesomeIcon icon={faShare} />
                            </Button>
                        </div>

                                                    {/* Barre de progression */}
                                                    <div className="d-flex align-items-center gap-2">
                                                        <small className="opacity-75">{formatTime(currentTime)}</small>
                                                        <div
                                                            className="progress flex-grow-1"
                                                            style={{ height: '6px', cursor: 'pointer', borderRadius: '3px' }}
                                                            onClick={handleSeek}
                                                        >
                                                            <div
                                                                className="progress-bar bg-warning"
                                                                style={{
                                                                    width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`
                                                                }}
                                                            />
                                                            {/* Indicateur limite preview */}
                                                            {!hasPurchased && !sound.is_free && duration > 0 && (
                                                                <div
                                                                    className="position-absolute top-0 bg-danger"
                                                                    style={{
                                                                        left: `${(20 / duration) * 100}%`,
                                                                        width: '2px',
                                                                        height: '100%'
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                        <small className="opacity-75">
                                                            {!hasPurchased && !sound.is_free ? '0:20' : formatTime(duration)}
                                                        </small>
                                                    </div>

                                                    {/* Contrôle volume */}
                                                    <div className="d-flex align-items-center gap-2 mt-2">
                                                        <FontAwesomeIcon
                                                            icon={volume === 0 ? faVolumeMute : volume < 0.5 ? faVolumeDown : faVolumeUp}
                                                            className="opacity-75"
                                                        />
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="1"
                                                            step="0.1"
                                                            value={volume}
                                                            onChange={handleVolumeChange}
                                                            style={{ width: '100px' }}
                                                            className="form-range"
                                                        />
                                                    </div>
                                                </Col>
                                            </Row>
                    </Col>
                </Row>

                                    {/* Badge de statut */}
                                    <div className="position-absolute top-0 end-0 m-3">
                                        {hasPurchased ? (
                                            <Badge bg="success" className="fw-normal">
                                                <FontAwesomeIcon icon={faDownload} className="me-1" />
                                                Acheté
                                            </Badge>
                                        ) : sound.is_free ? (
                                            <Badge bg="info" className="fw-normal">
                                                Gratuit
                                            </Badge>
                                        ) : (
                                            <Badge bg="warning" className="fw-normal">
                                                <FontAwesomeIcon icon={faSignal} className="me-1" />
                                                Preview 20s
                                            </Badge>
                                        )}
                </div>
                                </Card.Body>
                            </Card>

                            {/* Informations détaillées */}
                            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '15px' }}>
                                <Card.Header className="bg-white border-0">
                                    <h6 className="fw-bold mb-0">
                                        <FontAwesomeIcon icon={faMusic} className="me-2 text-primary" />
                                        Détails du son
                                    </h6>
                                </Card.Header>
                                <Card.Body>
                                    <Table className="mb-0" size="sm">
                                        <tbody>
                                            <tr>
                                                <td className="fw-medium text-muted">Durée</td>
                                                <td>{sound.duration || 'N/A'}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium text-muted">Genre</td>
                                                <td>{sound.genre || 'Non spécifié'}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium text-muted">BPM</td>
                                                <td>{sound.bpm || 'N/A'}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium text-muted">Tonalité</td>
                                                <td>{sound.key || 'N/A'}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium text-muted">Écoutes</td>
                                                <td>
                                                    <FontAwesomeIcon icon={faEye} className="me-1 text-muted" />
                                                    {sound.plays || 0}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium text-muted">Téléchargements</td>
                                                <td>
                                                    <FontAwesomeIcon icon={faDownload} className="me-1 text-muted" />
                                                    {sound.downloads || 0}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium text-muted">Publié le</td>
                                                <td>{sound.created_at || 'N/A'}</td>
                                            </tr>
                                        </tbody>
                                    </Table>

                                    {sound.description && (
                                        <div className="mt-3">
                                            <h6 className="fw-bold mb-2">Description</h6>
                                            <p className="text-muted">{sound.description}</p>
                                        </div>
                                    )}

                                    {sound.tags && sound.tags.length > 0 && (
                                        <div className="mt-3">
                                            <h6 className="fw-bold mb-2">Tags</h6>
                                            <div className="d-flex flex-wrap gap-1">
                                                {sound.tags.map((tag, index) => (
                                                    <Badge key={index} bg="light" text="dark" className="fw-normal">
                                                        #{tag}
                                                    </Badge>
                                                ))}
                                            </div>
                </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Colonne latérale - Artiste */}
                        {!isFullPlayer && (
                            <Col lg={4}>
                                <Card className="border-0 shadow-sm" style={{ borderRadius: '15px' }}>
                                    <Card.Header className="bg-white border-0">
                                        <h6 className="fw-bold mb-0">
                                            <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                                            Artiste
                    </h6>
                                    </Card.Header>
                                    <Card.Body className="text-center">
                                        {loadingArtist ? (
                                            <div className="py-4">
                                                <div className="spinner-border spinner-border-sm text-primary" role="status" />
                                                <p className="text-muted mt-2 mb-0">Chargement...</p>
                                            </div>
                                        ) : artistInfo ? (
                                            <>
                                                <Image
                                                    src={artistInfo.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(sound.artist)}&size=80&background=667eea&color=ffffff`}
                            alt={sound.artist}
                                                    width={80}
                                                    height={80}
                                                    roundedCircle
                                                    className="mb-3"
                                                />
                                                <h6 className="fw-bold mb-1">{sound.artist}</h6>
                                                <p className="text-muted small mb-3">{artistInfo.bio || 'Artiste passionné'}</p>

                                                <div className="row text-center mb-3">
                                                    <div className="col">
                                                        <div className="fw-bold text-primary">{artistInfo.sounds_count || 0}</div>
                                                        <small className="text-muted">Sons</small>
                                                    </div>
                                                    <div className="col">
                                                        <div className="fw-bold text-primary">{artistInfo.followers_count || 0}</div>
                                                        <small className="text-muted">Abonnés</small>
                        </div>
                                                    <div className="col">
                                                        <div className="fw-bold text-primary">{artistInfo.total_plays || 0}</div>
                                                        <small className="text-muted">Écoutes</small>
                    </div>
                </div>

                                                <Button variant="primary" size="sm" className="w-100" onClick={() => navigate(`/artists/${sound.artistId || sound.user_id}`)}>
                                                    Voir le profil
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Image
                                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(sound.artist)}&size=80&background=667eea&color=ffffff`}
                                                    alt={sound.artist}
                                                    width={80}
                                                    height={80}
                                                    roundedCircle
                                                    className="mb-3"
                                                />
                                                <h6 className="fw-bold mb-1">{sound.artist}</h6>
                                                <p className="text-muted small mb-3">Artiste sur Reveil4Artist</p>
                                                <Button variant="primary" size="sm" className="w-100" onClick={() => navigate(`/artists/${sound.artistId || sound.user_id}`)}>
                                                    Voir le profil
                                                </Button>
                                            </>
                                        )}
                                    </Card.Body>
                                </Card>

                                {/* Sons similaires */}
                                <Card className="border-0 shadow-sm mt-4" style={{ borderRadius: '15px' }}>
                                    <Card.Header className="bg-white border-0">
                                        <h6 className="fw-bold mb-0">
                                            <FontAwesomeIcon icon={faHeadphones} className="me-2 text-primary" />
                                            Suggestions
                                        </h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <p className="text-muted text-center">Sons similaires bientôt disponibles</p>
                                    </Card.Body>
                                </Card>
                            </Col>
                        )}
                    </Row>
            </Modal.Body>

            <Modal.Footer className="border-0 pt-0">
                    <div className="d-flex align-items-center justify-content-between w-100">
                        <div className="d-flex gap-2">
                            <Badge bg="secondary" className="fw-normal">
                                {sound.category || 'Sans catégorie'}
                            </Badge>
                            {sound.is_featured && (
                                <Badge bg="warning" className="fw-normal">
                                    Mis en avant
                                </Badge>
                            )}
                    </div>

                    <div className="d-flex gap-2">
                            {hasPurchased || sound.is_free ? (
                                <Button variant="success" onClick={handleDownload}>
                                    <FontAwesomeIcon icon={faDownload} className="me-1" />
                                    {sound.is_free ? 'Télécharger gratuitement' : 'Télécharger'}
                            </Button>
                        ) : (
                                <Button variant="primary" onClick={handleAddToCart}>
                                    <FontAwesomeIcon icon={faShoppingCart} className="me-1" />
                                    {`Acheter ${sound.price} XAF`}
                                </Button>
                            )}
                            <Button variant="outline-secondary" onClick={onHide}>
                                Fermer
                            </Button>
                    </div>
                </div>
            </Modal.Footer>
        </Modal>

            <style jsx>{`
                .sound-details-modal .modal-content {
                    border-radius: 20px;
                    border: none;
                    overflow: hidden;
                }

                .sound-cover-mini img {
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }
            `}</style>
        </>
    );
};

export default SoundDetailsModal;
