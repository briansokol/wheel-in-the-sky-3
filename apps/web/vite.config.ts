import { sentryVitePlugin } from '@sentry/vite-plugin';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';

const plugins = [react()];
if (process.env.WITH_SENTRY) {
    plugins.push(
        sentryVitePlugin({
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_WEB_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN,
        })
    );
}

// https://vite.dev/config/
export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, './src'),
        },
    },
    plugins,
    test: {
        ...configDefaults,
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./vitest-setup.ts'],
        exclude: ['**/node_modules/**', '**/coverage/**', '**/dist/**'],
    },
    build: {
        sourcemap: true,
    },
});
