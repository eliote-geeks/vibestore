import React from 'react';
import { Dropdown, Badge, Button, Alert, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faShoppingCart, faTrash, faMinus, faPlus, faCreditCard,
    faMusic, faCalendarAlt, faTicketAlt, faTshirt, faCrown,
    faGift, faBox
} from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../../context/CartContext';

const CartIcon = () => {
    const {
        cartItems,
        totalItems,
        totalAmount,
        isEmpty,
        removeFromCart,
        updateQuantity,
        clearCart,
        proceedToCheckout
    } = useCart();

    const formatPrice = (price) => {
        return new Intl.NumberFormat('fr-FR').format(price) + ' XAF';
    };

    // Obtenir l'icône selon le type d'item
    const getItemIcon = (type) => {
        const icons = {
            sound: faMusic,
            event: faCalendarAlt,
            merchandise: faTshirt,
            subscription: faCrown,
            gift: faGift
        };
        return icons[type] || faBox;
    };

    // Obtenir la couleur selon le type d'item
    const getItemColor = (type) => {
        const colors = {
            sound: 'primary',
            event: 'success',
            merchandise: 'warning',
            subscription: 'info',
            gift: 'danger'
        };
        return colors[type] || 'secondary';
    };

    const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
        <Button
            ref={ref}
            variant="outline-secondary"
            onClick={(e) => {
                e.preventDefault();
                onClick(e);
            }}
            className="position-relative"
            style={{ border: 'none' }}
        >
            <FontAwesomeIcon icon={faShoppingCart} size="lg" />
            {totalItems > 0 && (
                <Badge
                    bg="danger"
                    className="position-absolute top-0 start-100 translate-middle rounded-pill"
                    style={{ fontSize: '0.7rem' }}
                >
                    {totalItems > 99 ? '99+' : totalItems}
                </Badge>
            )}
        </Button>
    ));

    const CustomMenu = React.forwardRef(
        ({ children, style, className, 'aria-labelledby': labeledBy }, ref) => {
            return (
                <div
                    ref={ref}
                    style={{ ...style, minWidth: '400px', maxWidth: '500px' }}
                    className={className}
                    aria-labelledby={labeledBy}
                >
                    <div className="px-4 py-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="mb-0 fw-bold">
                                <FontAwesomeIcon icon={faShoppingCart} className="me-2" />
                                Mon Panier
                            </h6>
                            {!isEmpty && (
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={clearCart}
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </Button>
                            )}
                        </div>

                        {isEmpty ? (
                            <Alert variant="info" className="text-center mb-0">
                                <FontAwesomeIcon icon={faShoppingCart} size="2x" className="text-muted mb-2" />
                                <p className="mb-0">Votre panier est vide</p>
                                <small className="text-muted">Ajoutez des éléments pour commencer</small>
                            </Alert>
                        ) : (
                            <>
                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {cartItems.map((item) => (
                                        <div key={`${item.id}-${item.type}`} className="border rounded mb-2 p-2">
                                            <Row className="align-items-center">
                                                <Col md={2}>
                                                    <div className="position-relative">
                                                        <img
                                                            src={item.cover || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=60&h=60&fit=crop`}
                                                            alt={item.title}
                                                            width="40"
                                                            height="40"
                                                            style={{ objectFit: 'cover', borderRadius: '6px' }}
                                                        />
                                                        <Badge
                                                            bg={getItemColor(item.type)}
                                                            className="position-absolute bottom-0 end-0"
                                                            style={{ fontSize: '0.6rem', padding: '2px 4px' }}
                                                        >
                                                            <FontAwesomeIcon icon={getItemIcon(item.type)} />
                                                        </Badge>
                                                    </div>
                                                </Col>
                                                <Col md={6}>
                                                    <div>
                                                        <div className="fw-medium" style={{ fontSize: '0.9rem' }}>
                                                            {item.title}
                                                        </div>
                                                        <small className="text-muted">
                                                            {item.artist}
                                                        </small>
                                                        {item.type === 'event' && item.event_date && (
                                                            <div>
                                                                <small className="text-success">
                                                                    <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                                                                    {new Date(item.event_date).toLocaleDateString('fr-FR')}
                                                                </small>
                                                            </div>
                                                        )}
                                                    </div>
                                                </Col>
                                                <Col md={2}>
                                                    <div className="d-flex align-items-center">
                                                        <Button
                                                            variant="outline-secondary"
                                                            size="sm"
                                                            style={{
                                                                width: '25px',
                                                                height: '25px',
                                                                padding: '0',
                                                                fontSize: '0.7rem'
                                                            }}
                                                            onClick={() => updateQuantity(item.id, item.type, item.quantity - 1)}
                                                        >
                                                            <FontAwesomeIcon icon={faMinus} />
                                                        </Button>
                                                        <span className="mx-2 fw-bold" style={{ fontSize: '0.9rem' }}>
                                                            {item.quantity}
                                                        </span>
                                                        <Button
                                                            variant="outline-secondary"
                                                            size="sm"
                                                            style={{
                                                                width: '25px',
                                                                height: '25px',
                                                                padding: '0',
                                                                fontSize: '0.7rem'
                                                            }}
                                                            onClick={() => updateQuantity(item.id, item.type, item.quantity + 1)}
                                                            disabled={item.type === 'event' && item.max_attendees && item.quantity >= item.max_attendees}
                                                        >
                                                            <FontAwesomeIcon icon={faPlus} />
                                                        </Button>
                                                    </div>
                                                </Col>
                                                <Col md={2} className="text-end">
                                                    <div className="fw-bold text-primary" style={{ fontSize: '0.9rem' }}>
                                                        {formatPrice(item.price * item.quantity)}
                                                    </div>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => removeFromCart(item.id, item.type)}
                                                        style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </Button>
                                                </Col>
                                            </Row>
                                        </div>
                                    ))}
                                </div>

                                <hr className="my-3" />

                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <span className="fw-bold">Total:</span>
                                    <span className="fw-bold text-primary fs-5">
                                        {formatPrice(totalAmount)}
                                    </span>
                                </div>

                                <div className="d-grid">
                                    <Button
                                        variant="warning"
                                        size="lg"
                                        onClick={proceedToCheckout}
                                        className="fw-bold"
                                    >
                                        <FontAwesomeIcon icon={faCreditCard} className="me-2" />
                                        Procéder au paiement
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            );
        }
    );

    return (
        <Dropdown>
            <Dropdown.Toggle as={CustomToggle} />
            <Dropdown.Menu as={CustomMenu} align="end" />
        </Dropdown>
    );
};

export default CartIcon;
