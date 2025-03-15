import { TinyColor } from '@ctrl/tinycolor';
import { zValidator } from '@hono/zod-validator';
import { Config } from '@repo/shared/classes/config';
import { DEFAULT_FOREGROUND_COLOR, INVERSE_FOREGROUND_COLOR } from '@repo/shared/constants/colors';
import { getPageGradientTheme, isPageColorTypeGradient } from '@repo/shared/utils/colors';
import { configFormInputsSchema } from '@repo/shared/validators/config';
import { Hono } from 'hono';
import { z } from 'zod';
import { decodeConfig, encodeConfig } from '@/utils/encoding.js';

export const encodingApi = new Hono()

    .post('/encode', zValidator('json', configFormInputsSchema), async (c) => {
        const formData = c.req.valid('json');

        const newConfig = new Config();

        if (formData.id) {
            newConfig.setId(formData.id);
        }

        newConfig.setTitle(formData.title);
        newConfig.setDescription(formData.description);
        newConfig.setNames(formData.names);
        newConfig.setRandomizeOrder(formData.randomizeOrder);
        newConfig.setShowNames(formData.showNames);
        newConfig.setWheelColorType(Number.parseInt(formData.colorSchemeType, 10));
        newConfig.setPageColorType(Number.parseInt(formData.backgroundColorType, 10));

        const baseColor = formData.baseColor;
        if (baseColor) {
            newConfig.setWheelColorBaseColor(baseColor);
        }
        const randomizeColor = formData.randomizeColor;
        if (randomizeColor) {
            newConfig.setWheelColorRandomizeColor(randomizeColor);
        }
        const customColors = JSON.parse(formData.customColors);
        if (customColors.length > 0) {
            newConfig.setWheelColorColors(customColors);
        }

        if (isPageColorTypeGradient(newConfig.pageColorConfig.backgroundColorType)) {
            console.log('here');
            const pageTheme = getPageGradientTheme(newConfig.pageColorConfig.backgroundColorType);
            newConfig.setBackgroundColor(pageTheme.backgroundColor);
            newConfig.setForegroundColor(pageTheme.foregroundColor);
        } else {
            const backgroundColor = formData.backgroundColor;
            if (backgroundColor) {
                newConfig.setBackgroundColor(backgroundColor);
                newConfig.setForegroundColor(
                    new TinyColor(backgroundColor).isDark() ? DEFAULT_FOREGROUND_COLOR : INVERSE_FOREGROUND_COLOR
                );
            }
        }

        try {
            return c.json({
                encodedConfig: await encodeConfig(newConfig.serialize()),
            });
        } catch (error) {
            return c.json({ error: (error as Error)?.message ?? 'Error encoding config' }, 400);
        }
    })

    .post('/decode', zValidator('json', z.object({ encodedConfig: z.string() })), async (c) => {
        const { encodedConfig } = c.req.valid('json');
        try {
            return c.json(await decodeConfig(encodedConfig));
        } catch (error) {
            return c.json({ error: (error as Error)?.message ?? 'Error decoding config' }, 400);
        }
    });
