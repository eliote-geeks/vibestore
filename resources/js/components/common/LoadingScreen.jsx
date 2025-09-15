import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVolumeUp, faMusic, faHeart, faTicketAlt } from '@fortawesome/free-solid-svg-icons';

const LoadingScreen = ({ show = false, message = "Chargement...", style = "modern" }) => {
    if (!show) return null;

    const renderModernLoader = () => (
        <div className="loading-modern">
            <div className="floating-icons">
                <FontAwesomeIcon icon={faVolumeUp} className="floating-icon icon-1" />
                <FontAwesomeIcon icon={faMusic} className="floating-icon icon-2" />
                <FontAwesomeIcon icon={faHeart} className="floating-icon icon-3" />
                <FontAwesomeIcon icon={faTicketAlt} className="floating-icon icon-4" />
            </div>

            <div className="loader-center">
                <div className="pulse-rings">
                    <div className="pulse-ring ring-1"></div>
                    <div className="pulse-ring ring-2"></div>
                    <div className="pulse-ring ring-3"></div>
                </div>
                <div className="logo-pulse">
                    <FontAwesomeIcon icon={faVolumeUp} className="logo-icon" />
                </div>
            </div>

            <div className="loading-text">
                <h4 className="text-white fw-bold mb-2">{message}</h4>
                <div className="loading-dots">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                </div>
            </div>
        </div>
    );

    const renderMinimalLoader = () => (
        <div className="loading-minimal">
            <div className="minimal-spinner">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
            <p className="mt-3 text-muted">{message}</p>
        </div>
    );

    const renderDarkLoader = () => (
        <div className="loading-dark">
            <div className="dark-loader">
                <div className="loader-hexagon">
                    <div className="hexagon"></div>
                    <div className="hexagon"></div>
                    <div className="hexagon"></div>
                    <div className="hexagon"></div>
                    <div className="hexagon"></div>
                    <div className="hexagon"></div>
                    <div className="hexagon"></div>
                </div>
            </div>
            <h5 className="text-light mt-4">{message}</h5>
        </div>
    );

    const getLoader = () => {
        switch (style) {
            case 'minimal': return renderMinimalLoader();
            case 'dark': return renderDarkLoader();
            default: return renderModernLoader();
        }
    };

    return (
        <div className="loading-overlay">
            <div className="loading-content">
                {getLoader()}
            </div>

            <style jsx>{`
                .loading-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: linear-gradient(135deg, var(--primary-purple), var(--primary-blue));
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    animation: fadeIn 0.3s ease-out;
                }

                .loading-content {
                    text-align: center;
                    max-width: 400px;
                    padding: 2rem;
                }

                /* Modern Style */
                .loading-modern {
                    position: relative;
                }

                .floating-icons {
                    position: absolute;
                    width: 300px;
                    height: 300px;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                }

                .floating-icon {
                    position: absolute;
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 1.5rem;
                    animation: float-around 6s infinite ease-in-out;
                }

                .icon-1 {
                    top: 20%;
                    left: 20%;
                    animation-delay: 0s;
                }

                .icon-2 {
                    top: 20%;
                    right: 20%;
                    animation-delay: 1.5s;
                }

                .icon-3 {
                    bottom: 20%;
                    left: 20%;
                    animation-delay: 3s;
                }

                .icon-4 {
                    bottom: 20%;
                    right: 20%;
                    animation-delay: 4.5s;
                }

                .loader-center {
                    position: relative;
                    width: 100px;
                    height: 100px;
                    margin: 0 auto 2rem;
                }

                .pulse-rings {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                }

                .pulse-ring {
                    position: absolute;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    animation: pulse-scale 2s infinite ease-out;
                }

                .ring-1 {
                    width: 60px;
                    height: 60px;
                    top: 20px;
                    left: 20px;
                    animation-delay: 0s;
                }

                .ring-2 {
                    width: 80px;
                    height: 80px;
                    top: 10px;
                    left: 10px;
                    animation-delay: 0.7s;
                }

                .ring-3 {
                    width: 100px;
                    height: 100px;
                    top: 0;
                    left: 0;
                    animation-delay: 1.4s;
                }

                .logo-pulse {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 40px;
                    height: 40px;
                    background: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: logo-bounce 1s infinite ease-in-out;
                }

                .logo-icon {
                    color: var(--primary-purple);
                    font-size: 1.2rem;
                }

                .loading-text {
                    margin-top: 3rem;
                }

                .loading-dots {
                    display: flex;
                    justify-content: center;
                    gap: 0.5rem;
                    margin-top: 1rem;
                }

                .dot {
                    width: 8px;
                    height: 8px;
                    background: white;
                    border-radius: 50%;
                    animation: dot-bounce 1.4s infinite ease-in-out;
                }

                .dot:nth-child(2) {
                    animation-delay: 0.2s;
                }

                .dot:nth-child(3) {
                    animation-delay: 0.4s;
                }

                /* Minimal Style */
                .loading-minimal {
                    background: white;
                    padding: 3rem;
                    border-radius: 16px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                }

                .minimal-spinner {
                    display: flex;
                    justify-content: center;
                }

                /* Dark Style */
                .loading-dark {
                    color: white;
                }

                .dark-loader {
                    position: relative;
                    width: 100px;
                    height: 100px;
                    margin: 0 auto;
                }

                .loader-hexagon {
                    position: relative;
                    width: 100%;
                    height: 100%;
                }

                .hexagon {
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    background: #fff;
                    border-radius: 3px;
                    animation: hexagon-rotate 2.4s infinite ease-in-out;
                }

                .hexagon:nth-child(1) { animation-delay: 0s; }
                .hexagon:nth-child(2) { animation-delay: 0.3s; }
                .hexagon:nth-child(3) { animation-delay: 0.6s; }
                .hexagon:nth-child(4) { animation-delay: 0.9s; }
                .hexagon:nth-child(5) { animation-delay: 1.2s; }
                .hexagon:nth-child(6) { animation-delay: 1.5s; }
                .hexagon:nth-child(7) { animation-delay: 1.8s; }

                /* Animations */
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes float-around {
                    0%, 100% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 0.6;
                    }
                    25% {
                        transform: translateY(-20px) rotate(90deg);
                        opacity: 0.8;
                    }
                    50% {
                        transform: translateY(-10px) rotate(180deg);
                        opacity: 1;
                    }
                    75% {
                        transform: translateY(-15px) rotate(270deg);
                        opacity: 0.8;
                    }
                }

                @keyframes pulse-scale {
                    0% {
                        transform: scale(0);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(1);
                        opacity: 0;
                    }
                }

                @keyframes logo-bounce {
                    0%, 100% {
                        transform: translate(-50%, -50%) scale(1);
                    }
                    50% {
                        transform: translate(-50%, -50%) scale(1.1);
                    }
                }

                @keyframes dot-bounce {
                    0%, 80%, 100% {
                        transform: scale(0);
                        opacity: 0.5;
                    }
                    40% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }

                @keyframes hexagon-rotate {
                    0% {
                        transform: rotate(0deg) translateX(40px) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: rotate(360deg) translateX(40px) rotate(-360deg);
                        opacity: 0;
                    }
                }

                /* Mobile optimizations */
                @media (max-width: 768px) {
                    .loading-content {
                        padding: 1rem;
                    }

                    .floating-icons {
                        width: 250px;
                        height: 250px;
                    }

                    .floating-icon {
                        font-size: 1.2rem;
                    }
                }

                /* Reduce motion for accessibility */
                @media (prefers-reduced-motion: reduce) {
                    .floating-icon,
                    .pulse-ring,
                    .logo-pulse,
                    .dot,
                    .hexagon {
                        animation: none;
                    }

                    .loading-overlay {
                        animation: none;
                    }
                }
            `}</style>
        </div>
    );
};

// Composant pour loading inline
export const InlineLoader = ({ size = 'sm', color = 'primary' }) => {
    const sizes = {
        xs: '12px',
        sm: '16px',
        md: '24px',
        lg: '32px'
    };

    return (
        <div className="inline-loader" style={{ fontSize: sizes[size] }}>
            <div className="spinner-border" role="status" style={{ width: '1em', height: '1em' }}>
                <span className="visually-hidden">Chargement...</span>
            </div>
        </div>
    );
};

// Composant pour loading avec skeleton
export const SkeletonLoader = ({ width = '100%', height = '20px', className = '' }) => {
    return (
        <div
            className={`skeleton-loader ${className}`}
            style={{
                width,
                height,
                background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 37%, #f0f0f0 63%)',
                backgroundSize: '400px 100%',
                animation: 'shimmer 1.5s ease-in-out infinite',
                borderRadius: '4px'
            }}
        />
    );
};

export default LoadingScreen;
