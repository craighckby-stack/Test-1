/**
 * Assuming dependency injection or module system provides the utility.
 * The concrete implementation (ObjectPathResolverUtility) is now provided by the kernel via the 'ObjectPathResolver' plugin.
 */

interface PathResolverTool {
    execute(args: { obj: any, path: string, defaultValue?: any }): any;
}

// NOTE: ObjectPathResolverUtility is declared here as an external dependency
// provided by the AGI-KERNEL runtime via the abstracted plugin.
declare const ObjectPathResolverUtility: PathResolverTool;

/**
 * Configuration Loader for Sovereign AGI v94.1
 * Provides standardized, centralized access to global configuration parameters.
 * This utility ensures governance parameters, like default schema versions, are managed flexibly.
 */
class ConfigurationLoader {
    private config: Record<string, any>;
    private pathResolver: PathResolverTool; 

    constructor() {
        // Inject the reusable path resolution tool (now an external dependency)
        this.pathResolver = ObjectPathResolverUtility;
        // Load configuration from all sources (e.g., environment variables, static files, defaults)
        this.config = this._loadDefaultConfig(); 
    }

    private _loadDefaultConfig(): Record<string, any> {
        // Defines critical governance defaults for module initialization.
        return {
            governance: {
                // Default schema key for the Mutation Payload Specification Engine (MPSE)
                mpseSchemaVersion: 'MPSE_SCHEMA_V1'
            },
            // System logging default settings
            logger: {
                level: 'info',
                retentionDays: 30
            }
        };
    }

    /**
     * Retrieves a configuration value using a dot-notated path (e.g., 'governance.mpseSchemaVersion').
     * Utilizes the ObjectPathResolverUtility for robust path resolution.
     * @param {string} path - The configuration key path.
     * @param {any} [defaultValue=undefined] - The value to return if the path is not found.
     * @returns {any} The configuration value.
     */
    get(path: string, defaultValue?: any): any {
        return this.pathResolver.execute({
            obj: this.config,
            path: path,
            defaultValue: defaultValue
        });
    }
}

// Export a singleton instance for global access
module.exports = new ConfigurationLoader();