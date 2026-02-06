// SAG V94.1 - GAX Policy Formal Verification Unit (Orchestration Layer)
// Purpose: Proactively verify policy compliance before GSEP-C entry.

const { GAX_PolicyConfig } = require('../../config/GAX/PolicyDefinitions.js');
const { CRoT_HistoryAnchor } = require('../../core/CRoT/HistoryAnchor.js');
// Refactored to rely on a dedicated, abstracted verification engine
const { FormalVerificationEngine } = require('./FormalVerificationEngine.js');

/**
 * Executes the Formal Verification Process for proposed policy updates.
 * This is the orchestration layer that fetches history and passes inputs to the solver engine.
 *
 * @async
 * @function executeFormalVerification
 * @param {object} proposedPolicyUpdate - Policy delta: { delta_UFRM, delta_CFTM, delta_ACVD }
 * @returns {Promise<{isVerified: boolean, verificationId: string, timestamp: number, detailedReport: string|null, failureConstraints: string[]|null}>}
 */
async function executeFormalVerification(proposedPolicyUpdate) {
    const timestamp = Date.now();
    const verificationId = `PVF-${timestamp}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    try {
        console.log(`[PFVU:${verificationId}] Starting formal verification against CRoT history.`);

        // 1. Fetch current certified policies
        const currentConfig = await GAX_PolicyConfig.loadCurrent();
        if (!currentConfig) {
            throw new Error("Failed to load current GAX Policy Configuration.");
        }

        // 2. Fetch certified historical constraints (HETM/GSM)
        // Use a configuration defined depth if available, defaulting to 100
        const historyLookbackDepth = currentConfig.historicalLookbackDepth || 100;
        const historicalConstraints = await CRoT_HistoryAnchor.getRecentSuccessfulACVs(historyLookbackDepth);
        if (!historicalConstraints || historicalConstraints.length === 0) {
            console.warn("CRoT History Anchor is shallow or empty. Verification integrity reduced.");
        }

        // 3. Delegate complex SAT solving logic to the dedicated engine
        const simulationResult = await FormalVerificationEngine.checkConsistency(
            proposedPolicyUpdate,
            currentConfig,
            historicalConstraints
        );

        if (simulationResult.isConsistent) {
            console.log(`[PFVU:${verificationId}] Policy verified successfully.`);
            return {
                isVerified: true,
                verificationId: verificationId,
                timestamp: timestamp,
                detailedReport: "Formal axiomatic consistency proven.",
                failureConstraints: null
            };
        } else {
            console.warn(`[PFVU:${verificationId}] Verification failed: Consistency violation detected.`);
            return {
                isVerified: false,
                verificationId: verificationId,
                timestamp: timestamp,
                detailedReport: simulationResult.failureReason,
                failureConstraints: simulationResult.violatingAxioms || []
            };
        }

    } catch (error) {
        console.error(`[PFVU:${verificationId}] Fatal error during execution:`, error.message);
        return {
            isVerified: false,
            verificationId: verificationId,
            timestamp: timestamp,
            detailedReport: `Execution failed due to internal error: ${error.message}`,
            failureConstraints: ["INTERNAL_EXECUTION_ERROR", error.message.substring(0, 50)]
        };
    }
}

module.exports = { executeFormalVerification };
