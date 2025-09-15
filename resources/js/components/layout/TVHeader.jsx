import React from 'react';
import { Navbar, Container, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVolumeUp, faVolumeMute, faExpand, faCompress } from '@fortawesome/free-solid-svg-icons';

const TVHeader = () => {
    const [isMuted, setIsMuted] = React.useState(false);
    const [isFullscreen, setIsFullscreen] = React.useState(false);

    const toggleMute = () => {
        setIsMuted(!isMuted);
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

    return (
        <Navbar bg="dark" variant="dark" fixed="top" className="tv-header">
            <Container fluid>
                <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
                    <span className="brand-text">REVEIL ARTIST TV</span>
                </Navbar.Brand>
                <Nav className="me-auto">
                    <Nav.Link as={Link} to="/catalog" className="tv-nav-link">Pour toi</Nav.Link>
                    <Nav.Link as={Link} to="/clips" className="tv-nav-link">Suivis</Nav.Link>
                    <Nav.Link as={Link} to="/competitions" className="tv-nav-link">En direct</Nav.Link>
                </Nav>
                <div className="d-flex align-items-center">
                    <button className="btn btn-link text-white me-2" onClick={toggleMute}>
                        <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} />
                    </button>
                    <button className="btn btn-link text-white" onClick={toggleFullscreen}>
                        <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
                    </button>
                </div>
            </Container>

            <style jsx>{`
                .tv-header {
                    background: rgba(0, 0, 0, 0.8) !important;
                    backdrop-filter: blur(10px);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 0.4rem 0;
                    height: 50px;
                }

                .brand-text {
                    font-size: 1rem;
                    font-weight: 600;
                    color: #fff;
                    letter-spacing: 0.5px;
                }

                .tv-nav-link {
                    color: rgba(255, 255, 255, 0.7) !important;
                    font-weight: 500;
                    padding: 0.3rem 1rem !important;
                    transition: all 0.3s ease;
                    font-size: 0.9rem;
                }

                .tv-nav-link:hover {
                    color: #fff !important;
                }

                .btn-link {
                    padding: 0.3rem;
                    font-size: 0.9rem;
                    transition: all 0.3s ease;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .btn-link:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: scale(1.05);
                }

                @media (max-width: 768px) {
                    .brand-text {
                        font-size: 0.9rem;
                    }

                    .tv-nav-link {
                        font-size: 0.8rem;
                        padding: 0.3rem 0.6rem !important;
                    }

                    .btn-link {
                        width: 25px;
                        height: 25px;
                        font-size: 0.8rem;
                    }
                }
            `}</style>
        </Navbar>
    );
};

export default TVHeader;
