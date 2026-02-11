// Defining Schemas outside the class for clarity
const MANIFEST_SCHEMA = {
    entityId: { type: 'string', required: true }
};

const PREDICTION_RESULT_SCHEMA = {
    temm: { type: 'number', required: true },
    ecvm: { type: 'boolean', required: true }
};

/**
 * The Trajectory Simulation Engine (TSE) is responsible for running high-fidelity,
 * asynchronous simulations of P3/P4 execution outcomes based on the current
 * Contextual State Record (CSR) and Axiomatic Constraint Verification Data (ACVD).
 * 
 * It utilizes an injected Statistical Model Handler to predict TEMM and ECVM scores.
 * 
 * It relies on KERNEL_SYNERGY_CAPABILITIES.SchemaValidationService for comprehensive
 * input/output schema enforcement, if available.
 */
class TrajectorySimulationEngine {
    /**
     * @param {Object} ACVD_Store - Data store containing historical execution metrics and constraints (assumed to expose async methods).
     * @param {Object} Configuration - System configuration and load factors (assumed to expose sync methods).
     * @param {Object} ModelHandler - The initialized predictive model wrapper implementing the 'predict' interface.
     */
    constructor(ACVD_Store, Configuration, ModelHandler) { // Removed optional Validator
        if (!ModelHandler || typeof ModelHandler.predict !== 'function') {
            throw new Error("TSE Initialization Error: A valid ModelHandler implementing an asynchronous 'predict' method is required.");
        }

        this.ACVD = ACVD_Store;
        this.config = Configuration;
        this.model = ModelHandler;
        // Note: Validation service is now accessed dynamically via KERNEL_SYNERGY_CAPABILITIES
    }

    /**
     * Generates feature vectors from the input manifest for model consumption.
     * Assumes ACVD operations (like fetching risk) involve asynchronous database interaction.
     * @param {Object} inputManifest
     * @returns {Promise<Object>} Feature vector
     */
    async #extractFeatures(inputManifest) {
        // Detailed logic for feature engineering (e.g., transaction complexity, data volume, historical entity risk)
        try {
            // ACVD interaction is assumed to be async due to potential database or service calls
            // entityId is guaranteed to exist due to upstream check in runSimulation
            const historyRisk = await this.ACVD.getHistoricalRisk(inputManifest.entityId);

            return {
                transactionId: inputManifest.transactionId,
                complexity_score: inputManifest.complexity || 5,
                history_risk: historyRisk, // Value derived asynchronously
                current_load_factor: this.config.getCurrentLoadFactor() 
            };
        } catch (error) {
            console.error("TSE Feature Extraction Failed: Could not retrieve necessary ACVD data.", error);
            throw new Error("Feature extraction failed."); 
        }
    }

    /**
     * Runs the full trajectory simulation by extracting features and calling the model handler.
     * @param {Object} inputManifest
     * @returns {Promise<{predictedTEMM: number, predictedECVM: boolean}>}
     */
    async runSimulation(inputManifest) {
        let entityId = 'unknown';

        // Access the KERNEL Schema Validation Service dynamically
        const ValidationService = (typeof KERNEL_SYNERGY_CAPABILITIES !== 'undefined' && KERNEL_SYNERGY_CAPABILITIES.SchemaValidationService)
            ? KERNEL_SYNERGY_CAPABILITIES.SchemaValidationService
            : null;

        try {
            // 1. Critical Minimal Input Check: Ensure entityId exists for logging and feature extraction.
            if (!inputManifest || typeof inputManifest.entityId !== 'string') {
                 throw new Error("Invalid Manifest: 'entityId' is required and must be a string for simulation.");
            }
            entityId = inputManifest.entityId;

            // 2. Comprehensive Input Validation using KERNEL_SYNERGY_CAPABILITIES (preferred)
            if (ValidationService) {
                // NOTE: We assume execute wraps the validation logic, requiring data and schema.
                const inputValidation = await ValidationService.execute('validate', inputManifest, MANIFEST_SCHEMA);
                
                if (!inputValidation || !inputValidation.isValid) {
                    const errorMsg = inputValidation && inputValidation.errors ? inputValidation.errors.join('; ') : 'Unknown validation error.';
                    throw new Error(`Comprehensive Input Validation Failed: ${errorMsg}`);
                }
            } 

            const features = await this.#extractFeatures(inputManifest);

            // Execute asynchronous model inference
            const results = await this.model.predict(features);

            // 3. Output Validation
            if (ValidationService) {
                const outputValidation = await ValidationService.execute('validate', results, PREDICTION_RESULT_SCHEMA);
                
                if (!outputValidation || !outputValidation.isValid) {
                     const errorMsg = outputValidation && outputValidation.errors ? outputValidation.errors.join('; ') : 'Unknown validation error.';
                     throw new Error(`Model output format invalid (Comprehensive Check). Expected {temm: number, ecvm: boolean}. Errors: ${errorMsg}`);
                }
            } else if (typeof results.temm !== 'number' || typeof results.ecvm !== 'boolean') {
                 // Fallback to manual check if validator is absent
                 throw new Error("Model output format invalid: Expected {temm: number, ecvm: boolean}.");
            }

            return {
                predictedTEMM: results.temm,
                predictedECVM: results.ecvm
            };
        } catch (error) {
            // Propagate specialized errors or wrap general exceptions
            console.error(`TSE Simulation Failed for ${entityId}:`, error);
            // Extract message safely, prioritizing specific error types generated internally
            const errorMessage = error.message || String(error);
            throw new Error(`Trajectory simulation failed due to prediction system error. ${errorMessage}`);
        }
    }
}

// Export constants and the class
TrajectorySimulationEngine.MANIFEST_SCHEMA = MANIFEST_SCHEMA;
TrajectorySimulationEngine.PREDICTION_RESULT_SCHEMA = PREDICTION_RESULT_SCHEMA;

module.exports = TrajectorySimulationEngine;