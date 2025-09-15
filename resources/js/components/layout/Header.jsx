import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Button, NavDropdown, Badge, Spinner } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUser, faSignInAlt, faUserPlus, faBars, faSignOutAlt,
    faMusic, faUsers, faCalendarAlt, faShoppingCart,
    faSearch, faTh, faPlus, faTimes, faCog, faHeart,
    faTachometerAlt, faUserCircle, faEdit, faHome, faBell,
    faUserCog, faChevronDown, faTrophy, faVideo, faEnvelope
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const Header = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [photoTimestamp, setPhotoTimestamp] = useState(Date.now());
    const location = useLocation();
    const navigate = useNavigate();

    const { user, logout, isAuthenticated, loading, isArtist, isProducer, isAdmin } = useAuth();
    const { getTotalItems } = useCart();
    const cartItemsCount = getTotalItems();

    // Mettre à jour le timestamp de la photo quand l'utilisateur change
    useEffect(() => {
        if (user) {
            setPhotoTimestamp(Date.now());
        }
    }, [user?.profile_photo_url]);

    // Écouter les événements de mise à jour de photo
    useEffect(() => {
        const handlePhotoUpdate = (event) => {
            setPhotoTimestamp(event.detail.timestamp);
        };

        window.addEventListener('photoUpdated', handlePhotoUpdate);

        return () => {
            window.removeEventListener('photoUpdated', handlePhotoUpdate);
        };
    }, []);

    const toggleNavbar = () => {
        setIsOpen(!isOpen);
        setShowMobileMenu(!showMobileMenu);
    };

    const closeMobileMenu = () => {
        setIsOpen(false);
        setShowMobileMenu(false);
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        }
    };

    const canCreateContent = () => {
        return isAdmin();
    };

    if (loading) {
        return (
            <Navbar className="ultra-modern-navbar glass-effect" fixed="top">
                <Container fluid className="px-4">
                    <div className="d-flex align-items-center">
                        <div className="skeleton-loader brand-skeleton"></div>
                        <Spinner size="sm" className="ms-2 text-primary" />
                    </div>
                </Container>
            </Navbar>
        );
    }

    return (
        <>
            <Navbar className="ultra-modern-navbar glass-effect shadow-lg" fixed="top">
                <Container fluid className="px-4">
                    {/* Logo moderne */}
                    <Navbar.Brand as={Link} to="/" className="ultra-modern-brand">
                        <div className="logo-container">
                            <img
                                src="/images/reveilart-logo.svg"
                                alt="Reveil4artist"
                                height="36"
                                className="brand-logo-modern"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                            <div className="fallback-logo" style={{ display: 'none' }}>
                                <FontAwesomeIcon icon={faMusic} />
                            </div>
                        </div>
                        <div className="brand-text-modern">
                            <span className="brand-name">Reveil4artist</span>
                            <span className="brand-tagline">Music Platform</span>
                        </div>
                    </Navbar.Brand>

                    {/* Navigation ultra-moderne - Desktop */}
                    <div className="d-none d-lg-flex flex-grow-1 justify-content-center">
                        <Nav className="ultra-modern-nav">
                            {[
                                { path: '/', icon: faHome, label: 'Accueil' },
                                { path: '/catalog', icon: faMusic, label: 'Catalogue' },
                                // { path: '/clips', icon: faVideo, label: 'Clips' },
                                { path: '/events', icon: faCalendarAlt, label: 'Événements' },
                                // { path: '/competitions', icon: faTrophy, label: 'Compétitions' },
                                { path: '/categories', icon: faTh, label: 'Catégories' },
                                { path: '/about', icon: faUser, label: 'À propos' },
                                { path: '/contact', icon: faEnvelope, label: 'Contact' }
                                // { path: '/artists', icon: faUsers, label: 'Artistes' }
                            ].map((item) => (
                                <Nav.Link
                                    key={item.path}
                                    as={Link}
                                    to={item.path}
                                    className={`nav-pill ${isActive(item.path) ? 'active' : ''}`}
                                >
                                    <FontAwesomeIcon icon={item.icon} className="nav-icon" />
                                    <span className="nav-label">{item.label}</span>
                                    {isActive(item.path) && <div className="active-indicator"></div>}
                                </Nav.Link>
                            ))}
                        </Nav>
                    </div>

                    {/* Actions utilisateur ultra-modernes */}
                    <div className="d-none d-lg-flex align-items-center">
                        {isAuthenticated ? (
                            <div className="user-actions-modern">
                                {/* Bouton Créer moderne */}
                                {canCreateContent() && (
                                    <div className="create-button-modern">
                                        <NavDropdown
                                            title={
                                                <div className="create-trigger">
                                                    <FontAwesomeIcon icon={faPlus} />
                                                    <span>Créer</span>
                                                    <FontAwesomeIcon icon={faChevronDown} className="chevron" />
                                                </div>
                                            }
                                            id="create-dropdown-modern"
                                            className="create-dropdown-modern"
                                        >
                                            <div className="dropdown-modern">
                                                <NavDropdown.Item as={Link} to="/add-sound" className="dropdown-item-modern">
                                                    <div className="item-icon sound">
                                                        <FontAwesomeIcon icon={faMusic} />
                                                    </div>
                                                    <div className="item-content">
                                                        <div className="item-title">Nouveau Son</div>
                                                        <div className="item-subtitle">Partagez votre musique</div>
                                                    </div>
                                                </NavDropdown.Item>
                                                <NavDropdown.Item as={Link} to="/add-event" className="dropdown-item-modern">
                                                    <div className="item-icon event">
                                                        <FontAwesomeIcon icon={faCalendarAlt} />
                                                    </div>
                                                    <div className="item-content">
                                                        <div className="item-title">Nouvel Événement</div>
                                                        <div className="item-subtitle">Organisez un concert</div>
                                                    </div>
                                                </NavDropdown.Item>
                                            </div>
                                        </NavDropdown>
                                    </div>
                                )}

                                {/* Actions rapides */}
                                <div className="quick-actions">
                                    <Nav.Link
                                        as={Link}
                                        to="/cart"
                                        className={`action-button cart ${isActive('/cart') ? 'active' : ''}`}
                                        title="Panier"
                                    >
                                        <FontAwesomeIcon icon={faShoppingCart} />
                                        {cartItemsCount > 0 && (
                                            <Badge pill className="cart-counter">
                                                {cartItemsCount > 99 ? '99+' : cartItemsCount}
                                            </Badge>
                                        )}
                                    </Nav.Link>


                                </div>

                                {/* Menu utilisateur moderne */}
                                <NavDropdown
                                    title={
                                        <div className="user-trigger">
                                            <img
                                                src={`${user.profile_photo_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"}?t=${photoTimestamp}`}
                                                alt={user.name}
                                                className="user-avatar-ultra"
                                                key={photoTimestamp}
                                            />
                                            <div className="user-info-trigger">
                                                <span className="user-name">{user.name}</span>
                                                <Badge className={`role-badge ${user.role}`}>
                                                    {user.role}
                                                </Badge>
                                            </div>
                                            <FontAwesomeIcon icon={faChevronDown} className="chevron" />
                                        </div>
                                    }
                                    id="user-dropdown-ultra"
                                    className="user-dropdown-ultra"
                                    align="end"
                                >
                                    <div className="dropdown-modern user-dropdown">
                                        <div className="dropdown-header-ultra">
                                            <img
                                                src={`${user.profile_photo_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face"}?t=${photoTimestamp}`}
                                                alt={user.name}
                                                className="header-avatar"
                                            />
                                            <div className="header-info">
                                                <div className="header-name">{user.name}</div>
                                                <div className="header-email">{user.email}</div>
                                            </div>
                                        </div>

                                        <div className="dropdown-section">
                                            <NavDropdown.Item as={Link} to="/profile" className="dropdown-item-modern">
                                                <div className="item-icon profile">
                                                    <FontAwesomeIcon icon={faUserCircle} />
                                                </div>
                                                <div className="item-content">
                                                    <div className="item-title">Mon Profil</div>
                                                    <div className="item-subtitle">Voir mes informations</div>
                                                </div>
                                            </NavDropdown.Item>

                                            <NavDropdown.Item as={Link} to="/profile/edit" className="dropdown-item-modern">
                                                <div className="item-icon edit">
                                                    <FontAwesomeIcon icon={faUserCog} />
                                                </div>
                                                <div className="item-content">
                                                    <div className="item-title">Modifier Profil</div>
                                                    <div className="item-subtitle">Éditer mes informations</div>
                                                </div>
                                            </NavDropdown.Item>
                                        </div>

                                        {isAdmin() && (
                                            <div className="dropdown-section">
                                                <NavDropdown.Item as={Link} to="/dashboard" className="dropdown-item-modern">
                                                    <div className="item-icon admin">
                                                        <FontAwesomeIcon icon={faTachometerAlt} />
                                                    </div>
                                                    <div className="item-content">
                                                        <div className="item-title">Dashboard</div>
                                                        <div className="item-subtitle">Administration</div>
                                                    </div>
                                                </NavDropdown.Item>
                                            </div>
                                        )}

                                        <div className="dropdown-section logout-section">
                                            <NavDropdown.Item onClick={handleLogout} className="dropdown-item-modern logout">
                                                <div className="item-icon logout">
                                                    <FontAwesomeIcon icon={faSignOutAlt} />
                                                </div>
                                                <div className="item-content">
                                                    <div className="item-title">Déconnexion</div>
                                                    <div className="item-subtitle">Quitter la session</div>
                                                </div>
                                            </NavDropdown.Item>
                                        </div>
                                    </div>
                                </NavDropdown>
                            </div>
                        ) : (
                            <div className="auth-buttons-modern">
                                <Button
                                    as={Link}
                                    to="/login"
                                    variant="ghost"
                                    className="btn-modern login"
                                >
                                    Connexion
                                </Button>
                                <Button
                                    as={Link}
                                    to="/register"
                                    className="btn-modern signup"
                                >
                                    S'inscrire
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Toggle mobile ultra-moderne */}
                    <Button
                        className="d-lg-none mobile-toggle-ultra"
                        onClick={toggleNavbar}
                    >
                        <span className={`hamburger ${showMobileMenu ? 'active' : ''}`}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </span>
                    </Button>
                </Container>
            </Navbar>

            {/* Menu mobile ultra-moderne */}
            <div className={`mobile-menu-ultra ${showMobileMenu ? 'active' : ''}`}>
                <div className="mobile-menu-backdrop" onClick={closeMobileMenu}></div>
                <div className="mobile-menu-panel">
                    <div className="mobile-header">
                        <div className="mobile-brand">
                            <img src="/images/reveilart-logo.svg" alt="Logo" height="24" />
                            <span>Reveil4artist</span>
                        </div>
                        <Button className="close-btn" onClick={closeMobileMenu}>
                            <FontAwesomeIcon icon={faTimes} />
                        </Button>
                    </div>

                    <div className="mobile-nav-ultra">
                        {[
                            { path: '/', icon: faHome, label: 'Accueil' },
                            { path: '/catalog', icon: faMusic, label: 'Catalogue' },
                            { path: '/clips', icon: faVideo, label: 'Clips' },
                            { path: '/events', icon: faCalendarAlt, label: 'Événements' },
                            { path: '/competitions', icon: faTrophy, label: 'Compétitions' },
                            { path: '/categories', icon: faTh, label: 'Catégories' },
                            { path: '/artists', icon: faUsers, label: 'Artistes' }
                        ].map((item) => (
                            <Nav.Link
                                key={item.path}
                                as={Link}
                                to={item.path}
                                className={`mobile-nav-item-ultra ${isActive(item.path) ? 'active' : ''}`}
                                onClick={closeMobileMenu}
                            >
                                <FontAwesomeIcon icon={item.icon} />
                                <span>{item.label}</span>
                            </Nav.Link>
                        ))}

                        {isAuthenticated && (
                            <>
                                <div className="mobile-divider-ultra"></div>
                                <Nav.Link as={Link} to="/cart" className="mobile-nav-item-ultra" onClick={closeMobileMenu}>
                                    <FontAwesomeIcon icon={faShoppingCart} />
                                    <span>Panier</span>
                                    {cartItemsCount > 0 && (
                                        <Badge pill className="mobile-badge">{cartItemsCount}</Badge>
                                    )}
                                </Nav.Link>
                                <Nav.Link as={Link} to="/mes-creations" className="mobile-nav-item-ultra" onClick={closeMobileMenu}>
                                    <FontAwesomeIcon icon={faHeart} />
                                    <span>Mes Créations</span>
                                </Nav.Link>
                                <Nav.Link as={Link} to="/profile" className="mobile-nav-item-ultra" onClick={closeMobileMenu}>
                                    <FontAwesomeIcon icon={faUserCircle} />
                                    <span>Mon Profil</span>
                                </Nav.Link>
                                <Nav.Link as={Link} to="/profile/edit" className="mobile-nav-item-ultra" onClick={closeMobileMenu}>
                                    <FontAwesomeIcon icon={faUserCog} />
                                    <span>Modifier Profil</span>
                                </Nav.Link>

                                {canCreateContent() && (
                                    <>
                                        <div className="mobile-create-section-ultra">
                                            <h6>Créer du contenu</h6>
                                            <Nav.Link as={Link} to="/add-sound" className="mobile-create-item" onClick={closeMobileMenu}>
                                                <FontAwesomeIcon icon={faMusic} />
                                                <span>Nouveau Son</span>
                                            </Nav.Link>
                                            <Nav.Link as={Link} to="/add-event" className="mobile-create-item" onClick={closeMobileMenu}>
                                                <FontAwesomeIcon icon={faCalendarAlt} />
                                                <span>Nouvel Événement</span>
                                            </Nav.Link>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    <div className="mobile-footer-ultra">
                        {isAuthenticated ? (
                            <Button
                                variant="outline-danger"
                                className="logout-btn-mobile"
                                onClick={() => {handleLogout(); closeMobileMenu();}}
                            >
                                <FontAwesomeIcon icon={faSignOutAlt} />
                                Déconnexion
                            </Button>
                        ) : (
                            <div className="mobile-auth-buttons">
                                <Button as={Link} to="/login" variant="outline-primary" onClick={closeMobileMenu}>
                                    Connexion
                                </Button>
                                <Button as={Link} to="/register" variant="primary" onClick={closeMobileMenu}>
                                    S'inscrire
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .ultra-modern-navbar {
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border: none;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                    padding: 1rem 0;
                    height: 80px;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .glass-effect {
                    background: linear-gradient(135deg,
                        rgba(255, 255, 255, 0.95) 0%,
                        rgba(255, 255, 255, 0.85) 100%);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
                }

                .ultra-modern-brand {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    text-decoration: none;
                    transition: all 0.3s ease;
                }

                .ultra-modern-brand:hover {
                    transform: translateY(-1px);
                }

                .logo-container {
                    position: relative;
                    width: 40px;
                    height: 40px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                }

                .brand-logo-modern {
                    border-radius: 8px;
                }

                .fallback-logo {
                    color: white;
                    font-size: 1.2rem;
                }

                .brand-text-modern {
                    display: flex;
                    flex-direction: column;
                }

                .brand-name {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: #1a1a1a;
                    line-height: 1;
                }

                .brand-tagline {
                    font-size: 0.7rem;
                    color: #6b7280;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .ultra-modern-nav {
                    display: flex;
                    gap: 0.5rem;
                    background: rgba(247, 250, 252, 0.8);
                    padding: 0.5rem;
                    border-radius: 20px;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                }

                .nav-pill {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.75rem 1rem;
                    border-radius: 16px;
                    color: #64748b;
                    text-decoration: none;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    min-width: 80px;
                }

                .nav-pill:hover {
                    background: rgba(255, 255, 255, 0.8);
                    color: #475569;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                .nav-pill.active {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
                }

                .nav-icon {
                    font-size: 1.1rem;
                }

                .nav-label {
                    font-size: 0.75rem;
                    font-weight: 600;
                    line-height: 1;
                }

                .active-indicator {
                    position: absolute;
                    bottom: -8px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 6px;
                    height: 6px;
                    background: white;
                    border-radius: 50%;
                }

                .user-actions-modern {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .create-button-modern .dropdown-toggle::after {
                    display: none;
                }

                .create-trigger {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 0.625rem 1rem;
                    border-radius: 16px;
                    font-weight: 600;
                    font-size: 0.875rem;
                    transition: all 0.3s ease;
                    border: none;
                }

                .create-trigger:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
                }

                .chevron {
                    font-size: 0.7rem;
                    transition: transform 0.3s ease;
                }

                .create-dropdown-modern.show .chevron {
                    transform: rotate(180deg);
                }

                .quick-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .action-button {
                    position: relative;
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    background: rgba(247, 250, 252, 0.8);
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #64748b;
                    text-decoration: none;
                    transition: all 0.3s ease;
                }

                .action-button:hover {
                    background: rgba(255, 255, 255, 0.9);
                    color: #475569;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                .action-button.active {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-color: transparent;
                }

                .cart-counter {
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    background: #ef4444;
                    color: white;
                    font-size: 0.65rem;
                    min-width: 18px;
                    height: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .user-dropdown-ultra .dropdown-toggle::after {
                    display: none;
                }

                .user-trigger {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.5rem;
                    background: rgba(247, 250, 252, 0.8);
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: 16px;
                    transition: all 0.3s ease;
                    cursor: pointer;
                }

                .user-trigger:hover {
                    background: rgba(255, 255, 255, 0.9);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                .user-avatar-ultra {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    object-fit: cover;
                    border: 2px solid rgba(255, 255, 255, 0.8);
                }

                .user-info-trigger {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                }

                .user-name {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #1e293b;
                    line-height: 1;
                }

                .role-badge {
                    font-size: 0.65rem;
                    padding: 0.125rem 0.375rem;
                    border-radius: 6px;
                    font-weight: 500;
                    margin-top: 0.125rem;
                }

                .role-badge.admin {
                    background: #fef2f2;
                    color: #dc2626;
                }

                .role-badge.artist {
                    background: #eff6ff;
                    color: #2563eb;
                }

                .role-badge.producer {
                    background: #f0fdf4;
                    color: #16a34a;
                }

                .role-badge.user {
                    background: #f8fafc;
                    color: #64748b;
                }

                .dropdown-modern {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(24px);
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: 20px;
                    padding: 0.5rem;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
                    min-width: 280px;
                }

                .dropdown-header-ultra {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1rem;
                    border-bottom: 1px solid rgba(226, 232, 240, 0.5);
                    margin-bottom: 0.5rem;
                }

                .header-avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    object-fit: cover;
                }

                .header-info {
                    flex: 1;
                }

                .header-name {
                    font-weight: 600;
                    color: #1e293b;
                    font-size: 0.95rem;
                }

                .header-email {
                    color: #64748b;
                    font-size: 0.8rem;
                }

                .dropdown-section {
                    margin-bottom: 0.5rem;
                }

                .dropdown-section:last-child {
                    margin-bottom: 0;
                }

                .logout-section {
                    border-top: 1px solid rgba(226, 232, 240, 0.5);
                    padding-top: 0.5rem;
                    margin-top: 0.5rem;
                }

                .dropdown-item-modern {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem;
                    border-radius: 12px;
                    transition: all 0.2s ease;
                    text-decoration: none;
                    color: inherit;
                }

                .dropdown-item-modern:hover {
                    background: rgba(102, 126, 234, 0.08);
                    color: #475569;
                    transform: translateX(4px);
                }

                .dropdown-item-modern.logout:hover {
                    background: rgba(239, 68, 68, 0.08);
                    color: #dc2626;
                }

                .item-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.9rem;
                }

                .item-icon.sound {
                    background: rgba(59, 130, 246, 0.1);
                    color: #3b82f6;
                }

                .item-icon.event {
                    background: rgba(34, 197, 94, 0.1);
                    color: #22c55e;
                }

                .item-icon.profile {
                    background: rgba(168, 85, 247, 0.1);
                    color: #a855f7;
                }

                .item-icon.edit {
                    background: rgba(249, 115, 22, 0.1);
                    color: #f97316;
                }

                .item-icon.admin {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                }

                .item-icon.logout {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                }

                .item-icon.competition {
                    background: rgba(255, 193, 7, 0.1);
                    color: #ffc107;
                }

                .item-content {
                    flex: 1;
                }

                .item-title {
                    font-weight: 600;
                    color: #1e293b;
                    font-size: 0.875rem;
                    line-height: 1;
                }

                .item-subtitle {
                    color: #64748b;
                    font-size: 0.75rem;
                    margin-top: 0.125rem;
                }

                .auth-buttons-modern {
                    display: flex;
                    gap: 0.75rem;
                }

                .btn-modern {
                    padding: 0.625rem 1.25rem;
                    border-radius: 14px;
                    font-weight: 600;
                    font-size: 0.875rem;
                    transition: all 0.3s ease;
                    border: none;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                }

                .btn-modern.login {
                    background: rgba(247, 250, 252, 0.8);
                    color: #475569;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                }

                .btn-modern.login:hover {
                    background: rgba(255, 255, 255, 0.9);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                .btn-modern.signup {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }

                .btn-modern.signup:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
                }

                .mobile-toggle-ultra {
                    width: 44px;
                    height: 44px;
                    border: none;
                    background: rgba(247, 250, 252, 0.8);
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                }

                .hamburger {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                    transition: all 0.3s ease;
                }

                .hamburger span {
                    width: 18px;
                    height: 2px;
                    background: #64748b;
                    border-radius: 1px;
                    transition: all 0.3s ease;
                }

                .hamburger.active span:nth-child(1) {
                    transform: rotate(45deg) translate(6px, 6px);
                }

                .hamburger.active span:nth-child(2) {
                    opacity: 0;
                }

                .hamburger.active span:nth-child(3) {
                    transform: rotate(-45deg) translate(6px, -6px);
                }

                .mobile-menu-ultra {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 1050;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                }

                .mobile-menu-ultra.active {
                    opacity: 1;
                    visibility: visible;
                }

                .mobile-menu-backdrop {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(8px);
                }

                .mobile-menu-panel {
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 320px;
                    max-width: 85vw;
                    height: 100vh;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(24px);
                    display: flex;
                    flex-direction: column;
                    transform: translateX(100%);
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .mobile-menu-ultra.active .mobile-menu-panel {
                    transform: translateX(0);
                }

                .mobile-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1.5rem;
                    border-bottom: 1px solid rgba(226, 232, 240, 0.5);
                }

                .mobile-brand {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 600;
                    color: #1e293b;
                }

                .close-btn {
                    width: 32px;
                    height: 32px;
                    border: none;
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .mobile-nav-ultra {
                    flex: 1;
                    padding: 1rem;
                    overflow-y: auto;
                }

                .mobile-nav-item-ultra {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.875rem;
                    color: #475569;
                    text-decoration: none;
                    border-radius: 12px;
                    transition: all 0.2s ease;
                    margin-bottom: 0.25rem;
                }

                .mobile-nav-item-ultra:hover,
                .mobile-nav-item-ultra.active {
                    background: rgba(102, 126, 234, 0.1);
                    color: #667eea;
                    transform: translateX(4px);
                }

                .mobile-divider-ultra {
                    height: 1px;
                    background: rgba(226, 232, 240, 0.5);
                    margin: 1rem 0;
                }

                .mobile-create-section-ultra {
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid rgba(226, 232, 240, 0.5);
                }

                .mobile-create-section-ultra h6 {
                    color: #64748b;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 0.5rem;
                    padding: 0 0.875rem;
                }

                .mobile-create-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.875rem;
                    color: #667eea;
                    text-decoration: none;
                    border-radius: 12px;
                    background: rgba(102, 126, 234, 0.05);
                    margin-bottom: 0.5rem;
                    transition: all 0.2s ease;
                }

                .mobile-create-item:hover {
                    background: rgba(102, 126, 234, 0.1);
                    transform: translateX(4px);
                }

                .mobile-footer-ultra {
                    padding: 1.5rem;
                    border-top: 1px solid rgba(226, 232, 240, 0.5);
                }

                .logout-btn-mobile {
                    width: 100%;
                    border-radius: 12px;
                    padding: 0.875rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }

                .mobile-auth-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .mobile-auth-buttons .btn {
                    border-radius: 12px;
                    padding: 0.875rem;
                    font-weight: 600;
                }

                .mobile-badge {
                    background: #ef4444;
                    color: white;
                    font-size: 0.65rem;
                    margin-left: auto;
                }

                .skeleton-loader {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: loading 1.5s infinite;
                }

                .brand-skeleton {
                    width: 120px;
                    height: 20px;
                    border-radius: 10px;
                }

                @keyframes loading {
                    0% {
                        background-position: 200% 0;
                    }
                    100% {
                        background-position: -200% 0;
                    }
                }

                @media (max-width: 991.98px) {
                    .ultra-modern-navbar {
                        height: 70px;
                        padding: 0.75rem 0;
                    }
                }
            `}</style>
        </>
    );
};

export default Header;
