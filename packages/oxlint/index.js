import { defineConfig } from 'oxlint';

/**
 * A shared oxlint configuration for the repository.
 *
 * @see https://oxc.rs/docs/guide/usage/linter/config.html
 * @type {import('oxlint').OxlintConfig}
 */
export const base = defineConfig({
    plugins: ['typescript', 'unicorn'],
    categories: {
        correctness: 'error',
        suspicious: 'warn',
    },
    rules: {
        'unicorn/prevent-abbreviations': 'off',
    },
    env: {
        builtin: true,
    },
    ignorePatterns: ['dist/**'],
});

/**
 * A custom oxlint configuration for workspaces that use React.
 *
 * Intended to be used alongside `base`:
 * `extends: [base, react]`
 *
 * Note: the `react` plugin includes `react-hooks` rules. Plugins not natively
 * supported by oxlint (react-refresh, react-compiler, @tanstack/query,
 * testing-library, jest-dom) must remain in the ESLint config for now.
 *
 * @see https://oxc.rs/docs/guide/usage/linter/config.html
 * @type {import('oxlint').OxlintConfig}
 */
export const react = defineConfig({
    plugins: ['typescript', 'unicorn', 'react'],
    rules: {
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',
    },
    env: {
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
});
