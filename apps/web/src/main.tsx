import { browserTracingIntegration, replayIntegration, init as sentryInit } from '@sentry/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { Providers } from '@/providers';
import { Router } from '@/routes';
import { scrubEncodedConfig } from '@/utils/sentry-scrub';
import './globals.css';

const BREADCRUMB_URL_KEYS = ['from', 'to', 'url'];

function scrubRequestUrl<T extends { request?: { url?: string } }>(event: T): T {
    if (event.request?.url) {
        event.request.url = scrubEncodedConfig(event.request.url);
    }
    return event;
}

sentryInit({
    dsn: 'https://7cad2174470ae1100a18daef32862cba@o4508580787781632.ingest.us.sentry.io/4509040394567680',
    integrations: [browserTracingIntegration(), replayIntegration()],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    enabled: import.meta.env.VITE_APP_ENV !== 'local',
    // Wheel contents live in the URL fragment; keep them out of Sentry.
    beforeSend: scrubRequestUrl,
    beforeSendTransaction: scrubRequestUrl,
    beforeBreadcrumb(breadcrumb) {
        const data = breadcrumb.data;
        if (data) {
            for (const key of BREADCRUMB_URL_KEYS) {
                if (typeof data[key] === 'string') {
                    data[key] = scrubEncodedConfig(data[key]);
                }
            }
        }
        return breadcrumb;
    },
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
