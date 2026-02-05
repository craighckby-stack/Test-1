/**
 * Telemetry Input Attestation Registrar (TIAR V97.0 - Refactored)
 * 
 * Role: Ensures non-repudiation and cryptographic integrity of decision input vectors 
 * (S-01, S-02) immediately prior to P-01 execution by the OGT. Guarantees the
 * Irreversible Mutation Gate operates on provably attested data.
 *
 * Dependencies: KeyManager, AttestationStore, Canonicalizer Utility.
 * GSEP Alignment: Stage 3 (Pre-P-01 Gate Execution)
 */

const DEFAULT_HASH_ALGORITHM = 'sha256';

class TelemetryInputAttestationRegistrar {
    
    /**
     * @param {object} dependencies 
     * @param {KeyManagementService} dependencies.keyManager - Service for signing/verifying.
     * @param {AttestationStoreInterface} dependencies.attestationStore - Persistence layer for commitments.
     * @param {Canonicalizer} dependencies.canonicalizer - Utility for deterministic serialization and hashing.
     */
    constructor(dependencies) {
        if (!dependencies.keyManager || !dependencies.attestationStore || !dependencies.canonicalizer) {
            throw new Error("TIAR initialization failed: Missing required dependencies (keyManager, attestationStore, canonicalizer).");
        }

        this.keyManager = dependencies.keyManager;
        this.attestationStore = dependencies.attestationStore; 
        this.canonicalizer = dependencies.canonicalizer;
        this.hashAlgorithm = dependencies.hashAlgorithm || DEFAULT_HASH_ALGORITHM;
    }

    /**
     * Receives raw inputs, signs the deterministic hash, and registers the commitment.
     * @param {object} inputVector - Contains raw S-01, S-02 data points and metadata.
     * @returns {Promise<object>} Contains the cryptographic hash and signature.
     */
    async attestInputs(inputVector) {
        // 1. Canonicalization: Convert input into a deterministic byte stream.
        const canonicalData = this.canonicalizer.canonicalize(inputVector); 
        
        // 2. Generate Deterministic Hash (The true commitment subject)
        const inputHash = this.canonicalizer.hash(canonicalData, this.hashAlgorithm);
        
        // 3. Sign the Hash (standard cryptographic practice)
        const signature = await this.keyManager.sign(inputHash);

        // 4. Construct and register the attestation record
        const attestationRecord = {
            hash: inputHash,
            signature: signature,
            timestamp: Date.now(),
            signerId: this.keyManager.getIdentityId(), 
            protocolVersion: 'TIAR-V97.0',
            inputReference: inputVector // Stored for external auditability
        };
        
        await this.attestationStore.storeAttestation(attestationRecord);
        console.log(`TIAR: Input vector attested. Hash: ${inputHash}`);
        
        return { hash: inputHash, signature: signature };
    }
    
    /**
     * Verifies the integrity and authenticity of a claimed input vector against a registered commitment.
     * @param {string} inputHash - The claimed registered hash reference.
     * @param {object} providedInputVector - The input data being claimed/validated.
     * @returns {Promise<object>} Validation result object.
     */
    async verifyAttestation(inputHash, providedInputVector) {
        // 1. Retrieve the registered commitment
        const record = await this.attestationStore.getAttestation(inputHash);
        if (!record) {
            return { valid: false, reason: "Attestation record not found for provided hash." };
        }

        // 2. Recalculate hash of the provided vector to verify content integrity
        const reCanonicalizedData = this.canonicalizer.canonicalize(providedInputVector);
        const reCalculatedHash = this.canonicalizer.hash(reCanonicalizedData, this.hashAlgorithm);

        if (reCalculatedHash !== record.hash) {
            return { valid: false, reason: "Input vector content integrity failure (hash mismatch)." };
        }

        // 3. Verify cryptographic signature against the stored identity
        const isSignatureValid = await this.keyManager.verify(
            record.hash, 
            record.signature, 
            record.signerId 
        );

        if (!isSignatureValid) {
            return { valid: false, reason: "Cryptographic signature validation failure (non-repudiation failure)." };
        }
        
        return { valid: true, signerId: record.signerId, timestamp: record.timestamp };
    }
}

module.exports = TelemetryInputAttestationRegistrar;