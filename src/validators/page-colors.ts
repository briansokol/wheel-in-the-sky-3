import { z } from 'zod';
import { PageColorType } from '@/enums/page-colors';

const pageColorTypeSchema = z.enum(PageColorType);

const pageColorConfigSchema = z.object({
    backgroundColorType: pageColorTypeSchema,
    backgroundColor: z.string(),
    foregroundColor: z.string(),
});

export { pageColorConfigSchema, pageColorTypeSchema };
