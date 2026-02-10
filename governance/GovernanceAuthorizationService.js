/**
 * GovernanceAuthorizationService (GAS)
 * Mission: Validate security contexts against predefined Governance Control Objectives (GCO) 
 *          and operational policy vectors (e.g., P-01 requirements).
 *
 * This service is critical for enforcing read/write restrictions on high-level operational artifacts (SCR).
 */
class GovernanceAuthorizationService {

    constructor(policyEngine, securityContextVerifier, mandateEvaluator) {
        // Policy Engine holds current P-01 vectors and operational mandates
        this.policyEngine = policyEngine;
        // SCV handles token decryption, signature verification, and identity extraction
        this.scv = securityContextVerifier;
        // Tool for executing specific governance mandate checks against an identity
        this.mandateEvaluator = mandateEvaluator; 
    }

    /**
     * Validates if a given context meets the required security clearance level.
     * @param {string} requiredLevel - The threshold (e.g., 'L4_P01_PASS', 'READ_ACCESS').
     * @param {object} context - The operational security context (token, identity, or service credentials).
     * @returns {Promise<boolean>} True if authorization is sufficient.
     */
    async validate(requiredLevel, context) {
        if (!context || Object.keys(context).length === 0) {
            console.warn(`Authorization check failed for ${requiredLevel}: No context provided.`);
            return false;
        }

        const validatedIdentity = await this.scv.verifyContext(context);
        if (!validatedIdentity) {
            return false;
        }

        // 1. Fetch the required mandate criteria from the Policy Engine (for dynamic evaluation)
        const requiredCriteria = this.policyEngine.getMandateCriteria(requiredLevel);
        
        // 2. Delegate the evaluation to the specialized tool
        // The GovernanceMandateEvaluatorTool handles the complex boolean logic previously hardcoded.
        return this.mandateEvaluator.execute({
            requiredLevel: requiredLevel,
            validatedIdentity: validatedIdentity,
            requiredCriteria: requiredCriteria
        });
    }
}

module.exports = GovernanceAuthorizationService;