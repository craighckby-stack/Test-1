/**
 * ConstraintStrategyRegistry.js
 * Manages and provides access to custom validation functions (strategies) 
 * using the ConstraintPatternRegistryUtility plugin.
 */

// Assume injection/import of the ConstraintPatternRegistryUtility singleton
const registry = global.ConstraintPatternRegistryUtility;

if (!registry || typeof registry.register !== 'function') {
    // CRITICAL FAILURE: Plugin dependency missing
    throw new Error("Dependency 'ConstraintPatternRegistryUtility' missing.");
}

// --- Strategy Definitions (Specific to this application's engine) ---

/**
 * Registers strategies specific to the Integrity Validation Engine.
 */
function initializeStrategies() {
    
    // 1. Regex Strategy: Assumes state context provides the compiled regex.
    const regexStrategy = (value, param, state) => {
        try {
            if (state && state.regex instanceof RegExp) {
                return state.regex.test(String(value));
            }
            return false;
        } catch (e) {
            return false;
        }
    };

    // 2. Minimum Length Strategy
    const minLengthStrategy = (value, param) => {
        const length = parseInt(String(param));
        if (isNaN(length)) return false;
        return (Array.isArray(value) || typeof value === 'string') && value.length >= length;
    };

    // 3. Is Defined Strategy
    const isDefinedStrategy = (value) => value !== undefined && value !== null;

    // 4. Is Immutable Strategy (Placeholder/Contextual check)
    const isImmutableStrategy = () => true; 

    // Register them
    registry.register('regex', regexStrategy);
    registry.register('min_length', minLengthStrategy);
    registry.register('is_defined', isDefinedStrategy);
    registry.register('is_immutable', isImmutableStrategy);
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