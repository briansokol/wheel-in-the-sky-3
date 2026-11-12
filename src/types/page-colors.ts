import { z } from 'zod';
import { pageColorConfigSchema } from '@/validators/page-colors';

export type PageColorConfig = z.infer<typeof pageColorConfigSchema>;
