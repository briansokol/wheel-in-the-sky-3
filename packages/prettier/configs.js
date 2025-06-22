/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
export const base = {
    plugins: ['@trivago/prettier-plugin-sort-imports'],
    tabWidth: 4,
    printWidth: 120,
    trailingComma: 'es5',
    singleQuote: true,
    quoteProps: 'consistent',
    overrides: [
        {
            files: '*.{css,scss}',
            options: {
                tabWidth: 2,
            },
            files: '*.{json,jsonc}',
            options: {
                tabWidth: 2,
                trailingComma: 'none',
            },
        },
    ],
    importOrder: ['<THIRD_PARTY_MODULES>', '<TYPE>^@/(.*)$', '^@/(.*)$', '<TYPE>^[./]', '^[./]'],
    importOrderSeparation: false,
    importOrderSortSpecifiers: true,
    importOrderGroupNamespaceSpecifiers: true,
};

/**
 * @see https://prettier.io/docs/configuration
 * @type {(tailwindStyleSheet: string, tailwindConfig: string) => import("prettier").Config}
 */
export const makeTailwindConfig = (tailwindStyleSheet, tailwindConfig) => ({
    plugins: ['prettier-plugin-tailwindcss'],
    tailwindStylesheet: tailwindStyleSheet,
    tailwindConfig: tailwindConfig,
});
