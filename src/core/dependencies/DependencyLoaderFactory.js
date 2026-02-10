/**
 * DependencyLoaderFactory
 * This module provides a centralized function capable of resolving module paths or service names.
 * It leverages the DependencyLookupUtility for robust and graceful dependency resolution.
 */

// CRITICAL: Assuming the DependencyLookupUtility is accessible via a runtime or module system.
// In a full AGI-KERNEL implementation, this would be injected or accessed via a standard kernel path.
// For Node.js context, we simulate access.
const DependencyLookupUtility = require('@agi-kernel/utilities').DependencyLookupUtility;

/**
 * Environment-specific loader function using Node.js 'require'.
 * This function is passed to the utility tool for execution under robust error handling.
 * @param {string} serviceName 
 * @returns {any}
 */
function nodeRequireLoader(serviceName) {
    // SECURITY WARNING: In a production environment dealing with user-defined input, 
    // ensure 'serviceName' is sanitized or mapped via an allowed list before calling require().
    // Assuming 'serviceName' here is a predefined module name from configuration.
    return require(serviceName);
}

/**
 * Default service loader function, delegating safety and error handling to the utility.
 * @param {string} serviceName - The name or path of the service/module to load.
 * @returns {any | null} The loaded module or null upon failure.
 */
function defaultServiceLoader(serviceName) {
    if (!DependencyLookupUtility || typeof DependencyLookupUtility.executeLookup !== 'function') {
        throw new Error("DependencyLookupUtility not initialized or accessible.");
    }
    
    // Delegate the synchronous execution and error handling to the reusable tool.
    return DependencyLookupUtility.executeLookup(serviceName, nodeRequireLoader);
}

module.exports = defaultServiceLoader;
