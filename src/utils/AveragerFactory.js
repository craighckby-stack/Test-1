const ExponentialMovingAverager = require('./ExponentialMovingAverager');

/**
 * A central registry and factory for creating different types of Averager instances.
 * This decouples metric implementation from metric management, promoting extensibility.
 */
class AveragerFactory {
    
    /** 
     * Maps metric type strings to their respective implementation classes. 
     * @private @type {Map<string, Function>} 
     */
    static #registry = new Map();

    /** Initializes the default types available in the system. */
    static initializeDefaults() {
        // Default implementations must implement update(value) and have an 'average' property.
        AveragerFactory.registerType('EMA', ExponentialMovingAverager);
    }

    /**
     * Registers a new Averager implementation type.
     * @param {string} type - The key identifier for the averager (e.g., 'SMA', 'EMA').
     * @param {Function} AveragerClass - The class constructor of the averager.
     * @throws {Error} If registration parameters are invalid.
     */
    static registerType(type, AveragerClass) {
        if (typeof type !== 'string' || type.trim() === '' || typeof AveragerClass !== 'function') {
            throw new Error("Invalid type or class provided for Averager registration.");
        }
        if (!AveragerClass.prototype.update || !('average' in AveragerClass.prototype)) {
             console.warn(`Registered class for type '${type}' may not implement the standard metric interface.`);
        }
        AveragerFactory.#registry.set(type.toUpperCase(), AveragerClass);
    }

    /**
     * Creates an instance of the specified averager type.
     * @param {string} type - The key identifier of the averager to create (e.g., 'EMA').
     * @param {any[]} constructorArgs - Arguments to pass to the Averager constructor.
     * @returns {Object} An instance of the requested Averager.
     * @throws {Error} If the type is not registered.
     */
    static create(type, ...constructorArgs) {
        const normalizedType = type.toUpperCase();
        const AveragerClass = AveragerFactory.#registry.get(normalizedType);
        
        if (!AveragerClass) {
            throw new Error(`Averager type '${type}' not registered with the Factory.`);
        }

        // Dynamically instantiate the class with arguments
        return new AveragerClass(...constructorArgs);
    }

    /** @returns {Set<string>} A set of all currently registered averager types. */
    static getRegisteredTypes() {
        return new Set(AveragerFactory.#registry.keys());
    }
}

AveragerFactory.initializeDefaults();

module.exports = AveragerFactory;