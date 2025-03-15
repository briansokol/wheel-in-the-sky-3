import { app, routes } from '@/server/index.js';

vi.mock('hono/cors', () => ({
    cors: vi.fn(),
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
