import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Button, Badge, ListGroup, ProgressBar, Form, InputGroup, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUser, faMusic, faShoppingBag, faHeart, faCog, faDownload, faCalendar,
    faStar, faEye, faHeadphones, faPlay, faPause, faEdit, faTrash, faPlus,
    faUpload, faCalendarAlt, faTicketAlt, faUsers, faMapMarkerAlt, faClock,
    faSearch, faFilter, faSort, faChartLine, faShare, faBookmark, faBell,
    faPrint, faUserPlus, faCheckCircle, faInfoCircle, faExclamationTriangle,
    faTimesCircle, faPhone, faEnvelope, faTrophy, faGift, faCoins, faUserCheck,
    faVolumeUp, faVolumeMute, faForward, faBackward, faStop, faExternalLinkAlt,
    faUserMinus, faVideo, faComment, faCamera, faGlobe, faLock, faRandom,
    faRepeat, faStepForward, faStepBackward, faTimes, faShoppingCart, faWaveSquare
} from '@fortawesome/free-solid-svg-icons';
import LoadingSpinner, { LoadingOverlay } from '../common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCart } from '../../context/CartContext';
import AudioPlayer from '../common/AudioPlayer';

const Profile = () => {
    const [activeTab, setActiveTab] = useState('library');
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [profileData, setProfileData] = useState(null);

    // États bibliothèque musicale
    const [purchasedSounds, setPurchasedSounds] = useState([]);
    const [favoriteSounds, setFavoriteSounds] = useState([]);
    const [mySounds, setMySounds] = useState([]);
    const [followedArtists, setFollowedArtists] = useState([]);
    const [purchasedEvents, setPurchasedEvents] = useState([]);
    const [myClips, setMyClips] = useState([]);

    // États lecteur audio
    const [currentPlaying, setCurrentPlaying] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.8);
    const [isShuffled, setIsShuffled] = useState(false);
    const [isRepeated, setIsRepeated] = useState(false);
    const [showMusicPlayer, setShowMusicPlayer] = useState(false);
    const [currentPlaylist, setCurrentPlaylist] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    // États interface
    const [viewMode, setViewMode] = useState('grid'); // grid, list
    const [filterBy, setFilterBy] = useState('all'); // all, free, paid, liked
    const [sortBy, setSortBy] = useState('recent'); // recent, name, artist, duration

    const audioRef = useRef(null);
    const { user, token, loading: authLoading, isAuthenticated } = useAuth();
    const toast = useToast();
    const { addToCart, isInCart } = useCart();

    // Initialisation
    useEffect(() => {
        if (isAuthenticated && user) {
            loadProfileData();
        }
    }, [isAuthenticated, user]);

    // Initialiser le lecteur audio
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const handleEnded = () => {
            if (isRepeated) {
                audio.currentTime = 0;
                audio.play();
            } else {
                handleNextTrack();
            }
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [isRepeated]);

    const loadProfileData = async () => {
        setIsLoading(true);
        try {
            // Charger toutes les données en parallèle
            await Promise.all([
                loadPurchasedSounds(),
                loadFavoriteSounds(),
                loadMySounds(),
                loadFollowedArtists(),
                loadPurchasedEvents(),
                loadMyClips()
            ]);
        } catch (error) {
            console.error('Erreur chargement profil:', error);
            toast.error('Erreur', 'Impossible de charger les données du profil');
        } finally {
            setIsLoading(false);
        }
    };

    const loadPurchasedSounds = async () => {
        try {
            const response = await fetch('/api/user/purchased-sounds', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setPurchasedSounds(data.data || []);
            }
        } catch (error) {
            console.error('Erreur sons achetés:', error);
        }
    };

    const loadFavoriteSounds = async () => {
        try {
            const response = await fetch('/api/user/favorite-sounds', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setFavoriteSounds(data.data || []);
            }
        } catch (error) {
            console.error('Erreur sons favoris:', error);
        }
    };

    const loadMySounds = async () => {
        try {
            const response = await fetch('/api/user/sounds', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setMySounds(data.data || []);
            }
        } catch (error) {
            console.error('Erreur mes sons:', error);
        }
    };

    const loadFollowedArtists = async () => {
        try {
            const response = await fetch('/api/user/followed-artists', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setFollowedArtists(data.data || []);
            }
        } catch (error) {
            console.error('Erreur artistes suivis:', error);
        }
    };

    const loadPurchasedEvents = async () => {
        try {
            const response = await fetch('/api/user/purchased-events', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setPurchasedEvents(data.data || []);
            }
        } catch (error) {
            console.error('Erreur événements achetés:', error);
        }
    };

    const loadMyClips = async () => {
        try {
            const response = await fetch('/api/user/clips', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setMyClips(data.data || []);
            }
        } catch (error) {
            console.error('Erreur mes clips:', error);
        }
    };

    // Fonctions du lecteur audio
    const handlePlayPause = (sound) => {
        const audio = audioRef.current;
        if (!audio) return;

        if (currentPlaying?.id === sound.id && isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            // Arrêter l'audio en cours
            if (currentPlaying && currentPlaying.id !== sound.id) {
                audio.pause();
                setCurrentTime(0);
            }

            audio.src = sound.preview_url || sound.audio_file_url || sound.file_url;
            setCurrentPlaying(sound);

            audio.play()
                .then(() => {
                    setIsPlaying(true);
                    setShowMusicPlayer(true);
                    
                    // Construire la playlist
                    const allSounds = [...purchasedSounds, ...favoriteSounds.filter(s => s.can_play), ...mySounds];
                    setCurrentPlaylist(allSounds);
                    setCurrentIndex(allSounds.findIndex(s => s.id === sound.id));
                })
                .catch(error => {
                    console.error('Erreur lecture:', error);
                    toast.error('Erreur', 'Impossible de lire ce son');
                });
        }
    };

    const handleNextTrack = () => {
        if (currentPlaylist.length === 0) return;

        let nextIndex;
        if (isShuffled) {
            nextIndex = Math.floor(Math.random() * currentPlaylist.length);
        } else {
            nextIndex = (currentIndex + 1) % currentPlaylist.length;
        }

        const nextSound = currentPlaylist[nextIndex];
        if (nextSound) {
            handlePlayPause(nextSound);
            setCurrentIndex(nextIndex);
        }
    };

    const handlePreviousTrack = () => {
        if (currentPlaylist.length === 0) return;

        const prevIndex = currentIndex === 0 ? currentPlaylist.length - 1 : currentIndex - 1;
        const prevSound = currentPlaylist[prevIndex];
        if (prevSound) {
            handlePlayPause(prevSound);
            setCurrentIndex(prevIndex);
        }
    };

    const handleSeek = (newTime) => {
        const audio = audioRef.current;
        if (audio) {
            audio.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const handleVolumeChange = (newVolume) => {
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
    };

    const handleAddToCart = (sound) => {
        if (!sound.is_free && sound.price > 0) {
            if (isInCart(sound.id, 'sound')) {
                toast.info('Déjà dans le panier', 'Ce son est déjà présent dans votre panier');
                return;
            }

            const cartItem = {
                id: sound.id,
                type: 'sound',
                title: sound.title,
                artist: sound.artist || sound.user?.name,
                price: sound.price,
                is_free: sound.is_free,
                cover: sound.cover_image_url,
                duration: sound.duration,
                category: sound.category
            };

            const success = addToCart(cartItem);
            if (success) {
                toast.success('Ajouté au panier', `"${sound.title}" a été ajouté à votre panier`);
            }
        }
    };

    // Fonctions utilitaires
    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-CM', {
            style: 'currency',
            currency: 'XAF',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num?.toString() || '0';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Filtrer et trier les sons
    const getFilteredSounds = (sounds) => {
        let filtered = sounds;

        // Filtrer
        switch (filterBy) {
            case 'free':
                filtered = sounds.filter(s => s.is_free);
                break;
            case 'paid':
                filtered = sounds.filter(s => !s.is_free && s.price > 0);
                break;
            case 'liked':
                filtered = favoriteSounds;
                break;
            default:
                break;
        }

        // Recherche
        if (searchTerm.trim()) {
            filtered = filtered.filter(sound =>
                sound.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (sound.artist || sound.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Trier
        switch (sortBy) {
            case 'name':
                filtered.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'artist':
                filtered.sort((a, b) => (a.artist || a.user?.name || '').localeCompare(b.artist || b.user?.name || ''));
                break;
            case 'duration':
                filtered.sort((a, b) => (b.duration_seconds || 0) - (a.duration_seconds || 0));
                break;
            default: // recent
                filtered.sort((a, b) => new Date(b.created_at || b.purchase_date) - new Date(a.created_at || a.purchase_date));
                break;
        }

        return filtered;
    };

    // Composants de rendu
    const renderMusicLibrary = () => {
        const allSounds = [...purchasedSounds, ...favoriteSounds, ...mySounds];
        const filteredSounds = getFilteredSounds(allSounds);

        if (filteredSounds.length === 0) {
            return (
                <div className="text-center py-5">
                    <FontAwesomeIcon icon={faMusic} size="3x" className="text-muted mb-3" />
                    <h5>Aucun son trouvé</h5>
                    <p className="text-muted">
                        {searchTerm ? 'Aucun résultat pour votre recherche' : 'Votre bibliothèque musicale est vide'}
                    </p>
                    <Button as={Link} to="/catalog" variant="primary">
                        Découvrir de la musique
                    </Button>
                </div>
            );
        }

        if (viewMode === 'grid') {
            return (
                <div className="music-grid">
                    {filteredSounds.map((sound, index) => (
                        <Card key={sound.id} className="music-card" style={{ animationDelay: `${index * 0.1}s` }}>
                            <div className="music-cover">
                                <img
                                    src={sound.cover_image_url || sound.cover || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=250&h=250&fit=crop`}
                                    alt={sound.title}
                                    className="cover-image"
                                />
                                <div className="play-overlay">
                                    <Button
                                        variant="light"
                                        className="play-btn-overlay"
                                        onClick={() => handlePlayPause(sound)}
                                    >
                                        <FontAwesomeIcon 
                                            icon={currentPlaying?.id === sound.id && isPlaying ? faPause : faPlay} 
                                        />
                                    </Button>
                                </div>
                                {sound.price > 0 && !sound.can_play && (
                                    <div className="price-badge">
                                        <Badge bg="warning" text="dark">
                                            {formatCurrency(sound.price)}
                                        </Badge>
                                    </div>
                                )}
                                {sound.is_free && (
                                    <div className="price-badge">
                                        <Badge bg="success">Gratuit</Badge>
                                    </div>
                                )}
                            </div>
                            <Card.Body className="p-3">
                                <h6 className="sound-title">{sound.title}</h6>
                                <p className="sound-artist">{sound.artist || sound.user?.name}</p>
                                <div className="sound-meta">
                                    <small className="text-muted">
                                        <FontAwesomeIcon icon={faClock} className="me-1" />
                                        {sound.duration || '3:00'}
                                    </small>
                                    <small className="text-muted">
                                        <FontAwesomeIcon icon={faHeadphones} className="me-1" />
                                        {formatNumber(sound.plays_count || 0)}
                                    </small>
                                </div>
                                <div className="sound-actions">
                                    {sound.can_play !== false && (
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => handlePlayPause(sound)}
                                        >
                                            <FontAwesomeIcon icon={faPlay} className="me-1" />
                                            Écouter
                                        </Button>
                                    )}
                                    {!sound.is_free && sound.price > 0 && !sound.can_play && (
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handleAddToCart(sound)}
                                            disabled={isInCart(sound.id, 'sound')}
                                        >
                                            <FontAwesomeIcon icon={faShoppingCart} className="me-1" />
                                            {isInCart(sound.id, 'sound') ? 'Dans le panier' : 'Acheter'}
                                        </Button>
                                    )}
                                    {sound.can_download && (
                                        <Button
                                            variant="success"
                                            size="sm"
                                            as={Link}
                                            to={`/download/${sound.id}`}
                                        >
                                            <FontAwesomeIcon icon={faDownload} />
                                        </Button>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    ))}
                </div>
            );
        } else {
            return (
                <Card className="music-list">
                    <Card.Body className="p-0">
                        {filteredSounds.map((sound, index) => (
                            <div
                                key={sound.id}
                                className={`music-list-item ${currentPlaying?.id === sound.id ? 'playing' : ''}`}
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div className="d-flex align-items-center p-3">
                                    <div className="list-play-btn">
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => handlePlayPause(sound)}
                                            className="rounded-circle"
                                        >
                                            <FontAwesomeIcon 
                                                icon={currentPlaying?.id === sound.id && isPlaying ? faPause : faPlay} 
                                            />
                                        </Button>
                                    </div>
                                    <img
                                        src={sound.cover_image_url || sound.cover || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=50&h=50&fit=crop`}
                                        alt={sound.title}
                                        className="list-cover me-3"
                                    />
                                    <div className="flex-grow-1">
                                        <h6 className="mb-0">{sound.title}</h6>
                                        <small className="text-muted">{sound.artist || sound.user?.name}</small>
                                    </div>
                                    <div className="list-meta text-center me-3">
                                        <small className="text-muted">{sound.duration || '3:00'}</small>
                                    </div>
                                    <div className="list-actions">
                                        <div className="d-flex gap-2">
                                            {!sound.is_free && sound.price > 0 && !sound.can_play && (
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => handleAddToCart(sound)}
                                                    disabled={isInCart(sound.id, 'sound')}
                                                >
                                                    <FontAwesomeIcon icon={faShoppingCart} className="me-1" />
                                                    {formatCurrency(sound.price)}
                                                </Button>
                                            )}
                                            {sound.can_download && (
                                                <Button
                                                    variant="outline-success"
                                                    size="sm"
                                                    as={Link}
                                                    to={`/download/${sound.id}`}
                                                >
                                                    <FontAwesomeIcon icon={faDownload} />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Card.Body>
                </Card>
            );
        }
    };

    const renderEvents = () => (
        <div className="events-section">
            <Card className="mb-4">
                <Card.Header className="bg-white">
                    <h5 className="mb-0">
                        <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-warning" />
                        Mes Événements ({purchasedEvents.length})
                    </h5>
                </Card.Header>
                <Card.Body>
                    {purchasedEvents.length > 0 ? (
                        <Row className="g-3">
                            {purchasedEvents.map(event => (
                                <Col md={6} key={event.id}>
                                    <Card className="event-card h-100">
                                        <Card.Body>
                                            <div className="d-flex">
                                                <div className="event-date me-3">
                                                    <div className="date-number">{new Date(event.event_date).getDate()}</div>
                                                    <div className="date-month">{formatDate(event.event_date).split(' ')[1]}</div>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <h6 className="fw-bold">{event.title}</h6>
                                                    <p className="text-muted small mb-2">
                                                        <FontAwesomeIcon icon={faMapMarkerAlt} className="me-1" />
                                                        {event.venue}, {event.city}
                                                    </p>
                                                    <div className="d-flex justify-content-between">
                                                        <span className="fw-bold text-success">
                                                            {formatCurrency(event.ticket_price)}
                                                        </span>
                                                        <Button as={Link} to={`/events/${event.id}`} variant="outline-warning" size="sm">
                                                            Détails
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <div className="text-center py-4">
                            <FontAwesomeIcon icon={faCalendarAlt} size="3x" className="text-muted mb-3" />
                            <h5>Aucun événement</h5>
                            <p className="text-muted">Vous n'avez acheté aucun billet d'événement</p>
                            <Button as={Link} to="/events" variant="primary">
                                Découvrir les événements
                            </Button>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );

    const renderMyContent = () => (
        <div className="my-content-section">
            <Card className="mb-4">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                        <FontAwesomeIcon icon={faMusic} className="me-2 text-primary" />
                        Mes Sons ({mySounds.length})
                    </h5>
                    <Button as={Link} to="/upload" variant="primary" size="sm">
                        <FontAwesomeIcon icon={faPlus} className="me-1" />
                        Ajouter
                    </Button>
                </Card.Header>
                <Card.Body>
                    {mySounds.length > 0 ? (
                        <Row className="g-3">
                            {mySounds.map(sound => (
                                <Col md={4} key={sound.id}>
                                    <Card className="my-sound-card">
                                        <div className="sound-cover">
                                            <img
                                                src={sound.cover_image_url || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop`}
                                                alt={sound.title}
                                                className="cover-image"
                                            />
                                            <div className="play-overlay">
                                                <Button
                                                    variant="light"
                                                    className="play-btn-overlay"
                                                    onClick={() => handlePlayPause(sound)}
                                                >
                                                    <FontAwesomeIcon icon={faPlay} />
                                                </Button>
                                            </div>
                                        </div>
                                        <Card.Body className="p-3">
                                            <h6 className="sound-title">{sound.title}</h6>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <Badge bg={sound.status === 'published' ? 'success' : 'warning'}>
                                                    {sound.status === 'published' ? 'Publié' : 'En attente'}
                                                </Badge>
                                                <div className="d-flex gap-1">
                                                    <Button variant="outline-primary" size="sm" as={Link} to={`/sounds/${sound.id}/edit`}>
                                                        <FontAwesomeIcon icon={faEdit} />
                                                    </Button>
                                                    <Button variant="outline-danger" size="sm">
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <div className="text-center py-4">
                            <FontAwesomeIcon icon={faMusic} size="3x" className="text-muted mb-3" />
                            <h5>Aucune création</h5>
                            <p className="text-muted">Commencez à partager votre musique</p>
                            <Button as={Link} to="/upload" variant="primary">
                                <FontAwesomeIcon icon={faUpload} className="me-1" />
                                Upload votre premier son
                            </Button>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Mes Clips */}
            <Card>
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                        <FontAwesomeIcon icon={faVideo} className="me-2 text-info" />
                        Mes Clips ({myClips.length})
                    </h5>
                    <Button as={Link} to="/clips/create" variant="outline-info" size="sm">
                        <FontAwesomeIcon icon={faPlus} className="me-1" />
                        Ajouter
                    </Button>
                </Card.Header>
                <Card.Body>
                    {myClips.length > 0 ? (
                        <Row className="g-3">
                            {myClips.map(clip => (
                                <Col md={6} key={clip.id}>
                                    <Card className="clip-card">
                                        <Card.Body className="p-3">
                                            <div className="d-flex">
                                                <div className="clip-thumb me-3">
                                                    <FontAwesomeIcon icon={faVideo} className="text-white" />
                                                </div>
                                                <div className="flex-grow-1">
                                                    <h6 className="fw-bold">{clip.title}</h6>
                                                    <p className="text-muted small">{clip.description?.substring(0, 50)}...</p>
                                                    <div className="d-flex justify-content-between">
                                                        <Badge bg={clip.status === 'published' ? 'success' : 'warning'}>
                                                            {clip.status === 'published' ? 'Publié' : 'En attente'}
                                                        </Badge>
                                                        <Button as={Link} to={`/clips/${clip.id}`} variant="outline-info" size="sm">
                                                            Voir
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <div className="text-center py-4">
                            <FontAwesomeIcon icon={faVideo} size="3x" className="text-muted mb-3" />
                            <h5>Aucun clip</h5>
                            <p className="text-muted">Partagez vos clips vidéo</p>
                            <Button as={Link} to="/clips/create" variant="outline-info">
                                Créer un clip
                            </Button>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );

    const renderFollowedArtists = () => (
        <div className="followed-artists-section">
            <Card>
                <Card.Header className="bg-white">
                    <h5 className="mb-0">
                        <FontAwesomeIcon icon={faUsers} className="me-2 text-primary" />
                        Artistes Suivis ({followedArtists.length})
                    </h5>
                </Card.Header>
                <Card.Body>
                    {followedArtists.length > 0 ? (
                        <Row className="g-3">
                            {followedArtists.map(artist => (
                                <Col md={4} key={artist.id}>
                                    <Card className="artist-card text-center">
                                        <Card.Body className="p-4">
                                            <img
                                                src={artist.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.name)}&color=7F9CF5&background=EBF4FF&size=80`}
                                                alt={artist.name}
                                                className="artist-avatar mb-3"
                                            />
                                            <h6 className="fw-bold">{artist.name}</h6>
                                            <p className="text-muted small">{artist.bio || 'Artiste talentueux'}</p>
                                            <div className="artist-stats mb-3">
                                                <small className="text-muted">
                                                    {formatNumber(artist.followers_count || 0)} followers •{' '}
                                                    {formatNumber(artist.sounds_count || 0)} sons
                                                </small>
                                            </div>
                                            <div className="d-flex gap-2 justify-content-center">
                                                <Button variant="outline-primary" size="sm" as={Link} to={`/artists/${artist.id}`}>
                                                    <FontAwesomeIcon icon={faEye} />
                                                </Button>
                                                <Button variant="outline-danger" size="sm">
                                                    <FontAwesomeIcon icon={faUserMinus} />
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <div className="text-center py-4">
                            <FontAwesomeIcon icon={faUsers} size="3x" className="text-muted mb-3" />
                            <h5>Aucun artiste suivi</h5>
                            <p className="text-muted">Découvrez et suivez vos artistes favoris</p>
                            <Button as={Link} to="/artists" variant="primary">
                                Découvrir des artistes
                            </Button>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );

    // Vérification de l'authentification
    if (authLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <div className="text-center">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Vérification de l'authentification...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <div className="text-center">
                    <FontAwesomeIcon icon={faUser} size="3x" className="text-muted mb-3" />
                    <h4 className="text-muted">Authentification requise</h4>
                    <p className="text-muted mb-4">Veuillez vous connecter pour accéder à votre profil</p>
                    <Button as={Link} to="/login" variant="primary">
                        Se connecter
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="social-profile">
            {/* Header Profil Style Réseau Social */}
            <div className="profile-header">
                <Container>
                    <Row className="align-items-center py-4">
                        <Col md={3} className="text-center">
                            <div className="profile-avatar">
                                <img
                                    src={user?.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&color=7F9CF5&background=EBF4FF&size=150`}
                                    alt={user?.name}
                                    className="rounded-circle profile-img"
                                />
                                <Button
                                    variant="light"
                                    size="sm"
                                    className="edit-profile-btn"
                                    as={Link}
                                    to="/profile/edit"
                                >
                                    <FontAwesomeIcon icon={faCamera} />
                                </Button>
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="profile-info">
                                <h2 className="profile-name">{user?.name}</h2>
                                <p className="profile-bio">
                                    {user?.bio || 'Passionné de musique camerounaise 🎵'}
                                </p>
                                <div className="profile-stats">
                                    <div className="stat-item">
                                        <span className="stat-number">{purchasedSounds.length}</span>
                                        <span className="stat-label">Sons achetés</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-number">{favoriteSounds.length}</span>
                                        <span className="stat-label">Favoris</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-number">{followedArtists.length}</span>
                                        <span className="stat-label">Artistes suivis</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-number">{mySounds.length}</span>
                                        <span className="stat-label">Mes créations</span>
                                    </div>
                                </div>
                            </div>
                        </Col>
                        <Col md={3} className="text-end">
                            <div className="profile-actions">
                                <Button
                                    variant="outline-light"
                                    className="me-2"
                                    as={Link}
                                    to="/profile/edit"
                                >
                                    <FontAwesomeIcon icon={faEdit} className="me-1" />
                                    Modifier
                                </Button>
                                <Button variant="light" as={Link} to="/upload">
                                    <FontAwesomeIcon icon={faUpload} className="me-1" />
                                    Upload
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Navigation Tabs */}
            <div className="profile-nav">
                <Container>
                    <Nav variant="pills" className="justify-content-center">
                        <Nav.Item>
                            <Nav.Link
                                active={activeTab === 'library'}
                                onClick={() => setActiveTab('library')}
                                className="nav-pill"
                            >
                                <FontAwesomeIcon icon={faMusic} className="me-2" />
                                Bibliothèque Musicale
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link
                                active={activeTab === 'events'}
                                onClick={() => setActiveTab('events')}
                                className="nav-pill"
                            >
                                <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                                Événements
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link
                                active={activeTab === 'content'}
                                onClick={() => setActiveTab('content')}
                                className="nav-pill"
                            >
                                <FontAwesomeIcon icon={faVideo} className="me-2" />
                                Mes Créations
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link
                                active={activeTab === 'artists'}
                                onClick={() => setActiveTab('artists')}
                                className="nav-pill"
                            >
                                <FontAwesomeIcon icon={faUsers} className="me-2" />
                                Artistes Suivis
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>
                </Container>
            </div>

            {/* Contenu Principal */}
            <Container className="py-4">
                {isLoading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" size="lg" />
                        <p className="mt-3">Chargement de vos données...</p>
                    </div>
                ) : (
                    <>
                        {/* Bibliothèque Musicale */}
                        {activeTab === 'library' && (
                            <div className="music-library">
                                {/* Contrôles de la bibliothèque */}
                                <Card className="library-controls mb-4">
                                    <Card.Body className="p-3">
                                        <Row className="align-items-center">
                                            <Col md={4}>
                                                <InputGroup>
                                                    <InputGroup.Text>
                                                        <FontAwesomeIcon icon={faSearch} />
                                                    </InputGroup.Text>
                                                    <Form.Control
                                                        type="text"
                                                        placeholder="Rechercher dans ma bibliothèque..."
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                    />
                                                </InputGroup>
                                            </Col>
                                            <Col md={3}>
                                                <Form.Select
                                                    value={filterBy}
                                                    onChange={(e) => setFilterBy(e.target.value)}
                                                >
                                                    <option value="all">Tous les sons</option>
                                                    <option value="free">Sons gratuits</option>
                                                    <option value="paid">Sons achetés</option>
                                                    <option value="liked">Favoris</option>
                                                </Form.Select>
                                            </Col>
                                            <Col md={3}>
                                                <Form.Select
                                                    value={sortBy}
                                                    onChange={(e) => setSortBy(e.target.value)}
                                                >
                                                    <option value="recent">Plus récents</option>
                                                    <option value="name">Par titre</option>
                                                    <option value="artist">Par artiste</option>
                                                    <option value="duration">Par durée</option>
                                                </Form.Select>
                                            </Col>
                                            <Col md={2} className="text-end">
                                                <Button
                                                    variant={viewMode === 'grid' ? 'primary' : 'outline-secondary'}
                                                    size="sm"
                                                    onClick={() => setViewMode('grid')}
                                                    className="me-1"
                                                >
                                                    <FontAwesomeIcon icon={faMusic} />
                                                </Button>
                                                <Button
                                                    variant={viewMode === 'list' ? 'primary' : 'outline-secondary'}
                                                    size="sm"
                                                    onClick={() => setViewMode('list')}
                                                >
                                                    <FontAwesomeIcon icon={faSort} />
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                {/* Affichage des sons */}
                                {renderMusicLibrary()}
                            </div>
                        )}

                        {/* Autres onglets */}
                        {activeTab === 'events' && renderEvents()}
                        {activeTab === 'content' && renderMyContent()}
                        {activeTab === 'artists' && renderFollowedArtists()}
                    </>
                )}
            </Container>

            {/* Lecteur Audio Avancé */}
            {showMusicPlayer && currentPlaying && (
                <div className="advanced-music-player">
                    <Card className="player-card">
                        <Card.Body className="p-4">
                            <Row className="align-items-center">
                                <Col md={3}>
                                    <div className="d-flex align-items-center">
                                        <img
                                            src={currentPlaying.cover_image_url || currentPlaying.cover || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=60&h=60&fit=crop`}
                                            alt={currentPlaying.title}
                                            className="player-cover me-3"
                                        />
                                        <div>
                                            <h6 className="fw-bold mb-0">{currentPlaying.title}</h6>
                                            <small className="text-muted">{currentPlaying.artist || currentPlaying.user?.name}</small>
                                        </div>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="player-controls text-center">
                                        <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                onClick={() => setIsShuffled(!isShuffled)}
                                                className={isShuffled ? 'active' : ''}
                                            >
                                                <FontAwesomeIcon icon={faRandom} />
                                            </Button>
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                onClick={handlePreviousTrack}
                                                disabled={currentPlaylist.length <= 1}
                                            >
                                                <FontAwesomeIcon icon={faStepBackward} />
                                            </Button>
                                            <Button
                                                variant={isPlaying ? "warning" : "success"}
                                                onClick={() => handlePlayPause(currentPlaying)}
                                                className="play-btn-main"
                                            >
                                                <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
                                            </Button>
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                onClick={handleNextTrack}
                                                disabled={currentPlaylist.length <= 1}
                                            >
                                                <FontAwesomeIcon icon={faStepForward} />
                                            </Button>
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                onClick={() => setIsRepeated(!isRepeated)}
                                                className={isRepeated ? 'active' : ''}
                                            >
                                                <FontAwesomeIcon icon={faRepeat} />
                                            </Button>
                                        </div>
                                        <div className="progress-controls">
                                            <div className="d-flex align-items-center gap-2">
                                                <small>{formatTime(currentTime)}</small>
                                                <ProgressBar
                                                    now={duration > 0 ? (currentTime / duration) * 100 : 0}
                                                    className="flex-grow-1 music-progress"
                                                    style={{ height: '6px', cursor: 'pointer' }}
                                                    onClick={(e) => {
                                                        const rect = e.target.getBoundingClientRect();
                                                        const clickX = e.clientX - rect.left;
                                                        const newTime = (clickX / rect.width) * duration;
                                                        handleSeek(newTime);
                                                    }}
                                                />
                                                <small>{formatTime(duration)}</small>
                                            </div>
                                        </div>
                                    </div>
                                </Col>
                                <Col md={3}>
                                    <div className="d-flex align-items-center justify-content-end gap-3">
                                        {/* Actions du son */}
                                        {!currentPlaying.is_free && currentPlaying.price > 0 && (
                                            <Button
                                                variant="success"
                                                size="sm"
                                                onClick={() => handleAddToCart(currentPlaying)}
                                                disabled={isInCart(currentPlaying.id, 'sound')}
                                            >
                                                <FontAwesomeIcon icon={faShoppingCart} className="me-1" />
                                                {isInCart(currentPlaying.id, 'sound') ? 'Dans le panier' : formatCurrency(currentPlaying.price)}
                                            </Button>
                                        )}
                                        
                                        {/* Contrôle du volume */}
                                        <div className="volume-control d-flex align-items-center gap-2">
                                            <FontAwesomeIcon 
                                                icon={volume === 0 ? faVolumeMute : faVolumeUp} 
                                                className="text-muted"
                                            />
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.1"
                                                value={volume}
                                                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                                className="volume-slider"
                                            />
                                        </div>
                                        
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() => setShowMusicPlayer(false)}
                                        >
                                            <FontAwesomeIcon icon={faTimes} />
                                        </Button>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </div>
            )}

            {/* Audio element */}
            <audio ref={audioRef} />

            <style jsx>{`
                .social-profile {
                    min-height: 100vh;
                    background: #f8f9fa;
                }

                .profile-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    position: relative;
                    overflow: hidden;
                }

                .profile-header::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="80" r="1" fill="rgba(255,255,255,0.1)"/></svg>');
                    animation: float 20s infinite linear;
                }

                @keyframes float {
                    0% { transform: translateY(0px) rotate(0deg); }
                    100% { transform: translateY(-100px) rotate(360deg); }
                }

                .profile-avatar {
                    position: relative;
                    display: inline-block;
                }

                .profile-img {
                    width: 120px;
                    height: 120px;
                    object-fit: cover;
                    border: 4px solid rgba(255,255,255,0.2);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                }

                .edit-profile-btn {
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    border: 2px solid white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .profile-name {
                    font-size: 2rem;
                    font-weight: bold;
                    margin-bottom: 0.5rem;
                }

                .profile-bio {
                    font-size: 1.1rem;
                    opacity: 0.9;
                    margin-bottom: 1.5rem;
                }

                .profile-stats {
                    display: flex;
                    gap: 2rem;
                }

                .stat-item {
                    text-align: center;
                }

                .stat-number {
                    display: block;
                    font-size: 1.5rem;
                    font-weight: bold;
                }

                .stat-label {
                    display: block;
                    font-size: 0.85rem;
                    opacity: 0.8;
                }

                .profile-nav {
                    background: white;
                    border-bottom: 1px solid #e9ecef;
                    padding: 1rem 0;
                }

                .nav-pill {
                    border-radius: 25px;
                    padding: 12px 24px;
                    margin: 0 8px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }

                .nav-pill:hover {
                    background: #f8f9fa;
                }

                .nav-pill.active {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                }

                .library-controls {
                    border: none;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.08);
                    border-radius: 15px;
                }

                .music-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 1.5rem;
                }

                .music-card {
                    border: none;
                    border-radius: 15px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                    transition: all 0.3s ease;
                    animation: fadeInUp 0.6s ease-out;
                }

                .music-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 30px rgba(0,0,0,0.15);
                }

                .music-cover {
                    position: relative;
                    border-radius: 15px 15px 0 0;
                    overflow: hidden;
                }

                .cover-image {
                    width: 100%;
                    height: 200px;
                    object-fit: cover;
                }

                .play-overlay {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    opacity: 0;
                    transition: all 0.3s ease;
                }

                .music-cover:hover .play-overlay {
                    opacity: 1;
                }

                .play-btn-overlay {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    background: rgba(255,255,255,0.9);
                }

                .price-badge {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                }

                .sound-title {
                    font-weight: bold;
                    margin-bottom: 0.25rem;
                }

                .sound-artist {
                    color: #6c757d;
                    font-size: 0.9rem;
                    margin-bottom: 0.5rem;
                }

                .sound-meta {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 1rem;
                }

                .sound-actions {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }

                .music-list {
                    border: none;
                    border-radius: 15px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.08);
                }

                .music-list-item {
                    border-bottom: 1px solid #f8f9fa;
                    transition: all 0.3s ease;
                    animation: fadeInLeft 0.6s ease-out;
                }

                .music-list-item:hover {
                    background: #f8f9fa;
                }

                .music-list-item.playing {
                    background: linear-gradient(135deg, #667eea20, #764ba220);
                }

                .list-cover {
                    width: 50px;
                    height: 50px;
                    object-fit: cover;
                    border-radius: 8px;
                }

                .advanced-music-player {
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    right: 20px;
                    z-index: 1050;
                    animation: slideInUp 0.5s ease-out;
                }

                .player-card {
                    border: none;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                    border-radius: 20px;
                    background: rgba(255,255,255,0.95);
                    backdrop-filter: blur(20px);
                }

                .player-cover {
                    width: 60px;
                    height: 60px;
                    border-radius: 12px;
                    object-fit: cover;
                }

                .play-btn-main {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    font-size: 1.2rem;
                    border: none;
                }

                .music-progress {
                    border-radius: 3px;
                }

                .music-progress .progress-bar {
                    background: linear-gradient(90deg, #667eea, #764ba2);
                    border-radius: 3px;
                }

                .volume-slider {
                    width: 80px;
                    height: 4px;
                    background: #e9ecef;
                    border-radius: 2px;
                    outline: none;
                }

                .volume-slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #667eea;
                    cursor: pointer;
                }

                .event-card {
                    border: none;
                    border-radius: 12px;
                    box-shadow: 0 2px 15px rgba(0,0,0,0.08);
                    transition: all 0.3s ease;
                }

                .event-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 25px rgba(0,0,0,0.12);
                }

                .event-date {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    border-radius: 12px;
                    padding: 15px;
                    text-align: center;
                    min-width: 70px;
                }

                .date-number {
                    font-size: 1.5rem;
                    font-weight: bold;
                    display: block;
                }

                .date-month {
                    font-size: 0.8rem;
                    text-transform: uppercase;
                }

                .artist-avatar {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    object-fit: cover;
                }

                .artist-card {
                    border: none;
                    border-radius: 15px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                    transition: all 0.3s ease;
                }

                .artist-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 30px rgba(0,0,0,0.15);
                }

                .clip-thumb {
                    width: 50px;
                    height: 50px;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                }

                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes fadeInLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateY(100px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @media (max-width: 768px) {
                    .profile-stats {
                        gap: 1rem;
                    }

                    .stat-number {
                        font-size: 1.2rem;
                    }

                    .advanced-music-player {
                        left: 10px;
                        right: 10px;
                        bottom: 10px;
                    }

                    .profile-header .row {
                        text-align: center;
                    }

                    .profile-actions {
                        margin-top: 1rem;
                        text-align: center;
                    }

                    .music-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

export default Profile;
