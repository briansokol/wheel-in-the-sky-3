import { defineConfig } from 'oxlint';

/**
 * @see https://oxc.rs/docs/guide/usage/linter/config.html
 */
export default defineConfig({
    plugins: ['typescript', 'unicorn', 'react'],
    categories: {
        correctness: 'error',
        suspicious: 'warn',
    },
    rules: {
        'react/react-in-jsx-scope': 'off',
    },
    env: {
        builtin: true,
        browser: true,
    },
    settings: {
        react: {
            version: '19',
        },
    },
    overrides: [
        {
            files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
            plugins: ['typescript', 'unicorn', 'react', 'vitest'],
        },
    ],
    ignorePatterns: ['dist/**', 'coverage/**'],
});
