import { sentryVitePlugin } from '@sentry/vite-plugin';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, './src'),
        },
    },

    plugins: [
        react(),
        sentryVitePlugin({
            org: 'brian-sokol',
            project: 'wits-web',
        }),
    ],

    test: {
        ...configDefaults,
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./vitest-setup.ts'],
        exclude: ['**/node_modules/**', '**/coverage/**'],
    },

    build: {
        sourcemap: true,
    },
});
