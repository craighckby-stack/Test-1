/**
 * ParameterAuditor v2.0.0 (Sovereign AGI Refactor)
 * Strictly enforces immutable scalar definitions loaded from SPDM.json,
 * ensuring P-01 viability integrity by validating types, ranges, and access.
 */

import SPDM_CONFIG from '../config/SPDM.json';
import { AuditorError } from '../errors/AuditorError.js'; // Import centralized error class

class ParameterAuditor {
    #manifest;
    #checksum;

    constructor() {
        this.#manifest = SPDM_CONFIG;
        // NOTE: In a secure environment, this calculation must use a reliable cryptographic hash function (e.g., SHA3-512)
        // using a dedicated SystemCrypto module.
        this.#checksum = this.#calculateManifestChecksum(JSON.stringify(SPDM_CONFIG));
        this.#validateManifestSchema();
        console.log(`ParameterAuditor initialized. Manifest Hash: ${this.#checksum}`);
    }

    #calculateManifestChecksum(data) {
        // Placeholder implementation until SystemCryptoService is integrated.
        return '0xIMMU_HASH_V95_SECURE_TOKEN'; 
    }

    #validateType(key, value, expectedType) {
        let isValid = false;
        
        switch (expectedType.toLowerCase()) {
            case 'number':
                isValid = typeof value === 'number' && !isNaN(value);
                break;
            case 'integer':
                isValid = Number.isInteger(value);
                break;
            case 'boolean':
                isValid = typeof value === 'boolean';
                break;
            case 'string':
                isValid = typeof value === 'string';
                break;
            default:
                throw new AuditorError(`Unsupported type defined in manifest for ${key}: ${expectedType}`, 'SCHEMA_TYPE_UNSUPPORTED');
        }

        if (!isValid) {
            throw new AuditorError(
                `Type mismatch for ${key}. Expected '${expectedType}', observed '${typeof value}' with value: ${value}.`, 
                'AUDIT_TYPE_MISMATCH'
            );
        }
    }

    #validateManifestSchema() {
        if (!this.#manifest.parameters || typeof this.#manifest.parameters !== 'object') {
            throw new AuditorError('SPDM Manifest integrity failure: Missing parameters dictionary.', 'SCHEMA_MISSING_ROOT');
        }

        for (const [key, param] of Object.entries(this.#manifest.parameters)) {
            if (param.value === undefined || !param.type || !param.range || !param.attestation_signature) {
                throw new AuditorError(
                    `Parameter ${key} is missing required definition fields (type, range, value, or signature).`, 
                    'SCHEMA_FIELD_MISSING'
                );
            }
            if (!Array.isArray(param.range) || param.range.length !== 2) {
                throw new AuditorError(
                    `Parameter ${key} range must be a two-element array [min, max].`, 
                    'SCHEMA_INVALID_RANGE_FORMAT'
                );
            }
            
            // Validate the stored value against its defined type and range immediately upon loading
            this.enforceConstraint(key, param.value, true); 
        }
    }

    /**
     * Retrieves the strictly validated, immutable value for a defined parameter.
     * @param {string} key - The ID of the scalar parameter.
     * @returns {*} The immutable scalar value.
     */
    getValue(key) {
        const param = this.#manifest.parameters[key];
        if (!param) {
            throw new AuditorError(`Access attempt for unknown immutable parameter: ${key}`, 'AUDIT_UNKNOWN_KEY');
        }
        return param.value;
    }

    /**
     * Runtime check: ensures a proposed variable value adheres to the SPDM constraints.
     * @param {string} key - The ID of the scalar parameter.
     * @param {*} proposedValue - The value being tested.
     * @param {boolean} [isInitializationCheck=false] - Flag to suppress range warning during self-validation.
     * @throws {AuditorError} If constraints are violated.
     */
    enforceConstraint(key, proposedValue, isInitializationCheck = false) {
        const param = this.#manifest.parameters[key];

        if (!param) {
            throw new AuditorError(`Attempted to enforce constraint on unknown immutable parameter: ${key}`, 'AUDIT_UNKNOWN_KEY');
        }

        // 1. Type Check
        this.#validateType(key, proposedValue, param.type);

        // 2. Range Check (only applicable to numeric types)
        if (param.type.toLowerCase() === 'number' || param.type.toLowerCase() === 'integer') {
            const [min, max] = param.range;
            
            if (proposedValue < min || proposedValue > max) {
                const violationMessage = `Parameter ${key} requires value between [${min}, ${max}], observed ${proposedValue}.`;
                
                if (!isInitializationCheck) {
                    console.warn(`VIOLATION ALERT: ${violationMessage} Rejecting.`); 
                }

                throw new AuditorError(violationMessage, 'AUDIT_RANGE_VIOLATION');
            }
        }
        
        return true;
    }
}

// Export the singleton instance
export default new ParameterAuditor();