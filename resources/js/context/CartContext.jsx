import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart doit être utilisé à l\'intérieur de CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const toast = useToast();

    // Charger le panier depuis localStorage au démarrage
    useEffect(() => {
        const savedCart = localStorage.getItem('reveil4artist_cart');
        if (savedCart) {
            try {
                setCartItems(JSON.parse(savedCart));
            } catch (error) {
                console.error('Erreur lors du chargement du panier:', error);
                localStorage.removeItem('reveil4artist_cart');
            }
        }
    }, []);

    // Sauvegarder le panier dans localStorage à chaque changement
    useEffect(() => {
        localStorage.setItem('reveil4artist_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    // Ajouter un item au panier
    const addToCart = (item) => {
        // Déterminer si l'item est gratuit selon son type
        const isFreeItem = () => {
            if (item.type === 'sound') {
                return item.is_free || item.price === 0;
            } else if (item.type === 'event') {
                return item.is_free || item.ticket_price === 0 || item.price === 0;
            }
            // Pour d'autres types d'items
            return item.is_free || item.price === 0;
        };

        // Vérifier si l'item est gratuit
        if (isFreeItem()) {
            const itemType = item.type === 'event' ? 'cet événement' : 'ce son';
            toast.info('Item gratuit', `${itemType} est gratuit, vous pouvez l'obtenir directement !`);
            return false;
        }

        // Vérifier si l'item est déjà dans le panier
        const existingItem = cartItems.find(cartItem => cartItem.id === item.id && cartItem.type === (item.type || 'sound'));

            if (existingItem) {
            // Incrémenter la quantité si l'item existe déjà
            setCartItems(prevItems =>
                prevItems.map(cartItem =>
                    cartItem.id === item.id && cartItem.type === (item.type || 'sound')
                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                        : cartItem
                )
                );
            toast.success('Panier', `Quantité de "${item.title}" augmentée !`);
            } else {
            // Ajouter le nouvel item
            const cartItem = {
                id: item.id,
                type: item.type || 'sound', // 'sound', 'event', 'merchandise', etc.
                title: item.title,
                artist: item.artist || item.organizer || item.creator,
                price: item.type === 'event' ? (item.ticket_price || item.price) : item.price,
                cover: item.cover || item.poster || item.image,
                is_free: isFreeItem(),
                    quantity: 1,
                added_at: new Date().toISOString(),

                // Ajouter des propriétés spécifiques selon le type
                ...(item.type === 'event' && {
                    ticket_price: item.ticket_price || item.price,
                    event_date: item.event_date || item.date,
                    venue: item.venue || item.location,
                    city: item.city,
                    poster: item.poster,
                    max_attendees: item.max_attendees,
                    organizer: item.organizer,
                    start_time: item.start_time,
                    end_time: item.end_time,
                    description: item.description
                }),

                ...(item.type === 'sound' && {
                    duration: item.duration,
                    category: item.category,
                    audio_file_url: item.file_url,
                    genre: item.genre,
                    bpm: item.bpm,
                    key: item.key
                }),

                // Pour d'autres types d'items (merchandise, abonnements, etc.)
                ...(item.type === 'merchandise' && {
                    size: item.size,
                    color: item.color,
                    material: item.material,
                    shipping_required: true
                }),

                ...(item.type === 'subscription' && {
                    duration_months: item.duration_months,
                    features: item.features,
                    auto_renewal: item.auto_renewal
                })
            };

            setCartItems(prevItems => [...prevItems, cartItem]);

            // Message de succès personnalisé selon le type
            const successMessage = {
                sound: `Son "${item.title}" ajouté au panier !`,
                event: `Ticket pour "${item.title}" ajouté au panier !`,
                merchandise: `Article "${item.title}" ajouté au panier !`,
                subscription: `Abonnement "${item.title}" ajouté au panier !`
            }[item.type] || `"${item.title}" ajouté au panier !`;

            toast.success('Panier', successMessage);
        }

        return true;
    };

    // Supprimer un item du panier
    const removeFromCart = (itemId, type = 'sound') => {
        const item = cartItems.find(cartItem => cartItem.id === itemId && cartItem.type === type);

        setCartItems(prevItems =>
            prevItems.filter(cartItem => !(cartItem.id === itemId && cartItem.type === type))
        );

        if (item) {
            toast.success('Panier', `"${item.title}" retiré du panier`);
        }
    };

    // Mettre à jour la quantité d'un item
    const updateQuantity = (itemId, type, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(itemId, type);
            return;
        }

        setCartItems(prevItems =>
            prevItems.map(cartItem =>
                cartItem.id === itemId && cartItem.type === type
                    ? { ...cartItem, quantity: newQuantity }
                    : cartItem
            )
        );
    };

    // Vider le panier
    const clearCart = () => {
        setCartItems([]);
        toast.success('Panier', 'Panier vidé');
    };

    // Ouvrir/fermer le panier
    const toggleCart = () => {
        setIsOpen(!isOpen);
    };

    const openCart = () => setIsOpen(true);
    const closeCart = () => setIsOpen(false);

    // Calculer le total du panier
    const getCartTotal = () => {
        return cartItems.reduce((total, item) => {
            const itemPrice = item.type === 'event' ? (item.ticket_price || item.price) : item.price;
            return total + (itemPrice * item.quantity);
        }, 0);
    };

    // Méthode compatible avec Cart.jsx
    const getTotalPrice = () => {
        return getCartTotal();
    };

    // Calculer le nombre d'items total
    const getCartItemsCount = () => {
        return cartItems.reduce((total, item) => total + item.quantity, 0);
    };

    // Méthode compatible avec Cart.jsx
    const getTotalItems = () => {
        return getCartItemsCount();
    };

    // Obtenir les items par type (pour Cart.jsx)
    const getItemsByType = (type) => {
        return cartItems.filter(item => item.type === type);
    };

    // Vérifier si un item est dans le panier
    const isInCart = (itemId, type = 'sound') => {
        return cartItems.some(item => item.id === itemId && item.type === type);
    };

    // Obtenir la quantité d'un item dans le panier
    const getItemQuantity = (itemId, type = 'sound') => {
        const item = cartItems.find(cartItem => cartItem.id === itemId && cartItem.type === type);
        return item ? item.quantity : 0;
    };

    // Procéder au checkout
    const proceedToCheckout = () => {
        if (cartItems.length === 0) {
            toast.error('Panier vide', 'Votre panier est vide');
            return false;
        }

        // Ici vous pouvez rediriger vers la page de checkout
        // ou ouvrir un modal de paiement
        console.log('Procéder au checkout avec:', cartItems);
        toast.info('Checkout', 'Redirection vers le paiement...');
        return true;
    };

    const contextValue = {
        // État
        cartItems,
        isOpen,

        // Actions
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleCart,
        openCart,
        closeCart,
        proceedToCheckout,

        // Getters (nouvelles méthodes)
        getCartTotal,
        getCartItemsCount,
        isInCart,
        getItemQuantity,

        // Getters (compatibilité avec Cart.jsx)
        getTotalPrice,
        getTotalItems,
        getItemsByType,

        // Statistiques
        totalItems: getCartItemsCount(),
        totalAmount: getCartTotal(),
        isEmpty: cartItems.length === 0
    };

    return (
        <CartContext.Provider value={contextValue}>
            {children}
        </CartContext.Provider>
    );
};
