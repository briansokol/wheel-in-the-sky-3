import { configDefaults, defineProject } from 'vitest/config';

export default defineProject({
    test: {
        globals: true,
        exclude: [...configDefaults.exclude, '**/node_modules/**', '**/coverage/**', '**/public/**'],
    },
});
