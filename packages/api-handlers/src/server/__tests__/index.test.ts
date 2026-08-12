import { app, routes } from '@/server/index.js';

vi.mock('hono/cors', () => ({
    cors: vi.fn(() => async (_c: unknown, next: () => Promise<void>) => next()),
}));

describe('API Server Configuration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should export the Hono app instance', () => {
        expect(app).toBeDefined();
        expect(routes).toBeDefined();
    });
});
