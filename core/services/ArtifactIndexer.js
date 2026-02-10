/**
 * core/services/ArtifactIndexer.js
 * 
 * Centralized service responsible for managing artifact lifecycle: content storage, 
 * integrity validation, manifest generation, and index registration 
 * according to the Sovereign Manifest Protocol.
 */

// Assuming ProtocolError is located in a standard exceptions path
const ProtocolError = require('../exceptions/ProtocolError');

class ArtifactIndexer {
    /**
     * @param {object} dependencies 
     * @param {object} dependencies.contentStorage - Interface for storing raw content (e.g., FS, S3).
     * @param {object} dependencies.manifestStore - Interface for managing manifest records (e.g., Database, KV store).
     * @param {object} dependencies.hasher - Utility for cryptographic integrity calculations (e.g., BLAKE3/SHA-256).
     * @param {object} dependencies.idGenerator - Utility for generating canonical IDs (e.g., UUIDv7).
     * @param {object} dependencies.configProvider - Configuration service for accessing AGI version and protocol constants.
     * @param {object} dependencies.validator - Schema validator utility (e.g., Ajv).
     * @param {object} dependencies.logger - Structured logging service.
     * @param {object} dependencies.manifestConstructorUtility - Extracted utility for building compliant manifests.
     */
    constructor({
        contentStorage,
        manifestStore,
        hasher,
        idGenerator,
        configProvider,
        validator,
        logger,
        manifestConstructorUtility
    }) {
        this.contentStorage = contentStorage;
        this.manifestStore = manifestStore;
        this.hasher = hasher;
        this.idGenerator = idGenerator;
        this.validator = validator;
        this.logger = logger; 
        this.manifestConstructorUtility = manifestConstructorUtility;

        // Retrieve critical protocol constants from config, ensuring single source of truth.
        this.agiVersion = configProvider.getAGIVersion();
        this.protocolVersion = configProvider.getProtocolVersion();
    }

    /**
     * Stores artifact content, calculates integrity, and generates a canonical manifest.
     * @param {Buffer} content 
     * @param {object} baseMetadata - Contains artifact classification (type, name, operation_id).
     * @returns {Promise<object>} The fully populated and validated manifest.
     */
    async indexArtifact(content, baseMetadata) {
        if (!content || content.length === 0) {
            this.logger.warn('Attempted to index empty or null artifact content.', { metadata: baseMetadata });
            throw new ProtocolError("Cannot index empty artifact content.");
        }

        // 1. Calculate size and integrity hash (critical step for verifiability).
        const integrity = this._calculateHash(content);
        const artifactSize = content.length;
        
        // 2. Persist content to the dedicated Content Storage. Verifiability is enforced via hash.
        const location = await this.contentStorage.store(content, integrity.hash);

        // 3. Construct the manifest using standardized protocol and AGI versions via the utility.
        const manifest = this.manifestConstructorUtility.execute({
            baseMetadata,
            integrity,
            location,
            size: artifactSize,
            protocolVersion: this.protocolVersion,
            agiVersion: this.agiVersion,
            idGenerator: this.idGenerator
        });
        
        // 3b. Enforce adherence to the Sovereign Protocol Schema (INTELLIGENCE STEP).
        if (!this.validator.validate(manifest)) { 
             const errors = this.validator.getErrors ? this.validator.getErrors() : "Validation details unavailable.";
             this.logger.error('Generated manifest failed schema validation against the Sovereign Protocol.', { errors: errors });
             // Must throw a ProtocolError to signal a compliance failure upstream.
             throw new ProtocolError(`Manifest failed protocol validation. Errors: ${JSON.stringify(errors)}`);
        }

        // 4. Record the compliant manifest in the Index.
        await this.manifestStore.recordManifest(manifest);
        
        this.logger.info(`Artifact indexed successfully.`, {
            artifactId: manifest.id,
            type: baseMetadata.type,
            size: artifactSize,
            hashPrefix: integrity.hash.slice(0, 12)
        });
        return manifest;
    }

    /**
     * Uses the injected Hasher utility, relying on standardized cryptographic algorithms.
     * @param {Buffer} content
     * @returns {{ algorithm: string, hash: string }} 
     */
    _calculateHash(content) {
        const hash = this.hasher.calculate(content);
        return { algorithm: this.hasher.getAlgorithmName(), hash };
    }

    /**
     * Retrieves a manifest record from the dedicated Index Store.
     */
    async getManifest(id) {
        return this.manifestStore.getManifest(id);
    }
}

module.exports = ArtifactIndexer;