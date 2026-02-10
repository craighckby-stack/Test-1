/**
 * TelemetryValidator
 * Autonomous runtime service for validating event payloads against GAXEventSchema.
 * Ensures all outgoing telemetry adheres to type, format, and constraint specifications.
 */

// Assuming the extracted tool is available via a standardized module path.
const DeclarativeEventSchemaValidator = require('@kernel/tools/DeclarativeEventSchemaValidator'); 
const GAXEventSchema = require('./GAXEventSchema');

class TelemetryValidator {
    /**
     * Validates a raw event payload against its defined schema using the declarative validator tool.
     * @param {string} eventName - The key name of the event (e.g., 'SYS:INIT:START').
     * @param {Object} payload - The raw data object to validate.
     * @returns {Object} { isValid: boolean, errors: Array<string> }
     */
    static validate(eventName, payload) {
        const schemaDefinition = GAXEventSchema[eventName];
        
        if (!schemaDefinition) {
            return {
                isValid: false,
                errors: [`Unknown event name: ${eventName}`]
            };
        }

        const schema = schemaDefinition.schema;
        
        // Delegate the core validation logic (required, type, enum, strictness) to the specialized, reusable tool.
        // Tool interface: .validate({ schema, payload }) -> { isValid, errors }
        return DeclarativeEventSchemaValidator.validate({ schema, payload });
    }
}

module.exports = TelemetryValidator;