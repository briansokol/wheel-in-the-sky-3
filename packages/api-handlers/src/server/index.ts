import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { encodingApi } from '@/server/encoding.js';

export const app = new Hono();

app.use(
    '*',
    cors({
        origin: ['http://localhost:5173'],
        allowMethods: ['POST', 'GET'],
        allowHeaders: ['Content-Type', 'Accept-Encoding'],
        exposeHeaders: ['Content-Length'],
        maxAge: 86400,
    })
);

export const routes = app.route('/config', encodingApi);
