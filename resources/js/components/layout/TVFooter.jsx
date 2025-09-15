import React from 'react';

const TVFooter = () => {
    return (
        <footer className="tv-footer">
            <div className="footer-content">
                <div className="footer-info">
                    <span className="channel-name">REVEIL ARTIST TV</span>
                </div>
                <div className="footer-links">
                    <a href="/tv/about">À propos</a>
                    <a href="/tv/contact">Contact</a>
                    <a href="/tv/legal">Mentions légales</a>
                </div>
            </div>

            <style jsx>{`
                .tv-footer {
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(10px);
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 0.5rem 0;
                    color: white;
                }

                .footer-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 1rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .footer-info {
                    display: flex;
                    flex-direction: column;
                }

                .channel-name {
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: rgba(255, 255, 255, 0.9);
                }

                .footer-links {
                    display: flex;
                    gap: 1.5rem;
                }

                .footer-links a {
                    color: rgba(255, 255, 255, 0.7);
                    text-decoration: none;
                    font-size: 0.8rem;
                    transition: all 0.3s ease;
                }

                .footer-links a:hover {
                    color: rgba(255, 255, 255, 0.9);
                }

                @media (max-width: 768px) {
                    .footer-content {
                        flex-direction: column;
                        gap: 0.5rem;
                        text-align: center;
                    }

                    .footer-links {
                        gap: 1rem;
                    }

                    .channel-name {
                        font-size: 0.8rem;
                    }

                    .footer-links a {
                        font-size: 0.7rem;
                    }
                }
            `}</style>
        </footer>
    );
};

export default TVFooter;
