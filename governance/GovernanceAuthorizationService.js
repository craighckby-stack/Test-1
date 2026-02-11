/**
 * GovernanceAuthorizationService (GAS)
 * Mission: Validate security contexts against predefined Governance Control Objectives (GCO) 
 *          and operational policy vectors (e.g., P-01 requirements).
 *
 * This service is critical for enforcing read/write restrictions on high-level operational artifacts (SCR).
 */
class GovernanceAuthorizationService {

    /**
     * @param {object} policyEngine - Handles fetching mandate criteria based on requiredLevel.
     * @param {object} securityContextVerifier - Handles token verification and identity extraction.
     * @param {object} mandateEvaluator - Executes complex governance mandate checks.
     */
    constructor(policyEngine, securityContextVerifier, mandateEvaluator) {
        this.policyEngine = policyEngine;
        this.scv = securityContextVerifier;
        this.mandateEvaluator = mandateEvaluator; 
    }

    /**
     * Validates if a given context meets the required security clearance level.
     * @param {string} requiredLevel - The threshold (e.g., 'L4_P01_PASS', 'READ_ACCESS').
     * @param {object} context - The operational security context (token, identity, or service credentials).
     * @returns {Promise<boolean>} True if authorization is sufficient.
     */
    async validate(requiredLevel, context) {
        // Input validation
        if (!context || typeof context !== 'object' || Object.keys(context).length === 0) {
            console.error(`[GAS] Validation failure: Required level '${requiredLevel}'. Context is missing or empty.`);
            return false;
        }

        let validatedIdentity;
        try {
            // Step 1: Verify the integrity and authenticity of the context/token
            validatedIdentity = await this.scv.verifyContext(context);
        } catch (error) {
            // Handle failures in the security context pipeline (e.g., expired token, malformed signature)
            console.error(`[GAS] Security Context Verification failed for level ${requiredLevel}. Error: ${error.message}`);
            return false;
        }

        if (!validatedIdentity) {
            // Identity verification returned a falsy value (e.g., unauthorized identity found)
            console.warn(`[GAS] Identity verification failed for level ${requiredLevel}. Identity unauthorized or unknown.`);
            return false;
        }

        // Step 2: Fetch the required mandate criteria from the Policy Engine
        const requiredCriteria = this.policyEngine.getMandateCriteria(requiredLevel);
        
        // Step 3: Delegate the comprehensive evaluation to the specialized tool
        return this.mandateEvaluator.execute({
            requiredLevel,
            validatedIdentity,
            requiredCriteria
        });
    }
}

module.exports = GovernanceAuthorizationService;