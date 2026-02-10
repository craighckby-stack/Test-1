/**
 * Manages the resolution process for deviations by prioritizing and executing
 * mandated actions based on defined rules, incorporating memoization and delegated scoring.
 *
 * Note: Assumes dependency injection of CriteriaEvaluatorUtility, WeightedScorerUtility,
 * CapacityLimitedCacheUtility, and CanonicalHashingTool.
 */
class DeviationResolutionEngine {
    
    // Dependencies injected via constructor or assumed global scope access
    constructor(dependencies) {
        this.criteriaEvaluator = dependencies.CriteriaEvaluatorUtility;
        this.weightedScorer = dependencies.WeightedScorerUtility;
        // Utilize existing high-efficiency cache for result memoization
        this.cache = dependencies.CapacityLimitedCacheUtility.getCache('DeviationResolutionResults');
        this.hasher = dependencies.CanonicalHashingTool;
        
        if (!this.criteriaEvaluator || !this.weightedScorer || !this.cache || !this.hasher) {
            throw new Error("DeviationResolutionEngine requires essential utilities (CriteriaEvaluatorUtility, WeightedScorerUtility, CapacityLimitedCacheUtility, CanonicalHashingTool).");
        }
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

        let bestMatch = null;
        let maxMagnitude = -Infinity;

        // 2. Rule Evaluation and Prioritization
        for (const rule of resolutionRules) {
            // Delegate complex multi-criteria matching to the dedicated utility
            const isMatch = this.criteriaEvaluator.execute(rule, incidentContext);
            
            if (isMatch) {
                // Delegate weighted scoring for priority determination
                const magnitude = this.weightedScorer.calculateScore(rule.weights || {}, incidentContext);

                if (magnitude > maxMagnitude) {
                    maxMagnitude = magnitude;
                    bestMatch = {
                        action: rule.resolutionAction,
                        magnitude: magnitude,
                        ruleId: rule.ruleId
                    };
                }
            }
        }
        
        const finalResult = bestMatch || { action: 'NO_ACTION_REQUIRED', magnitude: 0 };

        // 3. Cache the result
        this.cache.set(cacheKey, finalResult);

        return finalResult;
    }
}

export { DeviationResolutionEngine };