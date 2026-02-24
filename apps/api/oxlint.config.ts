import { base } from '@repo/oxlint';
import { defineConfig } from 'oxlint';

export default defineConfig({
    extends: [base],
    ignorePatterns: ['**/public/**', '**/worker-configuration.d.ts'],
});
