// SAG V94.1 - GAX Policy Formal Verification Unit (Orchestration Layer)
// Refactored for higher intelligence, prioritizing robust configuration defaults, 
// explicit sequential execution (Schema -> History -> Engine), and detailed logging.

const { GAX_PolicyConfig } = require('../../config/GAX/PolicyDefinitions.js');
const { CRoT_HistoryAnchor } = require('../../core/CRoT/HistoryAnchor.js');
const { PolicyHeuristicIndex } = require('../../core/CRoT/PolicyHeuristicIndex.js');
const { FormalVerificationEngine } = require('./FormalVerificationEngine.js');
const { PolicySchemaValidator } = require('./PolicySchemaValidator.js'); 
const GAXTelemetry = require('../../core/Telemetry/GAXTelemetryService.js');

// --- Configuration Defaults for Robustness ---
const VerificationUnitDefaults = Object.freeze({
    MIN_REQUIRED_ANCHORS: 5,
    HISTORY_LOOKBACK_DEPTH: 100
});

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
 * @property {number} durationMs - Total duration of the verification process.
 * @property {string} resultCategory - SUCCESS, FAILURE_AXIOMATIC, FAILURE_SCHEMA, FAILURE_INTERNAL.
 * @property {string|null} detailedReport - Human-readable summary.
 * @property {string[]|null} failureConstraints - List of violating axioms or internal error codes.
 */

/**
 * Helper to construct the standardized VerificationResult object.
 * @param {string} verificationId
 * @param {number} timestampStart
 * @param {object} details
 * @returns {VerificationResult}
 */
function _buildResult(verificationId, timestampStart, details) {
    const timestampEnd = Date.now();
    return {
        isVerified: details.isVerified,
        verificationId: verificationId,
        timestamp: timestampEnd,
        resultCategory: details.category,
        detailedReport: details.report,
        failureConstraints: details.constraints || null,
        durationMs: timestampEnd - timestampStart
    };
}

/**
 * V94.1 Optimized History Retrieval: combining heuristic indexing and depth fallback for optimal efficiency.
 * It retrieves contextual history (prior approved constraints) necessary for axiomatic anchoring.
 * 
 * @param {PolicyDelta} proposedPolicyUpdate
 * @param {object} currentConfig
 * @param {string} verificationId
 * @returns {Promise<string[]>} Array of historical constraints.
 */
async function _fetchHistoricalContext(proposedPolicyUpdate, currentConfig, verificationId) {
    let historicalConstraints = [];

    // Safely extract configuration or use robust defaults
    const minRequiredAnchors = currentConfig.minRequiredAnchors || VerificationUnitDefaults.MIN_REQUIRED_ANCHORS; 
    const historyLookbackDepth = currentConfig.historicalLookbackDepth || VerificationUnitDefaults.HISTORY_LOOKBACK_DEPTH;

    // 1. Heuristic History Retrieval (Fast Path)
    const fingerprint = PolicyHeuristicIndex.generateFingerprint(proposedPolicyUpdate);
    const relevantTxIds = await PolicyHeuristicIndex.getRelevantAnchorIDs(fingerprint);

    if (relevantTxIds.length > 0) {
        GAXTelemetry.debug('HISTORY_QUERY', { verificationId, type: 'HEURISTIC_ANCHORS', count: relevantTxIds.length });
        historicalConstraints = await CRoT_HistoryAnchor.getConstraintsByTxIds(relevantTxIds);
    }

    // 2. Depth Fallback (Safety Path)
    if (historicalConstraints.length < minRequiredAnchors) {
        GAXTelemetry.debug('HISTORY_QUERY', { 
            verificationId, 
            type: 'DEPTH_FALLBACK', 
            required: minRequiredAnchors,
            currentCount: historicalConstraints.length 
        });
        
        const depthConstraints = await CRoT_HistoryAnchor.getRecentSuccessfulACVs(historyLookbackDepth);
        
        // Combine results, ensuring uniqueness (important to prevent duplicate constraints in FVE)
        const combinedConstraints = new Set([...historicalConstraints, ...depthConstraints]);
        historicalConstraints = Array.from(combinedConstraints);
    }

    if (historicalConstraints.length === 0) {
        GAXTelemetry.warn('HISTORY_SHALLOW', { verificationId, info: "No certified history found for anchoring." });
    }
    
    return historicalConstraints;
}

/**
 * Executes the Formal Verification Process for proposed policy updates.
 *
 * @async
 * @function executeFormalVerification
 * @param {PolicyDelta} proposedPolicyUpdate - Policy delta: { delta_UFRM, delta_CFTM, delta_ACVD }
 * @returns {Promise<VerificationResult>}
 */
async function executeFormalVerification(proposedPolicyUpdate) {
    const timestampStart = Date.now();
    const verificationId = GAXTelemetry.generateRunId('PVF');

    GAXTelemetry.publish('PVF_START', {
        verificationId,
        proposedPolicyKeys: Object.keys(proposedPolicyUpdate)
    });

    let currentConfig;
    let result;

    try {
        // Step 1: Load Configuration
        currentConfig = await GAX_PolicyConfig.loadCurrent();
        if (!currentConfig) {
            throw new Error("CONFIG_LOAD_FAILURE: Policy Configuration missing or inaccessible.");
        }
        
        // Step 2: Pre-Verification (Schema Validation) - Ensure structural integrity before expensive I/O
        try {
             PolicySchemaValidator.validatePolicyUpdate(proposedPolicyUpdate);
        } catch (validationError) {
            // Re-throw with SCHEMA_VIOLATION prefix for specific failure categorization in the outer catch block
            throw new Error(`SCHEMA_VIOLATION: ${validationError.message}`);
        }
       
        // Step 3: Intelligent History Retrieval
        const historicalConstraints = await _fetchHistoricalContext(
            proposedPolicyUpdate,
            currentConfig,
            verificationId
        );
        
        // Step 4: Delegation to the Formal Verification Engine
        const simulationResult = await FormalVerificationEngine.checkConsistency(
            proposedPolicyUpdate,
            currentConfig,
            historicalConstraints
        );

        // Step 5: Process Engine Output
        if (simulationResult.isConsistent) {
            result = _buildResult(verificationId, timestampStart, {
                isVerified: true,
                category: 'SUCCESS',
                report: "Formal axiomatic consistency proven."
            });
            GAXTelemetry.success('PVF_SUCCESS', { verificationId, constraintsChecked: historicalConstraints.length, durationMs: result.durationMs });
        } else {
            result = _buildResult(verificationId, timestampStart, {
                isVerified: false,
                category: 'FAILURE_AXIOMATIC',
                report: simulationResult.failureReason || "Axiomatic consistency violation detected.",
                constraints: simulationResult.violatingAxioms
            });
            GAXTelemetry.failure('PVF_FAILED_AXIOMATIC', { verificationId, violations: simulationResult.violatingAxioms.length });
        }

    } catch (error) {
        // Step 6: Robust Failure Handling
        const errorMessage = error.message || "Unknown PVF internal error.";
        let category = 'FAILURE_INTERNAL';
        let logFunction = GAXTelemetry.fatal;

        if (errorMessage.startsWith('SCHEMA_VIOLATION')) {
            category = 'FAILURE_SCHEMA';
            logFunction = GAXTelemetry.warn; 
        } else if (errorMessage.startsWith('CONFIG_LOAD_FAILURE')) {
            category = 'FAILURE_INTERNAL'; 
        } else {
            // Default to fatal logging for unexpected runtime errors
             logFunction = GAXTelemetry.fatal; 
        }
        
        logFunction('PVF_FAILED', { verificationId, category, error: errorMessage });

        result = _buildResult(verificationId, timestampStart, {
            isVerified: false,
            category: category,
            report: `Execution failed: ${errorMessage.substring(0, 100)}${(errorMessage.length > 100 ? '...' : '')}`,
            constraints: [error.name || category, errorMessage.substring(0, 50)]
        });
    }

    return result;
}

module.exports = { executeFormalVerification };