import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import AppWrapper from './app.jsx';

const container = document.getElementById('app');
if (container) {
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <AppWrapper />
        </React.StrictMode>
    );
}
