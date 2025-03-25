import { Hono } from 'hono';
import { env } from 'hono/adapter';
import { compress } from 'hono/compress';
import { cors } from 'hono/cors';
import { encodingApi } from '@/server/encoding.js';
import { AppEnv } from '@/types.js';

export const app = new Hono<AppEnv>().basePath('/api');

app.use(
    '*',
    cors({
        origin: (origin, c) => {
            const { APP_ENV } = env(c);
            return APP_ENV === 'local' || origin.endsWith('wheel-in-the-sky.bri-9c5.workers.dev') ? origin : undefined;
        },
        allowMethods: ['POST', 'GET'],
        allowHeaders: ['Content-Type', 'Accept-Encoding'],
        exposeHeaders: ['Content-Length'],
        maxAge: 86400,
    })
);

app.use(compress());

app.notFound((c) => {
    const { ASSETS } = env(c);
    return ASSETS.fetch(c.req.url);
});

export const routes = app.route('/config', encodingApi);
