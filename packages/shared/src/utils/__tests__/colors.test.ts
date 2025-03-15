import { pageThemeDawn, pageThemeDay, pageThemeNight, pageThemeTwilight } from '@/constants/colors.js';
import { PageColorType } from '@/enums/page-colors.js';
import { buildBackgroundGradient, getPageGradientTheme, isPageColorTypeGradient } from '@/utils/colors.js';

describe('buildBackgroundGradient', () => {
    it('should build a gradient string with two colors', () => {
        const result = buildBackgroundGradient('to top', ['#000', '#fff']);
        expect(result).toBe('linear-gradient(to top, #000, #fff)');
    });

    it('should build a gradient string with multiple colors', () => {
        const result = buildBackgroundGradient('to bottom', ['#000', '#555', '#fff']);
        expect(result).toBe('linear-gradient(to bottom, #000, #555, #fff)');
    });
});

describe('isPageColorTypeGradient', () => {
    it('should return true for gradient color types', () => {
        expect(isPageColorTypeGradient(PageColorType.GradientNight)).toBe(true);
        expect(isPageColorTypeGradient(PageColorType.GradientDay)).toBe(true);
        expect(isPageColorTypeGradient(PageColorType.GradientDawn)).toBe(true);
        expect(isPageColorTypeGradient(PageColorType.GradientTwilight)).toBe(true);
    });

    it('should return false for non-gradient color types', () => {
        // @ts-expect-error Testing an invalid type
        expect(isPageColorTypeGradient(PageColorType.Solid)).toBe(false);
        // @ts-expect-error Testing an invalid type
        expect(isPageColorTypeGradient(PageColorType.Dark)).toBe(false);
        // @ts-expect-error Testing an invalid type
        expect(isPageColorTypeGradient(PageColorType.Light)).toBe(false);
    });
});

describe('getPageGradientTheme', () => {
    it('should return correct theme for gradient types', () => {
        expect(getPageGradientTheme(PageColorType.GradientNight)).toBe(pageThemeNight);
        expect(getPageGradientTheme(PageColorType.GradientDay)).toBe(pageThemeDay);
        expect(getPageGradientTheme(PageColorType.GradientDawn)).toBe(pageThemeDawn);
        expect(getPageGradientTheme(PageColorType.GradientTwilight)).toBe(pageThemeTwilight);
    });

    it('should handle invalid gradient types', () => {
        // @ts-expect-error Testing an invalid type
        expect(() => getPageGradientTheme(PageColorType.Solid)).toThrow();
        // @ts-expect-error Testing an invalid type
        expect(() => getPageGradientTheme(PageColorType.Dark)).toThrow();
        // @ts-expect-error Testing an invalid type
        expect(() => getPageGradientTheme(PageColorType.Light)).toThrow();
    });
});
