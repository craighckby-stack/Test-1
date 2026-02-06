const deepMerge = (target, source) => {
    for (const key of Object.keys(source)) {
        // Check for deep structure merge
        if (source[key] instanceof Object && !Array.isArray(source[key])) {
            if (!target[key]) target[key] = {};
            deepMerge(target[key], source[key]);
        } else {
            // Standard overwrite
            target[key] = source[key];
        }
    }
    return target;
};

/**
 * Applies environment-specific configuration overrides defined within the configuration manifesto.
 * This utility is critical for resolving layered configuration profiles efficiently.
 */
const applyEnvironmentOverrides = (config, environment) => {
    if (!config || !config.environment_overrides || !environment) return config;

    const overrideSet = config.environment_overrides[environment];
    if (!overrideSet) return config;

    // Create a mutable, deep copy of the base configuration
    const workingConfig = JSON.parse(JSON.stringify(config));
    
    // Apply the overrides recursively onto the base configuration structure
    deepMerge(workingConfig, overrideSet);

    // Remove the manifest metadata from the resolved runtime config
    delete workingConfig.environment_overrides;
    return workingConfig;
};

module.exports = { applyEnvironmentOverrides };