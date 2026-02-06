/**
 * @fileoverview The Conceptual Integrity Engine (CIE).
 * This service enforces consistency between the codified AGI/ARCH concepts defined in conceptRegistry.js
 * and the actual code artifacts, system states, or proposed mutations.
 *
 * Its primary role is to prevent 'concept drift' by ensuring that core concepts are actively accounted for.
 * The enforcement is delegated to the ConceptualPolicyEvaluator for declarative execution.
 */

import { ConceptRegistry } from '../conceptRegistry.js';
import { ConceptualPolicyEvaluator } from './ConceptualPolicyEvaluator.js';

const CRITICAL_STATUSES = ['Critical Core', 'Critical Consensus'];
const ARTIFACT_SCOPE = 'artifact';
const SYSTEMIC_SCOPE = 'systemic';

/**
 * Validates a single concept against a given execution context.
 * Delegates policy enforcement but handles critical, fast-fail checks internally.
 *
 * @param {Object} concept The concept object from the registry.
 * @param {Object} context The operational context, including file path if applicable.
 * @returns {{isValid: boolean, message: string, violations: Array<Object>}}
 */
function _executeConceptValidation(concept, context) {
    // 1. Critical Implementation Path Check (Fast failure requirement for code changes)
    if (context.scope === ARTIFACT_SCOPE && concept.implementationPath) {
        if (CRITICAL_STATUSES.includes(concept.status) && context.filePath === concept.implementationPath) {
            if (!context.requiresCriticalReview) {
                return {
                    isValid: false,
                    message: `Critical path modification detected (${concept.name}). Requires explicit 'Critical Review' flag.`,
                    violations: [{ ruleId: 'CRIT_PATH_MOD', details: `Path: ${concept.implementationPath}` }]
                };
            }
        }
    }

    // 2. Execution of Declarative Conceptual Policies (delegated complexity)
    // The Policy Evaluator must handle context filtering based on concept scope.
    const policyResult = ConceptualPolicyEvaluator.executePolicies(concept, context);

    if (!policyResult.isValid) {
        return {
            isValid: false,
            // Provide a more specific error message based on the concept name
            message: `[${concept.name}] Policy adherence failed: ${policyResult.violations.length} violations found.`,
            violations: policyResult.violations
        };
    }

    return { isValid: true, message: 'Adherence validated.', violations: [] };
}


/**
 * Processes all relevant artifact-scoped concepts against the proposal's affected files.
 * @param {Object} proposal The object describing the proposed change/mutation.
 * @param {Array<Object>} relevantConcepts All concepts that need checking.
 * @returns {Array<{conceptId: string, name: string, status: string, isValid: boolean, violations: Array<Object>, triggeredByFile: string|null}>}
 */
function _runArtifactChecks(proposal, relevantConcepts) {
    const driftReports = [];
    const affectedFiles = proposal.affectedFiles || [];
    
    // Filter concepts that are explicitly tied to file artifacts
    const artifactConcepts = relevantConcepts.filter(c => 
        c.implementationPath || (c.scope === ARTIFACT_SCOPE)
    );

    const baseContext = {
        scope: ARTIFACT_SCOPE,
        requiresCriticalReview: proposal.requiresCriticalReview,
        proposalId: proposal.id,
        metadata: proposal.metadata || {}
    };

    for (const concept of artifactConcepts) {
        let conceptViolationFound = false;

        for (const fileChange of affectedFiles) {
            
            // Efficiency Check: If concept is path-specific and the file doesn't match, skip validation.
            if (concept.implementationPath && concept.implementationPath !== fileChange.path) {
                continue; 
            }

            const context = {
                ...baseContext,
                filePath: fileChange.path,
                mutationType: fileChange.type, // ADD, MODIFY, DELETE
                contentDiff: fileChange.diff    // The actual content change diff
            };

            const adherenceResult = _executeConceptValidation(concept, context);

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
                break; // Fail fast: Once a concept is violated, stop checking it against other files in the proposal.
            }
        }
    }

    return driftReports;
}


/**
 * Processes concepts that are systemic (not tied to specific file artifacts, but to system state,
 * configuration, or overall architectural invariants).
 * @param {Object} proposal The object describing the proposed change/mutation.
 * @param {Array<Object>} relevantConcepts All concepts that need checking.
 * @returns {Array<Object>}
 */
function _runSystemicChecks(proposal, relevantConcepts) {
    const driftReports = [];

    // Filter concepts that are systemic (or lack an implementationPath)
    const systemicConcepts = relevantConcepts.filter(c => 
        !c.implementationPath && (c.scope === SYSTEMIC_SCOPE || !c.scope)
    );

    const context = {
        scope: SYSTEMIC_SCOPE,
        requiresCriticalReview: proposal.requiresCriticalReview,
        proposalId: proposal.id,
        affectedFilesSummary: proposal.affectedFiles.map(f => ({ path: f.path, type: f.type })),
        proposalDetails: proposal // Pass the entire proposal for full context
    };

    for (const concept of systemicConcepts) {
        // Systemic checks don't need a filePath trigger; they check the proposal itself.
        const adherenceResult = _executeConceptValidation(concept, context);

        if (!adherenceResult.isValid) {
            driftReports.push({
                conceptId: concept.id,
                name: concept.name,
                status: concept.status,
                isValid: false,
                violations: adherenceResult.violations,
                triggeredByFile: null // Systemic checks are proposal-wide
            });
        }
    }

    return driftReports;
}


/**
 * Scans a mutation proposal for concept drift by running both artifact-scoped
 * and systemic-scoped checks.
 *
 * @param {Object} proposal The object describing the proposed change/mutation.
 * @returns {Array<Object>} Consolidated drift reports.
 */
function scanProposalForConceptDrift(proposal) {
    const allConcepts = ConceptRegistry.getAllConcepts();
    
    // Determine all concepts that are relevant to *any* kind of check (artifact or systemic)
    const relevantConcepts = allConcepts.filter(c => 
        c.implementationPath || c.constraints || c.scope
    );

    // 1. Run checks tied to specific code artifacts (files)
    const artifactDrifts = _runArtifactChecks(proposal, relevantConcepts);

    // 2. Run checks tied to the overall system state or proposal properties
    const systemicDrifts = _runSystemicChecks(proposal, relevantConcepts);

    return [...artifactDrifts, ...systemicDrifts];
}


// Central export object
export const ConceptualIntegrityEngine = {
    /**
     * Public interface for validating a single concept against a context.
     * @param {string} conceptId
     * @param {Object} context
     */
    validateConcept: (conceptId, context) => {
        const concept = ConceptRegistry.getConceptById(conceptId);
        if (!concept) {
            return { isValid: false, message: `Concept ID ${conceptId} is undefined.`, violations: [] };
        }
        return _executeConceptValidation(concept, context);
    },
    scanProposalForConceptDrift,
    CRITICAL_STATUSES
};