/**
 * ParameterAuditor v1.0.0
 * Loads and strictly enforces immutable scalar definitions from SPDM.json.
 * Required utility for maintaining P-01 viability integrity.
 */

import SPDM_CONFIG from '../config/SPDM.json';

class ParameterAuditor {
    constructor() {
        this.manifest = SPDM_CONFIG;
        // Placeholder for secure hashing implementation (e.g., using system crypto module)
        this.checksum = this.calculateManifestChecksum(JSON.stringify(SPDM_CONFIG));
        this.validateManifestSchema();
    }

    calculateManifestChecksum(data) {
        // In a production environment, this would compute SHA3-512
        return '0xIMMU_HASH_V95_';
    }

    validateManifestSchema() {
        if (!this.manifest.parameters || typeof this.manifest.parameters !== 'object') {
            throw new Error('SPDM Manifest integrity failure: Missing parameters dictionary.');
        }

        for (const [key, param] of Object.entries(this.manifest.parameters)) {
            if (!param.value || !param.type || !param.range || !param.attestation_signature) {
                throw new Error(`SPDM Schema Error: Parameter ${key} is missing required definition fields (type, range, value, or signature).`);
            }
            if (!Array.isArray(param.range) || param.range.length !== 2) {
                throw new Error(`SPDM Range Error: Parameter ${key} range must be a two-element array [min, max].`);
            }
        }
    }

    /**
     * Runtime check: ensures a proposed variable value adheres to the SPDM constraints.
     * This prevents core systems from operating outside defined safety margins.
     * @param {string} key - The ID of the scalar parameter (e.g., 'viability_margin_epsilon').
     * @param {number} proposedValue - The value being tested.
     * @returns {boolean} True if within range and type constraints.
     */
    enforceConstraint(key, proposedValue) {
        const param = this.manifest.parameters[key];

        if (!param) {
            console.error(`CRITICAL: Attempted to validate unknown immutable parameter: ${key}`);
            return false;
        }

        const [min, max] = param.range;

        if (typeof proposedValue !== 'number') {
             throw new TypeError(`Type mismatch for ${key}. Expected numeric value, got ${typeof proposedValue}.`);
        }

        if (proposedValue < min || proposedValue > max) {
            console.warn(`VIOLATION ALERT: Parameter ${key} requires value between [${min}, ${max}], observed ${proposedValue}. Rejecting.`);
            return false;
        }

        return true;
    }
}

export default new ParameterAuditor();