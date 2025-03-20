import { Hono } from 'hono';
import { env } from 'hono/adapter';
import { cors } from 'hono/cors';
import { encodingApi } from '@/server/encoding.js';

export const app = new Hono<{ Bindings: Env }>().basePath('/api');

app.use(
    '*',
    cors({
        origin: (origin, c) => {
            const { APP_ENV } = env(c);
            return APP_ENV === 'local'
                ? 'http://localhost:5173'
                : origin.endsWith('wheel-in-the-sky.bri-9c5.workers.dev')
                  ? origin
                  : undefined;
        },
        allowMethods: ['POST', 'GET'],
        allowHeaders: ['Content-Type', 'Accept-Encoding'],
        exposeHeaders: ['Content-Length'],
        maxAge: 86400,
    })
);

app.notFound((c) => {
    const { ASSETS } = env(c);
    return ASSETS.fetch(c.req.url);
});

export const routes = app.route('/config', encodingApi);
