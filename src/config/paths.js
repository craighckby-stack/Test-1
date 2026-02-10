/**
 * Defines centralized file paths for critical system operations, ensuring 
 * consistency across utilities by leveraging the Canonical Path Configuration Utility.
 */

// NOTE: In a managed AGI environment, utility calls are often handled through 
// a context or global access point that routes to the generated plugin.
// We assume the availability of the generated utility interface.

declare const CanonicalPathConfigurationUtility: {
    getPaths: (args: { root?: string }) => {
        ARTIFACT_ROOT: string;
        STAGING_PATH: string;
        QUARANTINE_PATH: string;
    }
};

// Delegate all path resolution complexity to the utility plugin.
const pathConfig = CanonicalPathConfigurationUtility.getPaths({
    // Pass the execution context root explicitly for clarity and consistency.
    root: process.cwd() 
});

module.exports = pathConfig;