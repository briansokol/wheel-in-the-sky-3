import { pageThemeDawn, pageThemeDay, pageThemeNight, pageThemeTwilight } from '@/constants/colors.js';
import { pageColorSelectOptions, wheelColorSelectOptions } from '@/constants/config.js';
import { PageColorType } from '@/enums/page-colors.js';
import { WheelColorType } from '@/enums/wheel-colors.js';
import { PageColorConfig } from '@/types/page-colors.js';
import { WheelColorConfig } from '@/types/wheel-colors.js';

export function buildWheelColorConfig(
    wheeelColorType: WheelColorType,
    baseColor: string,
    colors: string[],
    randomizeColor: boolean
): WheelColorConfig {
    switch (wheeelColorType) {
        case WheelColorType.Random: {
            return {
                wheelColorType: wheeelColorType,
            };
        }
        case WheelColorType.Monochromatic:
        case WheelColorType.Analogous: {
            return {
                wheelColorType: wheeelColorType,
                baseColor,
                randomizeColor,
            };
        }
        case WheelColorType.Triad:
        case WheelColorType.Tetrad: {
            return {
                wheelColorType: wheeelColorType,
                baseColor,
            };
        }
        case WheelColorType.Custom: {
            return {
                wheelColorType: wheeelColorType,
                colors,
            };
        }
        default: {
            throw new Error('Invalid wheel color type');
        }
    }
}

export function buildPageColorConfig(
    pageColorType: PageColorType,
    backgroundColor: string,
    foregroundColor: string
): PageColorConfig {
    switch (pageColorType) {
        case PageColorType.GradientNight: {
            return pageThemeNight;
        }
        case PageColorType.GradientDay: {
            return pageThemeDay;
        }
        case PageColorType.GradientDawn: {
            return pageThemeDawn;
        }
        case PageColorType.GradientTwilight: {
            return pageThemeTwilight;
        }
        case PageColorType.Single: {
            return {
                backgroundColorType: pageColorType,
                backgroundColor,
                foregroundColor,
            };
        }
        default: {
            throw new Error('Invalid background color type');
        }
    }
}

export function getWheelColorSelectOptionDescription(type: WheelColorType): string {
    return wheelColorSelectOptions.find((option) => option.id === type)?.description || '';
}

export function getPageColorSelectOptionDescription(type: PageColorType): string {
    return pageColorSelectOptions.find((option) => option.id === type)?.description || '';
}
