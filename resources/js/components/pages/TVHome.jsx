import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faVolumeUp, faVolumeMute, faExpand, faCompress,
    faMusic, faPlay, faPause, faHeart, faComment, faShare
} from '@fortawesome/free-solid-svg-icons';

const TVHome = () => {
    const [currentMedia, setCurrentMedia] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [animationClass, setAnimationClass] = useState('');
    const [visualizerStyle, setVisualizerStyle] = useState({});
    const [hasUserInteracted, setHasUserInteracted] = useState(false);
    const [likes, setLikes] = useState(0);
    const [comments, setComments] = useState(0);
    const [shares, setShares] = useState(0);
    const mediaRef = useRef(null);

    // Données de test avec les fichiers locaux
    const mediaContent = [
        {
            id: 1,
            title: "GIMS - Ceci n'est pas du rap",
            artist: "GIMS ft. Niro",
            type: "music",
            url: "/music/GIMS - Ceci nest pas du rap (feat. Niro) (Clip Officiel).mp3",
            thumbnail: "https://i.ytimg.com/vi_webp/8WYHDfJDPDc/maxresdefault.webp"
        },
        {
            id: 2,
            title: "Si Te Llamo",
            artist: "GIMS & MALUMA",
            type: "music",
            url: "/music/si_te_llamo.mp3",
            thumbnail: "https://i.ytimg.com/vi_webp/8WYHDfJDPDc/maxresdefault.webp"
        },
        {
            id: 3,
            title: "Video 1",
            artist: "Artiste 1",
            type: "video",
            url: "/video/video-1.mp4"
        },
        {
            id: 4,
            title: "Video 2",
            artist: "Artiste 2",
            type: "video",
            url: "/video/video-2.mp4"
        },
        {
            id: 5,
            title: "Video 3",
            artist: "Artiste 3",
            type: "video",
            url: "/video/video-3.mp4"
        }
    ];

    useEffect(() => {
        // Initialiser le premier média aléatoirement
        const randomIndex = Math.floor(Math.random() * mediaContent.length);
        setCurrentMedia(mediaContent[randomIndex]);

        // Démarrer les animations
        startAnimations();

        // Ajouter un écouteur pour la première interaction utilisateur
        const handleFirstInteraction = () => {
            setHasUserInteracted(true);
            if (mediaRef.current) {
                mediaRef.current.muted = false;
                setIsMuted(false);
            }
            document.removeEventListener('click', handleFirstInteraction);
            document.removeEventListener('touchstart', handleFirstInteraction);
        };

        document.addEventListener('click', handleFirstInteraction);
        document.addEventListener('touchstart', handleFirstInteraction);

        return () => {
            document.removeEventListener('click', handleFirstInteraction);
            document.removeEventListener('touchstart', handleFirstInteraction);
        };
    }, []);

    const startAnimations = () => {
        // Animation du visualiseur
        const animateVisualizer = () => {
            const heights = Array.from({length: 5}, () => Math.random() * 40 + 10);
            setVisualizerStyle({
                '--bar-1-height': `${heights[0]}px`,
                '--bar-2-height': `${heights[1]}px`,
                '--bar-3-height': `${heights[2]}px`,
                '--bar-4-height': `${heights[3]}px`,
                '--bar-5-height': `${heights[4]}px`,
            });
        };

        // Démarrer l'animation du visualiseur
        const visualizerInterval = setInterval(animateVisualizer, 100);
        return () => clearInterval(visualizerInterval);
    };

    const getRandomMedia = (excludeId = null) => {
        const availableMedia = mediaContent.filter(media => media.id !== excludeId);
        const randomIndex = Math.floor(Math.random() * availableMedia.length);
        return availableMedia[randomIndex];
    };

    const handleMediaEnd = () => {
        // Passer au média suivant aléatoirement
        const nextMedia = getRandomMedia(currentMedia.id);
        setCurrentMedia(nextMedia);

        // Réinitialiser et redémarrer les animations
        setAnimationClass('');
        setTimeout(() => {
            setAnimationClass('animate');
            startAnimations();
        }, 100);
    };

    const toggleMute = () => {
        if (mediaRef.current) {
            mediaRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const togglePlay = () => {
        if (mediaRef.current) {
            if (isPlaying) {
                mediaRef.current.pause();
            } else {
                mediaRef.current.play().catch(error => {
                    console.error("Erreur de lecture:", error);
                });
            }
            setIsPlaying(!isPlaying);
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

    const handleLike = () => {
        setLikes(prev => prev + 1);
    };

    const handleComment = () => {
        setComments(prev => prev + 1);
    };

    const handleShare = () => {
        setShares(prev => prev + 1);
        if (navigator.share) {
            navigator.share({
                title: currentMedia.title,
                text: `Regardez ${currentMedia.title} par ${currentMedia.artist} sur REVEIL ARTIST TV`,
                url: window.location.href
            });
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
                    muted={!hasUserInteracted}
                    onEnded={handleMediaEnd}
                    className="media-player"
                    playsInline
                    controls={false}
                    loop={false}
                    onMouseEnter={() => setShowInfo(true)}
                    onMouseLeave={() => setShowInfo(false)}
                    onTouchStart={() => setShowInfo(true)}
                    onTouchEnd={() => setShowInfo(false)}
                    onLoadedMetadata={() => {
                        if (mediaRef.current && hasUserInteracted) {
                            mediaRef.current.muted = false;
                            mediaRef.current.play().catch(error => {
                                console.error("Erreur de lecture vidéo:", error);
                            });
                        }
                    }}
                />
            );
        } else {
            return (
                <div
                    className={`music-player ${animationClass}`}
                    style={visualizerStyle}
                    onMouseEnter={() => setShowInfo(true)}
                    onMouseLeave={() => setShowInfo(false)}
                    onTouchStart={() => setShowInfo(true)}
                    onTouchEnd={() => setShowInfo(false)}
                >
                    <div className="music-visualizer">
                        <div className="bar bar-1"></div>
                        <div className="bar bar-2"></div>
                        <div className="bar bar-3"></div>
                        <div className="bar bar-4"></div>
                        <div className="bar bar-5"></div>
                    </div>
                    <div className="music-overlay"></div>
                    <img
                        src={currentMedia.thumbnail}
                        alt={currentMedia.title}
                        className="music-thumbnail"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://i.ytimg.com/vi/8WYHDfJDPDc/maxresdefault.jpg";
                        }}
                    />
                    <audio
                        ref={mediaRef}
                        src={currentMedia.url}
                        autoPlay
                        muted={!hasUserInteracted}
                        onEnded={handleMediaEnd}
                        controls={false}
                        loop={false}
                        onLoadedMetadata={() => {
                            if (mediaRef.current && hasUserInteracted) {
                                mediaRef.current.muted = false;
                                mediaRef.current.play().catch(error => {
                                    console.error("Erreur de lecture audio:", error);
                                });
                            }
                        }}
                    />
                </div>
            );
        }
    };

    return (
        <div className="tv-home">
            <div className="background-overlay"></div>
            <div className="tiktok-header">
                <div className="logo">REVEIL ARTIST TV</div>
                <div className="nav-links">
                    <a href="#" className="active">Pour toi</a>
                    <a href="#">Suivis</a>
                    <a href="#">En direct</a>
                </div>
                <div className="header-controls">
                    <Button variant="link" onClick={toggleMute}>
                        <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} />
                    </Button>
                    <Button variant="link" onClick={toggleFullscreen}>
                        <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
                    </Button>
                </div>
            </div>
            <Container fluid className="p-0">
                <Row className="g-0">
                    <Col className="main-media-container">
                        {currentMedia && (
                            <div className="media-wrapper">
                                {renderMedia()}
                                <div className={`media-info-overlay ${showInfo ? 'show' : ''}`}>
                                    <div className="media-info">
                                        <h2>{currentMedia.title}</h2>
                                        <p>{currentMedia.artist}</p>
                                    </div>
                                </div>
                                <div className="media-controls">
                                    <Button variant="link" onClick={togglePlay}>
                                        <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
                                    </Button>
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
                    position: relative;
                    overflow: hidden;
                }

                .tiktok-header {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 1000;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(10px);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 0.5rem 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .logo {
                    color: #fff;
                    font-weight: 600;
                    font-size: 1rem;
                    letter-spacing: 0.5px;
                }

                .nav-links {
                    display: flex;
                    gap: 1.5rem;
                }

                .nav-links a {
                    color: #fff;
                    text-decoration: none;
                    font-size: 0.9rem;
                    opacity: 0.7;
                    transition: all 0.3s ease;
                }

                .nav-links a.active {
                    opacity: 1;
                    font-weight: 500;
                }

                .nav-links a:hover {
                    opacity: 1;
                }

                .header-controls {
                    display: flex;
                    gap: 0.8rem;
                }

                .header-controls .btn {
                    color: white;
                    font-size: 0.9rem;
                    padding: 0.4rem;
                    transition: all 0.3s ease;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .header-controls .btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: scale(1.05);
                }

                .main-media-container {
                    position: relative;
                    height: 100vh;
                    background: #000;
                    overflow: hidden;
                    z-index: 2;
                }

                .media-wrapper {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    background: #000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .media-player {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    position: absolute;
                    top: 0;
                    left: 0;
                }

                .music-player {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #000;
                    position: relative;
                    overflow: hidden;
                }

                .music-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(45deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 100%);
                    z-index: 1;
                }

                .music-player.animate .music-visualizer .bar {
                    animation: equalize 1s ease-in-out infinite;
                }

                .music-visualizer {
                    position: absolute;
                    bottom: 2rem;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    gap: 0.5rem;
                    z-index: 2;
                }

                .music-visualizer .bar {
                    width: 4px;
                    height: var(--bar-height, 20px);
                    background: rgba(255,255,255,0.8);
                    border-radius: 2px;
                    transition: height 0.1s ease;
                }

                .music-visualizer .bar-1 { height: var(--bar-1-height, 20px); }
                .music-visualizer .bar-2 { height: var(--bar-2-height, 20px); }
                .music-visualizer .bar-3 { height: var(--bar-3-height, 20px); }
                .music-visualizer .bar-4 { height: var(--bar-4-height, 20px); }
                .music-visualizer .bar-5 { height: var(--bar-5-height, 20px); }

                @keyframes equalize {
                    0%, 100% { transform: scaleY(1); }
                    50% { transform: scaleY(1.5); }
                }

                .music-thumbnail {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                    width: 100%;
                    height: 100%;
                    filter: brightness(0.9) contrast(1.1);
                    transition: all 0.5s ease;
                }

                .music-player.animate .music-thumbnail {
                    animation: pulse 2s ease-in-out infinite;
                }

                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1) rotate(0deg);
                        filter: brightness(0.9) saturate(1);
                    }
                    50% {
                        transform: scale(1.05) rotate(0.5deg);
                        filter: brightness(1) saturate(1.2);
                    }
                }

                .media-info-overlay {
                    position: absolute;
                    bottom: 1.5rem;
                    right: 1.5rem;
                    padding: 1rem 1.5rem;
                    background: rgba(0,0,0,0.85);
                    color: white;
                    z-index: 10;
                    transform: translateY(100%);
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    border-radius: 8px;
                    max-width: 300px;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .media-info-overlay.show {
                    transform: translateY(0);
                }

                .media-info {
                    text-align: left;
                    position: relative;
                }

                .media-info::before {
                    content: '';
                    position: absolute;
                    left: -1.5rem;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 3px;
                    height: 70%;
                    background: linear-gradient(to bottom, #ff0000, #ff6b6b);
                    border-radius: 3px;
                }

                .media-info h2 {
                    font-size: 1rem;
                    margin-bottom: 0.3rem;
                    font-weight: 600;
                }

                .media-info p {
                    font-size: 0.9rem;
                    opacity: 0.9;
                    margin: 0;
                }

                .media-controls {
                    position: absolute;
                    bottom: 1.5rem;
                    left: 1.5rem;
                    z-index: 10;
                }

                .media-controls .btn {
                    color: white;
                    font-size: 1rem;
                    padding: 0.6rem;
                    transition: all 0.3s ease;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 50%;
                    width: 35px;
                    height: 35px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .media-controls .btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: scale(1.05);
                }

                @media (max-width: 768px) {
                    .tiktok-header {
                        padding: 0.4rem 0.8rem;
                    }

                    .logo {
                        font-size: 0.9rem;
                    }

                    .nav-links {
                        gap: 1rem;
                    }

                    .nav-links a {
                        font-size: 0.8rem;
                    }

                    .header-controls .btn {
                        width: 25px;
                        height: 25px;
                        font-size: 0.8rem;
                    }

                    .media-info-overlay {
                        bottom: 1rem;
                        right: 1rem;
                        padding: 0.8rem 1.2rem;
                        max-width: 250px;
                    }

                    .media-info h2 {
                        font-size: 0.9rem;
                    }

                    .media-info p {
                        font-size: 0.8rem;
                    }

                    .media-controls {
                        bottom: 1rem;
                        left: 1rem;
                    }

                    .media-controls .btn {
                        width: 30px;
                        height: 30px;
                        font-size: 0.9rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default TVHome;
