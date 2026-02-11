/**
 * DependencyLoaderFactory
 * This module provides a centralized function capable of resolving module paths or service names.
 * It leverages the DependencyLookupUtility for robust and graceful dependency resolution.
 */

const DependencyLookupUtility = require('@agi-kernel/utilities').DependencyLookupUtility;

// CRITICAL: The concrete Node.js 'require' implementation has been abstracted into a standard kernel component.
// Assuming NodeEnvironmentLoader is now accessible via kernel context or standard module system path.
const NodeEnvironmentLoader = require('@agi-kernel/loaders').NodeEnvironmentLoader; 

/**
 * Default service loader function, delegating safety and error handling to the utility.
 * @param {string} serviceName - The name or path of the service/module to load.
 * @returns {any | null} The loaded module or null upon failure.
 */
function defaultServiceLoader(serviceName) {
    if (!DependencyLookupUtility || typeof DependencyLookupUtility.executeLookup !== 'function') {
        throw new ReferenceError("AGI-KERNEL Utility Failure: DependencyLookupUtility not initialized or accessible.");
    }
    
    // Delegate the synchronous execution and error handling to the reusable tool,
    // passing the abstracted Node environment loader.
    return DependencyLookupUtility.executeLookup(serviceName, NodeEnvironmentLoader);
}

module.exports = defaultServiceLoader;