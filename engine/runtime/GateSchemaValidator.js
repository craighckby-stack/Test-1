const schema = require('../config/governance/P01_Gate_Schema.json');

/**
 * Validates a configuration instance against the P01 Governance Gate Schema 
 * using the standardized AjvSchemaValidator plugin.
 *
 * NOTE: This relies on the 'AjvSchemaValidator' plugin being available in the runtime context.
 *
 * @param {object} gateConfig - The specific gate definition to validate.
 * @returns {boolean} - True if valid, throws error if invalid.
 */
class GateSchemaValidator {
    constructor() {
        // AjvSchemaValidator handles schema compilation and standardized error execution logic.
        this.validator = new AjvSchemaValidator(schema);
    }

    verify(gateConfig) {
        return this.validator.validate(
            gateConfig,
            'Gate Configuration Invalid'
        );
    }
}

module.exports = new GateSchemaValidator();