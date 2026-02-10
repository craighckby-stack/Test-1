/**
 * ConstraintEnforcementService
 * This service manages module contract integrity, efficient lookup, and constraint evaluation.
 * It implements suggested architectural improvements: Hash map efficiency, caching, 
 * circular dependency checks, and modularized evaluation logic by delegating to specialized kernel plugins.
 */
class ConstraintEnforcementService {
    
    // Inject dependencies (plugins)
    // globalThis.ContractIntegrityAndCacheUtility handles lookup, caching, and cycle detection (1, 2, 3)
    // globalThis.ConstraintEvaluationEngineTool handles safety index and constraint checks (4)

    constructor() {
        this.contractCacheUtility = globalThis.ContractIntegrityAndCacheUtility;
        this.evaluationEngine = globalThis.ConstraintEvaluationEngineTool;

        if (!this.contractCacheUtility || !this.evaluationEngine) {
            throw new Error("Initialization Failure: Core constraint kernel utilities missing.");
        }

        // Map used solely for providing context during a single graph traversal 
        // within the utility function to detect circular dependencies dynamically.
        this.activeContractMap = new Map(); 
    }

    /**
     * Retrieves and validates the contract for a given module ID.
     * Delegates efficient storage, caching, and integrity checks (circular dependencies).
     * 
     * @param {string} moduleId 
     * @returns {Object} The validated contract definition.
     */
    getValidatedContract(moduleId) {
        // Clear context map for a fresh dependency check scope related to this retrieval
        this.activeContractMap.clear(); 
        
        // Utility handles caching, efficient lookup, and cycle detection.
        const contract = this.contractCacheUtility.execute({ 
            moduleId: moduleId,
            contractMap: this.activeContractMap // Context for cycle detection
        });
        
        return contract;
    }

    /**
     * Core method to evaluate runtime data against module constraints and calculate the Safety Index.
     * Logic for evaluating the safety index and constraints is factored out into a dedicated tool.
     * 
     * @param {string} moduleId The ID of the module whose constraints are being enforced.
     * @param {Object} runtimeData The data object to validate against the contract.
     * @returns {{safetyIndex: number, results: Array, isCompliant: boolean}} Enforcement results.
     */
    enforce(moduleId, runtimeData) {
        try {
            // 1. Integrity Check and Contract Retrieval (Efficient & Safe)
            const contract = this.getValidatedContract(moduleId);

            // 2. Constraint Evaluation (Modularized logic)
            const evaluationResult = this.evaluationEngine.execute({
                contract: contract,
                data: runtimeData
            });

            return {
                safetyIndex: evaluationResult.safetyIndex,
                results: evaluationResult.constraintResults,
                isCompliant: evaluationResult.isCompliant
            };

        } catch (error) {
            // Handle integrity breaches (e.g., Circular Dependency)
            console.error(`Constraint Enforcement Integrity Failure for ${moduleId}: ${error.message}`);
            return {
                safetyIndex: 0.0,
                results: [{ name: "IntegrityCheck", isValid: false, message: `Contract integrity failure: ${error.message}` }],
                isCompliant: false
            };
        }
    }
}

// Expose the service
globalThis.ConstraintEnforcementService = ConstraintEnforcementService;