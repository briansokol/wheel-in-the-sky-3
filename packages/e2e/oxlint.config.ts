import { base } from '@repo/oxlint';
import { defineConfig } from 'oxlint';

export default defineConfig({
    extends: [base],
    ignorePatterns: ['**/worker-configuration.d.ts'],
});
