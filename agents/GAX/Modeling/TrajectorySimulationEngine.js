// Defining Schemas outside the class for clarity
const MANIFEST_SCHEMA = {
    entityId: { type: 'string', required: true },
    // Added optional fields expected in features for clarity
    transactionId: { type: 'string', required: false },
    complexity: { type: 'number', required: false }
};

const PREDICTION_RESULT_SCHEMA = {
    temm: { type: 'number', required: true }, // Trajectory Execution Mitigation Metric
    ecvm: { type: 'boolean', required: true }  // Execution Constraint Verification Metric
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
    /**
     * @param {Object} ACVD_Store - Data store containing historical execution metrics and constraints (assumed to expose async methods).
     * @param {Object} Configuration - System configuration and load factors (assumed to expose sync methods).
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
        // This optimization removes runtime lookup overhead from runSimulation.
        this.validator = (SynergyRegistry && typeof SynergyRegistry.getService === 'function')
            ? SynergyRegistry.getService('SchemaValidationService')
            : null;
        
        this.synergyRegistry = SynergyRegistry;
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
            const entityId = inputManifest.entityId;
            // Using default 0 if risk fetching fails temporarily, prioritizing prediction over crash
            const historyRisk = await this.ACVD.getHistoricalRisk(entityId).catch(() => 0);

            return {
                transactionId: inputManifest.transactionId || 'N/A',
                complexity_score: inputManifest.complexity || 5, // Default complexity
                history_risk: historyRisk, // Value derived asynchronously
                current_load_factor: this.config.getCurrentLoadFactor() 
            };
        } catch (error) {
            console.error("TSE Feature Extraction Failed: Could not process ACVD data.", error);
            // Re-throw if critical error (e.g., this.config is inaccessible)
            throw new Error("Feature extraction failed."); 
        }
    }

    /**
     * Runs the full trajectory simulation by extracting features and calling the model handler.
     * Utilizes SchemaValidationService if available.
     * @param {Object} inputManifest
     * @returns {Promise<{predictedTEMM: number, predictedECVM: boolean}>}
     */
    async runSimulation(inputManifest) {
        let entityId = 'unknown';

        // The ValidationService is now pre-resolved as this.validator

        try {
            // 1. Critical Minimal Input Check
            if (!inputManifest || typeof inputManifest.entityId !== 'string') {
                 throw new Error("Invalid Manifest: 'entityId' is required and must be a string for simulation.");
            }
            entityId = inputManifest.entityId;

            // 2. Comprehensive Input Validation using pre-resolved validator
            if (this.validator) {
                // NOTE: Validation Service executes validation logic against the schema.
                const validationResult = await this.validator.execute('validate', inputManifest, MANIFEST_SCHEMA);
                
                if (!validationResult || !validationResult.isValid) {
                    const errorMsg = validationResult && validationResult.errors ? validationResult.errors.join('; ') : 'Unknown validation error.';
                    throw new Error(`Comprehensive Input Validation Failed: ${errorMsg}`);
                }
            } 

            const features = await this.#extractFeatures(inputManifest);

            // Execute asynchronous model inference
            const results = await this.model.predict(features);

            // 3. Output Validation
            if (this.validator) {
                const outputValidation = await this.validator.execute('validate', results, PREDICTION_RESULT_SCHEMA);
                
                if (!outputValidation || !outputValidation.isValid) {
                     const errorMsg = outputValidation && outputValidation.errors ? outputValidation.errors.join('; ') : 'Unknown validation error.';
                     throw new Error(`Model output format invalid (Comprehensive Check). Errors: ${errorMsg}`);
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
            console.error(`TSE Simulation Failed for Entity ${entityId}:`, error.message);
            // Ensure error message is clean and actionable.
            const errorMessage = (error instanceof Error) ? error.message : String(error);
            throw new Error(`Trajectory simulation failed due to prediction system error. Details: ${errorMessage}`);
        }
    }
}

// Export constants attached to the class for external inspection
TrajectorySimulationEngine.MANIFEST_SCHEMA = MANIFEST_SCHEMA;
TrajectorySimulationEngine.PREDICTION_RESULT_SCHEMA = PREDICTION_RESULT_SCHEMA;

module.exports = TrajectorySimulationEngine;