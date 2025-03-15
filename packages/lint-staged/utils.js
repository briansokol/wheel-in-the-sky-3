/**
 * Combines multiple configs into a single config
 *
 * @param  {...Record<string, string>} configs
 * @returns Record<string, string>
 */
export function combineConfigs(...configs) {
    return configs.reduce((acc, config) => {
        for (const key in config) {
            if (acc[key]) {
                acc[key] = `${acc[key]} && ${config[key]}`;
            } else {
                acc[key] = config[key];
            }
        }
        return acc;
    }, {});
}
