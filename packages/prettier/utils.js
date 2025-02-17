export function combineConfigs(...configs) {
    return configs.reduce((acc, config) => {
        return {
            ...acc,
            ...config,
            plugins: [...(acc.plugins || []), ...(config.plugins || [])],
        };
    }, {});
}
