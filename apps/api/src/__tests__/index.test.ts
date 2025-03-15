import { app } from '@repo/api-handlers/server';
import { Hono } from 'hono';

describe('API Shell', () => {
    it('should be an instance of Hono', async () => {
        expect(app).toBeDefined();
        expect(app).toBeInstanceOf(Hono);
    });

    it('should contain at least one route', async () => {
        expect(app.routes).toBeInstanceOf(Array);
        expect(app.routes.length).toBeGreaterThan(0);
    });
});
