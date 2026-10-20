import { TinyColor } from '@ctrl/tinycolor';
import { WheelColorType } from '@/enums/wheel-colors.js';
import { WheelColorConfig } from '@/types/wheel-colors.js';

export const DEFAULT_GLOW_COLORS: readonly string[] = ['#c031e2', '#14b8a6', '#f59e0b'];

const MAX_GLOW_COLORS = 3;

function getPalette(config: WheelColorConfig): TinyColor[] | null {
    switch (config.wheelColorType) {
        case WheelColorType.Monochromatic:
        case WheelColorType.Analogous:
        case WheelColorType.Triad:
        case WheelColorType.Tetrad: {
            const base = new TinyColor(config.baseColor);
            if (!base.isValid) return null;
            switch (config.wheelColorType) {
                case WheelColorType.Monochromatic: {
                    return base.monochromatic(5);
                }
                case WheelColorType.Analogous: {
                    return base.analogous(6).slice(1);
                }
                case WheelColorType.Triad: {
                    return base.triad();
                }
                default: {
                    return base.tetrad();
                }
            }
        }
        case WheelColorType.Custom: {
            return config.colors.map((color) => new TinyColor(color)).filter((color) => color.isValid);
        }
        default: {
            return null;
        }
    }
}

/**
 * Derives 1-3 lowercase `#rrggbb` glow colors, evenly spread across the wheel's palette.
 * Depends only on the scheme type, base color and custom colors; falls back to
 * `DEFAULT_GLOW_COLORS` when no valid palette exists.
 */
export function getGlowColors(config: WheelColorConfig): string[] {
    const palette = getPalette(config);
    if (!palette || palette.length === 0) return [...DEFAULT_GLOW_COLORS];

    const count = Math.min(MAX_GLOW_COLORS, palette.length);
    if (count === 1) return [palette[0].toHexString()];
    return Array.from({ length: count }, (_, i) =>
        palette[Math.round((i * (palette.length - 1)) / (count - 1))].toHexString()
    );
}
