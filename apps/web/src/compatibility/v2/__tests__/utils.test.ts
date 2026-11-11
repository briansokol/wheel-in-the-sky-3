import { DEFAULT_BASE_COLOR } from '@repo/shared/constants/colors';
import { describe, expect, it } from 'vitest';
import { convertConfigV2ToConfigV3 } from '@/compatibility/v2/utils';

const v2 = {
    title: 'T',
    description: '',
    names: 'A\nB',
    randomizeOrder: true,
    showNames: true,
    colorSchemeConfig: JSON.stringify({ colorSchemeType: 5, colors: ['rgb(255, 0, 0)', 'blue', 'not-a-color'] }),
    backgroundColorConfig: JSON.stringify({ backgroundColorType: 1, color: 'rgb(255, 255, 255)' }),
};

describe('convertConfigV2ToConfigV3', () => {
    it('normalizes non-hex v2 colors and drops invalid ones', () => {
        const converted = convertConfigV2ToConfigV3(v2);
        expect(JSON.parse(converted.customColors)).toEqual(['#ff0000', '#0000ff']);
        expect(converted.backgroundColor).toBe('#ffffff');
    });

    it('falls back to the default base color when the v2 base color is invalid', () => {
        const converted = convertConfigV2ToConfigV3({
            ...v2,
            colorSchemeConfig: JSON.stringify({ colorSchemeType: 1, baseColor: 'not-a-color', randomizeColor: false }),
        });
        expect(converted.baseColor).toBe(DEFAULT_BASE_COLOR);
    });
});
