import { RulePrioritizationService } from './RulePrioritizationService'; // Assuming local import path

/**
 * Manages the resolution process for deviations by prioritizing and executing
 * mandated actions based on defined rules, incorporating memoization and delegated scoring.
 * 
 * This engine focuses primarily on caching and key management, delegating the 
 * heavy lifting of rule evaluation and scoring to the RulePrioritizationService.
 */
class DeviationResolutionEngine {
    
    // Dependencies injected via constructor 
    constructor(dependencies) {
        
        // Ensure core dependencies are present (used by the engine or the service)
        if (!dependencies.CriteriaEvaluatorUtility || !dependencies.WeightedScorerUtility || 
            !dependencies.CapacityLimitedCacheUtility || !dependencies.CanonicalHashingTool) {
            throw new Error("DeviationResolutionEngine requires essential utilities (CriteriaEvaluatorUtility, WeightedScorerUtility, CapacityLimitedCacheUtility, CanonicalHashingTool).");
        }
        
        // 1. Core Utilities for Caching/Hashing
        this.cache = dependencies.CapacityLimitedCacheUtility.getCache('DeviationResolutionResults');
        this.hasher = dependencies.CanonicalHashingTool;
        
        // 2. Specialized Service for Prioritization (Abstraction of core logic)
        this.rulePrioritizer = new RulePrioritizationService(
            dependencies.CriteriaEvaluatorUtility,
            dependencies.WeightedScorerUtility
        );
    }

    /**
     * Generates a stable, canonical hash key for caching resolution results.
     * Ensures the key is sensitive only to critical, indexed fields (severity, type, sourceTags) 
     * and the set of rules being evaluated.
     * @param {object} incidentContext 
     * @param {Array<object>} resolutionRules 
     * @returns {string}
     */
    _generateCacheKey(incidentContext, resolutionRules) {
        // Rule Hash: Depends only on the specific ruleset IDs (assuming rule content is stable per ID)
        const ruleHash = this.hasher.hash(resolutionRules.map(r => r.ruleId).sort().join('|'));
        
        // Context Hash: Only critical contextual data that affects resolution
        const contextData = {
            sev: incidentContext.severity,
            type: incidentContext.incidentType,
            src: Array.isArray(incidentContext.sourceTags) ? incidentContext.sourceTags.sort() : []
        };
        const contextHash = this.hasher.hash(JSON.stringify(contextData));

        return `DEV_RES:${ruleHash}:${contextHash}`;
    }

    /**
     * Resolves an incident by evaluating all applicable rules, prioritizing
     * the highest-magnitude resolution, incorporating memoization for efficiency.
     * 
     * @param {object} incidentContext - The context of the deviation (e.g., severity, type, sourceTags).
     * @param {Array<object>} resolutionRules - The set of available rules for resolution.
     * @returns {object} The mandated resolution action or null if none found.
     */
    resolve(incidentContext, resolutionRules) {
        if (!incidentContext || !resolutionRules || resolutionRules.length === 0) {
            return { action: 'NO_ACTION_REQUIRED', magnitude: 0 };
        }

        const cacheKey = this._generateCacheKey(incidentContext, resolutionRules);
        
        // 1. Memoization Check (Ensures computational efficiency for repeated lookups)
        const cachedResult = this.cache.get(cacheKey);
        if (cachedResult) {
            console.log(`Cache hit for resolution key: ${cacheKey}`);
            return cachedResult;
        }

        // 2. Delegate Rule Evaluation and Prioritization
        const finalResult = this.rulePrioritizer.findBestMatch(resolutionRules, incidentContext);
        
        // 3. Cache the result
        this.cache.set(cacheKey, finalResult);

        return finalResult;
    }
}

export { DeviationResolutionEngine };