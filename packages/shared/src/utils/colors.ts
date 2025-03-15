import { pageThemeDawn, pageThemeDay, pageThemeNight, pageThemeTwilight } from '@/constants/colors.js';
import { PageColorType } from '@/enums/page-colors.js';

type LinearGradientDirection =
    | 'to top'
    | 'to bottom'
    | 'to top right'
    | 'to top left'
    | 'to bottom right'
    | 'to bottom left';

export function buildBackgroundGradient(direction: LinearGradientDirection, colors: string[]): string {
    return `linear-gradient(${direction}, ${colors.join(', ')})`;
}

export function isPageColorTypeGradient(pageColorType: PageColorType) {
    switch (pageColorType) {
        case PageColorType.GradientNight:
        case PageColorType.GradientDay:
        case PageColorType.GradientDawn:
        case PageColorType.GradientTwilight: {
            return true;
        }
        default: {
            return false;
        }
    }
}

export function getPageGradientTheme(pageColorType: PageColorType) {
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
        default: {
            throw new Error('Invalid gradient theme');
        }
    }
}
