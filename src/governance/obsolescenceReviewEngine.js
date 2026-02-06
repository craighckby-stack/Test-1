/**
 * Component Obsolescence Review Engine (CORE) - src/governance/obsolescenceReviewEngine.js
 * ID: CORE v94.1
 * Role: Integrity Maintenance / Governance
 *
 * CORE is responsible for initiating and governing the deprecation, retirement, and archival
 * of components deemed redundant, obsolete, or inefficient. Retirement actions are treated
 * as critical mutations and must pass a modified P-01 Trust Calculus focusing on dependency
 * breakage analysis and long-term complexity reduction metrics.
 */

import { policyEngine } from '../core/policyEngine.js';
import { auditLogger } from '../core/decisionAuditLogger.js';
// Import specialized service for complex metric calculation, decoupling it from the ATM system dependency for granular metrics.
import { retirementMetricsService } from './retirementMetricsService.js';

// --- Constants and Configuration ---
const POLICY_ID_DEPRECATION = 'C-15';
const RETIREMENT_ACTION_TYPE = 'RETIREMENT';
const GOVERNANCE_THRESHOLD_KEY = 'obs_risk_tolerance';

export const CORE = {
    metrics: {},

    init() {
        // Extended initialization: Load governance threshold from Policy Engine defaults or persistent config.
        this.retirementThreshold = policyEngine.getSystemConfiguration(GOVERNANCE_THRESHOLD_KEY) || 0.85; 
        console.log(`[CORE] Initializing Component Obsolescence Review Engine. Required Threshold: ${this.retirementThreshold}`);
    },

    /**
     * Triggers a review of a component based on gathered operational and redundancy metrics.
     * @param {string} componentId - ID of the component under review.
     * @returns {Promise<object>} P-01 outcome result (Trust Calculus Report).
     */
    async reviewComponentForRetirement(componentId) {
        if (!componentId) {
            auditLogger.logError('CORE_REVIEW_INPUT_FAIL', { message: 'Component ID required.' });
            return { pass: false, reason: 'Invalid input.' };
        }

        // 1. Initial Policy Check (synchronous pre-flight)
        if (!policyEngine.checkPolicy(componentId, POLICY_ID_DEPRECATION)) {
            const reason = `Policy constraint violation (${POLICY_ID_DEPRECATION}). Deprecation not permitted.`;
            auditLogger.logDecision('CORE_RETIREMENT_PREFLIGHT_FAIL', { componentId, reason });
            return { pass: false, reason };
        }

        // 2. Calculate Complex Metrics
        const metricData = await retirementMetricsService.getComponentMetrics(componentId);
        
        // 3. Calculate Trust Calculus Score (P-01 modified)
        // This score integrates redundancy, dependency risk, and historical performance.
        const retirementScore = this._calculateTrustCalculusScore(componentId, metricData);
        
        const requiredThreshold = this.retirementThreshold;
        const globalVeto = policyEngine.getGlobalVetoSignal();

        // 4. Adjudication
        const decision = (retirementScore >= requiredThreshold) && (!globalVeto);
        
        const report = {
            pass: decision,
            componentId: componentId,
            score: retirementScore,
            requiredThreshold: requiredThreshold,
            metricsUsed: metricData, // Includes details on redundancy/dependency
            veto: globalVeto,
            action: RETIREMENT_ACTION_TYPE
        };

        if (decision) {
            auditLogger.logDecision('CORE_RETIREMENT_PASS', report);
            // Do not block the review thread waiting for the execution. Execute asynchronously.
            this.executeRetirementProcedure(componentId, report);
        } else {
            auditLogger.logDecision('CORE_RETIREMENT_FAIL', report);
        }

        return report;
    },

    /**
     * Calculates the P-01 weighted score for safe retirement.
     * This internal method leverages detailed metrics provided by the metrics service.
     * @param {string} componentId
     * @param {object} metricData - Output from retirementMetricsService.
     * @returns {number}
     */
    _calculateTrustCalculusScore(componentId, metricData) {
        // In v94.1, the score calculation prioritizes dependency safety over redundancy volume.
        // Score = (Redundancy_Factor * 0.4) + (Complexity_Reduction_Factor * 0.3) + (Dependency_Risk_Factor * 0.3)
        
        const redundancyFactor = metricData.redundancyScore || 0; // 0.0 to 1.0
        const complexityReduction = metricData.complexityReductionEstimate || 0;
        const dependencyRisk = 1.0 - metricData.criticalDependencyExposure; // Higher is safer to remove
        
        let score = (redundancyFactor * 0.4) + (complexityReduction * 0.3) + (dependencyRisk * 0.3);

        // Ensure score is clamped between 0 and 1.
        return Math.min(1.0, Math.max(0.0, score));
    },
    
    async executeRetirementProcedure(componentId, report) {
        console.log(`[CORE] Initiating governed retirement staging for: ${componentId}`);
        // CRITICAL PATH: Ensure execution logging is comprehensive.
        auditLogger.logExecution('CORE_RETIREMENT_START', { componentId, details: report });
        
        // In a real system, this triggers A-01 (Actuator System) staging and commitment via C-04 (Consensus).
        // Implementation omitted, but execution is now decoupled and tracked via report object.
        // await actuator.stageRetirement(componentId, report);
    }
};
