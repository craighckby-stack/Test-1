/**
 * ConstraintEnforcementService
 * This service manages module contract integrity, efficient lookup, and constraint evaluation.
 * It abstracts the complex interactions between caching/integrity utilities and the evaluation engine.
 */
class ConstraintEnforcementService {
    
    /**
     * Initializes the service, retrieving necessary kernel utilities.
     * @param {Object} [deps] Optional dependencies for testing/injection.
     * @param {Object} [deps.contractCacheUtility] The utility for efficient contract retrieval and cycle detection.
     * @param {Object} [deps.evaluationEngine] The tool for calculating the safety index and checking constraints.
     */
    constructor(deps = {}) {
        this.contractCacheUtility = deps.contractCacheUtility || globalThis.ContractIntegrityAndCacheUtility;
        this.evaluationEngine = deps.evaluationEngine || globalThis.ConstraintEvaluationEngineTool;

        if (!this.contractCacheUtility) {
            throw new Error("Initialization Failure: Dependency ContractIntegrityAndCacheUtility missing.");
        }
        if (!this.evaluationEngine) {
            throw new Error("Initialization Failure: Dependency ConstraintEvaluationEngineTool missing.");
        }

        // Map used solely for providing context during a single graph traversal 
        // within the utility function to detect circular dependencies dynamically.
        // Managed instance state required by the delegated utility's API.
        this.activeContractMap = new Map(); 
    }

    /**
     * Retrieves and validates the contract for a given module ID.
     * Delegates efficient storage, caching, and integrity checks (circular dependencies).
     * 
     * @param {string} moduleId 
     * @returns {Object} The validated contract definition.
     * @throws {Error} If a circular dependency or missing contract is found.
     */
    getValidatedContract(moduleId) {
        // Clear context map for a fresh dependency check scope related to this retrieval.
        this.activeContractMap.clear(); 
        
        // Utility handles caching, efficient lookup, and cycle detection.
        const contract = this.contractCacheUtility.execute({ 
            moduleId: moduleId,
            contractMap: this.activeContractMap // Context provided to the utility
        });
        
        return contract;
    }

    /**
     * Core method to evaluate runtime data against module constraints and calculate the Safety Index.
     * 
     * @param {string} moduleId The ID of the module whose constraints are being enforced.
     * @param {Object} runtimeData The data object to validate against the contract.
     * @returns {{safetyIndex: number, results: Array, isCompliant: boolean}} Enforcement results.
     */
    enforce(moduleId, runtimeData) {
        try {
            // 1. Integrity Check and Contract Retrieval (Efficient & Safe)
            const contract = this.getValidatedContract(moduleId);

            // 2. Constraint Evaluation (Delegated logic)
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
            // Handle integrity breaches (e.g., Circular Dependency, missing contract)
            console.warn(`Constraint Enforcement Failure for module ${moduleId}: ${error.message}`);
            
            // Format an integrity failure result
            return {
                safetyIndex: 0.0,
                results: [{
                    name: "IntegrityCheck",
                    isValid: false,
                    message: `Contract retrieval or integrity check failed: ${error.message}`
                }],
                isCompliant: false
            };
        }
    }
}

// Expose the service
globalThis.ConstraintEnforcementService = ConstraintEnforcementService;