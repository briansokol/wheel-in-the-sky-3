import { describe, expect, it } from 'vitest';
import { PageBaseRoute } from '@/constants/routes';
import { buildConfigHash, getEncodedConfigFromHash, isPage } from '@/utils/routes';

describe('isPage', () => {
    it('should return false for empty pathname', () => {
        expect(isPage('', PageBaseRoute.Home)).toBe(false);
        expect(isPage('', PageBaseRoute.Config)).toBe(false);
    });

    it('should match home page exactly', () => {
        expect(isPage('/', PageBaseRoute.Home)).toBe(true);
        expect(isPage('/home', PageBaseRoute.Home)).toBe(false);
        expect(isPage('/something', PageBaseRoute.Home)).toBe(false);
    });

    it('should match other pages by prefix', () => {
        expect(isPage('/config', PageBaseRoute.Config)).toBe(true);
        expect(isPage('/config?c=v4.abc', PageBaseRoute.Config)).toBe(true);
        expect(isPage('/wheel', PageBaseRoute.Wheel)).toBe(true);
        expect(isPage('/wheel?c=v4.abc', PageBaseRoute.Wheel)).toBe(true);
    });

    it('should return false for non-matching routes', () => {
        expect(isPage('/something', PageBaseRoute.Config)).toBe(false);
        expect(isPage('/wheels', PageBaseRoute.Wheel)).toBe(false);
        expect(isPage('/configurations', PageBaseRoute.Config)).toBe(false);
    });

    it('should handle invalid pathnames', () => {
        expect(isPage('invalid', PageBaseRoute.Home)).toBe(false);
        expect(isPage('invalid/path', PageBaseRoute.Config)).toBe(false);
    });
});

describe('getEncodedConfigFromHash', () => {
    it.each([
        ['#c=v5.abc', 'v5.abc'],
        ['#c=v5.abc&utm=1', 'v5.abc'],
        ['#utm=1&c=v5.abc', 'v5.abc'],
        ['', undefined],
        ['#', undefined],
        ['#utm=1', undefined],
        ['#c=', undefined],
    ])('reads %s as %s', (hash, expected) => {
        expect(getEncodedConfigFromHash(hash)).toBe(expected);
    });
});

it('builds a config hash', () => {
    expect(buildConfigHash('v5.abc')).toBe('#c=v5.abc');
});
