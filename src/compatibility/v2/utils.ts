import { TinyColor } from '@ctrl/tinycolor';
import { Config } from '@/classes/config';
import {
    BackgroundColorConfig,
    BackgroundColorType,
    ColorSchemeConfig,
    ColorSchemeType,
    ConfigV2QueryParams,
} from '@/compatibility/v2/types';
import { DEFAULT_BACKGROUND_COLOR, DEFAULT_BASE_COLOR, defaultPageColorConfig } from '@/constants/colors';
import { MAX_CONFIG_ID_LENGTH } from '@/constants/limits';
import { PageColorType } from '@/enums/page-colors';
import { WheelColorType } from '@/enums/wheel-colors';
import { ConfigFormInputs } from '@/types/config';
import { defaultWheelColorConfig } from '@/types/wheel-colors';
import { configFormInputsSchema } from '@/validators/config';

function convertV2ColorSchemeTypeToV3WheelColorType(colorSchemeType: ColorSchemeType): string {
    switch (colorSchemeType) {
        case ColorSchemeType.Random:
            return WheelColorType.Random.toString();
        case ColorSchemeType.Monochromatic:
            return WheelColorType.Monochromatic.toString();
        case ColorSchemeType.Analogous:
            return WheelColorType.Analogous.toString();
        case ColorSchemeType.Triad:
            return WheelColorType.Triad.toString();
        case ColorSchemeType.Tetrad:
            return WheelColorType.Tetrad.toString();
        case ColorSchemeType.Custom:
            return WheelColorType.Custom.toString();
        default:
            return defaultWheelColorConfig.wheelColorType.toString();
    }
}

function convertV2BackgroundColorTypeToV3PageColorType(backgroundColorType: BackgroundColorType): string {
    switch (backgroundColorType) {
        case BackgroundColorType.Default:
            return PageColorType.GradientDay.toString();
        case BackgroundColorType.Single:
            return PageColorType.Single.toString();
        default:
            return defaultPageColorConfig.backgroundColorType.toString();
    }
}

/** Normalizes any CSS color v2 stored (hex, `rgb()`, names) to hex, or `undefined` if invalid. */
function toHexColor(value: unknown): string | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }
    const color = new TinyColor(value);
    return color.isValid ? color.toHexString() : undefined;
}

export function convertConfigV2ToConfigV3(configV2: ConfigV2QueryParams): ConfigFormInputs {
    const colorSchemeConfig: ColorSchemeConfig = JSON.parse(configV2?.colorSchemeConfig ?? '{}');
    const backgroundColorConfig: BackgroundColorConfig = JSON.parse(configV2?.backgroundColorConfig ?? '{}');

    return configFormInputsSchema.parse({
        // A v2 id only keyed a per-browser saved list, so replacing one that is too long loses nothing.
        id: configV2?.id && configV2.id.length <= MAX_CONFIG_ID_LENGTH ? configV2.id : Config.generateId(),
        title: configV2?.title ?? '',
        description: configV2?.description ?? '',
        names: configV2?.names ?? '',
        randomizeOrder: configV2?.randomizeOrder ?? false,
        showNames: configV2?.showNames ?? true,
        colorSchemeType: convertV2ColorSchemeTypeToV3WheelColorType(colorSchemeConfig?.colorSchemeType),
        baseColor: toHexColor(colorSchemeConfig?.baseColor) ?? DEFAULT_BASE_COLOR,
        customColors: JSON.stringify(
            (colorSchemeConfig?.colors ?? []).map(toHexColor).filter((color) => color !== undefined)
        ),
        randomizeColor: colorSchemeConfig?.randomizeColor ?? false,
        backgroundColorType: convertV2BackgroundColorTypeToV3PageColorType(backgroundColorConfig?.backgroundColorType),
        backgroundColor: toHexColor(backgroundColorConfig?.color) ?? DEFAULT_BACKGROUND_COLOR,
    });
}
