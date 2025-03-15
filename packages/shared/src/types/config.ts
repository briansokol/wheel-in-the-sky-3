import { z } from 'zod';
import { configFormInputsSchema, serializedConfigSchema } from '@/validators/config.js';

export type SerializedConfigManager = z.infer<typeof serializedConfigSchema>;
export type ConfigFormInputs = z.infer<typeof configFormInputsSchema>;

export type FormColorNameValue = 'baseColor' | 'customColors' | 'backgroundColor';
