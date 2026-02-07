/**
 * PolicyConflictResolver
 * Manages dynamic resolution and prioritization of simultaneously triggered governance policies.
 * This service ensures deterministic system behavior when metrics (like TQM, Security, and Efficiency) 
 * trigger conflicting automated actions (e.g., HALT vs. ACCELERATE).
 */

class PolicyConflictResolver {
    constructor(policyMappingEngine, contextService) {
        this.policyMappingEngine = policyMappingEngine;
        this.contextService = contextService; // Provides current system state context
    }

    /**
     * Resolves a set of policies to determine the single, safe, dominant action.
     * @param {Array<Object>} triggeredPolicies - List of policies requiring execution.
     * @returns {Object} The dominant policy action and reason, or null if no conflict.
     */
    resolve(triggeredPolicies) {
        if (triggeredPolicies.length <= 1) {
            return triggeredPolicies[0] || null;
        }

        // 1. Sort by explicit priority (defined in TQM_PolicyMapping or other configs)
        triggeredPolicies.sort((a, b) => b.priority - a.priority);

        const highestPriority = triggeredPolicies[0].priority;
        const dominantPolicies = triggeredPolicies.filter(p => p.priority === highestPriority);

        // 2. Conflict Handling (If multiple policies share the top priority)
        if (dominantPolicies.length > 1) {
            // Fallback logic: Use pre-defined conflict matrix (Safety > Security > Quality > Efficiency)
            const conflictMatrix = ['System_Halt', 'Isolation_Protocol', 'Reversion_Check', 'Dynamic_Throttle'];
            
            for (const actionType of conflictMatrix) {
                const policy = dominantPolicies.find(p => p.actionConfig.type === actionType);
                if (policy) {
                    return { 
                        ...policy, 
                        resolutionReason: `Dominant action based on Conflict Matrix: ${actionType}` 
                    };
                }
            }
        }

        // 3. Execute the single highest priority policy if no explicit conflicts remain
        return { ...dominantPolicies[0], resolutionReason: 'Highest Priority Policy Selection' };
    }
}

module.exports = PolicyConflictResolver;
