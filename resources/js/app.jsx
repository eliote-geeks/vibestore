import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './components/common/FontAwesome';
import App from './components/App';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import '../css/app.css';
import 'react-toastify/dist/ReactToastify.css';

const AppWrapper = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ToastProvider>
                    <CartProvider>
                        <App />
                    </CartProvider>
                </ToastProvider>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default AppWrapper;
