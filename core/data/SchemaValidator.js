/**
 * @module SchemaValidator
 * @description Central utility for managing and executing type and schema validation 
 * against defined data primitives. This decouples schema enforcement from data handling logistics.
 * Upgraded to support AGI-Kernel v7.4.4 core capability tracking (Navigation, Logic, Memory),
 * including boundary checks and nested schema references.
 */

class SchemaValidator {
    constructor() {
        this.schemas = this._defineCoreSchemas();
    }

    /**
     * Defines the core structural requirements for the AGI kernel operations.
     * This enforces expected JSON output from the primary evolution LLM and internal systems.
     */
    _defineCoreSchemas() {
        return {
            // 1. Schema for LLM Evolution Output (Must match App.js expectation)
            EvolutionOutput: {
                required: ['improvement_detected', 'rationale', 'code_update', 'maturity_rating', 'capabilities'],
                types: {
                    improvement_detected: 'boolean',
                    rationale: 'string',
                    code_update: 'string',
                    maturity_rating: 'number',
                },
                boundaries: { // NEW: Enforce percentage range
                    maturity_rating: { min: 0, max: 100 }
                },
                nested: {
                    capabilities: { // Ensures the required capability structure matches the AGI-KERNEL v7.4.4 core metrics.
                        required: ['navigation', 'logic', 'memory'],
                        types: {
                            navigation: 'number',
                            logic: 'number',
                            memory: 'number'
                        },
                        boundaries: { // Capabilities are scored 0-10
                            navigation: { min: 0, max: 10 }, 
                            logic: { min: 0, max: 10 }, 
                            memory: { min: 0, max: 10 }
                        }
                    }
                }
            },
            
            // 2. Schema for Nexus Database entries (Learning History)
            NexusEntry: {
                required: ['cycle', 'strategy', 'metrics', 'timestamp'],
                types: {
                    cycle: 'number',
                    strategy: 'string',
                    timestamp: 'number'
                },
                nested: { // NEW: Ensures metrics conforms to MQMMetrics schema
                    metrics: { ref: 'MQMMetrics' }
                }
            },
            
            // 3. Schema for MQM Metrics data
            MQMMetrics: {
                required: ['error_rate', 'latency_ms', 'improvement_score'],
                types: {
                    error_rate: 'number',
                    latency_ms: 'number',
                    improvement_score: 'number'
                },
                boundaries: { // NEW: Define reasonable bounds for MQM data
                    error_rate: { min: 0, max: 1 }, // Standard probability
                    latency_ms: { min: 0, max: 600000 }, // Max 10 mins latency
                    improvement_score: { min: -1, max: 1 } // -1 (regression) to 1 (major improvement)
                }
            },
            
            // Default System Status (If needed for monitoring)
            SystemStatus: { required: ['status', 'timestamp'], types: { status: 'string', timestamp: 'number' } }
        };
    }

    /**
     * Retrieves a schema definition based on the primitive type identifier.
     * @param {string} primitiveType - The key identifier for the required schema.
     * @returns {object|null} The schema definition object or null if not found.
     */
    getSchema(primitiveType) {
        return this.schemas[primitiveType] || null;
    }

    /**
     * Specialized validation for the primary LLM Evolution output structure.
     * Alias for validate(data, 'EvolutionOutput'). (Crucial for Mission Step 1)
     * @param {object} data - The parsed JSON data from the LLM.
     * @returns {{isValid: boolean, errors: string[]}}
     */
    validateEvolutionOutput(data) {
        return this.validate(data, 'EvolutionOutput');
    }

    /**
     * Validates a data payload against a known schema primitive.
     * @param {any} data - The decoded data payload.
     * @param {string} primitiveType - The expected schema type identifier.
     * @returns {{isValid: boolean, errors: string[]}} Validation result object, including detailed errors.
     */
    validate(data, primitiveType) {
        const schema = this.getSchema(primitiveType);
        const errors = [];

        if (!schema) {
            if (data === null || data === undefined) {
                 errors.push(`Data is null/undefined, but no schema '${primitiveType}' found.`);
            }
            return { isValid: errors.length === 0, errors };
        }

        if (typeof data !== 'object' || data === null) {
            errors.push(`Validation failed for '${primitiveType}': Data must be an object. Received: ${typeof data}`);
            return { isValid: false, errors };
        }

        // 1. Required field check
        if (schema.required) {
            for (const prop of schema.required) {
                if (!Object.prototype.hasOwnProperty.call(data, prop)) {
                    errors.push(`Schema ${primitiveType}: Missing required property: ${prop}`);
                }
            }
        }

        // 2. Type check
        if (schema.types) {
            for (const [prop, expectedType] of Object.entries(schema.types)) {
                if (Object.prototype.hasOwnProperty.call(data, prop)) {
                    const actualValue = data[prop];
                    const actualType = typeof actualValue;
                    
                    // LLM tolerance check: sometimes numbers or booleans are returned as strings
                    let typeValid = actualType === expectedType;
                    if (!typeValid) {
                         if (expectedType === 'number' && actualType === 'string' && !isNaN(parseFloat(actualValue))) {
                            typeValid = true; // Soft coercion allowed
                        } else if (expectedType === 'boolean' && actualType === 'string' && (actualValue === 'true' || actualValue === 'false')) {
                            typeValid = true; // Soft coercion allowed
                        }
                    }

                    if (!typeValid) {
                        errors.push(`Schema ${primitiveType}: Type mismatch for property '${prop}'. Expected ${expectedType}, got ${actualType}`);
                    }
                }
            }
        }
        
        // 3. Range check
        if (schema.boundaries) {
            for (const [prop, range] of Object.entries(schema.boundaries)) {
                if (Object.prototype.hasOwnProperty.call(data, prop)) {
                    let actualValue = data[prop];
                    // Coerce potential stringified number before boundary check
                    if (typeof actualValue === 'string' && schema.types?.[prop] === 'number') {
                        actualValue = parseFloat(actualValue);
                    }
                    if (typeof actualValue === 'number' && !isNaN(actualValue)) {
                        if (actualValue < range.min || actualValue > range.max) {
                            errors.push(`Schema ${primitiveType}: Value for '${prop}' (${actualValue}) is outside required range [${range.min}-${range.max}].`);
                        }
                    }
                }
            }
        }

        // 4. Nested object check (Updated to handle 'ref' for cross-schema checks)
        if (schema.nested) {
            for (const [prop, nestedSchema] of Object.entries(schema.nested)) {
                if (data[prop]) {
                    let nestedResult;
                    if (nestedSchema.ref) {
                        // Handle cross-reference validation (e.g., NexusEntry -> MQMMetrics)
                        nestedResult = this.validate(data[prop], nestedSchema.ref); 
                    } else {
                        // Handle inline nested validation (e.g., EvolutionOutput -> capabilities)
                        nestedResult = this._validateNested(data[prop], nestedSchema, `${primitiveType}.${prop}`);
                    }
                    
                    if (!nestedResult.isValid) {
                        errors.push(...nestedResult.errors);
                    }
                }
            }
        }

        return { isValid: errors.length === 0, errors };
    }
    
    _validateNested(data, schema, path) {
        const errors = [];
        
        if (typeof data !== 'object' || data === null) {
            errors.push(`Validation failed for nested object ${path}: Data must be an object.`);
            return { isValid: false, errors };
        }

        // Required field check for nested
        if (schema.required) {
            for (const prop of schema.required) {
                if (!Object.prototype.hasOwnProperty.call(data, prop)) {
                    errors.push(`Schema ${path}: Missing required property: ${prop}`);
                }
            }
        }
        
        // Type check for nested
        if (schema.types) {
            for (const [prop, expectedType] of Object.entries(schema.types)) {
                 if (Object.prototype.hasOwnProperty.call(data, prop)) {
                    const actualValue = data[prop];
                    const actualType = typeof actualValue;

                    let typeValid = actualType === expectedType;
                    // Soft coercion checks (same as above)
                    if (!typeValid) {
                         if (expectedType === 'number' && actualType === 'string' && !isNaN(parseFloat(actualValue))) {
                            typeValid = true;
                        } else if (expectedType === 'boolean' && actualType === 'string' && (actualValue === 'true' || actualValue === 'false')) {
                            typeValid = true;
                        }
                    }
                    
                    if (!typeValid) {
                        errors.push(`Schema ${path}: Type mismatch for property '${prop}'. Expected ${expectedType}, got ${actualType}`);
                    }
                }
            }
        }
        
        // Range check for nested
        if (schema.boundaries) {
            for (const [prop, range] of Object.entries(schema.boundaries)) {
                 if (Object.prototype.hasOwnProperty.call(data, prop)) {
                    let actualValue = data[prop];
                    // Coerce potential stringified number
                    if (typeof actualValue === 'string' && schema.types?.[prop] === 'number') {
                        actualValue = parseFloat(actualValue);
                    }
                    if (typeof actualValue === 'number' && !isNaN(actualValue)) {
                        if (actualValue < range.min || actualValue > range.max) {
                            errors.push(`Schema ${path}: Value for '${prop}' (${actualValue}) is outside required range [${range.min}-${range.max}].`);
                        }
                    }
                }
            }
        }

        return { isValid: errors.length === 0, errors };
    }
}

export default new SchemaValidator();
