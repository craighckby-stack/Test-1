const policy = require('../policies/config/crypto_policy.json');

/**
 * CryptoPolicyValidator V2.1 (Facade)
 * Ensures runtime configuration compliance against the Sovereign AGI crypto policy by delegating validation to an injected tool.
 */
class CryptoPolicyValidator {

    #policy; 
    #policyValidatorTool; 
    #toolAvailable = true;

    /**
     * @param {any} policyConfig - The loaded crypto policy object.
     * @param {ICanonicalCryptoPolicyValidator} policyValidatorTool - The implementation of the policy validation interface.
     */
    constructor(policyConfig, policyValidatorTool) {
        this.#policy = policyConfig;
        this.#policyValidatorTool = policyValidatorTool;

        // Type check the required interface methods
        if (!this.#policyValidatorTool || 
            typeof this.#policyValidatorTool.isHashCompliant !== 'function' ||
            typeof this.#policyValidatorTool.isSymmetricCipherCompliant !== 'function') {
            
            console.warn("CryptoPolicyValidator initialized with an invalid or missing CanonicalCryptoPolicyValidator tool.");
            this.#toolAvailable = false;
        }
    }
    
    /**
     * Internal helper to check tool availability.
     */
    #checkTool() {
        if (!this.#toolAvailable) {
            return { compliant: false, reason: 'Policy validation tool unavailable or improperly initialized.' };
        }
        return null;
    }

    /**
     * Validates if a provided hash algorithm meets current standards.
     * @param {string} algorithmName - e.g., 'SHA-256'
     * @param {number} digestSizeBits - e.g., 256
     * @returns {{ compliant: boolean, reason: string }}
     */
    isHashCompliant(algorithmName, digestSizeBits) {
        const error = this.#checkTool();
        if (error) return error;

        return this.#policyValidatorTool.isHashCompliant({
            policy: this.#policy,
            algorithmName,
            digestSizeBits
        });
    }

    /**
     * Validates symmetric cipher configuration (e.g., used for data transport).
     * @param {string} algorithm - e.g., 'AES'
     * @param {number} keySizeBits - e.g., 256
     * @returns {{ compliant: boolean, reason: string }}
     */
    isSymmetricCipherCompliant(algorithm, keySizeBits) {
        const error = this.#checkTool();
        if (error) return error;

        return this.#policyValidatorTool.isSymmetricCipherCompliant({
            policy: this.#policy,
            algorithm,
            keySizeBits
        });
    }

    // Implement additional methods for signingPolicy, keyManagement, etc., delegating to the tool.
}

// NOTE: We retain the original dependency resolution pattern for compatibility
// but pass the dependency explicitly to the constructor.
const CanonicalCryptoPolicyValidator = global.plugins ? global.plugins.CanonicalCryptoPolicyValidator : undefined;

module.exports = new CryptoPolicyValidator(policy, CanonicalCryptoPolicyValidator);
