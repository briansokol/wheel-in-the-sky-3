// @ts-check
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import pluginReact from 'eslint-plugin-react';
import pluginReactRefresh from 'eslint-plugin-react-refresh';
import tailwind from 'eslint-plugin-tailwindcss';
import turboPlugin from 'eslint-plugin-turbo';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const compat = new FlatCompat({
    baseDirectory: import.meta.dirname,
});

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("@typescript-eslint/utils").TSESLint.FlatConfig.ConfigArray}
 * */
export const base = [
    js.configs.recommended,
    ...tseslint.configs.strict,
    ...tseslint.configs.stylistic,
    eslintConfigPrettier,
    {
        languageOptions: {
            globals: globals.builtin,
        },
        plugins: {
            unicorn: eslintPluginUnicorn,
        },
        rules: {
            'unicorn/prevent-abbreviations': 'off',
        },
    },
    {
        plugins: {
            turbo: turboPlugin,
        },
        rules: {
            'turbo/no-undeclared-env-vars': 'warn',
        },
    },
    {
        ignores: ['dist/**'],
    },
];

/**
 * A custom ESLint configuration for workspaces that use React.
 *
 * @type {import("@typescript-eslint/utils").TSESLint.FlatConfig.ConfigArray}
 * */
export const react = [
    pluginReact.configs.flat.recommended,
    {
        languageOptions: {
            ...pluginReact.configs.flat.recommended.languageOptions,
            ecmaVersion: 2020,
            globals: {
                ...globals.serviceworker,
                ...globals.browser,
            },
        },
        rules: {
            'react/react-in-jsx-scope': 'off',
        },
    },
    {
        plugins: {
            'react-refresh': pluginReactRefresh,
        },
        settings: { react: { version: 'detect' } },
        rules: {
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
        },
    },
    ...tailwind.configs['flat/recommended'],
    ...compat.config({
        extends: ['plugin:react-hooks/recommended'],
        plugins: ['react-compiler'],
        rules: {
            'react-compiler/react-compiler': 'error',
        },
    }),
];
