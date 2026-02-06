const GovConstants = require('./governanceConstants');

/**
 * Component: Governance Constraint Orchestrator (GCO)
 * ID: GCO-v94.1
 * Alignment: GSEP Stage 0/1 Intermediary.
 * Focus: Integrity barrier ensuring all policy-level modifications adhere strictly to the GSEP lifecycle and require
 *        immediate RSAM pre-attestation using the M-01 intent standard.
 */
class GovernanceConstraintOrchestrator {
    
    /**
     * @param {RSAMService} rsam - Risk & Security Attestation Manager
     * @param {SystemRouter} router - System router for GSEP stage progression
     * @param {PolicyIntentFactory} intentFactory - Specialized factory for M-01 package creation
     */
    constructor(rsam, router, intentFactory) {
        // Robustness improvement: Ensure necessary objects are present
        if (!(rsam && router && intentFactory)) {
            throw new Error("GCO requires valid RSAM, Router, and IntentFactory instances.");
        }
        this.rsam = rsam; 
        this.router = router; 
        this.intentFactory = intentFactory; 
        // Load constants for centralized governance definition
        this.CRITICAL_GOV_TARGETS = GovConstants.CRITICAL_GOV_TARGETS;
        this.GSEP_STAGES = GovConstants.GSEP_STAGES;
    }

    /**
     * Step 1: Detect if the mutation intent targets critical governance policies.
     * @param {MutationIntentPayload} rawRequest
     * @returns {boolean} True if critical targets are affected.
     */
    _detectCriticalPolicyTarget(rawRequest) {
        if (!rawRequest || !rawRequest.targets || rawRequest.targets.length === 0) {
            return false;
        }
        
        return rawRequest.targets.some(target => 
            this.CRITICAL_GOV_TARGETS.includes(target.componentID)
        );
    }
    
    /**
     * Primary entry point. Evaluates the intent payload and routes it according 
     * to GSEP Stage 0 constraints. Forces M-01 packaging and RSAM pre-registration 
     * upon detection of high-risk policy changes.
     * 
     * @param {MutationIntentPayload} rawRequest - The input request containing targets and proposed changes.
     * @returns {Object} Standardized routing decision: { route: string, intentId: string|null, status: 'CRITICAL_ROUTE'|'STANDARD_ROUTE' }
     */
    evaluateAndRoute(rawRequest) {
        if (!rawRequest) {
             throw new Error("Evaluation failed: rawRequest payload is null or undefined.");
        }

        if (this._detectCriticalPolicyTarget(rawRequest)) {
            
            // 1. Create specialized high-risk intent package (M-01: Policy Modification Intent)
            const m01IntentPackage = this.intentFactory.createM01Intent(rawRequest);

            // 2. Register intent with RSAM immediately for mandatory pre-attestation.
            this.rsam.registerPolicyIntent(m01IntentPackage);
            
            // 3. Force route directly to GSEP Stage 1 (Scope) with max priority, using stage constants.
            const destinationStage = this.GSEP_STAGES.STAGE_1_SCOPE;
            const routeResult = this.router.prioritizeRoute(destinationStage, m01IntentPackage.id);

            // Refactoring return structure for machine readability (status code instead of message string)
            return {
                route: routeResult.path,
                intentId: m01IntentPackage.id,
                status: 'CRITICAL_ROUTE',
                targetType: 'HIGH_GOVERNANCE_POLICY'
            };
        }

        // Standard request handling: Route to Stage 0 Vetting
        const destinationStage = this.GSEP_STAGES.STAGE_0_VETTING;
        const standardRoute = this.router.route(destinationStage, rawRequest);
        
        return {
            route: standardRoute.path,
            intentId: null, // No mandatory intent ID created for Stage 0 entry
            status: 'STANDARD_ROUTE',
            targetType: 'GENERAL_SYSTEM_CHANGE'
        };
    }
}

module.exports = GovernanceConstraintOrchestrator;