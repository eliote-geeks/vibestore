import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faVolumeUp, faVolumeMute, faExpand, faCompress
} from '@fortawesome/free-solid-svg-icons';

const TVHome = () => {
    const [currentMedia, setCurrentMedia] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const mediaRef = useRef(null);

    // Données de test avec des vidéos et musiques réelles
    const mediaContent = [
        {
            id: 1,
            title: "Diamond Platnumz - Jealous",
            artist: "Diamond Platnumz",
            type: "video",
            url: "https://cdn.vibestore237.cm/videos/diamond-platnumz-jealous.mp4",
            thumbnail: "https://cdn.vibestore237.cm/thumbnails/diamond-platnumz-jealous.jpg",
            duration: "4:15"
        },
        {
            id: 2,
            title: "Davido - Fall",
            artist: "Davido",
            type: "music",
            url: "https://cdn.vibestore237.cm/music/davido-fall.mp3",
            thumbnail: "https://cdn.vibestore237.cm/thumbnails/davido-fall.jpg",
            duration: "3:45"
        },
        {
            id: 3,
            title: "Wizkid - Essence ft. Tems",
            artist: "Wizkid",
            type: "video",
            url: "https://cdn.vibestore237.cm/videos/wizkid-essence.mp4",
            thumbnail: "https://cdn.vibestore237.cm/thumbnails/wizkid-essence.jpg",
            duration: "4:08"
        },
        {
            id: 4,
            title: "Burna Boy - Last Last",
            artist: "Burna Boy",
            type: "music",
            url: "https://cdn.vibestore237.cm/music/burna-boy-last-last.mp3",
            thumbnail: "https://cdn.vibestore237.cm/thumbnails/burna-boy-last-last.jpg",
            duration: "3:36"
        }
    ];

    useEffect(() => {
        // Initialiser le premier média
        if (mediaContent.length > 0) {
            setCurrentMedia(mediaContent[0]);
        }
    }, []);

    const handleMediaEnd = () => {
        // Passer au média suivant
        const currentIndex = mediaContent.findIndex(media => media.id === currentMedia.id);
        const nextIndex = (currentIndex + 1) % mediaContent.length;
        setCurrentMedia(mediaContent[nextIndex]);
    };

    const toggleMute = () => {
        if (mediaRef.current) {
            mediaRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const renderMedia = () => {
        if (!currentMedia) return null;

        if (currentMedia.type === 'video') {
            return (
                <video
                    ref={mediaRef}
                    src={currentMedia.url}
                    autoPlay
                    muted={isMuted}
                    onEnded={handleMediaEnd}
                    className="media-player"
                />
            );
        } else {
            return (
                <div className="music-player">
                    <img
                        src={currentMedia.thumbnail}
                        alt={currentMedia.title}
                        className="music-thumbnail"
                    />
                    <audio
                        ref={mediaRef}
                        src={currentMedia.url}
                        autoPlay
                        muted={isMuted}
                        onEnded={handleMediaEnd}
                    />
                </div>
            );
        }
    };

    return (
        <div className="tv-home">
            <Container fluid className="p-0">
                <Row className="g-0">
                    <Col className="main-media-container">
                        {currentMedia && (
                            <div className="media-wrapper">
                                {renderMedia()}

                                {/* Overlay des contrôles */}
                                <div className="media-controls">
                                    <div className="media-info">
                                        <h2>{currentMedia.title}</h2>
                                        <p>{currentMedia.artist}</p>
                                    </div>
                                    <div className="control-buttons">
                                        <Button variant="link" onClick={toggleMute}>
                                            <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} />
                                        </Button>
                                        <Button variant="link" onClick={toggleFullscreen}>
                                            <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Col>
                </Row>
            </Container>

            <style jsx>{`
                .tv-home {
                    background: #000;
                    min-height: 100vh;
                    padding-top: 70px;
                }

                .main-media-container {
                    position: relative;
                    height: calc(100vh - 70px);
                    background: #000;
                }

                .media-wrapper {
                    position: relative;
                    width: 100%;
                    height: 100%;
                }

                .media-player {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .music-player {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #000;
                }

                .music-thumbnail {
                    max-width: 80%;
                    max-height: 80%;
                    object-fit: contain;
                }

                .media-controls {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 2rem;
                    background: linear-gradient(transparent, rgba(0,0,0,0.8));
                    color: white;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .media-wrapper:hover .media-controls {
                    opacity: 1;
                }

                .media-info {
                    text-align: center;
                }

                .media-info h2 {
                    font-size: 2.5rem;
                    margin: 0;
                    font-weight: 700;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                    letter-spacing: 1px;
                }

                .media-info p {
                    font-size: 1.8rem;
                    margin: 0.5rem 0 0;
                    opacity: 0.9;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                    font-weight: 500;
                }

                .control-buttons {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    display: flex;
                    gap: 1rem;
                }

                .control-buttons .btn {
                    color: white;
                    font-size: 1.2rem;
                    padding: 0.5rem;
                    transition: all 0.3s ease;
                    background: rgba(0,0,0,0.5);
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .control-buttons .btn:hover {
                    color: #ff0000;
                    transform: scale(1.1);
                    background: rgba(0,0,0,0.8);
                }

                @media (max-width: 768px) {
                    .media-info h2 {
                        font-size: 1.8rem;
                    }

                    .media-info p {
                        font-size: 1.4rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default TVHome;
