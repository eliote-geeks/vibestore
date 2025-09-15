import React, { useState } from 'react';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus,
    faMusic,
    faCalendarAlt,
    faTimes
} from '@fortawesome/free-solid-svg-icons';

const FloatingActionButton = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const closeMenu = () => {
        setIsOpen(false);
    };

    return (
        <>
            <div className={`floating-fab-container ${isOpen ? 'open' : ''}`}>
                {/* Options du menu */}
                <div className={`fab-options ${isOpen ? 'visible' : ''}`}>
                    <OverlayTrigger
                        placement="left"
                        overlay={<Tooltip>Ajouter un son</Tooltip>}
                    >
                        <Button
                            as={Link}
                            to="/add-sound"
                            className="fab-option fab-sound"
                            onClick={closeMenu}
                        >
                            <FontAwesomeIcon icon={faMusic} />
                        </Button>
                    </OverlayTrigger>

                    <OverlayTrigger
                        placement="left"
                        overlay={<Tooltip>Créer un événement</Tooltip>}
                    >
                        <Button
                            as={Link}
                            to="/add-event"
                            className="fab-option fab-event"
                            onClick={closeMenu}
                        >
                            <FontAwesomeIcon icon={faCalendarAlt} />
                        </Button>
                    </OverlayTrigger>
                </div>

                {/* Bouton principal */}
                <Button
                    className="fab-main"
                    onClick={toggleMenu}
                >
                    <FontAwesomeIcon
                        icon={isOpen ? faTimes : faPlus}
                        className={`fab-icon ${isOpen ? 'rotated' : ''}`}
                    />
                </Button>

                {/* Overlay pour fermer quand on clique ailleurs */}
                {isOpen && (
                    <div className="fab-overlay" onClick={closeMenu}></div>
                )}
            </div>

            <style jsx>{`
                .floating-fab-container {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 12px;
                }

                .fab-main {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                    border: none;
                    box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    color: white;
                    position: relative;
                    z-index: 1002;
                }

                .fab-main:hover {
                    background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
                    transform: scale(1.1);
                    box-shadow: 0 8px 25px rgba(139, 92, 246, 0.6);
                    color: white;
                }

                .fab-main:active {
                    transform: scale(0.95);
                }

                .fab-icon {
                    font-size: 20px;
                    transition: transform 0.3s ease;
                }

                .fab-icon.rotated {
                    transform: rotate(45deg);
                }

                .fab-options {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 12px;
                    opacity: 0;
                    visibility: hidden;
                    transform: translateY(20px);
                    transition: all 0.3s ease;
                    pointer-events: none;
                }

                .fab-options.visible {
                    opacity: 1;
                    visibility: visible;
                    transform: translateY(0);
                    pointer-events: all;
                }

                .fab-option {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    border: none;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                    font-size: 16px;
                    text-decoration: none;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    animation: scaleIn 0.3s ease;
                }

                .fab-option:nth-child(1) {
                    animation-delay: 0.1s;
                }

                .fab-option:nth-child(2) {
                    animation-delay: 0.2s;
                }

                .fab-sound {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                }

                .fab-sound:hover {
                    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                    transform: scale(1.1);
                    color: white;
                }

                .fab-event {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                }

                .fab-event:hover {
                    background: linear-gradient(135deg, #059669 0%, #047857 100%);
                    transform: scale(1.1);
                    color: white;
                }

                .fab-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: transparent;
                    z-index: 1001;
                }

                @keyframes scaleIn {
                    0% {
                        opacity: 0;
                        transform: scale(0.3);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1.1);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                /* Animation d'entrée progressive */
                .floating-fab-container.open .fab-option:nth-child(1) {
                    animation: slideInFadeIn 0.3s ease 0.1s both;
                }

                .floating-fab-container.open .fab-option:nth-child(2) {
                    animation: slideInFadeIn 0.3s ease 0.2s both;
                }

                @keyframes slideInFadeIn {
                    0% {
                        opacity: 0;
                        transform: translateX(50px) scale(0.3);
                    }
                    100% {
                        opacity: 1;
                        transform: translateX(0) scale(1);
                    }
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .floating-fab-container {
                        bottom: 20px;
                        right: 20px;
                    }

                    .fab-main {
                        width: 52px;
                        height: 52px;
                    }

                    .fab-option {
                        width: 44px;
                        height: 44px;
                        font-size: 14px;
                    }
                }

                /* Éviter les conflits avec d'autres éléments */
                .floating-fab-container * {
                    box-sizing: border-box;
                }
            `}</style>
        </>
    );
};

export default FloatingActionButton;
