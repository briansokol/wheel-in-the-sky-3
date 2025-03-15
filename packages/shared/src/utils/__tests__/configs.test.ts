import { PageColorType } from '@/enums/page-colors.js';
import { WheelColorType } from '@/enums/wheel-colors.js';
import {
    buildWheelColorConfig,
    getPageColorSelectOptionDescription,
    getWheelColorSelectOptionDescription,
} from '@/utils/configs.js';

describe('buildWheelColorConfig', () => {
    it('should return a config for WheelColorType.Random', () => {
        const result = buildWheelColorConfig(WheelColorType.Random, '', [], false);
        expect(result).toEqual({
            wheelColorType: WheelColorType.Random,
        });
    });

    it('should return a config for WheelColorType.Monochromatic', () => {
        const result = buildWheelColorConfig(WheelColorType.Monochromatic, '#000000', [], true);
        expect(result).toEqual({
            wheelColorType: WheelColorType.Monochromatic,
            baseColor: '#000000',
            randomizeColor: true,
        });
    });

    it('should return a config for WheelColorType.Analogous', () => {
        const result = buildWheelColorConfig(WheelColorType.Analogous, '#000000', [], true);
        expect(result).toEqual({
            wheelColorType: WheelColorType.Analogous,
            baseColor: '#000000',
            randomizeColor: true,
        });
    });

    it('should return a config for WheelColorType.Triad', () => {
        const result = buildWheelColorConfig(WheelColorType.Triad, '#000000', [], false);
        expect(result).toEqual({
            wheelColorType: WheelColorType.Triad,
            baseColor: '#000000',
        });
    });

    it('should return a config for WheelColorType.Tetrad', () => {
        const result = buildWheelColorConfig(WheelColorType.Tetrad, '#000000', [], false);
        expect(result).toEqual({
            wheelColorType: WheelColorType.Tetrad,
            baseColor: '#000000',
        });
    });

    it('should return a config for WheelColorType.Custom', () => {
        const result = buildWheelColorConfig(WheelColorType.Custom, '', ['#000000', '#FFFFFF'], false);
        expect(result).toEqual({
            wheelColorType: WheelColorType.Custom,
            colors: ['#000000', '#FFFFFF'],
        });
    });

    it('should throw an error for an invalid wheel color type', () => {
        // @ts-expect-error Testing an invalid type
        expect(() => buildWheelColorConfig('InvalidType' as WheelColorType, '', [], false)).toThrow(
            'Invalid wheel color type'
        );
    });
});

describe('getWheelColorSelectOptionDescription', () => {
    it('should return the correct description for Random', () => {
        const description = getWheelColorSelectOptionDescription(WheelColorType.Random);
        expect(typeof description).toBe('string');
        expect(description).not.toBe('');
    });

    it('should return the correct description for Monochromatic', () => {
        const description = getWheelColorSelectOptionDescription(WheelColorType.Monochromatic);
        expect(typeof description).toBe('string');
        expect(description).not.toBe('');
    });

    it('should return the correct description for Analogous', () => {
        const description = getWheelColorSelectOptionDescription(WheelColorType.Analogous);
        expect(typeof description).toBe('string');
        expect(description).not.toBe('');
    });

    it('should return the correct description for Triad', () => {
        const description = getWheelColorSelectOptionDescription(WheelColorType.Triad);
        expect(typeof description).toBe('string');
        expect(description).not.toBe('');
    });

    it('should return the correct description for Tetrad', () => {
        const description = getWheelColorSelectOptionDescription(WheelColorType.Tetrad);
        expect(typeof description).toBe('string');
        expect(description).not.toBe('');
    });

    it('should return the correct description for Custom', () => {
        const description = getWheelColorSelectOptionDescription(WheelColorType.Custom);
        expect(typeof description).toBe('string');
        expect(description).not.toBe('');
    });

    it('should return an empty string for an unknown type', () => {
        // @ts-expect-error Testing an unknown type
        const description = getWheelColorSelectOptionDescription('UnknownType' as WheelColorType);
        expect(description).toBe('');
    });
});

describe('getBackgroundColorTypesDescription', () => {
    it('should return the correct description for GradientNight', () => {
        const description = getPageColorSelectOptionDescription(PageColorType.GradientNight);
        expect(typeof description).toBe('string');
        expect(description).not.toBe('');
    });

    it('should return the correct description for GradientDay', () => {
        const description = getPageColorSelectOptionDescription(PageColorType.GradientDay);
        expect(typeof description).toBe('string');
        expect(description).not.toBe('');
    });

    it('should return the correct description for GradientDawn', () => {
        const description = getPageColorSelectOptionDescription(PageColorType.GradientDawn);
        expect(typeof description).toBe('string');
        expect(description).not.toBe('');
    });

    it('should return the correct description for GradientTwilight', () => {
        const description = getPageColorSelectOptionDescription(PageColorType.GradientTwilight);
        expect(typeof description).toBe('string');
        expect(description).not.toBe('');
    });

    it('should return the correct description for Single', () => {
        const description = getPageColorSelectOptionDescription(PageColorType.Single);
        expect(typeof description).toBe('string');
        expect(description).not.toBe('');
    });

    it('should return an empty string for an unknown type', () => {
        // @ts-expect-error Testing an unknown type
        const description = getPageColorSelectOptionDescription('UnknownType' as PageColorType);
        expect(description).toBe('');
    });
});
