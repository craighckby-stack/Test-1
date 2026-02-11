/**
 * @file AttestationFailureRecord.js
 * Represents an immutable record of a failed attestation attempt, leveraging
 * the ImmutableRecordBase plugin for standardized serialization and immutability.
 */

// NOTE: Assumes ImmutableRecordBase is imported/available in the execution context.
const { ImmutableRecordBase } = require('../plugins/ImmutableRecordBase');

/**
 * Defines the mapping between internal field names (full) and minimized external JSON keys (aId, vId, etc.)
 * for computational efficiency and reduced payload size.
 * @type {Object<string, string>}
 */
const RECORD_SCHEMA = Object.freeze({
    attestationId: 'aId',
    validatorId: 'vId',
    reason: 'r',
    timestamp: 't' // Unix epoch ms
});

class AttestationFailureRecord extends ImmutableRecordBase {
    /**
     * Constructs an immutable failure record.
     * @param {object} data - Data structure containing properties matching SCHEMA internal keys.
     * @param {string} data.attestationId - Unique ID of the failed attestation.
     * @param {string} data.validatorId - ID of the validator that recorded the failure.
     * @param {string} data.reason - Concise reason for the failure.
     * @param {number} data.timestamp - Timestamp (ms) of the failure.
     */
    constructor(data) {
        // Enforce essential validation before initializing the immutable structure.
        if (!data || !data.attestationId || typeof data.attestationId !== 'string' || 
            !data.validatorId || typeof data.timestamp !== 'number' || !data.reason) {
            throw new Error("AttestationFailureRecord: Required fields missing or invalid data type.");
        }

        // The base constructor handles property definition, immutability, and assignment.
        super(data, RECORD_SCHEMA);
    }

    /**
     * Serializes the record into a minimized JSON structure.
     * @returns {Object}
     */
    toJSON() {
        return ImmutableRecordBase.toJSON(this, RECORD_SCHEMA);
    }

    /**
     * Creates a new AttestationFailureRecord instance from a serialized JSON object.
     * @param {Object} json - The serialized record data.
     * @returns {AttestationFailureRecord}
     */
    static fromJSON(json) {
        const internalData = ImmutableRecordBase.fromJSON(json, RECORD_SCHEMA);
        return new AttestationFailureRecord(internalData);
    }

    /**
     * Helper for accessing the schema map without exposing internal details directly.
     * @returns {Object<string, string>}
     */
    static getSchema() {
        return RECORD_SCHEMA;
    }
}

module.exports = AttestationFailureRecord;
