const Ajv = require('ajv');
const schema = require('../config/governance/P01_Gate_Schema.json');

/**
 * Validates a configuration instance against the P01 Governance Gate Schema.
 * 
 * NOTE: This implementation relies on the 'ValidationExecutionUtility' plugin
 * being available in the runtime context for standardized validation execution
 * and error formatting.
 *
 * @param {object} gateConfig - The specific gate definition to validate.
 * @returns {boolean} - True if valid, throws error if invalid.
 */
class GateSchemaValidator {
    constructor() {
        this.ajv = new Ajv({ schemas: [schema] });
        // Compile the schema once upon instantiation
        this.validate = this.ajv.getSchema(schema.$id) || this.ajv.compile(schema);
    }

    verify(gateConfig) {
        // Use the extracted utility for execution and standardized error reporting
        // ValidationExecutionUtility must be available in scope.
        return ValidationExecutionUtility.execute({
            validator: this.validate,
            data: gateConfig,
            errorPrefix: 'Gate Configuration Invalid'
        });
    }
}

module.exports = new GateSchemaValidator();