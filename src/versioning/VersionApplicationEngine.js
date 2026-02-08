// VersionApplicationEngine.js

/**
 * Defines the core logic for resolving dynamic version strings based on metadata.
 * This structure ensures standardized SemVer (2.0.0) compliance with build metadata tagging.
 */
class VersionApplicationEngine {
    
    /**
     * Initializes the engine with base version configuration.
     * @param {object} config - Configuration containing base version details.
     * @param {object} config.current_version - Must contain major and minor fields.
     */
    constructor(config) {
        // Note: In a real system, robust validation would check config integrity.
        this.versionConfig = config;
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
    generateResolvedVersion(metadata) {
      // 1. Destructure essential version components from internal configuration
      const { major, minor } = this.versionConfig.current_version;
      
      // 2. Combine base version with dynamic patch equivalent (buildNumber)
      const versionString = `${major}.${minor}.${metadata.buildNumber}`;
      
      // 3. Extract the 7-character prefix of the commit hash (standard short hash)
      const hash = metadata.commitHash.substring(0, 7);
      
      // 4. Assemble the final SemVer string: CORE-BUILDTAG+METADATAHASH
      // This structure supports robust auditing and traceability back to source code.
      return `${versionString}-${metadata.buildType}+${hash}`;
    }
}