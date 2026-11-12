/**
 * @see https://github.com/lint-staged/lint-staged?tab=readme-ov-file#configuration
 */
export default {
    '*.{js,jsx,ts,tsx}': ['oxlint --fix', 'prettier --write', 'vitest related --run'],
    '*.{css,scss,json,md,yaml,yml}': 'prettier --write',
};
