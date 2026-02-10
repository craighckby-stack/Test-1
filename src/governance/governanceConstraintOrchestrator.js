const GovConstants = require('./governanceConstants');

interface IRSAMService { registerPolicyIntent(intent: any): Promise<void>; }
interface SystemRouter { prioritizeRoute(destination: string, payload: any): Promise<{ path: string }>; route(destination: string, payload: any): Promise<{ path: string }>; }
interface PolicyIntentFactory { createM01Intent(payload: any): any; }
interface IntentSchemaValidator { validateMutationIntent(payload: any): any; }
interface MutationIntentPayload { targets: Array<{ componentID: string }>; }

interface IDeepPropertyInclusionChecker {
    execute(haystackArray: any[], needleList: string[], propertyPath: string): boolean;
}

/**
 * Component: Governance Constraint Orchestrator (GCO)
 * ID: GCO-v94.4 (Update incorporating reusable deep property inclusion checker)
 * Alignment: GSEP Stage 0/1 Intermediary.
 * Focus: Integrity barrier ensuring all policy-level modifications adhere strictly to the GSEP lifecycle and require
 *        immediate RSAM pre-attestation using the M-01 intent standard for critical targets.
 */
class GovernanceConstraintOrchestrator {
    private rsam: IRSAMService;
    private router: SystemRouter;
    private intentFactory: PolicyIntentFactory;
    private validator: IntentSchemaValidator | null;
    private criticalityChecker: IDeepPropertyInclusionChecker;
    private CRITICAL_TARGETS_LIST: string[];
    private GSEP_STAGES_MAP: { [key: string]: string };
    private STAGE_0_VETTING: string;
    private STAGE_1_SCOPE: string;
    
    /**
     * @param {IRSAMService} rsam - Risk & Security Attestation Manager
     * @param {SystemRouter} router - System router for GSEP stage progression
     * @param {PolicyIntentFactory} intentFactory - Specialized factory for M-01 package creation
     * @param {IDeepPropertyInclusionChecker} criticalityChecker - Plugin for deep list comparison
     * @param {IntentSchemaValidator} [validator] - Optional payload validator utility (Recommended)
     */
    constructor(
        rsam: IRSAMService, 
        router: SystemRouter, 
        intentFactory: PolicyIntentFactory, 
        criticalityChecker: IDeepPropertyInclusionChecker,
        validator: IntentSchemaValidator | null = null
    ) {
        // Step 0: Robust dependency enforcement
        if (!rsam) throw new Error("GCO Dependency Error: Missing RSAM Service.");
        if (!router) throw new Error("GCO Dependency Error: Missing System Router.");
        if (!intentFactory) throw new Error("GCO Dependency Error: Missing Policy Intent Factory.");
        if (!criticalityChecker) throw new Error("GCO Dependency Error: Missing Criticality Checker Plugin.");

        this.rsam = rsam; 
        this.router = router; 
        this.intentFactory = intentFactory;
        this.validator = validator; 
        this.criticalityChecker = criticalityChecker;

        // Cache critical constants for faster lookup
        this.CRITICAL_TARGETS_LIST = GovConstants.CRITICAL_GOV_TARGETS || [];
        this.GSEP_STAGES_MAP = GovConstants.GSEP_STAGES || {};

        // Define expected stage destinations based on the constant map structure
        this.STAGE_0_VETTING = this.GSEP_STAGES_MAP.STAGE_0_VETTING;
        this.STAGE_1_SCOPE = this.GSEP_STAGES_MAP.STAGE_1_SCOPE;

        if (!this.STAGE_1_SCOPE || !this.STAGE_0_VETTING) {
             console.warn("GCO Init Warning: GSEP stage map incomplete. Critical routing may fail.");
        }
    }

    /**
     * Pre-checks and standardizes the raw request payload structure using the integrated validator 
     * or minimal internal checks if no dedicated validator is present.
     * @param {MutationIntentPayload} rawRequest
     * @returns {MutationIntentPayload} Validated and standardized payload
     * @throws {Error} if payload is fundamentally invalid
     */
    private _standardizeAndValidatePayload(rawRequest: MutationIntentPayload): MutationIntentPayload {
        if (this.validator) {
            // Leverage dedicated validator if available
            return this.validator.validateMutationIntent(rawRequest);
        }

        // Fallback minimal internal validation
        if (!rawRequest || typeof rawRequest !== 'object' || Array.isArray(rawRequest)) {
            throw new Error("GCO Payload Constraint Violation: Request must be a standard intent object.");
        }
        
        // Ensure targets array exists for constraint checking efficiency
        if (!Array.isArray(rawRequest.targets)) {
             rawRequest.targets = []; 
        }
        return rawRequest;
    }

    /**
     * Step 1: Detect if the mutation intent targets critical governance policies using component IDs.
     * Utilizes the injected DeepPropertyInclusionChecker plugin.
     * @param {MutationIntentPayload} request - Assumed standardized payload.
     * @returns {boolean} True if critical targets are affected.
     */
    private _isTargetingCriticalPolicy(request: MutationIntentPayload): boolean {
        // Delegate the complex comparison logic to the reusable plugin
        return this.criticalityChecker.execute(
            request.targets,
            this.CRITICAL_TARGETS_LIST,
            'componentID' // Search path within the target object
        );
    }
    
    /**
     * Handles the complex, mandatory pipeline for critical policy modifications:
     * M-01 Intent Creation -> RSAM Pre-Attestation -> Prioritized Routing (Stage 1).
     * @param {MutationIntentPayload} validatedRequest 
     * @returns {Promise<Object>} Standardized critical routing decision.
     * @throws {Error} if routing fails or attestation fails
     */
    private async _processCriticalRoute(validatedRequest: MutationIntentPayload): Promise<object> {
         if (!this.STAGE_1_SCOPE) {
             throw new Error("GCO Critical Route Error: GSEP Stage 1 (Scope) destination is undefined.");
         }
        
         // 1. Create specialized high-risk intent package (M-01)
         const m01IntentPackage = this.intentFactory.createM01Intent(validatedRequest);

         // 2. Mandatory RSAM Pre-Attestation Registration. Awaiting ensures constraint is met before routing.
         await this.rsam.registerPolicyIntent(m01IntentPackage);
        
         // 3. Force route directly to GSEP Stage 1 (Scope) with maximum priority flag.
         const routeResult = await this.router.prioritizeRoute(this.STAGE_1_SCOPE, m01IntentPackage.id);

         // Return high-fidelity routing data
         return {
             routePath: routeResult.path,
             intentId: m01IntentPackage.id,
             status: 'ROUTE_CRITICAL_GOVERNANCE',
             targetType: 'HIGH_GOVERNANCE_POLICY',
             attestationRequired: true
         };
    }

    /**
     * Primary entry point. Evaluates the intent payload and routes it based on constraint checks.
     * 
     * @param {MutationIntentPayload} rawRequest - The input request containing targets and proposed changes.
     * @returns {Promise<Object>} Standardized routing decision payload.
     */
    public async evaluateAndRoute(rawRequest: MutationIntentPayload): Promise<object> {
        try {
            // Robustness: Input validation and standardization (v94.3 improvement)
            const validatedRequest = this._standardizeAndValidatePayload(rawRequest);

            if (this._isTargetingCriticalPolicy(validatedRequest)) {
                return this._processCriticalRoute(validatedRequest);
            }

            // Standard route handling: Non-critical policies go to Stage 0 Vetting
            if (!this.STAGE_0_VETTING) {
                 throw new Error("GCO Standard Route Error: GSEP Stage 0 (Vetting) destination is undefined.");
            }
            
            // Standard asynchronous routing
            const standardRoute = await this.router.route(this.STAGE_0_VETTING, validatedRequest);
            
            return {
                routePath: standardRoute.path,
                intentId: null, // No M-01 intent created for standard route
                status: 'ROUTE_STANDARD_CHANGE',
                targetType: 'GENERAL_SYSTEM_CHANGE',
                attestationRequired: false // Attestation may happen later in GSEP stages
            };
        } catch (error) {
            // Centralized error handling for GCO constraints
            throw new Error(`GCO Constraint Orchestration Failure: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

module.exports = GovernanceConstraintOrchestrator;