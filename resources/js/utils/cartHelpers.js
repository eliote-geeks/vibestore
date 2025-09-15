/**
 * Utilitaires pour la gestion du panier
 */

/**
 * Ajouter un son au panier
 */
export const addSoundToCart = (sound, addToCart) => {
    const soundItem = {
        ...sound,
        type: 'sound',
        artist: sound.artist || sound.user ? .name,
        cover: sound.cover || sound.cover_image_url
    };
    return addToCart(soundItem);
};

/**
 * Ajouter un événement au panier
 */
export const addEventToCart = (event, addToCart, ticketQuantity = 1) => {
    const eventItem = {
        ...event,
        type: 'event',
        title: event.title || event.name,
        artist: event.organizer || event.artist,
        price: event.ticket_price || event.price,
        cover: event.poster || event.cover || event.image,
        is_free: event.is_free || event.ticket_price === 0,
        quantity: ticketQuantity,
        // Propriétés spécifiques aux événements
        ticket_price: event.ticket_price || event.price,
        event_date: event.event_date || event.date,
        venue: event.venue || event.location,
        city: event.city,
        organizer: event.organizer,
        start_time: event.start_time,
        end_time: event.end_time,
        max_attendees: event.max_attendees
    };
    return addToCart(eventItem);
};

/**
 * Ajouter un article merchandise au panier
 */
export const addMerchandiseToCart = (merchandise, addToCart, options = {}) => {
    const merchandiseItem = {
        ...merchandise,
        type: 'merchandise',
        artist: merchandise.artist || merchandise.brand,
        cover: merchandise.image || merchandise.photo,
        // Options spécifiques (taille, couleur, etc.)
        ...options
    };
    return addToCart(merchandiseItem);
};

/**
 * Ajouter un abonnement au panier
 */
export const addSubscriptionToCart = (subscription, addToCart) => {
    const subscriptionItem = {
        ...subscription,
        type: 'subscription',
        artist: subscription.provider || 'Reveil4artist',
        cover: subscription.image || '/images/subscription-default.png'
    };
    return addToCart(subscriptionItem);
};

/**
 * Formater le prix selon le type d'item
 */
export const formatItemPrice = (item) => {
    const price = item.type === 'event' ? item.ticket_price : item.price;
    return new Intl.NumberFormat('fr-FR').format(price) + ' XAF';
};

/**
 * Obtenir le libellé d'action selon le type d'item
 */
export const getItemActionLabel = (item) => {
    const labels = {
        sound: 'Ajouter le son',
        event: 'Réserver ticket',
        merchandise: 'Ajouter au panier',
        subscription: 'S\'abonner'
    };
    return labels[item.type] || 'Ajouter au panier';
};

/**
 * Vérifier si un item peut être ajouté au panier
 */
export const canAddToCart = (item) => {
    // Vérifier si l'item est gratuit
    if (item.type === 'sound') {
        return !(item.is_free || item.price === 0);
    } else if (item.type === 'event') {
        return !(item.is_free || item.ticket_price === 0);
    }
    return !(item.is_free || item.price === 0);
};

/**
 * Obtenir le message d'info pour les items gratuits
 */
export const getFreeItemMessage = (item) => {
    const messages = {
        sound: 'Ce son est gratuit, vous pouvez le télécharger directement !',
        event: 'Cet événement est gratuit, vous pouvez vous inscrire directement !',
        merchandise: 'Cet article est gratuit !',
        subscription: 'Cet abonnement est gratuit !'
    };
    return messages[item.type] || 'Cet élément est gratuit !';
};