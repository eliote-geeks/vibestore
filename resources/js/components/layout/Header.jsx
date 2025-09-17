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
import '../../../css/header.css';

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
                                src="/images/vibestore237-logo.svg"
                                alt="VibeStore237"
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
                            <span className="brand-name">VibeStore237</span>
                            <span className="brand-tagline">Musique • Cameroun</span>
                        </div>
                    </Navbar.Brand>

                    {/* Navigation ultra-moderne - Desktop */}
                    <div className="d-none d-lg-flex flex-grow-1 justify-content-center">
                        <Nav className="ultra-modern-nav">
                            {[
                                { path: '/', icon: faHome, label: 'Accueil' },
                                { path: '/catalog', icon: faMusic, label: 'Catalogue' },
                                { path: '/clips', icon: faVideo, label: 'Clips' },
                                { path: '/events', icon: faCalendarAlt, label: 'Événements' },
                                { path: '/competitions', icon: faTrophy, label: 'Compétitions' },
                                { path: '/categories', icon: faTh, label: 'Catégories' },
                                { path: '/artists', icon: faUsers, label: 'Artistes' },
                                { path: '/about', icon: faUser, label: 'À propos' },
                                { path: '/contact', icon: faEnvelope, label: 'Contact' }
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
                                                <NavDropdown.Item as={Link} to="/add-clip" className="dropdown-item-modern">
                                                    <div className="item-icon video">
                                                        <FontAwesomeIcon icon={faVideo} />
                                                    </div>
                                                    <div className="item-content">
                                                        <div className="item-title">Nouveau Clip</div>
                                                        <div className="item-subtitle">Créez une vidéo</div>
                                                    </div>
                                                </NavDropdown.Item>
                                                <NavDropdown.Item as={Link} to="/create-competition" className="dropdown-item-modern">
                                                    <div className="item-icon competition">
                                                        <FontAwesomeIcon icon={faTrophy} />
                                                    </div>
                                                    <div className="item-content">
                                                        <div className="item-title">Nouvelle Compétition</div>
                                                        <div className="item-subtitle">Organisez un concours</div>
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

                                        <div className="dropdown-section">
                                            <NavDropdown.Item as={Link} to="/favorites" className="dropdown-item-modern">
                                                <div className="item-icon favorites">
                                                    <FontAwesomeIcon icon={faHeart} />
                                                </div>
                                                <div className="item-content">
                                                    <div className="item-title">Mes Favoris</div>
                                                    <div className="item-subtitle">Sons et artistes aimés</div>
                                                </div>
                                            </NavDropdown.Item>
                                        </div>

                                        {(isArtist() || isProducer()) && (
                                            <div className="dropdown-section">
                                                <NavDropdown.Item as={Link} to="/analytics" className="dropdown-item-modern">
                                                    <div className="item-icon analytics">
                                                        <FontAwesomeIcon icon={faTachometerAlt} />
                                                    </div>
                                                    <div className="item-content">
                                                        <div className="item-title">Mes Statistiques</div>
                                                        <div className="item-subtitle">Performance de vos créations</div>
                                                    </div>
                                                </NavDropdown.Item>
                                            </div>
                                        )}

                                        {isAdmin() && (
                                            <div className="dropdown-section">
                                                <NavDropdown.Item as={Link} to="/dashboard" className="dropdown-item-modern">
                                                    <div className="item-icon admin">
                                                        <FontAwesomeIcon icon={faTachometerAlt} />
                                                    </div>
                                                    <div className="item-content">
                                                        <div className="item-title">Dashboard Admin</div>
                                                        <div className="item-subtitle">Administration</div>
                                                    </div>
                                                </NavDropdown.Item>
                                                <NavDropdown.Item as={Link} to="/category-management" className="dropdown-item-modern">
                                                    <div className="item-icon categories">
                                                        <FontAwesomeIcon icon={faTh} />
                                                    </div>
                                                    <div className="item-content">
                                                        <div className="item-title">Gérer Catégories</div>
                                                        <div className="item-subtitle">Administration des catégories</div>
                                                    </div>
                                                </NavDropdown.Item>
                                                <NavDropdown.Item as={Link} to="/sound-management" className="dropdown-item-modern">
                                                    <div className="item-icon sound-mgmt">
                                                        <FontAwesomeIcon icon={faMusic} />
                                                    </div>
                                                    <div className="item-content">
                                                        <div className="item-title">Gérer Sons</div>
                                                        <div className="item-subtitle">Modération des sons</div>
                                                    </div>
                                                </NavDropdown.Item>
                                                <NavDropdown.Item as={Link} to="/clip-management" className="dropdown-item-modern">
                                                    <div className="item-icon clip-mgmt">
                                                        <FontAwesomeIcon icon={faVideo} />
                                                    </div>
                                                    <div className="item-content">
                                                        <div className="item-title">Gérer Clips</div>
                                                        <div className="item-subtitle">Modération des clips</div>
                                                    </div>
                                                </NavDropdown.Item>
                                                <NavDropdown.Item as={Link} to="/payment-management" className="dropdown-item-modern">
                                                    <div className="item-icon payments">
                                                        <FontAwesomeIcon icon={faShoppingCart} />
                                                    </div>
                                                    <div className="item-content">
                                                        <div className="item-title">Gérer Paiements</div>
                                                        <div className="item-subtitle">Transactions et revenus</div>
                                                    </div>
                                                </NavDropdown.Item>
                                                <NavDropdown.Item as={Link} to="/certification-management" className="dropdown-item-modern">
                                                    <div className="item-icon certification">
                                                        <FontAwesomeIcon icon={faCog} />
                                                    </div>
                                                    <div className="item-content">
                                                        <div className="item-title">Certifications</div>
                                                        <div className="item-subtitle">Gérer les certifications</div>
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
                            <img src="/images/vibestore237-logo.svg" alt="Logo" height="24" />
                            <span>VibeStore237</span>
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
                                            <Nav.Link as={Link} to="/add-clip" className="mobile-create-item" onClick={closeMobileMenu}>
                                                <FontAwesomeIcon icon={faVideo} />
                                                <span>Nouveau Clip</span>
                                            </Nav.Link>
                                            <Nav.Link as={Link} to="/create-competition" className="mobile-create-item" onClick={closeMobileMenu}>
                                                <FontAwesomeIcon icon={faTrophy} />
                                                <span>Nouvelle Compétition</span>
                                            </Nav.Link>
                                        </div>
                                    </>
                                )}

                                {isAdmin() && (
                                    <div className="mobile-create-section-ultra">
                                        <h6>Administration</h6>
                                        <Nav.Link as={Link} to="/dashboard" className="mobile-create-item" onClick={closeMobileMenu}>
                                            <FontAwesomeIcon icon={faTachometerAlt} />
                                            <span>Dashboard Admin</span>
                                        </Nav.Link>
                                        <Nav.Link as={Link} to="/sound-management" className="mobile-create-item" onClick={closeMobileMenu}>
                                            <FontAwesomeIcon icon={faMusic} />
                                            <span>Gérer Sons</span>
                                        </Nav.Link>
                                        <Nav.Link as={Link} to="/clip-management" className="mobile-create-item" onClick={closeMobileMenu}>
                                            <FontAwesomeIcon icon={faVideo} />
                                            <span>Gérer Clips</span>
                                        </Nav.Link>
                                        <Nav.Link as={Link} to="/payment-management" className="mobile-create-item" onClick={closeMobileMenu}>
                                            <FontAwesomeIcon icon={faShoppingCart} />
                                            <span>Gérer Paiements</span>
                                        </Nav.Link>
                                    </div>
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

        </>
    );
};

export default Header;
