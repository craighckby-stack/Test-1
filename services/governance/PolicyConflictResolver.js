const PolicyPrecedenceEngine = require('./plugins/PolicyPrecedenceEngine');

/**
 * PolicyConflictResolver
 * Manages the resolution process by filtering applicable policies
 * and using a dedicated Precedence Engine for conflict resolution logic.
 */
class PolicyConflictResolver {
    /**
     * @param {Array<string>} precedenceRules - Ordered list of rules (e.g., 'explicitDeny', 'specificity').
     */
    constructor(precedenceRules = ['explicitDeny', 'specificity', 'latest']) {
        this.comparator = new PolicyPrecedenceEngine(precedenceRules);
    }

    /**
     * Determines if a policy's conditions are met by the current context.
     * NOTE: This abstract placeholder ensures the resolution logic remains efficient
     * by only comparing truly applicable policies.
     * @private
     */
    _policyApplies(policy, context) {
        // Placeholder logic: requires actual condition evaluation against context
        return policy.active !== false && policy.target.match(context);
    }

    /**
     * Resolves conflicts among a list of policies.
     * This uses an iterative tournament approach, relying on the external comparator.
     * @param {Array<Object>} policies - List of policy objects.
     * @param {Object} context - The operational context.
     * @returns {Object|null} The single winning policy, or null.
     */
    resolve(policies, context) {
        if (!policies || policies.length === 0) {
            return null;
        }

        // 1. Filter policies applicable to the context
        const applicablePolicies = policies.filter(p => this._policyApplies(p, context));

        if (applicablePolicies.length < 2) {
            return applicablePolicies[0] || null;
        }

        // 2. Iteratively compare candidates against the running winner
        let winningPolicy = applicablePolicies[0];

        for (let i = 1; i < applicablePolicies.length; i++) {
            const candidate = applicablePolicies[i];
            
            // compare(A, B): Returns 1 if A wins, -1 if B wins, 0 if tie.
            const comparisonResult = this.comparator.compare(candidate, winningPolicy);

            if (comparisonResult === 1) {
                // Candidate wins
                winningPolicy = candidate;
            } 
            // If -1 or 0, winningPolicy retains its status.
        }

        return winningPolicy;
    }
}

module.exports = PolicyConflictResolver;