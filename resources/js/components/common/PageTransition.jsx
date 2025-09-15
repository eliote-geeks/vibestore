import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMusic, faSpinner } from '@fortawesome/free-solid-svg-icons';

// Hook pour détecter si on est sur mobile
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkDevice = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkDevice();
        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    return isMobile;
};

// Hook pour les transitions de pages amélioré
const usePageTransition = () => {
    const location = useLocation();
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [currentPath, setCurrentPath] = useState(location.pathname);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (location.pathname !== currentPath) {
            setIsTransitioning(true);
            setProgress(0);

            // Animation de progression
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + Math.random() * 15;
                });
            }, 100);

            // Scroll vers le haut avec animation
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Transition complète
            const timer = setTimeout(() => {
                setProgress(100);
                setTimeout(() => {
                setCurrentPath(location.pathname);
                setIsTransitioning(false);
                    setProgress(0);
                }, 200);
            }, 800);

            return () => {
                clearTimeout(timer);
                clearInterval(progressInterval);
            };
        }
    }, [location.pathname, currentPath]);

    return { isTransitioning, currentPath, progress };
};

// Composant de loading amélioré
const LoadingOverlay = ({ progress }) => (
    <div className="page-loading-overlay">
        <div className="loading-content">
            <div className="loading-logo-container">
            <div className="loading-logo">
                <img
                    src="/images/reveilart-logo.svg"
                    alt="reveilart"
                    style={{ height: '48px' }}
                    className="loading-logo-img"
                />
            </div>
            <div className="loading-spinner">
                <FontAwesomeIcon icon={faSpinner} className="fa-spin" />
            </div>
            </div>

            <div className="loading-text-container">
            <div className="loading-text">Chargement...</div>
            <div className="loading-progress">
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <div className="progress-text">{Math.round(progress)}%</div>
                </div>
            </div>
        </div>

        <style jsx>{`
            .page-loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, rgba(139, 92, 246, 0.95) 0%, rgba(124, 58, 237, 0.95) 100%);
                backdrop-filter: blur(20px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                animation: fadeIn 0.3s ease-out;
            }

            .loading-content {
                text-align: center;
                color: white;
                padding: 2.5rem;
                border-radius: 1.5rem;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                min-width: 320px;
                max-width: 400px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1.5rem;
            }

            .loading-logo-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1rem;
            }

            .loading-logo {
                display: flex;
                align-items: center;
                justify-content: center;
                animation: float 2s ease-in-out infinite;
            }

            .loading-logo-img {
                filter: brightness(0) invert(1);
                opacity: 0.9;
                display: block;
            }

            .loading-spinner {
                font-size: 1.5rem;
                color: white;
                opacity: 0.8;
                animation: spin 1s linear infinite;
            }

            .loading-text-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1rem;
                width: 100%;
            }

            .loading-text {
                font-size: 1.1rem;
                font-weight: 500;
                opacity: 0.9;
                text-align: center;
                margin: 0;
            }

            .loading-progress {
                width: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.5rem;
            }

            .progress-bar {
                width: 100%;
                height: 6px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 3px;
                overflow: hidden;
                position: relative;
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #f59e0b, #fbbf24);
                border-radius: 3px;
                transition: width 0.3s ease;
                box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
                position: relative;
            }

            .progress-fill::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                animation: shimmer 2s infinite;
            }

            .progress-text {
                font-size: 0.9rem;
                opacity: 0.8;
                font-weight: 600;
                text-align: center;
                min-width: 40px;
            }

            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }

            @keyframes float {
                0%, 100% {
                    transform: translateY(0);
                }
                50% {
                    transform: translateY(-8px);
                }
            }

            @keyframes spin {
                from {
                    transform: rotate(0deg);
                }
                to {
                    transform: rotate(360deg);
                }
            }

            @keyframes shimmer {
                0% {
                    transform: translateX(-100%);
                }
                100% {
                    transform: translateX(100%);
                }
            }

            /* Responsive */
            @media (max-width: 768px) {
                .loading-content {
                    min-width: 280px;
                    padding: 2rem;
                    margin: 1rem;
                }

                .loading-logo-img {
                    height: 40px !important;
                }

                .loading-text {
                    font-size: 1rem;
                }

                .progress-text {
                    font-size: 0.85rem;
                }
            }
        `}</style>
    </div>
);

// Composant pour les éléments animés amélioré
export const AnimatedElement = ({
    children,
    animation = 'slideInUp',
    delay = 0,
    duration = 600,
    className = '',
    threshold = 0.1
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [hasAnimated, setHasAnimated] = useState(false);
    const isMobile = useIsMobile();

    // Intersection Observer pour animations au scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !hasAnimated) {
                        setTimeout(() => {
                        setIsVisible(true);
                            setHasAnimated(true);
                        }, delay);
                    }
                });
            },
            {
                threshold: threshold,
                rootMargin: isMobile ? '50px' : '100px'
            }
        );

        const element = document.querySelector(`[data-animated="${delay}"]`);
        if (element) {
            observer.observe(element);
        }

        return () => observer.disconnect();
    }, [delay, threshold, hasAnimated, isMobile]);

    const animationMap = {
        slideInUp: 'slide-in-up',
        slideInDown: 'slide-in-down',
        slideInLeft: 'slide-in-left',
        slideInRight: 'slide-in-right',
        fadeIn: 'fade-in',
        scaleIn: 'scale-in',
        bounceIn: 'bounce-in',
        rotateIn: 'rotate-in',
        zoomIn: 'zoom-in'
    };

    const animationClass = animationMap[animation] || 'slide-in-up';
    const mobileClass = isMobile ? 'mobile-animation' : '';

    return (
        <div
            data-animated={delay}
            className={`animated-element ${isVisible ? animationClass : 'animate-hidden'} ${mobileClass} ${className}`}
            style={{
                '--animation-duration': `${duration}ms`,
                '--animation-delay': `${delay}ms`
            }}
        >
            {children}

            <style jsx>{`
                .animated-element {
                    transition-duration: var(--animation-duration);
                    transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    will-change: transform, opacity;
                }

                .animate-hidden {
                    opacity: 0;
                    transform: translateY(40px);
                }

                .slide-in-up {
                    opacity: 1;
                    transform: translateY(0);
                    transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }

                .slide-in-down {
                    opacity: 1;
                    transform: translateY(0);
                    transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }

                .slide-in-left {
                    opacity: 1;
                    transform: translateX(0);
                    transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }

                .slide-in-right {
                    opacity: 1;
                    transform: translateX(0);
                    transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }

                .fade-in {
                    opacity: 1;
                    transition: opacity 0.8s ease;
                }

                .scale-in {
                    opacity: 1;
                    transform: scale(1);
                    transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }

                .bounce-in {
                    opacity: 1;
                    transform: scale(1);
                    transition: all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }

                .rotate-in {
                    opacity: 1;
                    transform: rotate(0deg) scale(1);
                    transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }

                .zoom-in {
                    opacity: 1;
                    transform: scale(1);
                    transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }

                .animate-hidden.scale-in,
                .animate-hidden.bounce-in,
                .animate-hidden.rotate-in,
                .animate-hidden.zoom-in {
                    opacity: 0;
                    transform: scale(0.8);
                }

                .animate-hidden.rotate-in {
                    transform: rotate(-10deg) scale(0.8);
                }

                .animate-hidden.slide-in-down {
                    transform: translateY(-40px);
                }

                .animate-hidden.slide-in-left {
                    transform: translateX(-40px);
                }

                .animate-hidden.slide-in-right {
                    transform: translateX(40px);
                }

                .mobile-animation.animate-hidden {
                    transform: translateY(20px);
                }

                .mobile-animation .slide-in-up,
                .mobile-animation .slide-in-down,
                .mobile-animation .slide-in-left,
                .mobile-animation .slide-in-right {
                    transition-duration: 0.6s;
                }
            `}</style>
        </div>
    );
};

// Composant pour les listes avec animation en cascade
export const AnimatedList = ({ children, staggerDelay = 100, className = '' }) => {
    return (
        <div className={`animated-list ${className}`}>
            {React.Children.map(children, (child, index) => (
                <AnimatedElement key={index} delay={index * staggerDelay}>
                    {child}
                </AnimatedElement>
            ))}
        </div>
    );
};

// Composant principal PageTransition
const PageTransition = ({ children }) => {
    const { isTransitioning, progress } = usePageTransition();

    return (
        <>
            {isTransitioning && <LoadingOverlay progress={progress} />}
            <div className={`page-content ${isTransitioning ? 'page-transitioning' : ''}`}>
                {children}
            </div>

            <style jsx>{`
                .page-content {
                    transition: all 0.3s ease;
                    will-change: transform, opacity;
                }

                .page-transitioning {
                    opacity: 0.3;
                    transform: scale(0.98);
                    pointer-events: none;
                }
            `}</style>
        </>
    );
};

export default PageTransition;
export { usePageTransition, LoadingOverlay };
