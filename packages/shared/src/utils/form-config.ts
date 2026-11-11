import { TinyColor } from '@ctrl/tinycolor';
import { Config } from '@/classes/config.js';
import { DEFAULT_FOREGROUND_COLOR, INVERSE_FOREGROUND_COLOR } from '@/constants/colors.js';
import { ConfigFormInputs } from '@/types/config.js';
import { buildPageColorConfig, buildWheelColorConfig } from '@/utils/configs.js';
import { configFormInputsSchema } from '@/validators/config.js';

/**
 * Validates the config form's values and builds the config they describe.
 *
 * @throws {ZodError} If any field fails `configFormInputsSchema`.
 */
export function configFromFormInputs(formData: ConfigFormInputs): Config {
    const data = configFormInputsSchema.parse(formData);

    const config = new Config()
        .setTitle(data.title)
        .setDescription(data.description)
        .setNames(data.names)
        .setRandomizeOrder(data.randomizeOrder)
        .setShowNames(data.showNames);
    if (data.id) {
        config.setId(data.id);
    }

    config.wheelColorConfig = buildWheelColorConfig(
        Number(data.colorSchemeType),
        data.baseColor,
        JSON.parse(data.customColors),
        data.randomizeColor
    );

    const foregroundColor = new TinyColor(data.backgroundColor).isDark()
        ? DEFAULT_FOREGROUND_COLOR
        : INVERSE_FOREGROUND_COLOR;
    config.pageColorConfig = buildPageColorConfig(
        Number(data.backgroundColorType),
        data.backgroundColor,
        foregroundColor
    );

    return config;
}
