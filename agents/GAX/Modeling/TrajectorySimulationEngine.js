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
 * It relies on an injected Validator (conforming to SchemaValidationService) for comprehensive
 * input/output schema enforcement.
 */
class TrajectorySimulationEngine {
    /**
     * @param {Object} ACVD_Store - Data store containing historical execution metrics and constraints (assumed to expose async methods).
     * @param {Object} Configuration - System configuration and load factors (assumed to expose sync methods).
     * @param {Object} ModelHandler - The initialized predictive model wrapper implementing the 'predict' interface.
     * @param {Object} [Validator] - Optional schema validation service instance (conforming to SchemaValidationService).
     */
    constructor(ACVD_Store, Configuration, ModelHandler, Validator = null) {
        if (!ModelHandler || typeof ModelHandler.predict !== 'function') {
            throw new Error("TSE Initialization Error: A valid ModelHandler implementing an asynchronous 'predict' method is required.");
        }

        // Enforce the SchemaValidationService interface if a validator is provided
        if (Validator && typeof Validator.validate !== 'function') {
            throw new Error("TSE Initialization Error: Injected Validator must conform to the SchemaValidationService interface (requires 'validate' method).");
        }

        this.ACVD = ACVD_Store;
        this.config = Configuration;
        this.model = ModelHandler;
        this.validator = Validator;
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

        try {
            // 1. Critical Minimal Input Check: Ensure entityId exists for logging and feature extraction.
            if (!inputManifest || typeof inputManifest.entityId !== 'string') {
                 throw new Error("Invalid Manifest: 'entityId' is required and must be a string for simulation.");
            }
            entityId = inputManifest.entityId;

            // 2. Comprehensive Input Validation using injected Validator (preferred)
            if (this.validator) {
                const inputValidation = this.validator.validate(inputManifest, MANIFEST_SCHEMA);
                if (!inputValidation.isValid) {
                    throw new Error(`Comprehensive Input Validation Failed: ${inputValidation.errors.join('; ')}`);
                }
            } 

            const features = await this.#extractFeatures(inputManifest);

            // Execute asynchronous model inference
            const results = await this.model.predict(features);

            // 3. Output Validation
            if (this.validator) {
                const outputValidation = this.validator.validate(results, PREDICTION_RESULT_SCHEMA);
                if (!outputValidation.isValid) {
                    throw new Error(`Model output format invalid (Comprehensive Check). Expected {temm: number, ecvm: boolean}. Errors: ${outputValidation.errors.join('; ')}`);
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