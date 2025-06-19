import { Config } from '@repo/shared/classes/config';
import { DEFAULT_BACKGROUND_COLOR, DEFAULT_BASE_COLOR, defaultPageColorConfig } from '@repo/shared/constants/colors';
import { PageColorType } from '@repo/shared/enums/page-colors';
import { WheelColorType } from '@repo/shared/enums/wheel-colors';
import { ConfigFormInputs } from '@repo/shared/types/config';
import { defaultWheelColorConfig } from '@repo/shared/types/wheel-colors';
import { configFormInputsSchema } from '@repo/shared/validators/config';
import {
    BackgroundColorConfig,
    BackgroundColorType,
    ColorSchemeConfig,
    ColorSchemeType,
    ConfigV2QueryParams,
} from '@/compatibility/v2/types';

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

export function convertConfigV2ToConfigV3(configV2: ConfigV2QueryParams): ConfigFormInputs {
    const colorSchemeConfig: ColorSchemeConfig = JSON.parse(configV2?.colorSchemeConfig ?? '{}');
    const backgroundColorConfig: BackgroundColorConfig = JSON.parse(configV2?.backgroundColorConfig ?? '{}');

    return configFormInputsSchema.parse({
        id: configV2?.id ?? Config.generateId(),
        title: configV2?.title ?? '',
        description: configV2?.description ?? '',
        names: configV2?.names ?? '',
        randomizeOrder: configV2?.randomizeOrder ?? false,
        showNames: configV2?.showNames ?? true,
        colorSchemeType: convertV2ColorSchemeTypeToV3WheelColorType(colorSchemeConfig?.colorSchemeType),
        baseColor: colorSchemeConfig?.baseColor ?? DEFAULT_BASE_COLOR,
        customColors: JSON.stringify(colorSchemeConfig?.colors ?? []),
        randomizeColor: colorSchemeConfig?.randomizeColor ?? false,
        backgroundColorType: convertV2BackgroundColorTypeToV3PageColorType(backgroundColorConfig?.backgroundColorType),
        backgroundColor: backgroundColorConfig?.color ?? DEFAULT_BACKGROUND_COLOR,
    });
}
