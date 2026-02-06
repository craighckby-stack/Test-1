const IntegrityService = require('../utilities/integrityService');

/**
 * Generates unique, immutable identifiers (Immutable IDs or IIDs) based on the
 * content and structure of input data. 
 * This service abstracts the cryptographic hashing process to provide high-level,
 * deterministic identifiers crucial for configuration management, state consistency,
 * and artifact versioning.
 */
class ImmutableIdGenerator {
    constructor() {
        this.integrityService = new IntegrityService();
    }

    /**
     * Generates a stable, content-based ID for a data structure.
     * 
     * @param {object|string} data The data structure or content to identify.
     * @returns {string} The content-based Immutable ID (SHA-256 hash).
     */
    generateId(data) {
        return this.integrityService.calculateStableHash(data);
    }

    /**
     * Generates a versioned structure containing metadata and the IID.
     * Useful for stamping configurations or resource snapshots.
     * 
     * @param {string} resourceName - Name of the resource/structure.
     * @param {object} data - The data structure that defines the ID.
     * @returns {{resource: string, immutableId: string, timestamp: number}}
     */
    stampStructure(resourceName, data) {
        const immutableId = this.generateId(data);
        return {
            resource: resourceName,
            immutableId: immutableId,
            timestamp: Date.now()
        };
    }
}

module.exports = ImmutableIdGenerator;