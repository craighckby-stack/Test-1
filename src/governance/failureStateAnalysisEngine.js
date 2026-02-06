/**
 * F-01: Failure State Analysis Engine (FSAE)
 * 
 * Purpose: Processes P-01 (Trust Calculus) failures and M-02 (R-INDEX) rejections
 * to generate specific, measurable, and machine-readable refinement mandates. 
 * Prevents inefficient cycling of low-integrity proposals by strictly adhering
 * to defined governance action types.
 */

const {
    FAILURE_STAGES,
    MANDATE_ACTION_TYPES,
    GOV_TARGETS
} = require('./governanceConstants'); // G-C01 Integration

class FailureStateAnalysisEngine {
    constructor(policyEngine, metricsSystem) {
        this.C15 = policyEngine; // Policy Engine (Governance rules access)
        this.ATM = metricsSystem; // Telemetry and Metrics System (Trust weightings/diagnostics)
        this.RemediationMap = this.C15.getFailureRemediationMap();
        
        // Cache targets locally for quick access
        this.defaultTarget = GOV_TARGETS.DEFAULT_R_INDEX_TARGET;
        this.vetoTarget = GOV_TARGETS.VETO_RETRY_TARGET;
    }

    /**
     * Helper to create structured, validated mandate actions.
     */
    _createMandateAction(type, data = {}) {
        if (!Object.values(MANDATE_ACTION_TYPES).includes(type)) {
            // Failsafe: Log error and assign unknown type if input is malicious or outdated
            this.ATM.logWarning('FSAE_INVALID_ACTION_TYPE', { attemptedType: type });
            type = MANDATE_ACTION_TYPES.UNKNOWN_ACTION;
        }
        return { type, ...data };
    }

    analyze(failureReport) {
        const { stage, reason, payloadHash } = failureReport;

        let mandate = {
            targetProposal: payloadHash,
            requiredActions: [], 
            refinementMandates: [], 
            newRIndexTarget: this.defaultTarget
        };

        switch (stage) {
            case FAILURE_STAGES.P01_TRUST_CALCULUS:
                this._analyzeTrustCalculusFailure(reason, mandate);
                break;
            case FAILURE_STAGES.M02_R_INDEX_READINESS:
                this._analyzeRIndexFailure(reason, mandate);
                break;
            default:
                mandate.refinementMandates.push('UNCATEGORIZED FAILURE: Input stage unknown. Manual review required.');
        }

        this.logMandate(mandate);
        return mandate;
    }

    /**
     * Handles failures stemming from insufficient Trust Calculus (P-01) scores.
     */
    _analyzeTrustCalculusFailure(reason, mandate) {
        const { vetoState, vetoSource, requiredConfidence, actualScore, trustWeightings } = reason;

        // 1. Veto Handling (BLOCKING CRITICALITY)
        if (vetoState === true) {
            mandate.refinementMandates.push(`POLICY VIOLATION: Vetoed by source '${vetoSource}'. Resolve C-15 policy conflict.`);
            
            mandate.requiredActions.push(this._createMandateAction(
                MANDATE_ACTION_TYPES.POLICY_RESOLUTION,
                { source: vetoSource, criticality: 'BLOCKING' }
            ));
            mandate.newRIndexTarget = this.vetoTarget;
            return;
        } 
        
        // 2. Trust Deficit Analysis
        const scoreGap = requiredConfidence - actualScore;
        
        if (scoreGap > 0) {
            const analysis = this.ATM.diagnoseScoreDeficiency(trustWeightings);
            const component = analysis.majorDeficiencyComponent;

            if (component) {
                // Calculate required test boost based on gap severity and component sensitivity
                const sensitivity = analysis.sensitivityMultiplier || 1.2;
                // Ensure a reasonable minimum required delta (e.g., 10%) 
                const requiredIncrease = Math.max(10, Math.ceil(scoreGap * 100 * sensitivity));
                
                mandate.refinementMandates.push(`TRUST DEFICIT (${scoreGap.toFixed(4)}): Primary source: '${component}'. Targeted integrity boost required (+${requiredIncrease}% coverage focus).`);
                
                mandate.requiredActions.push(this._createMandateAction(
                    MANDATE_ACTION_TYPES.INCREASE_COVERAGE,
                    { component, requiredCoverageDelta: requiredIncrease }
                ));
            } else {
                 mandate.refinementMandates.push(`LOW TRUST SCORE: Generalized deficiency detected. Increase overall unit test coverage by 15%.`);
                 mandate.requiredActions.push(this._createMandateAction(
                     MANDATE_ACTION_TYPES.INCREASE_COVERAGE,
                     { component: 'GLOBAL', requiredCoverageDelta: 15 }
                 ));
            }

            // Set R-Index Target higher than required confidence based on gap penalty
            mandate.newRIndexTarget = Math.min(1.0, requiredConfidence + scoreGap * 0.15);
        }
    }

    /**
     * Handles failures stemming from low Readiness Index (M-02) checks.
     */
    _analyzeRIndexFailure(reason, mandate) {
        const { failedComponents } = reason;

        if (failedComponents && failedComponents.length > 0) {
            const componentList = failedComponents.join(', ');
            
            mandate.refinementMandates.push(`LOW READINESS INDEX: Failed invariant checks in M-02 for components: [${componentList}]. Focus on component stability validation.`);
            
            mandate.requiredActions.push(this._createMandateAction(
                MANDATE_ACTION_TYPES.STABILITY_FOCUS,
                { components: failedComponents, depth: 'INTERFACE_INTEGRITY' }
            ));
            
            mandate.newRIndexTarget = this.defaultTarget + 0.10; // Boost R-Index target slightly to force robust solution
        } else {
             mandate.refinementMandates.push(`R-INDEX FAILURE: General component stability failure detected. Review low-level dependency graph.`);
             mandate.requiredActions.push(this._createMandateAction(
                 MANDATE_ACTION_TYPES.RESOURCE_AUDIT, 
                 { scope: 'DEPENDENCIES', reason: 'Unspecified M-02 Invariant Failure' }
             ));
        }
    }

    logMandate(mandate) {
        // D-01 Audit Logger integration utilizing ATM
        this.ATM.logEvent('FSAE_MANDATE_ISSUED', {
            target: mandate.targetProposal,
            actionsCount: mandate.requiredActions.length,
            newTarget: mandate.newRIndexTarget
        });
    }
}

module.exports = FailureStateAnalysisEngine;