import { browserTracingIntegration, replayIntegration, init as sentryInit } from '@sentry/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { Providers } from '@/providers';
import { Router } from '@/routes';
import './globals.css';

sentryInit({
    dsn: 'https://7cad2174470ae1100a18daef32862cba@o4508580787781632.ingest.us.sentry.io/4509040394567680',
    integrations: [browserTracingIntegration(), replayIntegration()],
    tracesSampleRate: 1.0,
    tracePropagationTargets: [/^\/api\//],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    enabled: import.meta.env.VITE_APP_ENV !== 'local',
});

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
