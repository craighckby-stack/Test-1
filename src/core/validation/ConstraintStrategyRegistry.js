/**
 * ConstraintStrategyRegistry.js
 * Manages and provides access to custom validation functions (strategies) 
 * using the ConstraintPatternRegistryUtility plugin and initializes them 
 * using CoreValidationStrategies plugin.
 */

// Assume injection/import of the ConstraintPatternRegistryUtility singleton
const registry = global.ConstraintPatternRegistryUtility;

if (!registry || typeof registry.register !== 'function') {
    // CRITICAL FAILURE: Plugin dependency missing
    throw new Error("Dependency 'ConstraintPatternRegistryUtility' missing.");
}

// --- Dependency Injection for Strategy Definitions ---
// Assumes CoreValidationStrategies is available in the global scope after initialization.
const CoreValidationStrategies = global.CoreValidationStrategies;

if (!CoreValidationStrategies || typeof CoreValidationStrategies.registerAll !== 'function') {
    // CRITICAL FAILURE: Strategy dependency missing
    throw new Error("Dependency 'CoreValidationStrategies' missing or malformed. Strategy initialization failed.");
}

/**
 * Registers strategies specific to the Integrity Validation Engine 
 * using the abstract CoreValidationStrategies plugin.
 */
function initializeStrategies() {
    // Delegate strategy definition and registration to the dedicated utility plugin
    CoreValidationStrategies.registerAll(registry);
}

// Execute registration immediately
initializeStrategies();

/**
 * ConstraintStrategyRegistry Class Wrapper.
 * Acts as the public interface, delegating calls to the underlying plugin instance.
 */
class ConstraintStrategyRegistry {
    constructor() {
        // The underlying registry is initialized above.
    }

    /**
     * Registers a new constraint strategy function.
     * @param {string} name - The identifier.
     * @param {function} handler - The validation function.
     */
    register(name, handler) {
        // Delegation to the utility plugin
        registry.register(name, handler);
    }

    /**
     * Retrieves a constraint strategy by name.
     */
    get(name) {
        return registry.get(name);
    }
}

// Singleton pattern export, using the class wrapper.
module.exports = new ConstraintStrategyRegistry();