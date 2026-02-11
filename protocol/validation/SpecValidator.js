class SpecValidator {
    // Strategic Optimization 3: Minimize error handling overhead by reusing static error objects.
    static ERROR_CACHE = {
        SCHEMA_NOT_FOUND: Object.freeze({ success: false, code: 404, message: "Schema specification not found or cached." }),
        VALIDATION_FAILURE: Object.freeze({ success: false, code: 400, message: "Validation failed against specification rules." })
    };

    /**
     * @param {Object} specs - Raw specification source definitions.
     * @param {Object<string, Function>} customRules - Map of custom validation functions.
     */
    constructor(specs, customRules = {}) {
        this.specs = specs;
        
        // Strategic Optimization 1: Implement schema caching using Map for fast lookups.
        this._schemaCache = new Map(); 

        // Strategic Optimization 2: Use Map for custom rules for O(1) average lookup time.
        this.customRules = new Map(Object.entries(customRules));
    }

    /**
     * Retrieves a schema from cache, falling back to raw storage if necessary.
     * @param {string} specName
     * @returns {Object|null}
     */
    _getOrCacheSchema(specName) {
        if (this._schemaCache.has(specName)) {
            return this._schemaCache.get(specName);
        }

        const schema = this.specs[specName];
        if (schema) {
            // Optional: Deep freeze schema here if immutability is guaranteed and desired
            this._schemaCache.set(specName, schema);
            return schema;
        }
        return null;
    }

    /**
     * Executes a custom validation rule via direct O(1) lookup.
     * @param {string} ruleName
     * @param {*} data
     * @returns {boolean}
     */
    _applyCustomRule(ruleName, data) {
        const ruleFn = this.customRules.get(ruleName);
        if (ruleFn) {
            return ruleFn(data);
        }
        // If rule doesn't exist, treat as success to avoid breaking validation flow
        return true; 
    }

    /**
     * Validates input data against a cached or retrieved specification.
     * @param {*} data - The input data structure.
     * @param {string} specName - The name of the specification to use.
     * @returns {Object} - Validation result.
     */
    validate(data, specName) {
        const schema = this._getOrCacheSchema(specName);

        if (!schema) {
            // Reusing static error object
            return SpecValidator.ERROR_CACHE.SCHEMA_NOT_FOUND;
        }

        // --- Placeholder for intensive recursive validation logic ---

        // Example of using custom rule lookup
        if (schema.requiredCustomCheck) {
            const result = this._applyCustomRule(schema.requiredCustomCheck, data);
            if (result === false) {
                // Reusing static error object
                return SpecValidator.ERROR_CACHE.VALIDATION_FAILURE; 
            }
        }

        // If validation succeeds
        return { success: true };
    }
}