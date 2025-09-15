import React from 'react';
import { Spinner } from 'react-bootstrap';

const LoadingSpinner = ({ size = 'md', text = 'Chargement...', color = 'primary' }) => {
    const sizeClasses = {
        sm: { width: '1rem', height: '1rem' },
        md: { width: '2rem', height: '2rem' },
        lg: { width: '3rem', height: '3rem' }
    };

    return (
        <div className="d-flex flex-column align-items-center justify-content-center py-4">
            <Spinner
                animation="border"
                variant={color}
                style={sizeClasses[size]}
                className="mb-2"
            />
            {text && (
                <p className="text-muted small mb-0 loading-pulse">
                    {text}
                </p>
            )}
        </div>
    );
};

// Composant pour loading inline (dans les boutons)
export const InlineSpinner = ({ size = 'sm' }) => {
    return (
        <Spinner
            animation="border"
            size={size}
            className="me-2"
        />
    );
};

// Composant pour overlay de chargement
export const LoadingOverlay = ({ show, text = 'Chargement...' }) => {
    if (!show) return null;

    return (
        <div
            className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(2px)',
                zIndex: 1000,
                borderRadius: '12px'
            }}
        >
            <LoadingSpinner text={text} />
        </div>
    );
};

export default LoadingSpinner;
