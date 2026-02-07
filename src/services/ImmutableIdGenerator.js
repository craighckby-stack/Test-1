const IntegrityService = require('../utilities/integrityService');

/**
 * Generates unique, immutable identifiers (Immutable IDs or IIDs) based on the
 * content and structure of input data. 
 * This service provides a static interface for deterministic identification.
 */
class ImmutableIdGenerator {

    /**
     * Lazily initializes and returns the IntegrityService instance.
     * Ensures the underlying utility is a singleton within this module scope, 
     * preventing repeated costly initializations.
     * @private
     */
    static get _integrityInstance() {
        if (!ImmutableIdGenerator.__instance) {
            // Dynamically import/instantiate IntegrityService once
            ImmutableIdGenerator.__instance = new IntegrityService();
        }
        return ImmutableIdGenerator.__instance;
    }
    
    /**
     * Generates a stable, content-based ID for a data structure.
     * 
     * @param {object|string} data The data structure or content to identify.
     * @returns {string} The content-based Immutable ID (SHA-256 hash).
     */
    static generateId(data) {
        return this._integrityInstance.calculateStableHash(data);
    }

    /**
     * Generates a versioned structure containing metadata and the IID.
     * NOTE: This structure includes a dynamic timestamp, making the resulting 
     * stamp non-deterministic across executions. Use for runtime tracking, not content verification.
     * 
     * @param {string} resourceName - Name of the resource/structure.
     * @param {object} data - The data structure that defines the ID.
     * @returns {{resource: string, immutableId: string, timestamp: number}}
     */
    static stampStructure(resourceName, data) {
        const immutableId = this.generateId(data);
        return {
            resource: resourceName,
            immutableId: immutableId,
            timestamp: Date.now()
        };
    }
}

module.exports = ImmutableIdGenerator;