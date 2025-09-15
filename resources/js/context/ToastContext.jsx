import React, { createContext, useContext, useState } from 'react';
import ToastNotification from '../components/common/ToastNotification';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = (options) => {
        const id = Date.now() + Math.random();
        const toast = {
            id,
            show: true,
            autoHide: true,
            duration: 4000,
            position: 'top-end',
            ...options
        };

        setToasts(prev => [...prev, toast]);

        // Auto-remove toast after duration
        if (toast.autoHide && toast.duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, toast.duration);
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

    const clearAll = () => {
        setToasts([]);
    };

    const value = {
        toasts,
        showToast,
        removeToast,
        success,
        error,
        warning,
        info,
        cart,
        like,
        download,
        clearAll
    };

    return (
        <ToastContext.Provider value={value}>
            {children}

            {/* Afficher tous les toasts actifs */}
            {toasts.map(toast => (
                <ToastNotification
                    key={toast.id}
                    show={toast.show}
                    onClose={() => removeToast(toast.id)}
                    variant={toast.variant}
                    title={toast.title}
                    message={toast.message}
                    duration={toast.duration}
                    autoHide={toast.autoHide}
                    position={toast.position}
                    icon={toast.icon}
                />
            ))}
        </ToastContext.Provider>
    );
};
