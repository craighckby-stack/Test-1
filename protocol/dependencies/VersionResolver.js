/**
 * Protocol Component Version Resolver (Sovereign AGI v94.1)
 * Manages the canonical list of compatible component versions for the current protocol runtime.
 * This utility is crucial for ensuring that requested CHR dependencies meet the current system's architectural constraints.
 */
class VersionResolver {
    /**
     * @param {Object} protocolConfig - The global configuration defining baseline system dependencies.
     * @param {Object} [toolRunner] - Mechanism to execute AGI kernel tools/plugins (e.g., { executeTool: (name, args) => result }). Optional if external checks are not required.
     */
    constructor(protocolConfig, toolRunner) {
        // Expected format: { component_name: { current_version: 'x.y.z', allowed_range: '^x.0.0' }, ... }
        this.baselineVersions = protocolConfig.system_dependencies || {};
        
        this._setupToolRunner(toolRunner);
    }

    /**
     * Sets up the internal method for running semantic version checks, including necessary fallbacks.
     * Abstracting this setup cleans up the main logic paths.
     * @param {Object} toolRunner 
     */
    _setupToolRunner(toolRunner) {
        if (typeof toolRunner === 'object' && typeof toolRunner.executeTool === 'function') {
            this.toolRunner = toolRunner;
            
            // Primary execution method using the external SemVerCompatibilityChecker tool
            this._runSemVerCheck = (currentVersion, requestedRange) => {
                try {
                    return this.toolRunner.executeTool('SemVerCompatibilityChecker', {
                        targetVersion: currentVersion,
                        requestedRange: requestedRange
                    });
                } catch (e) {
                    console.error(`Error executing SemVerCompatibilityChecker for version ${currentVersion} against range ${requestedRange}:`, e);
                    // Fail safe on execution error
                    return false;
                }
            };
        } else {
            console.warn("ToolRunner unavailable. VersionResolver defaulting to exact version comparison.");
            
            // Fallback: only allow exact matches if the robust tool cannot run.
            this._runSemVerCheck = (currentVersion, requestedRange) => {
                // When ToolRunner is missing, we must assume strict equality check.
                return currentVersion === requestedRange; 
            };
        }
    }

    /**
     * Checks if a requested component version lock is compatible with the current runtime protocol's baseline.
     * Uses the SemVerCompatibilityChecker plugin (if available) for robust semantic version evaluation.
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

        // Use the standardized internal runner defined during construction
        return this._runSemVerCheck(currentVersion, requestedVersionLock);
    }

    /**
     * Fetches the official protocol-mandated version for a component.
     * @param {string} componentName
     * @returns {string | null} The mandated version or null if undefined.
     */
    getMandatedVersion(componentName) {
        const baseline = this.baselineVersions[componentName];
        return baseline ? baseline.current_version : null;
    }
}

module.exports = VersionResolver;