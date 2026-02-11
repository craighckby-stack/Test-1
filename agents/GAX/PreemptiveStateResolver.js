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

// CRITICAL: Refactored to use Dependency Injection for KERNEL_SYNERGY_CAPABILITIES interface handling.

class PreemptiveStateResolver {
    
    // Core internal handlers for state and modeling utilities
    #policyEngine;
    #metricsStore;
    #simEngine;
    #kernelCapabilityService; // Stores required KERNEL_SYNERGY_CAPABILITIES interfaces
    
    // Inputs needed for external R_TH calculation via the kernel tool
    #riskAccessors;
    #riskModel;

    /**
     * @param {Object} Dependencies - Structured dependencies required for PSR operation.
     * @param {Object} Dependencies.GAX_Context - Full context container (must expose PolicyEngine, MetricsStore, getRiskModel, getUFRM, getCFTM).
     * @param {Object} Dependencies.SimulationEngine - Engine for TEMM/ECVM prediction using ACVD.
     * @param {Object} Dependencies.KernelCapabilities - REQUIRED: The KERNEL_SYNERGY_CAPABILITIES subset relevant to PSR (e.g., RiskThresholdCalculatorService).
     */
    constructor({ GAX_Context, SimulationEngine, KernelCapabilities }) {
        if (!GAX_Context || !SimulationEngine) {
            throw new Error("[PSR Init] Missing essential dependencies: GAX_Context and SimulationEngine.");
        }
        
        // 1. Validate and store Kernel Capabilities Dependency
        if (!KernelCapabilities || !KernelCapabilities.RiskThresholdCalculatorService) {
            throw new Error("[PSR Init] Missing required KERNEL_SYNERGY_CAPABILITIES interface: RiskThresholdCalculatorService. Cannot calculate R_TH.");
        }
        this.#kernelCapabilityService = KernelCapabilities;
        
        const riskModel = GAX_Context.getRiskModel ? GAX_Context.getRiskModel() : null;
        
        // 2. Dependency validation: Ensure all accessors needed for both internal use and external tool execution are present.
        if (!GAX_Context.PolicyEngine || !riskModel || !GAX_Context.getUFRM || !GAX_Context.getCFTM || !GAX_Context.MetricsStore) {
             throw new Error("[PSR Init] GAX_Context failed to provide necessary core components (PolicyEngine, MetricsStore, RiskModel, UFRM, CFTM accessors). This is a Kernel Context error.");
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
     * @param {Object} inputManifest
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
            console.error(`[PSR Policy Failure] Critical Projection Error: ${error.message}`);
            return false;
        }
    }

    /**
     * Generates the Axiomatic Trajectory Map (ATM).
     * @param {Object} inputManifest - The incoming workflow or transaction data.
     * @returns {Promise<Object>} ATM { predicted_TEMM: Number, predicted_ECVM: Boolean, R_TH: Number, Guaranteed_ADTM_Trigger: Boolean }
     */
    async generateATM(inputManifest) {
        if (!inputManifest) {
            throw new Error("[PSR] Input manifest required for ATM generation.");
        }
        
        // Resolve metrics locally before passing data to the kernel tool
        const UFRM = this.#riskAccessors.getUFRM();
        const CFTM = this.#riskAccessors.getCFTM();
        
        const riskParams = {
            UFRM: UFRM,
            CFTM: CFTM,
            riskModel: this.#riskModel
        };
        
        let R_TH = 0; // Initialize R_TH
        
        // Stage 0: Calculate Risk Threshold (R_TH) using the injected Kernel Capability
        // This pattern relies on the orchestrator ensuring 'RiskThresholdCalculatorService' is present in KernelCapabilities.
        R_TH = await this.#kernelCapabilityService.RiskThresholdCalculatorService.execute('calculateThreshold', riskParams);

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
        // NOTE: SimulationEngine#runSimulation is assumed to be complex and remains local.
        const { predictedTEMM, predictedECVM } = await this.#simEngine.runSimulation(inputManifest);
        
        // Stage 3: Failure Guarantee Check (S04 precursor evaluation)
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