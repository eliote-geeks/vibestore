import React, { useState, useEffect } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCheckCircle,
    faExclamationTriangle,
    faInfoCircle,
    faTimes,
    faTimesCircle,
    faShoppingCart,
    faHeart,
    faDownload
} from '@fortawesome/free-solid-svg-icons';

const ToastNotification = ({
    show,
    onClose,
    variant = 'success',
    title,
    message,
    duration = 4000,
    icon: customIcon,
    position = 'top-end',
    autoHide = true
}) => {
    const [visible, setVisible] = useState(show);

    useEffect(() => {
        setVisible(show);
    }, [show]);

    useEffect(() => {
        if (visible && autoHide && duration > 0) {
            const timer = setTimeout(() => {
                handleClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible, autoHide, duration]);

    const handleClose = () => {
        setVisible(false);
        if (onClose) {
            onClose();
        }
    };

    const getVariantProps = (variant) => {
        switch (variant) {
            case 'success':
                return {
                    bg: 'success',
                    icon: faCheckCircle,
                    iconColor: 'text-white'
                };
            case 'error':
            case 'danger':
                return {
                    bg: 'danger',
                    icon: faTimesCircle,
                    iconColor: 'text-white'
                };
            case 'warning':
                return {
                    bg: 'warning',
                    icon: faExclamationTriangle,
                    iconColor: 'text-dark'
                };
            case 'info':
                return {
                    bg: 'info',
                    icon: faInfoCircle,
                    iconColor: 'text-white'
                };
            case 'cart':
                return {
                    bg: 'primary',
                    icon: faShoppingCart,
                    iconColor: 'text-white'
                };
            case 'like':
                return {
                    bg: 'danger',
                    icon: faHeart,
                    iconColor: 'text-white'
                };
            case 'download':
                return {
                    bg: 'success',
                    icon: faDownload,
                    iconColor: 'text-white'
                };
            default:
                return {
                    bg: 'light',
                    icon: faInfoCircle,
                    iconColor: 'text-dark'
                };
        }
    };

    const variantProps = getVariantProps(variant);
    const icon = customIcon || variantProps.icon;

    if (!visible) return null;

    return (
        <ToastContainer
            position={position}
            className="p-3"
            style={{ zIndex: 9999 }}
        >
            <Toast
                show={visible}
                onClose={handleClose}
                bg={variantProps.bg}
                className="border-0 shadow-lg"
                style={{
                    minWidth: '300px',
                    maxWidth: '400px',
                    borderRadius: '12px'
                }}
            >
                <Toast.Header
                    closeButton={true}
                    className={`border-0 ${variantProps.bg === 'warning' ? 'text-dark' : 'text-white'}`}
                    style={{
                        backgroundColor: 'inherit',
                        borderRadius: '12px 12px 0 0'
                    }}
                >
                    <FontAwesomeIcon
                        icon={icon}
                        className={`me-2 ${variantProps.iconColor}`}
                    />
                    <strong className="me-auto">{title}</strong>
                </Toast.Header>
                {message && (
                    <Toast.Body
                        className={`${variantProps.bg === 'warning' ? 'text-dark' : 'text-white'}`}
                        style={{ fontSize: '14px' }}
                    >
                        {message}
                    </Toast.Body>
                )}
            </Toast>
        </ToastContainer>
    );
};

// Hook pour gérer les notifications
export const useToast = () => {
    const [toasts, setToasts] = useState([]);

    const showToast = (options) => {
        const id = Date.now() + Math.random();
        const toast = { id, ...options };

        setToasts(prev => [...prev, toast]);

        // Auto-remove toast after duration
        if (options.autoHide !== false) {
            setTimeout(() => {
                removeToast(id);
            }, options.duration || 4000);
        }

        return id;
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const success = (title, message, options = {}) => {
        return showToast({
            variant: 'success',
            title,
            message,
            ...options
        });
    };

    const error = (title, message, options = {}) => {
        return showToast({
            variant: 'error',
            title,
            message,
            autoHide: false,
            ...options
        });
    };

    const warning = (title, message, options = {}) => {
        return showToast({
            variant: 'warning',
            title,
            message,
            ...options
        });
    };

    const info = (title, message, options = {}) => {
        return showToast({
            variant: 'info',
            title,
            message,
            ...options
        });
    };

    const cart = (title, message, options = {}) => {
        return showToast({
            variant: 'cart',
            title,
            message,
            ...options
        });
    };

    const like = (title, message, options = {}) => {
        return showToast({
            variant: 'like',
            title,
            message,
            ...options
        });
    };

    const download = (title, message, options = {}) => {
        return showToast({
            variant: 'download',
            title,
            message,
            ...options
        });
    };

    return {
        toasts,
        showToast,
        removeToast,
        success,
        error,
        warning,
        info,
        cart,
        like,
        download
    };
};

// Composant pour afficher tous les toasts actifs
export const ToastManager = () => {
    const { toasts, removeToast } = useToast();

    return (
        <>
            {toasts.map(toast => (
                <ToastNotification
                    key={toast.id}
                    show={true}
                    onClose={() => removeToast(toast.id)}
                    {...toast}
                />
            ))}
        </>
    );
};

export default ToastNotification;
