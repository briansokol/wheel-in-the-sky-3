import { z } from 'zod';
import { WheelColorType } from '@/enums/wheel-colors.js';
import {
    baseWheelColorConfigSchema,
    wheelColorAnalogousConfigSchema,
    wheelColorConfigSchema,
    wheelColorCustomConfigSchema,
    wheelColorMonochromaticConfigSchema,
    wheelColorRandomConfigSchema,
    wheelColorTetradConfigSchema,
    wheelColorTriadConfigSchema,
} from '@/validators/wheel-colors.js';

export type BaseWheelColorConfig = z.infer<typeof baseWheelColorConfigSchema>;
export type WheelColorRandomConfig = z.infer<typeof wheelColorRandomConfigSchema>;
export type WheelColorMonochromaticConfig = z.infer<typeof wheelColorMonochromaticConfigSchema>;
export type WheelColorAnalogousConfig = z.infer<typeof wheelColorAnalogousConfigSchema>;
export type WheelColorTriadConfig = z.infer<typeof wheelColorTriadConfigSchema>;
export type WheelColorTetradConfig = z.infer<typeof wheelColorTetradConfigSchema>;
export type WheelColorCustomConfig = z.infer<typeof wheelColorCustomConfigSchema>;

export type WheelColorConfig = z.infer<typeof wheelColorConfigSchema>;

export const defaultWheelColorConfig: WheelColorConfig = { wheelColorType: WheelColorType.Random };
