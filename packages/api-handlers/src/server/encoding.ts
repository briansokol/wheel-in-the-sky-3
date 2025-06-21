/**
 * Encoding/Decoding API for wheel configurations
 *
 * This module provides endpoints for encoding wheel configurations into a compact format
 * for sharing/storage and decoding them back into usable configuration objects.
 */
import { TinyColor } from '@ctrl/tinycolor';
import { zValidator } from '@hono/zod-validator';
import { Config } from '@repo/shared/classes/config';
import { DEFAULT_FOREGROUND_COLOR, INVERSE_FOREGROUND_COLOR } from '@repo/shared/constants/colors';
import { WheelColorType } from '@repo/shared/enums/wheel-colors';
import { getPageGradientTheme, isPageColorTypeGradient } from '@repo/shared/utils/colors';
import { configFormInputsSchema } from '@repo/shared/validators/config';
import { Hono } from 'hono';
import { z } from 'zod';
import { AppEnv } from '@/types.js';
import { decodeConfig, encodeConfig } from '@/utils/encoding.js';

// Create a new Hono router with AppEnv context
export const encodingApi = new Hono<AppEnv>()

    /**
     * POST /encode
     *
     * Encodes a wheel configuration into a compact string format.
     *
     * Request body should match configFormInputsSchema
     * Returns: { encodedConfig: string } or { error: string }
     */
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
        if (newConfig.wheelColorConfig.wheelColorType !== WheelColorType.Random && baseColor) {
            newConfig.setWheelColorBaseColor(baseColor);
        }

        const randomizeColor = formData.randomizeColor;
        if (randomizeColor) {
            newConfig.setWheelColorRandomizeColor(randomizeColor);
        }

        const customColors = JSON.parse(formData.customColors);
        if (newConfig.wheelColorConfig.wheelColorType === WheelColorType.Custom && customColors.length > 0) {
            newConfig.setWheelColorColors(customColors);
        } else {
            newConfig.setWheelColorColors([]);
        }

        if (isPageColorTypeGradient(newConfig.pageColorConfig.backgroundColorType)) {
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

    /**
     * POST /decode
     *
     * Decodes a previously encoded configuration string back into a full configuration object.
     *
     * Request body: { encodedConfig: string }
     * Returns: Decoded configuration object or { error: string }
     */
    .post('/decode', zValidator('json', z.object({ encodedConfig: z.string() })), async (c) => {
        const { encodedConfig } = c.req.valid('json');
        try {
            return c.json(await decodeConfig(encodedConfig));
        } catch (error) {
            return c.json({ error: (error as Error)?.message ?? 'Error decoding config' }, 400);
        }
    });
