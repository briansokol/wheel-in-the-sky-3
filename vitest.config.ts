import { configDefaults, coverageConfigDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        workspace: ['apps/*', 'packages/shared', 'packages/api-handlers'],
        exclude: [...configDefaults.exclude, './packages/e2e/**'],
        coverage: {
            provider: 'v8',
            exclude: [
                ...coverageConfigDefaults.exclude,
                '**/dist/**',
                '**/public/**',
                '**/__tests__/**',
                '**/*.config.{js,ts,mjs,mts}',
                '**/*.d.ts',
                '**/vitest*.{js,ts,mjs,mts}',
                './packages/eslint/**',
                './packages/prettier/**',
                './packages/lint-staged/**',
                './packages/e2e/**',
            ],
        },
    },
});
