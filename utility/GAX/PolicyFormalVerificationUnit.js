// SAG V94.1 - GAX Policy Formal Verification Unit (Orchestration Layer)
// Purpose: Proactively verify policy compliance before GSEP-C entry, leveraging structured telemetry.

const { GAX_PolicyConfig } = require('../../config/GAX/PolicyDefinitions.js');
const { CRoT_HistoryAnchor } = require('../../core/CRoT/HistoryAnchor.js');
const { FormalVerificationEngine } = require('./FormalVerificationEngine.js');
const GAXTelemetry = require('../../core/Telemetry/GAXTelemetryService.js');

/**
 * Standard input structure for Policy Formal Verification.
 * @typedef {object} PolicyDelta
 * @property {object} delta_UFRM - Unrestricted Formal Reasoning Model changes.
 * @property {object} delta_CFTM - Certified Formal Trust Model changes.
 * @property {object} delta_ACVD - Axiomatic Consistency Validation Data changes.
 */

/**
 * Standard output structure for Policy Formal Verification results.
 * @typedef {object} VerificationResult
 * @property {boolean} isVerified - True if the proposed policy is consistent with history/axioms.
 * @property {string} verificationId - Unique ID for this specific verification run.
 * @property {number} timestamp - Time of completion (in ms).
 * @property {string} resultCategory - SUCCESS, FAILURE_AXIOMATIC, FAILURE_INTERNAL.
 * @property {string|null} detailedReport - Human-readable summary.
 * @property {string[]|null} failureConstraints - List of violating axioms or internal error codes.
 */

/**
 * Executes the Formal Verification Process for proposed policy updates.
 * This is the orchestration layer that fetches history and passes inputs to the solver engine.
 *
 * @async
 * @function executeFormalVerification
 * @param {PolicyDelta} proposedPolicyUpdate - Policy delta: { delta_UFRM, delta_CFTM, delta_ACVD }
 * @returns {Promise<VerificationResult>}
 */
async function executeFormalVerification(proposedPolicyUpdate) {
    const timestampStart = Date.now();
    // Use the Telemetry helper for robust, auditable ID generation
    const verificationId = GAXTelemetry.generateRunId('PVF');

    GAXTelemetry.publish('VERIFICATION_START', { 
        verificationId,
        proposedPolicyKeys: Object.keys(proposedPolicyUpdate)
    });

    try {
        // 1. Fetch current certified policies
        const currentConfig = await GAX_PolicyConfig.loadCurrent();
        if (!currentConfig) {
            GAXTelemetry.error('CONFIG_LOAD_FAILURE', { verificationId, error: "Failed to load current GAX Policy Configuration." });
            throw new Error("CONFIG_LOAD_FAILURE");
        }

        // 2. Fetch certified historical constraints (HETM/GSM)
        const historyLookbackDepth = currentConfig.historicalLookbackDepth || 100;
        
        GAXTelemetry.debug('FETCHING_HISTORY', { verificationId, depth: historyLookbackDepth });
        
        const historicalConstraints = await CRoT_HistoryAnchor.getRecentSuccessfulACVs(historyLookbackDepth);
        
        if (!historicalConstraints || historicalConstraints.length === 0) {
            GAXTelemetry.warn('HISTORY_SHALLOW', { verificationId, reason: "CRoT History Anchor is shallow or empty. Verification integrity reduced." });
        }

        // 3. Delegate complex SAT solving logic to the dedicated engine
        const simulationResult = await FormalVerificationEngine.checkConsistency(
            proposedPolicyUpdate,
            currentConfig,
            historicalConstraints
        );

        const timestampEnd = Date.now();

        if (simulationResult.isConsistent) {
            GAXTelemetry.success('VERIFICATION_SUCCESS', {
                verificationId,
                durationMs: timestampEnd - timestampStart
            });
            return {
                isVerified: true,
                verificationId: verificationId,
                timestamp: timestampEnd,
                resultCategory: 'SUCCESS',
                detailedReport: "Formal axiomatic consistency proven.",
                failureConstraints: null
            };
        } else {
            GAXTelemetry.failure('VERIFICATION_FAILED_AXIOMATIC', {
                verificationId,
                durationMs: timestampEnd - timestampStart,
                violations: simulationResult.violatingAxioms 
            });
            return {
                isVerified: false,
                verificationId: verificationId,
                timestamp: timestampEnd,
                resultCategory: 'FAILURE_AXIOMATIC',
                detailedReport: simulationResult.failureReason || "Axiomatic consistency violation detected by solver.",
                failureConstraints: simulationResult.violatingAxioms || []
            };
        }

    } catch (error) {
        const timestampEnd = Date.now();
        const errorMessage = error.message || "Unknown internal error.";
        
        GAXTelemetry.fatal('PVF_EXECUTION_FATAL', {
            verificationId,
            errorName: error.name,
            errorMsg: errorMessage
        });

        return {
            isVerified: false,
            verificationId: verificationId,
            timestamp: timestampEnd,
            resultCategory: 'FAILURE_INTERNAL',
            detailedReport: `Execution failed due to internal error: ${errorMessage.substring(0, 100)}`,
            // Return sanitized, limited error information externally
            failureConstraints: ["INTERNAL_EXECUTION_ERROR", errorMessage.substring(0, 50)]
        };
    }
}

module.exports = { executeFormalVerification };
