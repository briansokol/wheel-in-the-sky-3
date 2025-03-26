import { withSentry } from '@sentry/cloudflare';
import { Hono } from 'hono';
import { env } from 'hono/adapter';
import { cors } from 'hono/cors';
import { encodingApi } from '@/server/encoding.js';
import { AppEnv } from '@/types.js';

const honoApp = new Hono<AppEnv>().basePath('/api');

honoApp.use(
    '*',
    cors({
        origin: (origin, c) => {
            const { APP_ENV } = env(c);
            return APP_ENV === 'local' || origin.endsWith('wheel-in-the-sky.bri-9c5.workers.dev') ? origin : undefined;
        },
        allowMethods: ['POST', 'GET'],
        allowHeaders: ['Content-Type', 'Accept-Encoding', 'sentry-trace', 'baggage'],
        exposeHeaders: ['Content-Length'],
        maxAge: 86400,
    })
);

honoApp.notFound((c) => {
    const { ASSETS } = env(c);
    return ASSETS.fetch(c.req.url);
});

export const routes = honoApp.route('/config', encodingApi);

export const app = withSentry(
    (env) => ({
        dsn: 'https://895c486a1e653f07201b20658156b954@o4508580787781632.ingest.us.sentry.io/4509040320970752',
        tracesSampleRate: 1.0,
        enabled: (env as Env).APP_ENV !== 'local',
    }),
    honoApp
);
