import { z } from 'zod';
import {
    MAX_CUSTOM_COLORS,
    MAX_DESCRIPTION_LENGTH,
    MAX_NAMES,
    MAX_NAME_LENGTH,
    MAX_TITLE_LENGTH,
} from '@/constants/limits.js';
import { PageColorType } from '@/enums/page-colors.js';
import { WheelColorType } from '@/enums/wheel-colors.js';
import { hexColorSchema } from '@/validators/hex-color.js';

/**
 * The compact config payload carried in share links. Fields equal to their
 * default are omitted, and values derivable from others are not stored.
 */
export const wireConfigSchema = z.object({
    i: z.string().min(1).max(21),
    t: z.string().max(MAX_TITLE_LENGTH).optional(),
    d: z.string().max(MAX_DESCRIPTION_LENGTH).optional(),
    n: z.array(z.string().min(1).max(MAX_NAME_LENGTH)).min(1).max(MAX_NAMES),
    r: z.literal(false).optional(), // randomizeOrder; absent means true
    s: z.literal(false).optional(), // showNames; absent means true
    w: z
        .object({
            t: z.enum(WheelColorType),
            b: hexColorSchema.optional(),
            r: z.literal(true).optional(), // randomizeColor; absent means false
            c: z.array(hexColorSchema).max(MAX_CUSTOM_COLORS).optional(),
        })
        .optional(), // absent means Random
    p: z.object({ t: z.enum(PageColorType), b: hexColorSchema.optional() }).optional(), // absent means GradientNight
});

export type WireConfig = z.infer<typeof wireConfigSchema>;
