import { base } from '@repo/eslint';

export default [
    ...base,
    {
        ignores: ['**/public/**', 'worker-configuration.d.ts'],
    },
];
