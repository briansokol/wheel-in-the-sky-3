import { TinyColor } from '@ctrl/tinycolor';
import { Config } from '@/classes/config.js';
import {
    DEFAULT_BACKGROUND_COLOR,
    DEFAULT_BASE_COLOR,
    DEFAULT_FOREGROUND_COLOR,
    INVERSE_FOREGROUND_COLOR,
} from '@/constants/colors.js';
import { PageColorType } from '@/enums/page-colors.js';
import { WheelColorType } from '@/enums/wheel-colors.js';
import { buildPageColorConfig, buildWheelColorConfig } from '@/utils/configs.js';
import { WireConfig } from '@/validators/wire-config.js';

/**
 * Converts a config to the compact payload used in share links, omitting
 * defaults and anything derivable on read.
 */
export function toWireConfig(config: Config): WireConfig {
    const wire: WireConfig = { i: config.id, n: config.names };

    if (config.title) wire.t = config.title;
    if (config.description) wire.d = config.description;
    if (!config.randomizeOrder) wire.r = false;
    if (!config.showNames) wire.s = false;

    const { wheelColorType, baseColor, randomizeColor, colors } = config.wheelColorConfig;
    switch (wheelColorType) {
        case WheelColorType.Monochromatic:
        case WheelColorType.Analogous: {
            wire.w = { t: wheelColorType, b: baseColor ?? DEFAULT_BASE_COLOR };
            if (randomizeColor) wire.w.r = true;
            break;
        }
        case WheelColorType.Triad:
        case WheelColorType.Tetrad: {
            wire.w = { t: wheelColorType, b: baseColor ?? DEFAULT_BASE_COLOR };
            break;
        }
        case WheelColorType.Custom: {
            wire.w = { t: wheelColorType, c: colors ?? [] };
            break;
        }
    }

    const { backgroundColorType, backgroundColor } = config.pageColorConfig;
    if (backgroundColorType === PageColorType.Single) {
        wire.p = { t: backgroundColorType, b: backgroundColor };
    } else if (backgroundColorType !== PageColorType.GradientNight) {
        wire.p = { t: backgroundColorType };
    }

    return wire;
}

/**
 * Rebuilds a full config from a validated share-link payload, restoring
 * defaults and derived colors.
 */
export function fromWireConfig(wire: WireConfig): Config {
    const config = new Config()
        .setId(wire.i)
        .setTitle(wire.t ?? '')
        .setDescription(wire.d ?? '')
        .setNamesArray(wire.n)
        .setRandomizeOrder(wire.r ?? true)
        .setShowNames(wire.s ?? true);

    config.wheelColorConfig = buildWheelColorConfig(
        wire.w?.t ?? WheelColorType.Random,
        wire.w?.b ?? DEFAULT_BASE_COLOR,
        wire.w?.c ?? [],
        wire.w?.r ?? false
    );

    const backgroundColor = wire.p?.b ?? DEFAULT_BACKGROUND_COLOR;
    const foregroundColor = new TinyColor(backgroundColor).isDark()
        ? DEFAULT_FOREGROUND_COLOR
        : INVERSE_FOREGROUND_COLOR;
    config.pageColorConfig = buildPageColorConfig(
        wire.p?.t ?? PageColorType.GradientNight,
        backgroundColor,
        foregroundColor
    );

    return config;
}
