/**
 * Manages and executes Micro-Computation Credit (MCC) policies efficiently.
 * This implementation incorporates optimized rule sorting (3),
 * and leverages DeclarativePolicyConditionEvaluator for recursive condition checks (5).
 * Prefix/Range matching (1 & 2) is assumed to be handled by the injected PolicyRuleMatcherTool.
 */

import { DeclarativePolicyConditionEvaluator } from './plugins'; // Using the newly defined plugin
import { PolicyRuleMatcherTool } from './policy/PolicyRuleMatcherTool'; // Existing tool
import { SchemaCompilerAndValidator } from '../schema/SchemaCompilerAndValidator'; // Existing tool

/**
 * Interface definition for the extracted tool (for TypeScript type safety)
 */
interface IDeclarativePolicyConditionEvaluator {
    execute(args: { data: any, policyConditions: any }): boolean;
}

class MccPolicyEngine {
    private policies: PolicyDefinition[] = [];
    private policyMatcher: PolicyRuleMatcherTool;
    private conditionEvaluator: IDeclarativePolicyConditionEvaluator;
    private schemaValidator: SchemaCompilerAndValidator;

    constructor(
        policyMatcher: PolicyRuleMatcherTool,
        schemaValidator: SchemaCompilerAndValidator,
    ) {
        // Initialize the plugin instance (mocking dynamic load)
        this.conditionEvaluator = (DeclarativePolicyConditionEvaluator as any).execute 
            ? DeclarativePolicyConditionEvaluator 
            : { execute: () => false }; 
            
        this.policyMatcher = policyMatcher;
        this.schemaValidator = schemaValidator;
    }

    private type PolicyDefinition = {
        id: string;
        priority: number; // For sorting
        scope: 'prefix' | 'range' | 'exact';
        matchKey: string;
        conditions: any; // Nested declarative conditions
        action: 'ALLOW' | 'DENY' | 'AUDIT';
        rateLimitConfig?: any; // placeholder
    };

    /**
     * Step 3: Initialize and sort policies based on priority.
     */
    public initializeEngine(rawPolicies: PolicyDefinition[]): void {
        if (!rawPolicies || rawPolicies.length === 0) {
            this.policies = [];
            return;
        }

        // Optimization 1 & 2: Assuming PolicyRuleMatcherTool compiles Trie/Interval structures internally.
        this.policyMatcher.compileRules(rawPolicies);

        // Optimization 3: Sort policies based on explicit priority (high priority first) to minimize evaluation steps (Step 4).
        this.policies = rawPolicies.sort((a, b) => b.priority - a.priority);

        console.log(`MccPolicyEngine initialized with ${this.policies.length} prioritized policies.`);
    }

    /**
     * Step 4 & 5: Optimized policy evaluation using sorted rules and recursive evaluation.
     */
    public evaluateTransaction(transaction: { resourceId: string, value: number, context: any }): 'ALLOW' | 'DENY' | 'AUDIT' | null {
        if (!transaction || !transaction.resourceId) {
            return 'DENY'; 
        }

        // Step 4a: Find matching policies using efficient structures (Trie/Interval Tree abstraction).
        const matchingPolicies = this.policyMatcher.findMatchingRules(transaction.resourceId, this.policies);

        // Iterate through matching policies in order of pre-sorted priority (Step 4b)
        for (const policy of matchingPolicies) {
            const contextData = { ...transaction, ...transaction.context };
            
            // Step 5: Use the dedicated condition evaluator for recursive assessment.
            const conditionsMet = this.conditionEvaluator.execute({
                data: contextData,
                policyConditions: policy.conditions
            });

            if (conditionsMet) {
                // Return the action of the highest priority rule that meets its conditions.
                return policy.action; 
            }
        }

        return null;
    }
}