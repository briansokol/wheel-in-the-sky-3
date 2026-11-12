/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
export default {
    // prettier-plugin-tailwindcss must be last.
    plugins: ['prettier-plugin-packagejson', '@trivago/prettier-plugin-sort-imports', 'prettier-plugin-tailwindcss'],
    tailwindStylesheet: './src/globals.css',
    tabWidth: 4,
    printWidth: 120,
    trailingComma: 'es5',
    singleQuote: true,
    quoteProps: 'consistent',
    overrides: [
        {
            files: '*.{css,scss,md}',
            options: {
                tabWidth: 2,
            },
        },
        {
            files: '*.{json,jsonc}',
            options: {
                tabWidth: 2,
                trailingComma: 'none',
            },
        },
    ],
    importOrder: ['<BUILTIN_MODULES>', '<THIRD_PARTY_MODULES>', '<TYPE>^@/(.*)$', '^@/(.*)$', '<TYPE>^[./]', '^[./]'],
    importOrderSeparation: false,
    importOrderSortSpecifiers: true,
    importOrderGroupNamespaceSpecifiers: true,
};
