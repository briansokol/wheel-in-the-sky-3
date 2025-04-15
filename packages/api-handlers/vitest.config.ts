import path from 'node:path';
import { configDefaults, defineProject } from 'vitest/config';

export default defineProject({
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, './src'),
        },
    },
    test: {
        globals: true,
        exclude: [...configDefaults.exclude, '**/node_modules/**', '**/coverage/**', '**/dist/**'],
    },
});
