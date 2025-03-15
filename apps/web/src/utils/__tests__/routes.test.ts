import { describe, expect, it } from 'vitest';
import { PageBaseRoute } from '@/constants/routes';
import { isPage } from '@/utils/routes';

describe('isPage', () => {
    it('should return false for empty pathname', () => {
        expect(isPage('', PageBaseRoute.Home)).toBe(false);
        expect(isPage('', PageBaseRoute.ConfigV3)).toBe(false);
    });

    it('should match home page exactly', () => {
        expect(isPage('/', PageBaseRoute.Home)).toBe(true);
        expect(isPage('/home', PageBaseRoute.Home)).toBe(false);
        expect(isPage('/something', PageBaseRoute.Home)).toBe(false);
    });

    it('should match other pages by prefix', () => {
        expect(isPage('/config/v3', PageBaseRoute.ConfigV3)).toBe(true);
        expect(isPage('/config/v3/123', PageBaseRoute.ConfigV3)).toBe(true);
        expect(isPage('/wheel/v3', PageBaseRoute.WheelV3)).toBe(true);
        expect(isPage('/wheel/v3/abc', PageBaseRoute.WheelV3)).toBe(true);
    });

    it('should return false for non-matching routes', () => {
        expect(isPage('/something', PageBaseRoute.ConfigV3)).toBe(false);
        expect(isPage('/wheels', PageBaseRoute.WheelV3)).toBe(false);
        expect(isPage('/configurations', PageBaseRoute.ConfigV3)).toBe(false);
    });

    it('should handle invalid pathnames', () => {
        expect(isPage('invalid', PageBaseRoute.Home)).toBe(false);
        expect(isPage('invalid/path', PageBaseRoute.ConfigV3)).toBe(false);
    });
});
