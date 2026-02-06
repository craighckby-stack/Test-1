/**
 * SAG V94.1 - GAX Policy Formal Verification Unit (Orchestration Layer)
 * Implements the mandatory sequential flow: Config > Schema > History > Engine.
 */

const { GAX_PolicyConfig } = require('../../config/GAX/PolicyDefinitions.js');
const { CRoT_HistoryAnchor } = require('../../core/CRoT/HistoryAnchor.js');
const { PolicyHeuristicIndex } = require('../../core/CRoT/PolicyHeuristicIndex.js');
const { FormalVerificationEngine } = require('./FormalVerificationEngine.js');
const { PolicySchemaValidator } = require('./PolicySchemaValidator.js'); 
const GAXTelemetry = require('../../core/Telemetry/GAXTelemetryService.js');

// --- Configuration and Event Constants ---
const TelemetryEvents = Object.freeze({
    START: 'PVF_START',
    SUCCESS: 'PVF_SUCCESS',
    FAILURE_AXIOMATIC: 'PVF_FAILED_AXIOMATIC',
    FAILURE_SCHEMA: 'PVF_FAILED_SCHEMA',
    FAILURE_INTERNAL: 'PVF_FAILED_INTERNAL',
    HISTORY_QUERY: 'PVF_HISTORY_QUERY'
});

const VerificationUnitDefaults = Object.freeze({
    MIN_REQUIRED_ANCHORS: 5,
    HISTORY_LOOKBACK_DEPTH: 100
});

// [TypeDefs omitted here, assumed external JSDoc reference]

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
        detailedReport: details.report || 'No detailed report provided.',
        failureConstraints: details.constraints || null,
        durationMs: timestampEnd - timestampStart
    };
}

/**
 * V94.1 Optimized History Retrieval: combining heuristic indexing and depth fallback.
 * 
 * @param {PolicyDelta} proposedPolicyUpdate
 * @param {object} currentConfig
 * @param {string} verificationId
 * @returns {Promise<string[]>} Array of historical constraints.
 */
async function _fetchHistoricalContext(proposedPolicyUpdate, currentConfig, verificationId) {
    let historicalConstraints = [];

    // Destructure configuration ensuring robust defaults are used
    const { 
        minRequiredAnchors = VerificationUnitDefaults.MIN_REQUIRED_ANCHORS, 
        historicalLookbackDepth = VerificationUnitDefaults.HISTORY_LOOKBACK_DEPTH
    } = currentConfig;

    // 1. Heuristic History Retrieval (Fast Path)
    const fingerprint = PolicyHeuristicIndex.generateFingerprint(proposedPolicyUpdate);
    const relevantTxIds = await PolicyHeuristicIndex.getRelevantAnchorIDs(fingerprint);

    if (relevantTxIds.length > 0) {
        GAXTelemetry.debug(TelemetryEvents.HISTORY_QUERY, { verificationId, type: 'HEURISTIC_ANCHORS', count: relevantTxIds.length });
        historicalConstraints = await CRoT_HistoryAnchor.getConstraintsByTxIds(relevantTxIds);
    }

    // 2. Depth Fallback (Safety Path)
    if (historicalConstraints.length < minRequiredAnchors) {
        GAXTelemetry.debug(TelemetryEvents.HISTORY_QUERY, { 
            verificationId, 
            type: 'DEPTH_FALLBACK', 
            required: minRequiredAnchors,
            currentCount: historicalConstraints.length 
        });
        
        const depthConstraints = await CRoT_HistoryAnchor.getRecentSuccessfulACVs(historicalLookbackDepth);
        
        // Combine results, ensuring uniqueness before feeding to FVE
        const combinedConstraints = new Set([...historicalConstraints, ...depthConstraints]);
        historicalConstraints = Array.from(combinedConstraints);
    }

    if (historicalConstraints.length === 0) {
        GAXTelemetry.warn('HISTORY_SHALLOW', { verificationId, info: "No certified history found for axiomatic anchoring. May result in overly permissive verification." });
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

    GAXTelemetry.publish(TelemetryEvents.START, {
        verificationId,
        deltaKeys: Object.keys(proposedPolicyUpdate || {})
    });

    let currentConfig;
    let result;

    try {
        // Input validation safety check
        if (!proposedPolicyUpdate || Object.keys(proposedPolicyUpdate).length === 0) {
            const err = new Error("Policy update delta is empty or missing.");
            err.name = 'INPUT_FAILURE';
            throw err;
        }

        // Step 1: Configuration Load
        currentConfig = await GAX_PolicyConfig.loadCurrent();
        if (!currentConfig) {
            const err = new Error("Policy Configuration missing or inaccessible.");
            err.name = 'CONFIG_LOAD_FAILURE';
            throw err;
        }
        
        // Step 2: Schema Validation
        try {
             PolicySchemaValidator.validatePolicyUpdate(proposedPolicyUpdate);
        } catch (validationError) {
            // Wrap external validation error into a categorized error object
            const err = new Error(validationError.message);
            err.name = 'SCHEMA_VIOLATION';
            throw err; 
        }
       
        // Step 3: Contextual History Retrieval
        const historicalConstraints = await _fetchHistoricalContext(
            proposedPolicyUpdate,
            currentConfig,
            verificationId
        );
        
        // Step 4: Formal Verification Engine Execution
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
                report: `Axiomatic consistency proven against ${historicalConstraints.length} anchors.`
            });
            GAXTelemetry.success(TelemetryEvents.SUCCESS, { verificationId, constraintsChecked: historicalConstraints.length, durationMs: result.durationMs });
        } else {
            result = _buildResult(verificationId, timestampStart, {
                isVerified: false,
                category: 'FAILURE_AXIOMATIC',
                report: simulationResult.failureReason || "Axiomatic consistency violation detected.",
                constraints: simulationResult.violatingAxioms
            });
            GAXTelemetry.failure(TelemetryEvents.FAILURE_AXIOMATIC, { verificationId, violations: simulationResult.violatingAxioms ? simulationResult.violatingAxioms.length : 0 });
        }

    } catch (error) {
        // Step 6: Robust Failure Categorization using error.name
        const errorMessage = error.message || "Unknown PVF internal error.";
        const errorName = error.name || 'RUNTIME_ERROR';

        let category = 'FAILURE_INTERNAL';
        let logEvent = TelemetryEvents.FAILURE_INTERNAL;
        let logFunction = GAXTelemetry.fatal;

        if (errorName === 'SCHEMA_VIOLATION') {
            category = 'FAILURE_SCHEMA';
            logEvent = TelemetryEvents.FAILURE_SCHEMA;
            logFunction = GAXTelemetry.warn; // Schema violation is recoverable, not necessarily fatal
        } else if (errorName === 'INPUT_FAILURE' || errorName === 'CONFIG_LOAD_FAILURE') {
            category = 'FAILURE_INTERNAL';
            logFunction = GAXTelemetry.error; 
        }
        
        logFunction(logEvent, { verificationId, category, error: errorMessage });

        // Truncate message for concise external reporting
        const truncatedReport = errorMessage.substring(0, 150) + (errorMessage.length > 150 ? '...' : '');

        result = _buildResult(verificationId, timestampStart, {
            isVerified: false,
            category: category,
            report: `Execution failed (${errorName}): ${truncatedReport}`,
            constraints: [errorName, errorMessage.substring(0, 50)]
        });
    }

    return result;
}

module.exports = { executeFormalVerification };