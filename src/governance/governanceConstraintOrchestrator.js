/**
 * Component: Governance Constraint Orchestrator (GCO)
 * ID: GCO-v94
 * Alignment: GSEP Stage 0/1 Intermediary.
 * Focus: Integrity barrier ensuring all policy-level modifications adhere strictly to the GSEP lifecycle and require
 *        immediate RSAM pre-attestation using the M-01 intent standard.
 */
class GovernanceConstraintOrchestrator {
    // Defines component IDs considered high-risk targets for core governance modification.
    static CRITICAL_GOV_TARGETS = Object.freeze(['GRS', 'C-15']);
    
    /**
     * @param {RSAMService} rsam - Risk & Security Attestation Manager
     * @param {SystemRouter} router - System router for GSEP stage progression
     * @param {PolicyIntentFactory} intentFactory - Specialized factory for M-01 package creation
     */
    constructor(rsam, router, intentFactory) {
        if (!rsam || !router || !intentFactory) {
            throw new Error("GCO requires RSAM, Router, and IntentFactory instances.");
        }
        this.rsam = rsam; 
        this.router = router; 
        this.intentFactory = intentFactory; 
    }

    /**
     * Step 1: Detect if the mutation intent targets critical governance policies.
     * @param {MutationIntentPayload} rawRequest
     * @returns {boolean} True if critical targets are affected.
     */
    _detectCriticalPolicyTarget(rawRequest) {
        return rawRequest.targets.some(target => 
            GovernanceConstraintOrchestrator.CRITICAL_GOV_TARGETS.includes(target.componentID)
        );
    }
    
    /**
     * Primary entry point. Evaluates the intent payload and routes it according 
     * to GSEP Stage 0 constraints. Forces M-01 packaging and RSAM pre-registration 
     * upon detection of high-risk policy changes.
     * 
     * @param {MutationIntentPayload} rawRequest - The input request containing targets and proposed changes.
     * @returns {Object} Routing decision { success: boolean, route: string, intentId: string|null }
     */
    evaluateAndRoute(rawRequest) {
        if (this._detectCriticalPolicyTarget(rawRequest)) {
            
            // 1. Create specialized high-risk intent package (M-01: Policy Modification Intent)
            const m01IntentPackage = this.intentFactory.createM01Intent(rawRequest);

            // 2. Register intent with RSAM immediately for pre-attestation tracking.
            // This ensures P-01 risk calculation begins based on the proposed change parameters.
            const attestationRegistration = this.rsam.registerPolicyIntent(m01IntentPackage);
            
            // 3. Force route directly to GSEP Stage 1 (Scope) with max priority.
            const routeDestination = this.router.prioritizeRoute('GSEP_STAGE_1_SCOPE', m01IntentPackage.id);

            return {
                success: true,
                route: routeDestination.path,
                intentId: m01IntentPackage.id,
                message: `CRITICAL POLICY TARGET detected. Forced M-01 packaging (${m01IntentPackage.id}) and direct priority route to Stage 1. Attestation initiated.`
            };
        }

        // Standard request handling
        const standardRoute = this.router.route('GSEP_STAGE_0_VETTING', rawRequest);
        return {
            success: true,
            route: standardRoute.path,
            intentId: null,
            message: "Standard mutation request detected. Proceeding to standard GSEP Stage 0 vetting."
        };
    }
}

module.exports = GovernanceConstraintOrchestrator;