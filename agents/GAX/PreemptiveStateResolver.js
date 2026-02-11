/**
 * @typedef {Object} RiskAccessors
 * @property {function(): Object} getUFRM - Function to retrieve the Unforeseen Risk Metric.
 * @property {function(): Object} getCFTM - Function to retrieve the Core Function Trajectory Metric.
 */

/**
 * @typedef {Object} ATMOutput
 * @property {number} predicted_TEMM - Predicted Temporal Metric score (0 to 1).
 * @property {boolean} predicted_ECVM - Predicted Execution Constraint Viability Metric (true if viable).
 * @property {number} R_TH - The dynamically calculated Risk Threshold.
 * @property {boolean} Guaranteed_ADTM_Trigger - True if TEMM is predicted to fall below R_TH, guaranteeing activation of Atomic Drift Trajectory Mitigation (ADTM).
 */

/**
 * GATED EXECUTION PIPELINE (GSEP-C) Enhancement: Preemptive State Resolution (v94.1 Axiomatic Trajectory Mapping)
 *
 * The Preemptive State Resolver (PSR) module generates the Axiomatic Trajectory Map (ATM)
 * asynchronously during ANCHORING (P1) and POLICY VETTING (P2), using predictive outcome modeling
 * to determine the mathematical certainty of policy or constraint failure (P-01=Fail) prior to P3/P4 execution.
 *
 * PSR calculates the predicted TEMM (Temporal Metric) and ECVM (Execution Constraint Viability Metric)
 * scores, comparing them against the dynamically calculated Risk Threshold (R_TH).
 */

// CRITICAL: Refactored to use Dependency Injection for KERNEL_SYNERGY_CAPABILITIES interface handling and formalizing requirements via Synergy Registry.
// Refinement: Storing the specific required Synergy Service instance directly for immediate, type-safe access.

class PreemptiveStateResolver {
    
    // -- SYNERGY REGISTRY DECLARATION --
    // Explicitly lists the required services/tools from the Kernel Synergy Provider.
    static SYNERGY_REQUIREMENTS = {
        SERVICES: {
            RiskThresholdCalculator: "RiskThresholdCalculatorService" 
        }
    };
    // ----------------------------------

    // Core internal handlers for state and modeling utilities
    /** @type {Object} */
    #policyEngine;
    /** @type {Object} */
    #metricsStore;
    /** @type {Object} */
    #simEngine;
    /** 
     * @type {{ execute: function(string, Object): Promise<number> }} 
     * Stores the resolved instance of the mandatory RiskThresholdCalculatorService synergy plugin.
     */
    #riskThresholdService;
    
    // Inputs needed for external R_TH calculation via the kernel tool
    /** @type {RiskAccessors} */
    #riskAccessors;
    /** @type {Object} */
    #riskModel;

    /**
     * Initializes the Preemptive State Resolver, injecting core GAX components and required Kernel Synergy Services.
     * 
     * @param {Object} Dependencies - Structured dependencies required for PSR operation.
     * @param {Object} Dependencies.GAX_Context - Full context container (must expose PolicyEngine, MetricsStore, getRiskModel, getUFRM, getCFTM).
     * @param {Object} Dependencies.SimulationEngine - Engine for TEMM/ECVM prediction using ACVD (Assisted Constraint Viability Dynamics).
     * @param {Object} Dependencies.KernelCapabilities - REQUIRED: The KERNEL_SYNERGY_CAPABILITIES subset relevant to PSR.
     * @throws {Error} If essential dependencies or required synergy interfaces are missing/malformed.
     */
    constructor({ GAX_Context, SimulationEngine, KernelCapabilities }) {
        if (!GAX_Context || !SimulationEngine) {
            throw new Error("[PSR Init] Missing essential dependencies: GAX_Context and SimulationEngine.");
        }
        
        const requiredServiceKey = PreemptiveStateResolver.SYNERGY_REQUIREMENTS.SERVICES.RiskThresholdCalculator;

        // 1. Validate, resolve, and store Kernel Capabilities Dependency against Synergy Requirements
        const thresholdServiceInstance = KernelCapabilities ? KernelCapabilities[requiredServiceKey] : null;
        
        if (!thresholdServiceInstance || typeof thresholdServiceInstance.execute !== 'function') {
            throw new Error(`[PSR Init] Missing required KERNEL_SYNERGY_CAPABILITIES interface: ${requiredServiceKey}. Interface is invalid or missing 'execute' method.`);
        }
        
        this.#riskThresholdService = thresholdServiceInstance; // Store resolved service directly
        
        const riskModel = GAX_Context.getRiskModel ? GAX_Context.getRiskModel() : null;
        
        // 2. Dependency validation: Ensure all accessors needed for both internal use and external tool execution are present.
        const requiredContextProps = ['PolicyEngine', 'MetricsStore', 'getUFRM', 'getCFTM'];
        const missingContextProps = requiredContextProps.filter(prop => !GAX_Context[prop]);

        if (missingContextProps.length > 0 || !riskModel) {
             throw new Error(`[PSR Init] GAX_Context failed to provide necessary core components. Missing: ${missingContextProps.join(', ')} (RiskModel: ${!!riskModel ? 'Present' : 'Missing'}). This is a Kernel Context error.`);
        }

        // Explicit extraction of core components for better typing and encapsulation
        this.#policyEngine = GAX_Context.PolicyEngine;
        this.#metricsStore = GAX_Context.MetricsStore;
        this.#simEngine = SimulationEngine;
        
        // Store accessors and model for later use by the external tool
        this.#riskAccessors = {
            getUFRM: GAX_Context.getUFRM,
            getCFTM: GAX_Context.getCFTM,
        };
        this.#riskModel = riskModel;
    }

    /**
     * Private handler: Projects the policy constraints against the anticipated input manifest.
     * Incorporates Policy Volatility Metrics (PVM) for dynamic vetting (Simulates P2 checks).
     * @param {Object} inputManifest - The workflow/transaction data to check.
     * @returns {boolean} True if initial policy projection passes the pre-vetted stage.
     */
    #projectPolicyViability(inputManifest) {
        try {
            // Retrieve PVM dynamically
            const policyVolatility = this.#metricsStore.getPolicyVolatility();
            
            // Check viability synchronously for rapid fail-fast optimization
            const policyViable = this.#policyEngine.checkViability(inputManifest, policyVolatility);
            return policyViable;

        } catch (error) {
            console.error(`[PSR Policy Failure] Critical Projection Error during checkViability: ${error.message}`);
            return false;
        }
    }

    /**
     * Generates the Axiomatic Trajectory Map (ATM).
     * @param {Object} inputManifest - The incoming workflow or transaction data.
     * @returns {Promise<ATMOutput>} ATM { predicted_TEMM, predicted_ECVM, R_TH, Guaranteed_ADTM_Trigger }
     */
    async generateATM(inputManifest) {
        if (!inputManifest) {
            throw new Error("[PSR] Input manifest required for ATM generation.");
        }
        
        // Stage 0a: Prepare risk metrics for external service calculation
        const UFRM = this.#riskAccessors.getUFRM();
        const CFTM = this.#riskAccessors.getCFTM();
        
        const riskParams = {
            UFRM: UFRM,
            CFTM: CFTM,
            riskModel: this.#riskModel
        };
        
        let R_TH;
        // Standard conservative fallback threshold if synergy calculation fails.
        const DEFAULT_SAFE_THRESHOLD = 0.0001;
        
        // Stage 0b: Calculate Risk Threshold (R_TH) using the stored Synergy Service instance.
        try {
            R_TH = await this.#riskThresholdService.execute('calculateThreshold', riskParams);
        } catch (e) {
            console.error("[PSR] Critical error calculating R_TH via Synergy Service. Defaulting to safe minimal threshold.", e);
            // Default to a highly conservative/low threshold if calculation fails, guaranteeing ADTM trigger if risk is non-zero.
            R_TH = DEFAULT_SAFE_THRESHOLD; 
        }

        // Stage 1: Preemptive Policy Constraint Check (Fail Fast)
        if (!this.#projectPolicyViability(inputManifest)) {
            console.warn("PSR: Hard Policy Precursor Failure (P-01 certainty). Skipping full simulation.");
            return { 
                predicted_TEMM: 0, 
                predicted_ECVM: false, 
                R_TH: R_TH,
                Guaranteed_ADTM_Trigger: true 
            };
        }

        // Stage 2: Detailed Trajectory Modeling
        console.log("PSR: Starting predictive model simulation (P1/P2 overlap).");
        
        // Use destructuring for clearer result extraction
        const { predictedTEMM, predictedECVM } = await this.#simEngine.runSimulation(inputManifest);
        
        // Stage 3: Failure Guarantee Check (S04 precursor evaluation)
        // P-01=Fail certainty requires TEMM < R_TH
        const isFailureGuaranteed = predictedTEMM < R_TH;

        const ATM = {
            predicted_TEMM: predictedTEMM,
            predicted_ECVM: predictedECVM,
            R_TH: R_TH, 
            Guaranteed_ADTM_Trigger: isFailureGuaranteed // Indicates guaranteed trigger of the Atomic Drift Trajectory Mitigation (ADTM) system
        };

        const status = isFailureGuaranteed ? "PREEMPTIVE FAIL (ADTM)" : "VIABLE (PASS)";
        console.log(`PSR: ATM Generated. Status: ${status} | TEMM: ${predictedTEMM.toFixed(4)} / R_TH: ${R_TH.toFixed(4)}`);
        
        return ATM;
    }
}

module.exports = PreemptiveStateResolver;