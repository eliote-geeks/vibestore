import React from 'react';
import { Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faMusic, faHeart, faMicrophone, faDrum, faHeartbeat,
    faHandsPraying, faBolt, faUsers, faSmile, faFire,
    faCloud, faLeaf, faStar
} from '@fortawesome/free-solid-svg-icons';

const CategoryBadge = ({
    category,
    size = 'normal',
    showIcon = true,
    className = '',
    style = {}
}) => {
    // Si category est une string, on l'affiche directement (fallback)
    if (typeof category === 'string') {
        return (
            <Badge bg="primary" className={className} style={style}>
                {showIcon && <FontAwesomeIcon icon={faMusic} className="me-1" />}
                {category}
            </Badge>
        );
    }

    // Si category est un objet avec les propriétés attendues
    if (category && typeof category === 'object' && category.name) {
        const iconMap = {
            faMusic, faHeart, faMicrophone, faDrum, faHeartbeat,
            faHandsPraying, faBolt, faUsers, faSmile, faFire,
            faCloud, faLeaf, faStar
        };

        const iconComponent = showIcon ? iconMap[category.icon] || faMusic : null;

        const badgeStyle = {
            backgroundColor: category.color + '20',
            borderColor: category.color,
            color: category.color,
            border: '2px solid currentColor',
            fontWeight: '600',
            ...style
        };

        const sizeClass = size === 'large' ? 'fs-6' : size === 'small' ? 'small' : '';

        return (
            <Badge
                className={`${sizeClass} ${className}`}
                style={badgeStyle}
            >
                {iconComponent && <FontAwesomeIcon icon={iconComponent} className="me-1" />}
                {category.name}
            </Badge>
        );
    }

    // Fallback si category est invalide
    return null;
};

export default CategoryBadge;
