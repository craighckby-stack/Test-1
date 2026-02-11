import { ProofVerificationError } from '../../utils/errors/ProofVerificationError.js';

/**
 * AxiomaticProofVerifierKernel
 * Handles the verification of axiomatic consensus proofs, including cryptographic integrity and weighted consensus threshold checks.
 * Dependencies must be injected: validatorRegistry, dataIndexer (for optimized lookup), and a signature verification utility.
 */
export class AxiomaticProofVerifierKernel {
    #validatorRegistry;
    #dataIndexer;
    #signatureVerifier;
    #ProofVerificationError;

    /**
     * @param {object} dependencies
     * @param {object} dependencies.validatorRegistry - Tool for accessing eligible validators (e.g., ValidatorRegistry).
     * @param {object} dependencies.dataIndexer - Tool for optimizing data structure lookups (e.g., DataIndexer).
     * @param {function} dependencies.signatureVerifier - Utility function (async) for cryptographic signature verification.
     * @param {Error} dependencies.ProofVerificationError - The custom error class for proof verification failures.
     */
    constructor(dependencies) {
        this.#validatorRegistry = dependencies.validatorRegistry;
        this.#dataIndexer = dependencies.dataIndexer;
        this.#signatureVerifier = dependencies.signatureVerifier;
        this.#ProofVerificationError = dependencies.ProofVerificationError || ProofVerificationError;
        this.#setupDependencies();
    }

    /**
     * Ensures all required dependencies are available and valid.
     * (Satisfies synchronous setup extraction goal).
     */
    #setupDependencies() {
        if (!this.#validatorRegistry || !this.#validatorRegistry.getEligibleValidators) {
            this.#throwSetupError("validatorRegistry dependency is missing or lacks getEligibleValidators method.");
        }
        if (!this.#dataIndexer || !this.#dataIndexer.indexArray) {
            this.#throwSetupError("dataIndexer dependency is missing or lacks indexArray method.");
        }
        if (typeof this.#signatureVerifier !== 'function') {
            this.#throwSetupError("signatureVerifier must be a verification function.");
        }
    }

    // --- I/O Proxy Functions ---

    #throwSetupError(message) {
        throw new Error(`AxiomaticProofVerifierKernel setup error: ${message}`);
    }

    #throwProofVerificationError(message) {
        throw new this.#ProofVerificationError(message);
    }

    /** Delegates fetching eligible validators from the registry. */
    async #delegateToValidatorRegistry() {
        return this.#validatorRegistry.getEligibleValidators();
    }

    /** Delegates array indexing to the DataIndexer tool. */
    #delegateToDataIndexer(array, key) {
        return this.#dataIndexer.indexArray(array, key);
    }

    /** Delegates cryptographic signature verification. */
    async #delegateToSignatureService(message, signature, publicKey) {
        return this.#signatureVerifier(message, signature, publicKey);
    }

    // --- Internal Logic Proxies ---

    #checkProofStructureAndThrow(proof, stateHash) {
        if (!proof || !stateHash || !proof.signatures || typeof proof.thresholdMet !== 'number') {
            this.#throwProofVerificationError("Proof structure or state hash is invalid or incomplete.");
        }
    }

    #calculateRequiredWeight(eligibleValidators, thresholdMet) {
        const totalVotingWeight = eligibleValidators.reduce((sum, v) => sum + v.weight, 0);
        return totalVotingWeight * thresholdMet;
    }

    /**
     * Verifies the consensus proof attached to a finalized state record.
     * @param {object} proof - The ValidationProofStructure object.
     * @param {string} stateHash - The hash of the validated data.
     * @returns {Promise<boolean>} True if the proof meets all axiomatic requirements.
     */
    async verifyAxiomaticProof(proof, stateHash) {
        this.#checkProofStructureAndThrow(proof, stateHash);
        
        // 1. Prepare Validator Lookup and Calculate Total Weight
        const eligibleValidators = await this.#delegateToValidatorRegistry();

        if (eligibleValidators.length === 0) {
            // Cannot verify proof if there are no eligible validators registered.
            return false;
        }

        const requiredThreshold = proof.thresholdMet;
        const validatorMap = this.#delegateToDataIndexer(eligibleValidators, 'id');
        const requiredWeight = this.#calculateRequiredWeight(eligibleValidators, requiredThreshold);

        let accumulatedWeight = 0;
        const validatedValidatorIds = new Set(); 

        // 2. Iterate and Verify Signatures
        for (const signatureAttestation of proof.signatures) {
            const validatorId = signatureAttestation.validatorId;

            if (!validatorId || !signatureAttestation.signature) {
                continue;
            }

            const validatorInfo = validatorMap[validatorId];
            
            // Check 1: Validator must be active/known
            if (!validatorInfo) {
                 continue;
            }

            // Check 2: Prevent double-counting
            if (validatedValidatorIds.has(validatorId)) {
                continue; 
            }

            // 3. Verify cryptographic signature (I/O Proxy)
            const messageToVerify = `${stateHash}:${proof.consensusMechanism}:${signatureAttestation.nonce}`;

            const isValidSignature = await this.#delegateToSignatureService(
                messageToVerify,
                signatureAttestation.signature,
                validatorInfo.publicKey
            );

            if (isValidSignature) {
                accumulatedWeight += validatorInfo.weight;
                validatedValidatorIds.add(validatorId); 
                
                // Optimization: Early exit if threshold is reached
                if (accumulatedWeight >= requiredWeight) {
                    return true;
                }
            }
        }

        // 4. Final Check 
        return accumulatedWeight >= requiredWeight;
    }
}