/**
 * A highly optimized Composite Validator implementation leveraging the
 * ValidationAggregator plugin for efficient execution and error aggregation.
 */
class CompositeConfigValidator {
    /**
     * @param {Array<Object>} initialValidators - Objects implementing the validate(config) method.
     */
    constructor(initialValidators = []) {
        // The internal collection of validators, shared with the aggregator.
        this._validators = initialValidators;
        
        // Delegate core logic to the optimized plugin kernel.
        this._aggregator = new ValidationAggregator(this._validators);
    }

    /**
     * Adds a validator dynamically. Ensures runtime validation contract.
     * O(1) complexity.
     * @param {Object} validator 
     */
    addValidator(validator) {
        if (!validator || typeof validator.validate !== 'function') {
            throw new TypeError("Validator must be an object exposing a function named 'validate'.");
        }
        // Push directly to the shared array
        this._validators.push(validator);
    }

    /**
     * Validates the configuration by delegating execution to the aggregated validators.
     * The core aggregation loop runs with maximum computational efficiency (direct iteration).
     * @param {Object} config 
     * @returns {Array<Object>} List of validation errors, or empty array if valid.
     */
    validate(config) {
        return this._aggregator.execute(config);
    }
}

// export default CompositeConfigValidator;