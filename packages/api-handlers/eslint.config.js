import { base } from '@repo/eslint';

export default [
    ...base,
    {
        ignores: ['worker-configuration.d.ts'],
    },
];
