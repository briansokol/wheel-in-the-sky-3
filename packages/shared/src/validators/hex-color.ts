import { z } from 'zod';

export const hexColorSchema = z.string().regex(/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i, 'Enter a hex color like #4062bf');
