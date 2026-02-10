import { SafeConfigurationDeepMergeTool } from "@plugin/SafeConfigurationDeepMergeTool";

/**
 * Represents a key-value mapping for configuration objects.
 */
interface Config {
    [key: string]: any;
}

/**
 * Defines the interface for a safe deep merge utility.
 */
interface IDeepMergeTool {
    safeDeepMerge(target: Config, source: Config): Config;
}

/**
 * Processes and merges configuration layers from base, environment, and overrides.
 * Ensures input validation and uses a secure deep merging utility.
 */
export class RuntimeConfigProcessor {
    private mergeTool: IDeepMergeTool;

    /**
     * @param mergeTool An instance of a safe configuration merging utility.
     */
    constructor(mergeTool: IDeepMergeTool) {
        if (!mergeTool || typeof mergeTool.safeDeepMerge !== 'function') {
            throw new Error("Initialization failed: Required SafeConfigurationDeepMergeTool dependency is missing or invalid.");
        }
        this.mergeTool = mergeTool;
    }

    /**
     * Checks if the input is a non-null, non-array object suitable for configuration.
     * @param input The value to check.
     * @returns True if the input is a valid configuration object.
     */
    private isValidConfigInput(input: any): input is Config {
        return input !== null && typeof input === 'object' && !Array.isArray(input);
    }

    /**
     * Processes and merges configuration layers in ascending priority:
     * Base Config -> Environment Config -> Override Set.
     *
     * @param config The base configuration object.
     * @param environment The environment specific configuration (e.g., development, staging).
     * @param overrideSet The final set of manual overrides (highest precedence).
     * @returns The merged and validated configuration object.
     */
    public processConfig(
        config: Config | null,
        environment: Config | null,
        overrideSet: Config | null
    ): Config {

        const base = this.isValidConfigInput(config) ? config! : {};
        const env = this.isValidConfigInput(environment) ? environment! : {};
        const overrides = this.isValidConfigInput(overrideSet) ? overrideSet! : {};

        // Start with a safe deep copy of the base configuration (Target: {}, Source: base)
        let resultConfig = this.mergeTool.safeDeepMerge({}, base);

        // 1. Merge Environment Config into the result
        resultConfig = this.mergeTool.safeDeepMerge(resultConfig, env);

        // 2. Merge Overrides (highest precedence) into the result
        resultConfig = this.mergeTool.safeDeepMerge(resultConfig, overrides);
        
        // Note: The previous costly JSON.parse(JSON.stringify(config)) is implicitly avoided
        // by relying on the mergeTool to perform a safe, efficient deep copy starting from {}.

        return resultConfig;
    }
}