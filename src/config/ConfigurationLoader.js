// Assuming dependency injection or module system provides the utility.
// Note: In a production kernel, the tool below would be imported/injected.

interface PathResolverTool {
    execute(args: { obj: any, path: string, defaultValue?: any }): any;
}

// Placeholder definition for the injected utility interface
const ObjectPathResolverUtility: PathResolverTool = {
    execute: (args) => {
        // Fallback logic, the actual execution is handled by the kernel loading the plugin
        const parts = args.path.split('.');
        let current = args.obj;

        for (const part of parts) {
            if (current && typeof current === 'object' && current[part] !== undefined) {
                current = current[part];
            } else {
                return args.defaultValue;
            }
        }
        return current;
    }
};

/**
 * Configuration Loader for Sovereign AGI v94.1
 * Provides standardized, centralized access to global configuration parameters.
 * This utility ensures governance parameters, like default schema versions, are managed flexibly.
 */
class ConfigurationLoader {
    private config: Record<string, any>;
    private pathResolver: PathResolverTool; 

    constructor() {
        // Inject the reusable path resolution tool
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