import { z } from 'zod';
import { WheelColorType } from '@/enums/wheel-colors.js';

const wheelColorTypeSchema = z.enum(WheelColorType);

const baseWheelColorConfigSchema = z.object({
    wheelColorType: wheelColorTypeSchema,
    baseColor: z.string().optional(),
    randomizeColor: z.boolean().optional(),
    colors: z.array(z.string()).optional(),
});

const wheelColorRandomConfigSchema = baseWheelColorConfigSchema.extend({
    wheelColorType: z.literal(wheelColorTypeSchema.enum.Random),
});

const wheelColorMonochromaticConfigSchema = baseWheelColorConfigSchema.extend({
    wheelColorType: z.literal(wheelColorTypeSchema.enum.Monochromatic),
    baseColor: z.string(),
    randomizeColor: z.boolean(),
});

const wheelColorAnalogousConfigSchema = baseWheelColorConfigSchema.extend({
    wheelColorType: z.literal(wheelColorTypeSchema.enum.Analogous),
    baseColor: z.string(),
    randomizeColor: z.boolean(),
});

const wheelColorTriadConfigSchema = baseWheelColorConfigSchema.extend({
    wheelColorType: z.literal(wheelColorTypeSchema.enum.Triad),
    baseColor: z.string(),
});

const wheelColorTetradConfigSchema = baseWheelColorConfigSchema.extend({
    wheelColorType: z.literal(wheelColorTypeSchema.enum.Tetrad),
    baseColor: z.string(),
});

const wheelColorCustomConfigSchema = baseWheelColorConfigSchema.extend({
    wheelColorType: z.literal(wheelColorTypeSchema.enum.Custom),
    colors: z.array(z.string()),
});

const wheelColorConfigSchema = z.union([
    wheelColorRandomConfigSchema,
    wheelColorMonochromaticConfigSchema,
    wheelColorAnalogousConfigSchema,
    wheelColorTriadConfigSchema,
    wheelColorTetradConfigSchema,
    wheelColorCustomConfigSchema,
]);

export {
    wheelColorTypeSchema,
    baseWheelColorConfigSchema,
    wheelColorRandomConfigSchema,
    wheelColorMonochromaticConfigSchema,
    wheelColorAnalogousConfigSchema,
    wheelColorTriadConfigSchema,
    wheelColorTetradConfigSchema,
    wheelColorCustomConfigSchema,
    wheelColorConfigSchema,
};
