import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Form, Dropdown, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlay, faPause, faStepForward, faStepBackward,
    faVolumeUp, faVolumeDown, faVolumeMute, faRandom,
    faRedo, faListUl, faHeart, faShareAlt, faEllipsisV
} from '@fortawesome/free-solid-svg-icons';

const AudioPlayer = ({ playlist = [], autoplay = false, showPlaylist = true }) => {
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.7);
    const [isMuted, setIsMuted] = useState(false);
    const [isShuffling, setIsShuffling] = useState(false);
    const [isRepeating, setIsRepeating] = useState(false);
    const [showPlaylistPanel, setShowPlaylistPanel] = useState(showPlaylist);

    const audioRef = useRef(null);
    const progressRef = useRef(null);

    const currentTrack = playlist[currentTrackIndex];

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    useEffect(() => {
        if (playlist.length > 0 && autoplay) {
                handlePlay();
            }
    }, [playlist, autoplay]);

    const handlePlay = () => {
        if (audioRef.current) {
            audioRef.current.play();
            setIsPlaying(true);
        }
        };

    const handlePause = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const handlePlayPause = () => {
        if (isPlaying) {
            handlePause();
        } else {
            handlePlay();
        }
        };

    const handleNext = () => {
        if (isShuffling) {
            const randomIndex = Math.floor(Math.random() * playlist.length);
            setCurrentTrackIndex(randomIndex);
        } else {
            setCurrentTrackIndex((prevIndex) =>
                prevIndex < playlist.length - 1 ? prevIndex + 1 : 0
            );
        }
    };

    const handlePrevious = () => {
        setCurrentTrackIndex((prevIndex) =>
            prevIndex > 0 ? prevIndex - 1 : playlist.length - 1
        );
        };

        const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            }
        };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleEnded = () => {
        if (isRepeating) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
            } else {
            handleNext();
        }
    };

    const handleProgressClick = (e) => {
        if (progressRef.current && audioRef.current) {
            const rect = progressRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
            const newTime = (clickX / rect.width) * duration;
            audioRef.current.currentTime = newTime;
        }
    };

    const handleVolumeChange = (newVolume) => {
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    };

    const toggleMute = () => {
        if (isMuted) {
            setVolume(0.7);
            setIsMuted(false);
        } else {
            setVolume(0);
            setIsMuted(true);
        }
    };

    const formatTime = (seconds) => {
        if (!seconds) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleTrackSelect = (index) => {
        setCurrentTrackIndex(index);
        if (isPlaying) {
            setTimeout(() => handlePlay(), 100);
        }
    };

    if (!playlist.length || !currentTrack) {
        return (
            <Card className="border-0 shadow-sm">
                <Card.Body className="text-center p-4">
                    <div className="text-muted">
                        <FontAwesomeIcon icon={faListUl} size="2x" className="mb-3" />
                        <p>Aucun son disponible dans votre bibliothèque</p>
            </div>
                </Card.Body>
            </Card>
        );
    }

        return (
        <div className="audio-player-container">
            {/* Lecteur audio principal */}
            <Card className="border-0 shadow-sm mb-3" style={{ borderRadius: '16px' }}>
                <Card.Body className="p-3">
                    <div className="d-flex align-items-center">
                        {/* Couverture du track */}
                        <div className="me-3">
                            <img
                                src={currentTrack.cover || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=80&h=80&fit=crop"}
                                alt={currentTrack.title}
                                className="rounded"
                                style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                            />
                        </div>

                        {/* Informations du track */}
                        <div className="flex-grow-1 me-3">
                            <h6 className="fw-bold mb-1">{currentTrack.title}</h6>
                            <p className="text-muted mb-2 small">{currentTrack.artist}</p>

                            {/* Barre de progression */}
                            <div className="d-flex align-items-center">
                                <span className="small text-muted me-2">{formatTime(currentTime)}</span>
                        <div
                            ref={progressRef}
                                    className="progress flex-grow-1 me-2"
                                    style={{ height: '4px', cursor: 'pointer' }}
                            onClick={handleProgressClick}
                        >
                            <div
                                className="progress-bar bg-primary"
                                        style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                            />
                        </div>
                                <span className="small text-muted">{formatTime(duration)}</span>
                        </div>
                    </div>

                        {/* Contrôles de lecture */}
                        <div className="d-flex align-items-center gap-2">
                        <Button
                            variant="outline-secondary"
                            size="sm"
                                onClick={handlePrevious}
                                className="rounded-circle"
                                style={{ width: '36px', height: '36px' }}
                        >
                                <FontAwesomeIcon icon={faStepBackward} style={{ fontSize: '12px' }} />
                        </Button>

                    <Button
                                variant={isPlaying ? "outline-primary" : "primary"}
                                size="sm"
                                onClick={handlePlayPause}
                        className="rounded-circle"
                                style={{ width: '44px', height: '44px' }}
                    >
                        <FontAwesomeIcon
                                    icon={isPlaying ? faPause : faPlay}
                                    style={{ fontSize: '16px' }}
                        />
                    </Button>

                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={handleNext}
                                className="rounded-circle"
                                style={{ width: '36px', height: '36px' }}
                            >
                                <FontAwesomeIcon icon={faStepForward} style={{ fontSize: '12px' }} />
                            </Button>
                        </div>

                        {/* Contrôles additionnels */}
                        <div className="d-flex align-items-center gap-2 ms-3">
                            <Button
                                variant={isShuffling ? "primary" : "outline-secondary"}
                                size="sm"
                                onClick={() => setIsShuffling(!isShuffling)}
                                className="rounded-circle"
                                style={{ width: '32px', height: '32px' }}
                            >
                                <FontAwesomeIcon icon={faRandom} style={{ fontSize: '10px' }} />
                            </Button>

                            <Button
                                variant={isRepeating ? "primary" : "outline-secondary"}
                                size="sm"
                                onClick={() => setIsRepeating(!isRepeating)}
                                className="rounded-circle"
                                style={{ width: '32px', height: '32px' }}
                            >
                                <FontAwesomeIcon icon={faRedo} style={{ fontSize: '10px' }} />
                            </Button>

                            {/* Contrôle de volume */}
                    <div className="d-flex align-items-center gap-2">
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={toggleMute}
                                    className="rounded-circle"
                                    style={{ width: '32px', height: '32px' }}
                                >
                                    <FontAwesomeIcon
                                        icon={isMuted ? faVolumeMute : volume > 0.5 ? faVolumeUp : faVolumeDown}
                                        style={{ fontSize: '10px' }}
                                    />
                                </Button>
                                <Form.Range
                                    value={volume}
                                    min={0}
                                    max={1}
                                    step={0.1}
                                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                    style={{ width: '80px' }}
                                />
                        </div>

                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => setShowPlaylistPanel(!showPlaylistPanel)}
                                className="rounded-circle"
                                style={{ width: '32px', height: '32px' }}
                            >
                                <FontAwesomeIcon icon={faListUl} style={{ fontSize: '10px' }} />
                            </Button>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Panel de playlist */}
            {showPlaylistPanel && (
                <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                    <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
                        <h6 className="fw-bold mb-0">
                            <FontAwesomeIcon icon={faListUl} className="me-2" />
                            Ma Bibliothèque ({playlist.length} sons)
                        </h6>
                        <Button
                            variant="link"
                            size="sm"
                            onClick={() => setShowPlaylistPanel(false)}
                            className="text-muted p-0"
                        >
                            ×
                        </Button>
                    </Card.Header>
                    <Card.Body className="p-0" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {playlist.map((track, index) => (
                            <div
                                key={track.id}
                                className={`d-flex align-items-center p-3 border-bottom playlist-item ${
                                    index === currentTrackIndex ? 'bg-light' : ''
                                }`}
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleTrackSelect(index)}
                            >
                                <div className="me-3">
                                    <img
                                        src={track.cover || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=40&h=40&fit=crop"}
                                        alt={track.title}
                                        className="rounded"
                                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                    />
                                </div>
                                <div className="flex-grow-1">
                                    <div className="fw-medium">{track.title}</div>
                                    <div className="small text-muted">{track.artist}</div>
                                </div>
                                <div className="text-end">
                                    <div className="small text-muted">{track.duration}</div>
                                    {track.is_favorite && (
                                        <FontAwesomeIcon icon={faHeart} className="text-danger small" />
                                    )}
                                </div>
                                {index === currentTrackIndex && isPlaying && (
                                    <div className="ms-2">
                                        <div className="audio-wave">
                                            <div className="bar"></div>
                                            <div className="bar"></div>
                                            <div className="bar"></div>
                                        </div>
                    </div>
                )}
                            </div>
                        ))}
            </Card.Body>
        </Card>
            )}

            {/* Audio element */}
            <audio
                ref={audioRef}
                src={currentTrack.file_url}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                preload="metadata"
            />

            <style jsx>{`
                .playlist-item:hover {
                    background-color: #f8f9fa !important;
                }

                .audio-wave {
                    display: flex;
                    align-items: end;
                    gap: 1px;
                    height: 16px;
                }

                .audio-wave .bar {
                    width: 2px;
                    background: var(--bs-primary);
                    animation: wave 1s ease-in-out infinite;
                }

                .audio-wave .bar:nth-child(2) {
                    animation-delay: 0.2s;
                }

                .audio-wave .bar:nth-child(3) {
                    animation-delay: 0.4s;
                }

                @keyframes wave {
                    0%, 100% { height: 4px; }
                    50% { height: 16px; }
                }
            `}</style>
        </div>
    );
};

export default AudioPlayer;
