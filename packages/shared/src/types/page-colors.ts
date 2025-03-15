import { z } from 'zod';
import { pageColorConfigSchema } from '@/validators/page-colors.js';

export type PageColorConfig = z.infer<typeof pageColorConfigSchema>;
