/**
 * Utility: Intent Schema Validator
 * ID: ISV-v94.3
 * Focus: Ensures that incoming mutation intent payloads adhere strictly to required internal schemas
 *        before being processed by high-risk orchestrators like GCO.
 * 
 * Uses DeclarativeSchemaEnforcer (DSE) for structural integrity validation.
 */

/* global DeclarativeSchemaEnforcer */

class IntentSchemaValidator {

    /**
     * Defines the required schema structure for a standard MutationIntentPayload.
     * @returns {Object} Schema definition using DSE DSL.
     */
    static getRequiredSchema() {
        return {
            intentId: 'string|optional',
            source: 'string|required',
            targets: 'array<TargetDescriptor>|required',
            timestamp: 'number|required'
        };
    }

    /**
     * Validates and returns a standardized mutation intent payload.
     * 
     * @param {Object} rawPayload - The raw input data.
     * @returns {Object} Validated and normalized payload.
     * @throws {Error} If the payload violates required structural constraints.
     */
    validateMutationIntent(rawPayload) {
        if (!rawPayload || typeof rawPayload !== 'object') {
            throw new Error("ISV Validation Failure: Payload must be a valid object.");
        }

        const schema = IntentSchemaValidator.getRequiredSchema();

        // Delegate validation and normalization to the external, hardened tool (DSE)
        if (typeof DeclarativeSchemaEnforcer === 'undefined' || typeof DeclarativeSchemaEnforcer.validate !== 'function') {
             throw new Error("System Error: DeclarativeSchemaEnforcer plugin is not initialized.");
        }
        
        const validationResult = DeclarativeSchemaEnforcer.validate({
            rawPayload: rawPayload,
            schema: schema
        });

        if (!validationResult.success) {
            // Aggregating errors for a single failure point
            const errorMsg = validationResult.errors.join('; ');
            throw new Error(`ISV Validation Failure: Structural constraints violated. Errors: ${errorMsg}`);
        }

        // Return the validated and normalized payload provided by the tool
        return validationResult.payload;
    }
}

module.exports = IntentSchemaValidator;