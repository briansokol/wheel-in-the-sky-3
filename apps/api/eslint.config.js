import { base } from '@repo/eslint';

export default [
    ...base,
    {
        ignores: ['**/public/**'],
    },
];
