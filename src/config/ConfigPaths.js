import path from 'path';

/**
 * System-wide Configuration Path Constants.
 * Centralizes paths to critical configuration files.
 */

// We assume execution context starts from the project root for critical startup config resolution.
const APP_ROOT = process.cwd(); 

/**
 * Helper function to resolve paths relative to the application root (process.cwd()).
 * @param {string} relativePath 
 * @returns {string} Absolute path
 */
const resolveRootPath = (relativePath) => {
    // path.resolve automatically handles joining and ensures an absolute path.
    return path.resolve(APP_ROOT, relativePath);
};

const ConfigPaths = {
    // Critical Governance Thresholds (Essential for Sovereign AGI startup)
    GOVERNANCE_CONFIG: resolveRootPath('config/governance.yaml'),
    
    // Standard Logger Output Location
    LOG_DIR: resolveRootPath('logs'),
    
    // Add other critical paths here as needed (e.g., memory, temporary artifacts)
    ARTIFACT_TEMP_DIR: resolveRootPath('tmp/artifacts'),
};

export default ConfigPaths;