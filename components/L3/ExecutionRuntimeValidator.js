/**
 * Manages the delegation of runtime validation checks to the concrete 
 * RuntimeConstraintValidator implementation (assumed to be available globally 
 * or via implicit injection).
 */
class ExecutionValidatorIntegrationHost {
    /**
     * Internal method to retrieve the concrete validator implementation.
     * Assumes global/implicit availability of RuntimeConstraintValidator.
     * @returns {object|null} The validator instance or null.
     */
    _getValidator() {
        // Checking for global or implicitly available dependency
        if (typeof RuntimeConstraintValidator !== 'undefined' && typeof RuntimeConstraintValidator.validate === 'function') {
            return RuntimeConstraintValidator;
        }
        return null;
    }

    /**
     * Validates the execution environment constraints by delegating to the concrete validator.
     * @param {object} constraints - ExecutionEnvironmentConstraints from SEM_config
     * @returns {boolean} True if environment meets constraints.
     */
    validate(constraints) {
        const validator = this._getValidator();
        
        if (!validator) {
            console.error("CRITICAL ERROR: RuntimeConstraintValidator plugin is not available.");
            return false;
        }

        return validator.validate(constraints);
    }
}

const RuntimeValidatorHost = new ExecutionValidatorIntegrationHost();

/**
 * Validates the local host environment against the strict resource constraints
 * defined in the SEM configuration prior to sandbox initialization.
 * 
 * Delegates actual resource checks (CPU, memory, accelerators) to the 
 * RuntimeConstraintValidator plugin for platform-agnostic execution.
 * 
 * @param {object} constraints - ExecutionEnvironmentConstraints from SEM_config
 * @returns {boolean} True if environment meets constraints.
 */
export function validateRuntime(constraints) {
    return RuntimeValidatorHost.validate(constraints);
}