// /governance/CSRE_validator.js

// Objective 2: UNIFIER Protocol - Export all functional logic

/**
 * GOVERNANCE: Standard Laws.
 * UNIFIER_REF: Target Kernel.
 *
 * This module enforces mandatory structured validation (Schema/Logic)
 * for configuration state before system activation (CRoT).
 */

// --- Core Exceptions (Mapped from Python) ---

class GovernanceHalt extends Error {
    constructor(message) {
        super(message);
        this.name = 'GovernanceHalt';
    }
}

class SchemaIntegrityBreach extends GovernanceHalt {
    constructor(message) {
        super(message);
        this.name = 'SchemaIntegrityBreach';
    }
}

class PolicyLogicError extends GovernanceHalt {
    constructor(message) {
        super(message);
        this.name = 'PolicyLogicError';
    }
}

class ConfigurationLoadError extends GovernanceHalt {
    constructor(message) {
        super(message);
        this.name = 'ConfigurationLoadError';
    }
}

// --- Constants ---
const ACVD_THRESHOLD_KEY = "acvd_threshold";

// --- Abstract Policy Server Definition (Protocol mapping) ---

/**
 * @typedef {Object} AbstractPolicyServer
 * @property {() => Promise<Object>} fetch_acvd Must return the raw configuration state dictionary (ACVD).
 */

class ConfigStateReconciliationEngine {
    /**
     * @param {AbstractPolicyServer} policyServer
     * @param {Object} policySchema - Assumed external schema validator interface (must have a .validate(data) method).
     */
    constructor(policyServer, policySchema) {
        if (!policyServer || typeof policyServer.fetch_acvd !== 'function') {
             throw new ConfigurationLoadError("Policy Server must implement fetch_acvd.");
        }
        if (!policySchema || typeof policySchema.validate !== 'function') {
             // Assuming the injected schema provides a validation method
             throw new ConfigurationLoadError("Policy Schema definition is invalid or missing validation method (.validate).");
        }

        this.pcs = policyServer;
        this.PolicyModel = policySchema; // Store the validation schema object

        console.debug("CSRE initialized.");
    }

    async preVetPolicies() {
        /**
         * Fetches critical configs, verifies schema integrity, and checks fundamental policy logic.
         * Returns the validated object on success.
         */
        
        try {
            const rawData = await this.pcs.fetch_acvd();

            // 1. Schema Validation 
            const validatedData = this._validateSchema(rawData);
            
            // 2. Advanced Logic Check 
            this._checkThresholdLogic(validatedData);
            
            console.info("ACVD policies successfully validated. Ready for CRoT.");
            return validatedData;

        } catch (e) {
            if (e instanceof GovernanceHalt) {
                throw e; // Catch known system-halting errors
            }
            // Catch unexpected exceptions
            console.error(`UNEXPECTED HALT: Internal processing error during pre-vetting: ${e.name}: ${e.message}`, e);
            throw new GovernanceHalt(`Unexpected pre-vet failure: ${e.name}`);
        }
    }

    /**
     * Enforces schema validation using the injected Policy Model.
     * @param {Object} rawData 
     * @returns {Object} Validated data
     */
    _validateSchema(rawData) {
        try {
            // Assume PolicyModel.validate returns { data: Object, error: null } or throws
            const validationResult = this.PolicyModel.validate(rawData);

            if (validationResult.error) {
                const errorDetail = JSON.stringify(validationResult.error);
                 throw new SchemaIntegrityBreach(`Structured Validation Failed. Details: ${errorDetail}`);
            }
            return validationResult.data; // Return the parsed/validated data
            
        } catch (e) {
            if (e instanceof SchemaIntegrityBreach) {
                throw e;
            }
            // Catch native validation library errors and wrap them
            throw new SchemaIntegrityBreach(`Validation failed due to internal error: ${e.message}`);
        }
    }

    /**
     * Ensures that critical governance values meet logical constraints.
     * @param {Object} validatedData 
     * @returns {boolean}
     */
    _checkThresholdLogic(validatedData) {
        if (!Object.prototype.hasOwnProperty.call(validatedData, ACVD_THRESHOLD_KEY)) {
             throw new PolicyLogicError(`Validation failure: Configuration model is missing critical logic attribute: ${ACVD_THRESHOLD_KEY}.`);
        }
        
        const threshold = validatedData[ACVD_THRESHOLD_KEY];

        if (typeof threshold !== 'number' || isNaN(threshold)) {
            // Secondary check for type integrity
            throw new PolicyLogicError(`ACVD Threshold value (${threshold}) failed mandatory numeric typing check (was ${typeof threshold}).`);
        }

        if (threshold < 0) {
             throw new PolicyLogicError(`ACVD Threshold detected as negative (${threshold}). TEMM constraint violation.`);
        }
        
        return true;
    }
}

module.exports = {
    ConfigStateReconciliationEngine,
    GovernanceHalt,
    SchemaIntegrityBreach,
    PolicyLogicError,
    ConfigurationLoadError,
    // Exporting exceptions for consumption by UNIFIER error handling
};
