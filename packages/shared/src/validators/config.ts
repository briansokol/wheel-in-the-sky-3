import { z } from 'zod';
import {
    MAX_CONFIG_ID_LENGTH,
    MAX_CUSTOM_COLORS,
    MAX_DESCRIPTION_LENGTH,
    MAX_NAMES,
    MAX_NAME_LENGTH,
    MAX_TITLE_LENGTH,
} from '@/constants/limits.js';
import { PageColorType } from '@/enums/page-colors.js';
import { WheelColorType } from '@/enums/wheel-colors.js';
import { hexColorSchema } from '@/validators/hex-color.js';
import { pageColorConfigSchema } from '@/validators/page-colors.js';
import { wheelColorConfigSchema } from '@/validators/wheel-colors.js';

export const serializedConfigSchema = z.object({
    version: z.number(),
    id: z.string(),
    title: z.string(),
    description: z.string(),
    names: z.array(z.string()),
    randomizeOrder: z.boolean(),
    showNames: z.boolean(),
    wheelColorConfig: wheelColorConfigSchema,
    pageColorConfig: pageColorConfigSchema,
});

/** The numeric members of a TypeScript enum, as the strings a select field holds. */
function enumValueStrings(enumObject: Record<string, string | number>): string[] {
    return Object.values(enumObject)
        .filter((value) => typeof value === 'number')
        .map(String);
}

const WHEEL_COLOR_TYPE_VALUES = enumValueStrings(WheelColorType);
const PAGE_COLOR_TYPE_VALUES = enumValueStrings(PageColorType);

function nameLines(names: string): string[] {
    return names
        .split('\n')
        .map((name) => name.trim())
        .filter(Boolean);
}

function isHexColorList(value: string): boolean {
    try {
        const colors: unknown = JSON.parse(value);
        return (
            Array.isArray(colors) &&
            colors.length <= MAX_CUSTOM_COLORS &&
            colors.every((color) => hexColorSchema.safeParse(color).success)
        );
    } catch {
        return false;
    }
}

export const configFormInputsSchema = z.object({
    id: z.string().max(MAX_CONFIG_ID_LENGTH),
    title: z.string().max(MAX_TITLE_LENGTH, `Use at most ${MAX_TITLE_LENGTH} characters`),
    description: z.string().max(MAX_DESCRIPTION_LENGTH, `Use at most ${MAX_DESCRIPTION_LENGTH} characters`),
    names: z
        .string()
        .refine((names) => nameLines(names).length > 0, 'You must have at least 1 segment to make a wheel!')
        .refine((names) => {
            const lines = nameLines(names);
            return lines.length <= MAX_NAMES && lines.every((line) => line.length <= MAX_NAME_LENGTH);
        }, `Use at most ${MAX_NAMES} segments of up to ${MAX_NAME_LENGTH} characters each`),
    randomizeOrder: z.boolean(),
    showNames: z.boolean(),
    colorSchemeType: z.string().refine((value) => WHEEL_COLOR_TYPE_VALUES.includes(value), 'Choose a color scheme'),
    baseColor: hexColorSchema,
    customColors: z.string().refine(isHexColorList, `Choose up to ${MAX_CUSTOM_COLORS} valid colors`), // JSON string of colors array
    randomizeColor: z.boolean(),
    backgroundColorType: z
        .string()
        .refine((value) => PAGE_COLOR_TYPE_VALUES.includes(value), 'Choose a page background'),
    backgroundColor: hexColorSchema,
});
