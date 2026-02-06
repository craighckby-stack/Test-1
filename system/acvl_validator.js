const fs = require('fs/promises');

/**
 * Custom error type for ACVL validation failures.
 * Provides context and structure for downstream error handling (e.g., logging/telemetry).
 */
class ACVLIntegrityHalt extends Error {
    constructor(message, details = {}) {
        super(`[ACVL Integrity Halt] ${message}`);
        this.name = 'ACVLIntegrityHalt';
        this.details = details;
    }
}

/**
 * ACVD Validator & Constraint Loader (ACVL)
 * Enforces semantic and structural integrity of the Axiom Constraint Validation Domain (ACVD) file
 * BEFORE Stage S01 (CSR generation). Requires acvd_policy.json and potentially its schema.
 */
class ACVLValidator {
    constructor(acvdPath = 'config/acvd_policy.json', schemaPath = 'config/acvd_policy_schema.json') {
        this.acvdPath = acvdPath;
        this.schemaPath = schemaPath;
        
        // Mandatory keys definition moved here for explicit listing, though external schema validation is preferred.
        this.MANDATORY_KEYS = [
            'governance_version',
            'minimum_utility_threshold',
            'mandatory_policy_signatures'
        ];
    }

    /**
     * Utility function to safely load and parse JSON files asynchronously.
     * @param {string} path - The file path to load.
     * @param {string} purpose - Descriptive label for error reporting.
     * @returns {Promise<Object>}
     */
    async _loadJsonFile(path, purpose) {
        try {
            const content = await fs.readFile(path, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            if (error.code === 'ENOENT') {
                 throw new ACVLIntegrityHalt(`Required file not found: ${path}. Purpose: ${purpose}.`);
            }
            throw new ACVLIntegrityHalt(`Failed to load or parse ${purpose} file (${path}): ${error.message}`);
        }
    }

    /**
     * Executes structural and semantic checks against the loaded ACVD configuration.
     * @param {Object} config - The loaded ACVD object.
     */
    _performInternalValidation(config) {
        // 1. Mandatory Key Presence Check
        this.MANDATORY_KEYS.forEach(key => {
            if (!(key in config)) {
                throw new ACVLIntegrityHalt(`ACVD missing mandatory key: ${key}`);
            }
        });

        // 2. Semantic Checks: minimum_utility_threshold
        const threshold = config.minimum_utility_threshold;
        if (typeof threshold !== 'number' || threshold < 0.0 || threshold > 1.0) {
             throw new ACVLIntegrityHalt(`minimum_utility_threshold must be a numeric float between 0.0 and 1.0. Received: ${threshold}`);
        }

        // 3. Structural/Type Check: mandatory_policy_signatures
        if (!Array.isArray(config.mandatory_policy_signatures) || !config.mandatory_policy_signatures.every(s => typeof s === 'string' && s.length > 0)) {
            throw new ACVLIntegrityHalt(`mandatory_policy_signatures must be a non-empty array of strings.`);
        }
        
        // 4. Version Format Check: governance_version (Enforce Major.Minor.Patch)
        if (typeof config.governance_version !== 'string' || !/^\d+\.\d+\.\d+$/.test(config.governance_version)) {
            throw new ACVLIntegrityHalt(`governance_version must adhere to Major.Minor.Patch format.`);
        }
    }

    async loadAndValidate() {
        // Load the ACVD file
        const config = await this._loadJsonFile(this.acvdPath, 'Axiom Constraint Validation Domain (ACVD)');
        
        // Validate integrity
        this._performInternalValidation(config);

        console.log(`[ACVL] ACVD V${config.governance_version} validated successfully. Ready for CSR (S01) generation.`);
        return config; // Return validated constraints
    }
}

module.exports = { ACVLValidator, ACVLIntegrityHalt };