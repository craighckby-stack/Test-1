/**
 * @fileoverview ConceptualPolicyEvaluator
 * Executes complex, concept-specific validation policies defined within the Concept Registry.
 * It dynamically dispatches execution requests to specific Policy Handlers registered 
 * in the ConceptualPolicyRegistry based on the constraint type, preventing monolithic logic.
 */

import { ConceptualPolicyRegistry } from './ConceptualPolicyRegistry.js';

// NOTE: executeConstraint logic has been extracted into the PolicyExecutionEngine plugin.
// We assume the PolicyExecutionEngine utility is available in the execution context.

/**
 * Executes a single conceptual constraint by looking up the appropriate handler.
 * @typedef {{ruleId: string, detail: string, severity: string}} Violation
 */

/**
 * Interface definition for the required Policy Execution Utility (provided by AGI kernel plugins)
 * @typedef {{execute: (args: { constraint: Object, context: Object, registry: Object }) => (Violation | null)}} PolicyExecutionEngineInterface
 */
declare const PolicyExecutionEngine: PolicyExecutionEngineInterface;


export const ConceptualPolicyEvaluator = {

    /**
     * Executes all defined constraints and policies for a given concept against the current context.
     * @param {Object} concept The conceptual definition object (from ConceptRegistry).
     * @param {Object} context The operational context (e.g., file path, diff content, metadata).
     * @returns {{isValid: boolean, violations: Array<Violation>}}
     */
    executePolicies(concept, context) {
        let violations = [];

        // Execution logic is now purely declarative dispatch.
        if (concept.constraints && Array.isArray(concept.constraints)) {
            for (const constraint of concept.constraints) {
                
                // CRITICAL: Delegating execution, error handling, and violation formatting to the plugin.
                const violation = PolicyExecutionEngine.execute({
                    constraint: constraint,
                    context: context,
                    registry: ConceptualPolicyRegistry // Pass the handler lookup table
                });

                if (violation) {
                    violations.push(violation);
                }
            }
        }

        // Potential integration point for broader systemic checks:
        // const systemicViolations = executeSystemicPolicies(concept, context);
        // violations = violations.concat(systemicViolations);

        return {
            isValid: violations.length === 0,
            violations: violations
        };
    }
};
