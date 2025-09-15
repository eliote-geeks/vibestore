import React, { useState, useEffect } from 'react';
import { Popover, Button, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faUserPlus, faMusic, faHeart, faEye } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const ArtistPopover = ({ artist, artistId, onFollow }) => {
    const { token } = useAuth();
    const toast = useToast();
    const [artistInfo, setArtistInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);

    useEffect(() => {
        if (artistId) {
            loadArtistInfo();
        }
    }, [artistId]);

    const loadArtistInfo = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/artists/${artistId}`);
            const data = await response.json();

            if (data.success) {
                setArtistInfo(data.artist);
                setIsFollowing(data.artist.is_following || false);
            }
        } catch (error) {
            console.error('Erreur lors du chargement de l\'artiste:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        if (!token) {
            toast.error('Connexion requise', 'Veuillez vous connecter pour suivre des artistes');
            return;
        }

        try {
            const response = await fetch(`/api/artists/${artistId}/follow`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                setIsFollowing(data.is_following);
                toast.success('Succès', data.message);

                if (onFollow) {
                    onFollow(artistId, data.is_following);
                }
            } else {
                toast.error('Erreur', data.message || 'Erreur lors du suivi');
            }
        } catch (error) {
            console.error('Erreur lors du suivi:', error);
            toast.error('Erreur', 'Erreur lors du suivi. Veuillez réessayer.');
        }
    };

    const handleViewProfile = () => {
        // Rediriger vers le profil de l'artiste
        window.location.href = `/artists/${artistId}`;
    };

    return (
        <Popover className="artist-popover">
            <Popover.Header className="d-flex align-items-center">
                <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                <strong>{artist}</strong>
            </Popover.Header>
            <Popover.Body>
                {loading ? (
                    <div className="text-center py-3">
                        <Spinner animation="border" size="sm" className="text-primary" />
                        <p className="text-muted mt-2 mb-0 small">Chargement...</p>
                    </div>
                ) : artistInfo ? (
                    <>
                        <div className="d-flex align-items-center mb-3">
                            <img
                                src={artistInfo.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(artist)}&size=50&background=667eea&color=ffffff`}
                                alt={artist}
                                className="rounded-circle me-3"
                                width="50"
                                height="50"
                            />
                            <div className="flex-grow-1">
                                <h6 className="mb-0 fw-bold">{artist}</h6>
                                <p className="text-muted small mb-0">
                                    {artistInfo.bio ? artistInfo.bio.substring(0, 50) + '...' : 'Artiste passionné'}
                                </p>
                            </div>
                        </div>

                        <div className="row text-center mb-3">
                            <div className="col-4">
                                <div className="fw-bold text-primary">{artistInfo.sounds_count || 0}</div>
                                <small className="text-muted">
                                    <FontAwesomeIcon icon={faMusic} className="me-1" />
                                    Sons
                                </small>
                            </div>
                            <div className="col-4">
                                <div className="fw-bold text-primary">{artistInfo.followers_count || 0}</div>
                                <small className="text-muted">
                                    <FontAwesomeIcon icon={faHeart} className="me-1" />
                                    Abonnés
                                </small>
                            </div>
                            <div className="col-4">
                                <div className="fw-bold text-primary">{artistInfo.total_plays || 0}</div>
                                <small className="text-muted">
                                    <FontAwesomeIcon icon={faEye} className="me-1" />
                                    Écoutes
                                </small>
                            </div>
                        </div>

                        <div className="d-flex gap-2">
                            <Button
                                size="sm"
                                variant={isFollowing ? "outline-primary" : "primary"}
                                className="flex-grow-1"
                                onClick={handleFollow}
                            >
                                <FontAwesomeIcon
                                    icon={faUserPlus}
                                    className="me-1"
                                />
                                {isFollowing ? 'Suivi' : 'Suivre'}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline-secondary"
                                onClick={handleViewProfile}
                            >
                                Profil
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="d-flex align-items-center mb-3">
                            <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(artist)}&size=50&background=667eea&color=ffffff`}
                                alt={artist}
                                className="rounded-circle me-3"
                                width="50"
                                height="50"
                            />
                            <div className="flex-grow-1">
                                <h6 className="mb-0 fw-bold">{artist}</h6>
                                <p className="text-muted small mb-0">Artiste sur Reveil4Artist</p>
                            </div>
                        </div>

                        <div className="d-flex gap-2">
                            <Button
                                size="sm"
                                variant="primary"
                                className="flex-grow-1"
                                onClick={handleFollow}
                            >
                                <FontAwesomeIcon icon={faUserPlus} className="me-1" />
                                Suivre
                            </Button>
                            <Button
                                size="sm"
                                variant="outline-secondary"
                                onClick={handleViewProfile}
                            >
                                Profil
                            </Button>
                        </div>
                    </>
                )}
            </Popover.Body>

            <style jsx>{`
                .artist-popover {
                    max-width: 300px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                    border: none;
                    border-radius: 12px;
                    overflow: hidden;
                }

                .artist-popover .popover-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    font-size: 14px;
                }

                .artist-popover .popover-body {
                    padding: 15px;
                }
            `}</style>
        </Popover>
    );
};

export default ArtistPopover;
