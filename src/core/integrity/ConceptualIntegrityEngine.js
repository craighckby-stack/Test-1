/**
 * @fileoverview The Conceptual Integrity Engine (CIE).
 * This service enforces consistency between the codified AGI/ARCH concepts defined in conceptRegistry.js
 * and the actual code artifacts, system states, or proposed mutations.
 *
 * Its primary role is to prevent 'concept drift' by ensuring that core concepts are actively accounted for.
 * The enforcement is delegated to the ConceptualPolicyEvaluator for declarative execution.
 */

import { ConceptRegistry } from '../conceptRegistry.js';
import { ConceptualPolicyEvaluator } from './ConceptualPolicyEvaluator.js'; // Proposed dependency

const CRITICAL_STATUSES = ['Critical Core', 'Critical Consensus'];

/**
 * Checks if a specific concept's constraints are adhered to within the given context.
 * This function primarily delegates complex rule checking to the Policy Evaluator.
 *
 * @param {string} conceptId The ID of the concept to validate against.
 * @param {Object} context The operational context (e.g., { filePath, mutationType, proposalDetails }).
 * @returns {{isValid: boolean, message: string, violations: Array<Object>}}
 */
function validateConceptAdherence(conceptId, context) {
    const concept = ConceptRegistry.getConceptById(conceptId);
    if (!concept) {
        return { isValid: false, message: `Concept ID ${conceptId} is undefined.`, violations: [] };
    }

    // 1. Critical Implementation Path Check (Fast failure requirement)
    if (CRITICAL_STATUSES.includes(concept.status) && concept.implementationPath && context.filePath === concept.implementationPath) {
        if (!context.requiresCriticalReview) {
            return {
                isValid: false,
                message: `Critical path modification detected (${concept.name}). Requires explicit 'Critical Review' flag.`,
                violations: [{ ruleId: 'CRIT_PATH_MOD', details: `Path: ${concept.implementationPath}` }]
            };
        }
    }

    // 2. Execution of Declarative Conceptual Policies (delegated complexity)
    const policyResult = ConceptualPolicyEvaluator.executePolicies(concept, context);

    if (!policyResult.isValid) {
        return {
            isValid: false,
            message: `Concept adherence failed due to policy violation(s).`,
            violations: policyResult.violations
        };
    }

    return { isValid: true, message: 'Adherence validated.', violations: [] };
}

/**
 * Scans a mutation proposal for concept drift by mapping the proposal's scope
 * against all relevant codified concepts and running adherence checks.
 *
 * @param {Object} proposal The object describing the proposed change/mutation (must include affectedFiles array).
 * @returns {Array<{conceptId: string, name: string, status: string, isValid: boolean, violations: Array<Object>, triggeredByFile: string|null}>}
 */
function scanProposalForConceptDrift(proposal) {
    const affectedFiles = proposal.affectedFiles || [];
    const driftReports = [];

    // Optimization: Only retrieve and check concepts relevant to code artifacts/mutations
    const relevantConcepts = ConceptRegistry.getAllConcepts().filter(c => 
        c.implementationPath || (c.constraints && c.constraints.length > 0)
    );

    for (const concept of relevantConcepts) {
        let conceptViolationFound = false;
        
        let baseContext = {
            ...proposal.metadata,
            requiresCriticalReview: proposal.requiresCriticalReview,
            proposalId: proposal.id
        };

        // Check against every file affected by the proposal
        for (const fileChange of affectedFiles) {
            const context = {
                ...baseContext,
                filePath: fileChange.path,
                mutationType: fileChange.type, // ADD, MODIFY, DELETE
                contentDiff: fileChange.diff    // The actual content change diff
            };

            const adherenceResult = validateConceptAdherence(concept.id, context);

            if (!adherenceResult.isValid) {
                driftReports.push({
                    conceptId: concept.id,
                    name: concept.name,
                    status: concept.status,
                    isValid: false,
                    violations: adherenceResult.violations,
                    triggeredByFile: fileChange.path
                });
                conceptViolationFound = true;
                break; // Hard fail: Move to next concept, no need to recheck other files for this specific concept.
            }
        }

        // TODO: Future: Systemic checks (concepts not tied to a single file path)

    }

    return driftReports;
}

// Central export object
export const ConceptualIntegrityEngine = {
    validateConceptAdherence,
    scanProposalForConceptDrift,
    CRITICAL_STATUSES
};