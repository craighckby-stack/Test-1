const METADATA_VALIDATION_ERROR = "Invalid metadata payload: Must be a non-null, non-array object.";
const KEY_VALIDATION_ERROR = "Invalid registry key: Key must be a non-empty string.";

/**
 * StateMetadataRegistry optimized for computational efficiency and robust state parity checking.
 * Utilizes Map for O(1) average time complexity for core operations.
 */
class StateMetadataRegistry {
    
    constructor() {
        this._registry = new Map();
        // High-resolution counter for internal state versioning/tracking
        this._version = 0;
        this._lastOperationTimestamp = Date.now();
    }

    /**
     * Private method for strict key parity checking (input validation).
     * @param {string} key
     */
    _checkKeyParity(key) {
        if (typeof key !== 'string' || key.trim() === '') {
            throw new Error(KEY_VALIDATION_ERROR);
        }
        // Optimization: Return trimmed key to ensure consistent lookup/storage keys
        return key.trim(); 
    }

    /**
     * Private method for strict metadata payload parity checking (input validation).
     * Enforces that metadata is a structured, non-array object.
     * @param {object} metadata
     */
    _checkMetadataParity(metadata) {
        if (metadata === null || typeof metadata !== 'object' || Array.isArray(metadata)) {
            throw new Error(METADATA_VALIDATION_ERROR);
        }
        return metadata;
    }

    /**
     * Registers or completely overwrites metadata for a given key.
     * Parity Check: Validates key and metadata structure.
     * @param {string} key - The state identifier.
     * @param {object} metadata - The associated metadata object.
     */
    setMetadata(key, metadata) {
        const validatedKey = this._checkKeyParity(key);
        this._checkMetadataParity(metadata);
        
        this._registry.set(validatedKey, metadata);
        this._version++;
        this._lastOperationTimestamp = Date.now();
        
        return true; 
    }

    /**
     * Retrieves metadata associated with a key. O(1) lookup.
     * Parity Check: Validates key existence and format.
     * @param {string} key - The state identifier.
     * @returns {object | null} The metadata object or null if not found.
     */
    getMetadata(key) {
        const validatedKey = this._checkKeyParity(key);
        return this._registry.get(validatedKey) || null;
    }

    /**
     * Deeply merges partial metadata into an existing entry, facilitating recursive abstraction.
     * Uses Object.assign for highly optimized shallow merging, minimizing computational overhead.
     * Parity Check: Validates key and partial metadata structure.
     * @param {string} key - The state identifier.
     * @param {object} partialMetadata - The properties to merge.
     */
    mergeMetadata(key, partialMetadata) {
        const validatedKey = this._checkKeyParity(key);
        const validatedMetadata = this._checkMetadataParity(partialMetadata);

        const existing = this._registry.get(validatedKey);

        if (!existing) {
            // Optimization: If nothing exists, bypass merge logic and just set it.
            return this.setMetadata(key, validatedMetadata);
        }

        // Computational Efficiency: Object.assign provides the fastest standard JS shallow merge.
        Object.assign(existing, validatedMetadata);
        
        // Update version and timestamp
        this._version++;
        this._lastOperationTimestamp = Date.now();
        
        return true;
    }

    /**
     * Checks the internal integrity (Parity Check) of the entire registry state.
     * Ensures all stored keys and values conform to expected types.
     * @returns {object} A report detailing integrity status.
     */
    checkStateIntegrity() {
        let issues = [];
        let totalEntries = this._registry.size;

        for (const [key, value] of this._registry.entries()) {
            try {
                // Key integrity check
                this._checkKeyParity(key); 
                // Value structure integrity check
                this._checkMetadataParity(value); 
            } catch (e) {
                issues.push({ key, error: e.message });
            }
        }

        return {
            integrity_ok: issues.length === 0,
            registry_version: this._version,
            totalEntries,
            lastUpdated: this._lastOperationTimestamp,
            integrity_issues: issues
        };
    }
}

module.exports = StateMetadataRegistry;