/**
 * Configuration for lint-staged
 * Runs ESLint
 * @see https://github.com/lint-staged/lint-staged?tab=readme-ov-file#configuration
 */
export const eslint = {
    '*.{js,jsx,ts,tsx}': 'eslint --fix',
};

/**
 * Configuration for lint-staged
 * Runs Prettier
 * @see https://github.com/lint-staged/lint-staged?tab=readme-ov-file#configuration
 */
export const prettier = {
    '*.{js,ts,tsx,css,scss,json,md,yaml,yml}': 'prettier --write',
};

/**
 * Configuration for lint-staged
 * Runs Vitest on related files
 * @see https://github.com/lint-staged/lint-staged?tab=readme-ov-file#configuration
 */
export const vitest = {
    '*.{js,jsx,ts,tsx}': 'vitest related --run',
};
