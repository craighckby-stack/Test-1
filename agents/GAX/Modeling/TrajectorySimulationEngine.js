/**
 * Utility function simulating the imported ValidationServiceWrapper plugin.
 * This function abstracts the validation logic extracted from the original class.
 */
const _validateUtility = async (validator, data, schema, context) => {
    if (!validator) return; 
    
    const validationResult = await validator.execute('validate', data, schema);
    
    if (!validationResult || !validationResult.isValid) {
        // Use optional chaining and nullish coalescing for safety
        const errors = validationResult?.errors?.join('; ') ?? 'Unknown validation error.';
        // Standardized error prefix for reliable catching in runSimulation
        throw new Error(`Validation Failed [${context}]: ${errors}`);
    }
};

/**
 * The Trajectory Simulation Engine (TSE) is responsible for running high-fidelity,
 * asynchronous simulations of P3/P4 execution outcomes based on the current
 * Contextual State Record (CSR) and Axiomatic Constraint Verification Data (ACVD).
 * 
 * It utilizes an injected Statistical Model Handler to predict TEMM and ECVM scores.
 * 
 * It relies on an injected SynergyRegistry to access the SchemaValidationService for 
 * comprehensive input/output schema enforcement.
 */
class TrajectorySimulationEngine {
    // Defining Schemas as static properties for modern class structure and clarity
    static MANIFEST_SCHEMA = {
        entityId: { type: 'string', required: true },
        transactionId: { type: 'string', required: false },
        complexity: { type: 'number', required: false }
    };

    static PREDICTION_RESULT_SCHEMA = {
        temm: { type: 'number', required: true }, // Trajectory Execution Mitigation Metric
        ecvm: { type: 'boolean', required: true }  // Execution Constraint Verification Metric
    };

    /**
     * @param {Object} ACVD_Store - Data store containing historical execution metrics and constraints.
     * @param {Object} Configuration - System configuration and load factors.
     * @param {Object} ModelHandler - The initialized predictive model wrapper implementing the 'predict' interface.
     * @param {Object} [SynergyRegistry={}] - Central registry for accessing kernel capabilities (e.g., SchemaValidationService).
     */
    constructor(ACVD_Store, Configuration, ModelHandler, SynergyRegistry = {}) {
        if (!ModelHandler || typeof ModelHandler.predict !== 'function') {
            throw new Error("TSE Initialization Error: A valid ModelHandler implementing an asynchronous 'predict' method is required.");
        }

        this.ACVD = ACVD_Store;
        this.config = Configuration;
        this.model = ModelHandler;
        
        // Dependency Initialization: Resolve the SchemaValidationService once upon construction
        this.validator = (SynergyRegistry && typeof SynergyRegistry.getService === 'function')
            ? SynergyRegistry.getService('SchemaValidationService')
            : null;
        
        this.synergyRegistry = SynergyRegistry;
    }

    /**
     * Generates feature vectors from the input manifest for model consumption.
     * @param {Object} inputManifest
     * @returns {Promise<Object>} Feature vector
     */
    async #extractFeatures(inputManifest) {
        try {
            // Use destructuring with defaults for clean access and clarity
            const { entityId, transactionId = 'N/A', complexity = 5 } = inputManifest;
            
            // Robust ACVD interaction with guaranteed fallback (0 risk) on failure
            const historyRisk = await this.ACVD.getHistoricalRisk(entityId).catch(() => 0);

            return {
                transactionId,
                complexity_score: complexity, 
                history_risk: historyRisk, 
                current_load_factor: this.config.getCurrentLoadFactor() 
            };
        } catch (error) {
            console.error("TSE Feature Extraction Failed: Could not process ACVD data.", error);
            // Prefix error for standardized detection in runSimulation catch block
            throw new Error(`Feature extraction failed: ${error.message || String(error)}`); 
        }
    }

    /**
     * Runs the full trajectory simulation by extracting features and calling the model handler.
     * @param {Object} inputManifest
     * @returns {Promise<{predictedTEMM: number, predictedECVM: boolean}>}
     */
    async runSimulation(inputManifest) {
        let entityId = 'unknown';

        try {
            // 1. Critical Minimal Input Check (uses optional chaining for robustness)
            if (!inputManifest?.entityId) {
                 throw new Error("Invalid Manifest: 'entityId' is required and must be a string for simulation.");
            }
            entityId = inputManifest.entityId;

            // 2. Comprehensive Input Validation (using abstracted utility)
            await _validateUtility(
                this.validator,
                inputManifest, 
                TrajectorySimulationEngine.MANIFEST_SCHEMA, 
                'Input Manifest'
            );

            const features = await this.#extractFeatures(inputManifest);

            // Execute asynchronous model inference
            const results = await this.model.predict(features);

            // 3. Comprehensive Output Validation (using abstracted utility)
            await _validateUtility(
                this.validator,
                results, 
                TrajectorySimulationEngine.PREDICTION_RESULT_SCHEMA, 
                'Model Output'
            );

            // Fallback manual check only if the validation service is absent
            if (!this.validator && (typeof results.temm !== 'number' || typeof results.ecvm !== 'boolean')) {
                 throw new Error("Model output format invalid (No Validator): Expected {temm: number, ecvm: boolean}.");
            }

            return {
                predictedTEMM: results.temm,
                predictedECVM: results.ecvm
            };
        } catch (error) {
            console.error(`TSE Simulation Failed for Entity ${entityId}:`, error.message);
            
            const errorMessage = error.message || String(error);
            
            // Use startsWith checking based on standardized error prefixes from the utility or #extractFeatures
            if (errorMessage.startsWith('Validation Failed') || errorMessage.startsWith('Feature extraction failed')) {
                throw error; 
            }

            // Otherwise, wrap the general prediction system error.
            throw new Error(`Trajectory simulation failed due to prediction system error. Details: ${errorMessage}`);
        }
    }
}

module.exports = TrajectorySimulationEngine;