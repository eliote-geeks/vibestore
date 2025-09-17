// Utilitaire pour les termes de licence et droits d'auteur
// Centralise toutes les définitions et traductions pour faciliter la compréhension

export const licenseTypes = {
    'royalty_free': {
        name: 'Libre de droits (Royalty-Free)',
        description: 'Utilisation illimitée après achat unique. Idéal pour la plupart des projets commerciaux et personnels.',
        details: 'Une fois acheté, vous pouvez utiliser ce son autant de fois que vous le souhaitez sans payer de droits supplémentaires.',
        icon: 'faShieldAlt',
        color: 'success',
        popular: true
    },
    'creative_commons': {
        name: 'Creative Commons',
        description: 'Licence ouverte avec conditions spécifiques (attribution, partage, etc.)',
        details: 'Licence flexible qui permet le partage et l\'utilisation avec certaines conditions. Souvent gratuite.',
        icon: 'faCopyright',
        color: 'info',
        popular: false
    },
    'exclusive': {
        name: 'Licence exclusive',
        description: 'Droits exclusifs transférés à l\'acheteur. Une seule vente possible.',
        details: 'Vous obtenez les droits exclusifs sur ce son. L\'auteur ne peut plus le vendre à d\'autres.',
        icon: 'faShieldAlt',
        color: 'warning',
        popular: false
    },
    'custom': {
        name: 'Licence personnalisée',
        description: 'Termes de licence spécifiques définis par l\'auteur',
        details: 'Conditions sur mesure négociées entre l\'auteur et l\'acheteur.',
        icon: 'faQuestionCircle',
        color: 'secondary',
        popular: false
    }
};

export const usageRightsOptions = [{
        value: 'broadcast',
        label: 'Diffusion radio/TV',
        description: 'Utilisation autorisée en radio et télévision',
        icon: 'faBroadcastTower',
        category: 'médias'
    },
    {
        value: 'streaming',
        label: 'Plateformes de streaming',
        description: 'Spotify, Apple Music, Deezer, YouTube Music, etc.',
        icon: 'faMusic',
        category: 'numérique'
    },
    {
        value: 'sync',
        label: 'Synchronisation',
        description: 'Films, publicités, jeux vidéo, contenus audiovisuels',
        icon: 'faVideo',
        category: 'audiovisuel'
    },
    {
        value: 'live',
        label: 'Performances live',
        description: 'Concerts, événements en direct, spectacles',
        icon: 'faMicrophone',
        category: 'live'
    },
    {
        value: 'remix',
        label: 'Remix/Sampling',
        description: 'Modification, remix et échantillonnage autorisés',
        icon: 'faEdit',
        category: 'création'
    },
    {
        value: 'youtube',
        label: 'Monétisation YouTube',
        description: 'Utilisation dans du contenu YouTube monétisé',
        icon: 'faYoutube',
        category: 'numérique'
    },
    {
        value: 'podcast',
        label: 'Podcasts',
        description: 'Utilisation comme musique de fond ou jingle',
        icon: 'faPodcast',
        category: 'audio'
    },
    {
        value: 'commercial',
        label: 'Publicité commerciale',
        description: 'Spots publicitaires, promotions, marketing',
        icon: 'faBullhorn',
        category: 'commercial'
    }
];

export const licenseDurations = {
    'perpetual': {
        name: 'Perpétuelle (à vie)',
        description: 'Licence valide indéfiniment sans limite de temps',
        recommended: true
    },
    '1_year': {
        name: '1 an',
        description: 'Licence valide pendant 1 année à partir de l\'achat',
        recommended: false
    },
    '5_years': {
        name: '5 ans',
        description: 'Licence valide pendant 5 années à partir de l\'achat',
        recommended: false
    },
    '10_years': {
        name: '10 ans',
        description: 'Licence valide pendant 10 années à partir de l\'achat',
        recommended: false
    }
};

export const territories = {
    'worldwide': {
        name: 'Monde entier',
        description: 'Utilisation autorisée dans tous les pays',
        recommended: true
    },
    'africa': {
        name: 'Afrique',
        description: 'Utilisation limitée aux pays africains',
        recommended: false
    },
    'cameroon': {
        name: 'Cameroun uniquement',
        description: 'Utilisation limitée au territoire camerounais',
        recommended: false
    },
    'francophone': {
        name: 'Pays francophones',
        description: 'Utilisation limitée aux pays de langue française',
        recommended: false
    }
};

export const musicalGenres = [
    // Genres africains
    'Afrobeat', 'Afrotrap', 'Coupé-décalé', 'Makossa', 'Bikutsi',
    'Ndombolo', 'Soukous', 'Highlife', 'Amapiano', 'Afro House',

    // Genres populaires
    'Hip-Hop', 'Rap', 'R&B', 'Soul', 'Funk', 'Reggae', 'Dancehall',
    'Pop', 'Rock', 'Jazz', 'Blues', 'Country', 'Folk',

    // Genres électroniques
    'House', 'Techno', 'Trance', 'Dubstep', 'Drum & Bass', 'Ambient',
    'Chillout', 'Lofi', 'Trap', 'Future Bass',

    // Genres traditionnels
    'Gospel', 'Spirituel', 'Traditionnel', 'World Music', 'Classique',
    'Instrumental', 'Acoustic'
];

export const bpmRanges = {
    'très_lent': { min: 60, max: 80, label: 'Très lent (60-80 BPM)', genres: ['Ballad', 'Ambient', 'Chillout'] },
    'lent': { min: 80, max: 100, label: 'Lent (80-100 BPM)', genres: ['R&B', 'Soul', 'Hip-Hop lent'] },
    'modéré': { min: 100, max: 120, label: 'Modéré (100-120 BPM)', genres: ['Pop', 'Rock', 'Reggae'] },
    'rapide': { min: 120, max: 140, label: 'Rapide (120-140 BPM)', genres: ['House', 'Afrobeat', 'Dancehall'] },
    'très_rapide': { min: 140, max: 180, label: 'Très rapide (140-180 BPM)', genres: ['Techno', 'Drum & Bass', 'Trap'] }
};

export const musicalKeys = [
    // Tonalités majeures
    'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
    // Tonalités mineures
    'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'
];

export const pricingTiers = {
    'gratuit': { min: 0, max: 0, label: 'Gratuit', description: 'Idéal pour faire connaître votre travail' },
    'économique': { min: 500, max: 2000, label: 'Économique (500-2000 FCFA)', description: 'Prix d\'entrée attractif' },
    'standard': { min: 2000, max: 5000, label: 'Standard (2000-5000 FCFA)', description: 'Prix moyen du marché' },
    'premium': { min: 5000, max: 10000, label: 'Premium (5000-10000 FCFA)', description: 'Sons de haute qualité' },
    'exclusif': { min: 10000, max: 50000, label: 'Exclusif (10000+ FCFA)', description: 'Productions professionnelles' }
};

export const commonTags = [
    // Style et ambiance
    'Chill', 'Énergique', 'Dansant', 'Relaxant', 'Motivant', 'Émotionnel', 'Festif', 'Romantique',
    'Nostalgique', 'Inspirant', 'Puissant', 'Doux', 'Intense', 'Calme', 'Dynamique',

    // Utilisation
    'Commercial', 'Radio', 'Publicité', 'Jingle', 'Générique', 'Fond sonore', 'Workout',
    'Méditation', 'Étude', 'Conduite', 'Fête', 'Mariage', 'Corporate',

    // Instruments principaux
    'Piano', 'Guitare', 'Batterie', 'Basse', 'Synthé', 'Cordes', 'Cuivres', 'Percussions',
    'Voix', 'Chœur', 'Flûte', 'Saxophone', 'Kora', 'Balafon',

    // Origine
    'Africain', 'Camerounais', 'Occidental', 'Traditionnel', 'Moderne', 'Fusion', 'Urbain', 'Rural'
];

// Fonction utilitaire pour obtenir les suggestions de prix basées sur le genre
export const getPriceSuggestion = (genre, isInstrumental = false) => {
    const basePrice = isInstrumental ? 1500 : 3000;

    const genreMultipliers = {
        'Gospel': 1.2,
        'Afrobeat': 1.3,
        'Hip-Hop': 1.4,
        'Trap': 1.4,
        'R&B': 1.3,
        'House': 1.2,
        'Pop': 1.5,
        'Jazz': 1.6,
        'Classique': 1.8
    };

    const multiplier = genreMultipliers[genre] || 1;
    const suggestedPrice = Math.round(basePrice * multiplier / 500) * 500; // Arrondir aux 500 près

    return {
        min: Math.max(500, suggestedPrice - 1000),
        suggested: suggestedPrice,
        max: suggestedPrice + 2000
    };
};

// Fonction pour valider les données de licence
export const validateLicenseData = (formData) => {
    const errors = {};

    if (!formData.copyright_owner ? .trim()) {
        errors.copyright_owner = 'Le propriétaire des droits d\'auteur est requis';
    }

    if (!formData.composer ? .trim()) {
        errors.composer = 'Le compositeur est requis';
    }

    if (!formData.license_type) {
        errors.license_type = 'Le type de licence est requis';
    }

    if (formData.license_type === 'exclusive' && formData.is_free) {
        errors.license_type = 'Une licence exclusive ne peut pas être gratuite';
    }

    if (!formData.is_free && (!formData.price || formData.price <= 0)) {
        errors.price = 'Le prix doit être supérieur à 0 pour un son payant';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

export default {
    licenseTypes,
    usageRightsOptions,
    licenseDurations,
    territories,
    musicalGenres,
    bpmRanges,
    musicalKeys,
    pricingTiers,
    commonTags,
    getPriceSuggestion,
    validateLicenseData
};