import { z } from 'zod';
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

export const configFormInputsSchema = z.object({
    id: z.string(),
    title: z.string().min(1, 'Title is required'),
    description: z.string(),
    names: z.string().min(1, 'Names are required'),
    randomizeOrder: z.boolean(),
    showNames: z.boolean(),
    colorSchemeType: z.string(),
    baseColor: z.string(),
    customColors: z.string(), // JSON string of colors array
    randomizeColor: z.boolean(),
    backgroundColorType: z.string(),
    backgroundColor: z.string(),
});
