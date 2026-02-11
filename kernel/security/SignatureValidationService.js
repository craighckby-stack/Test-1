/**
 * Signature Validation Service (SVS)
 * Responsible for cryptographic verification of transition requests and associated credentials.
 * Decouples cryptographic validation logic from SMC protocol enforcement by relying on external engines.
 */
class SignatureValidationService {

    /**
     * Initializes the service with necessary dependencies.
     * @param {object} dependencies
     * @param {object} dependencies.keyIdentityResolver - Service to map public keys/IDs to known system roles.
     * @param {object} dependencies.cryptoEngine - Interface for cryptographic operations (hashing, signature verification, canonicalization).
     * @param {object} dependencies.complianceReporter - Plugin for general compliance reporting and validation tracking.
     * @param {object} [dependencies.signatureContextFactory] - Optional factory to abstract context creation (auto-initialized if missing).
     */
    constructor({ keyIdentityResolver, cryptoEngine, complianceReporter, signatureContextFactory }) {
        if (!keyIdentityResolver || !cryptoEngine || !complianceReporter) {
            throw new Error("SignatureValidationService requires keyIdentityResolver, cryptoEngine, and complianceReporter.");
        }
        this.keyIdentityResolver = keyIdentityResolver;
        this.cryptoEngine = cryptoEngine;
        this.complianceReporter = complianceReporter;

        // Use provided factory or initialize the abstracted component internally
        if (signatureContextFactory) {
            this.contextFactory = signatureContextFactory;
        } else {
            // Assumes SignatureVerificationContextFactory is available (e.g., imported or required)
            // We instantiate it internally using the core dependencies it needs.
            const Factory = typeof SignatureVerificationContextFactory !== 'undefined' ? SignatureVerificationContextFactory : require('./SignatureVerificationContextFactory');
            this.contextFactory = new Factory({ keyIdentityResolver, cryptoEngine });
        }
    }

    /**
     * Internal method to create a deterministic, canonical representation of the request for signing.
     * MUST use a standardized canonical format (e.g., JCS, Canonical JSON) to guarantee integrity and determinism.
     * @param {object} request - The original transition request data.
     * @returns {string} The canonicalized message payload.
     */
    _canonicalizeRequest(request) {
        return this.cryptoEngine.canonicalize(request);
    }

    /**
     * Verifies if a given command/transition request was correctly signed by the required entity/entities.
     * @param {object} request - The original transition request data.
     * @param {object[]} signatures - Array of signatures provided with the request (must include publicKey/keyId and signature).
     * @param {Set<string>} requiredRoles - The set of roles whose signature is necessary for governance.
     * @returns {{verified: boolean, invalidSigners: string[], validRoles: Set<string>, missingRequiredRoles: Set<string>}}
     */
    verifyRequestSignatures(request, signatures, requiredRoles) {
        
        if (!signatures || signatures.length === 0) {
            const missingRequiredRoles = new Set(requiredRoles);
            return { verified: requiredRoles.size === 0, invalidSigners: [], validRoles: new Set(), missingRequiredRoles };
        }

        const messageToVerify = this._canonicalizeRequest(request);

        // 1. Abstract generation of ID extraction and validation functions
        const { idExtractor, validator } = this.contextFactory.createContext(messageToVerify);

        // 2. Utilize the generic compliance reporter with the generated context
        const complianceResult = this.complianceReporter.execute({
            requiredIds: requiredRoles,
            inputList: signatures,
            idExtractor: idExtractor,
            validator: validator
        });

        // Map results back to the domain specific terminology
        return {
            verified: complianceResult.verified,
            // invalidIds maps to invalidSigners
            invalidSigners: complianceResult.invalidIds,
            // validIds maps to validRoles
            validRoles: complianceResult.validIds,
            // missingRequiredIds maps to missingRequiredRoles
            missingRequiredRoles: complianceResult.missingRequiredIds
        };
    }
}

module.exports = SignatureValidationService;