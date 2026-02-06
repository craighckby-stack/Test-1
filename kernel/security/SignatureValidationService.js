/**
 * Signature Validation Service (SVS)
 * Responsible for cryptographic verification of transition requests and associated credentials.
 * Decouples cryptographic validation logic from SMC protocol enforcement.
 */
class SignatureValidationService {

    /**
     * Initializes the service, typically loading cryptographic libraries or key registries.
     * @param {object} keyRegistry - Map of known public keys associated with roles.
     */
    constructor(keyRegistry) {
        this.keyRegistry = keyRegistry || {};
        // NOTE: In production, this would initialize external HSM/crypto interfaces.
    }

    /**
     * Verifies if a given command/transition request was correctly signed by the required entity/entities.
     * @param {object} request - The original transition request data.
     * @param {object[]} signatures - Array of signatures provided with the request.
     * @param {Set<string>} requiredRoles - The set of roles whose signature is necessary for governance.
     * @returns {{verified: boolean, invalidSigners: string[], validRoles: Set<string>}}
     */
    verifyRequestSignatures(request, signatures, requiredRoles) {
        const validRoles = new Set();
        const invalidSigners = [];

        if (!signatures || signatures.length === 0) {
            if (requiredRoles.size > 0) {
                return { verified: false, invalidSigners: [], validRoles };
            }
            return { verified: true, invalidSigners: [], validRoles };
        }

        // Standardize the message payload to prevent replay attacks and ensure integrity
        const messageToVerify = this._serializeRequest(request);

        for (const sig of signatures) {
            // 1. Identify signer and map to role
            const role = this._resolveRoleFromSignatureKey(sig.publicKey);

            if (!role || !requiredRoles.has(role)) {
                // Signature not relevant or key unknown/not associated with a required role
                continue;
            }

            try {
                // 2. Execute cryptographic verification (Stub: Assume crypto verification function exists)
                const isValid = this._cryptoVerify(messageToVerify, sig.signature, sig.publicKey);

                if (isValid) {
                    validRoles.add(role);
                } else {
                    invalidSigners.push(role); 
                }
            } catch (e) {
                console.error(`Signature verification failed for role ${role}:`, e);
                invalidSigners.push(role); 
            }
        }

        // Verification is complete if the number of distinct valid roles meets the threshold (threshold checking remains in SMCTransitionEnforcer)
        // This service simply returns WHICH roles provided a valid signature.
        return {
            verified: invalidSigners.length === 0,
            invalidSigners,
            validRoles
        };
    }

    /**
     * Stubs for internal cryptographic operations (actual implementation depends on chosen crypto library).
     */
    _serializeRequest(request) {
        // Must return a deterministic string representation of the request object.
        return JSON.stringify({ current: request.current, target: request.target, command: request.command });
    }

    _resolveRoleFromSignatureKey(publicKey) {
        // Lookup the role associated with the public key (e.g., from this.keyRegistry)
        // Return 'GOVERNANCE_AGENT' or 'SYSTEM_ADMIN'
        return 'GOVERNANCE_AGENT'; // Stub
    }

    _cryptoVerify(data, signature, publicKey) {
        // Implement ECDSA or comparable signature verification.
        return true; // Stub
    }
}

module.exports = SignatureValidationService;
