/**
 * Component Obsolescence Review Engine (CORE) - src/governance/obsolescenceReviewEngine.js
 * ID: CORE v94.3 (Intelligent Refactor)
 * Role: Integrity Maintenance / Governance
 *
 * CORE initiates and governs component lifecycle actions (deprecation/retirement).
 * It leverages the specialized Trust Calculus Engine (TCE) for high-stakes decision
 * scoring based on dependency stability and long-term complexity reduction metrics.
 * Decoupled execution trigger via ComponentLifecycleActuator (CLA).
 */

import { policyEngine } from '../core/policyEngine.js';
import { auditLogger } from '../core/decisionAuditLogger.js';
import { retirementMetricsService } from './retirementMetricsService.js';
import { trustCalculusEngine } from './trustCalculusEngine.js';
import { lifecycleActuator } from './componentLifecycleActuator.js'; // Proposed dependency

// --- Constants ---
const POLICY_ID_DEPRECATION = 'C-15';
const RETIREMENT_ACTION_TYPE = 'RETIREMENT';
const GOVERNANCE_THRESHOLD_KEY = 'obs_risk_tolerance';

export class ObsolescenceReviewEngine {
    constructor() {
        /** @type {number} Default required trust score (0.0 to 1.0) to authorize retirement. */
        this.retirementThreshold = 0.85; 
        this.metrics = {};
        // Dependencies remain bound implicitly via imports for singleton pattern consistency
    }

    /**
     * Initializes the engine, loading governance configurations.
     */
    init() {
        // Fetch threshold, defaulting to instance value if not configured.
        const configuredThreshold = policyEngine.getSystemConfiguration(GOVERNANCE_THRESHOLD_KEY);
        if (configuredThreshold !== undefined && configuredThreshold !== null) {
            this.retirementThreshold = configuredThreshold;
        }
        
        // Initialize the TCE, setting context for the specific calculus model used here.
        trustCalculusEngine.init('RETIREMENT_CALCULUS');
        
        auditLogger.logSystemInfo('CORE_INIT', { 
            version: 'v94.3', 
            requiredThreshold: this.retirementThreshold 
        });
    }

    /**
     * Executes the synchronous pre-flight check based on immediate policy constraints.
     * @param {string} componentId
     * @returns {{pass: boolean, reason?: string}}
     */
    _runPreflightCheck(componentId) {
        if (!componentId) {
            const reason = 'Component ID required for review.';
            auditLogger.logError('CORE_REVIEW_INPUT_FAIL', { message: reason });
            return { pass: false, reason };
        }

        if (!policyEngine.checkPolicy(componentId, POLICY_ID_DEPRECATION)) {
            const reason = `Policy constraint violation (${POLICY_ID_DEPRECATION}). Deprecation not permitted.`;
            auditLogger.logDecision('CORE_RETIREMENT_PREFLIGHT_FAIL', { componentId, reason });
            return { pass: false, reason };
        }
        return { pass: true };
    }

    /**
     * Calculates the Trust Calculus Score using the external engine.
     * @param {string} componentId
     * @param {object} metricData
     * @returns {Promise<number>}
     */
    async _calculateRetirementScore(componentId, metricData) {
        // Delegate complex calculation to the specialized engine
        return trustCalculusEngine.calculateScore('RETIREMENT_CALCULUS', metricData);
    }

    /**
     * Internal governance function to adjudicate the decision based on score and constraints.
     * Abstracted to improve readability of the main review flow.
     * @param {string} componentId
     * @param {number} retirementScore
     * @param {object} metricData
     * @returns {object} The full decision report.
     */
    _adjudicateDecision(componentId, retirementScore, metricData) {
        const requiredThreshold = this.retirementThreshold;
        const globalVeto = policyEngine.getGlobalVetoSignal(); // High-level, immediate veto check

        const decision = (retirementScore >= requiredThreshold) && (!globalVeto);
        
        const report = {
            pass: decision,
            componentId: componentId,
            score: retirementScore,
            requiredThreshold: requiredThreshold,
            metricsUsed: metricData,
            vetoActive: globalVeto,
            action: RETIREMENT_ACTION_TYPE
        };

        if (decision) {
            auditLogger.logDecision('CORE_RETIREMENT_PASS', report);
        } else {
            // Detailed logging of failure cause
            let reason = globalVeto 
                ? 'Policy mandated global veto active.' 
                : `Trust score (${retirementScore.toFixed(4)}) is below required threshold (${requiredThreshold.toFixed(4)}).`;
            auditLogger.logDecision('CORE_RETIREMENT_FAIL', { ...report, reason });
        }

        return report;
    }

    /**
     * Triggers a comprehensive review of a component.
     * @param {string} componentId - ID of the component under review.
     * @returns {Promise<object>} The final decision report.
     */
    async reviewComponentForRetirement(componentId) {
        // 1. Synchronous Pre-flight Check
        const preflight = this._runPreflightCheck(componentId);
        if (!preflight.pass) {
            return preflight;
        }

        // 2. Data Acquisition (Async)
        const metricData = await retirementMetricsService.getComponentMetrics(componentId);
        
        // 3. Score Calculation (Async, delegated)
        const retirementScore = await this._calculateRetirementScore(componentId, metricData);
        
        // 4. Adjudication & Governance Veto (Sync)
        const report = this._adjudicateDecision(componentId, retirementScore, metricData);
        
        // 5. Execution Trigger
        if (report.pass) {
            this.executeRetirementProcedure(componentId, report); // Non-blocking trigger
        }

        return report;
    }
    
    /**
     * Delegates the non-reversible action to the Actuator.
     */
    async executeRetirementProcedure(componentId, report) {
        auditLogger.logExecution('CORE_ACTUATION_TRIGGER', { componentId, score: report.score, target: 'CLA' });
        // Delegate to the specialized actuator for execution and state mutation.
        lifecycleActuator.retireComponent(componentId, report);
    }
}

// Export a singleton instance consistent with v94 pattern initialization.
export const CORE = new ObsolescenceReviewEngine();
