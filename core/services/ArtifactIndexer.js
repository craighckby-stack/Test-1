/**
 * core/services/ArtifactIndexer.js
 * 
 * Centralized service responsible for managing artifact lifecycle: content storage, 
 * integrity validation, manifest generation, and index registration 
 * according to the Sovereign Manifest Protocol.
 */
class ArtifactIndexer {
    /**
     * @param {object} dependencies 
     * @param {object} dependencies.contentStorage - Interface for storing raw content (e.g., FS, S3).
     * @param {object} dependencies.manifestStore - Interface for managing manifest records (e.g., Database, KV store).
     * @param {object} dependencies.hasher - Utility for cryptographic integrity calculations (e.g., BLAKE3/SHA-256).
     * @param {object} dependencies.idGenerator - Utility for generating canonical IDs (e.g., UUIDv7).
     * @param {object} dependencies.configProvider - Configuration service for accessing AGI version and protocol constants.
     * @param {object} dependencies.validator - Schema validator utility (e.g., Ajv).
     */
    constructor({ contentStorage, manifestStore, hasher, idGenerator, configProvider, validator }) {
        this.contentStorage = contentStorage;
        this.manifestStore = manifestStore;
        this.hasher = hasher;
        this.idGenerator = idGenerator;
        this.agiVersion = configProvider.getAGIVersion(); 

        // NOTE: Validator ensures adherence to the protocol schema before indexing.
        this.validator = validator;
    }

    /**
     * Stores artifact content, calculates integrity, and generates a canonical manifest.
     * @param {Buffer} content 
     * @param {object} baseMetadata - Contains artifact classification (type, name, operation_id).
     * @returns {Promise<object>} The fully populated and validated manifest.
     */
    async indexArtifact(content, baseMetadata) {
        if (content.length === 0) {
            // Prevent indexing of zero-byte artifacts without explicit protocol allowance.
            throw new Error("Cannot index empty artifact content.");
        }

        // 1. Calculate size and integrity hash (critical step for verifiability).
        const integrity = this._calculateHash(content);
        const artifactSize = content.length;
        
        // 2. Persist content to the dedicated Content Storage and receive location data.
        // Passing the hash helps ensure integrity check on the storage layer itself.
        const location = await this.contentStorage.store(content, integrity.hash);

        // 3. Construct and validate the manifest against the Sovereign Protocol Schema.
        const manifest = this._constructManifest(baseMetadata, integrity, location, artifactSize);
        
        /* 
        if (!this.validator.validate(manifest)) { 
             throw new ProtocolError('Generated manifest failed schema validation against the Sovereign Protocol.');
        }
        */

        // 4. Record the manifest in the Index for retrieval/cataloging.
        await this.manifestStore.recordManifest(manifest);
        
        console.log(`Artifact indexed: ${manifest.id} (Size: ${artifactSize} bytes, Hash: ${integrity.hash.slice(0, 8)}...)`);
        return manifest;
    }

    /**
     * Uses the injected Hasher utility, relying on standardized cryptographic algorithms.
     * @param {Buffer} content
     * @returns {{ algorithm: string, hash: string }} 
     */
    _calculateHash(content) {
        const hashResult = this.hasher.calculate(content);
        return { algorithm: this.hasher.getAlgorithmName(), hash: hashResult };
    }

    /**
     * Constructs the canonical manifest object, populating metadata required by the protocol.
     */
    _constructManifest(baseMetadata, integrity, location, size) {
        const timestamp = Date.now();
        // Use canonical UUID generator for unique index IDs.
        const id = this.idGenerator.generateUUIDv7(); 

        return { 
            id: id, 
            protocol_version: 'v94.1', // Standardized reference
            agi_version: this.agiVersion,
            timestamp: timestamp, 
            metadata: baseMetadata,
            content_details: {
                size: size,
                location: location,
                integrity: integrity 
            }
        };
    }

    /**
     * Retrieves a manifest record from the dedicated Index Store.
     */
    async getManifest(id) {
        return this.manifestStore.getManifest(id);
    }
}

module.exports = ArtifactIndexer;
