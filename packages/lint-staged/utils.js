/**
 * Combines multiple configs into a single config
 *
 * @param  {...Record<string, string | string[]>} configs
 * @returns Record<string, string | string[]>
 */
export function combineConfigs(...configs) {
    return configs.reduce((acc, config) => {
        for (const key in config) {
            if (acc[key]) {
                if (Array.isArray(acc[key])) {
                    acc[key] = Array.isArray(config[key]) ? [...acc[key], ...config[key]] : [...acc[key], config[key]];
                } else {
                    acc[key] = Array.isArray(config[key]) ? [acc[key], ...config[key]] : [acc[key], config[key]];
                }
            } else {
                acc[key] = config[key];
            }
        }
        return acc;
    }, {});
}
