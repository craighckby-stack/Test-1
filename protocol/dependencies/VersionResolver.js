/**
 * Protocol Component Version Resolver (Sovereign AGI v94.1)
 * Manages the canonical list of compatible component versions for the current protocol runtime.
 * This utility is crucial for ensuring that requested CHR dependencies meet the current system's architectural constraints.
 * 
 * Dependency: SemVerCompatibilityChecker plugin.
 */
class VersionResolver {
    /**
     * @param {Object} protocolConfig - The global configuration defining baseline system dependencies.
     * @param {Object} toolRunner - Mechanism to execute AGI kernel tools/plugins (e.g., { executeTool: (name, args) => result }).
     */
    constructor(protocolConfig, toolRunner) {
        // Expected format: { component_name: { current_version: 'x.y.z', allowed_range: '^x.0.0' }, ... }
        this.baselineVersions = protocolConfig.system_dependencies || {};
        this.toolRunner = toolRunner;
    }

    /**
     * Checks if a requested component version lock is compatible with the current runtime protocol's baseline.
     * Uses the SemVerCompatibilityChecker plugin for robust semantic version evaluation.
     * 
     * @param {string} componentName 
     * @param {string} requestedVersionLock Semantic version string or range (e.g., "^1.2.0").
     * @returns {boolean}
     */
    isCompatible(componentName, requestedVersionLock) {
        const baseline = this.baselineVersions[componentName];
        
        if (!baseline) {
            // If the protocol doesn't mandate a version, we assume the component is external or optional.
            return true; 
        }

        const currentVersion = baseline.current_version;

        // CRITICAL: Use the extracted plugin for robust semver checking.
        
        if (typeof this.toolRunner !== 'object' || typeof this.toolRunner.executeTool !== 'function') {
            console.error("ToolRunner unavailable. Cannot perform robust version compatibility check.");
            // Fallback: only allow exact matches if the tool cannot run.
            return currentVersion === requestedVersionLock;
        }

        try {
            return this.toolRunner.executeTool('SemVerCompatibilityChecker', {
                targetVersion: currentVersion,
                requestedRange: requestedVersionLock
            });
        } catch (e) {
            console.error(`Error executing SemVerCompatibilityChecker for ${componentName}:`, e);
            return false; // Fail safe on execution error
        }
    }

    /**
     * Fetches the official protocol-mandated version for a component.
     * @param {string} componentName
     * @returns {string | null} The mandated version or null if undefined.
     */
    getMandatedVersion(componentName) {
        return this.baselineVersions[componentName] ? this.baselineVersions[componentName].current_version : null;
    }
}

module.exports = VersionResolver;