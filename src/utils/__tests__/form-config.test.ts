import { ZodError } from 'zod';
import { DEFAULT_FOREGROUND_COLOR, INVERSE_FOREGROUND_COLOR, pageThemeDay, pageThemeNight } from '@/constants/colors';
import { CONFIG_ID_LENGTH, MAX_NAMES, MAX_TITLE_LENGTH } from '@/constants/limits';
import { PageColorType } from '@/enums/page-colors';
import { WheelColorType } from '@/enums/wheel-colors';
import { ConfigFormInputs } from '@/types/config';
import { configFromFormInputs } from '@/utils/form-config';

const valid: ConfigFormInputs = {
    id: 'abc',
    title: 'T',
    description: 'D',
    names: 'A\nB',
    randomizeOrder: true,
    showNames: true,
    colorSchemeType: `${WheelColorType.Random}`,
    baseColor: '#4062bf',
    customColors: '[]',
    randomizeColor: false,
    backgroundColorType: `${PageColorType.GradientNight}`,
    backgroundColor: '#0a0a0a',
};

describe('configFromFormInputs', () => {
    it('maps the form fields onto a config', () => {
        const config = configFromFormInputs(valid);
        expect(config.serialize()).toEqual({
            version: 3,
            id: 'abc',
            title: 'T',
            description: 'D',
            names: ['A', 'B'],
            randomizeOrder: true,
            showNames: true,
            wheelColorConfig: { wheelColorType: WheelColorType.Random },
            pageColorConfig: pageThemeNight,
        });
    });

    it('keeps the base color and color order for a monochromatic scheme', () => {
        const config = configFromFormInputs({
            ...valid,
            colorSchemeType: `${WheelColorType.Monochromatic}`,
            randomizeColor: true,
            customColors: '["#ff0000"]',
        });
        expect(config.wheelColorConfig).toEqual({
            wheelColorType: WheelColorType.Monochromatic,
            baseColor: '#4062bf',
            randomizeColor: true,
        });
    });

    it('uses the custom colors for the custom scheme', () => {
        const config = configFromFormInputs({
            ...valid,
            colorSchemeType: `${WheelColorType.Custom}`,
            customColors: '["#ff0000","#00ff00"]',
        });
        expect(config.wheelColorConfig).toEqual({
            wheelColorType: WheelColorType.Custom,
            colors: ['#ff0000', '#00ff00'],
        });
    });

    it.each([
        ['#0a0a0a', DEFAULT_FOREGROUND_COLOR],
        ['#ffffff', INVERSE_FOREGROUND_COLOR],
    ])('derives the foreground for a single-color background of %s', (backgroundColor, foregroundColor) => {
        const config = configFromFormInputs({
            ...valid,
            backgroundColorType: `${PageColorType.Single}`,
            backgroundColor,
        });
        expect(config.pageColorConfig).toEqual({
            backgroundColorType: PageColorType.Single,
            backgroundColor,
            foregroundColor,
        });
    });

    it('generates an id when the form id is empty', () => {
        expect(configFromFormInputs({ ...valid, id: '' }).id).toHaveLength(CONFIG_ID_LENGTH);
    });

    it('uses the theme colors for gradient backgrounds, ignoring the form color', () => {
        const config = configFromFormInputs({ ...valid, backgroundColorType: `${PageColorType.GradientDay}` });
        expect(config.pageColorConfig).toEqual(pageThemeDay);
    });

    it.each([
        ['a non-numeric color scheme', { colorSchemeType: 'abc' }],
        ['an out-of-range color scheme', { colorSchemeType: '99' }],
        ['an out-of-range background type', { backgroundColorType: '5' }],
        ['a non-hex base color', { baseColor: 'url(https://example.com/x.png)' }],
        ['a non-hex background color', { backgroundColor: 'red' }],
        ['customColors that is not JSON', { customColors: 'nope' }],
        ['customColors that is not an array of hex strings', { customColors: '["red"]' }],
        ['blank names', { names: ' \n ' }],
        ['too many names', { names: Array.from({ length: MAX_NAMES + 1 }, () => 'A').join('\n') }],
        ['an over-long title', { title: 'T'.repeat(MAX_TITLE_LENGTH + 1) }],
    ])('rejects %s', (_label, override) => {
        expect(() => configFromFormInputs({ ...valid, ...override })).toThrow(ZodError);
    });
});
