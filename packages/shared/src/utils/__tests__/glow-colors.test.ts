import { TinyColor } from '@ctrl/tinycolor';
import { describe, expect, it } from 'vitest';
import { WheelColorType } from '@/enums/wheel-colors.js';
import { buildWheelColorConfig } from '@/utils/configs.js';
import { DEFAULT_GLOW_COLORS, getGlowColors } from '@/utils/glow-colors.js';

const BASE = '#c031e2';
const HEX = /^#[0-9a-f]{6}$/;

describe('getGlowColors', () => {
    it('returns the defaults for Random', () => {
        const config = buildWheelColorConfig(WheelColorType.Random, BASE, [], false);
        expect(getGlowColors(config)).toEqual([...DEFAULT_GLOW_COLORS]);
    });

    it('returns the triad for Triad', () => {
        const config = buildWheelColorConfig(WheelColorType.Triad, BASE, [], false);
        const result = getGlowColors(config);
        expect(result).toHaveLength(3);
        expect(result).toEqual(new TinyColor(BASE).triad().map((c) => c.toHexString()));
    });

    it('picks indices 0, 2 and 3 of the tetrad', () => {
        const config = buildWheelColorConfig(WheelColorType.Tetrad, BASE, [], false);
        const palette = new TinyColor(BASE).tetrad().map((c) => c.toHexString());
        expect(getGlowColors(config)).toEqual([palette[0], palette[2], palette[3]]);
    });

    it('returns a single custom color as is', () => {
        const config = buildWheelColorConfig(WheelColorType.Custom, BASE, ['#ff0000'], false);
        expect(getGlowColors(config)).toEqual(['#ff0000']);
    });

    it('picks first, middle and last of five custom colors', () => {
        const config = buildWheelColorConfig(
            WheelColorType.Custom,
            BASE,
            ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ffffff'],
            false
        );
        expect(getGlowColors(config)).toEqual(['#ff0000', '#0000ff', '#ffffff']);
    });

    it('falls back to the defaults for empty or invalid custom colors', () => {
        expect(getGlowColors(buildWheelColorConfig(WheelColorType.Custom, BASE, [], false))).toEqual([
            ...DEFAULT_GLOW_COLORS,
        ]);
        expect(getGlowColors(buildWheelColorConfig(WheelColorType.Custom, BASE, ['#ff', ''], false))).toEqual([
            ...DEFAULT_GLOW_COLORS,
        ]);
    });

    it('falls back to the defaults for an invalid base color', () => {
        const config = buildWheelColorConfig(WheelColorType.Monochromatic, 'nope', [], false);
        expect(getGlowColors(config)).toEqual([...DEFAULT_GLOW_COLORS]);
    });

    it('ignores randomizeColor', () => {
        const randomized = buildWheelColorConfig(WheelColorType.Monochromatic, BASE, [], true);
        const fixed = buildWheelColorConfig(WheelColorType.Monochromatic, BASE, [], false);
        expect(getGlowColors(randomized)).toEqual(getGlowColors(fixed));
    });

    it('always returns 1-3 lowercase #rrggbb strings', () => {
        const types = [
            WheelColorType.Random,
            WheelColorType.Monochromatic,
            WheelColorType.Analogous,
            WheelColorType.Triad,
            WheelColorType.Tetrad,
            WheelColorType.Custom,
        ];
        for (const type of types) {
            const result = getGlowColors(buildWheelColorConfig(type, BASE, ['#FF0000', '#00FF00'], false));
            expect(result.length).toBeGreaterThanOrEqual(1);
            expect(result.length).toBeLessThanOrEqual(3);
            for (const color of result) expect(color).toMatch(HEX);
        }
    });
});
