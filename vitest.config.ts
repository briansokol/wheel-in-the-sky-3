import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        coverage: {
            provider: 'v8',
            exclude: [
                ...configDefaults.exclude,
                '**/dist/**',
                '**/public/**',
                '**/__tests__/**',
                '**/*.config.{js,ts,mjs,mts}',
                '**/*.d.ts',
                '**/vitest*.{js,ts,mjs,mts}',
                'packages/eslint/**',
                'packages/prettier/**',
                'packages/lint-staged/**',
            ],
        },
    },
});
