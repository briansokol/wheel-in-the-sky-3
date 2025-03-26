import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import pluginQuery from '@tanstack/eslint-plugin-query';
import configPrettier from 'eslint-config-prettier';
import configTurbo from 'eslint-config-turbo/flat';
import pluginJestDom from 'eslint-plugin-jest-dom';
import pluginReact from 'eslint-plugin-react';
import pluginReactRefresh from 'eslint-plugin-react-refresh';
import pluginTailwind from 'eslint-plugin-tailwindcss';
import plugnTestingLibrary from 'eslint-plugin-testing-library';
import pluginUnicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const compat = new FlatCompat({
    baseDirectory: import.meta.dirname,
});

/**
 * A shared ESLint configuration for the repository.
 *
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 * @type {import("@typescript-eslint/utils").TSESLint.FlatConfig.ConfigArray}
 * */
export const base = [
    js.configs.recommended,
    ...tseslint.configs.strict,
    ...tseslint.configs.stylistic,
    configPrettier,
    {
        languageOptions: {
            globals: globals.builtin,
        },
        plugins: {
            unicorn: pluginUnicorn,
        },
        rules: {
            'unicorn/prevent-abbreviations': 'off',
        },
    },
    ...configTurbo,
    {
        rules: {
            'turbo/no-undeclared-env-vars': 'off',
        },
    },
    {
        ignores: ['dist/**'],
    },
];

/**
 * A custom ESLint configuration for workspaces that use React.
 *
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
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
            'react/prop-types': 'off',
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
    ...pluginQuery.configs['flat/recommended'],
    {
        files: ['**/*.test.{js,jsx,ts,tsx}'],
        ...plugnTestingLibrary.configs['flat/dom'],
        rules: {
            'testing-library/no-node-access': ['warn', { allowContainerFirstChild: true }],
        },
    },
    {
        files: ['**/*.test.{js,jsx,ts,tsx}'],
        ...pluginJestDom.configs['flat/recommended'],
    },
    ...pluginTailwind.configs['flat/recommended'],
    ...compat.config({
        extends: ['plugin:react-hooks/recommended'],
        plugins: ['react-compiler'],
        rules: {
            'react-compiler/react-compiler': 'error',
        },
    }),
];
