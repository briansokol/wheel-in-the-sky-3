import { PageColorType } from '@/enums/page-colors.js';
import { PageColorConfig } from '@/types/page-colors.js';
import { buildBackgroundGradient } from '@/utils/colors.js';

export const DEFAULT_BASE_COLOR = '#4062bf';
export const DEFAULT_FOREGROUND_COLOR = '#eeeeee';
export const DEFAULT_BACKGROUND_COLOR = '#0a0a0a';
export const INVERSE_FOREGROUND_COLOR = '#111111';

export const pageThemeNight: PageColorConfig = {
    backgroundColorType: PageColorType.GradientNight,
    backgroundColor: buildBackgroundGradient('to top left', ['rgb(10 10 10)', 'rgb(25 25 60)']),
    foregroundColor: DEFAULT_FOREGROUND_COLOR,
};

export const pageThemeDay: PageColorConfig = {
    backgroundColorType: PageColorType.GradientDay,
    backgroundColor: buildBackgroundGradient('to top right', ['rgb(50 115 170)', 'rgb(19 45 105)']),
    foregroundColor: DEFAULT_FOREGROUND_COLOR,
};

export const pageThemeDawn: PageColorConfig = {
    backgroundColorType: PageColorType.GradientDawn,
    backgroundColor: buildBackgroundGradient('to top', [
        '#C06003',
        '#DDAD78',
        '#ECE9E4',
        '#8AA4AA',
        '#29728F',
        '#092E47',
    ]),
    foregroundColor: DEFAULT_FOREGROUND_COLOR,
};

export const pageThemeTwilight: PageColorConfig = {
    backgroundColorType: PageColorType.GradientTwilight,
    backgroundColor: buildBackgroundGradient('to bottom', [
        '#a89fe9',
        '#e9a9e7',
        '#f7b7d9',
        '#fbc8d4',
        '#f7e8d2',
        '#b8ccf8',
    ]),
    foregroundColor: INVERSE_FOREGROUND_COLOR,
};

export const defaultPageColorConfig = pageThemeNight;
