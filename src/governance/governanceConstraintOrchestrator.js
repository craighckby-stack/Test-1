const GovConstants = require('./governanceConstants');

/**
 * Component: Governance Constraint Orchestrator (GCO)
 * ID: GCO-v94.2
 * Alignment: GSEP Stage 0/1 Intermediary. (Refactored to v94.2 due to async implementation.)
 * Focus: Integrity barrier ensuring all policy-level modifications adhere strictly to the GSEP lifecycle and require
 *        immediate RSAM pre-attestation using the M-01 intent standard.
 */
class GovernanceConstraintOrchestrator {
    
    /**
     * @param {IRSAMService} rsam - Risk & Security Attestation Manager (Expected async implementation)
     * @param {SystemRouter} router - System router for GSEP stage progression (Expected async implementation)
     * @param {PolicyIntentFactory} intentFactory - Specialized factory for M-01 package creation
     */
    constructor(rsam, router, intentFactory) {
        // Enforce strict dependency validation upon initialization
        if (!rsam) throw new Error("GCO Initialization Error: Missing RSAM Service.");
        if (!router) throw new Error("GCO Initialization Error: Missing System Router.");
        if (!intentFactory) throw new Error("GCO Initialization Error: Missing Policy Intent Factory.");

        this.rsam = rsam; 
        this.router = router; 
        this.intentFactory = intentFactory; 
        this.CRITICAL_GOV_TARGETS = GovConstants.CRITICAL_GOV_TARGETS || [];
        this.GSEP_STAGES = GovConstants.GSEP_STAGES || {};
    }

    /**
     * Validates and normalizes the raw request payload structure.
     * @param {MutationIntentPayload} rawRequest
     * @returns {MutationIntentPayload} Normalized payload
     * @throws {Error} if payload is fundamentally invalid
     */
    _validatePayload(rawRequest) {
        if (!rawRequest || typeof rawRequest !== 'object') {
            throw new Error("GCO Payload Error: Request is null, undefined, or not an object.");
        }
        if (!Array.isArray(rawRequest.targets)) {
             rawRequest.targets = []; 
        }
        return rawRequest;
    }

    /**
     * Step 1: Detect if the mutation intent targets critical governance policies.
     * (Synchronous detection is maintained for efficiency)
     * @param {MutationIntentPayload} request - Assumed validated payload.
     * @returns {boolean} True if critical targets are affected.
     */
    _detectCriticalPolicyTarget(request) {
        return request.targets.some(target => 
            this.CRITICAL_GOV_TARGETS.includes(target.componentID)
        );
    }
    
    /**
     * Handles the complex, mandatory pipeline for critical policy modifications:
     * M-01 Intent Creation -> RSAM Pre-Attestation -> Prioritized Routing (Stage 1).
     * @param {MutationIntentPayload} validatedRequest 
     * @returns {Promise<Object>} Standardized critical routing decision.
     */
    async _processCriticalRoute(validatedRequest) {
         // 1. Create specialized high-risk intent package (M-01)
        const m01IntentPackage = this.intentFactory.createM01Intent(validatedRequest);

        // 2. Register intent with RSAM for mandatory asynchronous pre-attestation.
        await this.rsam.registerPolicyIntent(m01IntentPackage);
        
        // 3. Force route directly to GSEP Stage 1 (Scope) with max priority.
        const destinationStage = this.GSEP_STAGES.STAGE_1_SCOPE;
        
        // Assuming prioritizeRoute is async
        const routeResult = await this.router.prioritizeRoute(destinationStage, m01IntentPackage.id);

        return {
            route: routeResult.path,
            intentId: m01IntentPackage.id,
            status: 'CRITICAL_ROUTE',
            targetType: 'HIGH_GOVERNANCE_POLICY'
        };
    }

    /**
     * Primary entry point. Evaluates the intent payload and routes it.
     * 
     * @param {MutationIntentPayload} rawRequest - The input request containing targets and proposed changes.
     * @returns {Promise<Object>} Standardized routing decision.
     */
    async evaluateAndRoute(rawRequest) {
        // Robustness: Input validation and normalization
        const validatedRequest = this._validatePayload(rawRequest);

        if (this._detectCriticalPolicyTarget(validatedRequest)) {
            return this._processCriticalRoute(validatedRequest);
        }

        // Standard request handling: Route to Stage 0 Vetting
        const destinationStage = this.GSEP_STAGES.STAGE_0_VETTING;
        
        // All high-level service interaction is made asynchronous for non-blocking efficiency.
        const standardRoute = await this.router.route(destinationStage, validatedRequest);
        
        return {
            route: standardRoute.path,
            intentId: null, 
            status: 'STANDARD_ROUTE',
            targetType: 'GENERAL_SYSTEM_CHANGE'
        };
    }
}

module.exports = GovernanceConstraintOrchestrator;