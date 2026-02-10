// VersionApplicationEngine.js

/**
 * Defines the core logic for resolving dynamic version strings based on metadata.
 * This structure ensures standardized SemVer (2.0.0) compliance with build metadata tagging.
 */
class VersionApplicationEngine {
    
    // Note: TypeScript usage for better internal structure, adhering to 'new_code' rule.
    private versionConfig: any;
    private semVerFormatter: { generate: (config: any, metadata: any) => string };

    /**
     * Initializes the engine with base version configuration.
     * @param {object} config - Configuration containing base version details.
     * @param {object} config.current_version - Must contain major and minor fields.
     */
    constructor(config: any) {
        this.versionConfig = config;
        
        // CRITICAL: Assuming dependency resolution mechanism finds the plugin instance.
        // We simulate retrieval here, which would typically be handled by the AGI kernel's runtime environment.
        const pluginInstance = (globalThis as any)?.plugins?.SemVerFormatterUtility;
        
        if (pluginInstance && typeof pluginInstance.generate === 'function') {
            this.semVerFormatter = pluginInstance;
        } else {
            console.warn("SemVerFormatterUtility not found or invalid. Version generation will fail.");
            this.semVerFormatter = {
                generate: (c, m) => {
                    throw new Error("SemVerFormatterUtility is required but not loaded.");
                }
            };
        }
    }
    
    /**
     * Core method for generating the fully qualified, resolved version string.
     * Integrates base version fields (major, minor) with dynamic metadata 
     * (build number, build type, commit hash).
     * 
     * Output Pattern Example: 97.5.123-AE+d0c3fa4
     * 
     * @param {object} metadata - Dynamic build information.
     * @param {number} metadata.buildNumber - The iteration or patch number.
     * @param {string} metadata.commitHash - The full git commit hash (must be >= 7 chars).
     * @param {string} metadata.buildType - The type of build (e.g., AE, RC, DEV).
     * @returns {string} The fully resolved version identifier.
     */
    public generateResolvedVersion(metadata: any): string {
      // Delegate the complex string assembly and truncation logic to the utility.
      return this.semVerFormatter.generate(this.versionConfig, metadata);
    }
}