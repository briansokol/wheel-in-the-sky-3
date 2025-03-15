import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { Providers } from '@/providers';
import { Router } from '@/routes';
import './globals.css';

const root = document.getElementById('root');

if (root !== null) {
    createRoot(root).render(
        <StrictMode>
            <BrowserRouter>
                <Providers>
                    <Router />
                </Providers>
            </BrowserRouter>
        </StrictMode>
    );
} else {
    console.error('Cannot mount React at root');
}
